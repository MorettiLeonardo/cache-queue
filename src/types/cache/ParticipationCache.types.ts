import type { ParticipationStatus } from '../entities/Participation.types.js';

export type ReportedParticipationStatus = ParticipationStatus | 'processing';

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
