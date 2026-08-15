import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Mail, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../components/common/Button';

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState('');

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50 dark:bg-[#0b1120]">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
            <Sparkles size={18} className="text-white" />
          </div>
          <span className="font-bold text-slate-900 dark:text-white text-xl">InsightAI</span>
        </div>

        {!sent ? (
          <>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Reset password</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-7">
              Enter your email and we'll send a reset link.
            </p>
            <div className="space-y-4">
              <div>
                <label className="label" htmlFor="fp-email">Email address</label>
                <input
                  id="fp-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="alex@company.com"
                />
              </div>
              <Button variant="primary" className="w-full" onClick={() => email && setSent(true)}>
                Send Reset Link
              </Button>
            </div>
          </>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto mb-4">
                <Mail size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Check your email</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                We sent a password reset link to <strong className="text-slate-700 dark:text-slate-300">{email}</strong>
              </p>
            </div>
          </motion.div>
        )}

        <Link to="/login" className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mt-6 transition-colors">
          <ArrowLeft size={16} /> Back to sign in
        </Link>
      </motion.div>
    </div>
  );
}
