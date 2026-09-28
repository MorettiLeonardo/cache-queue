import { PublicQuestionDTO } from '../dto/QuestionDTO.types.js';
import { AnswerResultDTO } from '../dto/AnswerDTO.types.js';

export interface ListQuestionsParams {
  category?: string;
  /** Raw, unvalidated query-string value; parsed into QuestionDifficulty by the service. */
  difficulty?: string;
  page?: number;
  limit?: number;
}

export interface ListQuestionsResult {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  data: PublicQuestionDTO[];
}

export interface GetQuestionParams {
  id: number;
}

export interface GetQuestionResult {
  question: PublicQuestionDTO;
}

export interface AnswerQuestionParams {
  question_id: number;
  selected_option_id: number;
}

export interface AnswerQuestionResult extends AnswerResultDTO {}
