import { useState } from 'react';
import { Search, Bell, Sun, Moon, Plus, FileText, Command } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { notifications } from '../../data/dashboardData';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { cn } from '../../lib/utils';
import { formatTimestamp } from '../../lib/utils';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumb?: { label: string; href?: string }[];
  onSearchOpen?: () => void;
}

const notifTypeIcon: Record<string, string> = {
  success: '✅',
  warning: '⚠️',
  error: '❌',
  info: 'ℹ️',
};

export function Header({ title, subtitle, actions, breadcrumb, onSearchOpen }: HeaderProps) {
  const { toggleTheme, isDark } = useTheme();
  const [notifOpen, setNotifOpen] = useState(false);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <header className="h-16 bg-white dark:bg-[#0f1929] border-b border-slate-200 dark:border-[#1e293b] flex items-center px-6 gap-4 flex-shrink-0 sticky top-0 z-30">
      {/* Title area */}
      <div className="flex-1 min-w-0">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="flex items-center gap-1.5 mb-0.5" aria-label="Breadcrumb">
            {breadcrumb.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-slate-300 dark:text-slate-700">/</span>}
                <span className="text-xs text-slate-500 dark:text-slate-500">{crumb.label}</span>
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-lg font-bold text-slate-900 dark:text-white truncate">{title}</h1>
        {subtitle && !breadcrumb && <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{subtitle}</p>}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <button
          onClick={onSearchOpen}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-[#1e293b] hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm text-slate-500 dark:text-slate-400 transition-colors"
          aria-label="Open search (Ctrl+K)"
        >
          <Search size={14} />
          <span className="hidden md:block text-xs">Search...</span>
          <kbd className="hidden md:flex items-center gap-0.5 text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 font-medium">
            <Command size={9} />K
          </kbd>
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1e293b] text-slate-500 dark:text-slate-400 transition-colors"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1e293b] text-slate-500 dark:text-slate-400 transition-colors"
            aria-label={`Notifications (${unread} unread)`}
          >
            <Bell size={18} />
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unread}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#1f2937] rounded-xl shadow-lg animate-fade-in z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</h3>
                {unread > 0 && <Badge variant="blue">{unread} new</Badge>}
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={cn(
                      'flex gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors',
                      !notif.read && 'bg-blue-50/50 dark:bg-blue-900/10'
                    )}
                  >
                    <span className="text-lg leading-none mt-0.5">{notifTypeIcon[notif.type]}</span>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-medium truncate', notif.read ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white')}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{notif.description}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">{formatTimestamp(notif.timestamp)}</p>
                    </div>
                    {!notif.read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />}
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800">
                <button className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline w-full text-center">
                  Mark all as read
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Custom actions */}
        {actions}
      </div>
    </header>
  );
}
