export type ParticipationStatus = 'in_progress' | 'completed';

export interface ParticipationEntity {
  id: number;
  user_id: number;
  status: ParticipationStatus;
  score: number;
  total_questions: number;
  started_at?: string;
  finished_at?: string | null;
}

export interface UserAnswerEntity {
  id: number;
  participation_id: number;
  question_id: number;
  selected_option_id: number;
  is_correct: boolean;
  answered_at?: string;
}
