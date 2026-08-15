export type InsightType = 'trend' | 'opportunity' | 'risk' | 'anomaly' | 'forecast' | 'recommendation';
export type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical';
export type AnomalyStatus = 'open' | 'reviewed' | 'resolved';

export interface Insight {
  id: string;
  user_id: string;
  dataset_id: string;
  type: InsightType;
  title: string;
  description: string;
  confidence: number;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface Anomaly {
  id: string;
  user_id: string;
  dataset_id: string;
  metric: string;
  description: string;
  expected_value: number;
  actual_value: number;
  severity: AnomalySeverity;
  status: AnomalyStatus;
  detected_at: string;
  resolved_at?: string | null;
}
