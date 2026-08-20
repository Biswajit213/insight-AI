import React from 'react';
import type { DatasetVersionItem } from '../../types/cleaning';
import { GitBranch } from 'lucide-react';

interface Props {
  versions: DatasetVersionItem[];
  activeVersionId: string;
  onSelectVersion: (version: DatasetVersionItem) => void;
}

export function DatasetVersionSelector({ versions, activeVersionId, onSelectVersion }: Props) {

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-white shadow-sm">
        <GitBranch size={14} className="text-blue-400" />
        <span>Version:</span>
        <select
          value={activeVersionId}
          onChange={(e) => {
            const v = versions.find((item) => item.id === e.target.value);
            if (v) onSelectVersion(v);
          }}
          className="bg-transparent text-blue-400 font-bold focus:outline-none cursor-pointer pr-1"
        >
          {versions.map((v) => (
            <option key={v.id} value={v.id} className="bg-slate-900 text-white">
              {v.versionLabel} (Score: {v.dataQualityScore}%)
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
