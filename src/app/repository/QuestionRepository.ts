import { getPool } from '../../config/database.js';
import type { QuestionEntity, OptionEntity } from '../../types/entities/Question.types.js';
import type { QuestionFilter, QuestionAnswerData, QuestionGradingData } from '../../types/repository/QuestionRepository.types.js';

export type { QuestionFilter, QuestionAnswerData, QuestionGradingData };

export class QuestionRepository {
  private pool = getPool();

  public async findAll(filter: QuestionFilter): Promise<QuestionEntity[]> {
    const conditions: string[] = [];
    const params: (string | number)[] = [];
    let paramIndex = 1;

    if (filter.category) {
      conditions.push(`category = $${paramIndex++}`);
      params.push(filter.category);
    }

    if (filter.difficulty) {
      conditions.push(`difficulty = $${paramIndex++}`);
      params.push(filter.difficulty);
    }

    let query = 'SELECT id, question_text, category, difficulty, explanation, created_at FROM questions';
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ' ORDER BY id ASC';

    if (filter.limit !== undefined && filter.limit > 0) {
      query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      params.push(filter.limit, filter.offset ?? 0);
    }

    const { rows: questions } = await this.pool.query<QuestionEntity>(query, params);

    if (questions.length === 0) {
      return [];
    }


    const questionIds = questions.map((q) => q.id);
    const optionsQuery = `
      SELECT id, question_id, option_text, is_correct 
      FROM options 
      WHERE question_id = ANY($1::int[]) 
      ORDER BY id ASC
    `;
    const { rows: options } = await this.pool.query<OptionEntity>(optionsQuery, [questionIds]);

    const optionsByQuestionId = new Map<number, OptionEntity[]>();
    for (const opt of options) {
      const list = optionsByQuestionId.get(opt.question_id) || [];
      list.push({
        ...opt,
        is_correct: Boolean(opt.is_correct)
      });
      optionsByQuestionId.set(opt.question_id, list);
    }

    for (const question of questions) {
      question.options = optionsByQuestionId.get(question.id) || [];
    }

    return questions;
  }

  public async countAll(filter: Omit<QuestionFilter, 'limit' | 'offset'>): Promise<number> {
    const conditions: string[] = [];
    const params: (string | number)[] = [];
    let paramIndex = 1;

    if (filter.category) {
      conditions.push(`category = $${paramIndex++}`);
      params.push(filter.category);
    }

    if (filter.difficulty) {
      conditions.push(`difficulty = $${paramIndex++}`);
      params.push(filter.difficulty);
    }

    let query = 'SELECT COUNT(*)::int as count FROM questions';
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    const { rows } = await this.pool.query<{ count: number }>(query, params);
    return rows[0] ? Number(rows[0].count) : 0;
  }

  public async findById(id: number): Promise<QuestionEntity | null> {
    const { rows: questions } = await this.pool.query<QuestionEntity>(
      'SELECT id, question_text, category, difficulty, explanation, created_at FROM questions WHERE id = $1',
      [id]
    );

    const question = questions[0];
    if (!question) {
      return null;
    }

    const { rows: options } = await this.pool.query<OptionEntity>(
      'SELECT id, question_id, option_text, is_correct FROM options WHERE question_id = $1 ORDER BY id ASC',
      [id]
    );

    question.options = options.map((opt) => ({
      ...opt,
      is_correct: Boolean(opt.is_correct)
    }));

    return question;
  }

  public async getAnswerData(questionId: number): Promise<QuestionAnswerData | null> {
    const query = `
      SELECT 
        q.id as question_id, 
        q.explanation, 
        o.id as correct_option_id
      FROM questions q
      JOIN options o ON o.question_id = q.id AND o.is_correct = true
      WHERE q.id = $1
    `;

    const { rows } = await this.pool.query<QuestionAnswerData>(query, [questionId]);
    return rows[0] ?? null;
  }

  public async getGradingData(questionId: number): Promise<QuestionGradingData | null> {
    const query = `
      SELECT
        q.id AS question_id,
        q.explanation,
        MAX(o.id) FILTER (WHERE o.is_correct) AS correct_option_id,
        ARRAY_AGG(o.id ORDER BY o.id) AS option_ids
      FROM questions q
      JOIN options o ON o.question_id = q.id
      WHERE q.id = $1
      GROUP BY q.id, q.explanation
    `;

    const { rows } = await this.pool.query<QuestionGradingData>(query, [questionId]);
    const row = rows[0];

    if (!row || row.correct_option_id === null) {
      return null;
    }

    return {
      question_id: Number(row.question_id),
      explanation: row.explanation,
      correct_option_id: Number(row.correct_option_id),
      option_ids: (row.option_ids || []).map(Number)
    };
  }

  public async checkOptionExistsForQuestion(questionId: number, optionId: number): Promise<boolean> {
    const { rows } = await this.pool.query(
      'SELECT 1 FROM options WHERE id = $1 AND question_id = $2',
      [optionId, questionId]
    );
    return rows.length > 0;
  }
}
