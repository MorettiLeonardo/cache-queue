import { ParticipationStatus } from '../entities/Participation.types.js';

/**
 * Status that exists only while a finish job is in flight. It is reported to
 * clients and kept in the cache, but never persisted to the database.
 */
export enum TransientParticipationStatus {
  PROCESSING = 'processing'
}

export type ReportedParticipationStatus = ParticipationStatus | TransientParticipationStatus;

const REPORTED_STATUSES: readonly string[] = [
  ...Object.values(ParticipationStatus),
  ...Object.values(TransientParticipationStatus)
];

export function isReportedParticipationStatus(
  value: unknown
): value is ReportedParticipationStatus {
  return typeof value === 'string' && REPORTED_STATUSES.includes(value);
}

export interface CachedParticipationMeta {
  participation_id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  status: ReportedParticipationStatus;
  started_at: string;
}

export interface CachedAnswer {
  question_id: number;
  selected_option_id: number;
  is_correct: boolean;
  answered_at: string;
}

export interface CachedQuestionAnswerData {
  question_id: number;
  correct_option_id: number;
  explanation: string;
  option_ids: number[];
}
