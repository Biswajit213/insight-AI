import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Play, Sparkles, ShieldCheck, Zap, Users } from 'lucide-react';
import { HeroVideoModal } from './HeroVideoModal';

export function Hero() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!localStorage.getItem('insightai_token'));
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(!!localStorage.getItem('insightai_token'));
    };
    checkAuth();
    window.addEventListener('storage', checkAuth);
    window.addEventListener('insightai_user_updated', checkAuth);

    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('insightai_user_updated', checkAuth);
    };
  }, []);

  const handleCTA = () => {
    if (isAuthenticated) {
      navigate('/app');
    } else {
      navigate('/signup');
    }
  };

  return (
    <section className="relative pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden bg-[#070c18] text-slate-100 min-h-[90vh] flex items-center">
      {/* Background ambient gridlines & lighting aura */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b12_1px,transparent_1px),linear-gradient(to_bottom,#1e293b12_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Headline, Copy & Actions */}
          <div className="lg:col-span-7 space-y-7 text-left">
            {/* Top Pill Badge */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-blue-400 text-xs font-semibold tracking-wide shadow-lg">
                <Sparkles size={14} className="text-blue-400" />
                <span>AI-Powered Data Analytics SaaS Platform</span>
              </div>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-[64px] font-extrabold tracking-tight text-white leading-[1.12] font-sans">
              Turn Your Data Into{' '}
              <br className="hidden sm:inline" />
              <span className="text-[#5b95ff] font-extrabold">
                Intelligent Decisions.
              </span>
            </h1>

            {/* Subtitle Copy */}
            <p className="text-sm sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
              Analyze millions of records, discover hidden patterns, detect anomalies, forecast future trends, and generate actionable business insights with AI.
            </p>

            {/* CTA Buttons Row */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                onClick={handleCTA}
                className="px-7 py-3.5 rounded-2xl text-sm font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white shadow-xl shadow-blue-600/30 transition-all transform hover:-translate-y-0.5 flex items-center gap-2.5"
              >
                {isAuthenticated ? (
                  <>
                    <LayoutDashboard size={18} /> Open Dashboard →
                  </>
                ) : (
                  <>
                    <Sparkles size={18} /> Get Started Free →
                  </>
                )}
              </button>

              <button
                onClick={() => setIsVideoOpen(true)}
                className="px-7 py-3.5 rounded-2xl text-sm font-bold bg-slate-900/90 border border-slate-800 text-slate-200 hover:text-white hover:bg-slate-800 transition-all flex items-center gap-2.5 group shadow-md"
              >
                <Play size={15} className="text-blue-400 fill-current group-hover:scale-110 transition-transform" />
                <span>See How It Works</span>
              </button>
            </div>

            {/* Bottom Key Feature Badges Row */}
            <div className="pt-4 flex flex-wrap items-center gap-4 text-slate-400 text-xs font-medium">
              <div className="flex items-center gap-2 bg-slate-900/80 px-3.5 py-1.5 rounded-xl border border-slate-800/80">
                <Sparkles size={14} className="text-blue-400" /> AI-Powered Insights
              </div>
              <div className="flex items-center gap-2 bg-slate-900/80 px-3.5 py-1.5 rounded-xl border border-slate-800/80">
                <ShieldCheck size={14} className="text-emerald-400" /> Secure & Private
              </div>
              <div className="flex items-center gap-2 bg-slate-900/80 px-3.5 py-1.5 rounded-xl border border-slate-800/80">
                <Zap size={14} className="text-amber-400" /> Lightning Fast
              </div>
              <div className="flex items-center gap-2 bg-slate-900/80 px-3.5 py-1.5 rounded-xl border border-slate-800/80">
                <Users size={14} className="text-violet-400" /> Trusted by Thousands
              </div>
            </div>
          </div>

          {/* Right Column: Futuristic 3D Data Visualization Prism Visual */}
          <div className="lg:col-span-5 relative group">
            {/* Outer Lighting Glow */}
            <div className="absolute -inset-2 bg-gradient-to-tr from-blue-600/30 via-indigo-600/20 to-violet-600/30 rounded-3xl blur-2xl opacity-75 group-hover:opacity-100 transition duration-700 pointer-events-none" />

            <div className="relative rounded-3xl overflow-hidden border border-slate-800/80 shadow-2xl bg-slate-950/60 backdrop-blur-md">
              <img
                src="/hero_data_visualization.png"
                alt="AI Data Analytics 3D Visualization Prism"
                className="w-full h-auto object-cover transform group-hover:scale-102 transition-transform duration-700"
              />
            </div>
          </div>
        </div>
      </div>

      {/* How-To Video Walkthrough Modal */}
      <HeroVideoModal
        isOpen={isVideoOpen}
        onClose={() => setIsVideoOpen(false)}
        onOpenDashboard={handleCTA}
      />
    </section>
  );
}
