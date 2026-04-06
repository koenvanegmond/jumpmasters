const express = require('express');
const pool = require('../db/connection');
const { calculateTotalPoints } = require('../services/scoringService');

const router = express.Router();

async function buildLeaderboard(whereClause, params) {
  // Get all users (optionally filtered by fleet)
  const usersResult = await pool.query(
    `SELECT id, name, fleet, avatar_url FROM users ${whereClause}`,
    params
  );

  const leaderboard = await Promise.all(usersResult.rows.map(async (user) => {
    const sessionsResult = await pool.query(
      'SELECT points, height_m, airtime_s, distance_m, verified FROM sessions WHERE user_id = $1',
      [user.id]
    );
    const sessions = sessionsResult.rows;
    const verified = sessions.filter(s => s.verified);

    const total_points = calculateTotalPoints(sessions);
    const max_height    = verified.length ? Math.max(...verified.map(s => parseFloat(s.height_m)))   : 0;
    const max_airtime   = verified.length ? Math.max(...verified.map(s => parseFloat(s.airtime_s)))  : 0;
    const max_distance  = verified.length ? Math.max(...verified.map(s => parseFloat(s.distance_m))) : 0;

    return {
      user_id: user.id,
      name: user.name,
      fleet: user.fleet,
      avatar_url: user.avatar_url,
      total_points,
      sessions_count: verified.length,
      max_height,
      max_airtime,
      max_distance
    };
  }));

  return leaderboard
    .sort((a, b) => b.total_points - a.total_points)
    .map((entry, index) => ({ rank: index + 1, ...entry }));
}

// GET /api/leaderboard/overall
router.get('/overall', async (req, res) => {
  try {
    const data = await buildLeaderboard('', []);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/leaderboard/fleet/:fleetName
router.get('/fleet/:fleetName', async (req, res) => {
  const { fleetName } = req.params;
  const validFleets = ['Bronze', 'Silver', 'Gold', 'Platinum'];

  if (!validFleets.includes(fleetName)) {
    return res.status(400).json({ error: 'Invalid fleet name' });
  }

  try {
    const data = await buildLeaderboard('WHERE fleet = $1', [fleetName]);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
