import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Sparkles } from 'lucide-react';

export function CTA() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!localStorage.getItem('insightai_token'));

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
    <section className="py-24 bg-[#0b1120] text-slate-100 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="p-8 sm:p-14 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/80 border border-blue-500/30 text-center space-y-6 shadow-2xl shadow-blue-500/10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
            <Sparkles size={14} /> Start Analyzing Today
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Ready to Understand Your Data?
          </h2>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Stop spending hours searching through spreadsheets. Let AI help you discover what matters and turn data into intelligent decisions.
          </p>

          <div className="pt-4 flex justify-center">
            <button
              onClick={handleCTA}
              className="px-8 py-4 rounded-2xl text-sm font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white shadow-xl shadow-blue-600/30 transition-all hover:scale-105 flex items-center gap-2"
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
          </div>
        </div>
      </div>
    </section>
  );
}
