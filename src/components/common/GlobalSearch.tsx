import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, LayoutDashboard, Database, FileText, Sparkles, AlertTriangle, Settings, ArrowRight } from 'lucide-react';
import { useDatasets } from '../../context/DatasetContext';
import { reports } from '../../data/reports';
import { cn } from '../../lib/utils';

const quickLinks = [
  { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={16} />, type: 'page' },
  { label: 'Data Sources', path: '/data-sources', icon: <Database size={16} />, type: 'page' },
  { label: 'AI Insights', path: '/ai-insights', icon: <Sparkles size={16} />, type: 'page' },
  { label: 'Reports', path: '/reports', icon: <FileText size={16} />, type: 'page' },
  { label: 'Anomalies', path: '/anomalies', icon: <AlertTriangle size={16} />, type: 'page' },
  { label: 'Settings', path: '/settings', icon: <Settings size={16} />, type: 'page' },
];

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const { datasets } = useDatasets();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const q = query.toLowerCase();
  const filteredDatasets = q ? datasets.filter((d) => d.name.toLowerCase().includes(q) || d.fileName.toLowerCase().includes(q)) : [];
  const filteredReports = q ? reports.filter((r) => r.title.toLowerCase().includes(q)) : [];
  const filteredLinks = quickLinks.filter((l) => !q || l.label.toLowerCase().includes(q));

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
    setQuery('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#1f2937] shadow-2xl animate-slide-up overflow-hidden">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <Search size={18} className="text-slate-400" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, datasets, reports..."
            className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 text-sm outline-none"
          />
          {query ? (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <X size={16} />
            </button>
          ) : (
            <kbd className="text-[10px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 text-slate-500 font-medium">ESC</kbd>
          )}
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto py-2">
          {/* Pages */}
          {filteredLinks.length > 0 && (
            <SearchSection title="Pages">
              {filteredLinks.map((link) => (
                <SearchItem key={link.path} icon={link.icon} label={link.label} subtitle="Page" onClick={() => handleSelect(link.path)} />
              ))}
            </SearchSection>
          )}

          {/* Datasets */}
          {filteredDatasets.length > 0 && (
            <SearchSection title="Datasets">
              {filteredDatasets.map((ds) => (
                <SearchItem key={ds.id} icon={<Database size={16} />} label={ds.name} subtitle={ds.fileName} onClick={() => handleSelect(`/data-sources/${ds.id}`)} />
              ))}
            </SearchSection>
          )}

          {/* Reports */}
          {filteredReports.length > 0 && (
            <SearchSection title="Reports">
              {filteredReports.map((r) => (
                <SearchItem key={r.id} icon={<FileText size={16} />} label={r.title} subtitle={r.dataset} onClick={() => handleSelect(`/reports/${r.id}`)} />
              ))}
            </SearchSection>
          )}

          {query && filteredDatasets.length === 0 && filteredReports.length === 0 && filteredLinks.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              No results found for "<strong className="text-slate-700 dark:text-slate-300">{query}</strong>"
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-600">
          <div className="flex items-center gap-3">
            <span><kbd className="bg-slate-100 dark:bg-slate-800 rounded px-1.5 py-0.5">↑↓</kbd> navigate</span>
            <span><kbd className="bg-slate-100 dark:bg-slate-800 rounded px-1.5 py-0.5">Enter</kbd> select</span>
          </div>
          <span><kbd className="bg-slate-100 dark:bg-slate-800 rounded px-1.5 py-0.5">Esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}

function SearchSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-600">{title}</p>
      {children}
    </div>
  );
}

function SearchItem({ icon, label, subtitle, onClick }: { icon: React.ReactNode; label: string; subtitle?: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group text-left"
    >
      <span className="text-slate-400 dark:text-slate-500">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{label}</p>
        {subtitle && <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{subtitle}</p>}
      </div>
      <ArrowRight size={14} className="text-slate-300 dark:text-slate-700 group-hover:text-blue-500 transition-colors" />
    </button>
  );
}
