import React from 'react';
import { Navbar } from '../components/marketing/Navbar';
import { Hero } from '../components/marketing/Hero';
import { HowItWorks } from '../components/marketing/HowItWorks';
import { Features } from '../components/marketing/Features';
import { AIDemo } from '../components/marketing/AIDemo';
import { CleaningDemo } from '../components/marketing/CleaningDemo';
import { FAQ } from '../components/marketing/FAQ';
import { CTA } from '../components/marketing/CTA';
import { Footer } from '../components/marketing/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <AIDemo />
      <CleaningDemo />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}
