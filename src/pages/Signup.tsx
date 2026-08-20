import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../components/common/Button';
import { AppLogo } from '../components/common/AppLogo';
import { signInWithGoogle } from '../lib/supabase';
import { storeSignupData } from '../services/authApi';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof schema>;

export default function Signup() {
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    await new Promise((r) => setTimeout(r, 600));
    const userEmail = data.email.trim().toLowerCase();
    const userName = data.name.trim();

    // Backend looks up existing profile by email — returns canonical user_id
    const dbProfile = await storeSignupData({
      email: userEmail,
      fullName: userName,
    });

    const activeUserId = dbProfile?.user_id || dbProfile?.id;

    if (!activeUserId) {
      const offlineToken = btoa(userEmail).replace(/=/g, '');
      localStorage.setItem('insightai_token', offlineToken);
    } else {
      localStorage.setItem('insightai_token', activeUserId);
    }
    localStorage.setItem('insightai_user_email', userEmail);
    localStorage.setItem('insightai_user_name', dbProfile?.full_name || userName);
    localStorage.removeItem('insightai_user_avatar');
    window.dispatchEvent(new Event('insightai_user_updated'));
    navigate('/app');
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle('/app');
    } catch {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0b1120] text-slate-100 font-sans">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0f172a] flex-col justify-between p-12 relative overflow-hidden border-r border-slate-800">
        <div className="relative">
          <AppLogo size="lg" />
        </div>

        <div className="relative space-y-4">
          <h1 className="text-4xl font-extrabold text-white leading-tight">
            Start analyzing your data with AI in minutes.
          </h1>
          <p className="text-sm text-slate-400 max-w-md">
            Join thousands of data-driven teams using InsightAI to clean datasets, discover
            anomalies, and forecast metrics.
          </p>
        </div>

        <div className="relative">
          <p className="text-xs text-slate-500">InsightAI Platform · Protected with Supabase PostgreSQL & RLS</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#0b1120]">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm space-y-6"
        >
          <div className="mb-6 lg:hidden">
            <AppLogo size="md" />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-white">Create your account</h2>
            <p className="text-xs text-slate-400 mt-1">Get started with your free InsightAI workspace.</p>
          </div>

          {/* Google OAuth — opens real Google account picker (no dialog) */}
          <button
            onClick={handleGoogleSignup}
            disabled={googleLoading}
            type="button"
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-60 border border-slate-800 text-xs font-bold text-slate-200 hover:text-white transition-all flex items-center justify-center gap-3 shadow-md"
          >
            {googleLoading ? (
              <Loader2 size={18} className="animate-spin text-slate-400" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            )}
            {googleLoading ? 'Redirecting to Google…' : 'Sign up with Google'}
          </button>

          <div className="relative text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <span className="relative bg-[#0b1120] px-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              or sign up with email
            </span>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="name">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                {...register('name')}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500"
                placeholder="Alex Morgan"
              />
              {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500"
                placeholder="alex@company.com"
              />
              {errors.email && <p className="mt-1 text-xs text-rose-500">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  {...register('password')}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 pr-10 text-xs text-white focus:outline-none focus:border-blue-500"
                  placeholder="••••••••"
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

            <Button
              type="submit"
              variant="primary"
              className="w-full py-3 text-xs font-bold bg-blue-600 hover:bg-blue-500"
              loading={isSubmitting}
            >
              Create Account →
            </Button>
          </form>

          <p className="text-center text-xs text-slate-400 pt-2">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
