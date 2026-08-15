import { useState, useEffect } from 'react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { useUser } from '../hooks/useUser';
import { getInitials, cn } from '../lib/utils';
import {
  Camera, Save, Eye, EyeOff, Smartphone, Monitor, Sun, Moon, Sparkles, Shield
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { motion } from 'framer-motion';

import { storeLoginData } from '../services/authApi';

export default function Settings() {
  return <NotificationsSettings />;
}

export function ProfileSettings() {
  const user = useUser();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [company, setCompany] = useState(user.company || 'Acme Corporation');
  const [role, setRole] = useState(user.role || 'Senior Data Analyst');
  const [saved, setSaved] = useState(false);

  // Sync form fields whenever auth state changes (e.g. after Google login)
  useEffect(() => {
    setName(user.name);
    setEmail(user.email);
  }, [user.name, user.email]);

  const save = async () => {
    localStorage.setItem('insightai_user_name', name);
    localStorage.setItem('insightai_user_email', email);
    window.dispatchEvent(new Event('insightai_user_updated'));

    await storeLoginData({
      email,
      fullName: name,
      provider: 'profile_update',
    });

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
      <h3 className="section-title mb-5">Profile Information</h3>

      {/* Avatar */}
      <div className="flex items-center gap-5 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-xl font-bold">
            {getInitials(name)}
          </div>
          <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow transition-colors" aria-label="Change avatar">
            <Camera size={12} />
          </button>
        </div>
        <div>
          <p className="font-semibold text-slate-800 dark:text-slate-200">{name}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{email}</p>
          <Badge variant="purple" className="mt-1">{user.plan.toUpperCase()} Plan</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="label">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
          />
        </div>

        <div>
          <label className="label">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
          />
        </div>

        <div>
          <label className="label">Company</label>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="input"
          />
        </div>

        <div>
          <label className="label">Role / Title</label>
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="input"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        {saved && <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">✓ Profile saved</span>}
        <Button variant="primary" icon={<Save size={15} />} onClick={save} className="ml-auto">
          Save Changes
        </Button>
      </div>
    </motion.div>
  );
}

export function SecuritySettings() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Password Card */}
      <div className="card p-6">
        <h3 className="section-title mb-4">Change Password</h3>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="label">Current Password</label>
            <div className="relative">
              <input type={showCurrent ? 'text' : 'password'} className="input pr-10" placeholder="••••••••" />
              <button type="button" onClick={() => setShowCurrent((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="label">New Password</label>
            <div className="relative">
              <input type={showNew ? 'text' : 'password'} className="input pr-10" placeholder="••••••••" />
              <button type="button" onClick={() => setShowNew((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <Button variant="primary" onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}>
            Update Password
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export function NotificationsSettings() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-6 space-y-6">
      <h3 className="section-title">Notification Preferences</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Choose how you receive notifications regarding automated dataset processing and security alerts.
      </p>
    </motion.div>
  );
}

export function AppearanceSettings() {
  const { toggleTheme, isDark } = useTheme();

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-6 space-y-6">
      <h3 className="section-title">Appearance</h3>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Theme Mode</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Toggle between Light and Dark analytical workspace modes.</p>
        </div>

        <button
          onClick={toggleTheme}
          className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2"
        >
          {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-blue-500" />}
          {isDark ? 'Light Theme' : 'Dark Theme'}
        </button>
      </div>
    </motion.div>
  );
}
