import { getRedis } from '../../config/redis.js';
import { QuestionRepository } from '../repository/QuestionRepository.js';
import type { CachedQuestionAnswerData } from '../../types/cache/ParticipationCache.types.js';

const TTL = Number(process.env.CACHE_TTL_QUESTION || 86400);

export class QuestionCache {
  private repository: QuestionRepository;

  constructor(repository: QuestionRepository = new QuestionRepository()) {
    this.repository = repository;
  }

  private key(questionId: number): string {
    return `question:${questionId}:answer`;
  }

  public async getAnswerData(questionId: number): Promise<CachedQuestionAnswerData | null> {
    const redis = getRedis();
    const key = this.key(questionId);

    try {
      const cached = await redis.get(key);
      if (cached) {
        return JSON.parse(cached) as CachedQuestionAnswerData;
      }
    } catch (err) {
      console.error('[QuestionCache] read failed, falling back to DB:', (err as Error).message);
    }

    const grading = await this.repository.getGradingData(questionId);
    if (!grading) {
      return null;
    }

    const payload: CachedQuestionAnswerData = {
      question_id: grading.question_id,
      correct_option_id: grading.correct_option_id,
      explanation: grading.explanation,
      option_ids: grading.option_ids,
    };

    try {
      await redis.set(key, JSON.stringify(payload), 'EX', TTL);
    } catch (err) {
      console.error('[QuestionCache] write failed:', (err as Error).message);
    }

    return payload;
  }

  public async warmAll(): Promise<number> {
    const questions = await this.repository.findAll({});
    if (questions.length === 0) {
      return 0;
    }

    const redis = getRedis();
    const pipeline = redis.pipeline();

    for (const question of questions) {
      const options = question.options || [];
      const correct = options.find((o) => o.is_correct);
      if (!correct) continue;

      const payload: CachedQuestionAnswerData = {
        question_id: question.id,
        correct_option_id: correct.id,
        explanation: question.explanation,
        option_ids: options.map((o) => o.id),
      };

      pipeline.set(this.key(question.id), JSON.stringify(payload), 'EX', TTL);
    }

    await pipeline.exec();
    return questions.length;
  }

  public async countAll(): Promise<number> {
    const redis = getRedis();
    const key = 'questions:count';

    try {
      const cached = await redis.get(key);
      if (cached !== null) {
        return Number(cached);
      }
    } catch (err) {
      console.error('[QuestionCache] count read failed:', (err as Error).message);
    }

    const count = await this.repository.countAll({});

    try {
      await redis.set(key, String(count), 'EX', TTL);
    } catch (err) {
      console.error('[QuestionCache] count write failed:', (err as Error).message);
    }

    return count;
  }

  public async invalidate(questionId?: number): Promise<void> {
    const redis = getRedis();

    if (questionId !== undefined) {
      await redis.del(this.key(questionId));
      return;
    }

    const keys = await redis.keys('question:*:answer');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    await redis.del('questions:count');
  }
}
