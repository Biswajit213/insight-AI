import React from 'react';
import { Navbar } from '../components/marketing/Navbar';
import { CTA } from '../components/marketing/CTA';
import { Footer } from '../components/marketing/Footer';
import { Sparkles, ShieldCheck, Zap, Globe, Users, HeartHandshake } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-100 font-sans">
      <Navbar />
      <div className="pt-32 pb-16 text-center max-w-4xl mx-auto px-4 space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-400 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
          About InsightAI
        </span>
        <h1 className="text-4xl sm:text-6xl font-extrabold text-white">Democratizing Data Intelligence</h1>
        <p className="text-base sm:text-xl text-slate-400 leading-relaxed">
          We built InsightAI to eliminate spreadsheet headaches and empower every decision-maker with grounded AI data analytics.
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-24 space-y-16">
        {/* Core Values Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 w-fit">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-lg font-bold text-white">Truth Grounding</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              AI must never hallucinate numbers. Our backend statistical engine verifies every sum, average, and correlation first.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 w-fit">
              <Zap size={24} />
            </div>
            <h3 className="text-lg font-bold text-white">Speed & Performance</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              From profiling millions of rows to generating executive PDF reports, speed and UI responsiveness are paramount.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="p-3 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400 w-fit">
              <HeartHandshake size={24} />
            </div>
            <h3 className="text-lg font-bold text-white">User Privacy First</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your business dataset stays strictly isolated with Supabase Row Level Security (RLS) and PII masking technology.
            </p>
          </div>
        </div>
      </div>

      <CTA />
      <Footer />
    </div>
  );
}
