import path from 'path';
import { parseCSVFile, ParsedDataResult } from '../utils/csv-parser';
import { parseExcelFile } from '../utils/excel-parser';
import { calculateColumnStats } from '../utils/data-utils';
import { DataQualityService } from './data-quality.service';
import { ColumnSummaryStats, DataQualityReport } from '../types/dataset';
import { BadRequestError } from '../utils/errors';

export interface ProcessedDatasetDetails {
  headers: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  columnCount: number;
  quality: DataQualityReport;
  columnStats: ColumnSummaryStats[];
}

export class DataProcessingService {
  public static async processFile(filePath: string, fileType: string): Promise<ProcessedDatasetDetails> {
    let parsed: ParsedDataResult;
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.csv' || fileType === 'csv') {
      parsed = await parseCSVFile(filePath);
    } else if (ext === '.xlsx' || ext === '.xls' || fileType === 'xlsx' || fileType === 'xls') {
      parsed = await parseExcelFile(filePath);
    } else {
      throw new BadRequestError(`Unsupported file extension for parsing: ${ext}`);
    }

    const { headers, rows, totalRows } = parsed;
    const columnCount = headers.length;

    // Quality engine calculations
    const quality = DataQualityService.calculateQualityReport(headers, rows);

    // Compute stats for each column
    const columnStats: ColumnSummaryStats[] = headers.map((header) => {
      const colValues = rows.map((r) => r[header]);
      return calculateColumnStats(header, colValues);
    });

    return {
      headers,
      rows,
      rowCount: totalRows,
      columnCount,
      quality,
      columnStats,
    };
  }
}
