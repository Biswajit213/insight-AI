import { supabaseAdmin } from '../config/supabase';
import { Anomaly } from '../types/insight';
import { AnalyticsService } from './analytics.service';
import { DatasetService } from './dataset.service';
import { NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

export class AnomalyService {
  /**
   * Run Z-score statistical anomaly detection across ALL numeric columns
   * of a dataset. Stores results in the anomalies table.
   */
  public static async detectAndStoreAnomalies(
    userId: string,
    datasetId: string
  ): Promise<Anomaly[]> {
    await DatasetService.getDatasetById(userId, datasetId);
    const columns = await DatasetService.getDatasetColumns(userId, datasetId);
    const rows = DatasetService.getDatasetMemoryRows(datasetId);

    if (rows.length === 0) {
      return [];
    }

    // Run detection on ALL numeric columns (not just the first one)
    const numericCols = columns.filter(
      (c) => c.data_type === 'number' || c.data_type === 'integer' || c.data_type === 'float'
    );

    if (numericCols.length === 0) return [];

    const allDetected: Anomaly[] = [];

    for (const col of numericCols) {
      const detected = AnalyticsService.detectAnomalies(rows, col.column_name);

      for (const d of detected) {
        allDetected.push({
          id: crypto.randomUUID(),
          user_id: userId,
          dataset_id: datasetId,
          metric: d.metric,
          description: `Statistical outlier in \`${d.metric}\`: value ${d.actual.toLocaleString()} deviates significantly from expected mean of ${d.expected.toLocaleString()} (Z-score method)`,
          expected_value: d.expected,
          actual_value: d.actual,
          severity: d.severity,
          status: 'open',
          detected_at: new Date().toISOString(),
        });
      }
    }

    // Also detect data quality anomalies (missing + duplicates)
    const dataset = await DatasetService.getDatasetById(userId, datasetId);
    const missingCols = columns.filter((c) => c.missing_values > 0);

    for (const col of missingCols) {
      const pct = Math.round((col.missing_values / rows.length) * 100);
      allDetected.push({
        id: crypto.randomUUID(),
        user_id: userId,
        dataset_id: datasetId,
        metric: `${col.column_name} — Missing Values`,
        description: `Column \`${col.column_name}\` has ${col.missing_values} missing values (${pct}% of rows)`,
        expected_value: 0,
        actual_value: col.missing_values,
        severity: pct > 30 ? 'critical' : pct > 15 ? 'high' : pct > 5 ? 'medium' : 'low',
        status: 'open',
        detected_at: new Date().toISOString(),
      });
    }

    // Persist to DB (upsert-style: delete old open ones first, then insert)
    if (allDetected.length > 0) {
      try {
        // Remove previously detected open anomalies for this dataset to avoid duplicates
        await supabaseAdmin
          .from('anomalies')
          .delete()
          .eq('dataset_id', datasetId)
          .eq('user_id', userId)
          .eq('status', 'open');

        await supabaseAdmin.from('anomalies').insert(
          allDetected.map((a) => ({
            id: a.id,
            user_id: a.user_id,
            dataset_id: a.dataset_id,
            metric: a.metric,
            description: a.description,
            expected_value: a.expected_value,
            actual_value: a.actual_value,
            severity: a.severity,
            status: a.status,
          }))
        );
      } catch (err) {
        logger.warn('Failed to persist anomalies to DB:', err);
      }
    }

    return allDetected;
  }

  /** Get all anomalies for a user, optionally filtered by dataset */
  public static async getUserAnomalies(userId: string, datasetId?: string): Promise<Anomaly[]> {
    try {
      let query = supabaseAdmin
        .from('anomalies')
        .select('*')
        .eq('user_id', userId);

      if (datasetId) query = query.eq('dataset_id', datasetId);

      const { data, error } = await query.order('detected_at', { ascending: false });

      if (!error && data) return data as Anomaly[];
    } catch (err) {
      logger.warn('Failed to fetch anomalies:', err);
    }
    return [];
  }

  /** Update anomaly status */
  public static async resolveAnomaly(
    userId: string,
    anomalyId: string,
    status: 'reviewed' | 'resolved' | 'dismissed' = 'resolved'
  ): Promise<Anomaly> {
    try {
      const { data, error } = await supabaseAdmin
        .from('anomalies')
        .update({
          status,
          resolved_at: status !== 'reviewed' ? new Date().toISOString() : null,
        })
        .eq('id', anomalyId)
        .eq('user_id', userId)
        .select()
        .single();

      if (!error && data) return data as Anomaly;
    } catch (err) {
      logger.warn('Failed to resolve anomaly:', err);
    }

    throw new NotFoundError('Anomaly not found or permission denied');
  }
}
