export interface OptionEntity {
  id: number;
  question_id: number;
  option_text: string;
  is_correct: boolean;
}

export enum QuestionDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard'
}

const DIFFICULTIES: readonly string[] = Object.values(QuestionDifficulty);

export function isQuestionDifficulty(value: unknown): value is QuestionDifficulty {
  return typeof value === 'string' && DIFFICULTIES.includes(value);
}

export interface QuestionEntity {
  id: number;
  question_text: string;
  category: string;
  difficulty: QuestionDifficulty;
  explanation: string;
  created_at?: string;
  options?: OptionEntity[];
}
