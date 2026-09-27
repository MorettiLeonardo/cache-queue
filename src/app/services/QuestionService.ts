import { QuestionRepository } from '../repository/QuestionRepository.js';
import { QuestionMapper } from '../mappers/QuestionMapper.js';
import { NotFoundError, ValidationError } from '../errors/DomainError.js';
import type {
  ListQuestionsParams,
  ListQuestionsResult,
  GetQuestionParams,
  GetQuestionResult,
  AnswerQuestionParams,
  AnswerQuestionResult
} from '../../types/services/QuestionService.types.js';

export type {
  ListQuestionsParams,
  ListQuestionsResult,
  GetQuestionParams,
  GetQuestionResult,
  AnswerQuestionParams,
  AnswerQuestionResult
};

export class QuestionService {
  private repository: QuestionRepository;

  constructor(repository: QuestionRepository = new QuestionRepository()) {
    this.repository = repository;
  }

  public async listQuestions(params: ListQuestionsParams): Promise<ListQuestionsResult> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 50));
    const offset = (page - 1) * limit;

    const filter = {
      category: params.category,
      difficulty: params.difficulty,
      limit,
      offset
    };

    const questions = await this.repository.findAll(filter);
    const total = await this.repository.countAll({
      category: params.category,
      difficulty: params.difficulty
    });

    const total_pages = Math.ceil(total / limit) || 1;

    return {
      total,
      page,
      limit,
      total_pages,
      data: QuestionMapper.toPublicDTOList(questions)
    };
  }

  public async getQuestionById(params: GetQuestionParams): Promise<GetQuestionResult> {
    if (!params.id || isNaN(params.id)) {
      throw new ValidationError('A valid question id is required');
    }

    const question = await this.repository.findById(params.id);
    if (!question) {
      throw new NotFoundError(`Question with id ${params.id} was not found`);
    }

    return {
      question: QuestionMapper.toPublicDTO(question)
    };
  }

  public async answerQuestion(params: AnswerQuestionParams): Promise<AnswerQuestionResult> {
    const { question_id, selected_option_id } = params;

    if (!question_id || isNaN(question_id)) {
      throw new ValidationError('A valid question_id is required');
    }

    if (!selected_option_id || isNaN(selected_option_id)) {
      throw new ValidationError('A valid selected_option_id is required');
    }

    const answerData = await this.repository.getAnswerData(question_id);
    if (!answerData) {
      throw new NotFoundError(`Question with id ${question_id} was not found`);
    }

    const optionExists = await this.repository.checkOptionExistsForQuestion(question_id, selected_option_id);
    if (!optionExists) {
      throw new ValidationError(`Option id ${selected_option_id} does not belong to question ${question_id}`);
    }

    const is_correct = selected_option_id === answerData.correct_option_id;

    return {
      question_id,
      is_correct,
      selected_option_id,
      correct_option_id: answerData.correct_option_id,
      explanation: answerData.explanation
    };
  }
}
