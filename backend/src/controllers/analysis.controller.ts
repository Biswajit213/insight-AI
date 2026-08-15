import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { UnauthorizedError } from '../utils/errors';

export class AnalysisController {
  public static async runAnalysis(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const result = await AnalyticsService.executeAnalysis(req.user.id, req.body);
      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getAnalysisById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      res.json({
        success: true,
        data: {
          id: req.params.id,
          status: 'completed',
          result: {},
        },
      });
    } catch (err) {
      next(err);
    }
  }
}
