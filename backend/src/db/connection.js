const { Pool, types } = require('pg');

// Een DATE-kolom is een kale dag, geen moment in de tijd. Standaard maakt pg
// er een JS Date van op middernacht lokale tijd, en zodra die door JSON gaat
// wordt het "de dag ervoor om 22:00". Dat heeft vandaag al drie keer voor
// verwarring gezorgd. We geven DATE (type 1082) daarom terug zoals Postgres
// hem opslaat: gewoon "2025-09-18".
types.setTypeParser(1082, (waarde) => waarde);

// Supabase eist SSL, ook vanaf je laptop. Alleen een database op je eigen
// machine draait zonder — vandaar de check op de host in plaats van op NODE_ENV.
const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(process.env.DATABASE_URL || '');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false }
});

module.exports = pool;
