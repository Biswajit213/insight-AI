import React from 'react';
import type { DataQualityScores } from '../../types/cleaning';
import { ShieldCheck, CheckCircle2, AlertTriangle } from 'lucide-react';

interface Props {
  scores: DataQualityScores;
  versionLabel: string;
}

export function DataQualityScoreCard({ scores, versionLabel }: Props) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (score >= 75) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  };

  const getBarColor = (score: number) => {
    if (score >= 90) return 'bg-gradient-to-r from-emerald-500 to-teal-400';
    if (score >= 75) return 'bg-gradient-to-r from-amber-500 to-yellow-400';
    return 'bg-gradient-to-r from-rose-500 to-red-400';
  };

  const metrics = [
    { label: 'Completeness', value: scores.completenessScore },
    { label: 'Accuracy', value: scores.accuracyScore },
    { label: 'Consistency', value: scores.consistencyScore },
    { label: 'Validity', value: scores.validityScore },
    { label: 'Uniqueness', value: scores.uniquenessScore },
    { label: 'Freshness', value: scores.freshnessScore },
  ];

  return (
    <div className="card p-6 relative overflow-hidden bg-slate-900/80 border border-slate-800 backdrop-blur-md rounded-2xl shadow-xl">
      {/* Background ambient light glow */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
        {/* Left Score Gauge */}
        <div className="flex items-center gap-6">
          <div className="relative flex items-center justify-center">
            {/* Score Ring */}
            <div className={`w-32 h-32 rounded-full border-4 flex flex-col items-center justify-center p-2 transition-all ${getScoreColor(scores.overallScore)} shadow-inner`}>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Score</span>
              <span className="text-4xl font-extrabold tracking-tight text-white">{scores.overallScore}</span>
              <span className="text-[11px] font-medium text-slate-400">/ 100</span>
            </div>
            <div className="absolute -bottom-2 px-2.5 py-0.5 rounded-full bg-slate-800 text-[10px] font-bold text-blue-400 border border-blue-500/30 uppercase tracking-widest shadow">
              {versionLabel}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-bold text-white tracking-wide">DATA QUALITY SCORE</h3>
            </div>
            <p className="text-xs text-slate-400 max-w-xs">
              Dynamically evaluated from total dataset profiles, integrity rules, missingness, uniqueness & type validity.
            </p>
            <div className="flex items-center gap-2 pt-2">
              {scores.overallScore >= 90 ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 size={13} /> High Quality - Ready for AI Analysis
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <AlertTriangle size={13} /> Needs Attention - Recommended Cleaning Required
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Metrics Grid */}
        <div className="w-full md:w-80 space-y-2.5 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block border-b border-slate-800 pb-1">
            Quality Dimensions Breakdown
          </span>
          <div className="space-y-2">
            {metrics.map((m) => (
              <div key={m.label} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-300">{m.label}</span>
                  <span className="text-white font-semibold">{m.value}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getBarColor(m.value)}`}
                    style={{ width: `${Math.min(100, Math.max(0, m.value))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
