export interface AnswerRequestDTO {
  selected_option_id: number;
}

export interface AnswerResultDTO {
  question_id: number;
  is_correct: boolean;
  selected_option_id: number;
  correct_option_id: number;
  explanation: string;
}
