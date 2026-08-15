import React from 'react';
import type { IssueSummaryCounts } from '../../types/cleaning';
import { HelpCircle, Copy, AlertCircle, TrendingUp, Type, FileSpreadsheet, Lock } from 'lucide-react';

interface Props {
  counts: IssueSummaryCounts;
  selectedFilter: string | null;
  onSelectFilter: (filter: string | null) => void;
}

export function QualityMetricCards({ counts, selectedFilter, onSelectFilter }: Props) {
  const cards = [
    {
      id: 'MISSING_VALUE',
      title: 'Missing Values',
      count: counts.missingValues,
      icon: <HelpCircle className="w-5 h-5 text-amber-400" />,
      color: 'hover:border-amber-500/50',
      activeBorder: 'border-amber-500 bg-amber-500/10',
    },
    {
      id: 'DUPLICATE',
      title: 'Duplicates',
      count: counts.duplicates,
      icon: <Copy className="w-5 h-5 text-rose-400" />,
      color: 'hover:border-rose-500/50',
      activeBorder: 'border-rose-500 bg-rose-500/10',
    },
    {
      id: 'INVALID_VALUE',
      title: 'Invalid Values',
      count: counts.invalidValues,
      icon: <AlertCircle className="w-5 h-5 text-red-400" />,
      color: 'hover:border-red-500/50',
      activeBorder: 'border-red-500 bg-red-500/10',
    },
    {
      id: 'OUTLIER',
      title: 'Outliers',
      count: counts.outliers,
      icon: <TrendingUp className="w-5 h-5 text-purple-400" />,
      color: 'hover:border-purple-500/50',
      activeBorder: 'border-purple-500 bg-purple-500/10',
    },
    {
      id: 'INVALID_TYPE',
      title: 'Type Errors',
      count: counts.typeErrors,
      icon: <Type className="w-5 h-5 text-blue-400" />,
      color: 'hover:border-blue-500/50',
      activeBorder: 'border-blue-500 bg-blue-500/10',
    },
    {
      id: 'FORMAT_ERROR',
      title: 'Format Issues',
      count: counts.formatIssues,
      icon: <FileSpreadsheet className="w-5 h-5 text-teal-400" />,
      color: 'hover:border-teal-500/50',
      activeBorder: 'border-teal-500 bg-teal-500/10',
    },
    {
      id: 'PII',
      title: 'PII Detected',
      count: counts.piiCount,
      icon: <Lock className="w-5 h-5 text-violet-400" />,
      color: 'hover:border-violet-500/50',
      activeBorder: 'border-violet-500 bg-violet-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
      {cards.map((c) => {
        const isSelected = selectedFilter === c.id;
        return (
          <button
            key={c.id}
            onClick={() => onSelectFilter(isSelected ? null : c.id)}
            className={`p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
              isSelected
                ? `${c.activeBorder} shadow-lg ring-1 ring-blue-500/50`
                : `bg-slate-900/60 border-slate-800/80 hover:bg-slate-850 ${c.color}`
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 truncate">{c.title}</span>
              {c.icon}
            </div>
            <div className="text-2xl font-extrabold text-white tracking-tight">{c.count.toLocaleString()}</div>
            {isSelected && (
              <span className="text-[10px] text-blue-400 font-bold tracking-wider uppercase mt-1 block">
                ✓ Filtered
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
