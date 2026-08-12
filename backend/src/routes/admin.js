const express = require('express');
const pool = require('../db/connection');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { calculateSessionPoints, determineFleet } = require('../services/scoringService');

const router = express.Router();

router.use(authenticate, requireAdmin);

// GET /api/admin/sessions/pending
router.get('/sessions/pending', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, u.name AS user_name, u.email AS user_email
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.verified = false
       ORDER BY s.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/admin/sessions/:id/verify
router.patch('/sessions/:id/verify', async (req, res) => {
  const { id } = req.params;
  const { verified } = req.body;

  if (typeof verified !== 'boolean') {
    return res.status(400).json({ error: 'verified must be a boolean' });
  }

  try {
    const result = await pool.query(
      'UPDATE sessions SET verified = $1 WHERE id = $2 RETURNING *',
      [verified, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = result.rows[0];

    // Klasse altijd opnieuw bepalen, ook bij afkeuren. Stond hier eerder
    // alleen bij goedkeuren, waardoor iemand in een hogere klasse bleef staan
    // nadat de sprong die hem daar bracht was afgewezen.
    const userSessions = await pool.query(
      'SELECT height_m FROM sessions WHERE user_id = $1 AND verified = true',
      [session.user_id]
    );
    const fleet = determineFleet(userSessions.rows);
    await pool.query('UPDATE users SET fleet = $1 WHERE id = $2', [fleet, session.user_id]);

    res.json({ session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/admin/sessions/:id  – edit session data
router.patch('/sessions/:id', async (req, res) => {
  const { id } = req.params;
  const { height, airtime, distance } = req.body;

  if (!height || !airtime || !distance) {
    return res.status(400).json({ error: 'height, airtime, and distance are required' });
  }

  const points = calculateSessionPoints(parseFloat(height), parseFloat(airtime), parseFloat(distance));

  try {
    const result = await pool.query(
      'UPDATE sessions SET height_m = $1, airtime_s = $2, distance_m = $3, points = $4 WHERE id = $5 RETURNING *',
      [height, airtime, distance, points, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ session: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [usersCount, sessionsCount, pendingCount, todayBest] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(*) FROM sessions WHERE verified = true'),
      pool.query('SELECT COUNT(*) FROM sessions WHERE verified = false'),
      pool.query(
        `SELECT MAX(height_m) AS max_height, u.name
         FROM sessions s JOIN users u ON u.id = s.user_id
         WHERE s.date = (NOW() AT TIME ZONE 'Europe/Amsterdam')::date
           AND s.verified = true
         GROUP BY u.name
         ORDER BY MAX(height_m) DESC
         LIMIT 1`
      )
    ]);

    res.json({
      total_riders: parseInt(usersCount.rows[0].count),
      total_sessions: parseInt(sessionsCount.rows[0].count),
      pending_sessions: parseInt(pendingCount.rows[0].count),
      today_best: todayBest.rows[0] || null
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/users  – list all users
router.get('/users', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, fleet, is_admin, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
