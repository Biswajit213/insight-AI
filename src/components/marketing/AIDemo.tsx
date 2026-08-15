import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, User, Send, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

export function AIDemo() {
  const navigate = useNavigate();
  const [question, setQuestion] = useState('Why did revenue decrease in May?');
  const [isAnswering, setIsAnswering] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState('Why did revenue decrease in May?');

  const suggested = [
    'Why did revenue decrease in May?',
    'What are my top 5 products?',
    'Find unusual transactions in Q3',
    'Forecast revenue for next quarter',
  ];

  const handleAsk = (q: string) => {
    setQuestion(q);
    setActiveQuestion(q);
    setIsAnswering(true);
    setTimeout(() => setIsAnswering(false), 600);
  };

  const handleOpenAsk = () => {
    const token = localStorage.getItem('insightai_token');
    if (token) {
      navigate('/app/ask');
    } else {
      navigate('/login', { state: { returnTo: '/app/ask' } });
    }
  };

  return (
    <section className="py-24 bg-[#0b1120] text-slate-100 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column Text */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold uppercase tracking-wider">
              Conversational Data Intelligence
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Ask Your Data Anything in Plain English
            </h2>

            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              No SQL queries or complex formula knowledge required. InsightAI parses natural language, inspects your dataset schema, and calculates exact statistical evidence grounded in truth.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 text-xs text-slate-300">
                <ShieldCheck size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <span><strong>Grounded Ground-Truth Math:</strong> Numerical results calculated by backend analytics engine, not AI hallucination.</span>
              </div>
              <div className="flex items-start gap-3 text-xs text-slate-300">
                <Sparkles size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
                <span><strong>Instant Executive Recommendations:</strong> Actionable root cause analysis with financial impact estimations.</span>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={handleOpenAsk}
                className="px-6 py-3.5 rounded-2xl text-xs font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-600/30 transition-all inline-flex items-center gap-2"
              >
                Try Ask Your Data Live →
              </button>
            </div>
          </div>

          {/* Right Column Interactive Chat Window */}
          <div className="lg:col-span-7">
            <div className="p-4 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
              {/* Chat Window Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
                    <Bot size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">InsightAI Analyst Assistant</h4>
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Connected to Sales_2026.csv
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-800 text-slate-400">
                  Grounded Mode
                </span>
              </div>

              {/* Chat Thread */}
              <div className="space-y-4 min-h-[300px]">
                {/* User Message */}
                <div className="flex justify-end">
                  <div className="max-w-[85%] p-3.5 rounded-2xl bg-blue-600 text-white text-xs font-medium space-y-1 shadow-md">
                    <div className="flex items-center gap-1.5 text-[10px] text-blue-200 font-bold mb-1">
                      <User size={12} /> YOU
                    </div>
                    <p>{activeQuestion}</p>
                  </div>
                </div>

                {/* AI Message */}
                <div className="flex justify-start">
                  <div className="max-w-[90%] p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200 text-xs space-y-3 shadow-md">
                    <div className="flex items-center justify-between text-[10px] font-bold text-violet-400">
                      <span className="flex items-center gap-1.5"><Bot size={14} /> INSIGHTAI ANALYST</span>
                      <span className="text-emerald-400">97% Evidence Match</span>
                    </div>

                    {isAnswering ? (
                      <div className="py-4 text-center text-slate-400 flex items-center justify-center gap-2">
                        <Sparkles size={16} className="animate-spin text-violet-400" /> Calculating metrics & correlation...
                      </div>
                    ) : (
                      <>
                        <p className="text-slate-200 font-semibold leading-relaxed">
                          "Revenue decreased by <strong className="text-rose-400">18.4%</strong> in May 2026."
                        </p>

                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Primary Contributors:</span>
                          <div className="grid grid-cols-3 gap-2 text-center text-xs">
                            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/60">
                              <div className="text-[10px] text-slate-400">Electronics</div>
                              <div className="font-bold text-rose-400">-31%</div>
                            </div>
                            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/60">
                              <div className="text-[10px] text-slate-400">West Region</div>
                              <div className="font-bold text-rose-400">-24%</div>
                            </div>
                            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/60">
                              <div className="text-[10px] text-slate-400">Total Orders</div>
                              <div className="font-bold text-rose-400">-11%</div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="text-slate-400">Estimated Financial Impact:</span>
                          <span className="font-extrabold text-rose-400">$4.8M lost revenue</span>
                        </div>

                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider block">Recommended Action:</span>
                          <p className="text-[11px] leading-normal">
                            Review Electronics category inventory supply delays and re-evaluate West Region promotional campaign allocations.
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Suggested Questions */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Suggested Questions:</span>
                <div className="flex flex-wrap gap-2">
                  {suggested.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleAsk(q)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-medium transition-all ${
                        activeQuestion === q
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
