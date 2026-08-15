import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Download, Share2, FileText, Clock, Database, Sparkles,
  CheckCircle2, Copy, AlertCircle, FileCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Header } from '../components/layout/Header';
import { Button } from '../components/common/Button';
import { Badge, StatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useReports } from '../context/ReportContext';
import { formatDate } from '../lib/utils';

export default function ReportDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getReport, getReportContent } = useReports();

  const report = getReport(id || '') || getReport('r1');
  const content = report ? getReportContent(report.id) : undefined;

  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  if (!report || !content) {
    return (
      <div className="p-6">
        <p className="text-slate-500">Report not found.</p>
        <Button variant="secondary" size="sm" onClick={() => navigate('/reports')}>Back to Reports</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title={report.title}
        breadcrumb={[{ label: 'Reports' }, { label: report.title }]}
        actions={
          <div className="flex items-center gap-2 print:hidden">
            <Button variant="secondary" size="sm" icon={<Share2 size={15} />} onClick={() => setShareOpen(true)}>Share</Button>
            <Button variant="primary" size="sm" icon={<Download size={15} />} onClick={handleDownloadPDF}>Download PDF</Button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <button
          onClick={() => navigate('/reports')}
          className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors print:hidden"
        >
          <ArrowLeft size={16} /> Back to Reports
        </button>

        {/* Report header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
          <div className="flex items-start gap-4 flex-wrap">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <FileText size={28} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{report.title}</h2>
                <StatusBadge status={report.status} />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{report.description}</p>
              <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500 flex-wrap">
                <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300"><Database size={12} /> {report.dataset}</span>
                <span className="flex items-center gap-1"><Clock size={12} /> Created {formatDate(report.createdAt)}</span>
                <span>{report.pages} pages · {report.sections.length} sections</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Metrics Grid */}
        {content.metrics && content.metrics.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {content.metrics.map((m, i) => (
              <div key={i} className="card p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{m.title}</span>
                  {m.badge && (
                    <Badge variant="blue" className="text-[10px]">{m.badge}</Badge>
                  )}
                </div>
                <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{m.value}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{m.subtitle}</p>
              </div>
            ))}
          </div>
        )}

        {/* AI Executive Summary */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <Sparkles size={16} />
            </div>
            <h3 className="section-title">AI Executive Summary</h3>
            <Badge variant="purple"><Sparkles size={9} /> AI Generated</Badge>
          </div>
          <ul className="space-y-2.5">
            {content.executiveSummary.map((p, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Dynamic Report Sections */}
        <div className="space-y-4">
          <h3 className="section-title text-lg">Detailed Report Sections</h3>
          {content.sections.map((section, idx) => (
            <motion.div
              key={section.id + idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * idx }}
              className="card p-5 space-y-3"
            >
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">
                  {idx + 1}
                </span>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white text-base">{section.title}</h4>
                  <p className="text-xs text-slate-400">{section.summary}</p>
                </div>
              </div>

              {section.bullets && section.bullets.length > 0 && (
                <ul className="space-y-1.5 pl-10 text-sm text-slate-700 dark:text-slate-300 list-disc marker:text-blue-500">
                  {section.bullets.map((b, bIdx) => (
                    <li key={bIdx}>{b}</li>
                  ))}
                </ul>
              )}

              {section.tableData && (
                <div className="mt-3 overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-800">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-slate-500">
                        {section.tableData.headers.map((h) => (
                          <th key={h} className="p-2.5 text-left font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                      {section.tableData.rows.map((r, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          {r.map((c, cIdx) => (
                            <td key={cIdx} className="p-2.5">{String(c)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Strategic Recommendations */}
        {content.recommendations && content.recommendations.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-5 bg-gradient-to-br from-blue-50/40 to-slate-50 dark:from-blue-900/10 dark:to-slate-900/40 border border-blue-100 dark:border-blue-900/30">
            <div className="flex items-center gap-2 mb-3">
              <FileCheck className="text-blue-600 dark:text-blue-400" size={18} />
              <h3 className="section-title">Strategic Action Items</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {content.recommendations.map((rec, rIdx) => (
                <div key={rIdx} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/60 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {rIdx + 1}
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-300">{rec}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Share Modal */}
      <Modal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        title="Share Report"
        description="Share this report with team members or executives."
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="label">Report Link</label>
            <div className="flex gap-2">
              <input
                readOnly
                value={window.location.href}
                className="input text-xs font-mono select-all flex-1"
              />
              <Button variant="secondary" size="sm" icon={copied ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />} onClick={handleCopyLink}>
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>
          <div>
            <label className="label">Send via Email</label>
            <input className="input" placeholder="colleague@company.com" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setShareOpen(false)}>Close</Button>
            <Button variant="primary" size="sm" onClick={() => { setShareOpen(false); alert('Report shared successfully!'); }}>Send Report</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
