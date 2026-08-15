import { z } from 'zod';

export const createReportSchema = z.object({
  datasetId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
});
