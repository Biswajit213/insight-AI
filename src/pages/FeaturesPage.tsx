import React from 'react';
import { Navbar } from '../components/marketing/Navbar';
import { Features } from '../components/marketing/Features';
import { CleaningDemo } from '../components/marketing/CleaningDemo';
import { AIDemo } from '../components/marketing/AIDemo';
import { CTA } from '../components/marketing/CTA';
import { Footer } from '../components/marketing/Footer';

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-100 font-sans">
      <Navbar />
      <div className="pt-32 pb-12 text-center max-w-4xl mx-auto px-4">
        <h1 className="text-4xl sm:text-6xl font-extrabold text-white">InsightAI Product Features</h1>
        <p className="text-base sm:text-xl text-slate-400 mt-4">
          Discover the complete suite of AI data profiling, cleaning, analysis, forecasting, and report generation tools.
        </p>
      </div>
      <Features />
      <AIDemo />
      <CleaningDemo />
      <CTA />
      <Footer />
    </div>
  );
}
