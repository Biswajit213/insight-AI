export type IssueType =
  | 'MISSING_VALUE'
  | 'DUPLICATE'
  | 'INVALID_TYPE'
  | 'INVALID_VALUE'
  | 'OUTLIER'
  | 'FORMAT_ERROR'
  | 'CATEGORY_INCONSISTENCY'
  | 'INVALID_DATE'
  | 'INVALID_EMAIL'
  | 'INVALID_PHONE'
  | 'PII'
  | 'CONSTANT_COLUMN'
  | 'HIGH_CARDINALITY'
  | 'CORRELATION'
  | 'CUSTOM_RULE';

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface DataQualityScores {
  overallScore: number;
  completenessScore: number;
  accuracyScore: number;
  consistencyScore: number;
  validityScore: number;
  uniquenessScore: number;
  freshnessScore: number;
}

export interface IssueSummaryCounts {
  missingValues: number;
  duplicates: number;
  invalidValues: number;
  outliers: number;
  typeErrors: number;
  formatIssues: number;
  piiCount: number;
  totalIssues: number;
}

export interface DataQualityIssueItem {
  id: string;
  datasetId: string;
  datasetVersionId?: string;
  columnName?: string;
  issueType: IssueType;
  severity: SeverityLevel;
  description: string;
  rowCount: number;
  percentage: number;
  sampleValues: unknown[];
  recommendedAction: {
    actionType: string;
    label: string;
    parameters?: Record<string, unknown>;
  };
  status: 'open' | 'previewed' | 'resolved' | 'ignored';
  createdAt: string;
}

export interface DetailedColumnProfile {
  columnName: string;
  dataType: string;
  rowCount: number;
  nullCount: number;
  nullPercentage: number;
  uniqueCount: number;
  uniquePercentage: number;
  minVal?: string | number | null;
  maxVal?: string | number | null;
  meanVal?: number | null;
  medianVal?: number | null;
  stdDev?: number | null;
  quartiles?: { q1: number; q2: number; q3: number } | null;
  modeVal?: string | number | null;
  frequencyDistribution?: Record<string, number>;
  cardinality: 'constant' | 'low' | 'medium' | 'high' | 'unique';
  outlierCount: number;
  topValues: { value: string; count: number; percentage: number }[];
  rareValues?: { value: string; count: number }[];
  invalidDatesCount?: number;
  minDate?: string;
  maxDate?: string;
  detectedPII?: string | null;
}

export interface DatasetVersionItem {
  id: string;
  datasetId: string;
  versionNumber: number;
  versionLabel: string;
  storagePath: string;
  rowCount: number;
  columnCount: number;
  dataQualityScore: number;
  parentVersionId?: string | null;
  createdAt: string;
}

export interface CleaningOperationRecord {
  id: string;
  datasetId: string;
  datasetVersionId: string;
  operationType: string;
  columnName?: string;
  parameters: Record<string, unknown>;
  rowsAffected: number;
  beforeSample: unknown[];
  afterSample: unknown[];
  createdBy?: string;
  createdAt: string;
}

export interface ValidationRuleItem {
  id: string;
  datasetId: string;
  columnName: string;
  operator:
    | 'equals'
    | 'not_equals'
    | 'greater_than'
    | 'less_than'
    | 'between'
    | 'contains'
    | 'starts_with'
    | 'regex'
    | 'is_null'
    | 'is_not_null';
  value?: string;
  minValue?: number;
  maxValue?: number;
  ruleDescription: string;
  isEnabled: boolean;
  createdAt: string;
}

export interface ValidationReport {
  overallValid: boolean;
  passedRulesCount: number;
  failedRulesCount: number;
  details: {
    ruleId: string;
    description: string;
    passed: boolean;
    violatingRowsCount: number;
  }[];
  validatedAt: string;
}

export interface AICleaningSuggestion {
  id: string;
  issueType: IssueType;
  severity: SeverityLevel;
  columnName?: string;
  problem: string;
  recommendation: string;
  confidence: number;
  actionParams: {
    operationType: string;
    parameters: Record<string, unknown>;
  };
}

export interface DataQualityScanResult {
  datasetId: string;
  version: DatasetVersionItem;
  scores: DataQualityScores;
  counts: IssueSummaryCounts;
  issues: DataQualityIssueItem[];
  profiles: DetailedColumnProfile[];
  scannedAt: string;
}

export interface PreviewCleanResult {
  beforeRows: Record<string, unknown>[];
  afterRows: Record<string, unknown>[];
  rowsAffected: number;
  columnsAffected: number;
  sampleDiffs: {
    rowIndex: number;
    columnName: string;
    before: unknown;
    after: unknown;
  }[];
}

export interface CleanExecutionResult {
  success: boolean;
  datasetId: string;
  newVersion: DatasetVersionItem;
  previousScore: number;
  newScore: number;
  scoreImprovement: number;
  operationsApplied: number;
  validation: ValidationReport;
}
