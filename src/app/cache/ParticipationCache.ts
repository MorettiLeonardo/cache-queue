import { getRedis } from '../../config/redis.js';
import {
  isReportedParticipationStatus,
  type CachedAnswer,
  type CachedParticipationMeta,
  type ReportedParticipationStatus,
} from '../../types/cache/ParticipationCache.types.js';
import { ParticipationStatus } from '../../types/entities/Participation.types.js';

const TTL = Number(process.env.CACHE_TTL_PARTICIPATION || 7200);

export class ParticipationCache {
  private metaKey(id: number): string {
    return `participation:${id}:meta`;
  }

  private answersKey(id: number): string {
    return `participation:${id}:answers`;
  }

  public async setMeta(meta: CachedParticipationMeta): Promise<void> {
    const redis = getRedis();
    const key = this.metaKey(meta.participation_id);

    await redis
      .multi()
      .hset(key, {
        participation_id: String(meta.participation_id),
        user_id: String(meta.user_id),
        user_name: meta.user_name,
        user_email: meta.user_email,
        status: meta.status,
        started_at: meta.started_at,
      })
      .expire(key, TTL)
      .exec();
  }

  public async getMeta(id: number): Promise<CachedParticipationMeta | null> {
    const raw = await getRedis().hgetall(this.metaKey(id));
    if (!raw || Object.keys(raw).length === 0) {
      return null;
    }

    return {
      participation_id: Number(raw.participation_id),
      user_id: Number(raw.user_id),
      user_name: raw.user_name,
      user_email: raw.user_email,
      status: isReportedParticipationStatus(raw.status)
        ? raw.status
        : ParticipationStatus.IN_PROGRESS,
      started_at: raw.started_at,
    };
  }

  public async setStatus(id: number, status: ReportedParticipationStatus): Promise<void> {
    const key = this.metaKey(id);
    await getRedis().multi().hset(key, 'status', status).expire(key, TTL).exec();
  }

  public async addAnswer(participationId: number, answer: CachedAnswer): Promise<boolean> {
    const redis = getRedis();
    const key = this.answersKey(participationId);

    const written = await redis.hsetnx(key, String(answer.question_id), JSON.stringify(answer));

    if (written === 1) {
      await redis.expire(key, TTL);
      return true;
    }

    return false;
  }

  public async getAnswers(participationId: number): Promise<CachedAnswer[]> {
    const raw = await getRedis().hgetall(this.answersKey(participationId));
    if (!raw || Object.keys(raw).length === 0) {
      return [];
    }

    return Object.values(raw)
      .map((value) => {
        try {
          return JSON.parse(String(value)) as CachedAnswer;
        } catch {
          return null;
        }
      })
      .filter((a): a is CachedAnswer => a !== null)
      .sort((a, b) => a.question_id - b.question_id);
  }

  public async countAnswers(participationId: number): Promise<number> {
    return getRedis().hlen(this.answersKey(participationId));
  }

  public async clearAnswers(participationId: number): Promise<void> {
    await getRedis().del(this.answersKey(participationId));
  }

  public async clear(participationId: number): Promise<void> {
    await getRedis().del(this.metaKey(participationId), this.answersKey(participationId));
  }
}
