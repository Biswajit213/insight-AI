import { DetailedColumnProfile, DataQualityScores, IssueSummaryCounts, DataQualityIssueItem } from '../types/cleaning';
import { PIIDetectorService } from './pii-detector.service';

export interface ProfilerResult {
  scores: DataQualityScores;
  counts: IssueSummaryCounts;
  issues: DataQualityIssueItem[];
  profiles: DetailedColumnProfile[];
  correlations: { col1: string; col2: string; correlation: number }[];
}

export class DataProfilerService {
  private static MISSING_PLACEHOLDERS = new Set([
    '',
    'null',
    'none',
    'n/a',
    'na',
    '-',
    'unknown',
    'not available',
    'undefined',
    'nil',
    '#n/a',
  ]);

  public static isValueMissing(val: unknown): boolean {
    if (val === null || val === undefined) return true;
    if (typeof val === 'number') return isNaN(val);
    const str = String(val).trim().toLowerCase();
    return this.MISSING_PLACEHOLDERS.has(str);
  }

  public static profileDataset(
    datasetId: string,
    datasetVersionId: string | undefined,
    headers: string[],
    rows: Record<string, unknown>[]
  ): ProfilerResult {
    const totalRows = rows.length;
    const totalColumns = headers.length;

    const profiles: DetailedColumnProfile[] = [];
    const issues: DataQualityIssueItem[] = [];

    let missingCellCount = 0;
    let duplicateRowCount = 0;
    let invalidEntriesCount = 0;
    let outlierCountTotal = 0;
    let typeErrorCount = 0;
    let formatIssueCount = 0;
    let piiDetectCount = 0;

    // 1. Check duplicate rows
    const rowSignatures = new Set<string>();
    for (const r of rows) {
      const sig = JSON.stringify(r);
      if (rowSignatures.has(sig)) {
        duplicateRowCount++;
      } else {
        rowSignatures.add(sig);
      }
    }

    if (duplicateRowCount > 0) {
      issues.push({
        id: crypto.randomUUID(),
        datasetId,
        datasetVersionId,
        issueType: 'DUPLICATE',
        severity: duplicateRowCount > totalRows * 0.1 ? 'critical' : 'high',
        description: `${duplicateRowCount} exact duplicate row(s) detected in the dataset.`,
        rowCount: duplicateRowCount,
        percentage: Number(((duplicateRowCount / Math.max(1, totalRows)) * 100).toFixed(2)),
        sampleValues: rows.slice(0, 3),
        recommendedAction: {
          actionType: 'REMOVE_DUPLICATES',
          label: 'Remove All Duplicates',
          parameters: { strategy: 'keep_first' },
        },
        status: 'open',
        createdAt: new Date().toISOString(),
      });
    }

    // 2. Profile each column
    const numericalColumns: { name: string; values: number[] }[] = [];

    for (const col of headers) {
      const rawValues = rows.map((r) => r[col]);
      const missingCount = rawValues.filter((v) => this.isValueMissing(v)).length;
      missingCellCount += missingCount;

      const nonNullRaw = rawValues.filter((v) => !this.isValueMissing(v));
      const nullPct = Number(((missingCount / Math.max(1, totalRows)) * 100).toFixed(2));

      // Type inference
      let numCount = 0;
      let dateCount = 0;
      let boolCount = 0;
      const numValues: number[] = [];
      const dateValues: Date[] = [];
      let invalidDateCount = 0;

      for (const val of nonNullRaw) {
        const str = String(val).trim();
        // Check number
        const cleanNumStr = str.replace(/[\$,\s₹]/g, '').replace(/%$/, '');
        const parsedNum = Number(cleanNumStr);
        if (str !== '' && !isNaN(parsedNum)) {
          numCount++;
          numValues.push(parsedNum);
        }

        // Check boolean
        if (['true', 'false', '1', '0', 'yes', 'no'].includes(str.toLowerCase())) {
          boolCount++;
        }

        // Check date
        const dateParsed = Date.parse(str);
        if (!isNaN(dateParsed) && str.length >= 6 && /\d/.test(str)) {
          dateCount++;
          dateValues.push(new Date(dateParsed));
        } else if (/^\d{2,4}[-\/]\d{1,2}[-\/]\d{2,4}$/.test(str)) {
          invalidDateCount++;
        }
      }

      const nonNullLen = Math.max(1, nonNullRaw.length);
      let detectedType = 'TEXT';
      if (numCount / nonNullLen > 0.8) {
        detectedType = 'NUMBER';
      } else if (dateCount / nonNullLen > 0.8) {
        detectedType = 'DATE';
      } else if (boolCount / nonNullLen > 0.8) {
        detectedType = 'BOOLEAN';
      }

      // Check currency/percentage specific type flags
      const isCurrency = nonNullRaw.some((v) => /[\$₹€£]/.test(String(v)));
      const isPercentage = nonNullRaw.some((v) => /%$/.test(String(v)));
      if (detectedType === 'NUMBER' && isCurrency) detectedType = 'CURRENCY';
      if (detectedType === 'NUMBER' && isPercentage) detectedType = 'PERCENTAGE';

      // Unique & Value Frequencies
      const freqMap = new Map<string, number>();
      for (const v of nonNullRaw) {
        const str = String(v).trim();
        freqMap.set(str, (freqMap.get(str) || 0) + 1);
      }

      const uniqueCount = freqMap.size;
      const uniquePct = Number(((uniqueCount / Math.max(1, totalRows)) * 100).toFixed(2));

      // Cardinality class
      let cardinality: DetailedColumnProfile['cardinality'] = 'medium';
      if (uniqueCount === 1) cardinality = 'constant';
      else if (uniqueCount === totalRows) cardinality = 'unique';
      else if (uniquePct < 5) cardinality = 'low';
      else if (uniquePct > 80) cardinality = 'high';

      // Statistics for Numerical columns
      let minVal: string | number | null = null;
      let maxVal: string | number | null = null;
      let meanVal: number | null = null;
      let medianVal: number | null = null;
      let stdDev: number | null = null;
      let quartiles: { q1: number; q2: number; q3: number } | null = null;
      let outlierCount = 0;

      if (detectedType === 'NUMBER' || detectedType === 'CURRENCY' || detectedType === 'PERCENTAGE') {
        if (numValues.length > 0) {
          numericalColumns.push({ name: col, values: numValues });
          numValues.sort((a, b) => a - b);
          minVal = numValues[0];
          maxVal = numValues[numValues.length - 1];
          const sum = numValues.reduce((a, b) => a + b, 0);
          meanVal = Number((sum / numValues.length).toFixed(2));

          const mid = Math.floor(numValues.length / 2);
          medianVal = numValues.length % 2 !== 0 ? numValues[mid] : Number(((numValues[mid - 1] + numValues[mid]) / 2).toFixed(2));

          const q1Pos = Math.floor(numValues.length * 0.25);
          const q3Pos = Math.floor(numValues.length * 0.75);
          const q1 = numValues[q1Pos] || numValues[0];
          const q3 = numValues[q3Pos] || numValues[numValues.length - 1];
          quartiles = { q1, q2: medianVal, q3 };

          const variance = numValues.reduce((a, b) => a + Math.pow(b - meanVal!, 2), 0) / numValues.length;
          stdDev = Number(Math.sqrt(variance).toFixed(2));

          // IQR Outliers detection
          const iqr = q3 - q1;
          const lowerBound = q1 - 1.5 * iqr;
          const upperBound = q3 + 1.5 * iqr;

          outlierCount = numValues.filter((v) => v < lowerBound || v > upperBound).length;
          outlierCountTotal += outlierCount;
        }
      }

      // Top values
      const sortedFreq = Array.from(freqMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      const topValues = sortedFreq.map(([value, count]) => ({
        value,
        count,
        percentage: Number(((count / Math.max(1, totalRows)) * 100).toFixed(2)),
      }));

      const modeVal = topValues.length > 0 ? topValues[0].value : null;

      // PII Check
      const piiType = PIIDetectorService.detectColumnPII(col, nonNullRaw.slice(0, 50));
      if (piiType) {
        piiDetectCount++;
        issues.push({
          id: crypto.randomUUID(),
          datasetId,
          datasetVersionId,
          columnName: col,
          issueType: 'PII',
          severity: 'high',
          description: `Potential sensitive PII field (${piiType}) detected in column "${col}".`,
          rowCount: nonNullRaw.length,
          percentage: Number(((nonNullRaw.length / Math.max(1, totalRows)) * 100).toFixed(2)),
          sampleValues: nonNullRaw.slice(0, 3).map((v) => PIIDetectorService.maskValue(v, piiType)),
          recommendedAction: {
            actionType: 'MASK_PII',
            label: `Mask Sensitive ${piiType} Data`,
            parameters: { piiType },
          },
          status: 'open',
          createdAt: new Date().toISOString(),
        });
      }

      // Column Profile
      profiles.push({
        columnName: col,
        dataType: detectedType,
        rowCount: totalRows,
        nullCount: missingCount,
        nullPercentage: nullPct,
        uniqueCount,
        uniquePercentage: uniquePct,
        minVal,
        maxVal,
        meanVal,
        medianVal,
        stdDev,
        quartiles,
        modeVal,
        cardinality,
        outlierCount,
        topValues,
        invalidDatesCount: invalidDateCount,
        detectedPII: piiType,
      });

      // Issue Generation per column

      // Missing values issue
      if (missingCount > 0) {
        issues.push({
          id: crypto.randomUUID(),
          datasetId,
          datasetVersionId,
          columnName: col,
          issueType: 'MISSING_VALUE',
          severity: nullPct > 20 ? 'high' : nullPct > 5 ? 'medium' : 'low',
          description: `Column "${col}" has ${missingCount} missing value(s) (${nullPct}%).`,
          rowCount: missingCount,
          percentage: nullPct,
          sampleValues: [null, '', 'N/A'].slice(0, 3),
          recommendedAction: {
            actionType: 'IMPUTE_MISSING',
            label: `Impute Missing in ${col}`,
            parameters: { strategy: detectedType === 'NUMBER' ? 'median' : 'mode' },
          },
          status: 'open',
          createdAt: new Date().toISOString(),
        });
      }

      // Outlier issue
      if (outlierCount > 0) {
        issues.push({
          id: crypto.randomUUID(),
          datasetId,
          datasetVersionId,
          columnName: col,
          issueType: 'OUTLIER',
          severity: outlierCount > totalRows * 0.05 ? 'high' : 'medium',
          description: `Column "${col}" contains ${outlierCount} statistical outlier(s).`,
          rowCount: outlierCount,
          percentage: Number(((outlierCount / Math.max(1, totalRows)) * 100).toFixed(2)),
          sampleValues: [minVal, maxVal],
          recommendedAction: {
            actionType: 'HANDLE_OUTLIERS',
            label: `Cap/Replace Outliers in ${col}`,
            parameters: { strategy: 'cap' },
          },
          status: 'open',
          createdAt: new Date().toISOString(),
        });
      }

      // Constant column issue
      if (uniqueCount === 1 && totalRows > 5) {
        formatIssueCount++;
        issues.push({
          id: crypto.randomUUID(),
          datasetId,
          datasetVersionId,
          columnName: col,
          issueType: 'CONSTANT_COLUMN',
          severity: 'low',
          description: `Column "${col}" contains identical values for all rows (100% constant). May have limited analytical value.`,
          rowCount: totalRows,
          percentage: 100,
          sampleValues: [topValues[0]?.value],
          recommendedAction: {
            actionType: 'REMOVE_COLUMN',
            label: `Remove Constant Column ${col}`,
          },
          status: 'open',
          createdAt: new Date().toISOString(),
        });
      }

      // High cardinality issue
      if (uniquePct > 98 && totalRows > 50 && detectedType === 'TEXT') {
        issues.push({
          id: crypto.randomUUID(),
          datasetId,
          datasetVersionId,
          columnName: col,
          issueType: 'HIGH_CARDINALITY',
          severity: 'info',
          description: `Column "${col}" has ${uniquePct}% unique values. Likely an identifier column.`,
          rowCount: totalRows,
          percentage: uniquePct,
          sampleValues: nonNullRaw.slice(0, 3),
          recommendedAction: {
            actionType: 'KEEP_IDENTIFIER',
            label: `Keep as Identifier`,
          },
          status: 'open',
          createdAt: new Date().toISOString(),
        });
      }

      // Categorical standardization variants check
      if (detectedType === 'TEXT' && uniqueCount > 1 && uniqueCount < 50) {
        const variantsMap = new Map<string, string[]>();
        for (const valStr of freqMap.keys()) {
          const normalizedKey = valStr.trim().toLowerCase().replace(/[-_]/g, ' ');
          if (!variantsMap.has(normalizedKey)) {
            variantsMap.set(normalizedKey, []);
          }
          variantsMap.get(normalizedKey)!.push(valStr);
        }

        const suspiciousInconsistent = Array.from(variantsMap.values()).filter((v) => v.length > 1);
        if (suspiciousInconsistent.length > 0) {
          formatIssueCount += suspiciousInconsistent.length;
          issues.push({
            id: crypto.randomUUID(),
            datasetId,
            datasetVersionId,
            columnName: col,
            issueType: 'CATEGORY_INCONSISTENCY',
            severity: 'medium',
            description: `Column "${col}" contains ${suspiciousInconsistent.length} variant group(s) with inconsistent formatting/casing (e.g. ${suspiciousInconsistent[0].join(', ')}).`,
            rowCount: suspiciousInconsistent.reduce((acc, v) => acc + v.length, 0),
            percentage: Number(((suspiciousInconsistent.length / Math.max(1, totalRows)) * 100).toFixed(2)),
            sampleValues: suspiciousInconsistent[0],
            recommendedAction: {
              actionType: 'STANDARDIZE_CATEGORY',
              label: `Standardize Categories in ${col}`,
              parameters: { target: suspiciousInconsistent[0][0] },
            },
            status: 'open',
            createdAt: new Date().toISOString(),
          });
        }
      }
    }

    // 3. Check Numerical Correlation matrix
    const correlations: { col1: string; col2: string; correlation: number }[] = [];
    if (numericalColumns.length >= 2) {
      for (let i = 0; i < numericalColumns.length; i++) {
        for (let j = i + 1; j < numericalColumns.length; j++) {
          const col1 = numericalColumns[i];
          const col2 = numericalColumns[j];
          const len = Math.min(col1.values.length, col2.values.length);
          if (len > 5) {
            const m1 = col1.values.reduce((a, b) => a + b, 0) / len;
            const m2 = col2.values.reduce((a, b) => a + b, 0) / len;
            let num = 0;
            let d1 = 0;
            let d2 = 0;
            for (let k = 0; k < len; k++) {
              const diff1 = col1.values[k] - m1;
              const diff2 = col2.values[k] - m2;
              num += diff1 * diff2;
              d1 += diff1 * diff1;
              d2 += diff2 * diff2;
            }
            const denom = Math.sqrt(d1 * d2);
            if (denom > 0) {
              const corr = Number((num / denom).toFixed(2));
              if (Math.abs(corr) > 0.85) {
                correlations.push({ col1: col1.name, col2: col2.name, correlation: corr });
                issues.push({
                  id: crypto.randomUUID(),
                  datasetId,
                  datasetVersionId,
                  columnName: col1.name,
                  issueType: 'CORRELATION',
                  severity: 'info',
                  description: `High correlation (${corr}) detected between "${col1.name}" and "${col2.name}". Redundant information potential.`,
                  rowCount: totalRows,
                  percentage: 100,
                  sampleValues: [corr],
                  recommendedAction: {
                    actionType: 'REVIEW_CORRELATION',
                    label: `Review Redundant Columns`,
                  },
                  status: 'open',
                  createdAt: new Date().toISOString(),
                });
              }
            }
          }
        }
      }
    }

    // 4. Data Quality Score Calculations (0-100)
    const totalCells = Math.max(1, totalRows * totalColumns);
    const completenessScore = Math.max(0, Math.min(100, Number((((totalCells - missingCellCount) / totalCells) * 100).toFixed(1))));
    const duplicateRate = Number(((duplicateRowCount / Math.max(1, totalRows)) * 100).toFixed(1));
    const uniquenessScore = Math.max(0, Math.min(100, 100 - duplicateRate));

    const invalidRate = Number(((invalidEntriesCount / totalCells) * 100).toFixed(1));
    const accuracyScore = Math.max(0, Math.min(100, 100 - invalidRate - Number(((outlierCountTotal / totalCells) * 50).toFixed(1))));

    const formatRate = Number(((formatIssueCount / Math.max(1, totalColumns)) * 10).toFixed(1));
    const consistencyScore = Math.max(0, Math.min(100, 100 - formatRate));

    const validityScore = Math.max(0, Math.min(100, 100 - Number(((typeErrorCount / totalCells) * 100).toFixed(1))));
    const freshnessScore = 95; // Default baseline freshness for imported dataset

    const overallScore = Math.round(
      completenessScore * 0.35 +
      uniquenessScore * 0.2 +
      accuracyScore * 0.2 +
      consistencyScore * 0.15 +
      validityScore * 0.1
    );

    const scores: DataQualityScores = {
      overallScore: Math.max(0, Math.min(100, overallScore)),
      completenessScore,
      accuracyScore,
      consistencyScore,
      validityScore,
      uniquenessScore,
      freshnessScore,
    };

    const counts: IssueSummaryCounts = {
      missingValues: missingCellCount,
      duplicates: duplicateRowCount,
      invalidValues: invalidEntriesCount,
      outliers: outlierCountTotal,
      typeErrors: typeErrorCount,
      formatIssues: formatIssueCount,
      piiCount: piiDetectCount,
      totalIssues: issues.length,
    };

    return {
      scores,
      counts,
      issues,
      profiles,
      correlations,
    };
  }
}
