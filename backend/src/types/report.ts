export type ReportStatus = 'generating' | 'completed' | 'failed';

export interface ReportContent {
  executiveSummary: string;
  kpis: Array<{ label: string; value: string | number; change?: string }>;
  trends: string[];
  topProducts?: Array<{ name: string; revenue: number; growth: number }>;
  anomalies: string[];
  aiInsights: string[];
  recommendations: string[];
  chartsMetadata?: Record<string, unknown>;
}

export interface Report {
  id: string;
  user_id: string;
  dataset_id: string;
  title: string;
  description?: string;
  status: ReportStatus;
  content?: ReportContent | null;
  created_at: string;
  updated_at: string;
}
