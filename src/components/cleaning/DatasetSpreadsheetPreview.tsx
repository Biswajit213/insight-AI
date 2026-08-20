import React, { useState, useMemo } from 'react';
import { Search, EyeOff, ArrowUpDown, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import type { DetailedColumnProfile } from '../../types/cleaning';

interface Props {
  headers: string[];
  rows: Record<string, unknown>[];
  profiles?: DetailedColumnProfile[];
}

export function DatasetSpreadsheetPreview({ headers, rows, profiles = [] }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const profileMap = useMemo(() => {
    const map = new Map<string, DetailedColumnProfile>();
    for (const p of profiles) map.set(p.columnName, p);
    return map;
  }, [profiles]);

  const toggleHideColumn = (col: string) => {
    const next = new Set(hiddenCols);
    if (next.has(col)) next.delete(col);
    else next.add(col);
    setHiddenCols(next);
  };

  // Filter & Sort
  const filteredRows = useMemo(() => {
    let result = [...rows];
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      result = result.filter((r) =>
        Object.values(r).some((v) => String(v ?? '').toLowerCase().includes(query))
      );
    }
    if (sortCol) {
      result.sort((a, b) => {
        const valA = a[sortCol] ?? '';
        const valB = b[sortCol] ?? '';
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDir === 'asc' ? valA - valB : valB - valA;
        }
        return sortDir === 'asc'
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }
    return result;
  }, [rows, searchTerm, sortCol, sortDir]);

  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const paginatedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (col: string) => {
    if (sortCol === col) {
      if (sortDir === 'asc') setSortDir('desc');
      else {
        setSortCol(null);
        setSortDir('asc');
      }
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const isCellProblematic = (val: unknown) => {
    if (val === null || val === undefined || String(val).trim() === '' || String(val).toLowerCase() === 'null' || String(val).toLowerCase() === 'n/a') {
      return 'missing';
    }
    return null;
  };

  const visibleHeaders = headers.filter((h) => !hiddenCols.has(h));

  return (
    <div className="card p-5 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-wide">Spreadsheet Data Preview</h3>
          <p className="text-xs text-slate-400">Interactive live dataset grid with column profile badges & quality cell highlights.</p>
        </div>

        {/* Search and Column Controls */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search data cells..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="dropdown relative">
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
              {visibleHeaders.length}/{headers.length} Cols
            </span>
          </div>
        </div>
      </div>

      {/* Spreadsheet Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800/80 no-scrollbar">
        <table className="w-full text-xs text-left text-slate-300 border-collapse">
          <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
            <tr>
              <th className="py-3 px-4 w-12 text-center border-r border-slate-800/60 font-mono text-[10px] text-slate-600">
                #
              </th>
              {visibleHeaders.map((col) => {
                const prof = profileMap.get(col);
                return (
                  <th key={col} className="py-3 px-4 border-r border-slate-800/60 min-w-[140px] select-none">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 truncate">
                        <button
                          onClick={() => handleSort(col)}
                          className="font-bold text-slate-200 hover:text-white flex items-center gap-1 truncate"
                        >
                          {col}
                          <ArrowUpDown size={12} className="text-slate-500" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        {prof?.detectedPII && (
                          <span className="p-0.5 rounded bg-violet-500/20 text-violet-400" title={`PII Detected: ${prof.detectedPII}`}>
                            <Lock size={11} />
                          </span>
                        )}
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-800 text-blue-400 uppercase">
                          {prof?.dataType || 'TEXT'}
                        </span>
                        <button
                          onClick={() => toggleHideColumn(col)}
                          className="p-1 text-slate-500 hover:text-slate-300"
                          title="Hide column"
                        >
                          <EyeOff size={12} />
                        </button>
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50 bg-slate-900/40">
            {paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={visibleHeaders.length + 1} className="text-center py-8 text-slate-500">
                  No matching records found.
                </td>
              </tr>
            ) : (
              paginatedRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-4 text-center font-mono text-[10px] text-slate-500 border-r border-slate-800/60 bg-slate-950/40">
                    {(page - 1) * pageSize + rIdx + 1}
                  </td>
                  {visibleHeaders.map((col) => {
                    const val = row[col];
                    const problem = isCellProblematic(val);
                    return (
                      <td
                        key={col}
                        className={`py-2.5 px-4 border-r border-slate-800/40 font-mono text-slate-200 truncate ${
                          problem === 'missing' ? 'bg-amber-500/10 text-amber-300 font-bold border-amber-500/30' : ''
                        }`}
                      >
                        {val === null || val === undefined || String(val).trim() === '' ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-sans italic">
                            NULL
                          </span>
                        ) : (
                          String(val)
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 pt-2 border-t border-slate-800/60">
        <div>
          Showing <span className="text-white font-semibold">{filteredRows.length > 0 ? (page - 1) * pageSize + 1 : 0}</span> to{' '}
          <span className="text-white font-semibold">{Math.min(filteredRows.length, page * pageSize)}</span> of{' '}
          <span className="text-white font-semibold">{filteredRows.length.toLocaleString()}</span> entries
        </div>

        <div className="flex items-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="px-3 font-semibold text-slate-200">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
