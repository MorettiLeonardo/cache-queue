import { Request, Response, NextFunction } from 'express';
import { QuestionService } from '../services/QuestionService.js';

export class QuestionController {
  private service: QuestionService;

  constructor(service: QuestionService = new QuestionService()) {
    this.service = service;
  }

  public list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { category, difficulty, page, limit } = req.query;

      const result = await this.service.listQuestions({
        category: typeof category === 'string' ? category : undefined,
        difficulty: typeof difficulty === 'string' ? difficulty : undefined,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined
      });

      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(String(req.params.id), 10);
      const result = await this.service.getQuestionById({ id });

      res.status(200).json({
        success: true,
        data: result.question
      });
    } catch (error) {
      next(error);
    }
  };

  public answer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const question_id = parseInt(String(req.params.id), 10);
      const { selected_option_id } = req.body;

      const result = await this.service.answerQuestion({
        question_id,
        selected_option_id: Number(selected_option_id)
      });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };
}
