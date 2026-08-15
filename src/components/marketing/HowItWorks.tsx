import React from 'react';
import { Upload, Sparkles, LineChart, FileCheck2, ArrowRight } from 'lucide-react';

const steps = [
  {
    number: '01',
    title: 'CONNECT',
    description: 'Upload CSV, Excel, JSON or connect your data source in seconds.',
    icon: <Upload className="text-blue-400" size={24} />,
    color: 'border-blue-500/30 bg-blue-500/5',
  },
  {
    number: '02',
    title: 'CLEAN',
    description: 'Automatically detect missing values, duplicates, outliers, and inconsistencies.',
    icon: <Sparkles className="text-emerald-400" size={24} />,
    color: 'border-emerald-500/30 bg-emerald-500/5',
  },
  {
    number: '03',
    title: 'ANALYZE',
    description: 'AI discovers trends, anomalies, correlations, and business opportunities.',
    icon: <LineChart className="text-violet-400" size={24} />,
    color: 'border-violet-500/30 bg-violet-500/5',
  },
  {
    number: '04',
    title: 'ACT',
    description: 'Generate actionable recommendations, forecasts, and executive reports.',
    icon: <FileCheck2 className="text-amber-400" size={24} />,
    color: 'border-amber-500/30 bg-amber-500/5',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-[#0b1120] text-slate-100 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
            Simple 4-Step Process
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            How InsightAI Transforms Your Data
          </h2>
          <p className="text-base sm:text-lg text-slate-400">
            From raw messy files to boardroom-ready insights in four intuitive steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((step, idx) => (
            <div
              key={step.number}
              className={`p-6 rounded-3xl border ${step.color} backdrop-blur-md relative group hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
                    {step.icon}
                  </div>
                  <span className="text-3xl font-black text-slate-700 group-hover:text-blue-400 transition-colors font-mono">
                    {step.number}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white tracking-wide">{step.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{step.description}</p>
              </div>

              {idx < steps.length - 1 && (
                <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-20 text-slate-700">
                  <ArrowRight size={18} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
