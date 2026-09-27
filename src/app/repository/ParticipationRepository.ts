import { getPool } from '../../config/database.js';
import type { ParticipationEntity, UserAnswerEntity } from '../../types/entities/Participation.types.js';
import type { ParticipationSummaryDTO } from '../../types/dto/ParticipationDTO.types.js';

export class ParticipationRepository {
  private pool = getPool();

  public async create(userId: number): Promise<ParticipationEntity> {
    const query = `
      INSERT INTO participations (user_id, status)
      VALUES ($1, 'in_progress')
      RETURNING id, user_id, status, score, total_questions, started_at, finished_at
    `;
    const { rows } = await this.pool.query<ParticipationEntity>(query, [userId]);
    return rows[0];
  }

  public async findById(id: number): Promise<ParticipationEntity | null> {
    const query = `
      SELECT id, user_id, status, score, total_questions, started_at, finished_at
      FROM participations
      WHERE id = $1
    `;
    const { rows } = await this.pool.query<ParticipationEntity>(query, [id]);
    return rows[0] ?? null;
  }

  public async findUserAnswer(participationId: number, questionId: number): Promise<UserAnswerEntity | null> {
    const query = `
      SELECT id, participation_id, question_id, selected_option_id, is_correct, answered_at
      FROM user_answers
      WHERE participation_id = $1 AND question_id = $2
    `;
    const { rows } = await this.pool.query<UserAnswerEntity>(query, [participationId, questionId]);
    return rows[0] ?? null;
  }

  public async saveAnswer(
    participationId: number,
    questionId: number,
    selectedOptionId: number,
    isCorrect: boolean
  ): Promise<UserAnswerEntity> {
    const query = `
      INSERT INTO user_answers (participation_id, question_id, selected_option_id, is_correct)
      VALUES ($1, $2, $3, $4)
      RETURNING id, participation_id, question_id, selected_option_id, is_correct, answered_at
    `;
    const { rows } = await this.pool.query<UserAnswerEntity>(query, [
      participationId,
      questionId,
      selectedOptionId,
      isCorrect
    ]);
    return rows[0];
  }

  public async calculateScoreAndCount(participationId: number): Promise<{ score: number; answeredCount: number }> {
    const query = `
      SELECT 
        COUNT(*)::int as answered_count,
        COALESCE(COUNT(*) FILTER (WHERE is_correct = true), 0)::int as score
      FROM user_answers
      WHERE participation_id = $1
    `;
    const { rows } = await this.pool.query<{ answered_count: number; score: number }>(query, [participationId]);
    return {
      score: rows[0] ? Number(rows[0].score) : 0,
      answeredCount: rows[0] ? Number(rows[0].answered_count) : 0
    };
  }

  public async finish(id: number, score: number, totalQuestions: number): Promise<ParticipationEntity> {
    const query = `
      UPDATE participations
      SET status = 'completed', score = $2, total_questions = $3, finished_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, user_id, status, score, total_questions, started_at, finished_at
    `;
    const { rows } = await this.pool.query<ParticipationEntity>(query, [id, score, totalQuestions]);
    return rows[0];
  }

  public async persistFinishedParticipation(
    participationId: number,
    answers: Array<{ question_id: number; selected_option_id: number; is_correct: boolean }>
  ): Promise<{
    score: number;
    answeredCount: number;
    persistedAnswers: number;
    alreadyCompleted: boolean;
  } | null> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');


      const { rows: locked } = await client.query<{ status: string }>(
        'SELECT status FROM participations WHERE id = $1 FOR UPDATE',
        [participationId]
      );

      if (!locked[0]) {
        await client.query('ROLLBACK');
        return null;
      }

      const alreadyCompleted = locked[0].status === 'completed';
      let persistedAnswers = 0;

      if (answers.length > 0) {

        const { rowCount } = await client.query(
          `
          INSERT INTO user_answers (participation_id, question_id, selected_option_id, is_correct)
          SELECT $1, q.question_id, q.selected_option_id, q.is_correct
          FROM UNNEST($2::int[], $3::int[], $4::boolean[])
            AS q(question_id, selected_option_id, is_correct)
          ON CONFLICT (participation_id, question_id) DO NOTHING
          `,
          [
            participationId,
            answers.map((a) => a.question_id),
            answers.map((a) => a.selected_option_id),
            answers.map((a) => a.is_correct)
          ]
        );
        persistedAnswers = rowCount ?? 0;
      }

      const { rows: totals } = await client.query<{ answered_count: string; score: string }>(
        `
        SELECT
          COUNT(*)::int AS answered_count,
          COALESCE(COUNT(*) FILTER (WHERE is_correct = true), 0)::int AS score
        FROM user_answers
        WHERE participation_id = $1
        `,
        [participationId]
      );

      const answeredCount = Number(totals[0]?.answered_count ?? 0);
      const score = Number(totals[0]?.score ?? 0);

      if (!alreadyCompleted) {
        await client.query(
          `
          UPDATE participations
          SET status = 'completed', score = $2, total_questions = $3, finished_at = CURRENT_TIMESTAMP
          WHERE id = $1 AND status <> 'completed'
          `,
          [participationId, score, answeredCount]
        );
      }

      await client.query('COMMIT');

      return { score, answeredCount, persistedAnswers, alreadyCompleted };
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  public async getSummary(id: number, totalAvailableQuestions: number): Promise<ParticipationSummaryDTO | null> {
    const query = `
      SELECT 
        p.id,
        p.user_id,
        u.name as user_name,
        u.email as user_email,
        p.status,
        p.score,
        (SELECT COUNT(*)::int FROM user_answers WHERE participation_id = p.id) as total_questions_answered,
        p.started_at,
        p.finished_at
      FROM participations p
      JOIN users u ON u.id = p.user_id
      WHERE p.id = $1
    `;
    const { rows } = await this.pool.query<any>(query, [id]);
    if (!rows[0]) return null;

    const row = rows[0];
    const score = Number(row.score);
    const answered = Number(row.total_questions_answered);
    const percentage = answered > 0 ? Number(((score / answered) * 100).toFixed(1)) : 0;

    return {
      id: row.id,
      user_id: row.user_id,
      user_name: row.user_name,
      user_email: row.user_email,
      status: row.status,
      score,
      total_questions_answered: answered,
      total_available_questions: totalAvailableQuestions,
      percentage,
      started_at: row.started_at,
      finished_at: row.finished_at
    };
  }
}
