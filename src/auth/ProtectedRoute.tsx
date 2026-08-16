import React, { useState, useEffect } from 'react';
import { Navigate, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const navigate = useNavigate();

  // Three states: 'loading' | 'authenticated' | 'unauthenticated'
  const [authState, setAuthState] = useState<'loading' | 'authenticated' | 'unauthenticated'>(() => {
    // If a token is already in localStorage, start as authenticated immediately
    // (avoids flash of redirect on normal page loads)
    return localStorage.getItem('insightai_token') ? 'authenticated' : 'loading';
  });

  useEffect(() => {
    let mounted = true;

    // Check for an active Supabase session (covers the OAuth callback case
    // where the URL has #access_token=... and localStorage is not yet set)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;

      if (session?.user) {
        // Supabase session is valid — onAuthStateChange will sync localStorage,
        // but we can mark authenticated right now so the dashboard renders.
        setAuthState('authenticated');
      } else if (!localStorage.getItem('insightai_token')) {
        // No Supabase session AND no local token → not logged in
        setAuthState('unauthenticated');
      } else {
        // Has a local token (email login) but no Supabase session — treat as authenticated
        setAuthState('authenticated');
      }
    });

    // Listen for Supabase auth events (SIGNED_IN fires after OAuth hash is parsed)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_IN' && session?.user) {
        setAuthState('authenticated');
        // If we are currently at /login or /signup, navigate to /app
        if (location.pathname === '/login' || location.pathname === '/signup') {
          navigate('/app', { replace: true });
        }
      } else if (event === 'SIGNED_OUT') {
        setAuthState('unauthenticated');
      }
    });

    // Also react to localStorage-based login/logout (email flow)
    const syncToken = () => {
      const token = localStorage.getItem('insightai_token');
      setAuthState(token ? 'authenticated' : 'unauthenticated');
    };
    window.addEventListener('insightai_user_updated', syncToken);
    window.addEventListener('storage', syncToken);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener('insightai_user_updated', syncToken);
      window.removeEventListener('storage', syncToken);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Still resolving session — show nothing briefly to avoid flash redirect
  if (authState === 'loading') {
    return (
      <div className="min-h-screen bg-[#0b1120] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500">Loading workspace…</p>
        </div>
      </div>
    );
  }

  if (authState === 'unauthenticated') {
    return <Navigate to="/login" state={{ returnTo: location.pathname }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
