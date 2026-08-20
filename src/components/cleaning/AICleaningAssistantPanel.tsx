import React from 'react';
import type { AICleaningSuggestion } from '../../types/cleaning';
import { Bot, Sparkles, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';

interface Props {
  suggestions: AICleaningSuggestion[];
  isLoading: boolean;
  onApplyAll: (suggestions: AICleaningSuggestion[]) => void;
  onReviewSuggestion: (suggestion: AICleaningSuggestion) => void;
}

export function AICleaningAssistantPanel({
  suggestions,
  isLoading,
  onApplyAll,
  onReviewSuggestion,
}: Props) {
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'high':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'medium':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    }
  };

  return (
    <div className="card p-6 bg-gradient-to-br from-slate-900 via-slate-900/90 to-blue-950/40 border border-blue-900/40 rounded-2xl shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-wide">AI CLEANING ASSISTANT</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                <Sparkles size={11} /> Powered by Mistral AI
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Verified profiling rules & statistical pattern suggestions. No raw PII is exposed to AI.
            </p>
          </div>
        </div>

        {suggestions.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onApplyAll(suggestions)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
            >
              <CheckCircle2 size={14} /> Apply Recommended Cleaning ({suggestions.length})
            </button>
          </div>
        )}
      </div>

      {/* Suggestion Content List */}
      {isLoading ? (
        <div className="py-8 text-center space-y-2">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Mistral AI is analyzing dataset profiling metrics...</p>
        </div>
      ) : suggestions.length === 0 ? (
        <div className="py-6 text-center bg-slate-950/40 rounded-xl border border-slate-800/80 p-4">
          <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <p className="text-xs font-semibold text-white">No Critical Issues Found</p>
          <p className="text-[11px] text-slate-400">Your dataset passes all primary AI quality recommendation scans.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-300">
            "{suggestions.length} major data quality action{suggestions.length > 1 ? 's' : ''} recommended by AI engine:"
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {suggestions.map((item, idx) => (
              <div
                key={item.id || idx}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-blue-500/40 transition-all space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getSeverityBadge(
                        item.severity
                      )}`}
                    >
                      {item.severity}
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400 font-semibold flex items-center gap-1">
                      <Sparkles size={11} /> Confidence: {Math.round(item.confidence * 100)}%
                    </span>
                  </div>

                  <p className="text-xs font-bold text-white leading-snug">{item.problem}</p>
                  <p className="text-xs text-slate-400 flex items-start gap-1.5">
                    <ArrowRight size={13} className="text-blue-400 shrink-0 mt-0.5" />
                    <span>{item.recommendation}</span>
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-500">
                    Col: <span className="text-slate-300 font-bold">{item.columnName || 'Dataset'}</span>
                  </span>
                  <button
                    onClick={() => onReviewSuggestion(item)}
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Review Action →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
