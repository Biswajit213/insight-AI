import { AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useDatasets } from '../../context/DatasetContext';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { cn } from '../../lib/utils';

export function AnomalyCard() {
  const navigate = useNavigate();
  const { datasets } = useDatasets();

  // Aggregate across ALL datasets
  const totalMissing   = datasets.reduce((s, d) => s + (d.missingValues ?? 0), 0);
  const totalDuplicates = datasets.reduce((s, d) => s + (d.duplicates ?? 0), 0);
  const totalAlerts    = (totalMissing > 0 ? 1 : 0) + (totalDuplicates > 0 ? 1 : 0);
  const hasIssues      = totalAlerts > 0;

  // Per-dataset issues for mini list
  const datasetsWithIssues = datasets
    .filter((d) => (d.missingValues ?? 0) > 0 || (d.duplicates ?? 0) > 0)
    .slice(0, 3);

  const cleanCount = datasets.filter(
    (d) => (d.missingValues ?? 0) === 0 && (d.duplicates ?? 0) === 0
  ).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.52 }}
      className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#1f2937] rounded-card shadow-card p-5 h-full flex flex-col justify-between"
    >
      <div>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="section-title">Anomaly Scan</h3>
            <p className="section-subtitle mt-0.5">
              {datasets.length > 0
                ? `${datasets.length} dataset${datasets.length > 1 ? 's' : ''} monitored`
                : 'Data Quality Monitor'}
            </p>
          </div>
          <Badge variant={hasIssues ? 'yellow' : 'green'} dot>
            {hasIssues ? `${totalMissing + totalDuplicates} issues` : 'All Clean'}
          </Badge>
        </div>

        {/* Summary alert or clean state */}
        {datasets.length === 0 ? (
          <div className="flex items-start gap-2.5 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 mb-4">
            <AlertTriangle size={15} className="text-slate-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Upload a dataset to start real-time anomaly scanning.
            </p>
          </div>
        ) : hasIssues ? (
          <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/20 mb-3">
            <AlertTriangle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              <strong>{totalMissing.toLocaleString()}</strong> null cells &amp;{' '}
              <strong>{totalDuplicates.toLocaleString()}</strong> duplicate rows detected.
              {cleanCount > 0 && ` ${cleanCount} dataset${cleanCount > 1 ? 's' : ''} clean.`}
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-2.5 p-3.5 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/20 mb-3">
            <CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
              <strong>All datasets are clean.</strong> Zero missing values or duplicates across {datasets.length} dataset{datasets.length > 1 ? 's' : ''}.
            </p>
          </div>
        )}

        {/* Per-dataset mini list */}
        {datasetsWithIssues.length > 0 && (
          <div className="space-y-1.5 mb-3">
            {datasetsWithIssues.map((ds) => {
              const issues = (ds.missingValues ?? 0) + (ds.duplicates ?? 0);
              const pct = Math.round((issues / ds.rows) * 100);
              return (
                <div key={ds.id} className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                  <span className="text-xs text-slate-600 dark:text-slate-400 truncate max-w-[140px]">{ds.name}</span>
                  <span className={cn(
                    'text-[11px] font-semibold px-1.5 py-0.5 rounded',
                    pct > 15 ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                    pct > 5  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' :
                               'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  )}>
                    {issues} issue{issues > 1 ? 's' : ''} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/app/anomalies')}>
        View Anomaly Monitor
        <ArrowRight size={14} />
      </Button>
    </motion.div>
  );
}
