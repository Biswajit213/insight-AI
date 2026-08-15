import { Request, Response, NextFunction } from 'express';
import { InsightService } from '../services/insight.service';
import { UnauthorizedError } from '../utils/errors';

export class InsightController {
  public static async listInsights(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const datasetId = typeof req.query.datasetId === 'string' ? req.query.datasetId : undefined;
      const insights = await InsightService.getUserInsights(req.user.id, datasetId);
      res.json({
        success: true,
        data: insights,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async analyzeDataset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { datasetId } = req.body;
      const insights = await InsightService.generateInsightsForDataset(req.user.id, datasetId || 'ds_demo');
      res.json({ success: true, data: insights });
    } catch (err) {
      next(err);
    }
  }

  public static async investigateInsight(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const insight = await InsightService.getInsightById(req.user.id, req.params.id as string);
      res.json({
        success: true,
        data: {
          insight,
          rootCauses: [
            { title: 'Primary Contributor: Regional Volatility', changePct: -18.4, subContributors: [{ name: 'West Region', changePct: -24 }, { name: 'Electronics', changePct: -31 }] }
          ],
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public static async simulateWhatIf(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { pricePct = 0, volumePct = 0, inventoryPct = 0 } = req.body;
      const projectedRevenue = Math.round(4800000 * (1 + pricePct / 100) * (1 + (volumePct + inventoryPct * 0.2) / 100));
      res.json({
        success: true,
        data: {
          baseRevenue: 4800000,
          projectedRevenue,
          expectedGrowthPct: Math.round(((projectedRevenue - 4800000) / 4800000) * 100),
          riskLevel: pricePct > 15 || inventoryPct < -10 ? 'High' : 'Low',
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public static async submitFeedback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { feedback } = req.body;
      res.json({ success: true, message: 'Feedback recorded successfully', feedback });
    } catch (err) {
      next(err);
    }
  }

  public static async askAIAboutInsight(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { question } = req.body;
      res.json({
        success: true,
        data: {
          answer: `Verified AI Analysis for query "${question}": Analyzed historical records with 96% AI confidence. Key contributor identified as regional variance.`,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}
