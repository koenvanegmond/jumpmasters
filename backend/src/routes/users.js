const express = require('express');
const multer = require('multer');
const pool = require('../db/connection');
const { calculateTotalPoints } = require('../services/scoringService');
const { authenticate } = require('../middleware/auth');
const { avatarUrl, sessieMediaUrl, stuurBestand } = require('../utils/bestandsUrls');

const router = express.Router();

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
      `SELECT id, name, fleet, (avatar_url IS NOT NULL) AS has_avatar FROM users WHERE name ILIKE $1 AND id != $2 LIMIT 10`,
      [`%${q}%`, req.user.id]
    );
    res.json(result.rows.map(({ has_avatar, ...u }) => ({ ...u, avatar_url: avatarUrl(req, u.id, has_avatar) })));
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
      'SELECT id, name, email, fleet, (avatar_url IS NOT NULL) AS has_avatar FROM users WHERE id = $1',
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

    // Ranks
    const allUsersResult = await pool.query('SELECT id FROM users');
    let rank_overall = 1, rank_in_fleet = 1;
    await Promise.all(allUsersResult.rows.map(async (u) => {
      if (u.id === id) return;
      const uSessions = await pool.query('SELECT points, verified FROM sessions WHERE user_id = $1', [u.id]);
      const uPoints = calculateTotalPoints(uSessions.rows);
      if (uPoints > total_points) rank_overall++;
      const uUser = await pool.query('SELECT fleet FROM users WHERE id = $1', [u.id]);
      if (uUser.rows[0].fleet === user.fleet && uPoints > total_points) rank_in_fleet++;
    }));

    const { has_avatar, ...gebruiker } = user;
    res.json({
      user: { ...gebruiker, avatar_url: avatarUrl(req, user.id, has_avatar) },
      stats: { rank_overall, rank_in_fleet, total_points, sessions_count: verified.length, max_height, avg_height, max_airtime, max_distance },
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
  const avatar_url = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
  try {
    await pool.query('UPDATE users SET avatar_url = $1 WHERE id = $2', [avatar_url, req.user.id]);
    res.json({ avatar_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfout' });
  }
});

module.exports = router;
