import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, BarChart3, Sparkles, Download, Edit, FileSpreadsheet,
  Search, ChevronDown, ChevronUp, History, Clock, CheckCircle2
} from 'lucide-react';
import Papa from 'papaparse';
import { Header } from '../components/layout/Header';
import { Button } from '../components/common/Button';
import { Badge, StatusBadge } from '../components/common/Badge';
import { useDatasets } from '../context/DatasetContext';
import { AIChatModal } from '../components/ai/AIChatModal';
import { formatBytes, formatDate, formatNumber } from '../lib/utils';
import type { DataColumn } from '../types';

export default function DatasetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { datasets, getDataset, getDatasetData } = useDatasets();

  const dataset = (id ? getDataset(id) : undefined) || datasets[0];
  const { columns: rawColumns, rows: tableData } = getDatasetData(dataset?.id || '');

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ col: string; dir: 'asc' | 'desc' } | null>(null);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const pageSize = 10;

  // Dynamically resolve headers from rawColumns, tableData[0], or dataTypes
  const headers = useMemo(() => {
    if (rawColumns && rawColumns.length > 0) {
      return rawColumns.map((c) => c.name);
    }
    if (tableData && tableData.length > 0 && tableData[0]) {
      return Object.keys(tableData[0]);
    }
    if (dataset?.dataTypes && Object.keys(dataset.dataTypes).length > 0) {
      return Object.keys(dataset.dataTypes);
    }
    return [];
  }, [rawColumns, tableData, dataset]);

  // Dynamically resolve column cards info
  const columns: DataColumn[] = useMemo(() => {
    if (rawColumns && rawColumns.length > 0) return rawColumns;
    if (headers.length > 0) {
      return headers.map((h) => ({
        name: h,
        type: (dataset?.dataTypes?.[h] || 'string') as any,
        nullCount: 0,
        uniqueCount: new Set(tableData.map((r) => r[h])).size || tableData.length,
        sample: tableData.slice(0, 3).map((r) => r[h] as any),
      }));
    }
    return [];
  }, [rawColumns, headers, tableData, dataset]);

  const filtered = tableData.filter((row) =>
    search ? Object.values(row).some((v) => String(v ?? '').toLowerCase().includes(search.toLowerCase())) : true
  );

  const sorted = sort ? [...filtered].sort((a, b) => {
    const va = a[sort.col] ?? '';
    const vb = b[sort.col] ?? '';
    const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true });
    return sort.dir === 'asc' ? cmp : -cmp;
  }) : filtered;

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const rows = sorted.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (col: string) => {
    setSort((prev) => prev?.col === col ? { col, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: 'asc' });
  };

  const handleExportCSV = () => {
    if (!tableData || tableData.length === 0) return;
    const csv = Papa.unparse(tableData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', dataset?.fileName || `${dataset?.name || 'dataset'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!dataset) {
    return (
      <div className="p-6">
        <p className="text-slate-500">Dataset not found.</p>
        <Button variant="secondary" size="sm" onClick={() => navigate('/data-sources')}>Back to Data Sources</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title={dataset.name}
        breadcrumb={[{ label: 'Data Sources' }, { label: dataset.name }]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" icon={<FileSpreadsheet size={15} />} onClick={() => navigate(`/app/datasets/${dataset.id}/edit`)}>Edit Data</Button>
            <Button variant="ghost" size="sm" icon={<BarChart3 size={15} />} onClick={() => navigate('/analysis')}>Analyze</Button>
            <Button variant="ghost" size="sm" icon={<Sparkles size={15} />} onClick={() => setAiChatOpen(true)}>Ask AI</Button>
            <Button variant="secondary" size="sm" icon={<Download size={15} />} onClick={handleExportCSV}>Export CSV</Button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Dataset header */}
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate('/app/datasets')}
            className="mt-1 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{dataset.name}</h2>
              <StatusBadge status={dataset.status} />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{dataset.description}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-400 dark:text-slate-500">
              <span>{dataset.fileName}</span>
              <span>·</span>
              <span>{formatBytes(dataset.sizeBytes)}</span>
              <span>·</span>
              <span>Updated {formatDate(dataset.lastUpdated)}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Rows', value: formatNumber(dataset.rows), icon: '📊' },
            { label: 'Columns', value: String(dataset.columns), icon: '📋' },
            { label: 'Missing Values', value: String(dataset.missingValues ?? 0), icon: '⚠️' },
            { label: 'Duplicates', value: String(dataset.duplicates ?? 0), icon: '🔁' },
          ].map((s) => (
            <div key={s.label} className="card p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">{s.icon}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{s.label}</span>
              </div>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Columns info */}
        <div className="card p-5">
          <h3 className="section-title mb-4">Column Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {columns.map((col) => (
              <div key={col.name} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate pr-2">{col.name}</span>
                  <Badge variant={col.type === 'number' ? 'blue' : col.type === 'date' ? 'purple' : 'gray'} className="text-[10px]">
                    {col.type}
                  </Badge>
                </div>
                <div className="flex gap-4 text-xs text-slate-500 dark:text-slate-400">
                  <span>Unique: {formatNumber(col.uniqueCount)}</span>
                  <span>Nulls: {col.nullCount}</span>
                </div>
                {col.sample && col.sample.length > 0 && (
                  <div className="mt-1.5 text-xs text-slate-400 dark:text-slate-500 truncate">
                    e.g. {col.sample.slice(0, 2).map((s) => String(s)).join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Upload Audit Log */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <History size={16} className="text-blue-500" />
            <h3 className="section-title">Upload & Processing History Audit</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-start gap-2.5 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <Clock size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">Import Timestamp</p>
                <p className="mt-0.5">{formatDate(dataset.lastUpdated)}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">Processing Status</p>
                <p className="mt-0.5">Parsed {formatNumber(dataset.rows)} rows & {dataset.columns} attributes cleanly</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <Sparkles size={16} className="text-violet-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">Data Quality Scan</p>
                <p className="mt-0.5">{dataset.missingValues ?? 0} null values · {dataset.duplicates ?? 0} duplicate entries</p>
              </div>
            </div>
          </div>
        </div>

        {/* Data table */}
        <div className="card overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search data..."
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500 text-slate-900 dark:text-slate-100"
              />
            </div>
            <span className="text-xs text-slate-400 ml-auto">{formatNumber(filtered.length)} records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  {headers.map((h) => (
                    <th
                      key={h}
                      className="table-header cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 select-none whitespace-nowrap"
                      onClick={() => handleSort(h)}
                    >
                      <div className="flex items-center gap-1">
                        {h}
                        {sort?.col === h ? (sort.dir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ChevronDown size={12} className="opacity-0 group-hover:opacity-30" />}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={Math.max(headers.length, 1)} className="text-center py-10 text-slate-400 text-xs">
                      No records found in this dataset.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      {headers.map((h) => (
                        <td key={h} className="table-cell whitespace-nowrap">
                          {h.toLowerCase() === 'status' ? (
                            <Badge variant={String(row[h]).toLowerCase() === 'completed' || String(row[h]).toLowerCase() === 'connected' ? 'green' : String(row[h]).toLowerCase() === 'pending' ? 'yellow' : 'blue'}>
                              {String(row[h] ?? '')}
                            </Badge>
                          ) : (
                            <span>{String(row[h] ?? '')}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Page {page} of {pages} · {formatNumber(filtered.length)} total records
            </span>
            <div className="flex gap-2">
              <Button variant="secondary" size="xs" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
              <Button variant="secondary" size="xs" onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}>Next</Button>
            </div>
          </div>
        </div>
      </div>

      <AIChatModal
        isOpen={aiChatOpen}
        onClose={() => setAiChatOpen(false)}
        dataset={dataset}
      />
    </div>
  );
}
