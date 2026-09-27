import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

let poolInstance: pg.Pool | null = null;

export function getPool(): pg.Pool {
  if (!poolInstance) {
    poolInstance = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/questionnaire',
      max: 50,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    poolInstance.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client', err);
    });
  }

  return poolInstance;
}

export async function initDatabase(): Promise<void> {
  const pool = getPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS questions (
      id SERIAL PRIMARY KEY,
      question_text TEXT NOT NULL,
      category VARCHAR(100) NOT NULL,
      difficulty VARCHAR(20) NOT NULL CHECK(difficulty IN ('easy', 'medium', 'hard')),
      explanation TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS options (
      id SERIAL PRIMARY KEY,
      question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
      option_text TEXT NOT NULL,
      is_correct BOOLEAN NOT NULL DEFAULT FALSE
    );

    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS participations (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK(status IN ('in_progress', 'completed')),
      score INTEGER DEFAULT 0,
      total_questions INTEGER DEFAULT 0,
      started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      finished_at TIMESTAMP WITH TIME ZONE
    );

    CREATE TABLE IF NOT EXISTS user_answers (
      id SERIAL PRIMARY KEY,
      participation_id INTEGER NOT NULL REFERENCES participations(id) ON DELETE CASCADE,
      question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
      selected_option_id INTEGER NOT NULL REFERENCES options(id) ON DELETE CASCADE,
      is_correct BOOLEAN NOT NULL,
      answered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(participation_id, question_id)
    );

    CREATE INDEX IF NOT EXISTS idx_options_question_id ON options(question_id);
    CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);
    CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
    CREATE INDEX IF NOT EXISTS idx_participations_user_id ON participations(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_answers_participation_id ON user_answers(participation_id);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `);
}

export async function closeDatabase(): Promise<void> {
  if (poolInstance) {
    await poolInstance.end();
    poolInstance = null;
  }
}
