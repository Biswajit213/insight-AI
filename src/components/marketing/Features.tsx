import React from 'react';
import {
  Sparkles,
  Wrench,
  MessageSquareText,
  AlertTriangle,
  TrendingUp,
  Sliders,
  BarChart2,
  FileCheck2,
} from 'lucide-react';

const features = [
  {
    icon: <Sparkles className="text-blue-400" size={24} />,
    title: 'AI Insights',
    description: 'Discover hidden patterns, trends, and actionable growth opportunities in seconds.',
    tag: 'Automated Discovery',
  },
  {
    icon: <Wrench className="text-emerald-400" size={24} />,
    title: 'AI Data Cleaning',
    description: 'Detect and resolve data-quality problems automatically with dynamic quality scoring.',
    tag: 'Dynamic Profiling',
  },
  {
    icon: <MessageSquareText className="text-violet-400" size={24} />,
    title: 'Ask Your Data',
    description: 'Ask questions about your datasets using natural language and get grounded answers.',
    tag: 'Conversational Analyst',
  },
  {
    icon: <AlertTriangle className="text-amber-400" size={24} />,
    title: 'Anomaly Detection',
    description: 'Identify unusual spikes, drops, and outliers before they impact your business.',
    tag: 'Real-time Guardrails',
  },
  {
    icon: <TrendingUp className="text-cyan-400" size={24} />,
    title: 'Forecasting',
    description: 'Predict future business metrics with historical baseline confidence intervals.',
    tag: 'Predictive Modeling',
  },
  {
    icon: <Sliders className="text-rose-400" size={24} />,
    title: 'What-If Analysis',
    description: 'Simulate pricing, budget, and volume decisions before committing resources.',
    tag: 'Decision Simulator',
  },
  {
    icon: <BarChart2 className="text-indigo-400" size={24} />,
    title: 'Visualization Builder',
    description: 'Turn complex raw datasets into interactive charts and executive dashboards.',
    tag: 'Interactive Charts',
  },
  {
    icon: <FileCheck2 className="text-teal-400" size={24} />,
    title: 'AI Reports',
    description: 'Generate professional boardroom-ready executive reports automatically in PDF & CSV.',
    tag: 'Automated Reporting',
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-slate-950 text-slate-100 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
            Commercial-Grade Suite
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Everything You Need to Understand Your Data
          </h2>
          <p className="text-base sm:text-lg text-slate-400">
            InsightAI combines cutting-edge AI reasoning with verified statistical data engines.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat) => (
            <div
              key={feat.title}
              className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/40 transition-all duration-300 hover:-translate-y-1 space-y-4 group"
            >
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 group-hover:scale-110 transition-transform">
                  {feat.icon}
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300">
                  {feat.tag}
                </span>
              </div>

              <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                {feat.title}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">{feat.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
