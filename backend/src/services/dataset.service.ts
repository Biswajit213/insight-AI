import fs from 'fs';
import { supabaseAdmin } from '../config/supabase';
import { env } from '../config/env';
import { DataProcessingService } from './data-processing.service';
import { UploadHistoryService } from './upload-history.service';
import { Dataset, DatasetColumn, DatasetStatisticsResponse } from '../types/dataset';
import { NotFoundError, ErrorCode, ForbiddenError } from '../utils/errors';
import { extractPaginationParams, buildPaginatedMeta, PaginatedMeta } from '../utils/pagination';

// In-memory fallback dataset store for local development without live database setup
const memoryDatasets = new Map<string, { dataset: Dataset; columns: DatasetColumn[]; rows: Record<string, unknown>[] }>();

export class DatasetService {
  public static async uploadAndProcessDataset(
    userId: string,
    file: Express.Multer.File,
    datasetName?: string
  ): Promise<Dataset> {
    const originalFilename = file.originalname;
    const name = datasetName || originalFilename.replace(/\.[^/.]+$/, '');
    const ext = originalFilename.split('.').pop()?.toLowerCase() as 'csv' | 'xlsx' | 'xls';
    const fileSize = file.size;

    // 1. Process dataset file using processing service
    const processed = await DataProcessingService.processFile(file.path, ext);

    const datasetId = crypto.randomUUID();
    const storagePath = `datasets/${userId}/${datasetId}-${file.filename}`;

    const datasetRecord: Dataset = {
      id: datasetId,
      user_id: userId,
      name,
      original_filename: originalFilename,
      file_type: ext || 'csv',
      file_size: fileSize,
      row_count: processed.rowCount,
      column_count: processed.columnCount,
      status: 'ready',
      data_quality_score: processed.quality.overallScore,
      storage_path: storagePath,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const columns: DatasetColumn[] = processed.columnStats.map((stat) => ({
      id: crypto.randomUUID(),
      dataset_id: datasetId,
      column_name: stat.name,
      data_type: stat.dataType,
      nullable: stat.nullCount > 0,
      unique_values: stat.uniqueCount,
      missing_values: stat.nullCount,
      created_at: new Date().toISOString(),
    }));

    if (env.NODE_ENV !== 'test') {
      try {
        await supabaseAdmin.from('datasets').insert({
          id: datasetRecord.id,
          user_id: datasetRecord.user_id,
          name: datasetRecord.name,
          original_filename: datasetRecord.original_filename,
          file_type: datasetRecord.file_type,
          file_size: datasetRecord.file_size,
          row_count: datasetRecord.row_count,
          column_count: datasetRecord.column_count,
          status: datasetRecord.status,
          data_quality_score: datasetRecord.data_quality_score,
          storage_path: datasetRecord.storage_path,
        });
        await supabaseAdmin.from('dataset_columns').insert(columns);

        // Record upload activity history in database
        await UploadHistoryService.addEntry({
          userId,
          datasetId: datasetId,
          fileName: originalFilename,
          datasetName: name,
          uploadedAt: datasetRecord.created_at,
          sizeBytes: fileSize,
          rowCount: processed.rowCount,
          columnCount: processed.columnCount,
          missingValues: processed.quality.invalidEntries || 0,
          status: 'connected',
        });
      } catch (_e) {}
    }

    memoryDatasets.set(datasetId, {
      dataset: datasetRecord,
      columns,
      rows: processed.rows,
    });

    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    return datasetRecord;
  }

  public static async getUserDatasets(
    userId: string,
    query: Record<string, unknown>
  ): Promise<{ datasets: Dataset[]; meta: PaginatedMeta }> {
    const { page, limit, offset, search } = extractPaginationParams(query);

    let userDatasets: Dataset[] = [];

    if (env.NODE_ENV !== 'test') {
      try {
        let reqQuery = supabaseAdmin
          .from('datasets')
          .select('*', { count: 'exact' })
          .eq('user_id', userId);

        if (search) {
          reqQuery = reqQuery.ilike('name', `%${search}%`);
        }

        const { data, count, error } = await reqQuery
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (!error && data) {
          userDatasets = data as Dataset[];
          return {
            datasets: userDatasets,
            meta: buildPaginatedMeta(page, limit, count || userDatasets.length),
          };
        }
      } catch (_err) {}
    }

    // Memory fallback
    userDatasets = Array.from(memoryDatasets.values())
      .map((entry) => entry.dataset)
      .filter((ds) => ds.user_id === userId);

    if (search) {
      userDatasets = userDatasets.filter((ds) =>
        ds.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    const total = userDatasets.length;
    const paginated = userDatasets.slice(offset, offset + limit);

    return {
      datasets: paginated,
      meta: buildPaginatedMeta(page, limit, total),
    };
  }

  public static async getDatasetById(userId: string, datasetId: string): Promise<Dataset> {
    const mem = memoryDatasets.get(datasetId);
    if (mem) {
      if (mem.dataset.user_id !== userId) {
        throw new ForbiddenError('You do not have permission to access this dataset.');
      }
      return mem.dataset;
    }

    if (env.NODE_ENV === 'test') {
      throw new NotFoundError('Dataset not found', ErrorCode.DATASET_NOT_FOUND);
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('datasets')
        .select('*')
        .eq('id', datasetId)
        .single();

      if (error || !data) {
        throw new NotFoundError('Dataset not found', ErrorCode.DATASET_NOT_FOUND);
      }

      if (data.user_id !== userId) {
        throw new ForbiddenError('You do not have permission to access this dataset.');
      }

      return data as Dataset;
    } catch (err) {
      if (err instanceof ForbiddenError || err instanceof NotFoundError) throw err;
      throw new NotFoundError('Dataset not found', ErrorCode.DATASET_NOT_FOUND);
    }
  }

  public static async getDatasetColumns(userId: string, datasetId: string): Promise<DatasetColumn[]> {
    await this.getDatasetById(userId, datasetId); // Verify ownership

    const mem = memoryDatasets.get(datasetId);
    if (mem) return mem.columns;

    const { data, error } = await supabaseAdmin
      .from('dataset_columns')
      .select('*')
      .eq('dataset_id', datasetId);

    if (error || !data) {
      return [];
    }

    return data as DatasetColumn[];
  }

  public static async getDatasetRows(
    userId: string,
    datasetId: string,
    query: Record<string, unknown>
  ): Promise<{ headers: string[]; rows: Record<string, unknown>[]; meta: PaginatedMeta }> {
    await this.getDatasetById(userId, datasetId); // Ownership check

    const { page, limit, offset } = extractPaginationParams(query);
    const mem = memoryDatasets.get(datasetId);

    if (mem) {
      const headers = mem.columns.map((c) => c.column_name);
      const total = mem.rows.length;
      const paginatedRows = mem.rows.slice(offset, offset + limit);
      return {
        headers,
        rows: paginatedRows,
        meta: buildPaginatedMeta(page, limit, total),
      };
    }

    return {
      headers: [],
      rows: [],
      meta: buildPaginatedMeta(page, limit, 0),
    };
  }

  public static async getDatasetStatistics(
    userId: string,
    datasetId: string
  ): Promise<DatasetStatisticsResponse> {
    const dataset = await this.getDatasetById(userId, datasetId);
    const columns = await this.getDatasetColumns(userId, datasetId);
    const mem = memoryDatasets.get(datasetId);

    const rows = mem ? mem.rows : [];
    const quality = DataProcessingService['processFile']
      ? (await DataProcessingService['processFile'](dataset.storage_path || '', dataset.file_type)).quality
      : { completeness: 98, duplicateRate: 1, invalidEntries: 0, totalRows: dataset.row_count, totalColumns: dataset.column_count, overallScore: dataset.data_quality_score };

    const colStats = columns.map((col) => {
      const colValues = rows.map((r) => r[col.column_name]);
      return {
        name: col.column_name,
        dataType: col.data_type,
        nullCount: col.missing_values,
        uniqueCount: col.unique_values,
        sample: colValues.slice(0, 5),
      };
    });

    return {
      datasetId: dataset.id,
      name: dataset.name,
      rowCount: Number(dataset.row_count),
      columnCount: dataset.column_count,
      quality,
      columns: colStats,
    };
  }

  public static async deleteDataset(userId: string, datasetId: string): Promise<void> {
    await this.getDatasetById(userId, datasetId);

    memoryDatasets.delete(datasetId);

    try {
      await supabaseAdmin.from('datasets').delete().eq('id', datasetId).eq('user_id', userId);
    } catch (_err) {
      // Ignore if database disconnect
    }
  }

  // Internal helper to fetch memory rows for analytical engines
  public static getDatasetMemoryRows(datasetId: string): Record<string, unknown>[] {
    const mem = memoryDatasets.get(datasetId);
    return mem ? mem.rows : [];
  }

  // Helper for registering memory datasets in testing & offline environments
  public static setMemoryDataset(
    datasetId: string,
    entry: { dataset: Dataset; columns: DatasetColumn[]; rows: Record<string, unknown>[] }
  ): void {
    memoryDatasets.set(datasetId, entry);
  }
}
