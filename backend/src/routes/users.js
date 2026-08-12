const express = require('express');
const multer = require('multer');
const pool = require('../db/connection');
const { calculateTotalPoints } = require('../services/scoringService');
const { authenticate } = require('../middleware/auth');
const { avatarUrl, sessieMediaUrl, stuurBestand } = require('../utils/bestandsUrls');

const router = express.Router();

// Wanneer is de profielfoto voor het laatst gewijzigd? Dat getal hangt in de
// avatar-URL, zodat een nieuwe foto meteen zichtbaar is in plaats van pas
// nadat de cache van de browser verlopen is. Bestaande foto's krijgen eenmalig
// een startwaarde, anders zouden ze als 'geen foto' gelden.
pool.query(`
  ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_updated_at TIMESTAMP;
  UPDATE users SET avatar_updated_at = NOW()
   WHERE avatar_url IS NOT NULL AND avatar_updated_at IS NULL;
`).catch(console.error);

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.mimetype)) cb(null, true);
    else cb(new Error('Alleen JPEG/PNG/WebP toegestaan'));
  }
});

// GET /api/users  – search users (for tagging)
router.get('/', authenticate, async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json([]);
  try {
    const result = await pool.query(
      `SELECT id, name, fleet, avatar_updated_at AS avatar_v FROM users WHERE name ILIKE $1 AND id != $2 LIMIT 10`,
      [`%${q}%`, req.user.id]
    );
    res.json(result.rows.map(({ avatar_v, ...u }) => ({ ...u, avatar_url: avatarUrl(req, u.id, avatar_v) })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfout' });
  }
});

// GET /api/users/:id/avatar — publiek, want een <img> stuurt geen token mee
router.get('/:id/avatar', async (req, res) => {
  try {
    const r = await pool.query('SELECT avatar_url FROM users WHERE id = $1', [req.params.id]);
    return stuurBestand(res, r.rows[0]?.avatar_url);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfout' });
  }
});

// GET /api/users/:id/stats
router.get('/:id/stats', async (req, res) => {
  const { id } = req.params;
  try {
    const userResult = await pool.query(
      'SELECT id, name, email, fleet, avatar_updated_at AS avatar_v FROM users WHERE id = $1',
      [id]
    );
    if (userResult.rows.length === 0) return res.status(404).json({ error: 'Gebruiker niet gevonden' });

    const user = userResult.rows[0];

    const sessionsResult = await pool.query(
      `SELECT s.id, s.date, s.height_m, s.airtime_s, s.distance_m, s.points,
              s.verified, s.caption, s.media_type,
              (s.media_url IS NOT NULL) AS has_media,
              array_agg(u.name) FILTER (WHERE u.name IS NOT NULL) AS tagged_names
       FROM sessions s
       LEFT JOIN session_tags st ON st.session_id = s.id
       LEFT JOIN users u ON u.id = st.tagged_user_id
       WHERE s.user_id = $1
       GROUP BY s.id
       ORDER BY s.date DESC`,
      [id]
    );
    const sessions = sessionsResult.rows;
    const verified = sessions.filter(s => s.verified);

    const total_points = calculateTotalPoints(sessions);
    const max_height = verified.length ? Math.max(...verified.map(s => parseFloat(s.height_m))) : 0;
    const avg_height = verified.length
      ? Math.round((verified.reduce((sum, s) => sum + parseFloat(s.height_m), 0) / verified.length) * 10) / 10
      : 0;
    const max_airtime = verified.length ? Math.max(...verified.map(s => parseFloat(s.airtime_s))) : 0;
    const max_distance = verified.length ? Math.max(...verified.map(s => parseFloat(s.distance_m))) : 0;

    // Standen. Dit deed eerder twee queries per gebruiker; met dertig
    // deelnemers waren dat zestig queries om één profiel te tonen.
    const [alleGebruikers, alleSessies] = await Promise.all([
      pool.query('SELECT id, name, fleet FROM users'),
      pool.query('SELECT user_id, points, verified FROM sessions'),
    ]);

    const sessiesPer = new Map(alleGebruikers.rows.map(u => [u.id, []]));
    for (const s of alleSessies.rows) sessiesPer.get(s.user_id)?.push(s);

    const stand = alleGebruikers.rows
      .map(u => ({
        id: u.id,
        naam: u.name,
        fleet: u.fleet,
        punten: calculateTotalPoints(sessiesPer.get(u.id) || []),
      }))
      .sort((a, b) => b.punten - a.punten);

    const mijnPlek = stand.findIndex(x => x.id === id);
    const rank_overall = mijnPlek + 1;

    const inKlasse = stand.filter(x => x.fleet === user.fleet);
    const rank_in_fleet = inKlasse.findIndex(x => x.id === id) + 1;

    // Wie staat er direct boven je, en hoeveel punten kom je tekort?
    const boven = mijnPlek > 0 ? stand[mijnPlek - 1] : null;
    const boven_mij = boven
      ? {
          naam: boven.naam,
          punten: boven.punten,
          verschil: Math.round((boven.punten - total_points) * 100) / 100,
        }
      : null;

    // Wat is de eerstvolgende klasse en welke sprong heb je daarvoor nodig?
    const KLASSEN = [
      { naam: 'Silver', min_hoogte: 5 },
      { naam: 'Gold', min_hoogte: 10 },
      { naam: 'Platinum', min_hoogte: 15 },
    ];
    const volgende_klasse = KLASSEN.find(k => max_height < k.min_hoogte) || null;

    const { avatar_v, ...gebruiker } = user;
    res.json({
      user: { ...gebruiker, avatar_url: avatarUrl(req, user.id, avatar_v) },
      stats: {
        rank_overall, rank_in_fleet, total_points, sessions_count: verified.length,
        max_height, avg_height, max_airtime, max_distance,
        boven_mij, volgende_klasse, rijders_totaal: stand.length,
      },
      // screenshot_url zat hier ook in maar wordt door geen enkel scherm
      // gebruikt behalve het beheerpaneel — dat scheelde megabytes per profiel.
      recent_sessions: sessions.slice(0, 20).map(s => ({
        id: s.id, date: s.date, height: s.height_m, airtime: s.airtime_s,
        distance: s.distance_m, points: s.points, verified: s.verified,
        media_url: sessieMediaUrl(req, s.id, s.has_media), media_type: s.media_type,
        caption: s.caption, tagged_names: s.tagged_names || []
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfout' });
  }
});

// POST /api/users/avatar
router.post('/avatar', authenticate, avatarUpload.single('avatar'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Geen bestand geüpload' });
  const data = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
  try {
    // avatar_updated_at meteen bijwerken: dat getal zit in de URL, dus daarmee
    // ziet de browser dat dit een andere foto is dan die hij in zijn cache heeft.
    const r = await pool.query(
      'UPDATE users SET avatar_url = $1, avatar_updated_at = NOW() WHERE id = $2 RETURNING avatar_updated_at',
      [data, req.user.id]
    );
    res.json({ avatar_url: avatarUrl(req, req.user.id, r.rows[0].avatar_updated_at) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfout' });
  }
});

module.exports = router;
