import { AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useDatasets } from '../../context/DatasetContext';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

export function AnomalyCard() {
  const navigate = useNavigate();
  const { datasets } = useDatasets();

  const primaryDs = datasets[0];

  const totalMissing = primaryDs?.missingValues ?? 0;
  const totalDuplicates = primaryDs?.duplicates ?? 0;
  const hasIssues = totalMissing > 0 || totalDuplicates > 0;

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
              {primaryDs ? `Dataset: ${primaryDs.name}` : 'Data Quality Monitor'}
            </p>
          </div>
          <Badge variant={hasIssues ? 'yellow' : 'green'} dot>
            {hasIssues ? `${totalMissing + totalDuplicates} alerts` : 'Clean Data'}
          </Badge>
        </div>

        {/* Insight Box */}
        {hasIssues ? (
          <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/20 mb-4">
            <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              <strong>Data alerts detected in {primaryDs?.name}:</strong> {totalMissing} null entries and {totalDuplicates} duplicate rows found during scan.
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-2.5 p-3.5 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/20 mb-4">
            <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
              <strong>All systems normal.</strong> {primaryDs ? `Dataset "${primaryDs.name}" is fully validated with zero anomalies.` : 'Upload a dataset to initiate real-time anomaly scanning.'}
            </p>
          </div>
        )}
      </div>

      <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/anomalies')}>
        View Anomaly Monitor
        <ArrowRight size={14} />
      </Button>
    </motion.div>
  );
}
