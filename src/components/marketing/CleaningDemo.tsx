import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ShieldCheck, CheckCircle2, AlertOctagon, RefreshCw } from 'lucide-react';

export function CleaningDemo() {
  const navigate = useNavigate();
  const [cleaned, setCleaned] = useState(false);

  const handleOpenCleaning = () => {
    const token = localStorage.getItem('insightai_token');
    if (token) {
      navigate('/app/data-cleaning');
    } else {
      navigate('/login', { state: { returnTo: '/app/data-cleaning' } });
    }
  };

  return (
    <section className="py-24 bg-slate-950 text-slate-100 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Interactive Quality Score Showcase Card */}
          <div className="lg:col-span-7">
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">AI Data Quality & Sanitization Engine</h3>
                    <p className="text-xs text-slate-400">Dataset: Customer_Acquisition_2026.csv (119,390 rows)</p>
                  </div>
                </div>

                <button
                  onClick={() => setCleaned(!cleaned)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all flex items-center gap-1.5"
                >
                  <RefreshCw size={13} className={cleaned ? '' : 'animate-spin'} />
                  {cleaned ? 'Reset Demo' : 'Simulate 1-Click Clean'}
                </button>
              </div>

              {/* Quality Score Meter */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall Data Quality Score</span>
                  <div className="text-3xl sm:text-4xl font-extrabold text-white flex items-center gap-3">
                    <span className={cleaned ? 'text-emerald-400' : 'text-amber-400'}>
                      {cleaned ? '94' : '72'}<span className="text-base font-normal text-slate-500">/100</span>
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cleaned ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                      {cleaned ? '+22 Points Improved' : 'Action Required'}
                    </span>
                  </div>
                </div>

                <div className="w-16 h-16 rounded-full bg-slate-900 border-4 border-slate-800 flex items-center justify-center relative">
                  <ShieldCheck size={28} className={cleaned ? 'text-emerald-400' : 'text-amber-400'} />
                </div>
              </div>

              {/* Before vs After Metric Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Before State */}
                <div className={`p-4 rounded-2xl border transition-all ${!cleaned ? 'bg-slate-950 border-amber-500/30' : 'bg-slate-950/40 border-slate-800 opacity-60'}`}>
                  <div className="flex items-center justify-between text-xs font-bold text-amber-400 mb-3">
                    <span>BEFORE CLEANING</span>
                    <AlertOctagon size={14} />
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex justify-between"><span>Missing Values:</span> <strong className="text-rose-400">124</strong></li>
                    <li className="flex justify-between"><span>Duplicates:</span> <strong className="text-rose-400">42</strong></li>
                    <li className="flex justify-between"><span>Invalid Dates:</span> <strong className="text-rose-400">18</strong></li>
                    <li className="flex justify-between"><span>Format Issues:</span> <strong className="text-amber-400">31</strong></li>
                  </ul>
                </div>

                {/* After State */}
                <div className={`p-4 rounded-2xl border transition-all ${cleaned ? 'bg-slate-950 border-emerald-500/40 shadow-lg shadow-emerald-500/10' : 'bg-slate-950/40 border-slate-800'}`}>
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-400 mb-3">
                    <span>AFTER CLEANING</span>
                    <CheckCircle2 size={14} />
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex justify-between"><span>Missing Values:</span> <strong className="text-emerald-400">0</strong></li>
                    <li className="flex justify-between"><span>Duplicates:</span> <strong className="text-emerald-400">0</strong></li>
                    <li className="flex justify-between"><span>Invalid Dates:</span> <strong className="text-emerald-400">0</strong></li>
                    <li className="flex justify-between"><span>Format Issues:</span> <strong className="text-emerald-400">3</strong></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column Text */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              Automated Quality Studio
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Clean Data. Better Decisions.
            </h2>

            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              Garbage in, garbage out. InsightAI automatically scans datasets for 15+ data quality issues — imputation, duplicate filtering, date formatting, outlier capping, and PII masking without destroying original files.
            </p>

            <div className="pt-2 space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2 size={16} className="text-emerald-400" /> Versioning (`v1 Original`, `v2 Cleaned`, `v3 Standardized`)
              </div>
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2 size={16} className="text-emerald-400" /> 1-Click Rollback & Full Audit Log History
              </div>
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2 size={16} className="text-emerald-400" /> Domain-Specific Custom Validation Rules
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={handleOpenCleaning}
                className="px-6 py-3.5 rounded-2xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30 transition-all inline-flex items-center gap-2"
              >
                Explore Data Cleaning Studio →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
