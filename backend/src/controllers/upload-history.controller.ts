import { Request, Response, NextFunction } from 'express';
import { UploadHistoryService } from '../services/upload-history.service';
import { UnauthorizedError } from '../utils/errors';

export class UploadHistoryController {
  /** GET /api/v1/upload-history — list all history for the logged-in user */
  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const history = await UploadHistoryService.getHistory(req.user.id);
      res.json({ success: true, data: history });
    } catch (err) {
      next(err);
    }
  }

  /** POST /api/v1/upload-history — record a new upload activity entry */
  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const {
        dataset_id, file_name, dataset_name, uploaded_at,
        size_bytes, row_count, column_count, missing_values, status,
      } = req.body || {};

      const entry = await UploadHistoryService.addEntry({
        userId: req.user.id,
        datasetId: dataset_id,
        fileName: file_name,
        datasetName: dataset_name,
        uploadedAt: uploaded_at || new Date().toISOString(),
        sizeBytes: size_bytes || 0,
        rowCount: row_count || 0,
        columnCount: column_count || 0,
        missingValues: missing_values || 0,
        status: status || 'connected',
      });

      res.status(201).json({ success: true, data: entry });
    } catch (err) {
      next(err);
    }
  }

  /** DELETE /api/v1/upload-history — clear all history for the logged-in user */
  public static async clear(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      await UploadHistoryService.clearHistory(req.user.id);
      res.json({ success: true, data: { message: 'Upload history cleared' } });
    } catch (err) {
      next(err);
    }
  }
}
