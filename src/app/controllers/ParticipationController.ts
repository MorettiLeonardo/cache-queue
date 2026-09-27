import { Request, Response, NextFunction } from 'express';
import { ParticipationService } from '../services/ParticipationService.js';

export class ParticipationController {
  private service: ParticipationService;

  constructor(service: ParticipationService = new ParticipationService()) {
    this.service = service;
  }

  public start = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { user_id } = req.body;
      const result = await this.service.startParticipation({ user_id: Number(user_id) });
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  public answer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const participation_id = parseInt(String(req.params.id), 10);
      const { question_id, selected_option_id } = req.body;

      const result = await this.service.answerQuestion({
        participation_id,
        question_id: Number(question_id),
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

  public finish = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const participation_id = parseInt(String(req.params.id), 10);
      const result = await this.service.finishParticipation({ participation_id });

      res.status(result.status === 'completed' ? 200 : 202).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(String(req.params.id), 10);
      const result = await this.service.getParticipation({ id });

      res.status(200).json({
        success: true,
        data: result.summary
      });
    } catch (error) {
      next(error);
    }
  };
}
