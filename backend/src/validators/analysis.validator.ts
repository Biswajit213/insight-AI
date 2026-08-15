import { z } from 'zod';

export const runAnalysisSchema = z.object({
  datasetId: z.string().uuid(),
  analysisType: z.enum(['aggregation', 'group_by', 'time_series', 'correlation', 'custom']),
  title: z.string().optional(),
  metricColumn: z.string().optional(),
  groupByColumn: z.string().optional(),
  dateColumn: z.string().optional(),
  aggregation: z.enum(['sum', 'avg', 'median', 'count', 'distinct_count', 'min', 'max']).optional(),
  filters: z.array(
    z.object({
      column: z.string(),
      operator: z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'contains', 'in']),
      value: z.unknown(),
    })
  ).optional(),
  limit: z.number().int().min(1).max(1000).optional(),
});
