const webpush = require('web-push');
const pool = require('../db/connection');

const PUBLIEK = process.env.VAPID_PUBLIC_KEY;
const PRIVE = process.env.VAPID_PRIVATE_KEY;
const CONTACT = process.env.VAPID_CONTACT || 'mailto:info@jump-masters.nl';

const beschikbaar = Boolean(PUBLIEK && PRIVE);
if (beschikbaar) {
  webpush.setVapidDetails(CONTACT, PUBLIEK, PRIVE);
} else {
  console.warn('Geen VAPID-sleutels ingesteld, pushmeldingen staan uit.');
}

pool.query(`
  CREATE TABLE IF NOT EXISTS push_abonnementen (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT UNIQUE NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_push_user ON push_abonnementen(user_id);
`).catch(console.error);

/**
 * Stuurt een melding naar alle toestellen van een gebruiker. Een abonnement
 * dat door de browser is ingetrokken (410 of 404) ruimen we meteen op, anders
 * blijven we eeuwig naar een dood adres sturen.
 */
async function stuurNaar(userIds, melding) {
  if (!beschikbaar) return 0;
  const ids = (Array.isArray(userIds) ? userIds : [userIds]).filter(Boolean);
  if (ids.length === 0) return 0;

  const { rows } = await pool.query(
    'SELECT id, endpoint, p256dh, auth FROM push_abonnementen WHERE user_id = ANY($1::uuid[])',
    [ids]
  );
  if (rows.length === 0) return 0;

  const lading = JSON.stringify(melding);
  let verstuurd = 0;

  await Promise.all(rows.map(async (rij) => {
    try {
      await webpush.sendNotification(
        { endpoint: rij.endpoint, keys: { p256dh: rij.p256dh, auth: rij.auth } },
        lading
      );
      verstuurd++;
    } catch (err) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        await pool.query('DELETE FROM push_abonnementen WHERE id = $1', [rij.id]).catch(() => {});
      } else {
        console.error('Push mislukt:', err.statusCode, err.body || err.message);
      }
    }
  }));

  return verstuurd;
}

// Iedereen behalve de persoon die de actie zelf deed.
async function stuurNaarIedereenBehalve(userId, melding) {
  const { rows } = await pool.query('SELECT id FROM users WHERE id <> $1', [userId]);
  return stuurNaar(rows.map(r => r.id), melding);
}

module.exports = { stuurNaar, stuurNaarIedereenBehalve, publiekeSleutel: PUBLIEK, beschikbaar };
