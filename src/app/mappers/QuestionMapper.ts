import type { QuestionEntity, OptionEntity } from '../../types/entities/Question.types.js';
import type { PublicQuestionDTO, PublicOptionDTO } from '../../types/dto/QuestionDTO.types.js';

export class QuestionMapper {
  public static toPublicOptionDTO(option: OptionEntity): PublicOptionDTO {
    return {
      id: option.id,
      text: option.option_text
    };
  }

  public static toPublicDTO(question: QuestionEntity): PublicQuestionDTO {
    return {
      id: question.id,
      question_text: question.question_text,
      category: question.category,
      difficulty: question.difficulty,
      options: (question.options || []).map((opt) => this.toPublicOptionDTO(opt))
    };
  }

  public static toPublicDTOList(questions: QuestionEntity[]): PublicQuestionDTO[] {
    return questions.map((q) => this.toPublicDTO(q));
  }
}
