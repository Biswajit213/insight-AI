import { ColumnDataType, ColumnSummaryStats } from '../types/dataset';

export const inferDataType = (values: unknown[]): ColumnDataType => {
  const nonNulls = values.filter((v) => v !== null && v !== undefined && v !== '');
  if (nonNulls.length === 0) return 'string';

  let isNum = true;
  let isBool = true;
  let isDate = true;

  for (const val of nonNulls.slice(0, 100)) { // Sample up to 100 items
    if (typeof val === 'boolean' || val === 'true' || val === 'false') {
      isNum = false;
      isDate = false;
    } else if (typeof val === 'number') {
      isBool = false;
      isDate = false;
    } else if (typeof val === 'string') {
      isBool = isBool && (val.toLowerCase() === 'true' || val.toLowerCase() === 'false');
      isNum = isNum && !isNaN(Number(val)) && val.trim() !== '';
      isDate = isDate && !isNaN(Date.parse(val)) && isNaN(Number(val));
    } else if (val instanceof Date) {
      isNum = false;
      isBool = false;
    }
  }

  if (isBool) return 'boolean';
  if (isNum) return 'number';
  if (isDate) return 'date';
  return 'string';
};

export const calculateColumnStats = (colName: string, values: unknown[]): ColumnSummaryStats => {
  const totalCount = values.length;
  const nonNullValues = values.filter((v) => v !== null && v !== undefined && v !== '');
  const nullCount = totalCount - nonNullValues.length;

  const dataType = inferDataType(values);
  const uniqueSet = new Set(nonNullValues.map(v => String(v)));
  const uniqueCount = uniqueSet.size;

  const stats: ColumnSummaryStats = {
    name: colName,
    dataType,
    nullCount,
    uniqueCount,
  };

  if (dataType === 'number') {
    const numericValues = nonNullValues.map(v => Number(v)).filter(n => !isNaN(n));
    if (numericValues.length > 0) {
      numericValues.sort((a, b) => a - b);
      const sum = numericValues.reduce((acc, curr) => acc + curr, 0);
      const mean = sum / numericValues.length;
      const min = numericValues[0];
      const max = numericValues[numericValues.length - 1];

      // Median
      const mid = Math.floor(numericValues.length / 2);
      const median = numericValues.length % 2 !== 0
        ? numericValues[mid]
        : (numericValues[mid - 1] + numericValues[mid]) / 2;

      // Standard Deviation
      const variance = numericValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / numericValues.length;
      const stdDev = Math.sqrt(variance);

      stats.min = min;
      stats.max = max;
      stats.mean = Math.round(mean * 100) / 100;
      stats.median = Math.round(median * 100) / 100;
      stats.stdDev = Math.round(stdDev * 100) / 100;
    }
  } else if (dataType === 'string') {
    // Frequency distribution for top values
    const freqMap: Record<string, number> = {};
    for (const val of nonNullValues) {
      const strVal = String(val);
      freqMap[strVal] = (freqMap[strVal] || 0) + 1;
    }

    const topValues = Object.entries(freqMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([value, count]) => ({ value, count }));

    stats.topValues = topValues;
  } else if (dataType === 'date') {
    const timestamps = nonNullValues
      .map(v => (v instanceof Date ? v.getTime() : Date.parse(String(v))))
      .filter(t => !isNaN(t));

    if (timestamps.length > 0) {
      timestamps.sort((a, b) => a - b);
      stats.minDate = new Date(timestamps[0]).toISOString();
      stats.maxDate = new Date(timestamps[timestamps.length - 1]).toISOString();
    }
  }

  return stats;
};

export const detectDuplicateRowsCount = (rows: Record<string, unknown>[]): number => {
  const seen = new Set<string>();
  let duplicates = 0;

  for (const row of rows) {
    const serialized = JSON.stringify(row);
    if (seen.has(serialized)) {
      duplicates++;
    } else {
      seen.add(serialized);
    }
  }

  return duplicates;
};
