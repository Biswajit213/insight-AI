import { TrendingUp, DollarSign, Database, FileText, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDatasets } from '../../context/DatasetContext';
import { formatNumber, cn } from '../../lib/utils';
import type { KPICard } from '../../types';

const colorConfig = {
  blue:    { icon: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
  emerald: { icon: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' },
  violet:  { icon: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400' },
  amber:   { icon: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' },
};

function KPICardItem({ card, index }: { card: KPICard; index: number }) {
  const config = colorConfig[card.color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.08 }}
      className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#1f2937] rounded-card shadow-card p-5 hover:shadow-card-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn('p-2.5 rounded-xl', config.icon)}>
          {card.icon === 'Database' && <Database size={18} />}
          {card.icon === 'FileText' && <FileText size={18} />}
          {card.icon === 'Activity' && <Activity size={18} />}
          {card.icon === 'DollarSign' && <DollarSign size={18} />}
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
          {card.changeLabel}
        </span>
      </div>

      <div>
        <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{card.value}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{card.title}</p>
      </div>

      <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-400 dark:text-slate-500">
        <TrendingUp size={14} className="text-emerald-500" />
        <span className="font-semibold text-emerald-600 dark:text-emerald-400">Live Sync</span>
        <span>· Real Uploaded Data</span>
      </div>
    </motion.div>
  );
}

export function KPISection() {
  const { datasets } = useDatasets();

  const totalDatasets = datasets.length;
  const totalRecords = datasets.reduce((acc, d) => acc + d.rows, 0);
  const totalColumns = datasets.reduce((acc, d) => acc + d.columns, 0);
  const totalMissing = datasets.reduce((acc, d) => acc + (d.missingValues || 0), 0);

  const totalCells = datasets.reduce((acc, d) => acc + d.rows * d.columns, 0);
  const dataCompleteness = totalCells > 0
    ? Math.max(0, Math.round(((totalCells - totalMissing) / totalCells) * 100))
    : 100;

  const dynamicCards: KPICard[] = [
    {
      id: 'kpi-1',
      title: 'Connected Datasets',
      value: String(totalDatasets),
      rawValue: totalDatasets,
      change: 100,
      changeLabel: 'Total Active',
      trend: 'up',
      icon: 'Database',
      color: 'blue',
      sparkData: [1, 2, 3, totalDatasets],
    },
    {
      id: 'kpi-2',
      title: 'Total Analyzed Records',
      value: formatNumber(totalRecords),
      rawValue: totalRecords,
      change: 100,
      changeLabel: 'Rows Parsed',
      trend: 'up',
      icon: 'FileText',
      color: 'emerald',
      sparkData: [0, 50, 100, totalRecords],
    },
    {
      id: 'kpi-3',
      title: 'Data Completeness',
      value: `${dataCompleteness}%`,
      rawValue: dataCompleteness,
      change: 0,
      changeLabel: `${totalMissing} missing values`,
      trend: 'up',
      icon: 'Activity',
      color: 'violet',
      sparkData: [90, 95, 98, dataCompleteness],
    },
    {
      id: 'kpi-4',
      title: 'Data Attributes',
      value: String(totalColumns),
      rawValue: totalColumns,
      change: 0,
      changeLabel: 'Total Columns',
      trend: 'up',
      icon: 'DollarSign',
      color: 'amber',
      sparkData: [2, 5, 10, totalColumns],
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {dynamicCards.map((card, i) => (
        <KPICardItem key={card.id} card={card} index={i} />
      ))}
    </div>
  );
}
