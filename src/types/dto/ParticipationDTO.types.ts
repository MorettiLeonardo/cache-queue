import { ReportedParticipationStatus } from '../cache/ParticipationCache.types.js';

export interface StartParticipationDTO {
  user_id: number;
}

export interface AnswerParticipationDTO {
  question_id: number;
  selected_option_id: number;
}

export interface AnswerParticipationResponseDTO {
  participation_id: number;
  question_id: number;
  selected_option_id: number;
  is_correct: boolean;
  correct_option_id: number;
  explanation: string;
}

export interface ParticipationSummaryDTO {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  status: ReportedParticipationStatus;
  score: number;
  total_questions_answered: number;
  total_available_questions: number;
  percentage: number;
  started_at: string;
  finished_at: string | null;
}
