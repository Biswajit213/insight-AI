import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, RefreshCw, CheckCircle2, XCircle, Eye, Loader2, Database } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { SeverityBadge, StatusBadge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { Button } from '../components/common/Button';
import { useDatasets } from '../context/DatasetContext';
import { apiClient } from '../lib/apiClient';
import { formatTimestamp, cn } from '../lib/utils';
import type { Anomaly } from '../types';

type SeverityFilter = 'all' | 'critical' | 'high' | 'medium' | 'low';
type StatusFilter   = 'all' | 'open' | 'reviewing' | 'resolved' | 'dismissed';

// Backend anomaly shape
interface ApiAnomaly {
  id: string;
  user_id: string;
  dataset_id: string;
  metric: string;
  description: string;
  expected_value: number;
  actual_value: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'reviewed' | 'resolved';
  detected_at: string;
  resolved_at?: string;
}

function apiToFrontend(a: ApiAnomaly, datasetName: string): Anomaly {
  return {
    id: a.id,
    name: a.metric,
    dataset: datasetName,
    metric: a.metric,
    detectedValue: a.actual_value,
    expectedValue: a.expected_value,
    detectedAt: a.detected_at,
    severity: a.severity,
    status: a.status === 'reviewed' ? 'investigating' : a.status as any,
    description: a.description,
  };
}

export default function Anomalies() {
  const navigate = useNavigate();
  const { datasets } = useDatasets();

  const [serverAnomalies, setServerAnomalies]     = useState<Anomaly[]>([]);
  const [detecting, setDetecting]                 = useState(false);
  const [fetching, setFetching]                   = useState(false);
  const [resolvingId, setResolvingId]             = useState<string | null>(null);
  const [detectMessage, setDetectMessage]         = useState<string | null>(null);
  const [severityFilter, setSeverityFilter]       = useState<SeverityFilter>('all');
  const [statusFilter, setStatusFilter]           = useState<StatusFilter>('all');

  // Map dataset id → name
  const datasetMap = useMemo(() => {
    const m: Record<string, string> = {};
    datasets.forEach((d) => { m[d.id] = d.name; });
    return m;
  }, [datasets]);

  // Client-side anomalies derived from dataset metadata (always available)
  const localAnomalies = useMemo<Anomaly[]>(() => {
    const list: Anomaly[] = [];
    datasets.forEach((ds) => {
      if ((ds.missingValues ?? 0) > 0) {
        const pct = Math.round(((ds.missingValues ?? 0) / ds.rows) * 100);
        list.push({
          id: `local_missing_${ds.id}`,
          name: 'Null Values Detected',
          dataset: ds.name,
          metric: 'Data Completeness',
          detectedValue: ds.missingValues ?? 0,
          expectedValue: 0,
          detectedAt: ds.lastUpdated,
          severity: pct > 30 ? 'critical' : pct > 15 ? 'high' : pct > 5 ? 'medium' : 'low',
          status: 'open',
          description: `${ds.missingValues} null/empty cells (${pct}% of rows) in dataset "${ds.name}"`,
        });
      }
      if ((ds.duplicates ?? 0) > 0) {
        const pct = Math.round(((ds.duplicates ?? 0) / ds.rows) * 100);
        list.push({
          id: `local_dups_${ds.id}`,
          name: 'Duplicate Rows Found',
          dataset: ds.name,
          metric: 'Row Integrity',
          detectedValue: ds.duplicates ?? 0,
          expectedValue: 0,
          detectedAt: ds.lastUpdated,
          severity: pct > 10 ? 'high' : 'medium',
          status: 'investigating',
          description: `${ds.duplicates} exact duplicate rows (${pct}%) in dataset "${ds.name}"`,
        });
      }
    });
    return list;
  }, [datasets]);

  // Merge: server anomalies override local ones for same dataset
  const serverDatasetIds = useMemo(
    () => new Set(serverAnomalies.map((a) => a.dataset)),
    [serverAnomalies]
  );

  const allAnomalies = useMemo(() => {
    const local = localAnomalies.filter((a) => !serverDatasetIds.has(a.dataset));
    return [...serverAnomalies, ...local];
  }, [serverAnomalies, localAnomalies, serverDatasetIds]);

  // Fetch stored anomalies from DB
  const fetchFromServer = useCallback(async () => {
    const token = localStorage.getItem('insightai_token');
    if (!token || token === 'guest') return;
    setFetching(true);
    try {
      const res = await apiClient.get<{ success: boolean; data: ApiAnomaly[] }>('/api/v1/anomalies');
      if (res?.data) {
        setServerAnomalies(
          res.data.map((a) => apiToFrontend(a, datasetMap[a.dataset_id] || a.dataset_id))
        );
      }
    } catch {
      // fallback to local
    } finally {
      setFetching(false);
    }
  }, [datasetMap]);

  useEffect(() => { fetchFromServer(); }, [fetchFromServer]);

  // Run Z-score detection on all datasets that are in memory
  const runDetection = async () => {
    const token = localStorage.getItem('insightai_token');
    if (!token || token === 'guest') return;
    if (datasets.length === 0) return;

    setDetecting(true);
    setDetectMessage(null);
    let total = 0;

    for (const ds of datasets) {
      try {
        const res = await apiClient.post<{ success: boolean; data: ApiAnomaly[]; count: number }>(
          `/api/v1/anomalies/detect/${ds.id}`
        );
        total += res?.count ?? 0;
      } catch {
        // Dataset may not be in server memory — skip
      }
    }

    await fetchFromServer();
    setDetectMessage(`Detection complete — ${total} statistical anomalies found across ${datasets.length} dataset(s).`);
    setDetecting(false);
    setTimeout(() => setDetectMessage(null), 5000);
  };

  // Resolve / dismiss an anomaly
  const handleResolve = async (id: string, status: 'resolved' | 'dismissed') => {
    // Optimistic update
    setServerAnomalies((prev) =>
      prev.map((a) => a.id === id ? { ...a, status: status === 'dismissed' ? 'dismissed' as any : 'resolved' as any } : a)
    );

    const token = localStorage.getItem('insightai_token');
    if (!token || token === 'guest') return;

    setResolvingId(id);
    try {
      await apiClient.post(`/api/v1/anomalies/${id}/resolve`, { status });
    } catch {
      // Already updated optimistically
    } finally {
      setResolvingId(null);
    }
  };

  // Filter
  const filtered = allAnomalies.filter((a) => {
    if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
    if (statusFilter !== 'all') {
      if (statusFilter === 'open' && a.status !== 'open') return false;
      if (statusFilter === 'reviewing' && a.status !== 'investigating') return false;
      if (statusFilter === 'resolved' && a.status !== 'resolved') return false;
      if (statusFilter === 'dismissed' && a.status !== 'dismissed') return false;
    }
    return true;
  });

  const stats = [
    { label: 'Total Alerts',    value: allAnomalies.length,                                         color: 'text-slate-700 dark:text-white' },
    { label: 'Critical',        value: allAnomalies.filter((a) => a.severity === 'critical').length, color: 'text-red-600 dark:text-red-400' },
    { label: 'High',            value: allAnomalies.filter((a) => a.severity === 'high').length,     color: 'text-orange-600 dark:text-orange-400' },
    { label: 'Open',            value: allAnomalies.filter((a) => a.status === 'open').length,       color: 'text-amber-600 dark:text-amber-400' },
    { label: 'Resolved',        value: allAnomalies.filter((a) => a.status === 'resolved').length,   color: 'text-emerald-600 dark:text-emerald-400' },
  ];

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Anomaly Detection"
        subtitle="Statistical outlier detection, data quality alerts, and resolution tracking"
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={detecting ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            onClick={runDetection}
            disabled={detecting || datasets.length === 0}
          >
            {detecting ? 'Scanning…' : 'Run Detection'}
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {datasets.length === 0 ? (
          <EmptyState
            title="No Datasets Found"
            description="Upload a CSV dataset to start automated anomaly scanning for missing values, duplicates, and statistical outliers."
            action={{ label: 'Upload Dataset', onClick: () => navigate('/app/datasets') }}
          />
        ) : (
          <>
            {/* Detection result banner */}
            <AnimatePresence>
              {detectMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-sm text-blue-700 dark:text-blue-300"
                >
                  <CheckCircle2 size={15} className="text-blue-500 flex-shrink-0" />
                  {detectMessage}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {stats.map((s) => (
                <div key={s.label} className="card p-4 text-center">
                  <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Dataset coverage */}
            <div className="flex flex-wrap gap-2">
              {datasets.map((ds) => (
                <div key={ds.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-xs text-slate-600 dark:text-slate-400">
                  <Database size={11} />
                  <span>{ds.name}</span>
                  <span className="text-slate-400">
                    ({allAnomalies.filter((a) => a.dataset === ds.name).length} alerts)
                  </span>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <div className="flex bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                {(['all', 'critical', 'high', 'medium', 'low'] as SeverityFilter[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSeverityFilter(s)}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium transition-colors capitalize border-r border-slate-100 dark:border-slate-800 last:border-r-0',
                      severityFilter === s ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="flex bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                {(['all', 'open', 'reviewing', 'resolved', 'dismissed'] as StatusFilter[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium transition-colors capitalize border-r border-slate-100 dark:border-slate-800 last:border-r-0',
                      statusFilter === s ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="section-title">
                  Detected Anomalies
                  <span className="font-normal text-slate-400 ml-1">({filtered.length})</span>
                </h3>
                {fetching && <Loader2 size={14} className="animate-spin text-slate-400" />}
              </div>

              {filtered.length === 0 ? (
                <div className="py-14 text-center">
                  <CheckCircle2 size={32} className="mx-auto text-emerald-400 mb-3" />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {allAnomalies.length === 0
                      ? 'No anomalies detected yet. Click "Run Detection" to scan your datasets.'
                      : 'No anomalies match the current filters.'}
                  </p>
                  {allAnomalies.length === 0 && (
                    <button
                      onClick={runDetection}
                      disabled={detecting}
                      className="mt-3 px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50"
                    >
                      {detecting ? 'Scanning…' : 'Run Detection Now'}
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800">
                        <th className="table-header">Anomaly</th>
                        <th className="table-header">Dataset</th>
                        <th className="table-header">Metric</th>
                        <th className="table-header text-right">Detected</th>
                        <th className="table-header text-right">Expected</th>
                        <th className="table-header">Severity</th>
                        <th className="table-header">Status</th>
                        <th className="table-header">When</th>
                        <th className="table-header">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                      {filtered.map((a, i) => (
                        <motion.tr
                          key={a.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.03 }}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="table-cell">
                            <div className="flex items-start gap-2">
                              <AlertTriangle size={13} className={cn(
                                'mt-0.5 flex-shrink-0',
                                a.severity === 'critical' ? 'text-red-500' :
                                a.severity === 'high' ? 'text-orange-500' :
                                a.severity === 'medium' ? 'text-amber-500' : 'text-slate-400'
                              )} />
                              <div>
                                <p className="font-medium text-slate-800 dark:text-slate-200 text-xs">{a.name}</p>
                                <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs truncate">{a.description}</p>
                              </div>
                            </div>
                          </td>
                          <td className="table-cell text-xs text-slate-500 dark:text-slate-400 max-w-[120px] truncate">{a.dataset}</td>
                          <td className="table-cell text-xs text-slate-500 dark:text-slate-400 max-w-[120px] truncate">{a.metric}</td>
                          <td className="table-cell text-right font-semibold text-red-600 dark:text-red-400 text-xs">
                            {typeof a.detectedValue === 'number' ? a.detectedValue.toLocaleString(undefined, { maximumFractionDigits: 2 }) : a.detectedValue}
                          </td>
                          <td className="table-cell text-right text-xs text-slate-500 dark:text-slate-400">
                            {typeof a.expectedValue === 'number' ? a.expectedValue.toLocaleString(undefined, { maximumFractionDigits: 2 }) : a.expectedValue}
                          </td>
                          <td className="table-cell"><SeverityBadge severity={a.severity} /></td>
                          <td className="table-cell"><StatusBadge status={a.status} /></td>
                          <td className="table-cell text-[11px] text-slate-400 whitespace-nowrap">{formatTimestamp(a.detectedAt)}</td>
                          <td className="table-cell">
                            {(a.status === 'open' || a.status === 'investigating') && !a.id.startsWith('local_') && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleResolve(a.id, 'resolved')}
                                  disabled={resolvingId === a.id}
                                  title="Mark resolved"
                                  className="p-1 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 transition-colors disabled:opacity-40"
                                >
                                  {resolvingId === a.id ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                                </button>
                                <button
                                  onClick={() => handleResolve(a.id, 'dismissed')}
                                  disabled={resolvingId === a.id}
                                  title="Dismiss"
                                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors disabled:opacity-40"
                                >
                                  <XCircle size={13} />
                                </button>
                              </div>
                            )}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
