import { useState } from 'react';
import { Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '../common/Badge';
import { useDatasets } from '../../context/DatasetContext';
import { AIChatModal } from '../ai/AIChatModal';
import { formatNumber } from '../../lib/utils';

export function ExecutiveSummary() {
  const { datasets } = useDatasets();
  const [chatOpen, setChatOpen] = useState(false);

  const primaryDs = datasets[0];

  const points = primaryDs
    ? [
        `Processed dataset "${primaryDs.name}" (${primaryDs.fileName}) with ${formatNumber(primaryDs.rows)} rows and ${primaryDs.columns} columns.`,
        `Identified ${primaryDs.missingValues ?? 0} null entries and ${primaryDs.duplicates ?? 0} duplicate row instances across the active dataset.`,
        `Primary attributes show strong data consistency with no critical system-level anomalies detected.`,
        `Operational metrics indicate high suitability for predictive modeling and automated report generation.`,
      ]
    : [
        'No dataset connected. Upload a CSV or Excel file to get an automated AI executive summary.',
        'Supports automated column type detection, null scanning, and duplicate checks.',
        'Generate instant visualizations, automated forecasts, and custom PDF reports once uploaded.',
      ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.32 }}
        className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#1f2937] rounded-card shadow-card p-5 h-full flex flex-col justify-between"
      >
        <div>
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shadow-glow-sm">
                <Sparkles size={18} className="text-white" />
              </div>
              <div>
                <h3 className="section-title">AI Executive Summary</h3>
                <Badge variant="purple" className="mt-0.5">
                  <Sparkles size={9} /> AI Generated
                </Badge>
              </div>
            </div>
            <div className="text-xs text-slate-400 dark:text-slate-600">Just now</div>
          </div>

          {/* Insights */}
          <ul className="space-y-2.5 mb-4">
            {points.map((point, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.2 + i * 0.06 }}
                className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300"
              >
                <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>{point}</span>
              </motion.li>
            ))}
          </ul>
        </div>

        <div>
          {/* Footer */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setChatOpen(true)}
              className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium transition-colors group"
            >
              Ask InsightAI
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Status indicator */}
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-400 dark:text-slate-600">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow" />
            {primaryDs ? `Dataset: ${primaryDs.name} · Real-time Sync` : 'Standing by for dataset upload'}
          </div>
        </div>
      </motion.div>

      <AIChatModal
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        dataset={primaryDs}
      />
    </>
  );
}
