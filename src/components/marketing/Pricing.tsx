import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Sparkles } from 'lucide-react';

export function Pricing() {
  const navigate = useNavigate();

  const handleSelectPlan = (plan: string) => {
    if (plan === 'Enterprise') {
      navigate('/contact');
    } else {
      const token = localStorage.getItem('insightai_token');
      if (token) {
        navigate('/app');
      } else {
        navigate('/signup');
      }
    }
  };

  const plans = [
    {
      name: 'FREE',
      price: '$0',
      period: '/month',
      description: 'Ideal for individuals and small projects exploring data analytics.',
      features: [
        'Up to 3 active datasets',
        'Basic column profiling',
        'Limited AI questions (10/mo)',
        'Basic executive summary reports',
        'Standard CSV export',
      ],
      buttonText: 'Get Started Free',
      highlight: false,
    },
    {
      name: 'PRO',
      price: '$19',
      period: '/month',
      description: 'Perfect for growing businesses requiring deep AI insights and data cleaning.',
      features: [
        'Unlimited datasets & versions',
        'Advanced AI Insights engine',
        'Full AI Data Cleaning Studio',
        'Predictive Forecasting & What-If',
        'Unlimited Ask Your Data questions',
        'Boardroom-ready PDF reports',
        'Priority processing pipeline',
      ],
      buttonText: 'Start 14-Day Free Trial',
      highlight: true,
      popularBadge: 'MOST POPULAR',
    },
    {
      name: 'ENTERPRISE',
      price: 'Custom',
      period: '',
      description: 'For data-driven teams and organizations needing custom limits & security.',
      features: [
        'Everything in Pro included',
        'Multi-user team workspaces',
        'Role-Based Access Control (RBAC)',
        'Dedicated API access & webhooks',
        'Custom RLS security & audit logs',
        '24/7 Priority SLA support',
      ],
      buttonText: 'Contact Sales',
      highlight: false,
    },
  ];

  return (
    <section id="pricing" className="py-24 bg-[#0b1120] text-slate-100 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
            Flexible Plans
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Transparent Pricing for Every Business
          </h2>
          <p className="text-base sm:text-lg text-slate-400">
            Start free, upgrade as your dataset volume and analytics needs grow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`p-8 rounded-3xl flex flex-col justify-between relative transition-all duration-300 ${
                plan.highlight
                  ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-blue-950/40 border-2 border-blue-500/80 shadow-2xl shadow-blue-500/20 scale-105 z-10'
                  : 'bg-slate-900/70 border border-slate-800 hover:border-slate-700'
              }`}
            >
              {plan.popularBadge && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 text-[10px] font-extrabold text-white uppercase tracking-wider shadow-md">
                  {plan.popularBadge}
                </span>
              )}

              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-sm font-extrabold text-slate-400 tracking-wider uppercase">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl sm:text-5xl font-black text-white">{plan.price}</span>
                    <span className="text-xs text-slate-400">{plan.period}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed pt-1">{plan.description}</p>
                </div>

                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">INCLUDED FEATURES:</span>
                  <ul className="space-y-2.5 text-xs text-slate-300">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5">
                        <Check size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-8">
                <button
                  onClick={() => handleSelectPlan(plan.name)}
                  className={`w-full py-3.5 rounded-2xl text-xs font-bold transition-all shadow-md ${
                    plan.highlight
                      ? 'bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white shadow-blue-600/30 hover:scale-105'
                      : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                  }`}
                >
                  {plan.buttonText}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
