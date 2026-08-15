import React from 'react';
import { Navbar } from '../components/marketing/Navbar';
import { CTA } from '../components/marketing/CTA';
import { Footer } from '../components/marketing/Footer';
import { ShoppingCart, TrendingUp, Building2, Megaphone, Stethoscope, ShieldCheck } from 'lucide-react';

const solutions = [
  {
    title: 'E-Commerce & Retail',
    icon: <ShoppingCart size={24} className="text-blue-400" />,
    description: 'Track SKU performance, detect customer churn signals, forecast inventory demand, and optimize promotional pricing.',
  },
  {
    title: 'Finance & Accounting',
    icon: <TrendingUp size={24} className="text-emerald-400" />,
    description: 'Detect statistical revenue anomalies, audit transactional anomalies, and build automated financial executive summaries.',
  },
  {
    title: 'SaaS & Technology',
    icon: <Building2 size={24} className="text-violet-400" />,
    description: 'Analyze MRR trajectory, expansion revenue, cohort retention rates, and product usage bottlenecks with AI.',
  },
  {
    title: 'Marketing & Agencies',
    icon: <Megaphone size={24} className="text-amber-400" />,
    description: 'Compare multi-channel campaign ROI, calculate CAC & LTV ratios, and generate boardroom client reports in minutes.',
  },
  {
    title: 'Healthcare & Life Sciences',
    icon: <Stethoscope size={24} className="text-rose-400" />,
    description: 'Clean patient data records, mask sensitive PII fields, and analyze operational hospital capacity metrics.',
  },
  {
    title: 'Enterprise Risk & Operations',
    icon: <ShieldCheck size={24} className="text-indigo-400" />,
    description: 'Enforce custom data validation constraints, audit dataset lineage, and secure datasets with Supabase RLS.',
  },
];

export default function SolutionsPage() {
  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-100 font-sans">
      <Navbar />
      <div className="pt-32 pb-16 text-center max-w-4xl mx-auto px-4">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-400 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
          Tailored Business Solutions
        </span>
        <h1 className="text-4xl sm:text-6xl font-extrabold text-white mt-4">AI Analytics for Every Industry</h1>
        <p className="text-base sm:text-xl text-slate-400 mt-4">
          Whether you manage millions of e-commerce transactions or financial spreadsheets, InsightAI turns data into decisions.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {solutions.map((sol) => (
            <div key={sol.title} className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 hover:border-blue-500/40 transition-all">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 w-fit">{sol.icon}</div>
              <h3 className="text-xl font-bold text-white">{sol.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{sol.description}</p>
            </div>
          ))}
        </div>
      </div>

      <CTA />
      <Footer />
    </div>
  );
}
