import { useMemo } from 'react';
import { UploadCloud } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useDatasets } from '../../context/DatasetContext';
import { Button } from '../common/Button';

export function SalesChart() {
  const navigate = useNavigate();
  const { datasets, getDatasetData } = useDatasets();

  const primaryDataset = datasets[0];
  const { columns, rows } = getDatasetData(primaryDataset?.id || '');

  const numericCols = columns.filter((c) => c.type === 'number');
  const labelCols = columns.filter((c) => c.type === 'string' || c.type === 'date');

  const xKey = labelCols[0]?.name || (columns[0]?.name ?? 'Category');
  const yKey = numericCols[0]?.name || (columns.find((c) => c.name !== xKey)?.name ?? 'Value');

  const chartData = useMemo(() => {
    if (!rows || rows.length === 0) return [];
    return rows.slice(0, 10).map((row, idx) => {
      const label = String(row[xKey] ?? `Item ${idx + 1}`);
      const rawVal = row[yKey];
      const val = typeof rawVal === 'number' ? rawVal : 1;
      return {
        name: label,
        [yKey]: val,
      };
    });
  }, [rows, xKey, yKey]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.36 }}
      className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#1f2937] rounded-card shadow-card p-5 h-full flex flex-col justify-between"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="section-title">
            {primaryDataset ? `${primaryDataset.name} Distribution` : 'Data Performance Breakdown'}
          </h3>
          <p className="section-subtitle mt-0.5">
            {primaryDataset ? `Field "${yKey}" by "${xKey}"` : 'Real-time metrics from uploaded CSV dataset'}
          </p>
        </div>
      </div>

      {/* Chart or Empty state */}
      {datasets.length === 0 || chartData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
          <UploadCloud size={32} className="text-blue-500 mb-2" />
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">No Datasets Uploaded</p>
          <p className="text-xs text-slate-400 max-w-xs mt-1 mb-4">
            Upload your CSV file to view real-time data visualizations and breakdown charts.
          </p>
          <Button variant="primary" size="sm" icon={<UploadCloud size={14} />} onClick={() => navigate('/app/datasets')}>
            Upload CSV File
          </Button>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip />
            <Legend wrapperStyle={{ paddingTop: 8, fontSize: 11 }} />
            <Bar dataKey={yKey} name={yKey} fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  );
}
