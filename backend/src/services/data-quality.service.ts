import { DataQualityReport } from '../types/dataset';
import { detectDuplicateRowsCount } from '../utils/data-utils';

export class DataQualityService {
  public static calculateQualityReport(
    headers: string[],
    rows: Record<string, unknown>[]
  ): DataQualityReport {
    const totalRows = rows.length;
    const totalColumns = headers.length;

    if (totalRows === 0 || totalColumns === 0) {
      return {
        completeness: 100,
        duplicateRate: 0,
        invalidEntries: 0,
        totalRows: 0,
        totalColumns: 0,
        overallScore: 100,
      };
    }

    const totalCells = totalRows * totalColumns;
    let nullCellCount = 0;
    let invalidEntriesCount = 0;

    for (const row of rows) {
      for (const header of headers) {
        const val = row[header];
        if (val === null || val === undefined || val === '') {
          nullCellCount++;
        } else if (typeof val === 'number' && isNaN(val)) {
          invalidEntriesCount++;
        }
      }
    }

    const completeness = Math.max(0, Math.min(100, Number((((totalCells - nullCellCount) / totalCells) * 100).toFixed(1))));
    
    const duplicateRows = detectDuplicateRowsCount(rows);
    const duplicateRate = Math.max(0, Math.min(100, Number(((duplicateRows / totalRows) * 100).toFixed(1))));
    const invalidRate = Math.max(0, Math.min(100, Number(((invalidEntriesCount / totalCells) * 100).toFixed(1))));

    // Calculate Overall Health Score
    // Weightings: Completeness (50%), Unique/Non-duplicate (35%), Validity (15%)
    const score = Math.round(
      completeness * 0.5 + (100 - duplicateRate) * 0.35 + (100 - invalidRate) * 0.15
    );

    const overallScore = Math.max(0, Math.min(100, score));

    return {
      completeness,
      duplicateRate,
      invalidEntries: invalidEntriesCount,
      totalRows,
      totalColumns,
      overallScore,
    };
  }
}
