export interface OptionEntity {
  id: number;
  question_id: number;
  option_text: string;
  is_correct: boolean;
}

export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

export interface QuestionEntity {
  id: number;
  question_text: string;
  category: string;
  difficulty: QuestionDifficulty;
  explanation: string;
  created_at?: string;
  options?: OptionEntity[];
}
