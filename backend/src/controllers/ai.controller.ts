import { Request, Response, NextFunction } from 'express';
import { AIService } from '../services/ai.service';
import { UnauthorizedError } from '../utils/errors';
import { InsightService } from '../services/insight.service';

export class AIController {
  public static async askQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const response = await AIService.askDatasetQuestion(req.user.id, req.body);
      res.json({
        success: true,
        data: response,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async generateExecutiveSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const summary = await AIService.generateExecutiveSummary(req.user.id, req.body.datasetId);
      res.json({
        success: true,
        data: summary,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async generateInsights(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const insights = await InsightService.generateInsightsForDataset(req.user.id, req.body.datasetId);
      res.json({
        success: true,
        data: insights,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async listConversations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      res.json({
        success: true,
        data: [],
      });
    } catch (err) {
      next(err);
    }
  }

  public static async createConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      res.status(201).json({
        success: true,
        data: {
          id: crypto.randomUUID(),
          user_id: req.user.id,
          title: req.body.title || 'New Analysis Chat',
          created_at: new Date().toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getConversationById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      res.json({
        success: true,
        data: {
          id: req.params.id,
          messages: [],
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public static async addMessageToConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      res.status(201).json({
        success: true,
        data: {
          id: crypto.randomUUID(),
          conversation_id: req.params.id,
          role: 'user',
          content: req.body.content,
          created_at: new Date().toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public static async deleteConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      res.json({
        success: true,
        data: { message: 'Conversation deleted' },
      });
    } catch (err) {
      next(err);
    }
  }
}
