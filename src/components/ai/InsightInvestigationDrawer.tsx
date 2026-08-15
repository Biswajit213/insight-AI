import React from 'react';
import {
  X,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  GitBranch,
  Sliders,
  MessageSquare,
  FileText,
  Bookmark,
  Share2,
  DollarSign
} from 'lucide-react';
import { Button } from '../common/Button';
import { InsightMiniChart } from './InsightMiniChart';
import { formatCurrencyImpact } from '../../lib/analyticsEngine';
import type { AIInsight } from '../../types';

interface InsightInvestigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  insight: AIInsight | null;
  onOpenWhatIf: () => void;
  onOpenEvidence: () => void;
  onOpenAskAi: () => void;
  onToggleSave: () => void;
}

export const InsightInvestigationDrawer: React.FC<InsightInvestigationDrawerProps> = ({
  isOpen,
  onClose,
  insight,
  onOpenWhatIf,
  onOpenEvidence,
  onOpenAskAi,
  onToggleSave,
}) => {
  if (!isOpen || !insight) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-end">
      <div className="bg-slate-900 border-l border-slate-800 w-full max-w-2xl h-full flex flex-col shadow-2xl animate-slideLeft">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white font-bold shadow-lg">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">INSIGHT INVESTIGATION CENTER</h2>
              <p className="text-xs text-slate-400">{insight.dataset} · Verified Data Analysis</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800">
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title & Severity Badge */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {insight.type}
              </span>
              {insight.severity && (
                <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                  insight.severity === 'critical' || insight.severity === 'high'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {insight.severity} Severity
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-white leading-snug">{insight.title}</h1>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">{insight.description}</p>
          </div>

          {/* Scores Matrix Banner */}
          <div className="grid grid-cols-4 gap-2.5 bg-slate-950 border border-slate-800 rounded-xl p-3 text-center">
            <div>
              <p className="text-lg font-bold font-mono text-emerald-400">{insight.confidence}%</p>
              <p className="text-[10px] text-slate-400">AI Confidence</p>
            </div>
            <div>
              <p className="text-lg font-bold font-mono text-blue-400">{insight.businessImpactPct}%</p>
              <p className="text-[10px] text-slate-400">Business Impact</p>
            </div>
            <div>
              <p className="text-lg font-bold font-mono text-purple-400">{insight.evidenceScore}%</p>
              <p className="text-[10px] text-slate-400">Evidence Score</p>
            </div>
            <div>
              <p className="text-lg font-bold font-mono text-amber-400">{insight.insightScore}/100</p>
              <p className="text-[10px] text-slate-400">Insight Score</p>
            </div>
          </div>

          {/* ROOT CAUSE ANALYSIS SECTION (Why did this happen?) */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <GitBranch size={18} className="text-blue-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">WHY DID THIS HAPPEN? (ROOT CAUSES)</h3>
            </div>

            <div className="space-y-3">
              {insight.rootCauses && insight.rootCauses.length > 0 ? (
                insight.rootCauses.map((rc, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-xl">
                      <span className="text-xs font-semibold text-slate-200">{rc.title}</span>
                      <span className={`font-mono text-xs font-bold ${rc.changePct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {rc.changePct >= 0 ? `+${rc.changePct}%` : `${rc.changePct}%`}
                      </span>
                    </div>

                    {rc.subContributors && (
                      <div className="pl-6 space-y-1.5 border-l-2 border-slate-800 ml-3">
                        {rc.subContributors.map((sub, sIdx) => (
                          <div key={sIdx} className="flex items-center justify-between text-xs text-slate-400 py-1 bg-slate-900/50 px-3 rounded-lg">
                            <span>↳ {sub.name}</span>
                            <span className={`font-mono font-medium ${sub.changePct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {sub.changePct >= 0 ? `+${sub.changePct}%` : `${sub.changePct}%`}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">Primary root cause identified in categorical distribution variance.</p>
              )}
            </div>
          </div>

          {/* Contextual Chart */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Trend & Trajectory Visualization</h3>
            <InsightMiniChart data={insight.chartData} kind={insight.chartKind} height={160} />
          </div>

          {/* Business Impact Estimation */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <DollarSign size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-400">Estimated Revenue Opportunity / Loss</p>
                <p className="text-xl font-bold font-mono text-white">{formatCurrencyImpact(insight.estimatedRevenueImpact)}</p>
              </div>
            </div>
            <Button variant="secondary" size="xs" onClick={onOpenWhatIf} icon={<Sliders size={13} />}>
              Run What-If
            </Button>
          </div>

          {/* AI Recommendation Engine Card */}
          {insight.recommendationData && (
            <div className="bg-gradient-to-r from-blue-950/60 to-violet-950/60 border border-blue-500/30 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-blue-400" />
                <h3 className="text-xs font-bold text-blue-300 uppercase tracking-wider">AI RECOMMENDATION</h3>
              </div>
              <p className="text-sm font-semibold text-white">{insight.recommendationData.action}</p>
              <p className="text-xs text-slate-300">{insight.recommendationData.reason}</p>
              <div className="flex items-center gap-3 pt-2 text-xs font-mono">
                <span className="text-emerald-400">Expected: {insight.recommendationData.expectedRevenueImpact}</span>
                <span className="text-slate-400">Risk: {insight.recommendationData.riskLevel}</span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onOpenEvidence} icon={<ShieldCheck size={14} />} className="bg-slate-800 text-slate-300 border-slate-700">
              Evidence Data
            </Button>
            <Button variant="secondary" size="sm" onClick={onOpenAskAi} icon={<MessageSquare size={14} />} className="bg-slate-800 text-slate-300 border-slate-700">
              Ask AI
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={onToggleSave} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors" title="Save Insight">
              <Bookmark size={15} className={insight.saved ? 'text-amber-400 fill-amber-400' : ''} />
            </button>
            <Button variant="primary" size="sm" onClick={onOpenWhatIf} icon={<Sliders size={14} />} className="bg-blue-600 hover:bg-blue-500 text-white">
              Launch What-If
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
