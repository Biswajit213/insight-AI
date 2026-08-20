import { DataProfilerService } from './data-profiler.service';
import { PIIDetectorService } from './pii-detector.service';
import { PreviewCleanResult } from '../types/cleaning';

export interface CleaningOperationStep {
  operationType: string;
  columnName?: string;
  parameters?: Record<string, unknown>;
}

export class DataCleaningEngineService {
  public static previewCleaning(
    headers: string[],
    rows: Record<string, unknown>[],
    steps: CleaningOperationStep[]
  ): PreviewCleanResult {
    const beforeSample = rows.slice(0, 100).map((r) => ({ ...r }));
    const afterRows = this.applyPipeline(headers, [...beforeSample], steps);

    const sampleDiffs: PreviewCleanResult['sampleDiffs'] = [];
    let rowsAffected = 0;
    const affectedCols = new Set<string>();

    for (let i = 0; i < Math.min(beforeSample.length, afterRows.length); i++) {
      const bRow = beforeSample[i];
      const aRow = afterRows[i];
      let rowHasChanged = false;

      for (const h of headers) {
        if (JSON.stringify(bRow[h]) !== JSON.stringify(aRow[h])) {
          rowHasChanged = true;
          affectedCols.add(h);
          if (sampleDiffs.length < 20) {
            sampleDiffs.push({
              rowIndex: i,
              columnName: h,
              before: bRow[h],
              after: aRow[h],
            });
          }
        }
      }
      if (rowHasChanged) rowsAffected++;
    }

    return {
      beforeRows: beforeSample.slice(0, 15),
      afterRows: afterRows.slice(0, 15),
      rowsAffected: Math.max(rowsAffected, Math.abs(beforeSample.length - afterRows.length)),
      columnsAffected: affectedCols.size,
      sampleDiffs,
    };
  }

  public static applyPipeline(
    headers: string[],
    rows: Record<string, unknown>[],
    steps: CleaningOperationStep[]
  ): Record<string, unknown>[] {
    let currentRows = rows.map((r) => ({ ...r }));

    for (const step of steps) {
      currentRows = this.executeStep(headers, currentRows, step);
    }

    return currentRows;
  }

  private static executeStep(
    _headers: string[],
    rows: Record<string, unknown>[],
    step: CleaningOperationStep
  ): Record<string, unknown>[] {
    const { operationType, columnName, parameters = {} } = step;

    switch (operationType) {
      case 'IMPUTE_MISSING':
      case 'FILL_NULLS': {
        if (!columnName) return rows;
        const strategy = (parameters.strategy as string) || 'median';
        const customValue = parameters.customValue;

        // Calculate replacement value
        let replacement: unknown = customValue;
        if (strategy === 'mean' || strategy === 'median' || strategy === 'mode') {
          const validNums = rows
            .map((r) => r[columnName])
            .filter((v) => !DataProfilerService.isValueMissing(v))
            .map((v) => Number(String(v).replace(/[$,\s]/g, '')))
            .filter((v) => !isNaN(v));

          if (strategy === 'mean' && validNums.length > 0) {
            replacement = Number((validNums.reduce((a, b) => a + b, 0) / validNums.length).toFixed(2));
          } else if (strategy === 'median' && validNums.length > 0) {
            validNums.sort((a, b) => a - b);
            const mid = Math.floor(validNums.length / 2);
            replacement = validNums.length % 2 !== 0 ? validNums[mid] : Number(((validNums[mid - 1] + validNums[mid]) / 2).toFixed(2));
          } else if (strategy === 'mode') {
            const freq = new Map<string, number>();
            for (const r of rows) {
              const val = r[columnName];
              if (!DataProfilerService.isValueMissing(val)) {
                const s = String(val).trim();
                freq.set(s, (freq.get(s) || 0) + 1);
              }
            }
            let maxF = 0;
            let topKey = 'Unknown';
            for (const [k, count] of freq.entries()) {
              if (count > maxF) {
                maxF = count;
                topKey = k;
              }
            }
            replacement = topKey;
          }
        }

        if (replacement === undefined) replacement = 'Unknown';

        // Apply imputation
        let prevVal: unknown = replacement;
        return rows.map((r) => {
          const copy = { ...r };
          const cur = copy[columnName];

          if (strategy === 'forward_fill') {
            if (!DataProfilerService.isValueMissing(cur)) {
              prevVal = cur;
            } else {
              copy[columnName] = prevVal;
            }
          } else if (DataProfilerService.isValueMissing(cur)) {
            copy[columnName] = replacement;
          }
          return copy;
        });
      }

      case 'REMOVE_DUPLICATES': {
        const strategy = (parameters.strategy as string) || 'keep_first';
        const keyColumn = parameters.keyColumn as string | undefined;

        const seen = new Set<string>();
        const result: Record<string, unknown>[] = [];

        for (const r of rows) {
          const sig = keyColumn ? String(r[keyColumn] || '') : JSON.stringify(r);
          if (!seen.has(sig)) {
            seen.add(sig);
            result.push(r);
          } else if (strategy === 'keep_last') {
            // Replace previous occurrence
            const idx = result.findIndex((item) => (keyColumn ? String(item[keyColumn] || '') === sig : JSON.stringify(item) === sig));
            if (idx >= 0) result[idx] = r;
          }
        }
        return result;
      }

      case 'STANDARDIZE_TEXT':
      case 'STANDARDIZE_CATEGORY':
      case 'TRIM_WHITESPACE': {
        if (!columnName) return rows;
        const casing = (parameters.casing as string) || 'title'; // 'lowercase' | 'uppercase' | 'title' | 'none'
        const trim = parameters.trim !== false;
        const categoryMap = (parameters.categoryMap as Record<string, string>) || {};

        return rows.map((r) => {
          const copy = { ...r };
          let val = copy[columnName];
          if (val !== null && val !== undefined) {
            let str = String(val);
            if (trim) str = str.trim().replace(/\s+/g, ' ');

            // Category mappings (e.g. North/north/NORTH -> North)
            if (categoryMap[str]) {
              str = categoryMap[str];
            } else if (parameters.target) {
              const targetStr = String(parameters.target);
              if (str.toLowerCase() === targetStr.toLowerCase()) {
                str = targetStr;
              }
            } else if (casing === 'lowercase') {
              str = str.toLowerCase();
            } else if (casing === 'uppercase') {
              str = str.toUpperCase();
            } else if (casing === 'title') {
              str = str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
            }

            copy[columnName] = str;
          }
          return copy;
        });
      }

      case 'CAST_TYPE':
      case 'CONVERT_FORMAT': {
        if (!columnName) return rows;
        const targetType = (parameters.targetType as string) || 'NUMBER';

        return rows.map((r) => {
          const copy = { ...r };
          const raw = copy[columnName];
          if (DataProfilerService.isValueMissing(raw)) return copy;

          const str = String(raw).trim();

          if (targetType === 'NUMBER' || targetType === 'INTEGER' || targetType === 'DECIMAL' || targetType === 'CURRENCY') {
            const cleanStr = str.replace(/[$,\s₹€£]/g, '').replace(/%$/, '');
            const num = Number(cleanStr);
            if (!isNaN(num)) {
              copy[columnName] = targetType === 'INTEGER' ? Math.round(num) : num;
            }
          } else if (targetType === 'PERCENTAGE') {
            const cleanStr = str.replace(/%/g, '').trim();
            const num = Number(cleanStr);
            if (!isNaN(num)) {
              copy[columnName] = num > 1 ? Number((num / 100).toFixed(4)) : num;
            }
          } else if (targetType === 'BOOLEAN') {
            if (['true', '1', 'yes', 'y'].includes(str.toLowerCase())) copy[columnName] = true;
            else if (['false', '0', 'no', 'n'].includes(str.toLowerCase())) copy[columnName] = false;
          } else if (targetType === 'DATE') {
            const format = (parameters.dateFormat as string) || 'YYYY-MM-DD';
            const parsed = Date.parse(str);
            if (!isNaN(parsed)) {
              const d = new Date(parsed);
              const yyyy = d.getFullYear();
              const mm = String(d.getMonth() + 1).padStart(2, '0');
              const dd = String(d.getDate()).padStart(2, '0');
              if (format === 'DD/MM/YYYY') copy[columnName] = `${dd}/${mm}/${yyyy}`;
              else if (format === 'MM/DD/YYYY') copy[columnName] = `${mm}/${dd}/${yyyy}`;
              else copy[columnName] = `${yyyy}-${mm}-${dd}`;
            }
          }
          return copy;
        });
      }

      case 'HANDLE_OUTLIERS':
      case 'REMOVE_OUTLIERS': {
        if (!columnName) return rows;
        const strategy = (parameters.strategy as string) || 'cap'; // 'cap' | 'remove' | 'median'

        const nums = rows
          .map((r) => Number(r[columnName]))
          .filter((v) => !isNaN(v));

        if (nums.length < 5) return rows;

        nums.sort((a, b) => a - b);
        const q1 = nums[Math.floor(nums.length * 0.25)];
        const q3 = nums[Math.floor(nums.length * 0.75)];
        const iqr = q3 - q1;
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;
        const median = nums[Math.floor(nums.length / 2)];

        if (strategy === 'remove') {
          return rows.filter((r) => {
            const v = Number(r[columnName]);
            return isNaN(v) || (v >= lowerBound && v <= upperBound);
          });
        }

        return rows.map((r) => {
          const copy = { ...r };
          const v = Number(copy[columnName]);
          if (!isNaN(v)) {
            if (v < lowerBound) copy[columnName] = strategy === 'cap' ? lowerBound : median;
            else if (v > upperBound) copy[columnName] = strategy === 'cap' ? upperBound : median;
          }
          return copy;
        });
      }

      case 'MASK_PII': {
        if (!columnName) return rows;
        const piiType = (parameters.piiType as string) || 'EMAIL';
        return rows.map((r) => {
          const copy = { ...r };
          if (copy[columnName] !== undefined && copy[columnName] !== null) {
            copy[columnName] = PIIDetectorService.maskValue(copy[columnName], piiType);
          }
          return copy;
        });
      }

      case 'REMOVE_COLUMN': {
        if (!columnName) return rows;
        return rows.map((r) => {
          const copy = { ...r };
          delete copy[columnName];
          return copy;
        });
      }

      default:
        return rows;
    }
  }
}
