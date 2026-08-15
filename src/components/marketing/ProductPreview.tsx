import React, { useState } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  Search,
  Bell,
  ArrowUpRight,
  Database,
  BarChart2,
  FileSpreadsheet,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

const chartData = [
  { month: 'Jan', revenue: 15, forecast: 16 },
  { month: 'Feb', revenue: 22, forecast: 21 },
  { month: 'Mar', revenue: 18, forecast: 20 },
  { month: 'Apr', revenue: 29, forecast: 28 },
  { month: 'May', revenue: 24, forecast: 26 },
  { month: 'Jun', revenue: 35, forecast: 34 },
  { month: 'Jul', revenue: 31, forecast: 33 },
  { month: 'Aug', revenue: 42.8, forecast: 41 },
];

const categoryData = [
  { name: 'Electronics', value: 36, color: '#3b82f6' },
  { name: 'Clothing', value: 26, color: '#8b5cf6' },
  { name: 'Home & Living', value: 18, color: '#ec4899' },
  { name: 'Beauty', value: 11, color: '#10b981' },
  { name: 'Others', value: 9, color: '#f59e0b' },
];

export function ProductPreview() {
  const [activeTab, setActiveTab] = useState<'overview' | 'insights' | 'quality'>('overview');

  return (
    <div className="relative mx-auto max-w-6xl rounded-3xl bg-slate-950 p-2 sm:p-4 border border-slate-800 shadow-2xl shadow-blue-500/10">
      {/* Outer Glow frame */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600/30 via-indigo-600/30 to-violet-600/30 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition duration-1000 -z-10" />

      {/* Mock Browser Header */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl overflow-hidden text-left shadow-2xl">
        {/* Top Control Bar */}
        <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            <span className="ml-2 text-xs font-semibold text-slate-400 font-mono">app.insightai.com/dashboard</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-slate-900 px-3 py-1 rounded-xl border border-slate-800 text-xs text-slate-400">
              <Search size={13} />
              <span>Search metrics, insights, datasets...</span>
            </div>
            <div className="w-7 h-7 rounded-full bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center text-xs font-bold">
              AN
            </div>
          </div>
        </div>

        {/* Dashboard Shell Body */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* Welcome Banner */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                Welcome back, Alex 👋
              </h3>
              <p className="text-xs text-slate-400">Here's what's happening with your business data today.</p>
            </div>

            {/* Interactive Tab Controls */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'overview'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('insights')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'insights'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                AI Insights (23)
              </button>
              <button
                onClick={() => setActiveTab('quality')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'quality'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Data Quality (94%)
              </button>
            </div>
          </div>

          {/* Key Metric Cards Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Revenue</span>
              <div className="text-xl sm:text-2xl font-extrabold text-white">$42.8M</div>
              <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <ArrowUpRight size={13} /> +18.4% <span className="text-slate-500 font-normal">vs last month</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Orders</span>
              <div className="text-xl sm:text-2xl font-extrabold text-white">24,521</div>
              <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <ArrowUpRight size={13} /> +12.6% <span className="text-slate-500 font-normal">vs last month</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Customers</span>
              <div className="text-xl sm:text-2xl font-extrabold text-white">8,342</div>
              <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <ArrowUpRight size={13} /> +15.2% <span className="text-slate-500 font-normal">vs last month</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Data Quality Score</span>
              <div className="text-xl sm:text-2xl font-extrabold text-white flex items-center justify-between">
                <span>94<span className="text-xs font-normal text-slate-400">/100</span></span>
                <ShieldCheck size={20} className="text-emerald-400" />
              </div>
              <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <ArrowUpRight size={13} /> +8 pts <span className="text-slate-500 font-normal">vs last month</span>
              </div>
            </div>
          </div>

          {/* Main Content Grid based on activeTab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Revenue Trend Chart */}
              <div className="lg:col-span-2 p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">Revenue Overview & AI Forecast</h4>
                    <p className="text-[11px] text-slate-400">Historical performance with AI predictive trendline</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    This Year
                  </span>
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}M`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Sidebar AI Highlight & Category Breakdown */}
              <div className="space-y-4">
                {/* AI Insights Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-blue-950/40 border border-blue-500/20 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-blue-400">
                    <span className="flex items-center gap-1.5"><Sparkles size={14} /> AI EXECUTIVE SUMMARY</span>
                    <span>94% Conf.</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    "Revenue increased by <strong className="text-emerald-400">+18.4%</strong> in August driven by North region Electronics demand. High anomaly detected in May order spike."
                  </p>
                </div>

                {/* Category Share */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Top Category Breakdown</h4>
                  <div className="space-y-2">
                    {categoryData.map((cat) => (
                      <div key={cat.name} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-slate-300">
                          <span>{cat.name}</span>
                          <span>{cat.value}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${cat.value}%`, backgroundColor: cat.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-blue-400">
                  <span className="flex items-center gap-1.5"><TrendingUp size={14} /> REVENUE OPPORTUNITY</span>
                  <span className="text-emerald-400 font-bold">96% Conf.</span>
                </div>
                <h5 className="text-sm font-bold text-white">North Region Demand Expansion</h5>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Average order value in the North region is 23% higher than baseline. Reallocating 15% budget can generate +$240K next quarter.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                  <span className="flex items-center gap-1.5"><AlertTriangle size={14} /> ANOMALY SPIKE DETECTED</span>
                  <span className="text-amber-400 font-bold">97% Conf.</span>
                </div>
                <h5 className="text-sm font-bold text-white">Unusual Electronics Sales Spike</h5>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Electronics category revenue reached $124K, +72% above expected baseline during a short 6-hour promotional flash event.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'quality' && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Data Quality Health Meter</h4>
                  <p className="text-xs text-slate-400">Automated profiling across 119,390 records</p>
                </div>
                <span className="text-xl font-extrabold text-emerald-400">94 / 100</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Completeness</span>
                  <div className="text-lg font-bold text-white">98%</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Accuracy</span>
                  <div className="text-lg font-bold text-white">94%</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Consistency</span>
                  <div className="text-lg font-bold text-white">91%</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Uniqueness</span>
                  <div className="text-lg font-bold text-white">99%</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
