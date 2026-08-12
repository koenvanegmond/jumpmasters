const express = require('express');
const pool = require('../db/connection');
const { authenticate } = require('../middleware/auth');
const { publiekeSleutel, beschikbaar } = require('../services/pushService');

const router = express.Router();

// GET /api/push/sleutel — de publieke helft, die mag iedereen weten.
router.get('/sleutel', (req, res) => {
  if (!beschikbaar) return res.status(503).json({ error: 'Meldingen staan uit op deze server' });
  res.json({ sleutel: publiekeSleutel });
});

// POST /api/push/abonneer — toestel aanmelden voor meldingen
router.post('/abonneer', authenticate, async (req, res) => {
  const { endpoint, keys } = req.body || {};
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return res.status(400).json({ error: 'Onvolledig abonnement' });
  }
  try {
    // Hetzelfde toestel kan opnieuw aanmelden, bijvoorbeeld na het wissen van
    // websitegegevens. Dan hoort het abonnement bij de nieuwe gebruiker.
    await pool.query(
      `INSERT INTO push_abonnementen (user_id, endpoint, p256dh, auth)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (endpoint) DO UPDATE
         SET user_id = EXCLUDED.user_id,
             p256dh = EXCLUDED.p256dh,
             auth = EXCLUDED.auth`,
      [req.user.id, endpoint, keys.p256dh, keys.auth]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfout' });
  }
});

// DELETE /api/push/abonneer — toestel afmelden
router.delete('/abonneer', authenticate, async (req, res) => {
  const { endpoint } = req.body || {};
  try {
    if (endpoint) {
      await pool.query('DELETE FROM push_abonnementen WHERE endpoint = $1', [endpoint]);
    } else {
      await pool.query('DELETE FROM push_abonnementen WHERE user_id = $1', [req.user.id]);
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfout' });
  }
});

// GET /api/push/status — heeft dit account ergens meldingen aanstaan?
router.get('/status', authenticate, async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT COUNT(*)::int AS n FROM push_abonnementen WHERE user_id = $1',
      [req.user.id]
    );
    res.json({ toestellen: r.rows[0].n, beschikbaar });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfout' });
  }
});

module.exports = router;
