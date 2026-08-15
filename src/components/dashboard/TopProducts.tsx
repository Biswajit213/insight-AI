import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useDatasets } from '../../context/DatasetContext';
import { formatNumber, cn } from '../../lib/utils';

export function TopProducts() {
  const { datasets, getDatasetData } = useDatasets();

  const primaryDataset = datasets[0];
  const { columns, rows } = getDatasetData(primaryDataset?.id || '');

  const labelCol = columns.find((c) => c.type === 'string' || c.type === 'date')?.name || columns[0]?.name || 'Item';
  const numericCol = columns.find((c) => c.type === 'number')?.name || columns[1]?.name || 'Count';

  const topItems = useMemo(() => {
    if (!rows || rows.length === 0) return [];

    const counts: Record<string, number> = {};
    for (const r of rows) {
      const key = String(r[labelCol] ?? 'Unknown');
      const val = typeof r[numericCol] === 'number' ? Number(r[numericCol]) : 1;
      counts[key] = (counts[key] || 0) + val;
    }

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const maxVal = sorted[0]?.[1] || 1;

    return sorted.slice(0, 5).map(([name, val], i) => ({
      rank: i + 1,
      name,
      value: val,
      percent: Math.round((val / maxVal) * 100),
    }));
  }, [rows, labelCol, numericCol]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.56 }}
      className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#1f2937] rounded-card shadow-card h-full flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="section-title">
              {primaryDataset ? `Top Entries in ${primaryDataset.name}` : 'Top Category Performance'}
            </h3>
            <p className="section-subtitle mt-0.5">
              {primaryDataset ? `Aggregated by "${labelCol}"` : 'Upload dataset to discover top entries'}
            </p>
          </div>
        </div>

        {datasets.length === 0 || topItems.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No active dataset records. Upload a CSV dataset to automatically aggregate top categories.
          </div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-800/60">
            {topItems.map((item, i) => (
              <div key={item.name + i} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                <span className={cn(
                  'w-6 text-center text-sm font-bold flex-shrink-0',
                  i === 0 ? 'text-amber-500' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-orange-500' : 'text-slate-400'
                )}>
                  {item.rank}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{item.name}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percent}%` }}
                        className="h-full bg-blue-500 rounded-full"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400">{item.percent}%</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{formatNumber(item.value)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
