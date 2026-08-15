import { Request, Response, NextFunction } from 'express';
import { AnomalyService } from '../services/anomaly.service';
import { UnauthorizedError } from '../utils/errors';

export class AnomalyController {
  public static async listAnomalies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const datasetId = typeof req.query.datasetId === 'string' ? req.query.datasetId : undefined;
      const anomalies = await AnomalyService.getUserAnomalies(req.user.id, datasetId);
      res.json({
        success: true,
        data: anomalies,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async resolveAnomaly(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const status = req.body?.status === 'reviewed' ? 'reviewed' : 'resolved';
      const anomaly = await AnomalyService.resolveAnomaly(req.user.id, req.params.id as string, status);
      res.json({
        success: true,
        data: anomaly,
      });
    } catch (err) {
      next(err);
    }
  }
}
