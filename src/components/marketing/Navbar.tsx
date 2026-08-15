import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Sparkles, LayoutDashboard, ChevronDown, LogOut, User } from 'lucide-react';

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productDropdown, setProductDropdown] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!localStorage.getItem('insightai_token'));
  const [userName, setUserName] = useState<string>(() => localStorage.getItem('insightai_user_name') || '');
  const [userEmail, setUserEmail] = useState<string>(() => localStorage.getItem('insightai_user_email') || '');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    const checkAuth = () => {
      setIsAuthenticated(!!localStorage.getItem('insightai_token'));
      setUserName(localStorage.getItem('insightai_user_name') || '');
      setUserEmail(localStorage.getItem('insightai_user_email') || '');
    };
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };

    checkAuth();
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('storage', checkAuth);
    window.addEventListener('insightai_user_updated', checkAuth);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('insightai_user_updated', checkAuth);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('insightai_token');
    localStorage.removeItem('insightai_user_email');
    localStorage.removeItem('insightai_user_name');
    window.dispatchEvent(new Event('insightai_user_updated'));
    setIsAuthenticated(false);
    setUserDropdownOpen(false);
    navigate('/');
  };

  const initialSource = userName.trim() || userEmail.trim() || 'User';
  const userInitial = initialSource.charAt(0).toUpperCase();

  const navLinks = [
    { label: 'Features', path: '/features' },
    { label: 'Solutions', path: '/solutions' },
    { label: 'About', path: '/about' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 shadow-2xl py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-white font-sans">
              Insight<span className="text-blue-500">AI</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            {/* Product Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setProductDropdown(true)}
              onMouseLeave={() => setProductDropdown(false)}
            >
              <button className="flex items-center gap-1 hover:text-white transition-colors py-2">
                Product <ChevronDown size={14} className={`transition-transform ${productDropdown ? 'rotate-180' : ''}`} />
              </button>
              {productDropdown && (
                <div className="absolute top-full left-0 w-64 p-3 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl space-y-1 animate-fadeIn">
                  <Link
                    to="/features"
                    className="block p-2.5 rounded-xl hover:bg-slate-800/80 text-xs font-semibold text-slate-200 transition-colors"
                  >
                    <div className="text-blue-400 font-bold mb-0.5">AI Analytics Core</div>
                    <div className="text-slate-400 font-normal">Auto insights, trends & forecasts</div>
                  </Link>
                  <Link
                    to="/features"
                    className="block p-2.5 rounded-xl hover:bg-slate-800/80 text-xs font-semibold text-slate-200 transition-colors"
                  >
                    <div className="text-emerald-400 font-bold mb-0.5">AI Data Cleaning Studio</div>
                    <div className="text-slate-400 font-normal">Dynamic quality scores & Imputation</div>
                  </Link>
                  <Link
                    to="/features"
                    className="block p-2.5 rounded-xl hover:bg-slate-800/80 text-xs font-semibold text-slate-200 transition-colors"
                  >
                    <div className="text-violet-400 font-bold mb-0.5">Ask Your Data</div>
                    <div className="text-slate-400 font-normal">Grounded natural language Q&A</div>
                  </Link>
                </div>
              )}
            </div>

            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`hover:text-white transition-colors ${
                  location.pathname === link.path ? 'text-blue-400 font-semibold' : ''
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Action Buttons / User Avatar */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                {/* User Avatar Button matching green circle with glowing ring */}
                <button
                  onClick={() => setUserDropdownOpen((v) => !v)}
                  className="relative p-[2.5px] rounded-full bg-gradient-to-tr from-blue-500 via-indigo-500 to-cyan-400 hover:scale-105 transition-transform focus:outline-none shadow-lg shadow-blue-500/25 flex items-center justify-center group"
                  title={userName || userEmail || 'Account Menu'}
                >
                  <div className="w-9 h-9 rounded-full bg-[#246b1d] group-hover:bg-[#2b7d23] flex items-center justify-center text-white font-extrabold text-base tracking-tight shadow-inner transition-colors border border-slate-950/40">
                    {userInitial}
                  </div>
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-64 p-3 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl space-y-2 z-50 animate-fadeIn text-slate-200">
                    {/* User Info Card */}
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#246b1d] ring-2 ring-blue-500/40 flex items-center justify-center text-white font-extrabold text-base flex-shrink-0">
                        {userInitial}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-white truncate">{userName || 'Analytics User'}</p>
                        <p className="text-[11px] text-slate-400 truncate">{userEmail || 'user@insightai.io'}</p>
                      </div>
                    </div>

                    <div className="border-t border-slate-800/80 pt-1 space-y-1">
                      {/* Dashboard Option */}
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          navigate('/app');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
                      >
                        <LayoutDashboard size={16} className="text-blue-400" />
                        <span>Dashboard</span>
                      </button>
                    </div>

                    <div className="border-t border-slate-800/80 pt-1">
                      {/* Logout Option */}
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          handleSignOut();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
                      >
                        <LogOut size={16} />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition-all hover:scale-105"
                >
                  Get Started Free
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-950 border-b border-slate-800 px-4 py-6 space-y-4 animate-fadeIn">
          <div className="space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-900 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-800 space-y-3">
            {isAuthenticated ? (
              <>
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#246b1d] ring-2 ring-blue-500/40 flex items-center justify-center text-white font-extrabold text-base flex-shrink-0">
                    {userInitial}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-white truncate">{userName || 'Analytics User'}</p>
                    <p className="text-[11px] text-slate-400 truncate">{userEmail || 'user@insightai.io'}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/app');
                  }}
                  className="w-full px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
                >
                  <LayoutDashboard size={15} /> Dashboard
                </button>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut size={15} /> Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-200 bg-slate-900 border border-slate-800"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500"
                >
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
