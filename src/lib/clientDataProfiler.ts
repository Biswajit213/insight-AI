import type {
  DataQualityScanResult,
  DataQualityIssueItem,
  DetailedColumnProfile,
  DataQualityScores,
  IssueSummaryCounts,
  DatasetVersionItem,
  AICleaningSuggestion,
} from '../types/cleaning';

export function isValueMissing(val: unknown): boolean {
  if (val === null || val === undefined) return true;
  if (typeof val === 'number') return isNaN(val);
  const str = String(val).trim().toLowerCase();
  return ['null', 'none', 'n/a', 'na', '-', 'unknown', 'not available', 'undefined', ''].includes(str);
}

export function detectPII(colName: string, values: unknown[]): string | null {
  const colLower = colName.toLowerCase();
  if (colLower.includes('email')) return 'EMAIL';
  if (colLower.includes('phone') || colLower.includes('contact')) return 'PHONE';
  if (colLower.includes('ssn') || colLower.includes('tax') || colLower.includes('card')) return 'CREDIT_CARD';
  if (colLower.includes('name') || colLower.includes('customer_name')) return 'NAME';

  const valid = values.filter((v) => !isValueMissing(v));
  if (valid.length === 0) return null;

  let emailCount = 0;
  let phoneCount = 0;
  for (const v of valid) {
    const s = String(v).trim();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) emailCount++;
    if (/^\+?\d{7,15}$/.test(s.replace(/[\s-]/g, ''))) phoneCount++;
  }

  if (emailCount >= Math.max(1, valid.length * 0.2)) return 'EMAIL';
  if (phoneCount >= Math.max(1, valid.length * 0.2)) return 'PHONE';
  return null;
}

export function maskPIIValue(val: unknown, piiType: string): string {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  if (!str) return '';

  if (piiType === 'EMAIL') {
    const parts = str.split('@');
    if (parts.length === 2) {
      const name = parts[0];
      const maskedName = name.length > 2 ? `${name[0]}***${name[name.length - 1]}` : '***';
      return `${maskedName}@${parts[1]}`;
    }
  } else if (piiType === 'PHONE') {
    const digits = str.replace(/\D/g, '');
    if (digits.length >= 4) return `***-***-${digits.slice(-4)}`;
  }
  return '***MASKED***';
}

export function evaluateRuleOnRow(
  row: Record<string, unknown>,
  rule: { columnName: string; operator: string; value?: string; minValue?: number; maxValue?: number }
): boolean {
  const raw = row[rule.columnName];
  if (rule.operator === 'is_null') return raw === null || raw === undefined || String(raw).trim() === '' || String(raw).toLowerCase() === 'null';
  if (rule.operator === 'is_not_null') return !(raw === null || raw === undefined || String(raw).trim() === '' || String(raw).toLowerCase() === 'null');

  if (raw === null || raw === undefined) return false;

  const numVal = Number(String(raw).replace(/[\$,\s₹]/g, ''));
  const targetNum = Number(rule.value);

  switch (rule.operator) {
    case 'greater_than':
      return !isNaN(numVal) && !isNaN(targetNum) ? numVal > targetNum : String(raw) > (rule.value || '');
    case 'less_than':
      return !isNaN(numVal) && !isNaN(targetNum) ? numVal < targetNum : String(raw) < (rule.value || '');
    case 'between':
      return !isNaN(numVal) && rule.minValue !== undefined && rule.maxValue !== undefined
        ? numVal >= rule.minValue && numVal <= rule.maxValue
        : true;
    case 'equals':
      return String(raw).trim().toLowerCase() === String(rule.value || '').trim().toLowerCase();
    case 'not_equals':
      return String(raw).trim().toLowerCase() !== String(rule.value || '').trim().toLowerCase();
    case 'contains':
      return String(raw).toLowerCase().includes(String(rule.value || '').toLowerCase());
    default:
      return true;
  }
}

export function applyCustomRuleClientSide(
  currentScan: DataQualityScanResult,
  rule: { columnName: string; operator: string; value?: string; minValue?: number; maxValue?: number; ruleDescription?: string },
  rows: Record<string, unknown>[]
): DataQualityScanResult {
  const failingRows = rows.filter((r) => !evaluateRuleOnRow(r, rule));
  const violationCount = failingRows.length;

  const newIssue: DataQualityIssueItem = {
    id: crypto.randomUUID(),
    datasetId: currentScan.datasetId,
    columnName: rule.columnName,
    issueType: 'INVALID_VALUE',
    severity: violationCount > Math.max(1, rows.length * 0.2) ? 'high' : 'medium',
    description: rule.ruleDescription || `Custom validation rule failed on ${violationCount} row(s) for column "${rule.columnName}".`,
    rowCount: violationCount,
    percentage: Number(((violationCount / Math.max(1, rows.length)) * 100).toFixed(1)),
    sampleValues: failingRows.slice(0, 3).map((r) => String(r[rule.columnName])),
    recommendedAction: {
      actionType: 'IMPUTE_MISSING',
      label: `Fix Rule Violation in ${rule.columnName}`,
      parameters: { strategy: 'mode' },
    },
    status: 'open',
    createdAt: new Date().toISOString(),
  };

  const updatedIssues = [newIssue, ...currentScan.issues];
  const totalIssues = updatedIssues.length;
  const validityPenalty = Math.min(40, violationCount * 5);
  const updatedValidity = Math.max(0, currentScan.scores.validityScore - validityPenalty);

  const updatedOverall = Math.max(
    0,
    Math.round(
      currentScan.scores.completenessScore * 0.35 +
      currentScan.scores.uniquenessScore * 0.2 +
      currentScan.scores.accuracyScore * 0.2 +
      currentScan.scores.consistencyScore * 0.15 +
      updatedValidity * 0.1
    )
  );

  return {
    ...currentScan,
    scores: {
      ...currentScan.scores,
      validityScore: updatedValidity,
      overallScore: updatedOverall,
    },
    counts: {
      ...currentScan.counts,
      invalidValues: currentScan.counts.invalidValues + violationCount,
      totalIssues,
    },
    issues: updatedIssues,
  };
}

export function profileDatasetClientSide(
  datasetId: string,
  datasetName: string,
  rows: Record<string, unknown>[]
): DataQualityScanResult {
  const totalRows = rows.length;
  const headers = totalRows > 0 ? Object.keys(rows[0]) : ['ID', 'Category', 'Value'];
  const totalColumns = headers.length;

  const profiles: DetailedColumnProfile[] = [];
  const issues: DataQualityIssueItem[] = [];

  let missingCellCount = 0;
  let duplicateRowCount = 0;
  let outlierCountTotal = 0;
  let formatIssueCount = 0;
  let piiDetectCount = 0;

  // 1. Check duplicate rows
  const seenSignatures = new Set<string>();
  for (const r of rows) {
    const sig = JSON.stringify(r);
    if (seenSignatures.has(sig)) duplicateRowCount++;
    else seenSignatures.add(sig);
  }

  if (duplicateRowCount > 0) {
    issues.push({
      id: crypto.randomUUID(),
      datasetId,
      issueType: 'DUPLICATE',
      severity: duplicateRowCount > totalRows * 0.1 ? 'critical' : 'high',
      description: `${duplicateRowCount} duplicate record(s) detected in the dataset.`,
      rowCount: duplicateRowCount,
      percentage: Number(((duplicateRowCount / Math.max(1, totalRows)) * 100).toFixed(1)),
      sampleValues: rows.slice(0, 2),
      recommendedAction: {
        actionType: 'REMOVE_DUPLICATES',
        label: 'Remove All Duplicates',
        parameters: { strategy: 'keep_first' },
      },
      status: 'open',
      createdAt: new Date().toISOString(),
    });
  }

  // 2. Profile columns
  for (const col of headers) {
    const rawValues = rows.map((r) => r[col]);
    const missingCount = rawValues.filter((v) => isValueMissing(v)).length;
    missingCellCount += missingCount;

    const nonNull = rawValues.filter((v) => !isValueMissing(v));
    const nullPct = Number(((missingCount / Math.max(1, totalRows)) * 100).toFixed(1));

    // Type inference
    let numCount = 0;
    const numVals: number[] = [];
    for (const v of nonNull) {
      const clean = String(v).replace(/[\$,\s₹]/g, '').replace(/%$/, '');
      const n = Number(clean);
      if (String(v).trim() !== '' && !isNaN(n)) {
        numCount++;
        numVals.push(n);
      }
    }

    const nonNullLen = Math.max(1, nonNull.length);
    let dataType = 'TEXT';
    if (numCount / nonNullLen > 0.8) dataType = 'NUMBER';

    // Unique count & Top values
    const freq = new Map<string, number>();
    for (const v of nonNull) {
      const s = String(v).trim();
      freq.set(s, (freq.get(s) || 0) + 1);
    }

    const uniqueCount = freq.size;
    const uniquePct = Number(((uniqueCount / Math.max(1, totalRows)) * 100).toFixed(1));

    let minVal: string | number | null = null;
    let maxVal: string | number | null = null;
    let meanVal: number | null = null;
    let medianVal: number | null = null;
    let stdDev: number | null = null;
    let outlierCount = 0;

    if (dataType === 'NUMBER' && numVals.length > 0) {
      numVals.sort((a, b) => a - b);
      minVal = numVals[0];
      maxVal = numVals[numVals.length - 1];
      const sum = numVals.reduce((a, b) => a + b, 0);
      meanVal = Number((sum / numVals.length).toFixed(2));
      const mid = Math.floor(numVals.length / 2);
      medianVal = numVals.length % 2 !== 0 ? numVals[mid] : (numVals[mid - 1] + numVals[mid]) / 2;

      const q1 = numVals[Math.floor(numVals.length * 0.25)] || numVals[0];
      const q3 = numVals[Math.floor(numVals.length * 0.75)] || numVals[numVals.length - 1];
      const iqr = q3 - q1;
      const lower = q1 - 1.5 * iqr;
      const upper = q3 + 1.5 * iqr;
      outlierCount = numVals.filter((v) => v < lower || v > upper).length;
      outlierCountTotal += outlierCount;
    }

    const sortedTop = Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([value, count]) => ({
        value,
        count,
        percentage: Number(((count / Math.max(1, totalRows)) * 100).toFixed(1)),
      }));

    const piiType = detectPII(col, nonNull.slice(0, 30));
    if (piiType) {
      piiDetectCount++;
      issues.push({
        id: crypto.randomUUID(),
        datasetId,
        columnName: col,
        issueType: 'PII',
        severity: 'high',
        description: `Potential sensitive PII field (${piiType}) detected in column "${col}".`,
        rowCount: nonNull.length,
        percentage: Number(((nonNull.length / Math.max(1, totalRows)) * 100).toFixed(1)),
        sampleValues: nonNull.slice(0, 2).map((v) => maskPIIValue(v, piiType)),
        recommendedAction: {
          actionType: 'MASK_PII',
          label: `Mask ${piiType} Data`,
          parameters: { piiType },
        },
        status: 'open',
        createdAt: new Date().toISOString(),
      });
    }

    profiles.push({
      columnName: col,
      dataType,
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
      cardinality: uniqueCount === 1 ? 'constant' : uniquePct > 90 ? 'high' : 'medium',
      outlierCount,
      topValues: sortedTop,
      detectedPII: piiType,
    });

    if (missingCount > 0) {
      issues.push({
        id: crypto.randomUUID(),
        datasetId,
        columnName: col,
        issueType: 'MISSING_VALUE',
        severity: nullPct > 20 ? 'high' : 'medium',
        description: `Column "${col}" has ${missingCount} missing value(s) (${nullPct}%).`,
        rowCount: missingCount,
        percentage: nullPct,
        sampleValues: ['NULL', 'N/A'],
        recommendedAction: {
          actionType: 'IMPUTE_MISSING',
          label: `Impute Missing in ${col}`,
          parameters: { strategy: dataType === 'NUMBER' ? 'median' : 'mode' },
        },
        status: 'open',
        createdAt: new Date().toISOString(),
      });
    }

    if (outlierCount > 0) {
      issues.push({
        id: crypto.randomUUID(),
        datasetId,
        columnName: col,
        issueType: 'OUTLIER',
        severity: 'medium',
        description: `Column "${col}" contains ${outlierCount} statistical outlier(s).`,
        rowCount: outlierCount,
        percentage: Number(((outlierCount / Math.max(1, totalRows)) * 100).toFixed(1)),
        sampleValues: [minVal, maxVal],
        recommendedAction: {
          actionType: 'HANDLE_OUTLIERS',
          label: `Cap Outliers in ${col}`,
          parameters: { strategy: 'cap' },
        },
        status: 'open',
        createdAt: new Date().toISOString(),
      });
    }

    if (dataType === 'TEXT' && uniqueCount > 1 && uniqueCount < 30) {
      const lowerMap = new Map<string, string[]>();
      for (const valStr of freq.keys()) {
        const norm = valStr.trim().toLowerCase();
        if (!lowerMap.has(norm)) lowerMap.set(norm, []);
        lowerMap.get(norm)!.push(valStr);
      }
      const variants = Array.from(lowerMap.values()).filter((v) => v.length > 1);
      if (variants.length > 0) {
        formatIssueCount += variants.length;
        issues.push({
          id: crypto.randomUUID(),
          datasetId,
          columnName: col,
          issueType: 'CATEGORY_INCONSISTENCY',
          severity: 'medium',
          description: `Column "${col}" has ${variants.length} variant group(s) with inconsistent capitalization (e.g. ${variants[0].join(', ')}).`,
          rowCount: variants[0].length,
          percentage: Number(((variants[0].length / Math.max(1, totalRows)) * 100).toFixed(1)),
          sampleValues: variants[0],
          recommendedAction: {
            actionType: 'STANDARDIZE_CATEGORY',
            label: `Standardize Categories in ${col}`,
            parameters: { target: variants[0][0] },
          },
          status: 'open',
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  // 3. Compute dynamic score
  const totalCells = Math.max(1, totalRows * totalColumns);
  const completenessScore = Math.max(0, Math.min(100, Math.round(((totalCells - missingCellCount) / totalCells) * 100)));
  const uniquenessScore = Math.max(0, Math.min(100, 100 - Math.round((duplicateRowCount / Math.max(1, totalRows)) * 100)));
  const accuracyScore = Math.max(0, Math.min(100, 100 - Math.round((outlierCountTotal / totalCells) * 50)));
  const consistencyScore = Math.max(0, Math.min(100, 100 - formatIssueCount * 5));
  const validityScore = 95;
  const freshnessScore = 90;

  const overallScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        completenessScore * 0.35 +
        uniquenessScore * 0.2 +
        accuracyScore * 0.2 +
        consistencyScore * 0.15 +
        validityScore * 0.1
      )
    )
  );

  const scores: DataQualityScores = {
    overallScore,
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
    invalidValues: 0,
    outliers: outlierCountTotal,
    typeErrors: 0,
    formatIssues: formatIssueCount,
    piiCount: piiDetectCount,
    totalIssues: issues.length,
  };

  const version: DatasetVersionItem = {
    id: 'v1-active',
    datasetId,
    versionNumber: 1,
    versionLabel: 'v1 Original',
    storagePath: `datasets/${datasetId}/v1.csv`,
    rowCount: totalRows,
    columnCount: totalColumns,
    dataQualityScore: overallScore,
    createdAt: new Date().toISOString(),
  };

  return {
    datasetId,
    version,
    scores,
    counts,
    issues,
    profiles,
    scannedAt: new Date().toISOString(),
  };
}

export function generateClientAISuggestions(issues: DataQualityIssueItem[]): AICleaningSuggestion[] {
  return issues.slice(0, 5).map((iss) => ({
    id: crypto.randomUUID(),
    issueType: iss.issueType,
    severity: iss.severity,
    columnName: iss.columnName,
    problem: iss.description,
    recommendation: iss.recommendedAction.label,
    confidence: 0.94,
    actionParams: {
      operationType: iss.recommendedAction.actionType,
      parameters: iss.recommendedAction.parameters || {},
    },
  }));
}
