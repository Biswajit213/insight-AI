import { Request, Response, NextFunction } from 'express';
import { AnomalyService } from '../services/anomaly.service';
import { UnauthorizedError } from '../utils/errors';

export class AnomalyController {
  /** GET /api/v1/anomalies?datasetId=xxx — list all stored anomalies for user */
  public static async listAnomalies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const datasetId = typeof req.query.datasetId === 'string' ? req.query.datasetId : undefined;
      const anomalies = await AnomalyService.getUserAnomalies(req.user.id, datasetId);
      res.json({ success: true, data: anomalies });
    } catch (err) {
      next(err);
    }
  }

  /** POST /api/v1/anomalies/detect/:datasetId — run Z-score detection on dataset rows */
  public static async detectAnomalies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const anomalies = await AnomalyService.detectAndStoreAnomalies(
        req.user.id,
        req.params.datasetId as string
      );
      res.json({ success: true, data: anomalies, count: anomalies.length });
    } catch (err) {
      next(err);
    }
  }

  /** PATCH /api/v1/anomalies/:id/resolve — update anomaly status */
  public static async resolveAnomaly(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const status = req.body?.status === 'reviewed' ? 'reviewed'
        : req.body?.status === 'dismissed' ? 'dismissed'
        : 'resolved';
      const anomaly = await AnomalyService.resolveAnomaly(
        req.user.id,
        req.params.id as string,
        status as any
      );
      res.json({ success: true, data: anomaly });
    } catch (err) {
      next(err);
    }
  }
}
