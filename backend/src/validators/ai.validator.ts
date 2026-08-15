import { z } from 'zod';

export const askAISchema = z.object({
  datasetId: z.string().uuid(),
  question: z.string().min(3).max(1000),
  conversationId: z.string().uuid().optional(),
});

export const executiveSummarySchema = z.object({
  datasetId: z.string().uuid(),
});

export const generateInsightsSchema = z.object({
  datasetId: z.string().uuid(),
});

export const createConversationSchema = z.object({
  datasetId: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
});

export const createMessageSchema = z.object({
  content: z.string().min(1).max(2000),
});
