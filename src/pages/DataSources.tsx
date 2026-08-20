import { useState, useRef } from 'react';
import { UploadCloud, Plus, Database, RefreshCw, MoreHorizontal, Eye, Trash2, BarChart3, CheckCircle2, History, Clock, FileText, Edit, FileSpreadsheet } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import { Header } from '../components/layout/Header';
import { Button } from '../components/common/Button';
import { StatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Dropdown } from '../components/common/Dropdown';
import { useDatasets } from '../context/DatasetContext';
import { NoDatasets } from '../components/common/EmptyState';
import { formatBytes, formatDate, formatNumber, cn } from '../lib/utils';
import type { Dataset, DataColumn, DataRow } from '../types';

export default function DataSources() {
  const navigate = useNavigate();
  const { datasets, uploadHistory, addDataset, deleteDataset, clearUploadHistory } = useDatasets();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [missingDatasetName, setMissingDatasetName] = useState<string | null>(null);

  const [uploadedFileInfo, setUploadedFileInfo] = useState<{
    id?: string;
    name: string;
    size: number;
    rows: number;
    columns: number;
    missing: number;
  } | null>(null);

  /**
   * Resolve a dataset ID from a history entry.
   * Priority:
   * 1. Use datasetId directly if it's a non-empty string (even if dataset isn't
   *    loaded in context — the detail page handles missing data gracefully)
   * 2. Fallback: find by name/filename in datasets context
   * Returns null ONLY if both datasetId is empty AND no name match exists.
   */
  const resolveDatasetId = (item: { datasetId: string; datasetName: string; fileName: string }): string | null => {
    // A valid non-empty datasetId is always navigable
    if (item.datasetId && item.datasetId.trim() !== '') {
      return item.datasetId;
    }
    // datasetId is empty (old null entries) — try name/filename match
    const byName = datasets.find(
      (d) => d.name === item.datasetName || d.fileName === item.fileName
    );
    return byName?.id ?? null;
  };

  const handleHistoryEdit = (item: { datasetId: string; datasetName: string; fileName: string }) => {
    const dsId = resolveDatasetId(item);
    if (dsId) {
      navigate(`/app/datasets/${dsId}/edit`);
    } else {
      setMissingDatasetName(item.datasetName || item.fileName);
    }
  };

  const handleHistoryView = (item: { datasetId: string; datasetName: string; fileName: string }) => {
    const dsId = resolveDatasetId(item);
    if (dsId) {
      navigate(`/app/datasets/${dsId}`);
    } else {
      setMissingDatasetName(item.datasetName || item.fileName);
    }
  };

  const processFile = (file: File) => {
    setUploadStatus('uploading');
    setUploadProgress(20);
    setErrorMessage(null);

    Papa.parse<DataRow>(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        setUploadProgress(70);
        try {
          const rawRows = results.data;
          if (!rawRows || rawRows.length === 0) {
            setUploadStatus('error');
            setErrorMessage('The selected file appears to be empty.');
            return;
          }

          const fields = results.meta.fields || Object.keys(rawRows[0] || {});
          if (fields.length === 0) {
            setUploadStatus('error');
            setErrorMessage('Could not detect header columns in the CSV file.');
            return;
          }

          let missingValues = 0;
          const rowStrings = new Set<string>();
          let duplicates = 0;

          // Build columns metadata
          const dataColumns: DataColumn[] = fields.map((colName) => {
            const values = rawRows.map((r) => r[colName]);
            let nullCount = 0;
            const uniqueSet = new Set<string | number | boolean>();
            const samples: (string | number | boolean)[] = [];
            let numCount = 0;
            let dateCount = 0;

            for (const val of values) {
              if (val === null || val === undefined || val === '') {
                nullCount++;
                missingValues++;
              } else {
                uniqueSet.add(val as string | number | boolean);
                if (samples.length < 3 && !samples.includes(val as string | number | boolean)) {
                  samples.push(val as string | number | boolean);
                }

                if (typeof val === 'number') {
                  numCount++;
                } else if (typeof val === 'string') {
                  if (!isNaN(Number(val))) {
                    numCount++;
                  } else if (!isNaN(Date.parse(val)) && val.length > 5) {
                    dateCount++;
                  }
                }
              }
            }

            const totalValid = values.length - nullCount;
            let type: 'string' | 'number' | 'date' | 'boolean' = 'string';
            if (totalValid > 0) {
              if (numCount / totalValid > 0.7) type = 'number';
              else if (dateCount / totalValid > 0.7) type = 'date';
            }

            return {
              name: colName,
              type,
              nullCount,
              uniqueCount: uniqueSet.size,
              sample: samples,
            };
          });

          // Duplicates count
          for (const row of rawRows) {
            const str = JSON.stringify(row);
            if (rowStrings.has(str)) {
              duplicates++;
            } else {
              rowStrings.add(str);
            }
          }

          const dataTypes: Record<string, string> = {};
          dataColumns.forEach((c) => {
            dataTypes[c.name] = c.type;
          });

          const newDatasetId = crypto.randomUUID(); // real UUID — works with DB uuid columns
          const newDataset: Dataset = {
            id: newDatasetId,
            name: file.name.replace(/\.[^/.]+$/, ''),
            fileName: file.name,
            fileType: file.name.toLowerCase().endsWith('.xlsx')
              ? 'xlsx'
              : file.name.toLowerCase().endsWith('.xls')
              ? 'xls'
              : 'csv',
            rows: rawRows.length,
            columns: fields.length,
            sizeBytes: file.size,
            lastUpdated: new Date().toISOString(),
            status: 'connected',
            description: `Uploaded CSV file with ${formatNumber(rawRows.length)} rows and ${fields.length} columns.`,
            tags: ['custom', 'uploaded'],
            missingValues,
            duplicates,
            dataTypes,
          };

          addDataset(newDataset, dataColumns, rawRows);

          setUploadedFileInfo({
            id: newDatasetId,
            name: file.name,
            size: file.size,
            rows: rawRows.length,
            columns: fields.length,
            missing: missingValues,
          });

          setUploadProgress(100);
          setUploadStatus('done');
        } catch (err: any) {
          setUploadStatus('error');
          setErrorMessage(err?.message || 'Failed to process CSV file content.');
        }
      },
      error: (err) => {
        setUploadStatus('error');
        setErrorMessage(err.message || 'Error parsing CSV file.');
      },
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const resetUploadModal = () => {
    setUploadOpen(false);
    setUploadStatus('idle');
    setUploadProgress(0);
    setUploadedFileInfo(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const connectedCount = datasets.filter((d) => d.status === 'connected').length;
  const processingCount = datasets.filter((d) => d.status === 'processing').length;
  const needsAttentionCount = datasets.filter((d) => d.status === 'needs_attention' || d.status === 'failed').length;

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Data Sources"
        subtitle="Manage your connected datasets"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" icon={<Plus size={15} />}>
              Connect Source
            </Button>
            <Button variant="primary" size="sm" icon={<UploadCloud size={15} />} onClick={() => setUploadOpen(true)}>
              Upload Dataset
            </Button>
          </div>
        }
      />

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".csv,text/csv,.xlsx,.xls"
        className="hidden"
      />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Datasets', value: String(datasets.length), color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' },
            { label: 'Connected', value: String(connectedCount), color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' },
            { label: 'Processing', value: String(processingCount), color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' },
            { label: 'Needs Attention', value: String(needsAttentionCount), color: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' },
          ].map((s) => (
            <div key={s.label} className="card p-4">
              <p className={cn('text-2xl font-bold', s.color.split(' ').slice(2).join(' '))}>{s.value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Datasets table */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="section-title">All Datasets</h3>
            <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors" aria-label="Refresh">
              <RefreshCw size={15} />
            </button>
          </div>

          {datasets.length === 0 ? (
            <NoDatasets onUpload={() => setUploadOpen(true)} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <th className="table-header">Dataset</th>
                    <th className="table-header text-right">Rows</th>
                    <th className="table-header text-right">Columns</th>
                    <th className="table-header text-right">Size</th>
                    <th className="table-header">Last Updated</th>
                    <th className="table-header">Status</th>
                    <th className="table-header w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {datasets.map((ds, i) => (
                    <motion.tr
                      key={ds.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 cursor-pointer transition-colors"
                      onClick={() => navigate(`/app/datasets/${ds.id}`)}
                    >
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
                            <Database size={14} />
                          </div>
                          <div>
                            <p className="font-medium text-slate-800 dark:text-slate-200">{ds.name}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">{ds.fileName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell text-right font-medium">{formatNumber(ds.rows)}</td>
                      <td className="table-cell text-right">{ds.columns}</td>
                      <td className="table-cell text-right">{formatBytes(ds.sizeBytes)}</td>
                      <td className="table-cell">{formatDate(ds.lastUpdated)}</td>
                      <td className="table-cell">
                        <StatusBadge status={ds.status} />
                      </td>
                      <td className="table-cell" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1 justify-end">
                          <Button
                            variant="secondary"
                            size="xs"
                            icon={<Edit size={13} />}
                            onClick={() => navigate(`/app/datasets/${ds.id}/edit`)}
                          >
                            Edit
                          </Button>
                          <Dropdown
                            trigger={
                              <button className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400" aria-label="Actions">
                                <MoreHorizontal size={15} />
                              </button>
                            }
                            items={[
                              { label: 'Edit CSV (Excel View)', icon: <FileSpreadsheet size={14} />, onClick: () => navigate(`/app/datasets/${ds.id}/edit`) },
                              { label: 'View dataset', icon: <Eye size={14} />, onClick: () => navigate(`/app/datasets/${ds.id}`) },
                              { label: 'Analyze', icon: <BarChart3 size={14} />, onClick: () => navigate('/analysis') },
                              { label: 'Refresh', icon: <RefreshCw size={14} />, onClick: () => {} },
                              { divider: true },
                              { label: 'Delete', icon: <Trash2 size={14} />, onClick: () => deleteDataset(ds.id), danger: true },
                            ]}
                          />
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Upload Activity History Table */}
        <div className="card overflow-hidden mt-6">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                <History size={16} />
              </div>
              <div>
                <h3 className="section-title">Upload Activity History</h3>
                <p className="section-subtitle mt-0.5">Audit log of all uploaded dataset files & processing timestamps</p>
              </div>
            </div>

            {uploadHistory.length > 0 && (
              <button
                onClick={clearUploadHistory}
                className="text-xs text-red-600 dark:text-red-400 hover:underline font-medium"
              >
                Clear History
              </button>
            )}
          </div>

          {/* Missing dataset warning */}
          {missingDatasetName && (
            <div className="mx-5 mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <span className="text-amber-500 text-sm mt-0.5">⚠️</span>
                <div>
                  <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">Dataset not available</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                    "<strong>{missingDatasetName}</strong>" was previously uploaded but the data is no longer in your current session.
                    Re-upload the file to view or edit it again.
                  </p>
                </div>
              </div>
              <button onClick={() => setMissingDatasetName(null)} className="text-amber-400 hover:text-amber-600 text-xs flex-shrink-0">✕</button>
            </div>
          )}

          {uploadHistory.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
              No upload activity history logged. Upload a CSV file above to record activity history entries.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <th className="table-header">Uploaded File</th>
                    <th className="table-header">Upload Timestamp</th>
                    <th className="table-header text-right">Rows</th>
                    <th className="table-header text-right">Columns</th>
                    <th className="table-header text-right">Size</th>
                    <th className="table-header">Status</th>
                    <th className="table-header text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {uploadHistory.map((item, i) => {
                    const dsId = resolveDatasetId(item);
                    const isAvailable = !!dsId;
                    return (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.04 }}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="table-cell">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 flex-shrink-0">
                              <FileText size={14} />
                            </div>
                            <div>
                              <p className="font-medium text-slate-800 dark:text-slate-200">{item.fileName}</p>
                              <p className="text-xs text-slate-400 dark:text-slate-500">{item.datasetName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="table-cell text-xs text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <Clock size={12} className="text-slate-400" />
                            <span>{formatDate(item.uploadedAt)}</span>
                          </div>
                        </td>
                        <td className="table-cell text-right font-medium">{formatNumber(item.rows)}</td>
                        <td className="table-cell text-right">{item.columns}</td>
                        <td className="table-cell text-right">{formatBytes(item.sizeBytes)}</td>
                        <td className="table-cell">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="table-cell text-right">
                          <div className="flex items-center gap-1 justify-end">
                            {isAvailable ? (
                              <>
                                <Button
                                  variant="secondary"
                                  size="xs"
                                  icon={<Edit size={13} />}
                                  onClick={() => handleHistoryEdit(item)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  icon={<Eye size={13} />}
                                  onClick={() => handleHistoryView(item)}
                                >
                                  View
                                </Button>
                              </>
                            ) : (
                              <button
                                onClick={() => setUploadOpen(true)}
                                className="text-[11px] text-blue-500 hover:underline font-medium whitespace-nowrap"
                                title="Dataset not in session — re-upload to access"
                              >
                                Re-upload ↑
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={uploadOpen}
        onClose={resetUploadModal}
        title="Upload Dataset"
        description="Upload a CSV or Excel file to start analyzing your data."
        size="lg"
      >
        {uploadStatus === 'idle' && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'flex flex-col items-center justify-center gap-4 border-2 border-dashed rounded-xl p-12 cursor-pointer transition-all',
              dragOver
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
                : 'border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            )}
          >
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <UploadCloud size={28} className="text-blue-500" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-800 dark:text-slate-200">Drop your CSV or Excel file here</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">or click to browse</p>
            </div>
            <div className="flex gap-3">
              {['CSV', 'XLSX', 'XLS'].map((t) => (
                <span key={t} className="px-3 py-1 text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full font-medium">{t}</span>
              ))}
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500">Maximum file size: 100 MB</p>
          </div>
        )}

        {(uploadStatus === 'uploading' || uploadStatus === 'done') && uploadedFileInfo && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <Database size={20} className="text-blue-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{uploadedFileInfo.name}</p>
                <p className="text-xs text-slate-400">{formatBytes(uploadedFileInfo.size)} · CSV file</p>
              </div>
              {uploadStatus === 'done' && <CheckCircle2 size={20} className="text-emerald-500" />}
            </div>
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                <span>{uploadStatus === 'done' ? 'Processing complete' : 'Parsing file data...'}</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  className={cn('h-full rounded-full transition-all', uploadStatus === 'done' ? 'bg-emerald-500' : 'bg-blue-500')}
                />
              </div>
            </div>
            {uploadStatus === 'done' && (
              <>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Rows', value: formatNumber(uploadedFileInfo.rows) },
                    { label: 'Columns', value: String(uploadedFileInfo.columns) },
                    { label: 'Missing', value: String(uploadedFileInfo.missing) },
                  ].map((s) => (
                    <div key={s.label} className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <p className="text-lg font-bold text-slate-800 dark:text-white">{s.value}</p>
                      <p className="text-xs text-slate-500">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="secondary" size="sm" onClick={resetUploadModal}>Close</Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      const dsId = uploadedFileInfo.id;
                      resetUploadModal();
                      if (dsId) navigate(`/app/datasets/${dsId}`);
                    }}
                  >
                    View Dataset
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {uploadStatus === 'error' && (
          <div className="space-y-4 text-center py-4">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium">
              {errorMessage || 'An error occurred while uploading the file.'}
            </div>
            <Button variant="secondary" size="sm" onClick={resetUploadModal}>Try Again</Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
