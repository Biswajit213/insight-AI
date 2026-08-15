import { Request, Response, NextFunction } from 'express';
import { DatasetService } from '../services/dataset.service';
import { BadRequestError, UnauthorizedError } from '../utils/errors';

export class DatasetController {
  public static async uploadDataset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      if (!req.file) throw new BadRequestError('No dataset file provided in request. Expecting file under key "file".');

      const dataset = await DatasetService.uploadAndProcessDataset(
        req.user.id,
        req.file,
        req.body?.name
      );

      res.status(201).json({
        success: true,
        data: dataset,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async listDatasets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { datasets, meta } = await DatasetService.getUserDatasets(req.user.id, req.query);
      res.json({
        success: true,
        data: datasets,
        meta,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getDataset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const dataset = await DatasetService.getDatasetById(req.user.id, req.params.id as string);
      res.json({
        success: true,
        data: dataset,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getDatasetPreview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const result = await DatasetService.getDatasetRows(req.user.id, req.params.id as string, req.query);
      res.json({
        success: true,
        data: {
          headers: result.headers,
          rows: result.rows,
        },
        meta: result.meta,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getDatasetColumns(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const columns = await DatasetService.getDatasetColumns(req.user.id, req.params.id as string);
      res.json({
        success: true,
        data: columns,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getDatasetStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const stats = await DatasetService.getDatasetStatistics(req.user.id, req.params.id as string);
      res.json({
        success: true,
        data: stats,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async deleteDataset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      await DatasetService.deleteDataset(req.user.id, req.params.id as string);
      res.json({
        success: true,
        data: { message: 'Dataset deleted successfully' },
      });
    } catch (err) {
      next(err);
    }
  }
}
