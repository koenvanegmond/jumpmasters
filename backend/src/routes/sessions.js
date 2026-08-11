const express = require('express');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const pool = require('../db/connection');
const { authenticate } = require('../middleware/auth');
const { extractSurfrData } = require('../services/ocrService');
const { calculateSessionPoints, determineFleet } = require('../services/scoringService');
const { avatarUrl, sessieMediaUrl, stuurBestand } = require('../utils/bestandsUrls');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB for video
  fileFilter(req, file, cb) {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'video/mp4', 'video/quicktime', 'video/webm'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Alleen JPEG, PNG of video toegestaan'));
  }
});

const screenshotUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (['image/jpeg', 'image/png', 'image/jpg'].includes(file.mimetype)) cb(null, true);
    else cb(new Error('Alleen JPEG/PNG toegestaan'));
  }
});

async function updateUserFleet(userId) {
  const result = await pool.query('SELECT height_m FROM sessions WHERE user_id = $1 AND verified = true', [userId]);
  const fleet = determineFleet(result.rows);
  await pool.query('UPDATE users SET fleet = $1 WHERE id = $2', [fleet, userId]);
}

async function saveTags(sessionId, taggedUserIds, taggerName, taggerId) {
  if (!taggedUserIds || taggedUserIds.length === 0) return;
  for (const uid of taggedUserIds) {
    await pool.query(
      'INSERT INTO session_tags (session_id, tagged_user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [sessionId, uid]
    );
    if (uid !== taggerId) {
      await pool.query(
        `INSERT INTO notifications (user_id, from_user_id, type, session_id, message)
         VALUES ($1, $2, 'tag', $3, $4)
         ON CONFLICT DO NOTHING`,
        [uid, taggerId, sessionId, `${taggerName} heeft jou getagd in een sessie`]
      ).catch(() => {});
    }
  }
}

// Scanbewijs: de uitgelezen waarden, ondertekend met JWT_SECRET. Bij het
// opslaan gebruiken we de waarden uit dit bewijs en niet wat de browser
// meestuurt — anders kan iedereen na een geslaagde scan alsnog zijn eigen
// cijfers naar de server sturen. Het formulier uitschakelen is cosmetisch.
function maakScanbewijs(userId, extracted) {
  return jwt.sign(
    {
      sub: userId,
      h: extracted.height,
      a: extracted.airtime,
      d: extracted.distance,
      dt: extracted.date.toISOString().split('T')[0]
    },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );
}

// POST /api/sessions/upload  – OCR extraction from screenshot
router.post('/upload', authenticate, screenshotUpload.single('screenshot'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Geen bestand geüpload' });
  try {
    const extracted = await extractSurfrData(req.file.buffer);
    const screenshot_url = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    res.json({ extracted, screenshot_url, scan_token: maakScanbewijs(req.user.id, extracted) });
  } catch (err) {
    console.error(err);
    // Storing aan onze kant versus een foto die we niet kunnen lezen — dat
    // vraagt om ander advies, dus het krijgt een andere statuscode.
    if (err.ocrUnavailable) {
      return res.status(503).json({ error: err.message, ocr_unavailable: true });
    }
    res.status(422).json({ error: 'We konden de gegevens niet uit deze foto halen' });
  }
});

// POST /api/sessions/confirm  – save OCR-extracted session with optional media
router.post('/confirm', authenticate, upload.single('media'), async (req, res) => {
  const { screenshot_url, scan_token, caption, tagged_user_ids } = req.body;

  if (!scan_token) {
    return res.status(400).json({ error: 'Scanbewijs ontbreekt — upload je screenshot opnieuw' });
  }

  let scan;
  try {
    scan = jwt.verify(scan_token, process.env.JWT_SECRET);
  } catch {
    return res.status(400).json({ error: 'Scanbewijs is verlopen of ongeldig — upload je screenshot opnieuw' });
  }

  if (scan.sub !== req.user.id) {
    return res.status(403).json({ error: 'Dit scanbewijs hoort bij een ander account' });
  }

  // Bewust uit het bewijs en niet uit de request body: wat de browser stuurt
  // telt hier niet mee.
  const height = scan.h, airtime = scan.a, distance = scan.d, date = scan.dt;

  const points = calculateSessionPoints(parseFloat(height), parseFloat(airtime), parseFloat(distance));
  let media_url = null, media_type = null;

  if (req.file) {
    media_url = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    media_type = req.file.mimetype.startsWith('video') ? 'video' : 'photo';
  }

  try {
    const result = await pool.query(
      `INSERT INTO sessions (user_id, date, height_m, airtime_s, distance_m, points, screenshot_url, media_url, media_type, caption, verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true) RETURNING *`,
      [req.user.id, date, height, airtime, distance, points, screenshot_url || null, media_url, media_type, caption || null]
    );
    const session = result.rows[0];
    const tagIds = tagged_user_ids ? JSON.parse(tagged_user_ids) : [];
    await saveTags(session.id, tagIds, req.user.name, req.user.id);
    await updateUserFleet(req.user.id);
    res.status(201).json({ session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfout' });
  }
});

// POST /api/sessions/manual  – handmatige invoer, zonder screenshot als bewijs.
// Deze sessies komen binnen als niet-geverifieerd en verschijnen in /beheer,
// zodat niemand zomaar een score kan verzinnen.
router.post('/manual', authenticate, upload.single('media'), async (req, res) => {
  const { date, height, airtime, distance, caption, tagged_user_ids } = req.body;

  if (!date || !height || !airtime || !distance) {
    return res.status(400).json({ error: 'datum, hoogte, vliegtijd en afstand zijn verplicht' });
  }

  const points = calculateSessionPoints(parseFloat(height), parseFloat(airtime), parseFloat(distance));
  let media_url = null, media_type = null;

  if (req.file) {
    media_url = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    media_type = req.file.mimetype.startsWith('video') ? 'video' : 'photo';
  }

  try {
    const result = await pool.query(
      `INSERT INTO sessions (user_id, date, height_m, airtime_s, distance_m, points, media_url, media_type, caption, verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false) RETURNING *`,
      [req.user.id, date, height, airtime, distance, points, media_url, media_type, caption || null]
    );
    const session = result.rows[0];
    const tagIds = tagged_user_ids ? JSON.parse(tagged_user_ids) : [];
    await saveTags(session.id, tagIds, req.user.name, req.user.id);
    await updateUserFleet(req.user.id);
    res.status(201).json({ session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfout' });
  }
});

// GET /api/sessions/feed — all verified sessions, newest first (public)
router.get('/feed', async (req, res) => {
  try {
    const result = await pool.query(
      // Alleen of er media is, niet de data zelf: die base64-kolommen uit
      // Postgres trekken kostte seconden, ook nu we ze niet meer doorsturen.
      `SELECT s.id, s.date, s.height_m, s.airtime_s, s.distance_m, s.points,
              (s.media_url IS NOT NULL) AS has_media,
              s.media_type, s.caption, s.created_at,
              u.id as user_id, u.name as user_name,
              (u.avatar_url IS NOT NULL) AS has_avatar, u.fleet,
              array_agg(tu.name) FILTER (WHERE tu.name IS NOT NULL) AS tagged_names
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       LEFT JOIN session_tags st ON st.session_id = s.id
       LEFT JOIN users tu ON tu.id = st.tagged_user_id
       WHERE s.verified = true
       GROUP BY s.id, u.id, u.name, u.avatar_url, u.fleet
       ORDER BY s.created_at DESC
       LIMIT 50`
    );
    res.json(result.rows.map(({ has_media, has_avatar, ...s }) => ({
      ...s,
      avatar_url: avatarUrl(req, s.user_id, has_avatar),
      media_url: sessieMediaUrl(req, s.id, has_media)
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfout' });
  }
});

// GET /api/sessions/:id/media — publiek, want een <img> stuurt geen token mee
router.get('/:id/media', async (req, res) => {
  try {
    const r = await pool.query('SELECT media_url FROM sessions WHERE id = $1', [req.params.id]);
    return stuurBestand(res, r.rows[0]?.media_url);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfout' });
  }
});

// GET /api/sessions/mine
router.get('/mine', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      // s.* haalde ook screenshot_url en media_url op — twee base64-kolommen
      // die geen enkel scherm hier gebruikt.
      `SELECT s.id, s.date, s.height_m, s.airtime_s, s.distance_m, s.points,
              s.verified, s.caption, s.media_type, s.created_at,
              (s.media_url IS NOT NULL) AS has_media,
              array_agg(u.name) FILTER (WHERE u.name IS NOT NULL) AS tagged_names
       FROM sessions s
       LEFT JOIN session_tags st ON st.session_id = s.id
       LEFT JOIN users u ON u.id = st.tagged_user_id
       WHERE s.user_id = $1
       GROUP BY s.id
       ORDER BY s.date DESC`,
      [req.user.id]
    );
    res.json(result.rows.map(({ has_media, ...s }) => ({
      ...s,
      media_url: sessieMediaUrl(req, s.id, has_media)
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfout' });
  }
});

module.exports = router;
