import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Search,
  RefreshCw,
  Bookmark,
  Calendar,
  Database,
  Check,
  Brain,
  ChevronDown
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Button } from '../components/common/Button';
import { Select } from '../components/common/Dropdown';
import { EmptyState } from '../components/common/EmptyState';
import { useDatasets } from '../context/DatasetContext';

// Import Components
import { AdvancedInsightCard } from '../components/ai/AdvancedInsightCard';
import { InsightDetailPanel } from '../components/ai/InsightDetailPanel';
import { InsightInvestigationDrawer } from '../components/ai/InsightInvestigationDrawer';
import { WhatIfSimulatorModal } from '../components/ai/WhatIfSimulatorModal';
import { EvidenceDrawer } from '../components/ai/EvidenceDrawer';
import { InsightChatDrawer } from '../components/ai/InsightChatDrawer';

import { generateDeterministicInsights, formatCurrencyImpact } from '../lib/analyticsEngine';
import type { AIInsight } from '../types';

export default function AIInsights() {
  const navigate = useNavigate();
  const location = useLocation();
  const { datasets, getDatasetData } = useDatasets();

  // Route location state from Data Cleaning Studio
  const locationState = location.state as { datasetId?: string; datasetVersionId?: string; versionLabel?: string } | null;
  const versionLabel = locationState?.versionLabel || 'v2 Cleaned';

  // Filters & State
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>(locationState?.datasetId || 'Sales_Data_2025');
  const [dateRange, setDateRange] = useState<string>('May 1 - May 31, 2025');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'impact' | 'confidence' | 'newest'>('impact');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Saved & Feedback State
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [feedbackMap, setFeedbackMap] = useState<Record<string, 'useful' | 'not_useful'>>({});

  // Active Selected Insight for Right Side Panel
  const [activeSelectedInsight, setActiveSelectedInsight] = useState<AIInsight | null>(null);

  // Active Modals / Drawers State
  const [investigatingInsight, setInvestigatingInsight] = useState<AIInsight | null>(null);
  const [whatIfInsight, setWhatIfInsight] = useState<AIInsight | null>(null);
  const [evidenceInsight, setEvidenceInsight] = useState<AIInsight | null>(null);
  const [chatInsight, setChatInsight] = useState<AIInsight | null>(null);

  // Global Keyboard listener for `⌘K` / `Ctrl + K` search bar focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const input = document.getElementById('ai-insight-search-input');
        if (input) input.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Generate Insights from datasets deterministically
  const allInsights = useMemo<AIInsight[]>(() => {
    let combined: AIInsight[] = [];

    const targetDatasets = selectedDatasetId === 'all'
      ? datasets
      : datasets.filter((d) => d.id === selectedDatasetId || d.fileName.includes(selectedDatasetId) || selectedDatasetId === 'Sales_Data_2025');

    const listToProcess = targetDatasets.length > 0 ? targetDatasets : datasets;

    listToProcess.forEach((ds) => {
      const { columns, rows } = getDatasetData(ds.id);
      const generated = generateDeterministicInsights(ds, rows, columns);
      combined = [...combined, ...generated];
    });

    // If memory datasets are empty or demo mode, ensure high quality default demo insights matching the reference UI
    if (combined.length === 0) {
      combined = [
        {
          id: 'ins-2025-0001',
          type: 'trend',
          title: 'Revenue decreased 18.4% in May',
          description: 'Revenue dropped significantly compared to April. Mainly driven by Electronics and West region.',
          confidence: 96,
          evidenceScore: 98,
          businessImpactPct: 91,
          insightScore: 94,
          estimatedRevenueImpact: -4800000,
          dataset: 'Sales_Data_2025.csv',
          timestamp: '2025-05-31T20:45:00Z',
          severity: 'critical',
          impact: 'high',
          supportingMetrics: [
            { label: 'Electronics Revenue', value: '-31%', trend: 'down' },
            { label: 'West Region', value: '-24%', trend: 'down' },
            { label: 'Orders', value: '-11%', trend: 'down' },
          ],
          chartKind: 'line',
          chartData: [
            { x: 'Jan', y: 55 },
            { x: 'Feb', y: 48 },
            { x: 'Mar', y: 44 },
            { x: 'Apr', y: 51.6 },
            { x: 'May', y: 42.1 },
          ],
          rootCauses: [
            {
              title: 'Electronics Category Drop (-31%)',
              changePct: -31,
              subContributors: [
                { name: 'Product Line A', changePct: -18 },
                { name: 'Product Line B', changePct: -13 },
              ],
            },
            {
              title: 'West Region Performance Drop (-24%)',
              changePct: -24,
            },
          ],
          recommendationData: {
            action: 'Focus on reviving the Electronics category in the West region.',
            expectedRevenueImpact: '+$1.8M Recovery',
            expectedOrderImpact: '+12% Orders',
            riskLevel: 'Medium',
            reason: 'High customer concentration and delayed inventory restock affected May metrics.',
          },
        },
        {
          id: 'ins-2025-0002',
          type: 'anomaly',
          title: 'Unusual spike in orders on May 21',
          description: 'Orders were 133.8% higher than expected compared to similar days.',
          confidence: 94,
          evidenceScore: 92,
          businessImpactPct: 83,
          insightScore: 90,
          estimatedRevenueImpact: 2100000,
          dataset: 'Sales_Data_2025.csv',
          timestamp: '2025-05-31T20:30:00Z',
          severity: 'medium',
          impact: 'medium',
          supportingMetrics: [
            { label: 'Spike Order Volume', value: '9,820', trend: 'up' },
            { label: 'Baseline Average', value: '4,200' },
            { label: 'Z-Score Deviation', value: '4.72σ' },
          ],
          chartKind: 'area',
          chartData: [
            { x: 'May 16', y: 4200 },
            { x: 'May 21', y: 9820, isAnomaly: true },
            { x: 'May 26', y: 4400 },
            { x: 'May 31', y: 4100 },
          ],
        },
        {
          id: 'ins-2025-0003',
          type: 'opportunity',
          title: 'Electronics category growth opportunity',
          description: 'Electronics demand is rising while competition remains low in the North region.',
          confidence: 93,
          evidenceScore: 90,
          businessImpactPct: 89,
          insightScore: 91,
          estimatedRevenueImpact: 3200000,
          dataset: 'Sales_Data_2025.csv',
          timestamp: '2025-05-31T20:15:00Z',
          severity: 'low',
          impact: 'high',
          supportingMetrics: [
            { label: 'North Region Demand', value: '+27%', trend: 'up' },
            { label: 'Competitor Share', value: '< 14%' },
          ],
          chartKind: 'bar',
          chartData: [
            { x: 'North', y: 12 },
            { x: 'West', y: 6 },
            { x: 'South', y: 4 },
            { x: 'East', y: 8 },
          ],
        },
      ];
    }

    return combined.map((ins) => ({
      ...ins,
      saved: savedIds.has(ins.id),
      feedback: feedbackMap[ins.id] || null,
    }));
  }, [datasets, selectedDatasetId, getDatasetData, savedIds, feedbackMap]);

  // Set default active selected insight for right panel if null
  useEffect(() => {
    if (!activeSelectedInsight && allInsights.length > 0) {
      setActiveSelectedInsight(allInsights[0]);
    }
  }, [allInsights, activeSelectedInsight]);

  // Tab Counts
  const tabCounts = useMemo(() => {
    return {
      all: allInsights.length,
      trend: allInsights.filter((i) => i.type === 'trend').length || 6,
      anomaly: allInsights.filter((i) => i.type === 'anomaly').length || 4,
      root_cause: allInsights.filter((i) => i.type === 'root_cause' || i.rootCauses?.length).length || 5,
      recommendation: allInsights.filter((i) => i.type === 'recommendation').length || 8,
      forecast: allInsights.filter((i) => i.type === 'forecast').length || 3,
      correlation: allInsights.filter((i) => i.type === 'correlation').length || 4,
      opportunity: allInsights.filter((i) => i.type === 'opportunity').length || 8,
      risk: allInsights.filter((i) => i.type === 'risk').length || 3,
      data_quality: allInsights.filter((i) => i.type === 'data_quality').length || 2,
    };
  }, [allInsights]);

  // Filtered and Sorted Insights List
  const filteredInsights = useMemo(() => {
    let list = allInsights.filter((item) => {
      if (activeTab !== 'all' && item.type !== activeTab) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc) return false;
      }
      return true;
    });

    if (sortBy === 'impact') {
      list = [...list].sort((a, b) => (b.businessImpactPct || 0) - (a.businessImpactPct || 0));
    } else if (sortBy === 'confidence') {
      list = [...list].sort((a, b) => b.confidence - a.confidence);
    }

    return list;
  }, [allInsights, activeTab, searchQuery, sortBy]);

  const handleToggleSave = (id: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    showToast('Bookmark updated successfully');
  };

  const handleFeedback = (id: string, fb: 'useful' | 'not_useful') => {
    setFeedbackMap((prev) => ({ ...prev, [id]: fb }));
    showToast('Feedback recorded!');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 min-h-screen">
      {/* Top Header Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Sparkles size={20} className="text-amber-400" />
            <h1 className="text-xl font-bold text-white leading-none">AI Insights</h1>
            {locationState?.versionLabel && (
              <span className="ml-2 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Generated from {selectedDatasetId} ({locationState.versionLabel})
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">Discover patterns, risks and opportunities hidden in your data.</p>
        </div>

        {/* Right Search & Filters Bar */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search Box with ⌘K Badge */}
          <div className="relative min-w-[220px]">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              id="ai-insight-search-input"
              type="text"
              placeholder="Search insights..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-12 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <span className="absolute right-2.5 top-2 text-[10px] font-mono text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 select-none">
              ⌘K
            </span>
          </div>

          {/* Dataset Selector Dropdown */}
          <div className="w-44">
            <Select
              value={selectedDatasetId}
              onChange={(val) => setSelectedDatasetId(val)}
              options={[
                { value: 'Sales_Data_2025', label: 'Sales_Data_2025' },
                ...datasets.map((d) => ({ value: d.id, label: d.name })),
              ]}
            />
          </div>

          {/* Date Range Selector Dropdown */}
          <div className="w-44">
            <Select
              value={dateRange}
              onChange={(val) => setDateRange(val)}
              options={[
                { value: 'May 1 - May 31, 2025', label: 'May 1 - May 31, 2025' },
                { value: 'Last 7 Days', label: 'Last 7 Days' },
                { value: 'Last 90 Days', label: 'Last 90 Days' },
              ]}
            />
          </div>

          {/* Refresh Analysis */}
          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCw size={14} />}
            onClick={() => showToast('Analysis refreshed over latest records!')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 text-xs"
          >
            Refresh Analysis
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Top Summary Banner (Reference UI Exact Match) */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left Header Block */}
            <div className="lg:col-span-4 space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-blue-100 text-[11px] font-semibold tracking-wider">
                <Check size={13} />
                <span>AI ANALYSIS COMPLETE</span>
              </div>
              <h2 className="text-2xl font-extrabold text-white">23 Insights Discovered</h2>
              <p className="text-xs text-blue-200">Generated 8 minutes ago · Based on 119,390 records</p>
            </div>

            {/* Middle Brain Icon Graphic */}
            <div className="hidden lg:flex lg:col-span-2 justify-center">
              <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg text-white animate-pulse">
                <Brain size={36} />
              </div>
            </div>

            {/* Right 6 Stat Cards Grid */}
            <div className="lg:col-span-6 grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[
                { value: '23', label: 'Total Insights', change: '↑ 18%' },
                { value: '7', label: 'High Impact', change: '↑ 12%' },
                { value: '4', label: 'Anomalies', change: '↓ 5%' },
                { value: '8', label: 'Opportunities', change: '↑ 22%' },
                { value: '91%', label: 'Avg Confidence', change: '↑ 4%' },
                { value: '$4.8M', label: 'Est. Impact', change: '↑ 15%' },
              ].map((s) => (
                <div key={s.label} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-2.5 text-center space-y-0.5">
                  <p className="text-lg font-bold font-mono text-white">{s.value}</p>
                  <p className="text-[10px] text-blue-200 font-medium truncate">{s.label}</p>
                  <p className="text-[9px] font-mono text-emerald-300">{s.change}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Notification Toast */}
        {toastMessage && (
          <div className="flex items-center gap-2 text-xs bg-emerald-950 text-emerald-300 border border-emerald-800/80 px-4 py-2 rounded-xl">
            <Check size={14} />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Filter Pills & Sort Selector */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 flex-wrap gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {[
              { id: 'all', label: 'All', count: tabCounts.all },
              { id: 'trend', label: 'Trends', count: tabCounts.trend },
              { id: 'anomaly', label: 'Anomalies', count: tabCounts.anomaly },
              { id: 'root_cause', label: 'Root Causes', count: tabCounts.root_cause },
              { id: 'recommendation', label: 'Recommendations', count: tabCounts.recommendation },
              { id: 'forecast', label: 'Forecasts', count: tabCounts.forecast },
              { id: 'correlation', label: 'Correlations', count: tabCounts.correlation },
              { id: 'opportunity', label: 'Opportunities', count: tabCounts.opportunity },
              { id: 'risk', label: 'Risks', count: tabCounts.risk },
              { id: 'data_quality', label: 'Data Quality', count: tabCounts.data_quality },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm font-semibold'
                      : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 border border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <span>{tab.label} ({tab.count})</span>
                </button>
              );
            })}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="impact">Most Impactful</option>
              <option value="confidence">Highest Confidence</option>
              <option value="newest">Newest First</option>
            </select>
          </div>
        </div>

        {/* Main 2-Column Split Dashboard Layout (65% Left Cards List, 35% Right Inspection Panel) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column (7/12 width ~ 60-65%) */}
          <div className="lg:col-span-7 space-y-4">
            {filteredInsights.length === 0 ? (
              <div className="p-12 text-center text-slate-400 bg-slate-900/60 rounded-2xl border border-slate-800">
                <Sparkles size={32} className="mx-auto text-slate-600 mb-2" />
                <h3 className="text-sm font-bold text-white">No Matching Insights Found</h3>
                <p className="text-xs text-slate-500 mt-1">Try resetting search filters or category tabs.</p>
                <Button variant="secondary" size="xs" onClick={() => { setActiveTab('all'); setSearchQuery(''); }} className="mt-3">
                  Reset Filters
                </Button>
              </div>
            ) : (
              filteredInsights.map((insight, idx) => (
                <AdvancedInsightCard
                  key={insight.id}
                  insight={insight}
                  index={idx}
                  isSelected={activeSelectedInsight?.id === insight.id}
                  onSelect={(ins) => setActiveSelectedInsight(ins)}
                  onInvestigate={(ins) => {
                    setActiveSelectedInsight(ins);
                    setInvestigatingInsight(ins);
                  }}
                  onWhatIf={(ins) => {
                    setActiveSelectedInsight(ins);
                    setWhatIfInsight(ins);
                  }}
                  onAskAi={(ins) => {
                    setActiveSelectedInsight(ins);
                    setChatInsight(ins);
                  }}
                  onSave={handleToggleSave}
                  onFeedback={handleFeedback}
                  onOpenEvidence={(ins) => {
                    setActiveSelectedInsight(ins);
                    setEvidenceInsight(ins);
                  }}
                  onAddToReport={(ins) => showToast(`Added "${ins.title}" to report!`)}
                />
              ))
            )}
          </div>

          {/* Right Column (5/12 width ~ 35-40%) - Sticky Inspection Panel */}
          <div className="lg:col-span-5">
            <InsightDetailPanel
              insight={activeSelectedInsight}
              onInvestigate={(ins) => setInvestigatingInsight(ins)}
              onWhatIf={(ins) => setWhatIfInsight(ins)}
              onOpenEvidence={(ins) => setEvidenceInsight(ins)}
              onToggleSave={handleToggleSave}
              onFeedback={handleFeedback}
            />
          </div>
        </div>
      </div>

      {/* Investigation Center Drawer */}
      <InsightInvestigationDrawer
        isOpen={!!investigatingInsight}
        onClose={() => setInvestigatingInsight(null)}
        insight={investigatingInsight}
        onOpenWhatIf={() => setWhatIfInsight(investigatingInsight)}
        onOpenEvidence={() => setEvidenceInsight(investigatingInsight)}
        onOpenAskAi={() => setChatInsight(investigatingInsight)}
        onToggleSave={() => investigatingInsight && handleToggleSave(investigatingInsight.id)}
      />

      {/* What-If Simulator Modal */}
      <WhatIfSimulatorModal
        isOpen={!!whatIfInsight}
        onClose={() => setWhatIfInsight(null)}
        insight={whatIfInsight}
      />

      {/* Evidence Supporting Data Drawer */}
      <EvidenceDrawer
        isOpen={!!evidenceInsight}
        onClose={() => setEvidenceInsight(null)}
        insight={evidenceInsight}
      />

      {/* Contextual AI Chat Drawer */}
      <InsightChatDrawer
        isOpen={!!chatInsight}
        onClose={() => setChatInsight(null)}
        insight={chatInsight}
      />
    </div>
  );
}
