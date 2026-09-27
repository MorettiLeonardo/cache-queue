import type { CachedAnswer } from '../cache/ParticipationCache.types.js';

export const FINISH_QUEUE_NAME = 'participation-finish';
export const FINISH_JOB_NAME = 'finish-participation';

export interface FinishParticipationJob {
  participation_id: number;
  answers: CachedAnswer[];
  enqueued_at: string;
}

export interface FinishJobResult {
  participation_id: number;
  score: number;
  answered_count: number;
  persisted_answers: number;
  already_completed: boolean;
}
