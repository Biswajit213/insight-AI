import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  LineChart,
  ShieldAlert,
  GitBranch,
  Search,
  Sliders,
  DollarSign,
  Clock,
  Database,
  Bookmark,
  MoreHorizontal,
  Sparkles,
  MessageSquare,
  Plus,
  Eye,
  FileText,
  Zap
} from 'lucide-react';
import { Button } from '../common/Button';
import { Dropdown } from '../common/Dropdown';
import { InsightMiniChart } from './InsightMiniChart';
import { formatCurrencyImpact } from '../../lib/analyticsEngine';
import { formatTimestamp, cn } from '../../lib/utils';
import type { AIInsight, InsightType } from '../../types';

interface AdvancedInsightCardProps {
  insight: AIInsight;
  index: number;
  isSelected?: boolean;
  onSelect?: (insight: AIInsight) => void;
  onInvestigate: (insight: AIInsight) => void;
  onWhatIf: (insight: AIInsight) => void;
  onAskAi: (insight: AIInsight) => void;
  onSave: (id: string) => void;
  onFeedback: (id: string, feedback: 'useful' | 'not_useful') => void;
  onAddToReport?: (insight: AIInsight) => void;
  onOpenEvidence?: (insight: AIInsight) => void;
}

const typeConfig: Record<InsightType, { icon: any; label: string; bg: string; iconBg: string; border: string }> = {
  trend:          { icon: TrendingDown, label: 'HIGH IMPACT', bg: 'bg-red-500/10 text-red-400 border-red-500/30', iconBg: 'bg-red-500/20 text-red-400', border: 'hover:border-red-500/50' },
  anomaly:        { icon: AlertTriangle, label: 'ANOMALY', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30', iconBg: 'bg-amber-500/20 text-amber-400', border: 'hover:border-amber-500/50' },
  recommendation: { icon: Lightbulb, label: 'RECOMMENDATION', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30', iconBg: 'bg-amber-500/20 text-amber-400', border: 'hover:border-amber-500/50' },
  forecast:       { icon: LineChart, label: 'FORECAST', bg: 'bg-violet-500/10 text-violet-400 border-violet-500/30', iconBg: 'bg-violet-500/20 text-violet-400', border: 'hover:border-violet-500/50' },
  risk:           { icon: ShieldAlert, label: 'RISK', bg: 'bg-red-500/10 text-red-400 border-red-500/30', iconBg: 'bg-red-500/20 text-red-400', border: 'hover:border-red-500/50' },
  root_cause:     { icon: GitBranch, label: 'ROOT CAUSE', bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30', iconBg: 'bg-indigo-500/20 text-indigo-400', border: 'hover:border-indigo-500/50' },
  correlation:    { icon: Search, label: 'CORRELATION', bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30', iconBg: 'bg-purple-500/20 text-purple-400', border: 'hover:border-purple-500/50' },
  opportunity:    { icon: TrendingUp, label: 'OPPORTUNITY', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', iconBg: 'bg-emerald-500/20 text-emerald-400', border: 'hover:border-emerald-500/50' },
  data_quality:   { icon: Database, label: 'DATA QUALITY', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30', iconBg: 'bg-amber-500/20 text-amber-400', border: 'hover:border-amber-500/50' },
};

export const AdvancedInsightCard: React.FC<AdvancedInsightCardProps> = ({
  insight,
  index,
  isSelected,
  onSelect,
  onInvestigate,
  onWhatIf,
  onAskAi,
  onSave,
  onFeedback,
  onAddToReport,
  onOpenEvidence,
}) => {
  const cfg = typeConfig[insight.type] || typeConfig.trend;
  const IconComp = cfg.icon;

  const isAnomaly = insight.type === 'anomaly';
  const isOpportunity = insight.type === 'opportunity';
  const impactVal = insight.estimatedRevenueImpact || 4800000;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      onClick={() => onSelect?.(insight)}
      className={cn(
        'card p-4 transition-all cursor-pointer bg-slate-900/90 border-slate-800/90 hover:shadow-2xl relative overflow-hidden',
        cfg.border,
        isSelected ? 'border-blue-500 shadow-blue-900/20 ring-1 ring-blue-500/50 bg-slate-900' : ''
      )}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* Left 6 Columns: Metadata, Title, Description, Buttons */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center gap-2">
            <div className={cn('p-2 rounded-xl flex-shrink-0', cfg.iconBg)}>
              <IconComp size={18} />
            </div>
            <span className={cn('px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border', cfg.bg)}>
              {cfg.label}
            </span>
          </div>

          <div>
            <h3 className="text-base font-bold text-white leading-snug">{insight.title}</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">{insight.description}</p>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
            <span className="flex items-center gap-1 font-mono">
              <Database size={12} className="text-slate-500" />
              {insight.dataset}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock size={12} className="text-slate-500" />
              {formatTimestamp(insight.timestamp)}
            </span>
          </div>

          {/* Buttons Row */}
          <div className="flex items-center gap-2 flex-wrap pt-1" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="primary"
              size="xs"
              onClick={() => onInvestigate(insight)}
              icon={<Zap size={13} />}
              className="bg-blue-600 hover:bg-blue-500 text-white shadow-sm"
            >
              Investigate
            </Button>

            {isAnomaly ? (
              <Button
                variant="secondary"
                size="xs"
                onClick={() => onOpenEvidence?.(insight)}
                icon={<Eye size={13} />}
                className="bg-slate-800 text-slate-200 border-slate-700"
              >
                View Evidence
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="xs"
                onClick={() => onWhatIf(insight)}
                icon={<Sliders size={13} />}
                className="bg-slate-800 text-slate-200 border-slate-700"
              >
                What-If
              </Button>
            )}

            <Button
              variant="secondary"
              size="xs"
              onClick={() => onAskAi(insight)}
              icon={<MessageSquare size={13} />}
              className="bg-slate-800 text-slate-200 border-slate-700"
            >
              Ask AI
            </Button>

            <button
              onClick={() => onAddToReport?.(insight)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1 text-xs px-2 border border-slate-700"
              title="Add to Report"
            >
              <FileText size={13} />
              <span className="hidden sm:inline">Add to Report</span>
            </button>

            <button
              onClick={() => onSave(insight.id)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
              title="Save Insight"
            >
              <Bookmark size={13} className={insight.saved ? 'text-amber-400 fill-amber-400' : ''} />
            </button>

            <Dropdown
              trigger={
                <button className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700" aria-label="Action Menu">
                  <MoreHorizontal size={14} />
                </button>
              }
              items={[
                { label: 'Investigate Root Cause', icon: <GitBranch size={13} />, onClick: () => onInvestigate(insight) },
                { label: 'What-If Simulation', icon: <Sliders size={13} />, onClick: () => onWhatIf(insight) },
                { label: 'Ask AI Chat', icon: <MessageSquare size={13} />, onClick: () => onAskAi(insight) },
                { label: 'Save Insight', icon: <Bookmark size={13} />, onClick: () => onSave(insight.id) },
                { label: 'Add to Report', icon: <Plus size={13} />, onClick: () => onAddToReport?.(insight) },
              ]}
            />
          </div>
        </div>

        {/* Middle 3 Columns: Recharts Mini Chart with Tag */}
        <div className="lg:col-span-3 bg-slate-950/80 border border-slate-800/80 rounded-xl p-2 flex flex-col justify-center relative">
          {/* Target Value Tag Badge */}
          <div className="absolute top-2 right-2 z-10">
            <span className={cn(
              'text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shadow-sm',
              insight.type === 'anomaly'
                ? 'bg-amber-500 text-black'
                : isOpportunity
                ? 'bg-emerald-500 text-black'
                : 'bg-red-500 text-white'
            )}>
              {insight.type === 'anomaly' ? '9,820' : isOpportunity ? '+27%' : '-18.4%'}
            </span>
          </div>

          <InsightMiniChart data={insight.chartData} kind={insight.chartKind} height={105} />
        </div>

        {/* Right 3 Columns: Progress Bars & Impact Value */}
        <div className="lg:col-span-3 space-y-2 bg-slate-950/80 border border-slate-800/80 rounded-xl p-3">
          {/* Confidence Progress */}
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-400">Confidence</span>
              <span className="font-mono font-bold text-white">{insight.confidence}%</span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${insight.confidence}%` }}></div>
            </div>
          </div>

          {/* Impact Progress */}
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-400">Impact</span>
              <span className="font-mono font-bold text-white">{insight.businessImpactPct}%</span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${insight.businessImpactPct}%` }}></div>
            </div>
          </div>

          {/* Evidence Progress */}
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-400">Evidence</span>
              <span className="font-mono font-bold text-white">{insight.evidenceScore}%</span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${insight.evidenceScore}%` }}></div>
            </div>
          </div>

          {/* Est Impact Value */}
          <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Est. Impact</span>
            <span className={cn(
              'text-base font-bold font-mono',
              isAnomaly
                ? 'text-emerald-400'
                : isOpportunity
                ? 'text-emerald-400'
                : 'text-red-400'
            )}>
              {isAnomaly
                ? '+$2.1M'
                : isOpportunity
                ? '+$3.2M'
                : '-$4.8M'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
