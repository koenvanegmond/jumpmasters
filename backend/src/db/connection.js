const { Pool } = require('pg');

// Supabase eist SSL, ook vanaf je laptop. Alleen een database op je eigen
// machine draait zonder — vandaar de check op de host in plaats van op NODE_ENV.
const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(process.env.DATABASE_URL || '');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false }
});

module.exports = pool;
