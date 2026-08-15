import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Globe, Share2, MessageCircle } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 text-xs py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b border-slate-800/80">
          {/* Column 1: Brand */}
          <div className="col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center text-white font-bold">
                <Sparkles size={16} />
              </div>
              <span className="text-lg font-extrabold text-white">Insight<span className="text-blue-500">AI</span></span>
            </Link>
            <p className="text-slate-400 max-w-sm leading-relaxed">
              AI-powered data analytics for modern businesses. Clean datasets, detect anomalies, forecast metrics, and generate executive reports automatically.
            </p>
            <div className="flex items-center gap-3 pt-2 text-slate-400">
              <a href="#" className="hover:text-white p-2 bg-slate-900 rounded-xl border border-slate-800 transition-colors" title="Global">
                <Globe size={15} />
              </a>
              <a href="#" className="hover:text-white p-2 bg-slate-900 rounded-xl border border-slate-800 transition-colors" title="Share">
                <Share2 size={15} />
              </a>
              <a href="#" className="hover:text-white p-2 bg-slate-900 rounded-xl border border-slate-800 transition-colors" title="Community">
                <MessageCircle size={15} />
              </a>
            </div>
          </div>

          {/* Column 2: Product */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Product</h4>
            <ul className="space-y-2">
              <li><Link to="/features" className="hover:text-white transition-colors">AI Insights</Link></li>
              <li><Link to="/features" className="hover:text-white transition-colors">Data Cleaning</Link></li>
              <li><Link to="/features" className="hover:text-white transition-colors">Ask Your Data</Link></li>
              <li><Link to="/features" className="hover:text-white transition-colors">Forecasting</Link></li>
              <li><Link to="/features" className="hover:text-white transition-colors">AI Reports</Link></li>
            </ul>
          </div>

          {/* Column 3: Company */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Company</h4>
            <ul className="space-y-2">
              <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
            </ul>
          </div>

          {/* Column 4: Legal & Resources */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Resources & Legal</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-white transition-colors">API References</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Security Architecture</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-8 flex flex-wrap items-center justify-between gap-4 text-slate-500 text-[11px]">
          <p>© 2026 InsightAI. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-slate-300">Privacy</a>
            <a href="#" className="hover:text-slate-300">Terms</a>
            <a href="#" className="hover:text-slate-300">Security</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
