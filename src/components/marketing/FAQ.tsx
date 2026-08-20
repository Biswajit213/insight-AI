import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqList = [
  {
    q: 'What is InsightAI?',
    a: 'InsightAI is an enterprise-ready, AI-powered data analytics SaaS platform. It allows businesses to upload raw datasets, clean quality issues, discover automated insights, forecast trends, simulate what-if scenarios, and ask questions in natural language.',
  },
  {
    q: 'What data formats are supported?',
    a: 'InsightAI natively supports CSV (.csv), Microsoft Excel (.xlsx, .xls), and JSON files up to 50MB per file in standard web uploads, with streaming chunk processing for larger datasets.',
  },
  {
    q: 'How does AI analyze my data?',
    a: 'InsightAI uses a hybrid architecture: strict mathematical calculations and statistical engines run on the secure backend first. Grounded numerical statistics are then synthesized by Mistral AI to provide human-readable executive reasoning without hallucinating data.',
  },
  {
    q: 'Is my data secure?',
    a: 'Yes. All data stored in Supabase PostgreSQL is protected by Row Level Security (RLS), ensuring complete user and workspace isolation. PII sensitive fields are automatically masked, and raw dataset contents are never exposed publicly or sent to third parties for model training.',
  },
  {
    q: 'Can I clean my datasets?',
    a: 'Absolutely. The AI Data Cleaning Studio profiles datasets to detect missing values, duplicates, outliers, date errors, format issues, and PII. You can preview changes before applying them, and original datasets are preserved using immutable dataset versions (v1, v2, v3).',
  },
  {
    q: 'Can I export reports?',
    a: 'Yes. You can export clean dataset versions as CSV or JSON files, export interactive chart visualizations as PNG, and download comprehensive boardroom-ready executive reports as PDFs.',
  },
  {
    q: 'Can teams use InsightAI?',
    a: 'Yes. Pro and Enterprise plans support multi-user team workspaces with shared dataset repositories and role-based access control.',
  },
  {
    q: 'Does InsightAI support large datasets?',
    a: 'InsightAI is engineered for performance. It processes datasets asynchronously using backend pagination, indexing, and memory chunking without freezing the browser UI.',
  },
];

export function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section className="py-24 bg-slate-950 text-slate-100 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
            Got Questions?
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-base text-slate-400">
            Everything you need to know about InsightAI architecture, security, and capabilities.
          </p>
        </div>

        <div className="space-y-4">
          {faqList.map((item, idx) => (
            <div
              key={item.q}
              className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden transition-all"
            >
              <button
                onClick={() => toggle(idx)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-white hover:text-blue-400 transition-colors"
              >
                <span>{item.q}</span>
                <ChevronDown
                  size={18}
                  className={`text-slate-400 transition-transform ${openIdx === idx ? 'rotate-180 text-blue-400' : ''}`}
                />
              </button>

              {openIdx === idx && (
                <div className="px-5 pb-5 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3 animate-fadeIn">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
