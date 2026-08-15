export type DatasetStatus = 'uploaded' | 'processing' | 'ready' | 'failed';
export type ColumnDataType = 'string' | 'number' | 'date' | 'boolean';

export interface Dataset {
  id: string;
  user_id: string;
  name: string;
  original_filename: string;
  file_type: 'csv' | 'xlsx' | 'xls';
  file_size: number;
  row_count: number;
  column_count: number;
  status: DatasetStatus;
  data_quality_score: number;
  storage_path: string;
  created_at: string;
  updated_at: string;
}

export interface DatasetColumn {
  id: string;
  dataset_id: string;
  column_name: string;
  data_type: ColumnDataType;
  nullable: boolean;
  unique_values: number;
  missing_values: number;
  created_at: string;
}

export interface ColumnSummaryStats {
  name: string;
  dataType: ColumnDataType;
  nullCount: number;
  uniqueCount: number;
  min?: number | string;
  max?: number | string;
  mean?: number;
  median?: number;
  stdDev?: number;
  topValues?: Array<{ value: string; count: number }>;
  minDate?: string;
  maxDate?: string;
}

export interface DataQualityReport {
  completeness: number; // percentage (e.g. 98.5)
  duplicateRate: number; // percentage (e.g. 1.2)
  invalidEntries: number;
  totalRows: number;
  totalColumns: number;
  overallScore: number; // percentage (0-100)
}

export interface DatasetStatisticsResponse {
  datasetId: string;
  name: string;
  rowCount: number;
  columnCount: number;
  quality: DataQualityReport;
  columns: ColumnSummaryStats[];
}
