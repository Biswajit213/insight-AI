import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Sparkles, TrendingUp, Users, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../components/common/Button';
import { AppLogo } from '../components/common/AppLogo';
import { GoogleEmailDialog } from '../components/common/GoogleEmailDialog';

import { signInWithGoogle } from '../lib/supabase';
import { storeLoginData } from '../services/authApi';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof schema>;

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPass, setShowPass] = useState(false);
  const [googleDialogOpen, setGoogleDialogOpen] = useState(false);

  const returnTo = (location.state as any)?.returnTo || '/app';

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    await new Promise((r) => setTimeout(r, 600));
    const userEmail = data.email.trim();
    const namePart = userEmail.split('@')[0].replace(/[._-]/g, ' ');
    const computedName = namePart.split(' ').filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Analytics User';

    const token = 'usr-' + Date.now();

    // Store login data into Supabase / PostgreSQL database
    const dbProfile = await storeLoginData({
      email: userEmail,
      fullName: computedName,
      userId: token,
      provider: 'email',
    });

    const activeUserId = dbProfile?.user_id || dbProfile?.id || token;

    localStorage.setItem('insightai_token', activeUserId);
    localStorage.setItem('insightai_user_email', userEmail);
    localStorage.setItem('insightai_user_name', computedName);
    window.dispatchEvent(new Event('insightai_user_updated'));
    navigate(returnTo);
  };

  // Called when the user submits the GoogleEmailDialog with their real Gmail
  const handleGoogleConfirm = async (userEmail: string, userName: string) => {
    const token = 'usr-google-oauth-' + Date.now();

    const dbProfile = await storeLoginData({
      email: userEmail,
      fullName: userName,
      userId: token,
      provider: 'google',
    });

    const activeUserId = dbProfile?.user_id || dbProfile?.id || token;

    localStorage.setItem('insightai_token', activeUserId);
    localStorage.setItem('insightai_user_email', userEmail);
    localStorage.setItem('insightai_user_name', userName);
    window.dispatchEvent(new Event('insightai_user_updated'));

    setGoogleDialogOpen(false);
    try {
      await signInWithGoogle(returnTo);
    } catch {
      navigate(returnTo);
    }
  };

  const features = [
    { icon: <TrendingUp size={18} />, title: 'AI-Powered Analytics', desc: 'Discover hidden patterns and trends automatically' },
    { icon: <Sparkles size={18} />, title: 'Instant Insights', desc: 'Ask questions in plain English and get answers instantly' },
    { icon: <Shield size={18} />, title: 'Enterprise Security', desc: 'Row-Level Security & PostgreSQL data isolation' },
    { icon: <Users size={18} />, title: 'Team Collaboration', desc: 'Share insights and executive reports with your team' },
  ];

  return (
    <div className="min-h-screen flex bg-[#0b1120] text-slate-100 font-sans">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0f172a] flex-col justify-between p-12 relative overflow-hidden border-r border-slate-800">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-20 left-20 w-64 h-64 bg-blue-500 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-64 h-64 bg-violet-500 rounded-full blur-3xl" />
        </div>

        {/* Logo */}
        <div className="relative">
          <AppLogo size="lg" />
        </div>

        {/* Hero text */}
        <div className="relative space-y-4">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-extrabold text-white leading-tight"
          >
            Turn your data into intelligent decisions.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-sm text-slate-400 max-w-md leading-relaxed"
          >
            The AI-powered data analytics platform that cleans raw datasets, detects anomalies, forecasts metrics, and answers natural language questions.
          </motion.p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.08 }}
                className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800"
              >
                <div className="text-blue-400 flex-shrink-0 mt-0.5">{f.icon}</div>
                <div>
                  <p className="text-xs font-bold text-white">{f.title}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="relative">
          <p className="text-xs text-slate-500">InsightAI Platform · Protected with Supabase PostgreSQL & RLS</p>
        </div>
      </div>

      {/* Right panel login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#0b1120]">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm space-y-6"
        >
          {/* Mobile logo */}
          <div className="mb-6 lg:hidden">
            <AppLogo size="md" />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-white">Welcome back</h2>
            <p className="text-xs text-slate-400 mt-1">Continue to your AI workspace.</p>
          </div>

          {/* Google OAuth button — opens custom dialog, not browser popup */}
          <button
            onClick={() => setGoogleDialogOpen(true)}
            type="button"
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 hover:text-white transition-all flex items-center justify-center gap-3 shadow-md"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Continue with Google
          </button>

          <div className="relative text-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800" /></div>
            <span className="relative bg-[#0b1120] px-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider">or sign in with email</span>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500"
                placeholder="alex@company.com"
                autoComplete="email"
              />
              {errors.email && <p className="mt-1 text-xs text-rose-500">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300 mb-0" htmlFor="password">Password</label>
                <Link to="/forgot-password" className="text-xs text-blue-400 hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  {...register('password')}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 pr-10 text-xs text-white focus:outline-none focus:border-blue-500"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-rose-500">{errors.password.message}</p>}
            </div>

            <Button type="submit" variant="primary" className="w-full py-3 text-xs font-bold bg-blue-600 hover:bg-blue-500" loading={isSubmitting}>
              Sign In to Workspace →
            </Button>
          </form>

          <p className="text-center text-xs text-slate-400 pt-2">
            Don't have an account?{' '}
            <Link to="/signup" className="text-blue-400 font-bold hover:underline">
              Sign up free
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Custom Google Email Dialog — no browser popup */}
      <GoogleEmailDialog
        isOpen={googleDialogOpen}
        onClose={() => setGoogleDialogOpen(false)}
        onConfirm={handleGoogleConfirm}
        mode="login"
      />
    </div>
  );
}
