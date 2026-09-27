export interface QuestionFilter {
  category?: string;
  difficulty?: string;
  limit?: number;
  offset?: number;
}

export interface QuestionAnswerData {
  question_id: number;
  explanation: string;
  correct_option_id: number;
}

export interface QuestionGradingData extends QuestionAnswerData {
  option_ids: number[];
}
