import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { UnauthorizedError } from '../utils/errors';

export class AuthController {
  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, full_name, user_id, avatar_url, provider } = req.body || {};
      if (!email) {
        res.status(400).json({
          success: false,
          error: { message: 'Email address is required' },
        });
        return;
      }

      const profile = await AuthService.recordLogin({
        email,
        fullName: full_name,
        userId: user_id,
        avatarUrl: avatar_url,
        provider: provider || 'email',
      });

      res.json({
        success: true,
        data: profile,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, full_name, user_id, avatar_url } = req.body || {};
      if (!email || !full_name) {
        res.status(400).json({
          success: false,
          error: { message: 'Email and full name are required' },
        });
        return;
      }

      const profile = await AuthService.recordSignup({
        email,
        fullName: full_name,
        userId: user_id,
        avatarUrl: avatar_url,
      });

      res.json({
        success: true,
        data: profile,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
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

  public static async syncSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { full_name, avatar_url } = req.body || {};
      const profile = await AuthService.syncUserProfile(req.user.id, req.user.email, full_name, avatar_url);
      res.json({
        success: true,
        data: profile,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async logout(_req: Request, res: Response): Promise<void> {
    res.json({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  }
}
