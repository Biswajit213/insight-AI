import React, { useState, useRef, useEffect } from 'react';
import { X, Mail, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GoogleEmailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (email: string, name: string) => Promise<void>;
  mode?: 'login' | 'signup';
}

export function GoogleEmailDialog({ isOpen, onClose, onConfirm, mode = 'login' }: GoogleEmailDialogProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setName('');
      setError('');
      setLoading(false);
      // Focus email field after animation
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const validateEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    const trimmedName = name.trim();

    if (!trimmedEmail) {
      setError('Please enter your Gmail address.');
      return;
    }
    if (!validateEmail(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      // Auto-derive name from email if not provided (only for login mode)
      const derivedName = trimmedName || (() => {
        const namePart = trimmedEmail.split('@')[0].replace(/[._-]/g, ' ');
        return namePart.split(' ').filter(Boolean)
          .map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Analytics User';
      })();
      await onConfirm(trimmedEmail, derivedName);
    } catch {
      setError('Authentication failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />

          {/* Dialog Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 z-10 text-slate-100"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>

            {/* Google icon + Title */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  {mode === 'signup' ? 'Sign up with Google' : 'Continue with Google'}
                </h3>
                <p className="text-xs text-slate-400">Enter your Gmail address to continue</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="google-email">
                  Gmail Address <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    ref={inputRef}
                    id="google-email"
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    placeholder="yourname@gmail.com"
                    autoComplete="email"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl pl-9 pr-4 py-3 text-sm text-white focus:outline-none transition-colors placeholder:text-slate-600"
                  />
                </div>
              </div>

              {/* Name Field (only for signup) */}
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="google-name">
                    Full Name <span className="text-slate-500 font-normal">(optional)</span>
                  </label>
                  <input
                    id="google-name"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your full name"
                    autoComplete="name"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors placeholder:text-slate-600"
                  />
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Info note */}
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Your Gmail will be saved as your login identity. Your profile name & avatar will be derived from your Gmail automatically.
              </p>

              {/* Action buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    'Continue →'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
