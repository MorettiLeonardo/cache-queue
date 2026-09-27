import { getPool, initDatabase, closeDatabase } from '../config/database.js';
import { questionsSeedData } from './questionsData.js';

export async function runSeeder(): Promise<void> {
  console.log('🌱 Starting PostgreSQL Questionnaire Seeder...');

  try {

    await initDatabase();
    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');


      await client.query('TRUNCATE TABLE questions CASCADE;');
      await client.query('ALTER SEQUENCE questions_id_seq RESTART WITH 1;');
      await client.query('ALTER SEQUENCE options_id_seq RESTART WITH 1;');

      let questionCount = 0;
      let optionCount = 0;

      for (const q of questionsSeedData) {
        const qResult = await client.query<{ id: number }>(
          `INSERT INTO questions (question_text, category, difficulty, explanation)
           VALUES ($1, $2, $3, $4)
           RETURNING id`,
          [q.question_text, q.category, q.difficulty, q.explanation]
        );

        const questionId = qResult.rows[0].id;
        questionCount++;

        for (const opt of q.options) {
          await client.query(
            `INSERT INTO options (question_id, option_text, is_correct)
             VALUES ($1, $2, $3)`,
            [questionId, opt.text, opt.is_correct]
          );
          optionCount++;
        }
      }

      await client.query('COMMIT');
      console.log(`✅ Successfully seeded ${questionCount} programming questions and ${optionCount} options into PostgreSQL!`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Seeding failed, transaction rolled back:', error);
      throw error;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Fatal seeder error:', err);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}


runSeeder();
