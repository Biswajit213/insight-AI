import { UploadCloud, FileText, Database } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { AIQuestionBar } from '../components/ai/AIQuestionBar';
import { KPISection } from '../components/dashboard/KPISection';
import { ExecutiveSummary } from '../components/dashboard/ExecutiveSummary';
import { SalesChart } from '../components/dashboard/SalesChart';
import { RevenueTrend } from '../components/dashboard/RevenueTrend';
import { DataHealth } from '../components/dashboard/DataHealth';
import { AnomalyCard } from '../components/dashboard/AnomalyCard';
import { RecentAnalyses } from '../components/dashboard/RecentAnalyses';
import { TopProducts } from '../components/dashboard/TopProducts';
import { Button } from '../components/common/Button';
import { useDatasets } from '../context/DatasetContext';
import { useUser } from '../hooks/useUser';

export default function Dashboard() {
  const navigate = useNavigate();
  const { datasets } = useDatasets();
  const user = useUser();

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Dashboard"
        actions={
          <div className="hidden sm:flex items-center gap-2">
            <Button variant="secondary" size="sm" icon={<UploadCloud size={15} />} onClick={() => navigate('/app/datasets')}>
              Upload Data
            </Button>
            <Button variant="primary" size="sm" icon={<FileText size={15} />} onClick={() => navigate('/reports')}>
              Generate Report
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Welcome back, {user.name} 👋
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {datasets.length > 0
                ? `Currently analyzing ${datasets.length} connected user dataset${datasets.length > 1 ? 's' : ''}.`
                : 'Upload a CSV dataset to discover actionable data insights.'}
            </p>
          </div>

          {datasets.length === 0 && (
            <div className="flex items-center gap-2">
              <Button variant="primary" size="sm" icon={<UploadCloud size={15} />} onClick={() => navigate('/app/datasets')}>
                Upload Your First CSV Dataset
              </Button>
            </div>
          )}
        </motion.div>

        {/* AI Question Bar */}
        <AIQuestionBar />

        {/* KPI Cards */}
        <KPISection />

        {/* Grid Section 1: Executive Summary + Data Health */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ExecutiveSummary />
          </div>
          <div>
            <DataHealth />
          </div>
        </div>

        {/* Grid Section 2: Main Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SalesChart />
          <RevenueTrend />
        </div>

        {/* Grid Section 3: Anomaly + Top Products + Recent */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AnomalyCard />
          <TopProducts />
          <RecentAnalyses />
        </div>
      </div>
    </div>
  );
}
