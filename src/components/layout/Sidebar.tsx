import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Database, BarChart3, Sparkles, FileText,
  AlertTriangle, Settings, ChevronRight,
  TrendingUp, LogOut, MessageSquareText, Sliders, ChevronsLeft
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useUser } from '../../hooks/useUser';
import { getInitials } from '../../lib/utils';
import { AppLogo } from '../common/AppLogo';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/app' },
  { label: 'Datasets', icon: <Database size={18} />, path: '/app/datasets' },
  { label: 'Data Cleaning', icon: <Sparkles size={18} />, path: '/app/data-cleaning' },
  { label: 'AI Insights', icon: <Sparkles size={18} />, path: '/app/insights', badge: 6 },
  { label: 'Ask Your Data', icon: <MessageSquareText size={18} />, path: '/app/ask' },
  { label: 'Anomalies', icon: <AlertTriangle size={18} />, path: '/app/anomalies', badge: 3 },
  { label: 'Forecasting', icon: <TrendingUp size={18} />, path: '/app/forecasting' },
  { label: 'What-If Analysis', icon: <Sliders size={18} />, path: '/app/what-if' },
  { label: 'Visualizations', icon: <BarChart3 size={18} />, path: '/app/visualizations' },
  { label: 'Reports', icon: <FileText size={18} />, path: '/app/reports' },
  { label: 'Settings', icon: <Settings size={18} />, path: '/app/settings' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const navigate = useNavigate();
  const user = useUser();

  const handleLogout = (e: React.MouseEvent) => {
    e.stopPropagation();
    localStorage.removeItem('insightai_token');
    localStorage.removeItem('insightai_user_email');
    localStorage.removeItem('insightai_user_name');
    window.dispatchEvent(new Event('insightai_user_updated'));
    navigate('/login');
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full z-40 flex flex-col',
        'bg-[#0f172a] border-r border-[#1e293b]',
        'transition-all duration-300 ease-in-out',
        collapsed ? 'w-[72px]' : 'w-[240px]'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center h-16 px-4 border-b border-[#1e293b] flex-shrink-0',
        collapsed ? 'justify-center' : ''
      )}>
        <AppLogo showText={!collapsed} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-1 no-scrollbar">
        {!collapsed && (
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
            Workspace
          </p>
        )}
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/app'}
            className={({ isActive }) =>
              cn(
                'flex items-center rounded-lg transition-all duration-150 relative group',
                collapsed ? 'justify-center px-0 py-3' : 'gap-3 px-3 py-2.5',
                isActive
                  ? 'bg-blue-600 text-white shadow-glow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              )
            }
            title={collapsed ? item.label : undefined}
          >
            {({ isActive }) => (
              <>
                <span className={cn('flex-shrink-0', isActive ? 'text-white' : 'text-slate-500 group-hover:text-white')}>
                  {item.icon}
                </span>
                {!collapsed && (
                  <span className="flex-1 text-sm font-medium">{item.label}</span>
                )}
                {!collapsed && item.badge != null && (
                  <span className={cn(
                    'min-w-[20px] h-5 flex items-center justify-center rounded-full text-[10px] font-bold px-1.5',
                    isActive ? 'bg-white/20 text-white' : 'bg-blue-600 text-white'
                  )}>
                    {item.badge}
                  </span>
                )}

                {/* Tooltip when collapsed */}
                {collapsed && (
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-800 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
                    {item.label}
                    {item.badge != null && (
                      <span className="ml-1.5 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">{item.badge}</span>
                    )}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <div className="px-2 pb-2">
        <button
          onClick={onToggle}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors text-sm',
            collapsed && 'justify-center'
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <><ChevronsLeft size={16} /><span className="text-xs">Collapse</span></>}
        </button>
      </div>

      {/* User section */}
      <div className="flex-shrink-0 border-t border-[#1e293b] p-3">
        <div
          className={cn(
            'flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors group',
            collapsed && 'justify-center'
          )}
          onClick={() => navigate('/app/settings')}
          role="button"
          tabIndex={0}
          aria-label="View profile"
        >
          {/* Avatar */}
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-1 ring-blue-500/40"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {getInitials(user.name)}
            </div>
          )}

          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          )}

          {!collapsed && (
            <button
              onClick={handleLogout}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/10"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={14} className="text-slate-400" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
