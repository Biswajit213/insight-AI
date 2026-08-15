import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { User, Shield, Bell, Palette } from 'lucide-react';
import { AppLayout } from './components/layout/AppLayout';
import { DatasetProvider } from './context/DatasetContext';
import { ReportProvider } from './context/ReportContext';
import { PageSkeleton } from './components/common/Skeleton';
import { Header } from './components/layout/Header';
import { ProfileSettings, SecuritySettings, AppearanceSettings } from './pages/Settings';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { cn } from './lib/utils';

// Public Marketing Pages
const Home = lazy(() => import('./pages/Home'));
const FeaturesPage = lazy(() => import('./pages/FeaturesPage'));
const SolutionsPage = lazy(() => import('./pages/SolutionsPage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));

// Protected Workspace Application Pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const DataSources = lazy(() => import('./pages/DataSources'));
const DatasetDetail = lazy(() => import('./pages/DatasetDetail'));
const ExcelEditor = lazy(() => import('./pages/ExcelEditor'));
const DataCleaningStudio = lazy(() => import('./pages/DataCleaningStudio'));
const Analysis = lazy(() => import('./pages/Analysis'));
const AIInsights = lazy(() => import('./pages/AIInsights'));
const Reports = lazy(() => import('./pages/Reports'));
const ReportDetail = lazy(() => import('./pages/ReportDetail'));
const Anomalies = lazy(() => import('./pages/Anomalies'));
const Settings = lazy(() => import('./pages/Settings'));

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, retry: 1 } },
});

const settingsNav = [
  { label: 'Profile', path: '/app/settings/profile', icon: <User size={16} /> },
  { label: 'Security', path: '/app/settings/security', icon: <Shield size={16} /> },
  { label: 'Notifications', path: '/app/settings', icon: <Bell size={16} />, exact: true },
  { label: 'Appearance', path: '/app/settings/preferences', icon: <Palette size={16} /> },
];

function SettingsShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-full">
      <Header title="Settings" subtitle="Manage your account, workspace and security preferences" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          <div className="lg:col-span-1">
            <nav className="card p-3 space-y-1" aria-label="Settings navigation">
              {settingsNav.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.exact}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    )
                  }
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="lg:col-span-3">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DatasetProvider>
        <ReportProvider>
          <BrowserRouter>
            <Suspense fallback={<PageSkeleton />}>
              <Routes>
                {/* PUBLIC MARKETING WEBSITE */}
                <Route path="/" element={<Home />} />
                <Route path="/features" element={<FeaturesPage />} />
                <Route path="/solutions" element={<SolutionsPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />

                {/* AUTHENTICATION */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />

                {/* PROTECTED APPLICATION WORKSPACE (/app) */}
                <Route
                  path="/app"
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Dashboard />} />
                  <Route path="datasets" element={<DataSources />} />
                  <Route path="datasets/:id" element={<DatasetDetail />} />
                  <Route path="datasets/:id/edit" element={<ExcelEditor />} />
                  <Route path="data-cleaning" element={<DataCleaningStudio />} />
                  <Route path="data-cleaning/:id" element={<DataCleaningStudio />} />
                  <Route path="insights" element={<AIInsights />} />
                  <Route path="ask" element={<Analysis />} />
                  <Route path="anomalies" element={<Anomalies />} />
                  <Route path="forecasting" element={<Analysis />} />
                  <Route path="what-if" element={<Analysis />} />
                  <Route path="visualizations" element={<Analysis />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="reports/:id" element={<ReportDetail />} />

                  {/* Settings Shell */}
                  <Route path="settings" element={<SettingsShell><Settings /></SettingsShell>} />
                  <Route path="settings/profile" element={<SettingsShell><ProfileSettings /></SettingsShell>} />
                  <Route path="settings/security" element={<SettingsShell><SecuritySettings /></SettingsShell>} />
                  <Route path="settings/preferences" element={<SettingsShell><AppearanceSettings /></SettingsShell>} />
                </Route>

                {/* BACKWARDS-COMPATIBILITY REDIRECTS */}
                <Route path="/dashboard" element={<Navigate to="/app" replace />} />
                <Route path="/data-sources" element={<Navigate to="/app/datasets" replace />} />
                <Route path="/data-sources/*" element={<Navigate to="/app/datasets" replace />} />
                <Route path="/data-cleaning" element={<Navigate to="/app/data-cleaning" replace />} />
                <Route path="/data-cleaning/*" element={<Navigate to="/app/data-cleaning" replace />} />
                <Route path="/analysis" element={<Navigate to="/app/visualizations" replace />} />
                <Route path="/ai-insights" element={<Navigate to="/app/insights" replace />} />
                <Route path="/reports" element={<Navigate to="/app/reports" replace />} />
                <Route path="/reports/*" element={<Navigate to="/app/reports" replace />} />
                <Route path="/anomalies" element={<Navigate to="/app/anomalies" replace />} />
                <Route path="/settings" element={<Navigate to="/app/settings" replace />} />
                <Route path="/settings/*" element={<Navigate to="/app/settings" replace />} />

                {/* FALLBACK */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ReportProvider>
      </DatasetProvider>
    </QueryClientProvider>
  );
}
