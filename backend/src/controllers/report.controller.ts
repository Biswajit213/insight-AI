import { Request, Response, NextFunction } from 'express';
import { ReportService } from '../services/report.service';
import { UnauthorizedError } from '../utils/errors';

export class ReportController {
  public static async createReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const report = await ReportService.createReport(
        req.user.id,
        req.body.datasetId,
        req.body.title,
        req.body.description
      );
      res.status(201).json({
        success: true,
        data: report,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async listReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const reports = await ReportService.getUserReports(req.user.id);
      res.json({
        success: true,
        data: reports,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const report = await ReportService.getReportById(req.user.id, req.params.id as string);
      res.json({
        success: true,
        data: report,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async generateReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const report = await ReportService.getReportById(req.user.id, req.params.id as string);
      const updated = await ReportService.generateReportContent(req.user.id, report.id, report.dataset_id);
      res.json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async deleteReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      await ReportService.deleteReport(req.user.id, req.params.id as string);
      res.json({
        success: true,
        data: { message: 'Report deleted successfully' },
      });
    } catch (err) {
      next(err);
    }
  }
}
