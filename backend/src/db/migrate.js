/**
 * Run once to create the lessons + questions tables in PostgreSQL.
 *
 * Usage:  node src/db/migrate.js
 */

require('dotenv').config();
const pool = require('./pg');

const SQL = `
  CREATE TABLE IF NOT EXISTS lessons (
    id         SERIAL PRIMARY KEY,
    topic      TEXT        NOT NULL,
    notes      TEXT        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS questions (
    id             SERIAL  PRIMARY KEY,
    lesson_id      INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    question       TEXT    NOT NULL,
    options        JSONB   NOT NULL,
    correct_answer TEXT    NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_questions_lesson_id ON questions(lesson_id);
`;

(async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(SQL);
    await client.query('COMMIT');
    console.log('✅ Migration complete — tables: lessons, questions');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
})();
