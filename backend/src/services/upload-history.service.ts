import { supabaseAdmin } from '../config/supabase';
import { logger } from '../utils/logger';

export interface UploadHistoryRecord {
  id: string;
  user_id: string;
  dataset_id: string | null;
  file_name: string;
  dataset_name: string;
  uploaded_at: string;
  size_bytes: number;
  row_count: number;
  column_count: number;
  missing_values: number;
  status: 'connected' | 'processing' | 'needs_attention' | 'failed';
  created_at: string;
}

/** Returns the value only if it's a valid UUID, otherwise null */
function toUUIDOrNull(value: string | null | undefined): string | null {
  if (!value) return null;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value) ? value : null;
}

export class UploadHistoryService {
  /**
   * Record a new upload activity entry for a user.
   */
  public static async addEntry(params: {
    userId: string;
    datasetId: string;
    fileName: string;
    datasetName: string;
    uploadedAt: string;
    sizeBytes: number;
    rowCount: number;
    columnCount: number;
    missingValues: number;
    status?: string;
  }): Promise<UploadHistoryRecord | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('upload_history')
        .insert({
          user_id: params.userId,
          dataset_id: toUUIDOrNull(params.datasetId), // null-safe: non-UUID ids become null
          file_name: params.fileName,
          dataset_name: params.datasetName,
          uploaded_at: params.uploadedAt,
          size_bytes: params.sizeBytes,
          row_count: params.rowCount,
          column_count: params.columnCount,
          missing_values: params.missingValues,
          status: params.status || 'connected',
        })
        .select()
        .single();

      if (error) {
        logger.warn('Failed to insert upload history entry', { error: error.message });
        return null;
      }
      return data as UploadHistoryRecord;
    } catch (err: any) {
      logger.warn('UploadHistoryService.addEntry error', { message: err?.message });
      return null;
    }
  }

  /**
   * Return all upload history entries for a user, newest first.
   */
  public static async getHistory(userId: string): Promise<UploadHistoryRecord[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('upload_history')
        .select('*')
        .eq('user_id', userId)
        .order('uploaded_at', { ascending: false });

      if (error || !data) {
        logger.warn('Failed to fetch upload history', { error: error?.message });
        return [];
      }
      return data as UploadHistoryRecord[];
    } catch (err: any) {
      logger.warn('UploadHistoryService.getHistory error', { message: err?.message });
      return [];
    }
  }

  /**
   * Delete all upload history entries for a user.
   */
  public static async clearHistory(userId: string): Promise<void> {
    try {
      await supabaseAdmin
        .from('upload_history')
        .delete()
        .eq('user_id', userId);
    } catch (err: any) {
      logger.warn('UploadHistoryService.clearHistory error', { message: err?.message });
    }
  }
}
