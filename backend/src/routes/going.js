const express = require('express');
const pool = require('../db/connection');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Create table if not exists
pool.query(`
  CREATE TABLE IF NOT EXISTS going (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL,
    PRIMARY KEY (user_id, date)
  )
`).catch(console.error);

// GET /api/going/today — who's going today (public)
router.get('/today', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  try {
    const result = await pool.query(
      `SELECT g.status, u.id as user_id, u.name, u.avatar_url, u.fleet
       FROM going g JOIN users u ON u.id = g.user_id
       WHERE g.date = $1
       ORDER BY g.status, u.name`,
      [today]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfout' });
  }
});

// POST /api/going — set your status for today
router.post('/', authenticate, async (req, res) => {
  const { status } = req.body;
  const allowed = ['going', 'maybe', 'not_going'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Ongeldige status' });
  const today = new Date().toISOString().split('T')[0];
  try {
    await pool.query(
      `INSERT INTO going (user_id, date, status) VALUES ($1, $2, $3)
       ON CONFLICT (user_id, date) DO UPDATE SET status = $3`,
      [req.user.id, today, status]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfout' });
  }
});

// DELETE /api/going — remove your status for today
router.delete('/', authenticate, async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  try {
    await pool.query('DELETE FROM going WHERE user_id = $1 AND date = $2', [req.user.id, today]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfout' });
  }
});

module.exports = router;
