import { QuestionDifficulty } from '../entities/Question.types.js';

export interface PublicOptionDTO {
  id: number;
  text: string;
}

export interface PublicQuestionDTO {
  id: number;
  question_text: string;
  category: string;
  difficulty: QuestionDifficulty;
  options: PublicOptionDTO[];
}

export interface ListQuestionsQueryDTO {
  category?: string;
  /** Raw, unvalidated query-string value; parsed into QuestionDifficulty by the service. */
  difficulty?: string;
  limit?: number;
  page?: number;
}

export interface ListQuestionsResponseDTO {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  data: PublicQuestionDTO[];
}
