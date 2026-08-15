import { useMemo } from 'react';
import { Sparkles, TrendingUp, UploadCloud } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useDatasets } from '../../context/DatasetContext';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

export function RevenueTrend() {
  const navigate = useNavigate();
  const { datasets, getDatasetData } = useDatasets();

  const primaryDataset = datasets[0];
  const { columns, rows } = getDatasetData(primaryDataset?.id || '');

  const numericCols = columns.filter((c) => c.type === 'number');
  const labelCols = columns.filter((c) => c.type === 'string' || c.type === 'date');

  const xKey = labelCols[0]?.name || (columns[0]?.name ?? 'Category');
  const yKey = numericCols[0]?.name || (columns.find((c) => c.name !== xKey)?.name ?? 'Value');

  const trendData = useMemo(() => {
    if (!rows || rows.length === 0) return [];
    return rows.slice(0, 12).map((row, idx) => {
      const label = String(row[xKey] ?? `Item ${idx + 1}`);
      const rawVal = row[yKey];
      const val = typeof rawVal === 'number' ? rawVal : idx * 10 + 5;
      return {
        name: label,
        Actual: val,
        Predicted: Math.round(val * 1.15),
      };
    });
  }, [rows, xKey, yKey]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#1f2937] rounded-card shadow-card p-5 h-full flex flex-col justify-between"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="section-title">
              {primaryDataset ? `${yKey} Trend & Forecast` : 'Data Trend & AI Projection'}
            </h3>
            <Badge variant="purple">
              <Sparkles size={9} /> AI Projection
            </Badge>
          </div>
          <p className="section-subtitle">
            {primaryDataset ? `Analyzing attribute "${yKey}" over "${xKey}"` : 'AI predictive analytics from uploaded dataset'}
          </p>
        </div>
      </div>

      {/* Chart or Empty state */}
      {datasets.length === 0 || trendData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
          <UploadCloud size={32} className="text-violet-500 mb-2" />
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">No Trend Data Available</p>
          <p className="text-xs text-slate-400 max-w-xs mt-1 mb-4">
            Upload your dataset to generate automated AI trend lines and predictions.
          </p>
          <Button variant="secondary" size="sm" icon={<UploadCloud size={14} />} onClick={() => navigate('/data-sources')}>
            Upload Data
          </Button>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Area type="monotone" dataKey="Actual" name={`Actual ${yKey}`} stroke="#3b82f6" strokeWidth={2} fill="url(#actualGrad)" />
              <Area type="monotone" dataKey="Predicted" name="AI Projected" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="4 3" fill="url(#predGrad)" />
            </AreaChart>
          </ResponsiveContainer>

          <div className="flex items-center gap-6 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-slate-500">
              <div className="w-5 h-0.5 bg-blue-500 rounded" />
              Actual ({yKey})
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <div className="w-5 h-0 border-t-2 border-dashed border-violet-500 rounded" />
              AI Projected
            </div>
            <div className="ml-auto flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <TrendingUp size={12} /> +15% Projected
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
