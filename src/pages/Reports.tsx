import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, FileText, Download, Share2, Trash2, MoreHorizontal, Eye, Clock, Database } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Button } from '../components/common/Button';
import { StatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Dropdown } from '../components/common/Dropdown';
import { reportSections } from '../data/reports';
import { useReports } from '../context/ReportContext';
import { useDatasets } from '../context/DatasetContext';
import { NoReports } from '../components/common/EmptyState';
import { generateReportContent } from '../lib/reportGenerator';
import { formatDate, cn } from '../lib/utils';
import type { Report } from '../types';

const typeColors: Record<string, string> = {
  sales:     'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  customer:  'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400',
  marketing: 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400',
  executive: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
  inventory: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
  financial: 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400',
};

export default function Reports() {
  const navigate = useNavigate();
  const { reports, addReport, deleteReport } = useReports();
  const { datasets, getDatasetData } = useDatasets();

  const [builderOpen, setBuilderOpen] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Form states
  const [reportTitle, setReportTitle] = useState('Executive Data & Performance Analysis');
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>(datasets[0]?.id || 'ds1');
  const [reportType, setReportType] = useState<Report['type']>('sales');
  const [selectedSections, setSelectedSections] = useState<string[]>(['s1', 's2', 's3', 's6', 's8']);

  const generate = async () => {
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 1500));

    const targetDataset = datasets.find((d) => d.id === selectedDatasetId) || datasets[0];
    const { columns, rows } = getDatasetData(targetDataset?.id || 'ds1');

    const sectionLabels = selectedSections.map(
      (sId) => reportSections.find((s) => s.id === sId)?.label || 'Analysis Section'
    );

    const generatedContent = generateReportContent(
      reportTitle,
      reportType,
      targetDataset,
      columns,
      rows,
      selectedSections
    );

    const newReportId = `rep_${Date.now()}`;
    const newReport: Report = {
      id: newReportId,
      title: reportTitle.trim() || `${targetDataset.name} Report`,
      type: reportType,
      dataset: targetDataset.fileName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'ready',
      pages: Math.max(3, selectedSections.length * 2),
      sections: sectionLabels,
      description: `Comprehensive AI-generated ${reportType} report analyzing ${targetDataset.name}.`,
    };

    addReport(newReport, generatedContent);

    setGenerating(false);
    setBuilderOpen(false);
    navigate(`/reports/${newReportId}`);
  };

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Reports"
        subtitle="Generate AI-powered reports from your data"
        actions={
          <Button variant="primary" size="sm" icon={<Plus size={15} />} onClick={() => setBuilderOpen(true)}>
            Create Report
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {reports.length === 0 ? (
          <NoReports onCreate={() => setBuilderOpen(true)} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {reports.map((report, i) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card hover:shadow-card-md transition-shadow cursor-pointer p-5"
                onClick={() => navigate(`/reports/${report.id}`)}
              >
                {/* Type badge */}
                <div className="flex items-start justify-between mb-3">
                  <div className={cn('p-2.5 rounded-xl', typeColors[report.type] || typeColors.sales)}>
                    <FileText size={16} />
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <StatusBadge status={report.status} />
                    <Dropdown
                      trigger={
                        <button className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400" aria-label="Actions">
                          <MoreHorizontal size={14} />
                        </button>
                      }
                      items={[
                        { label: 'View report', icon: <Eye size={14} />, onClick: () => navigate(`/reports/${report.id}`) },
                        { label: 'Share', icon: <Share2 size={14} />, onClick: () => navigate(`/reports/${report.id}`) },
                        { divider: true },
                        { label: 'Delete', icon: <Trash2 size={14} />, onClick: () => deleteReport(report.id), danger: true },
                      ]}
                    />
                  </div>
                </div>

                <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm mb-1 line-clamp-2">{report.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">{report.description}</p>

                <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1 truncate max-w-[140px]"><Database size={11} /> {report.dataset}</div>
                  <div className="flex items-center gap-1 ml-auto whitespace-nowrap"><Clock size={11} /> {formatDate(report.createdAt)}</div>
                </div>

                <div className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                  {report.pages} pages · {report.sections.length} sections
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Report Builder Modal */}
      <Modal
        isOpen={builderOpen}
        onClose={() => setBuilderOpen(false)}
        title="Create New Report"
        description="Configure your AI-powered report settings."
        size="lg"
        footer={
          !generating && (
            <>
              <Button variant="secondary" onClick={() => setBuilderOpen(false)}>Cancel</Button>
              <Button variant="primary" loading={generating} onClick={generate} icon={<Plus size={15} />}>
                Generate Report
              </Button>
            </>
          )
        }
      >
        <div className="space-y-4">
          {generating ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">AI is analyzing dataset & building report...</p>
              <p className="text-xs text-slate-400">Synthesizing executive summaries and metrics</p>
            </div>
          ) : (
            <>
              <div>
                <label className="label">Report Title</label>
                <input
                  className="input"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="e.g. Q4 Performance Analysis"
                />
              </div>
              <div>
                <label className="label">Select Dataset</label>
                <select
                  className="input"
                  value={selectedDatasetId}
                  onChange={(e) => setSelectedDatasetId(e.target.value)}
                >
                  {datasets.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.fileName})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Report Type</label>
                <select
                  className="input text-capitalize"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as Report['type'])}
                >
                  <option value="sales">Sales Analysis</option>
                  <option value="customer">Customer Insights</option>
                  <option value="marketing">Marketing ROI</option>
                  <option value="executive">Executive Overview</option>
                  <option value="inventory">Inventory Optimization</option>
                  <option value="financial">Financial Performance</option>
                </select>
              </div>
              <div>
                <label className="label">Sections to Include</label>
                <div className="grid grid-cols-2 gap-2">
                  {reportSections.map((s) => (
                    <label key={s.id} className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedSections.includes(s.id)}
                        onChange={(e) => setSelectedSections((prev) => e.target.checked ? [...prev, s.id] : prev.filter((id) => id !== s.id))}
                        className="mt-0.5 accent-blue-600"
                      />
                      <div>
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{s.label}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">{s.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
