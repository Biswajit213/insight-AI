import { CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDatasets } from '../../context/DatasetContext';

function ProgressRing({ value, size = 52, strokeWidth = 4, color = '#10b981' }: { value: number; size?: number; strokeWidth?: number; color?: string }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.8s ease' }}
      />
    </svg>
  );
}

export function DataHealth() {
  const { datasets } = useDatasets();

  const totalMissing = datasets.reduce((acc, d) => acc + (d.missingValues || 0), 0);
  const totalDuplicates = datasets.reduce((acc, d) => acc + (d.duplicates || 0), 0);
  const totalCells = datasets.reduce((acc, d) => acc + d.rows * d.columns, 0);

  const completeness = totalCells > 0
    ? Math.max(0, Math.round(((totalCells - totalMissing) / totalCells) * 100))
    : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.44 }}
      className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#1f2937] rounded-card shadow-card p-5 h-full flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="section-title">Data Health</h3>
            <p className="section-subtitle mt-0.5">Quality metrics overview</p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-full">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse-slow" />
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              {completeness >= 95 ? 'Optimal' : completeness >= 80 ? 'Good' : 'Needs Review'}
            </span>
          </div>
        </div>

        {/* Metrics Rings */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <MetricRing label="Completeness" value={completeness} displayValue={`${completeness}%`} color="#10b981" />
          <MetricRing label="Duplicates" value={Math.min(100, totalDuplicates)} displayValue={String(totalDuplicates)} color="#f59e0b" rawLabel />
          <MetricRing label="Missing" value={Math.min(100, totalMissing)} displayValue={String(totalMissing)} color="#3b82f6" rawLabel />
        </div>

        {/* Status list */}
        <div className="space-y-2.5">
          <StatusItem icon={<CheckCircle2 size={14} className="text-emerald-500" />} label="CSV Parser status" status="Active" statusColor="emerald" />
          <StatusItem icon={<CheckCircle2 size={14} className="text-emerald-500" />} label="Type inference" status="Passed" statusColor="emerald" />
          <StatusItem
            icon={totalMissing > 0 ? <AlertCircle size={14} className="text-amber-500" /> : <CheckCircle2 size={14} className="text-emerald-500" />}
            label="Null value scan"
            status={totalMissing > 0 ? `${totalMissing} missing` : 'Passed'}
            statusColor={totalMissing > 0 ? 'amber' : 'emerald'}
          />
        </div>
      </div>
    </motion.div>
  );
}

function MetricRing({ label, value, displayValue, color, rawLabel }: { label: string; value: number; displayValue: string; color: string; rawLabel?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative">
        <ProgressRing value={value} color={color} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-slate-800 dark:text-white">{rawLabel ? displayValue : `${value}%`}</span>
        </div>
      </div>
      <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center leading-tight">{label}</p>
    </div>
  );
}

function StatusItem({ icon, label, status, statusColor }: { icon: React.ReactNode; label: string; status: string; statusColor: string }) {
  const colors: Record<string, string> = {
    emerald: 'text-emerald-600 dark:text-emerald-400',
    amber: 'text-amber-600 dark:text-amber-400',
    red: 'text-red-600 dark:text-red-400',
  };
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs text-slate-600 dark:text-slate-400">{label}</span>
      </div>
      <span className={`text-xs font-medium ${colors[statusColor] ?? ''}`}>{status}</span>
    </div>
  );
}
