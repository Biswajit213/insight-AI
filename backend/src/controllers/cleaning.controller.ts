import { Request, Response, NextFunction } from 'express';
import { DatasetService } from '../services/dataset.service';
import { CleaningVersionService } from '../services/cleaning-version.service';
import { AICleaningAssistantService } from '../services/ai-cleaning-assistant.service';
import { DataCleaningEngineService } from '../services/data-cleaning-engine.service';
import { BadRequestError } from '../utils/errors';

export class CleaningController {
  public static async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const datasetId = req.params.id as string;
      await DatasetService.getDatasetById(userId, datasetId);

      const scanResult = CleaningVersionService.runQualityScan(datasetId);
      res.json({ success: true, data: scanResult.profiles });
    } catch (err) {
      next(err);
    }
  }

  public static async runQualityScan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const datasetId = req.params.id as string;
      const { versionId } = req.body;
      await DatasetService.getDatasetById(userId, datasetId);

      const scanResult = CleaningVersionService.runQualityScan(datasetId, versionId);
      res.json({ success: true, data: scanResult });
    } catch (err) {
      next(err);
    }
  }

  public static async getIssues(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const datasetId = req.params.id as string;
      const { issueType, severity } = req.query;
      await DatasetService.getDatasetById(userId, datasetId);

      const scanResult = CleaningVersionService.runQualityScan(datasetId);
      let issues = scanResult.issues;

      if (issueType) {
        issues = issues.filter((i) => i.issueType === issueType);
      }
      if (severity) {
        issues = issues.filter((i) => i.severity === severity);
      }

      res.json({ success: true, data: { issues, counts: scanResult.counts, scores: scanResult.scores } });
    } catch (err) {
      next(err);
    }
  }

  public static async getIssueById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const datasetId = req.params.id as string;
      const issueId = req.params.issueId as string;
      await DatasetService.getDatasetById(userId, datasetId);

      const scanResult = CleaningVersionService.runQualityScan(datasetId);
      const issue = scanResult.issues.find((i) => i.id === issueId);

      if (!issue) {
        res.status(404).json({ success: false, message: 'Issue not found' });
        return;
      }

      res.json({ success: true, data: issue });
    } catch (err) {
      next(err);
    }
  }

  public static async previewClean(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const datasetId = req.params.id as string;
      const { steps = [] } = req.body;
      await DatasetService.getDatasetById(userId, datasetId);

      const rows = CleaningVersionService.getDatasetRowsForActiveVersion(datasetId);
      const headers = rows.length > 0 ? Object.keys(rows[0]) : [];

      const preview = DataCleaningEngineService.previewCleaning(headers, rows, steps);
      res.json({ success: true, data: preview });
    } catch (err) {
      next(err);
    }
  }

  public static async cleanDataset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const datasetId = req.params.id as string;
      const { steps = [], label } = req.body;
      await DatasetService.getDatasetById(userId, datasetId);

      if (!Array.isArray(steps) || steps.length === 0) {
        throw new BadRequestError('At least one cleaning operation step is required.');
      }

      const result = CleaningVersionService.executeCleaningPipeline(userId, datasetId, steps, label);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async validateDataset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const datasetId = req.params.id as string;
      const { versionId } = req.body;
      await DatasetService.getDatasetById(userId, datasetId);

      const report = CleaningVersionService.validateDataset(datasetId, versionId);
      res.json({ success: true, data: report });
    } catch (err) {
      next(err);
    }
  }

  public static async getCleaningHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const datasetId = req.params.id as string;
      await DatasetService.getDatasetById(userId, datasetId);

      const history = CleaningVersionService.getCleaningHistory(datasetId);
      res.json({ success: true, data: history });
    } catch (err) {
      next(err);
    }
  }

  public static async rollbackDataset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const datasetId = req.params.id as string;
      const { versionId } = req.body;
      await DatasetService.getDatasetById(userId, datasetId);

      if (!versionId) {
        throw new BadRequestError('versionId is required for rollback');
      }

      const restoredVersion = CleaningVersionService.rollbackToVersion(datasetId, versionId);
      res.json({ success: true, data: restoredVersion });
    } catch (err) {
      next(err);
    }
  }

  public static async getVersions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const datasetId = req.params.id as string;
      await DatasetService.getDatasetById(userId, datasetId);

      const versions = CleaningVersionService.getVersionsList(datasetId);
      res.json({ success: true, data: versions });
    } catch (err) {
      next(err);
    }
  }

  public static async createVersion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const datasetId = req.params.id as string;
      const { label } = req.body;
      await DatasetService.getDatasetById(userId, datasetId);

      const activeVer = CleaningVersionService.getActiveVersion(datasetId);
      res.json({ success: true, data: { ...activeVer, versionLabel: label || activeVer.versionLabel } });
    } catch (err) {
      next(err);
    }
  }

  public static async getAICleaningSuggestions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const datasetId = req.params.id as string;
      const dataset = await DatasetService.getDatasetById(userId, datasetId);

      const scanResult = CleaningVersionService.runQualityScan(datasetId);
      const suggestions = await AICleaningAssistantService.generateSuggestions(
        dataset.name,
        dataset.row_count,
        dataset.column_count,
        scanResult.issues,
        scanResult.profiles
      );

      res.json({ success: true, data: suggestions });
    } catch (err) {
      next(err);
    }
  }

  public static async addCustomRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const datasetId = req.params.id as string;
      const { columnName, operator, value, minValue, maxValue, ruleDescription } = req.body;
      await DatasetService.getDatasetById(userId, datasetId);

      if (!columnName || !operator || !ruleDescription) {
        throw new BadRequestError('columnName, operator, and ruleDescription are required');
      }

      const rule = CleaningVersionService.addCustomRule(datasetId, {
        datasetId,
        columnName,
        operator,
        value,
        minValue,
        maxValue,
        ruleDescription,
        isEnabled: true,
      });

      res.json({ success: true, data: rule });
    } catch (err) {
      next(err);
    }
  }

  public static async exportCleanedDataset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const datasetId = req.params.id as string;
      const { format = 'csv' } = req.body;
      const dataset = await DatasetService.getDatasetById(userId, datasetId);

      const rows = CleaningVersionService.getDatasetRowsForActiveVersion(datasetId);
      const activeVersion = CleaningVersionService.getActiveVersion(datasetId);

      if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${dataset.name}_${activeVersion.versionLabel}.json"`);
        res.send(JSON.stringify(rows, null, 2));
        return;
      }

      // Default CSV format
      const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
      let csvContent = headers.join(',') + '\n';

      for (const row of rows) {
        const line = headers.map((h) => {
          const val = row[h] ?? '';
          const str = String(val).replace(/"/g, '""');
          return `"${str}"`;
        }).join(',');
        csvContent += line + '\n';
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${dataset.name}_${activeVersion.versionLabel}.csv"`);
      res.send(csvContent);
    } catch (err) {
      next(err);
    }
  }

  public static async getQualityReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const datasetId = req.params.id as string;
      const dataset = await DatasetService.getDatasetById(userId, datasetId);

      const scanResult = CleaningVersionService.runQualityScan(datasetId);
      const history = CleaningVersionService.getCleaningHistory(datasetId);
      const validation = CleaningVersionService.validateDataset(datasetId);

      res.json({
        success: true,
        data: {
          dataset,
          activeVersion: scanResult.version,
          scores: scanResult.scores,
          counts: scanResult.counts,
          issues: scanResult.issues,
          profiles: scanResult.profiles,
          history,
          validation,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  }
}
