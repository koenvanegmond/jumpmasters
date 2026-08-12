const express = require('express');
const pool = require('../db/connection');
const { authenticate } = require('../middleware/auth');
const { avatarUrl } = require('../utils/bestandsUrls');

const router = express.Router();

// De datum van vandaag in Nederlandse tijd. new Date().toISOString() geeft de
// UTC-datum, waardoor de server tussen middernacht en 02:00 nog op gisteren
// staat terwijl het hier al de volgende dag is — dan schrijf je je status weg
// op de verkeerde dag en zie je 's ochtends de verkeerde lijst.
function vandaagNL() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam' }).format(new Date());
}

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
  const today = vandaagNL();
  try {
    const result = await pool.query(
      `SELECT g.status, u.id as user_id, u.name, u.avatar_updated_at AS avatar_v, u.fleet
       FROM going g JOIN users u ON u.id = g.user_id
       WHERE g.date = $1
       ORDER BY g.status, u.name`,
      [today]
    );
    res.json(result.rows.map(r => ({ ...r, avatar_url: avatarUrl(req, r.user_id, r.avatar_v) })));
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
  const today = vandaagNL();
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
  const today = vandaagNL();
  try {
    await pool.query('DELETE FROM going WHERE user_id = $1 AND date = $2', [req.user.id, today]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfout' });
  }
});

module.exports = router;
