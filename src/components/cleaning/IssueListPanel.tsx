import React, { useState } from 'react';
import type { DataQualityIssueItem } from '../../types/cleaning';
import { AlertOctagon, AlertTriangle, Info, Wrench, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  issues: DataQualityIssueItem[];
  selectedFilter: string | null;
  onApplySingleFix: (issue: DataQualityIssueItem, params?: Record<string, unknown>) => void;
}

export function IssueListPanel({ issues, selectedFilter, onApplySingleFix }: Props) {
  const [expandedIssueId, setExpandedIssueId] = useState<string | null>(null);
  const [imputeStrategy, setImputeStrategy] = useState<string>('median');
  const [customVal, setCustomVal] = useState<string>('');

  const filtered = selectedFilter
    ? issues.filter((i) => i.issueType === selectedFilter)
    : issues;

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertOctagon className="w-4 h-4 text-rose-400" />;
      case 'medium':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      default:
        return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="card p-5 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-white tracking-wide">
            DETECTED DATA QUALITY ISSUES ({filtered.length})
          </h3>
          <p className="text-xs text-slate-400">
            {selectedFilter ? `Filtered by ${selectedFilter}` : 'Showing all detected defects across dataset columns.'}
          </p>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-8 text-center bg-slate-950/40 rounded-xl border border-slate-800 text-slate-400 text-xs">
          No quality issues found for the selected filter criteria.
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((issue) => {
            const isExpanded = expandedIssueId === issue.id;
            return (
              <div
                key={issue.id}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 hover:border-slate-700 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getSeverityIcon(issue.severity)}</div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-white">{issue.description}</span>
                        {issue.columnName && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-blue-400">
                            Col: {issue.columnName}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                          {issue.issueType}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Affected: <span className="text-slate-200 font-semibold">{issue.rowCount.toLocaleString()} rows</span> ({issue.percentage}%)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        onApplySingleFix(issue, {
                          strategy: imputeStrategy,
                          customValue: customVal || undefined,
                        })
                      }
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center gap-1.5 shadow-md shadow-blue-600/20"
                    >
                      <Wrench size={13} /> {issue.recommendedAction.label}
                    </button>

                    <button
                      onClick={() => setExpandedIssueId(isExpanded ? null : issue.id)}
                      className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* Expanded Action & Strategy Config Panel */}
                {isExpanded && (
                  <div className="pt-3 border-t border-slate-800/80 space-y-3 bg-slate-900/60 p-3 rounded-lg">
                    <div className="text-xs text-slate-300 font-semibold">Customize Action Strategy</div>

                    {issue.issueType === 'MISSING_VALUE' && (
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <span className="text-slate-400">Imputation Strategy:</span>
                        {['median', 'mean', 'mode', 'forward_fill', 'custom'].map((strat) => (
                          <label key={strat} className="flex items-center gap-1 text-slate-300 capitalize cursor-pointer">
                            <input
                              type="radio"
                              name={`strat-${issue.id}`}
                              value={strat}
                              checked={imputeStrategy === strat}
                              onChange={(e) => setImputeStrategy(e.target.value)}
                              className="accent-blue-500"
                            />
                            {strat.replace('_', ' ')}
                          </label>
                        ))}
                        {imputeStrategy === 'custom' && (
                          <input
                            type="text"
                            placeholder="Custom value..."
                            value={customVal}
                            onChange={(e) => setCustomVal(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                          />
                        )}
                      </div>
                    )}

                    {issue.sampleValues && issue.sampleValues.length > 0 && (
                      <div className="text-xs space-y-1">
                        <span className="text-slate-400 font-medium">Sample Values:</span>
                        <div className="flex gap-2 font-mono text-[11px] text-slate-300">
                          {issue.sampleValues.map((v, i) => (
                            <span key={i} className="px-2 py-0.5 bg-slate-950 rounded border border-slate-800">
                              {JSON.stringify(v)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
