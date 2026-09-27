import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/UserService.js';

export class UserController {
  private service: UserService;

  constructor(service: UserService = new UserService()) {
    this.service = service;
  }

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, email } = req.body;
      const result = await this.service.createUser({ name, email });
      res.status(201).json({
        success: true,
        data: result.user
      });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(String(req.params.id), 10);
      const result = await this.service.getUserById({ id });
      res.status(200).json({
        success: true,
        data: result.user
      });
    } catch (error) {
      next(error);
    }
  };
}
