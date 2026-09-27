import { ParticipationRepository } from '../repository/ParticipationRepository.js';
import { UserRepository } from '../repository/UserRepository.js';
import { QuestionRepository } from '../repository/QuestionRepository.js';
import { ParticipationCache } from '../cache/ParticipationCache.js';
import { QuestionCache } from '../cache/QuestionCache.js';
import { enqueueFinish } from '../queue/finishQueue.js';
import { ValidationError, NotFoundError } from '../errors/DomainError.js';
import type {
  StartParticipationParams,
  StartParticipationResult,
  AnswerParticipationParams,
  AnswerParticipationResult,
  FinishParticipationParams,
  FinishParticipationResult,
  GetParticipationParams,
  GetParticipationResult
} from '../../types/services/ParticipationService.types.js';
import type {
  CachedAnswer,
  CachedParticipationMeta
} from '../../types/cache/ParticipationCache.types.js';

const WRITE_BEHIND = process.env.WRITE_BEHIND !== 'false';

export class ParticipationService {
  private participationRepo: ParticipationRepository;
  private userRepo: UserRepository;
  private questionRepo: QuestionRepository;
  private cache: ParticipationCache;
  private questionCache: QuestionCache;

  constructor(
    participationRepo: ParticipationRepository = new ParticipationRepository(),
    userRepo: UserRepository = new UserRepository(),
    questionRepo: QuestionRepository = new QuestionRepository(),
    cache: ParticipationCache = new ParticipationCache(),
    questionCache: QuestionCache = new QuestionCache(questionRepo)
  ) {
    this.participationRepo = participationRepo;
    this.userRepo = userRepo;
    this.questionRepo = questionRepo;
    this.cache = cache;
    this.questionCache = questionCache;
  }

  public async startParticipation(params: StartParticipationParams): Promise<StartParticipationResult> {
    const { user_id } = params;

    if (!user_id || isNaN(user_id)) {
      throw new ValidationError('A valid user_id is required');
    }

    const user = await this.userRepo.findById(user_id);
    if (!user) {
      throw new NotFoundError(`User with id ${user_id} was not found`);
    }

    const participation = await this.participationRepo.create(user_id);
    const started_at = participation.started_at || new Date().toISOString();

    if (!WRITE_BEHIND) {
      return {
        participation_id: participation.id,
        user_id: participation.user_id,
        status: 'in_progress',
        started_at
      };
    }

    const meta: CachedParticipationMeta = {
      participation_id: participation.id,
      user_id: participation.user_id,
      user_name: user.name,
      user_email: user.email,
      status: 'in_progress',
      started_at
    };

    await this.cache.setMeta(meta).catch((err) => {
      console.error('[ParticipationService] failed to cache meta:', err.message);
    });

    return {
      participation_id: participation.id,
      user_id: participation.user_id,
      status: 'in_progress',
      started_at
    };
  }

  public async answerQuestion(params: AnswerParticipationParams): Promise<AnswerParticipationResult> {
    const { participation_id, question_id, selected_option_id } = params;

    if (!participation_id || isNaN(participation_id)) {
      throw new ValidationError('A valid participation_id is required');
    }

    if (!question_id || isNaN(question_id)) {
      throw new ValidationError('A valid question_id is required');
    }

    if (!selected_option_id || isNaN(selected_option_id)) {
      throw new ValidationError('A valid selected_option_id is required');
    }

    if (!WRITE_BEHIND) {
      return this.answerQuestionSynchronously(params);
    }

    const status = await this.resolveStatus(participation_id);

    if (status === null) {
      throw new NotFoundError(`Participation with id ${participation_id} was not found`);
    }

    if (status !== 'in_progress') {
      throw new ValidationError(
        status === 'processing'
          ? 'This participation is already being finalized and no longer accepts answers'
          : 'Cannot submit answers to an already completed participation session'
      );
    }

    const grading = await this.questionCache.getAnswerData(question_id);
    if (!grading) {
      throw new NotFoundError(`Question with id ${question_id} was not found`);
    }

    if (!grading.option_ids.includes(selected_option_id)) {
      throw new ValidationError(
        `Option id ${selected_option_id} does not belong to question ${question_id}`
      );
    }

    const is_correct = selected_option_id === grading.correct_option_id;

    const answer: CachedAnswer = {
      question_id,
      selected_option_id,
      is_correct,
      answered_at: new Date().toISOString()
    };


    const stored = await this.cache.addAnswer(participation_id, answer);
    if (!stored) {
      throw new ValidationError(
        `Question ${question_id} has already been answered in this session`
      );
    }

    return {
      participation_id,
      question_id,
      selected_option_id,
      is_correct,
      correct_option_id: grading.correct_option_id,
      explanation: grading.explanation
    };
  }

  public async finishParticipation(
    params: FinishParticipationParams
  ): Promise<FinishParticipationResult> {
    const { participation_id } = params;

    if (!participation_id || isNaN(participation_id)) {
      throw new ValidationError('A valid participation_id is required');
    }

    if (!WRITE_BEHIND) {
      return this.finishParticipationSynchronously(participation_id);
    }

    const meta = await this.cache.getMeta(participation_id);
    const status = meta ? meta.status : await this.statusFromDb(participation_id);

    if (status === null) {
      throw new NotFoundError(`Participation with id ${participation_id} was not found`);
    }


    if (status === 'completed' || status === 'processing') {
      return {
        participation_id,
        status,
        queued_answers: status === 'processing' ? await this.cache.countAnswers(participation_id) : 0,
        enqueued: false
      };
    }

    const answers = await this.cache.getAnswers(participation_id);


    await this.cache.setStatus(participation_id, 'processing');

    try {
      await enqueueFinish({
        participation_id,
        answers,
        enqueued_at: new Date().toISOString()
      });
    } catch (error) {

      await this.cache.setStatus(participation_id, 'in_progress');
      throw error;
    }

    return {
      participation_id,
      status: 'processing',
      queued_answers: answers.length,
      enqueued: true
    };
  }

  public async getParticipation(params: GetParticipationParams): Promise<GetParticipationResult> {
    const { id } = params;

    if (!id || isNaN(id)) {
      throw new ValidationError('A valid participation id is required');
    }

    if (!WRITE_BEHIND) {
      const total = await this.questionRepo.countAll({});
      const dbSummary = await this.participationRepo.getSummary(id, total);
      if (!dbSummary) {
        throw new NotFoundError(`Participation with id ${id} was not found`);
      }
      return { summary: dbSummary };
    }

    const meta = await this.cache.getMeta(id);
    const totalAvailable = await this.questionCache.countAll();


    if (meta && meta.status !== 'completed') {
      const answers = await this.cache.getAnswers(id);
      const score = answers.filter((a) => a.is_correct).length;
      const answered = answers.length;

      return {
        summary: {
          id,
          user_id: meta.user_id,
          user_name: meta.user_name,
          user_email: meta.user_email,
          status: meta.status,
          score,
          total_questions_answered: answered,
          total_available_questions: totalAvailable,
          percentage: answered > 0 ? Number(((score / answered) * 100).toFixed(1)) : 0,
          started_at: meta.started_at,
          finished_at: null
        }
      };
    }

    const summary = await this.participationRepo.getSummary(id, totalAvailable);
    if (!summary) {
      throw new NotFoundError(`Participation with id ${id} was not found`);
    }

    return { summary };
  }

  private async answerQuestionSynchronously(
    params: AnswerParticipationParams
  ): Promise<AnswerParticipationResult> {
    const { participation_id, question_id, selected_option_id } = params;

    const participation = await this.participationRepo.findById(participation_id);
    if (!participation) {
      throw new NotFoundError(`Participation with id ${participation_id} was not found`);
    }

    if (participation.status === 'completed') {
      throw new ValidationError(
        'Cannot submit answers to an already completed participation session'
      );
    }

    const alreadyAnswered = await this.participationRepo.findUserAnswer(
      participation_id,
      question_id
    );
    if (alreadyAnswered) {
      throw new ValidationError(
        `Question ${question_id} has already been answered in this session`
      );
    }

    const answerData = await this.questionRepo.getAnswerData(question_id);
    if (!answerData) {
      throw new NotFoundError(`Question with id ${question_id} was not found`);
    }

    const optionExists = await this.questionRepo.checkOptionExistsForQuestion(
      question_id,
      selected_option_id
    );
    if (!optionExists) {
      throw new ValidationError(
        `Option id ${selected_option_id} does not belong to question ${question_id}`
      );
    }

    const is_correct = selected_option_id === answerData.correct_option_id;

    await this.participationRepo.saveAnswer(
      participation_id,
      question_id,
      selected_option_id,
      is_correct
    );

    return {
      participation_id,
      question_id,
      selected_option_id,
      is_correct,
      correct_option_id: answerData.correct_option_id,
      explanation: answerData.explanation
    };
  }

  private async finishParticipationSynchronously(
    participation_id: number
  ): Promise<FinishParticipationResult> {
    const participation = await this.participationRepo.findById(participation_id);
    if (!participation) {
      throw new NotFoundError(`Participation with id ${participation_id} was not found`);
    }

    if (participation.status !== 'completed') {
      const { score, answeredCount } =
        await this.participationRepo.calculateScoreAndCount(participation_id);
      await this.participationRepo.finish(participation_id, score, answeredCount);

      return {
        participation_id,
        status: 'completed',
        queued_answers: answeredCount,
        enqueued: false
      };
    }

    return {
      participation_id,
      status: 'completed',
      queued_answers: 0,
      enqueued: false
    };
  }

  private async resolveStatus(
    participationId: number
  ): Promise<'in_progress' | 'processing' | 'completed' | null> {
    const meta = await this.cache.getMeta(participationId);
    if (meta) {
      return meta.status;
    }

    return this.statusFromDb(participationId);
  }

  private async statusFromDb(
    participationId: number
  ): Promise<'in_progress' | 'processing' | 'completed' | null> {
    const summary = await this.participationRepo.getSummary(participationId, 0);
    if (!summary) {
      return null;
    }

    await this.cache
      .setMeta({
        participation_id: summary.id,
        user_id: summary.user_id,
        user_name: summary.user_name,
        user_email: summary.user_email,
        status: summary.status,
        started_at: summary.started_at
      })
      .catch(() => undefined);

    return summary.status;
  }
}
