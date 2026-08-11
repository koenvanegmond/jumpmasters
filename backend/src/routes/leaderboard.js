const express = require('express');
const pool = require('../db/connection');
const { calculateTotalPoints } = require('../services/scoringService');
const { avatarUrl } = require('../utils/bestandsUrls');

const router = express.Router();

// Twee queries in totaal, ongeacht hoeveel deelnemers er zijn. Hiervoor werd
// per gebruiker een aparte sessie-query gedaan; met dertig deelnemers waren
// dat eenendertig queries per keer dat iemand de ranglijst opende.
async function buildLeaderboard(req, whereClause, params) {
  // Alleen of er een avatar is, niet de base64 zelf — zie bestandsUrls.js.
  const usersResult = await pool.query(
    `SELECT id, name, fleet, (avatar_url IS NOT NULL) AS has_avatar FROM users ${whereClause}`,
    params
  );
  if (usersResult.rows.length === 0) return [];

  const ids = usersResult.rows.map(u => u.id);
  const sessionsResult = await pool.query(
    `SELECT user_id, points, height_m, airtime_s, distance_m, verified
     FROM sessions WHERE user_id = ANY($1::uuid[])`,
    [ids]
  );

  const perGebruiker = new Map(ids.map(id => [id, []]));
  for (const s of sessionsResult.rows) perGebruiker.get(s.user_id)?.push(s);

  return usersResult.rows
    .map((user) => {
      const sessions = perGebruiker.get(user.id) || [];
      const verified = sessions.filter(s => s.verified);

      return {
        user_id: user.id,
        name: user.name,
        fleet: user.fleet,
        avatar_url: avatarUrl(req, user.id, user.has_avatar),
        total_points: calculateTotalPoints(sessions),
        sessions_count: verified.length,
        max_height:   verified.length ? Math.max(...verified.map(s => parseFloat(s.height_m)))   : 0,
        max_airtime:  verified.length ? Math.max(...verified.map(s => parseFloat(s.airtime_s)))  : 0,
        max_distance: verified.length ? Math.max(...verified.map(s => parseFloat(s.distance_m))) : 0
      };
    })
    .sort((a, b) => b.total_points - a.total_points)
    .map((entry, index) => ({ rank: index + 1, ...entry }));
}

// GET /api/leaderboard/overall
router.get('/overall', async (req, res) => {
  try {
    const data = await buildLeaderboard(req, '', []);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/leaderboard/daily — alleen de sessies van vandaag
// Puntentelling volgt exact dezelfde regel als het seizoensklassement: je
// beste vijf sessies tellen mee, de rest niet. Daarom draait dit door
// calculateTotalPoints heen en niet door een SUM in SQL — zo kan de regel
// niet uiteenlopen tussen de twee klassementen.
router.get('/daily', async (req, res) => {
  try {
    // Datum bepalen in Nederlandse tijd — de server draait op UTC, waardoor
    // 's avonds laat anders de verkeerde dag gepakt zou worden.
    const result = await pool.query(
      `SELECT s.points, s.height_m, s.airtime_s, s.distance_m, s.verified,
              u.id AS user_id, u.name, u.fleet,
              (u.avatar_url IS NOT NULL) AS has_avatar
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.verified = true
         AND s.date = (NOW() AT TIME ZONE 'Europe/Amsterdam')::date`
    );

    const perRijder = new Map();
    for (const row of result.rows) {
      if (!perRijder.has(row.user_id)) {
        perRijder.set(row.user_id, {
          user_id: row.user_id, name: row.name,
          fleet: row.fleet, has_avatar: row.has_avatar, sessions: []
        });
      }
      perRijder.get(row.user_id).sessions.push(row);
    }

    const data = [...perRijder.values()]
      .map((r) => ({
        user_id: r.user_id,
        name: r.name,
        fleet: r.fleet,
        avatar_url: avatarUrl(req, r.user_id, r.has_avatar),
        // Beste vijf van vandaag — zelfde functie als het seizoensklassement.
        total_points: calculateTotalPoints(r.sessions),
        // Aantal en records gaan wél over alle sessies van vandaag: je beste
        // sprong blijft je beste sprong, ook als hij niet meetelt voor punten.
        sessions_count: r.sessions.length,
        max_height:   Math.max(...r.sessions.map(s => parseFloat(s.height_m))),
        max_airtime:  Math.max(...r.sessions.map(s => parseFloat(s.airtime_s))),
        max_distance: Math.max(...r.sessions.map(s => parseFloat(s.distance_m)))
      }))
      .sort((a, b) => b.total_points - a.total_points)
      .map((entry, index) => ({ rank: index + 1, ...entry }));

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
    const data = await buildLeaderboard(req, 'WHERE fleet = $1', [fleetName]);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
