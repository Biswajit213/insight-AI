import React from 'react';
import { Navbar } from '../components/marketing/Navbar';
import { Pricing } from '../components/marketing/Pricing';
import { FAQ } from '../components/marketing/FAQ';
import { CTA } from '../components/marketing/CTA';
import { Footer } from '../components/marketing/Footer';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-100 font-sans">
      <Navbar />
      <div className="pt-32 pb-8 text-center max-w-4xl mx-auto px-4">
        <h1 className="text-4xl sm:text-6xl font-extrabold text-white">Simple, Transparent Pricing</h1>
        <p className="text-base sm:text-xl text-slate-400 mt-4">
          Choose the plan that fits your business needs. No hidden fees.
        </p>
      </div>
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}
