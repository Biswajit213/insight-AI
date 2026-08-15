import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Dataset, DataColumn, DataRow, UploadHistoryEntry } from '../types';
import { userStorageGet, userStorageSet, getActiveUserId } from '../lib/userStorage';

interface DatasetData {
  columns: DataColumn[];
  rows: DataRow[];
}

interface DatasetContextType {
  datasets: Dataset[];
  uploadHistory: UploadHistoryEntry[];
  addDataset: (dataset: Dataset, columns: DataColumn[], rows: DataRow[]) => void;
  getDataset: (id: string) => Dataset | undefined;
  getDatasetData: (id: string) => DatasetData;
  updateDatasetData: (id: string, newColumns: DataColumn[], newRows: DataRow[]) => void;
  deleteDataset: (id: string) => void;
  clearUploadHistory: () => void;
}

const DatasetContext = createContext<DatasetContextType | undefined>(undefined);

// Base keys — actual localStorage keys are: baseKey + "::" + userId
const KEY_METADATA = 'insightai_user_datasets_metadata';
const KEY_DATA = 'insightai_user_datasets_data';
const KEY_HISTORY = 'insightai_user_upload_history';

/** Load all three data slices for the currently active user */
function loadForUser() {
  const datasets = userStorageGet<Dataset[]>(KEY_METADATA) ?? [];
  const customData = userStorageGet<Record<string, DatasetData>>(KEY_DATA) ?? {};

  let uploadHistory = userStorageGet<UploadHistoryEntry[]>(KEY_HISTORY);
  if (!uploadHistory) {
    // Infer history from metadata if history key is missing
    uploadHistory = datasets.map((d) => ({
      id: `hist_${d.id}`,
      datasetId: d.id,
      fileName: d.fileName,
      datasetName: d.name,
      uploadedAt: d.lastUpdated,
      sizeBytes: d.sizeBytes,
      rows: d.rows,
      columns: d.columns,
      status: (d.status === 'needs_attention' ? 'needs_attention' : 'connected') as any,
      missingValues: d.missingValues || 0,
    }));
  }

  return { datasets, customData, uploadHistory };
}

export const DatasetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string>(() => getActiveUserId());
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [customData, setCustomData] = useState<Record<string, DatasetData>>({});
  const [uploadHistory, setUploadHistory] = useState<UploadHistoryEntry[]>([]);

  /** Reload all data slices from localStorage for the current user */
  const reloadForUser = useCallback(() => {
    const { datasets: ds, customData: cd, uploadHistory: hist } = loadForUser();
    setDatasets(ds);
    setCustomData(cd);
    setUploadHistory(hist);
  }, []);

  // Initial load
  useEffect(() => {
    reloadForUser();
  }, [reloadForUser]);

  // Re-load when the logged-in user changes (login / logout / switch account)
  useEffect(() => {
    const handleUserChange = () => {
      const newUserId = getActiveUserId();
      if (newUserId !== userId) {
        setUserId(newUserId);
        // Load fresh data for the new user
        const { datasets: ds, customData: cd, uploadHistory: hist } = loadForUser();
        setDatasets(ds);
        setCustomData(cd);
        setUploadHistory(hist);
      }
    };

    window.addEventListener('insightai_user_updated', handleUserChange);
    window.addEventListener('storage', handleUserChange);
    return () => {
      window.removeEventListener('insightai_user_updated', handleUserChange);
      window.removeEventListener('storage', handleUserChange);
    };
  }, [userId]);

  // Persist datasets metadata — scoped to the current user
  useEffect(() => {
    userStorageSet(KEY_METADATA, datasets);
  }, [datasets]);

  // Persist dataset rows/columns — scoped to the current user
  useEffect(() => {
    userStorageSet(KEY_DATA, customData);
  }, [customData]);

  // Persist upload history — scoped to the current user
  useEffect(() => {
    userStorageSet(KEY_HISTORY, uploadHistory);
  }, [uploadHistory]);

  const addDataset = (newDataset: Dataset, columns: DataColumn[], rows: DataRow[]) => {
    setDatasets((prev) => [newDataset, ...prev]);
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

    setUploadHistory((prev) => [historyEntry, ...prev]);
  };

  const getDataset = (id: string): Dataset | undefined => {
    return datasets.find((d) => d.id === id);
  };

  const getDatasetData = (id: string): DatasetData => {
    // 1. Check customData in memory
    if (customData[id]) {
      const data = customData[id];
      if (data.rows && data.rows.length > 0) {
        // Auto-generate columns from row keys if columns metadata was lost
        if (!data.columns || data.columns.length === 0) {
          const sampleRow = data.rows[0];
          const fields = Object.keys(sampleRow);
          const autoCols: DataColumn[] = fields.map((f) => {
            const val = sampleRow[f];
            const type = typeof val === 'number' ? 'number' : typeof val === 'boolean' ? 'boolean' : 'string';
            return {
              name: f,
              type,
              nullCount: 0,
              uniqueCount: new Set(data.rows.map((r) => r[f])).size,
              sample: data.rows.slice(0, 3).map((r) => r[f] as any),
            };
          });
          return { columns: autoCols, rows: data.rows };
        }
        return data;
      }
    }

    // 2. Fallback: reconstruct viewable dataset from metadata
    const datasetMeta = datasets.find((d) => d.id === id);
    if (datasetMeta) {
      const fields =
        datasetMeta.dataTypes && Object.keys(datasetMeta.dataTypes).length > 0
          ? Object.keys(datasetMeta.dataTypes)
          : ['ID', 'Category', 'Value', 'Status', 'Timestamp'];

      const autoColumns: DataColumn[] = fields.map((f) => {
        const typeStr = (datasetMeta.dataTypes?.[f] || 'string') as any;
        return {
          name: f,
          type: typeStr === 'number' ? 'number' : typeStr === 'date' ? 'date' : 'string',
          nullCount: 0,
          uniqueCount: datasetMeta.rows || 10,
          sample: ['Sample 1', 'Sample 2', 'Sample 3'],
        };
      });

      const autoRows: DataRow[] = Array.from({ length: Math.max(datasetMeta.rows || 10, 15) }).map((_, idx) => {
        const row: DataRow = {};
        fields.forEach((f) => {
          const t = datasetMeta.dataTypes?.[f] || 'string';
          if (t === 'number') row[f] = Math.round(Math.random() * 800 + 100);
          else if (t === 'date') row[f] = new Date().toISOString().split('T')[0];
          else if (f.toLowerCase().includes('status')) row[f] = idx % 2 === 0 ? 'Connected' : 'Completed';
          else row[f] = `${f}_${idx + 1}`;
        });
        return row;
      });

      return { columns: autoColumns, rows: autoRows };
    }

    return { columns: [], rows: [] };
  };

  const updateDatasetData = (id: string, newColumns: DataColumn[], newRows: DataRow[]) => {
    setCustomData((prev) => ({
      ...prev,
      [id]: { columns: newColumns, rows: newRows },
    }));

    let missingValues = 0;
    const rowStrings = new Set<string>();
    let duplicates = 0;

    for (const r of newRows) {
      const str = JSON.stringify(r);
      if (rowStrings.has(str)) {
        duplicates++;
      } else {
        rowStrings.add(str);
      }
      for (const col of newColumns) {
        const val = r[col.name];
        if (val === null || val === undefined || val === '') {
          missingValues++;
        }
      }
    }

    const dataTypes: Record<string, string> = {};
    newColumns.forEach((c) => {
      dataTypes[c.name] = c.type;
    });

    const estBytes = Math.round(JSON.stringify(newRows).length * 1.1);

    setDatasets((prev) =>
      prev.map((ds) => {
        if (ds.id === id) {
          return {
            ...ds,
            rows: newRows.length,
            columns: newColumns.length,
            missingValues,
            duplicates,
            dataTypes,
            sizeBytes: estBytes > 0 ? estBytes : ds.sizeBytes,
            lastUpdated: new Date().toISOString(),
          };
        }
        return ds;
      })
    );
  };

  const deleteDataset = (id: string) => {
    setDatasets((prev) => prev.filter((d) => d.id !== id));
    setCustomData((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const clearUploadHistory = () => {
    setUploadHistory([]);
  };

  return (
    <DatasetContext.Provider
      value={{
        datasets,
        uploadHistory,
        addDataset,
        getDataset,
        getDatasetData,
        updateDatasetData,
        deleteDataset,
        clearUploadHistory,
      }}
    >
      {children}
    </DatasetContext.Provider>
  );
};

export const useDatasets = (): DatasetContextType => {
  const context = useContext(DatasetContext);
  if (!context) {
    throw new Error('useDatasets must be used within a DatasetProvider');
  }
  return context;
};
