import React from 'react';
import type { CleaningOperationRecord } from '../../types/cleaning';
import { History, RotateCcw, User, Calendar, Tag } from 'lucide-react';

interface Props {
  history: CleaningOperationRecord[];
  onRollbackVersion?: (versionId: string) => void;
}

export function CleaningHistoryTable({ history, onRollbackVersion }: Props) {
  return (
    <div className="card p-5 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <History className="w-5 h-5 text-blue-400" />
        <div>
          <h3 className="text-base font-bold text-white tracking-wide">CLEANING OPERATION HISTORY & AUDIT LOG</h3>
          <p className="text-xs text-slate-400">Complete immutable audit log of all transformations applied across dataset versions.</p>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="py-8 text-center text-slate-500 text-xs italic">
          No past cleaning operations recorded for this dataset.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800/80">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Operation</th>
                <th className="py-3 px-4">Target Column</th>
                <th className="py-3 px-4">Rows Affected</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 bg-slate-900/30">
              {history.map((op) => (
                <tr key={op.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-slate-500" />
                      {new Date(op.createdAt).toLocaleString()}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {op.operationType}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-200">
                    {op.columnName || 'All Columns'}
                  </td>
                  <td className="py-3 px-4 font-mono text-emerald-400 font-semibold">
                    {op.rowsAffected.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    <span className="flex items-center gap-1">
                      <User size={12} className="text-slate-500" /> {op.createdBy || 'System User'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {onRollbackVersion && (
                      <button
                        onClick={() => onRollbackVersion(op.datasetVersionId)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors inline-flex items-center gap-1"
                      >
                        <RotateCcw size={12} /> Rollback Here
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
