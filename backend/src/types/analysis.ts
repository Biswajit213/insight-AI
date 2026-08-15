export type AggregationFunction = 'sum' | 'avg' | 'median' | 'count' | 'distinct_count' | 'min' | 'max';

export interface FilterCondition {
  column: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in';
  value: unknown;
}

export interface AnalysisRequest {
  datasetId: string;
  analysisType: 'aggregation' | 'group_by' | 'time_series' | 'correlation' | 'custom';
  title?: string;
  metricColumn?: string;
  groupByColumn?: string;
  dateColumn?: string;
  aggregation?: AggregationFunction;
  filters?: FilterCondition[];
  limit?: number;
}

export interface AnalysisResult {
  id: string;
  user_id: string;
  dataset_id: string;
  analysis_type: string;
  title: string;
  query: Record<string, unknown>;
  result: Record<string, unknown>;
  created_at: string;
}
