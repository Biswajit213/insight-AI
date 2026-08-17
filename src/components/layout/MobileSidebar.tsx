import { NavLink, useNavigate } from 'react-router-dom';
import {
  X, LayoutDashboard, Database, BarChart3, Sparkles, FileText,
  AlertTriangle, Settings, LogOut, MessageSquareText
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useUser } from '../../hooks/useUser';
import { getInitials } from '../../lib/utils';
import { AppLogo } from '../common/AppLogo';
import { signOutUser } from '../../lib/supabase';

const navItems = [
  { label: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/app' },
  { label: 'Datasets', icon: <Database size={18} />, path: '/app/datasets' },
  { label: 'Data Cleaning', icon: <Sparkles size={18} />, path: '/app/data-cleaning' },
  { label: 'AI Insights', icon: <Sparkles size={18} />, path: '/app/insights', badge: 6 },
  { label: 'Ask Your Data', icon: <MessageSquareText size={18} />, path: '/app/ask' },
  { label: 'Anomalies', icon: <AlertTriangle size={18} />, path: '/app/anomalies', badge: 3 },
  { label: 'Visualizations', icon: <BarChart3 size={18} />, path: '/app/visualizations' },
  { label: 'Reports', icon: <FileText size={18} />, path: '/app/reports' },
  { label: 'Settings', icon: <Settings size={18} />, path: '/app/settings' },
];

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const navigate = useNavigate();
  const user = useUser();

  const handleLogout = async () => {
    await signOutUser(); // clears localStorage + signs out Supabase/Google session
    onClose();
    navigate('/');       // redirect to home page
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={cn(
          'fixed left-0 top-0 h-full w-72 z-50 flex flex-col',
          'bg-[#0f172a] border-r border-[#1e293b]',
          'transition-transform duration-300 ease-in-out lg:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-[#1e293b]">
          <AppLogo size="md" />
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Workspace</p>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/app'}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className={isActive ? 'text-white' : 'text-slate-500'}>{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {item.badge != null && (
                    <span className={cn('min-w-[20px] h-5 flex items-center justify-center rounded-full text-[10px] font-bold px-1.5', isActive ? 'bg-white/20 text-white' : 'bg-blue-600 text-white')}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-[#1e293b] p-3">
          <div className="flex items-center gap-3 p-2">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-full object-cover ring-1 ring-blue-500/40 flex-shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {getInitials(user.name)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              aria-label="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
