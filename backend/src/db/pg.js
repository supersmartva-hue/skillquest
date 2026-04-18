/**
 * PostgreSQL connection pool — shared singleton across the app.
 * Reads PG_DATABASE_URL from .env
 * e.g. postgres://user:password@localhost:5432/skillquest
 */

const { Pool } = require('pg');

if (!process.env.PG_DATABASE_URL) {
  console.warn('[pg] WARNING: PG_DATABASE_URL is not set. PostgreSQL features will fail.');
}

const pool = new Pool({
  connectionString: process.env.PG_DATABASE_URL,
  // Keep a small pool for local dev; tune for prod
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => {
  console.error('[pg] Unexpected pool error:', err.message);
});

module.exports = pool;
