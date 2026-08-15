import { supabaseAdmin } from '../config/supabase';
import { Anomaly } from '../types/insight';
import { AnalyticsService } from './analytics.service';
import { DatasetService } from './dataset.service';
import { NotFoundError } from '../utils/errors';

export class AnomalyService {
  public static async detectAndStoreAnomalies(
    userId: string,
    datasetId: string
  ): Promise<Anomaly[]> {
    await DatasetService.getDatasetById(userId, datasetId);
    const columns = await DatasetService.getDatasetColumns(userId, datasetId);
    const numCol = columns.find((c) => c.data_type === 'number');

    if (!numCol) return [];

    const rows = DatasetService.getDatasetMemoryRows(datasetId);
    const detected = AnalyticsService.detectAnomalies(rows, numCol.column_name);

    const anomalies: Anomaly[] = detected.map((d) => ({
      id: crypto.randomUUID(),
      user_id: userId,
      dataset_id: datasetId,
      metric: d.metric,
      description: `Unusual value of $${d.actual.toLocaleString()} detected in metric ${d.metric} (expected ~$${d.expected.toLocaleString()})`,
      expected_value: d.expected,
      actual_value: d.actual,
      severity: d.severity,
      status: 'open',
      detected_at: new Date().toISOString(),
    }));

    try {
      if (anomalies.length > 0) {
        await supabaseAdmin.from('anomalies').insert(
          anomalies.map((a) => ({
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
      }
    } catch (_e) {
      // Memory fallback
    }

    return anomalies;
  }

  public static async getUserAnomalies(userId: string, datasetId?: string): Promise<Anomaly[]> {
    try {
      let query = supabaseAdmin.from('anomalies').select('*').eq('user_id', userId);
      if (datasetId) query = query.eq('dataset_id', datasetId);

      const { data, error } = await query.order('detected_at', { ascending: false });
      if (!error && data) return data as Anomaly[];
    } catch (_e) {
      // DB error
    }

    return [];
  }

  public static async resolveAnomaly(
    userId: string,
    anomalyId: string,
    status: 'reviewed' | 'resolved' = 'resolved'
  ): Promise<Anomaly> {
    try {
      const { data, error } = await supabaseAdmin
        .from('anomalies')
        .update({ status, resolved_at: new Date().toISOString() })
        .eq('id', anomalyId)
        .eq('user_id', userId)
        .select()
        .single();

      if (!error && data) return data as Anomaly;
    } catch (_e) {
      // fallback
    }

    throw new NotFoundError('Anomaly record not found or already updated');
  }
}
