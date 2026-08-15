import { MoreHorizontal, Database, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useDatasets } from '../../context/DatasetContext';
import { StatusBadge } from '../common/Badge';
import { Dropdown } from '../common/Dropdown';
import { formatDate } from '../../lib/utils';

export function RecentAnalyses() {
  const navigate = useNavigate();
  const { datasets, deleteDataset } = useDatasets();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.48 }}
      className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#1f2937] rounded-card shadow-card"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="section-title">Active Dataset Pipeline</h3>
          <p className="section-subtitle mt-0.5">Connected datasets & processing runs</p>
        </div>
        <button
          onClick={() => navigate('/data-sources')}
          className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline"
        >
          Manage datasets
        </button>
      </div>

      {datasets.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400">
          No datasets connected. Upload a CSV dataset to initiate automated processing runs.
        </div>
      ) : (
        <div className="divide-y divide-slate-50 dark:divide-slate-800/60">
          {datasets.map((ds, i) => (
            <motion.div
              key={ds.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.05 }}
              className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                <Database size={14} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{ds.name}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{ds.fileName}</p>
              </div>

              <p className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0 hidden sm:block">
                {formatDate(ds.lastUpdated)}
              </p>

              <StatusBadge status={ds.status} />

              <Dropdown
                trigger={
                  <button className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors" aria-label="Actions">
                    <MoreHorizontal size={14} />
                  </button>
                }
                items={[
                  { label: 'View dataset', icon: <Database size={14} />, onClick: () => navigate(`/data-sources/${ds.id}`) },
                  { label: 'Analyze', icon: <BarChart3 size={14} />, onClick: () => navigate('/analysis') },
                  { divider: true },
                  { label: 'Delete', onClick: () => deleteDataset(ds.id), danger: true },
                ]}
              />
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
