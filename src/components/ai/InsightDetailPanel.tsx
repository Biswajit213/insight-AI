import React, { useState } from 'react';
import {
  Bookmark,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  ArrowDownRight,
  ArrowUpRight,
  GitBranch,
  ShieldCheck,
  LineChart,
  Lightbulb
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '../common/Button';
import { formatCurrencyImpact } from '../../lib/analyticsEngine';
import type { AIInsight } from '../../types';

interface InsightDetailPanelProps {
  insight: AIInsight | null;
  onInvestigate: (insight: AIInsight) => void;
  onWhatIf: (insight: AIInsight) => void;
  onOpenEvidence: (insight: AIInsight) => void;
  onToggleSave: (id: string) => void;
  onFeedback: (id: string, feedback: 'useful' | 'not_useful') => void;
}

const DONUT_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#64748b'];

const DONUT_DATA = [
  { name: 'Electronics', value: 38 },
  { name: 'Clothing', value: 26 },
  { name: 'Home & Living', value: 18 },
  { name: 'Beauty', value: 11 },
  { name: 'Others', value: 7 },
];

export const InsightDetailPanel: React.FC<InsightDetailPanelProps> = ({
  insight,
  onInvestigate,
  onWhatIf,
  onOpenEvidence,
  onToggleSave,
  onFeedback,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'root_cause' | 'evidence' | 'forecast' | 'recommendations'>('overview');
  const [userFeedback, setUserFeedback] = useState<'useful' | 'not_useful' | null>(insight?.feedback || null);

  if (!insight) {
    return (
      <div className="card p-8 text-center text-slate-400 space-y-3 bg-slate-900/90 border-slate-800 sticky top-4">
        <Sparkles size={32} className="mx-auto text-blue-500" />
        <h3 className="text-sm font-bold text-white">Select an Insight to Inspect</h3>
        <p className="text-xs text-slate-500">Click any insight card on the left to view deep-dive analytics, root causes, evidence, and recommendations.</p>
      </div>
    );
  }

  const isHighImpact = insight.severity === 'critical' || insight.impact === 'high';
  const isAnomaly = insight.type === 'anomaly';
  const isOpportunity = insight.type === 'opportunity' || insight.type === 'recommendation';

  return (
    <div className="card p-5 bg-slate-900/95 border-slate-800 space-y-5 sticky top-4 shadow-2xl">
      {/* Panel Header */}
      <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${
              isAnomaly
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                : isOpportunity
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : 'bg-red-500/20 text-red-400 border-red-500/30'
            }`}>
              {isAnomaly ? 'ANOMALY' : isOpportunity ? 'OPPORTUNITY' : 'HIGH IMPACT'}
            </span>
          </div>
          <h2 className="text-base font-bold text-white leading-snug">{insight.title}</h2>
          <p className="text-[11px] font-mono text-slate-400 mt-1">Insight ID: INS-2025-0001</p>
        </div>

        <button
          onClick={() => onToggleSave(insight.id)}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          title="Bookmark Insight"
        >
          <Bookmark size={16} className={insight.saved ? 'text-amber-400 fill-amber-400' : ''} />
        </button>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-800 pb-2 text-xs overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'root_cause', label: 'Root Cause' },
          { id: 'evidence', label: 'Evidence' },
          { id: 'forecast', label: 'Forecast' },
          { id: 'recommendations', label: 'Recommendations' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                if (tab.id === 'root_cause') onInvestigate(insight);
                if (tab.id === 'evidence') onOpenEvidence(insight);
              }}
              className={`px-3 py-1 rounded-lg transition-colors font-medium whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* AI Summary Section */}
      <div className="space-y-1.5">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles size={13} className="text-blue-400" />
          AI Summary
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
          {insight.description} Revenue dropped significantly compared to April, primarily driven by a 31% drop in Electronics category and 24% drop in sales from the West region.
        </p>
      </div>

      {/* Business Impact Box */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
          <span className="w-2 h-2 rounded-full bg-red-400"></span>
          <span>Business Impact</span>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center pt-1">
          <div>
            <p className="text-[10px] text-slate-400">Revenue Loss</p>
            <p className="text-sm font-bold font-mono text-red-400">-$4.8M</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400">Affected Customers</p>
            <p className="text-sm font-bold font-mono text-slate-200">12,481</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400">Affected Products</p>
            <p className="text-sm font-bold font-mono text-slate-200">27</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400">Severity</p>
            <p className="text-sm font-bold font-mono text-red-400 uppercase">High</p>
          </div>
        </div>
      </div>

      {/* Key Metrics & Revenue Share Donut Chart */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* Left Stats */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2 text-xs">
          <h4 className="font-bold text-slate-300 text-[11px] uppercase tracking-wider mb-2">Key Metrics</h4>
          <div className="flex justify-between text-slate-400">
            <span>This Month (May):</span>
            <strong className="text-white font-mono">$42.1M</strong>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Last Month (Apr):</span>
            <strong className="text-white font-mono">$51.6M</strong>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Change:</span>
            <strong className="text-red-400 font-mono">-18.4%</strong>
          </div>
          <div className="flex justify-between text-slate-400 border-t border-slate-800/80 pt-1.5">
            <span>Change Amount:</span>
            <strong className="text-red-400 font-mono">-$9.5M</strong>
          </div>
        </div>

        {/* Right Donut Chart */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Revenue Share by Category</p>
          <ResponsiveContainer width="100%" height={95}>
            <PieChart>
              <Pie
                data={DONUT_DATA}
                cx="50%"
                cy="50%"
                innerRadius={24}
                outerRadius={38}
                dataKey="value"
                paddingAngle={2}
              >
                {DONUT_DATA.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '10px', color: '#f8fafc' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-x-2 gap-y-0.5 justify-center text-[9px] text-slate-400 mt-1">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>Electronics 38%</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>Clothing 26%</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>Home 18%</span>
          </div>
        </div>
      </div>

      {/* AI Recommendation Box */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <Lightbulb size={13} className="text-amber-400" />
          AI Recommendation
        </h4>
        <p className="text-xs text-slate-300 leading-relaxed">
          Focus on reviving the Electronics category in the West region. Consider discounts, targeted ads, and inventory boost.
        </p>
        <Button
          variant="primary"
          size="xs"
          onClick={() => onInvestigate(insight)}
          className="w-full mt-1 bg-blue-600 hover:bg-blue-500 text-white"
        >
          View Recommendation Details
        </Button>
      </div>

      {/* Was this insight helpful? */}
      <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-xs text-slate-400">
        <span>Was this insight helpful?</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setUserFeedback('useful');
              onFeedback(insight.id, 'useful');
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-colors ${
              userFeedback === 'useful'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <ThumbsUp size={12} /> Yes
          </button>
          <button
            onClick={() => {
              setUserFeedback('not_useful');
              onFeedback(insight.id, 'not_useful');
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-colors ${
              userFeedback === 'not_useful'
                ? 'bg-red-500/20 text-red-400 border-red-500/40 font-bold'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <ThumbsDown size={12} /> No
          </button>
        </div>
      </div>
    </div>
  );
};
