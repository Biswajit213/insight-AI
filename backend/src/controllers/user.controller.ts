import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { UnauthorizedError } from '../utils/errors';

export class UserController {
  public static async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const profile = await UserService.getUserProfile(req.user.id);
      res.json({
        success: true,
        data: profile,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const updated = await UserService.updateUserProfile(req.user.id, req.body);
      res.json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
}
