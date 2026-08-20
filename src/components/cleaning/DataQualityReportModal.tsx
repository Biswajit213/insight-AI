import React from 'react';
import { X, Download, FileText, ShieldCheck } from 'lucide-react';
import type { DataQualityScanResult, ValidationReport, CleaningOperationRecord } from '../../types/cleaning';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  datasetName: string;
  scanResult: DataQualityScanResult | null;
  validation: ValidationReport | null;
  history: CleaningOperationRecord[];
  onExport: (format: 'csv' | 'json') => void;
}

export function DataQualityReportModal({
  isOpen,
  onClose,
  datasetName,
  scanResult,
  validation,
  history: _history,
  onExport,
}: Props) {
  if (!isOpen || !scanResult) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="card w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">DATA QUALITY REPORT</h3>
              <p className="text-xs text-slate-400">Executive quality audit summary for {datasetName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X size={18} />
          </button>
        </div>

        {/* Report Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Executive Summary Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/60 to-indigo-950/40 border border-blue-800/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Executive Summary</span>
              <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Score: {scanResult.scores.overallScore} / 100
              </span>
            </div>
            <p className="text-slate-200 leading-relaxed text-xs">
              Dataset <strong>{datasetName}</strong> currently has{' '}
              <strong>{scanResult.version.rowCount.toLocaleString()}</strong> rows and{' '}
              <strong>{scanResult.version.columnCount}</strong> columns in active version{' '}
              <strong>{scanResult.version.versionLabel}</strong>. Overall completeness is rated at{' '}
              <strong>{scanResult.scores.completenessScore}%</strong> with{' '}
              <strong>{scanResult.counts.duplicates}</strong> duplicate rows remaining.
            </p>
          </div>

          {/* Quality Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-slate-400 block mb-1">Completeness</span>
              <span className="text-base font-bold text-white">{scanResult.scores.completenessScore}%</span>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-slate-400 block mb-1">Accuracy</span>
              <span className="text-base font-bold text-white">{scanResult.scores.accuracyScore}%</span>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-slate-400 block mb-1">Consistency</span>
              <span className="text-base font-bold text-white">{scanResult.scores.consistencyScore}%</span>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-slate-400 block mb-1">Validity</span>
              <span className="text-base font-bold text-white">{scanResult.scores.validityScore}%</span>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-slate-400 block mb-1">Uniqueness</span>
              <span className="text-base font-bold text-white">{scanResult.scores.uniquenessScore}%</span>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-slate-400 block mb-1">Freshness</span>
              <span className="text-base font-bold text-white">{scanResult.scores.freshnessScore}%</span>
            </div>
          </div>

          {/* Validation Results */}
          {validation && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Post-Cleaning Validation Checks
              </span>
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <ShieldCheck size={16} /> Validation Completed Successfully
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <span>Passed Rules: {validation.passedRulesCount}</span>
                  <span>Failed Rules: {validation.failedRulesCount}</span>
                </div>
              </div>
            </div>
          )}

          {/* Column Profile Table */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Column Profiles Overview</span>
            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Column Name</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Null %</th>
                    <th className="py-2.5 px-3">Unique %</th>
                    <th className="py-2.5 px-3">Outliers</th>
                    <th className="py-2.5 px-3">PII</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {scanResult.profiles.map((p) => (
                    <tr key={p.columnName}>
                      <td className="py-2 px-3 font-sans font-bold text-slate-200">{p.columnName}</td>
                      <td className="py-2 px-3 text-blue-400">{p.dataType}</td>
                      <td className="py-2 px-3 text-amber-300">{p.nullPercentage}%</td>
                      <td className="py-2 px-3">{p.uniquePercentage}%</td>
                      <td className="py-2 px-3 text-purple-300">{p.outlierCount}</td>
                      <td className="py-2 px-3 text-violet-400">{p.detectedPII || 'None'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onExport('csv')}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
            >
              <Download size={13} /> Export CSV
            </button>
            <button
              onClick={() => onExport('json')}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
            >
              <Download size={13} /> Export JSON
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
}
