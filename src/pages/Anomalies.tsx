import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { SeverityBadge, StatusBadge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { useDatasets } from '../context/DatasetContext';
import { formatTimestamp, cn } from '../lib/utils';
import type { Anomaly } from '../types';

type SeverityFilter = 'all' | 'critical' | 'high' | 'medium' | 'low';
type StatusFilter = 'all' | 'open' | 'investigating' | 'resolved' | 'dismissed';

export default function Anomalies() {
  const navigate = useNavigate();
  const { datasets } = useDatasets();

  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Compute real anomalies from uploaded datasets
  const computedAnomalies = useMemo<Anomaly[]>(() => {
    const list: Anomaly[] = [];

    datasets.forEach((ds) => {
      if (ds.missingValues && ds.missingValues > 0) {
        list.push({
          id: `anom_missing_${ds.id}`,
          name: 'Null Values Detected',
          dataset: ds.fileName,
          metric: 'Data Completeness',
          detectedValue: ds.missingValues,
          expectedValue: 0,
          detectedAt: ds.lastUpdated,
          severity: ds.missingValues > 100 ? 'critical' : ds.missingValues > 20 ? 'high' : 'medium',
          status: 'open',
          description: `Found ${ds.missingValues} null or empty values across fields in dataset "${ds.name}".`,
        });
      }

      if (ds.duplicates && ds.duplicates > 0) {
        list.push({
          id: `anom_dups_${ds.id}`,
          name: 'Duplicate Rows Found',
          dataset: ds.fileName,
          metric: 'Row Integrity',
          detectedValue: ds.duplicates,
          expectedValue: 0,
          detectedAt: ds.lastUpdated,
          severity: ds.duplicates > 50 ? 'high' : 'medium',
          status: 'investigating',
          description: `Identified ${ds.duplicates} exact duplicate record entries in "${ds.name}".`,
        });
      }
    });

    return list;
  }, [datasets]);

  const filtered = computedAnomalies.filter((a) => {
    if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    return true;
  });

  const stats = [
    { label: 'Total Alerts', value: computedAnomalies.length, color: 'text-slate-700 dark:text-white' },
    { label: 'Critical', value: computedAnomalies.filter((a) => a.severity === 'critical').length, color: 'text-red-600 dark:text-red-400' },
    { label: 'High', value: computedAnomalies.filter((a) => a.severity === 'high').length, color: 'text-orange-600 dark:text-orange-400' },
    { label: 'Medium', value: computedAnomalies.filter((a) => a.severity === 'medium').length, color: 'text-amber-600 dark:text-amber-400' },
    { label: 'Clean Datasets', value: datasets.filter((d) => (d.missingValues || 0) === 0 && (d.duplicates || 0) === 0).length, color: 'text-emerald-600 dark:text-emerald-400' },
  ];

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Anomaly Detection"
        subtitle="Monitor and investigate unusual patterns in your uploaded data"
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {datasets.length === 0 ? (
          <EmptyState
            title="No Data Anomalies Detected"
            description="Upload your CSV datasets to initiate automated scanning for missing values, duplicate rows, and statistical outliers."
            action={{
              label: 'Upload Dataset',
              onClick: () => navigate('/app/datasets'),
            }}
          />
        ) : (
          <>
            {/* Stats bar */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {stats.map((s) => (
                <div key={s.label} className="card p-4 text-center">
                  <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</p>
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
                {(['all', 'open', 'investigating', 'resolved', 'dismissed'] as StatusFilter[]).map((s) => (
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
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="section-title">Detected Anomalies <span className="font-normal text-slate-400 ml-1">({filtered.length})</span></h3>
              </div>
              {filtered.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800">
                        <th className="table-header">Anomaly</th>
                        <th className="table-header">Dataset</th>
                        <th className="table-header">Metric</th>
                        <th className="table-header text-right">Detected Value</th>
                        <th className="table-header text-right">Expected</th>
                        <th className="table-header">Severity</th>
                        <th className="table-header">Status</th>
                        <th className="table-header">Detected</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                      {filtered.map((a, i) => (
                        <motion.tr
                          key={a.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.04 }}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="table-cell">
                            <div>
                              <p className="font-medium text-slate-800 dark:text-slate-200">{a.name}</p>
                              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 max-w-xs truncate">{a.description}</p>
                            </div>
                          </td>
                          <td className="table-cell text-slate-500 dark:text-slate-400">{a.dataset}</td>
                          <td className="table-cell text-slate-500 dark:text-slate-400">{a.metric}</td>
                          <td className="table-cell text-right font-semibold text-red-600 dark:text-red-400">
                            {a.detectedValue}
                          </td>
                          <td className="table-cell text-right text-slate-500 dark:text-slate-400">
                            {a.expectedValue}
                          </td>
                          <td className="table-cell"><SeverityBadge severity={a.severity} /></td>
                          <td className="table-cell"><StatusBadge status={a.status} /></td>
                          <td className="table-cell text-xs text-slate-400 whitespace-nowrap">{formatTimestamp(a.detectedAt)}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 dark:text-slate-600">
                  No data quality anomalies detected for your uploaded datasets.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
