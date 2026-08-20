import React from 'react';
import type { PreviewCleanResult } from '../../types/cleaning';
import { X, CheckCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  preview: PreviewCleanResult | null;
  onConfirmApply: () => void;
  isExecuting: boolean;
}

export function BeforeAfterComparisonModal({
  isOpen,
  onClose,
  preview,
  onConfirmApply,
  isExecuting,
}: Props) {
  if (!isOpen || !preview) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="card w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div>
            <h3 className="text-lg font-bold text-white tracking-wide">BEFORE → AFTER TRANSFORMATION PREVIEW</h3>
            <p className="text-xs text-slate-400">Review exact data modifications before creating a new dataset version.</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X size={18} />
          </button>
        </div>

        {/* Stats summary banner */}
        <div className="p-4 bg-blue-950/40 border-b border-blue-900/40 flex items-center justify-around text-center text-xs">
          <div>
            <span className="text-slate-400 block">Rows Affected</span>
            <span className="text-base font-extrabold text-blue-400">{preview.rowsAffected.toLocaleString()}</span>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div>
            <span className="text-slate-400 block">Columns Affected</span>
            <span className="text-base font-extrabold text-emerald-400">{preview.columnsAffected}</span>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div>
            <span className="text-slate-400 block">Original Dataset State</span>
            <span className="text-xs font-bold text-slate-300">Protected & Intact</span>
          </div>
        </div>

        {/* Diff Samples Table */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Sample Cell Transformations</span>

          {preview.sampleDiffs.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs italic">
              No cell differences detected with the current pipeline steps.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">Row #</th>
                    <th className="py-2.5 px-4">Target Column</th>
                    <th className="py-2.5 px-4">BEFORE Value</th>
                    <th className="py-2.5 px-4">AFTER Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {preview.sampleDiffs.map((diff, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      <td className="py-2 px-4 text-slate-500">{diff.rowIndex + 1}</td>
                      <td className="py-2 px-4 font-sans font-bold text-blue-400">{diff.columnName}</td>
                      <td className="py-2 px-4 text-rose-300 bg-rose-500/10 font-medium">
                        {diff.before === null || diff.before === undefined || String(diff.before).trim() === '' ? (
                          <span className="italic opacity-60">NULL</span>
                        ) : (
                          String(diff.before)
                        )}
                      </td>
                      <td className="py-2 px-4 text-emerald-300 bg-emerald-500/10 font-bold">
                        {String(diff.after)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirmApply}
            disabled={isExecuting}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
          >
            {isExecuting ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <CheckCircle size={16} />
            )}
            Apply Transformations & Save New Version
          </button>
        </div>
      </div>
    </div>
  );
}
