// ─── Core Entities ─────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  company?: string;
  role?: string;
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: string;
}

export interface Dataset {
  id: string;
  name: string;
  fileName: string;
  fileType: 'csv' | 'xlsx' | 'xls';
  rows: number;
  columns: number;
  sizeBytes: number;
  lastUpdated: string;
  status: 'connected' | 'processing' | 'needs_attention' | 'failed';
  description?: string;
  tags?: string[];
  missingValues?: number;
  duplicates?: number;
  dataTypes?: Record<string, string>;
}

export interface UploadHistoryEntry {
  id: string;
  datasetId: string;
  fileName: string;
  datasetName: string;
  uploadedAt: string;
  sizeBytes: number;
  rows: number;
  columns: number;
  status: 'connected' | 'processing' | 'needs_attention' | 'failed';
  missingValues?: number;
}

export interface DataColumn {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  nullCount: number;
  uniqueCount: number;
  sample: (string | number | boolean)[];
}

export interface DataRow {
  [key: string]: string | number | boolean | null;
}

export interface KPICard {
  id: string;
  title: string;
  value: string;
  rawValue: number;
  change: number;
  changeLabel: string;
  trend: 'up' | 'down' | 'neutral';
  icon: string;
  color: 'blue' | 'emerald' | 'violet' | 'amber';
  sparkData: number[];
}

export interface SalesDataPoint {
  month: string;
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface RevenueTrendPoint {
  year: string;
  actual?: number;
  predicted?: number;
}

export interface TopProduct {
  rank: number;
  name: string;
  category: string;
  revenue: number;
  units: number;
  growth: number;
  revenuePercent: number;
}

export interface RecentAnalysis {
  id: string;
  name: string;
  dataset: string;
  date: string;
  status: 'completed' | 'running' | 'failed' | 'queued';
  type: 'sales' | 'customer' | 'revenue' | 'marketing' | 'inventory';
}

// ─── AI / Insights ─────────────────────────────────────────────────────────

export type InsightType =
  | 'trend'
  | 'anomaly'
  | 'recommendation'
  | 'forecast'
  | 'risk'
  | 'root_cause'
  | 'correlation'
  | 'opportunity'
  | 'data_quality';

export interface SupportingMetric {
  label: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export interface RootCauseNode {
  title: string;
  changePct: number;
  subContributors?: Array<{ name: string; changePct: number }>;
}

export interface AIInsightEvidence {
  recordsAnalyzed: number;
  columnsAnalyzed: number;
  timeRange: string;
  patternsDetected: number;
  algorithmUsed: string;
  thresholdValue: string;
  detectedValue: string;
  rawDataSample?: Record<string, any>[];
}

export interface AIInsightRecommendation {
  action: string;
  expectedRevenueImpact: string;
  expectedOrderImpact: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  reason: string;
}

export interface WhatIfParams {
  baseRevenue: number;
  baseProfit: number;
  baseOrders: number;
  pricePct: number;
  volumePct: number;
  inventoryPct: number;
  discountPct: number;
}

export interface AIInsightDataPoint {
  x: string | number;
  y: number;
  y2?: number;
  isAnomaly?: boolean;
  predicted?: boolean;
}

export interface AIInsight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  confidence: number; // 0 - 100
  evidenceScore: number; // 0 - 100
  businessImpactPct: number; // 0 - 100
  insightScore: number; // 0 - 100
  estimatedRevenueImpact?: number | null; // e.g. 4800000 -> $4.8M
  dataset: string;
  datasetId?: string;
  timestamp: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  impact?: 'low' | 'medium' | 'high';
  tags?: string[];
  supportingMetrics?: SupportingMetric[];
  evidence?: AIInsightEvidence;
  rootCauses?: RootCauseNode[];
  recommendationData?: AIInsightRecommendation;
  whatIfParams?: WhatIfParams;
  chartData?: AIInsightDataPoint[];
  chartKind?: 'line' | 'bar' | 'scatter' | 'area' | 'comparison';
  saved?: boolean;
  feedback?: 'useful' | 'not_useful' | null;
  freshnessTimestamp?: string;
  explainability?: {
    algorithm: string;
    threshold: string;
    detectedValue: string;
    explanation: string;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: string[];
}

// ─── Reports ────────────────────────────────────────────────────────────────

export interface Report {
  id: string;
  title: string;
  type: 'sales' | 'customer' | 'marketing' | 'executive' | 'inventory' | 'financial';
  dataset: string;
  createdAt: string;
  updatedAt: string;
  status: 'ready' | 'generating' | 'failed';
  pages: number;
  sections: string[];
  description?: string;
  sharedWith?: string[];
}

// ─── Anomalies ──────────────────────────────────────────────────────────────

export interface Anomaly {
  id: string;
  name: string;
  dataset: string;
  metric: string;
  detectedValue: number;
  expectedValue: number;
  detectedAt: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'resolved' | 'investigating' | 'dismissed';
  description: string;
}

// ─── Navigation ─────────────────────────────────────────────────────────────

export interface NavItem {
  label: string;
  icon: string;
  path: string;
  badge?: number;
}

// ─── Notifications ──────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  title: string;
  description: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  timestamp: string;
}

// ─── Charts ─────────────────────────────────────────────────────────────────

export type ChartType = 'bar' | 'line' | 'area' | 'pie' | 'donut' | 'scatter' | 'radar' | 'combo';

export type DateRange = '7d' | '30d' | '90d' | '1y';

// ─── Settings ───────────────────────────────────────────────────────────────

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    anomalies: boolean;
    reports: boolean;
    insights: boolean;
  };
  aiPreferences: {
    autoInsights: boolean;
    forecastHorizon: '30d' | '90d' | '180d' | '1y';
    confidenceThreshold: number;
  };
}

// ─── Upload ──────────────────────────────────────────────────────────────────

export interface UploadState {
  file: File | null;
  progress: number;
  status: 'idle' | 'uploading' | 'processing' | 'success' | 'error';
  error?: string;
  preview?: DatasetPreview;
}

export interface DatasetPreview {
  rows: number;
  columns: number;
  headers: string[];
  sample: DataRow[];
  missingValues: number;
  duplicates: number;
  dataTypes: Record<string, string>;
}

// ─── API Responses (ready for backend integration) ───────────────────────────

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, string[]>;
}

// ─── Table ───────────────────────────────────────────────────────────────────

export interface TableFilter {
  column: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'contains' | 'startsWith';
  value: string;
}

export interface TableSort {
  column: string;
  direction: 'asc' | 'desc';
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}
