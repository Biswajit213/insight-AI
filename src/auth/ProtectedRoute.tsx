import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const token = localStorage.getItem('insightai_token');

  // Check if session token exists
  if (!token) {
    return <Navigate to="/login" state={{ returnTo: location.pathname }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
