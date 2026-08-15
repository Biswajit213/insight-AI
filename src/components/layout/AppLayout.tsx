import { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { MobileSidebar } from './MobileSidebar';
import { GlobalSearch } from '../common/GlobalSearch';
import { cn } from '../../lib/utils';
import { useKeyboard } from '../../hooks/useDebounce';

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  useKeyboard('k', openSearch, { ctrl: true });

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#0b1120]">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((v) => !v)} />
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar isOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />

      {/* Main content */}
      <main
        className={cn(
          'flex-1 flex flex-col overflow-hidden',
          'transition-all duration-300',
          'lg:ml-[240px]',
          sidebarCollapsed && 'lg:ml-[72px]'
        )}
      >
        {/* Mobile Header row */}
        <div className="lg:hidden flex items-center h-16 px-4 bg-white dark:bg-[#0f1929] border-b border-slate-200 dark:border-[#1e293b] gap-3">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
                <path d="M3 14 L6 8 L9 11 L12 5 L15 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-bold text-slate-900 dark:text-white text-sm">InsightAI</span>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <Outlet context={{ openSearch }} />
        </div>
      </main>

      {/* Global Search */}
      <GlobalSearch isOpen={searchOpen} onClose={closeSearch} />
    </div>
  );
}
