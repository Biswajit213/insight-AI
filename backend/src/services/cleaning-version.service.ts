import { DatasetService } from './dataset.service';
import { DataProfilerService } from './data-profiler.service';
import { DataCleaningEngineService, CleaningOperationStep } from './data-cleaning-engine.service';
import {
  DatasetVersionItem,
  CleaningOperationRecord,
  ValidationRuleItem,
  ValidationReport,
  CleanExecutionResult,
  DataQualityScanResult,
} from '../types/cleaning';
import { env } from '../config/env';
import { supabaseAdmin } from '../config/supabase';
import { NotFoundError } from '../utils/errors';

interface DatasetVersionStore {
  datasetId: string;
  activeVersionId: string;
  versions: Map<string, DatasetVersionItem>; // versionId -> item
  versionRows: Map<string, Record<string, unknown>[]>; // versionId -> rows
  operations: CleaningOperationRecord[];
  customRules: ValidationRuleItem[];
}

const memoryVersionStores = new Map<string, DatasetVersionStore>();

export class CleaningVersionService {
  private static getOrCreateStore(datasetId: string, initialRows: Record<string, unknown>[]): DatasetVersionStore {
    let store = memoryVersionStores.get(datasetId);
    if (!store) {
      const v1Id = crypto.randomUUID();
      const v1Item: DatasetVersionItem = {
        id: v1Id,
        datasetId,
        versionNumber: 1,
        versionLabel: 'v1 Original',
        storagePath: `datasets/${datasetId}/v1.csv`,
        rowCount: initialRows.length,
        columnCount: initialRows.length > 0 ? Object.keys(initialRows[0]).length : 0,
        dataQualityScore: 85,
        parentVersionId: null,
        createdAt: new Date().toISOString(),
      };

      const versions = new Map<string, DatasetVersionItem>();
      versions.set(v1Id, v1Item);

      const versionRows = new Map<string, Record<string, unknown>[]>();
      versionRows.set(v1Id, initialRows.map((r) => ({ ...r })));

      store = {
        datasetId,
        activeVersionId: v1Id,
        versions,
        versionRows,
        operations: [],
        customRules: [],
      };
      memoryVersionStores.set(datasetId, store);
    }
    return store;
  }

  public static getDatasetRowsForActiveVersion(datasetId: string): Record<string, unknown>[] {
    const defaultRows = DatasetService.getDatasetMemoryRows(datasetId);
    const store = this.getOrCreateStore(datasetId, defaultRows);
    const rows = store.versionRows.get(store.activeVersionId);
    return rows ? rows : defaultRows;
  }

  public static getActiveVersion(datasetId: string): DatasetVersionItem {
    const defaultRows = DatasetService.getDatasetMemoryRows(datasetId);
    const store = this.getOrCreateStore(datasetId, defaultRows);
    return store.versions.get(store.activeVersionId)!;
  }

  public static getVersionsList(datasetId: string): DatasetVersionItem[] {
    const defaultRows = DatasetService.getDatasetMemoryRows(datasetId);
    const store = this.getOrCreateStore(datasetId, defaultRows);
    return Array.from(store.versions.values()).sort((a, b) => b.versionNumber - a.versionNumber);
  }

  public static getCleaningHistory(datasetId: string): CleaningOperationRecord[] {
    const defaultRows = DatasetService.getDatasetMemoryRows(datasetId);
    const store = this.getOrCreateStore(datasetId, defaultRows);
    return [...store.operations].reverse();
  }

  public static runQualityScan(datasetId: string, versionId?: string): DataQualityScanResult {
    const defaultRows = DatasetService.getDatasetMemoryRows(datasetId);
    const store = this.getOrCreateStore(datasetId, defaultRows);

    const targetVersionId = versionId || store.activeVersionId;
    const version = store.versions.get(targetVersionId) || store.versions.get(store.activeVersionId)!;
    const rows = store.versionRows.get(targetVersionId) || defaultRows;

    const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
    const profiler = DataProfilerService.profileDataset(datasetId, version.id, headers, rows);

    // Update version quality score
    version.dataQualityScore = profiler.scores.overallScore;

    return {
      datasetId,
      version,
      scores: profiler.scores,
      counts: profiler.counts,
      issues: profiler.issues,
      profiles: profiler.profiles,
      scannedAt: new Date().toISOString(),
    };
  }

  public static executeCleaningPipeline(
    userId: string,
    datasetId: string,
    steps: CleaningOperationStep[],
    label?: string
  ): CleanExecutionResult {
    const defaultRows = DatasetService.getDatasetMemoryRows(datasetId);
    const store = this.getOrCreateStore(datasetId, defaultRows);

    const currentVersion = store.versions.get(store.activeVersionId)!;
    const currentRows = store.versionRows.get(store.activeVersionId) || defaultRows;
    const headers = currentRows.length > 0 ? Object.keys(currentRows[0]) : [];

    const previousScan = DataProfilerService.profileDataset(datasetId, currentVersion.id, headers, currentRows);
    const previousScore = previousScan.scores.overallScore;

    // Apply transformations
    const newRows = DataCleaningEngineService.applyPipeline(headers, currentRows, steps);

    // Profile cleaned dataset
    const newHeaders = newRows.length > 0 ? Object.keys(newRows[0]) : [];
    const newScan = DataProfilerService.profileDataset(datasetId, undefined, newHeaders, newRows);
    const newScore = newScan.scores.overallScore;

    // Create new version item
    const newVersionNum = store.versions.size + 1;
    const newVersionId = crypto.randomUUID();
    const versionLabel = label || `v${newVersionNum} Cleaned (${steps.length} operation${steps.length > 1 ? 's' : ''})`;

    const newVersionItem: DatasetVersionItem = {
      id: newVersionId,
      datasetId,
      versionNumber: newVersionNum,
      versionLabel,
      storagePath: `datasets/${datasetId}/v${newVersionNum}.csv`,
      rowCount: newRows.length,
      columnCount: newHeaders.length,
      dataQualityScore: newScore,
      parentVersionId: currentVersion.id,
      createdAt: new Date().toISOString(),
    };

    // Store version
    store.versions.set(newVersionId, newVersionItem);
    store.versionRows.set(newVersionId, newRows);
    store.activeVersionId = newVersionId;

    // Record operations log
    for (const step of steps) {
      const opRecord: CleaningOperationRecord = {
        id: crypto.randomUUID(),
        datasetId,
        datasetVersionId: newVersionId,
        operationType: step.operationType,
        columnName: step.columnName,
        parameters: step.parameters || {},
        rowsAffected: Math.abs(currentRows.length - newRows.length) || 1,
        beforeSample: currentRows.slice(0, 3),
        afterSample: newRows.slice(0, 3),
        createdBy: userId,
        createdAt: new Date().toISOString(),
      };
      store.operations.push(opRecord);
    }

    // Run post-cleaning validation
    const validation = this.validateDataset(datasetId, newVersionId);

    // Persist to Supabase if live
    if (env.NODE_ENV !== 'test') {
      try {
        supabaseAdmin.from('dataset_versions').insert({
          id: newVersionItem.id,
          dataset_id: newVersionItem.datasetId,
          version_number: newVersionItem.versionNumber,
          version_label: newVersionItem.versionLabel,
          storage_path: newVersionItem.storagePath,
          row_count: newVersionItem.rowCount,
          column_count: newVersionItem.columnCount,
          data_quality_score: newVersionItem.dataQualityScore,
          parent_version_id: newVersionItem.parentVersionId,
        });
      } catch (_e) {}
    }

    return {
      success: true,
      datasetId,
      newVersion: newVersionItem,
      previousScore,
      newScore,
      scoreImprovement: newScore - previousScore,
      operationsApplied: steps.length,
      validation,
    };
  }

  public static rollbackToVersion(datasetId: string, versionId: string): DatasetVersionItem {
    const defaultRows = DatasetService.getDatasetMemoryRows(datasetId);
    const store = this.getOrCreateStore(datasetId, defaultRows);

    const targetVersion = store.versions.get(versionId);
    if (!targetVersion) {
      throw new NotFoundError(`Version ${versionId} not found.`);
    }

    store.activeVersionId = targetVersion.id;

    // Record rollback operation
    store.operations.push({
      id: crypto.randomUUID(),
      datasetId,
      datasetVersionId: targetVersion.id,
      operationType: 'ROLLBACK_VERSION',
      parameters: { targetVersionLabel: targetVersion.versionLabel },
      rowsAffected: 0,
      beforeSample: [],
      afterSample: [],
      createdAt: new Date().toISOString(),
    });

    return targetVersion;
  }

  public static addCustomRule(datasetId: string, rule: Omit<ValidationRuleItem, 'id' | 'createdAt'>): ValidationRuleItem {
    const defaultRows = DatasetService.getDatasetMemoryRows(datasetId);
    const store = this.getOrCreateStore(datasetId, defaultRows);

    const ruleItem: ValidationRuleItem = {
      ...rule,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    store.customRules.push(ruleItem);
    return ruleItem;
  }

  public static validateDataset(datasetId: string, versionId?: string): ValidationReport {
    const defaultRows = DatasetService.getDatasetMemoryRows(datasetId);
    const store = this.getOrCreateStore(datasetId, defaultRows);

    const targetVersionId = versionId || store.activeVersionId;
    const rows = store.versionRows.get(targetVersionId) || defaultRows;

    const details: ValidationReport['details'] = [];

    // System default rules
    const headers = rows.length > 0 ? Object.keys(rows[0]) : [];

    // Rule 1: No duplicate rows check
    const sigSet = new Set<string>();
    let dups = 0;
    for (const r of rows) {
      const sig = JSON.stringify(r);
      if (sigSet.has(sig)) dups++;
      else sigSet.add(sig);
    }
    details.push({
      ruleId: 'sys-dup-rule',
      description: '0 Duplicate Rows constraint',
      passed: dups === 0,
      violatingRowsCount: dups,
    });

    // Rule 2: Essential null check
    let nullCount = 0;
    for (const r of rows) {
      for (const h of headers) {
        if (DataProfilerService.isValueMissing(r[h])) nullCount++;
      }
    }
    details.push({
      ruleId: 'sys-null-rule',
      description: 'Dataset completeness requirement',
      passed: nullCount === 0,
      violatingRowsCount: nullCount,
    });

    // Run custom rules
    for (const customRule of store.customRules) {
      if (!customRule.isEnabled) continue;

      let violatingCount = 0;
      for (const r of rows) {
        const val = r[customRule.columnName];
        let isValid = true;
        const strVal = String(val ?? '').trim();
        const numVal = Number(strVal);

        switch (customRule.operator) {
          case 'equals':
            isValid = strVal === customRule.value;
            break;
          case 'not_equals':
            isValid = strVal !== customRule.value;
            break;
          case 'greater_than':
            isValid = !isNaN(numVal) && numVal > (customRule.minValue ?? Number(customRule.value ?? 0));
            break;
          case 'less_than':
            isValid = !isNaN(numVal) && numVal < (customRule.maxValue ?? Number(customRule.value ?? 0));
            break;
          case 'between':
            isValid = !isNaN(numVal) && numVal >= (customRule.minValue ?? 0) && numVal <= (customRule.maxValue ?? 100);
            break;
          case 'contains':
            isValid = strVal.toLowerCase().includes((customRule.value || '').toLowerCase());
            break;
          case 'is_null':
            isValid = DataProfilerService.isValueMissing(val);
            break;
          case 'is_not_null':
            isValid = !DataProfilerService.isValueMissing(val);
            break;
        }

        if (!isValid) violatingCount++;
      }

      details.push({
        ruleId: customRule.id,
        description: customRule.ruleDescription,
        passed: violatingCount === 0,
        violatingRowsCount: violatingCount,
      });
    }

    const passedCount = details.filter((d) => d.passed).length;
    const failedCount = details.length - passedCount;

    return {
      overallValid: failedCount === 0,
      passedRulesCount: passedCount,
      failedRulesCount: failedCount,
      details,
      validatedAt: new Date().toISOString(),
    };
  }
}
