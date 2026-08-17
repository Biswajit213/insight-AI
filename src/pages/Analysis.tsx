import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  ScatterChart, Scatter, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Header } from '../components/layout/Header';
import { Button } from '../components/common/Button';
import { Select } from '../components/common/Dropdown';
import { useNavigate } from 'react-router-dom';
import { useDatasets } from '../context/DatasetContext';
import { NoDatasets } from '../components/common/EmptyState';
import {
  Sparkles, Download, Filter, BarChart3, LineChart as LineIcon,
  PieChart as PieIcon, Layers, Hash, Calculator, Search, Check, RefreshCw
} from 'lucide-react';
import Papa from 'papaparse';
import { cn, formatNumber } from '../lib/utils';
import type { ChartType } from '../types';

type AggregationMode = 'SUM' | 'AVERAGE' | 'COUNT' | 'MIN' | 'MAX';

const chartTypes: { value: ChartType; label: string; icon: any }[] = [
  { value: 'bar', label: 'Bar Chart', icon: BarChart3 },
  { value: 'line', label: 'Line Chart', icon: LineIcon },
  { value: 'area', label: 'Area Chart', icon: Layers },
  { value: 'pie', label: 'Pie Chart', icon: PieIcon },
  { value: 'donut', label: 'Donut Chart', icon: PieIcon },
  { value: 'scatter', label: 'Scatter Plot', icon: Hash },
  { value: 'combo', label: 'Combo (Bar+Line)', icon: Layers },
];

const PIE_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6', '#f97316'];

export default function Analysis() {
  const navigate = useNavigate();
  const { datasets, getDataset, getDatasetData } = useDatasets();

  // Selection States
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>(datasets[0]?.id || '');
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [aggregation, setAggregation] = useState<AggregationMode>('SUM');
  const [topLimit, setTopLimit] = useState<number>(10);
  const [searchFilter, setSearchFilter] = useState('');

  // Axis States
  const [xAxisCol, setXAxisCol] = useState<string>('');
  const [yAxisCol, setYAxisCol] = useState<string>('');
  const [secondaryYAxisCol, setSecondaryYAxisCol] = useState<string>('');

  // AI & Export State
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeId = selectedDatasetId || datasets[0]?.id || '';
  const selectedDataset = getDataset(activeId);
  const { columns, rows } = getDatasetData(activeId);

  // Classify numeric and categorical columns
  const numericColumns = useMemo(() => columns.filter((c) => c.type === 'number').map((c) => c.name), [columns]);
  const categoryColumns = useMemo(() => columns.map((c) => c.name), [columns]);

  // Default axes selections when dataset changes
  const activeXCol = xAxisCol && categoryColumns.includes(xAxisCol)
    ? xAxisCol
    : categoryColumns[0] || 'Category';

  const activeYCol = yAxisCol && numericColumns.includes(yAxisCol)
    ? yAxisCol
    : numericColumns[0] || (columns.find((c) => c.name !== activeXCol)?.name ?? 'Value');

  const activeSecondaryYCol = secondaryYAxisCol && numericColumns.includes(secondaryYAxisCol)
    ? secondaryYAxisCol
    : numericColumns[1] || '';

  // Process & Aggregate Chart Data dynamically
  const aggregatedChartData = useMemo(() => {
    if (!rows || rows.length === 0) return [];

    const groupedMap = new Map<string, { primaryVals: number[]; secondaryVals: number[] }>();

    for (const r of rows) {
      const rawKey = r[activeXCol];
      const keyStr = rawKey === null || rawKey === undefined || rawKey === '' ? '(empty)' : String(rawKey);

      const pVal = Number(r[activeYCol]);
      const validPVal = isNaN(pVal) ? 0 : pVal;

      const sVal = activeSecondaryYCol ? Number(r[activeSecondaryYCol]) : 0;
      const validSVal = isNaN(sVal) ? 0 : sVal;

      if (!groupedMap.has(keyStr)) {
        groupedMap.set(keyStr, { primaryVals: [], secondaryVals: [] });
      }
      const entry = groupedMap.get(keyStr)!;
      entry.primaryVals.push(validPVal);
      entry.secondaryVals.push(validSVal);
    }

    const calcAgg = (vals: number[], mode: AggregationMode): number => {
      if (vals.length === 0) return 0;
      if (mode === 'SUM') return vals.reduce((a, b) => a + b, 0);
      if (mode === 'AVERAGE') return vals.reduce((a, b) => a + b, 0) / vals.length;
      if (mode === 'COUNT') return vals.length;
      if (mode === 'MIN') return Math.min(...vals);
      if (mode === 'MAX') return Math.max(...vals);
      return 0;
    };

    let result = Array.from(groupedMap.entries()).map(([name, { primaryVals, secondaryVals }]) => {
      const pAgg = Math.round(calcAgg(primaryVals, aggregation) * 100) / 100;
      const sAgg = activeSecondaryYCol ? Math.round(calcAgg(secondaryVals, aggregation) * 100) / 100 : 0;

      return {
        name,
        [activeYCol]: pAgg,
        value: pAgg,
        ...(activeSecondaryYCol ? { [activeSecondaryYCol]: sAgg } : {}),
      };
    });

    // Apply Search Filter
    if (searchFilter) {
      const term = searchFilter.toLowerCase();
      result = result.filter((item) => item.name.toLowerCase().includes(term));
    }

    // Apply Top N limit
    if (topLimit > 0 && result.length > topLimit) {
      result = result.slice(0, topLimit);
    }

    return result;
  }, [rows, activeXCol, activeYCol, activeSecondaryYCol, aggregation, searchFilter, topLimit]);

  // Statistics Metrics calculated from aggregated chart data
  const summaryStats = useMemo(() => {
    if (!aggregatedChartData || aggregatedChartData.length === 0) return null;
    const values = aggregatedChartData.map((d) => Number(d[activeYCol]) || 0);

    const total = values.reduce((a, b) => a + b, 0);
    const avg = total / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);

    return {
      total: Math.round(total * 100) / 100,
      avg: Math.round(avg * 100) / 100,
      max: Math.round(max * 100) / 100,
      min: Math.round(min * 100) / 100,
      count: aggregatedChartData.length,
    };
  }, [aggregatedChartData, activeYCol]);

  // AI Explanation Generator
  const generateExplanation = async () => {
    setLoadingAi(true);
    await new Promise((r) => setTimeout(r, 1000));

    if (selectedDataset && summaryStats && aggregatedChartData.length > 0) {
      const topItem = [...aggregatedChartData].sort((a, b) => Number(b[activeYCol] || 0) - Number(a[activeYCol] || 0))[0];
      const lowestItem = [...aggregatedChartData].sort((a, b) => Number(a[activeYCol] || 0) - Number(b[activeYCol] || 0))[0];

      setAiExplanation(
        `Deep Analysis for dataset "${selectedDataset.name}": ` +
        `Aggregated using ${aggregation} of "${activeYCol}" grouped by "${activeXCol}". ` +
        `Analyzed ${summaryStats.count} distinct categories. ` +
        `The highest value was recorded by "${topItem?.name}" with ${formatNumber(Number(topItem?.[activeYCol] || 0))}, ` +
        `while "${lowestItem?.name}" recorded the lowest at ${formatNumber(Number(lowestItem?.[activeYCol] || 0))}. ` +
        `The overall average across categories is ${formatNumber(summaryStats.avg)} with a cumulative total of ${formatNumber(summaryStats.total)}.`
      );
    }
    setLoadingAi(false);
  };

  // Export CSV Data
  const handleExportCSV = () => {
    if (!aggregatedChartData || aggregatedChartData.length === 0) return;
    const csv = Papa.unparse(aggregatedChartData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedDataset?.name || 'analysis'}_chart_data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToastMessage('Chart data exported to CSV!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Render Charts based on selected chartType
  const renderChart = () => {
    const commonProps = { margin: { top: 15, right: 15, left: 0, bottom: 5 } };
    const dataKeyX = 'name';
    const dataKeyY = activeYCol;

    if (chartType === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={aggregatedChartData} {...commonProps}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
            <XAxis dataKey={dataKeyX} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey={dataKeyY} name={`${aggregation} of ${activeYCol}`} fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={32} />
            {activeSecondaryYCol && (
              <Bar dataKey={activeSecondaryYCol} name={`${aggregation} of ${activeSecondaryYCol}`} fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
            )}
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={aggregatedChartData} {...commonProps}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
            <XAxis dataKey={dataKeyX} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey={dataKeyY} name={`${aggregation} of ${activeYCol}`} stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} />
            {activeSecondaryYCol && (
              <Line type="monotone" dataKey={activeSecondaryYCol} name={`${aggregation} of ${activeSecondaryYCol}`} stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
            )}
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'area') {
      return (
        <ResponsiveContainer width="100%" height={340}>
          <AreaChart data={aggregatedChartData} {...commonProps}>
            <defs>
              <linearGradient id="g_primary" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="g_secondary" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
            <XAxis dataKey={dataKeyX} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey={dataKeyY} name={`${aggregation} of ${activeYCol}`} stroke="#3b82f6" strokeWidth={2} fill="url(#g_primary)" />
            {activeSecondaryYCol && (
              <Area type="monotone" dataKey={activeSecondaryYCol} name={`${aggregation} of ${activeSecondaryYCol}`} stroke="#10b981" strokeWidth={2} fill="url(#g_secondary)" />
            )}
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'pie' || chartType === 'donut') {
      return (
        <ResponsiveContainer width="100%" height={340}>
          <PieChart>
            <Pie
              data={aggregatedChartData}
              cx="50%"
              cy="50%"
              innerRadius={chartType === 'donut' ? 65 : 0}
              outerRadius={115}
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => `${String(name).slice(0, 12)} ${((percent ?? 0) * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {aggregatedChartData.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'scatter') {
      return (
        <ResponsiveContainer width="100%" height={340}>
          <ScatterChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
            <XAxis dataKey={dataKeyX} name={activeXCol} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis dataKey={dataKeyY} name={activeYCol} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Legend />
            <Scatter name={`${activeXCol} vs ${activeYCol}`} data={aggregatedChartData} fill="#8b5cf6" />
          </ScatterChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'combo') {
      return (
        <ResponsiveContainer width="100%" height={340}>
          <ComposedChart data={aggregatedChartData} {...commonProps}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
            <XAxis dataKey={dataKeyX} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey={dataKeyY} name={`${aggregation} of ${activeYCol}`} fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={32} />
            {activeSecondaryYCol && (
              <Line type="monotone" dataKey={activeSecondaryYCol} name={`${aggregation} of ${activeSecondaryYCol}`} stroke="#f59e0b" strokeWidth={3} dot={{ r: 5 }} />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Analysis Workspace" subtitle="Build interactive visualizations, axes mappings, and aggregate data" />

      <div className="flex-1 overflow-y-auto p-6">
        {datasets.length === 0 ? (
          <NoDatasets onUpload={() => navigate('/app/datasets')} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
            {/* Left Column: Interactive Configuration Panel */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-1 space-y-4">
              <div className="card p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="section-title">Configuration</h3>
                  <button
                    onClick={() => {
                      setSearchFilter('');
                      setTopLimit(10);
                    }}
                    className="text-xs text-slate-400 hover:text-blue-500 flex items-center gap-1"
                    title="Reset Filters"
                  >
                    <RefreshCw size={12} /> Reset
                  </button>
                </div>

                {/* Dataset Select */}
                <div>
                  <label className="label">Dataset Source</label>
                  <Select
                    value={activeId}
                    onChange={(val) => {
                      setSelectedDatasetId(val);
                      setXAxisCol('');
                      setYAxisCol('');
                    }}
                    options={datasets.map((d) => ({ value: d.id, label: d.name }))}
                  />
                </div>

                {/* X-Axis Selector */}
                <div>
                  <label className="label">Group / X-Axis Column</label>
                  <Select
                    value={activeXCol}
                    onChange={(val) => setXAxisCol(val)}
                    options={categoryColumns.map((c) => ({ value: c, label: c }))}
                  />
                </div>

                {/* Primary Y-Axis Selector */}
                <div>
                  <label className="label">Metric / Primary Y-Axis</label>
                  <Select
                    value={activeYCol}
                    onChange={(val) => setYAxisCol(val)}
                    options={(numericColumns.length > 0 ? numericColumns : categoryColumns).map((c) => ({
                      value: c,
                      label: c,
                    }))}
                  />
                </div>

                {/* Secondary Y-Axis Selector (Multi-Series) */}
                <div>
                  <label className="label">Secondary Metric (Optional)</label>
                  <Select
                    value={activeSecondaryYCol}
                    onChange={(val) => setSecondaryYAxisCol(val)}
                    options={[
                      { value: '', label: 'None (Single Metric)' },
                      ...numericColumns.filter((c) => c !== activeYCol).map((c) => ({ value: c, label: c })),
                    ]}
                  />
                </div>

                {/* Aggregation Mode */}
                <div>
                  <label className="label">Aggregation Function</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['SUM', 'AVERAGE', 'COUNT', 'MIN', 'MAX'] as AggregationMode[]).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setAggregation(mode)}
                        className={cn(
                          'py-1.5 px-2 text-[11px] font-semibold rounded-lg border transition-all text-center',
                          aggregation === mode
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        )}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Top N Data Limit */}
                <div>
                  <label className="label">Data Points Limit</label>
                  <Select
                    value={String(topLimit)}
                    onChange={(val) => setTopLimit(Number(val))}
                    options={[
                      { value: '5', label: 'Top 5 Records' },
                      { value: '10', label: 'Top 10 Records' },
                      { value: '20', label: 'Top 20 Records' },
                      { value: '0', label: 'All Records' },
                    ]}
                  />
                </div>

                {/* Search / Filter Input */}
                <div>
                  <label className="label">Filter Categories</label>
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filter category name..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <Button
                  variant="primary"
                  className="w-full mt-2"
                  onClick={generateExplanation}
                  loading={loadingAi}
                  icon={<Sparkles size={15} />}
                >
                  Get AI Insight Explanation
                </Button>
              </div>
            </motion.div>

            {/* Right Column: Visualizations & Analytics */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-3 space-y-5">
              {/* Summary Stats Row */}
              {summaryStats && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { label: `Total (${aggregation})`, value: formatNumber(summaryStats.total), color: 'text-blue-600 dark:text-blue-400' },
                    { label: 'Average', value: formatNumber(summaryStats.avg), color: 'text-emerald-600 dark:text-emerald-400' },
                    { label: 'Peak (Max)', value: formatNumber(summaryStats.max), color: 'text-violet-600 dark:text-violet-400' },
                    { label: 'Lowest (Min)', value: formatNumber(summaryStats.min), color: 'text-amber-600 dark:text-amber-400' },
                    { label: 'Categories', value: String(summaryStats.count), color: 'text-slate-700 dark:text-slate-300' },
                  ].map((s) => (
                    <div key={s.label} className="card p-3 text-center">
                      <p className={cn('text-lg font-bold font-mono', s.color)}>{s.value}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Chart Card */}
              <div className="card p-5">
                {/* Header & Chart Selector Ribbon */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-5 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="section-title">{selectedDataset?.name || 'Dataset Visualization'}</h3>
                    <p className="section-subtitle mt-0.5">
                      Grouping <strong className="text-slate-700 dark:text-slate-300">{activeXCol}</strong> by{' '}
                      <strong className="text-slate-700 dark:text-slate-300">{aggregation}({activeYCol})</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {toastMessage && (
                      <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-lg">
                        <Check size={13} /> {toastMessage}
                      </div>
                    )}
                    <Button variant="secondary" size="sm" icon={<Download size={14} />} onClick={handleExportCSV}>
                      Export CSV
                    </Button>
                  </div>
                </div>

                {/* Chart Type Toggle Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-4">
                  {chartTypes.map((t) => {
                    const IconComp = t.icon;
                    return (
                      <button
                        key={t.value}
                        onClick={() => setChartType(t.value)}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap',
                          chartType === t.value
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        )}
                      >
                        <IconComp size={14} />
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Main Rendered Chart */}
                {renderChart()}
              </div>

              {/* AI Explanation Card */}
              {aiExplanation && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card p-5 border-l-4 border-l-violet-500"
                >
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shadow-md">
                      <Sparkles size={14} className="text-white" />
                    </div>
                    <div>
                      <h3 className="section-title">Automated AI Insights</h3>
                      <p className="text-xs text-slate-400">Generated for active aggregation of {activeYCol}</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{aiExplanation}</p>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
