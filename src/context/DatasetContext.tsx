import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { Dataset, DataColumn, DataRow, UploadHistoryEntry } from '../types';
import { userStorageGet, userStorageSet, getActiveUserId } from '../lib/userStorage';
import { apiClient } from '../lib/apiClient';

interface DatasetData {
  columns: DataColumn[];
  rows: DataRow[];
}

interface DatasetContextType {
  datasets: Dataset[];
  uploadHistory: UploadHistoryEntry[];
  loading: boolean;
  addDataset: (dataset: Dataset, columns: DataColumn[], rows: DataRow[]) => void;
  getDataset: (id: string) => Dataset | undefined;
  getDatasetData: (id: string) => DatasetData;
  updateDatasetData: (id: string, newColumns: DataColumn[], newRows: DataRow[]) => void;
  deleteDataset: (id: string) => void;
  clearUploadHistory: () => void;
  refreshFromServer: () => Promise<void>;
}

const DatasetContext = createContext<DatasetContextType | undefined>(undefined);

// localStorage base keys — scoped per user: key + "::" + userId
const KEY_METADATA = 'insightai_user_datasets_metadata';
const KEY_DATA     = 'insightai_user_datasets_data';
const KEY_HISTORY  = 'insightai_user_upload_history';

/** Shape returned by backend GET /api/v1/upload-history */
interface ApiHistoryEntry {
  id: string;
  dataset_id: string | null;
  file_name: string;
  dataset_name: string;
  uploaded_at: string;
  size_bytes: number;
  row_count: number;
  column_count: number;
  missing_values: number;
  status: string;
}

/** Shape returned by backend GET /api/v1/datasets */
interface ApiDataset {
  id: string;
  name: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  row_count: number;
  column_count: number;
  status: string;
  data_quality_score: number;
  created_at: string;
  updated_at: string;
}

function apiDatasetToFrontend(d: ApiDataset): Dataset {
  return {
    id: d.id,
    name: d.name,
    fileName: d.original_filename,
    fileType: d.file_type as 'csv' | 'xlsx' | 'xls',
    rows: Number(d.row_count),
    columns: d.column_count,
    sizeBytes: d.file_size,
    lastUpdated: d.updated_at || d.created_at,
    status: (d.status === 'ready' ? 'connected' : d.status) as any,
    description: `${d.name} — ${d.row_count} rows, ${d.column_count} columns`,
    tags: ['uploaded'],
    missingValues: 0,
    duplicates: 0,
  };
}

function apiHistoryToFrontend(h: ApiHistoryEntry): UploadHistoryEntry {
  return {
    id: h.id,
    datasetId: h.dataset_id || '',
    fileName: h.file_name,
    datasetName: h.dataset_name,
    uploadedAt: h.uploaded_at,
    sizeBytes: h.size_bytes,
    rows: h.row_count,
    columns: h.column_count,
    status: (h.status as any) || 'connected',
    missingValues: h.missing_values,
  };
}

/** Load datasets + history metadata from localStorage for the current user */
function loadLocalForUser() {
  return {
    datasets:      userStorageGet<Dataset[]>(KEY_METADATA) ?? [],
    customData:    userStorageGet<Record<string, DatasetData>>(KEY_DATA) ?? {},
    uploadHistory: userStorageGet<UploadHistoryEntry[]>(KEY_HISTORY) ?? [],
  };
}

export const DatasetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userId, setUserId]             = useState<string>(() => getActiveUserId());
  const [datasets, setDatasets]         = useState<Dataset[]>([]);
  const [customData, setCustomData]     = useState<Record<string, DatasetData>>({});
  const [uploadHistory, setUploadHistory] = useState<UploadHistoryEntry[]>([]);
  const [loading, setLoading]           = useState(false);

  // Prevent duplicate concurrent fetches
  const fetchingRef = useRef(false);

  // ── Fetch from backend (datasets list + upload history) ──────────────────
  const refreshFromServer = useCallback(async () => {
    const token = localStorage.getItem('insightai_token');
    if (!token || token === 'guest') return;
    if (fetchingRef.current) return;

    fetchingRef.current = true;
    setLoading(true);

    try {
      const [datasetsRes, historyRes] = await Promise.allSettled([
        apiClient.get<{ success: boolean; data: ApiDataset[] }>('/api/v1/datasets'),
        apiClient.get<{ success: boolean; data: ApiHistoryEntry[] }>('/api/v1/upload-history'),
      ]);

      if (datasetsRes.status === 'fulfilled' && datasetsRes.value?.data) {
        const serverDatasets = datasetsRes.value.data.map(apiDatasetToFrontend);
        setDatasets(serverDatasets);
        userStorageSet(KEY_METADATA, serverDatasets);
      }

      if (historyRes.status === 'fulfilled' && historyRes.value?.data) {
        const serverHistory = historyRes.value.data.map(apiHistoryToFrontend);
        setUploadHistory(serverHistory);
        userStorageSet(KEY_HISTORY, serverHistory);
      }
    } catch {
      // Server unavailable — keep whatever is in localStorage
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  // ── Initial load: localStorage first (instant), then server sync ─────────
  useEffect(() => {
    const { datasets: ds, customData: cd, uploadHistory: hist } = loadLocalForUser();
    setDatasets(ds);
    setCustomData(cd);
    setUploadHistory(hist);

    // Hydrate from server in the background
    refreshFromServer();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Re-load when user changes (login / logout / account switch) ───────────
  useEffect(() => {
    const handleUserChange = () => {
      const newUserId = getActiveUserId();
      setUserId(newUserId);

      // Load local data for new user immediately
      const { datasets: ds, customData: cd, uploadHistory: hist } = loadLocalForUser();
      setDatasets(ds);
      setCustomData(cd);
      setUploadHistory(hist);

      // Then refresh from server
      refreshFromServer();
    };

    window.addEventListener('insightai_user_updated', handleUserChange);
    window.addEventListener('storage', handleUserChange);
    return () => {
      window.removeEventListener('insightai_user_updated', handleUserChange);
      window.removeEventListener('storage', handleUserChange);
    };
  }, [refreshFromServer]);

  // ── Persist changes back to localStorage ─────────────────────────────────
  useEffect(() => { userStorageSet(KEY_METADATA, datasets); }, [datasets]);
  useEffect(() => { userStorageSet(KEY_DATA, customData); }, [customData]);
  useEffect(() => { userStorageSet(KEY_HISTORY, uploadHistory); }, [uploadHistory]);

  // ── addDataset — saves to local state AND persists history to DB ──────────
  const addDataset = useCallback((newDataset: Dataset, columns: DataColumn[], rows: DataRow[]) => {
    setDatasets((prev) => {
      // Avoid duplicates if server sync already added it
      if (prev.some((d) => d.id === newDataset.id)) return prev;
      return [newDataset, ...prev];
    });

    setCustomData((prev) => ({
      ...prev,
      [newDataset.id]: { columns, rows },
    }));

    const historyEntry: UploadHistoryEntry = {
      id: `hist_${Date.now()}_${newDataset.id}`,
      datasetId: newDataset.id,
      fileName: newDataset.fileName,
      datasetName: newDataset.name,
      uploadedAt: newDataset.lastUpdated,
      sizeBytes: newDataset.sizeBytes,
      rows: newDataset.rows,
      columns: newDataset.columns,
      status: 'connected',
      missingValues: newDataset.missingValues || 0,
    };

    setUploadHistory((prev) => {
      if (prev.some((h) => h.datasetId === newDataset.id)) return prev;
      return [historyEntry, ...prev];
    });

    // Persist history entry to the database so it survives re-login
    const token = localStorage.getItem('insightai_token');
    if (token && token !== 'guest') {
      apiClient.post('/api/v1/upload-history', {
        dataset_id:    newDataset.id,
        file_name:     newDataset.fileName,
        dataset_name:  newDataset.name,
        uploaded_at:   newDataset.lastUpdated,
        size_bytes:    newDataset.sizeBytes,
        row_count:     newDataset.rows,
        column_count:  newDataset.columns,
        missing_values: newDataset.missingValues || 0,
        status:        'connected',
      }).catch(() => {
        // DB unavailable — already saved in localStorage, safe to ignore
      });
    }
  }, []);

  const getDataset = (id: string): Dataset | undefined =>
    datasets.find((d) => d.id === id);

  const getDatasetData = (id: string): DatasetData => {
    if (customData[id]) {
      const data = customData[id];
      if (data.rows && data.rows.length > 0) {
        if (!data.columns || data.columns.length === 0) {
          const fields = Object.keys(data.rows[0]);
          const autoCols: DataColumn[] = fields.map((f) => {
            const val = data.rows[0][f];
            const type = typeof val === 'number' ? 'number' : typeof val === 'boolean' ? 'boolean' : 'string';
            return { name: f, type, nullCount: 0, uniqueCount: new Set(data.rows.map((r) => r[f])).size, sample: data.rows.slice(0, 3).map((r) => r[f] as any) };
          });
          return { columns: autoCols, rows: data.rows };
        }
        return data;
      }
    }

    const meta = datasets.find((d) => d.id === id);
    if (meta) {
      const fields = meta.dataTypes && Object.keys(meta.dataTypes).length > 0
        ? Object.keys(meta.dataTypes)
        : ['ID', 'Category', 'Value', 'Status', 'Timestamp'];

      const autoColumns: DataColumn[] = fields.map((f) => ({
        name: f,
        type: (meta.dataTypes?.[f] === 'number' ? 'number' : meta.dataTypes?.[f] === 'date' ? 'date' : 'string') as any,
        nullCount: 0,
        uniqueCount: meta.rows || 10,
        sample: ['Sample 1', 'Sample 2', 'Sample 3'],
      }));

      const autoRows: DataRow[] = Array.from({ length: Math.max(meta.rows || 10, 15) }).map((_, idx) => {
        const row: DataRow = {};
        fields.forEach((f) => {
          const t = meta.dataTypes?.[f] || 'string';
          if (t === 'number') row[f] = Math.round(Math.random() * 800 + 100);
          else if (t === 'date') row[f] = new Date().toISOString().split('T')[0];
          else row[f] = `${f}_${idx + 1}`;
        });
        return row;
      });

      return { columns: autoColumns, rows: autoRows };
    }

    return { columns: [], rows: [] };
  };

  const updateDatasetData = (id: string, newColumns: DataColumn[], newRows: DataRow[]) => {
    setCustomData((prev) => ({ ...prev, [id]: { columns: newColumns, rows: newRows } }));

    let missingValues = 0;
    const rowStrings = new Set<string>();
    let duplicates = 0;

    for (const r of newRows) {
      const str = JSON.stringify(r);
      if (rowStrings.has(str)) duplicates++;
      else rowStrings.add(str);
      for (const col of newColumns) {
        const val = r[col.name];
        if (val === null || val === undefined || val === '') missingValues++;
      }
    }

    const dataTypes: Record<string, string> = {};
    newColumns.forEach((c) => { dataTypes[c.name] = c.type; });

    const estBytes = Math.round(JSON.stringify(newRows).length * 1.1);

    setDatasets((prev) => prev.map((ds) =>
      ds.id === id
        ? { ...ds, rows: newRows.length, columns: newColumns.length, missingValues, duplicates, dataTypes, sizeBytes: estBytes > 0 ? estBytes : ds.sizeBytes, lastUpdated: new Date().toISOString() }
        : ds
    ));
  };

  const deleteDataset = useCallback((id: string) => {
    setDatasets((prev) => prev.filter((d) => d.id !== id));
    setCustomData((prev) => { const next = { ...prev }; delete next[id]; return next; });
    // History entries are intentionally kept for audit purposes
  }, []);

  const clearUploadHistory = useCallback(() => {
    setUploadHistory([]);
    // Also clear from the database
    const token = localStorage.getItem('insightai_token');
    if (token && token !== 'guest') {
      apiClient.delete('/api/v1/upload-history').catch(() => {});
    }
  }, []);

  return (
    <DatasetContext.Provider value={{
      datasets, uploadHistory, loading,
      addDataset, getDataset, getDatasetData,
      updateDatasetData, deleteDataset,
      clearUploadHistory, refreshFromServer,
    }}>
      {children}
    </DatasetContext.Provider>
  );
};

export const useDatasets = (): DatasetContextType => {
  const context = useContext(DatasetContext);
  if (!context) throw new Error('useDatasets must be used within a DatasetProvider');
  return context;
};
