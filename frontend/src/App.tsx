import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { WebSocketProvider } from '@/contexts/WebSocketContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import '@/index.css';
import './App.css'; // ✅ Make sure this exists
import './index.css'; // ✅ Make sure Tailwind is imported

// Layout & Route Protection

import PublicLayout from '@/components/common/PublicLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AdminRoute from '@/components/auth/AdminRoute';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

// ===== PUBLIC PAGES =====
const HomePage = React.lazy(() => import('@/pages/HomePage'));
const FeaturesPage = React.lazy(() => import('@/pages/FeaturesPage'));
// const SolutionsPage = React.lazy(() => import('@/pages/SolutionsPage'));
const ContactPage = React.lazy(() => import('@/pages/ContactPage'));
// const BlogPage = React.lazy(() => import('@/pages/BlogPage'));
const LoginPage = React.lazy(() => import('@/pages/LoginPage'));
const RegisterPage = React.lazy(() => import('@/pages/RegisterPage'));

// ===== MAIN APP PAGES =====
const DashboardPage = React.lazy(() => import('@/pages/DashboardPage'));

// Camera Management
const CamerasPage = React.lazy(() => import('@/pages/CamerasPage'));
const CameraDetailPage = React.lazy(() => import('@/pages/CameraDetailPage'));
const CameraFormPage = React.lazy(() => import('@/pages/CameraFormPage'));

// Person Management (Known Persons)
const PersonsPage = React.lazy(() => import('@/pages/PersonsPage'));
const PersonDetailPage = React.lazy(() => import('@/pages/PersonDetailPage'));
const PersonFormPage = React.lazy(() => import('@/pages/PersonFormPage'));

// Detection & Monitoring
const DetectionsPage = React.lazy(() => import('@/pages/DetectionsPage'));
// const DetectionActivityPage = React.lazy(() => import('@/pages/DetectionsPage'));
const AlertsPage = React.lazy(() => import('@/pages/AlertsPage'));
const LiveMonitoringPage = React.lazy(() => import('@/pages/LiveMonitoringPage'));

// Analytics & Reports
const AnalyticsPage = React.lazy(() => import('@/pages/AnalyticsPage'));
const OverviewPage = React.lazy(() => import('@/pages/OverviewPage'));
const TrendsPage = React.lazy(() => import('@/pages/TrendsPage'));
const ReportsPage = React.lazy(() => import('@/pages/ReportsPage'));

// Settings & Profile
const SettingsPage = React.lazy(() => import('@/pages/SettingsPage'));
const GeneralSettingsPage = React.lazy(() => import('@/pages/GeneralSettingsPage'));
const FaceRecognitionSettingsPage = React.lazy(() => import('@/pages/FaceRecognitionSettingsPage'));
const NotificationSettingsPage = React.lazy(() => import('@/pages/NotificationSettingsPage'));
const SecuritySettingsPage = React.lazy(() => import('@/pages/SecuritySettingsPage'));
const ProfilePage = React.lazy(() => import('@/pages/ProfilePage'));

// Admin Panel
const AdminPage = React.lazy(() => import('@/pages/AdminPage'));

// Utility Pages
// const HelpPage = React.lazy(() => import('@/pages/HelpPage'));
const NotFoundPage = React.lazy(() => import('@/pages/NotFoundPage'));
const UnauthorizedPage = React.lazy(() => import('@/pages/UnauthorizedPage'));

// ===== QUERY CLIENT CONFIGURATION =====
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache for 5 minutes for real-time data
      staleTime: 5 * 60 * 1000, 
      gcTime: 10 * 60 * 1000,
      retry: (failureCount, error: any) => {
        // Don't retry auth errors
        if (error?.response?.status === 401 || error?.response?.status === 403) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
      // Enable real-time refetching for critical data
      refetchInterval: (query) => {
        // Refetch detection stats every 30 seconds
        if (query.queryKey.includes('detections') || query.queryKey.includes('stats')) {
          return 30000;
        }
        // No auto-refetch for other data
        return false;
      },
    },
    mutations: {
      retry: 1,
      onError: (error: any) => {
        console.error('SafeFace API Error:', error);
      },
    },
  },
});

// ===== ERROR HANDLING =====
const GlobalErrorHandler = ({ children }: { children: React.ReactNode }) => {
  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('SafeFace - Unhandled promise rejection:', event.reason);
      
      // Handle specific Face Recognition errors
      if (event.reason?.message?.includes('camera')) {
        console.error('Camera connection error detected');
      }
      if (event.reason?.message?.includes('detection')) {
        console.error('Face detection error detected');
      }
    };

    const handleError = (event: ErrorEvent) => {
      console.error('SafeFace - Global error:', event.error);
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return <>{children}</>;
};

// ===== LOADING COMPONENTS =====
const AppLoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
    <div className="text-center space-y-6 max-w-md mx-auto px-6">
      {/* SafeFace Logo */}
      <div className="flex items-center justify-center space-x-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
          <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 13.5C15.75 14.5 16.5 15.5 17.25 16.5L21 9ZM15 2H9V6H15V2ZM7.5 7C8.3 7 9 7.7 9 8.5S8.3 10 7.5 10 6 9.3 6 8.5 6.7 7 7.5 7ZM16.5 7C17.3 7 18 7.7 18 8.5S17.3 10 16.5 10 15 9.3 15 8.5 15.7 7 16.5 7Z"/>
          </svg>
        </div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          SafeFace
        </h1>
      </div>

      {/* Loading Animation */}
      <div className="relative">
        <LoadingSpinner size="lg" className="text-blue-600" />
        <div className="absolute inset-0 animate-ping">
          <div className="w-12 h-12 border-2 border-blue-400 rounded-full opacity-20"></div>
        </div>
      </div>

      {/* Loading Text */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900">
          Loading SafeFace AI Platform
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed">
          Preparing your intelligent security solution...
        </p>
      </div>

      {/* Feature Pills */}
      <div className="flex flex-wrap gap-2 justify-center mt-4">
        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
          AI-Powered
        </span>
        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
          Real-time Security
        </span>
        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
          Enterprise Ready
        </span>
      </div>
    </div>
  </div>
);

// ===== SIMPLE LOADING FOR AUTH PAGES =====
const SimpleLoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center space-y-4">
      <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mx-auto">
        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2Z"/>
        </svg>
      </div>
      <LoadingSpinner size="sm" className="text-blue-600" />
    </div>
  </div>
);

// ===== MAIN APP COMPONENT =====
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <GlobalErrorHandler>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider defaultTheme="system" storageKey="safeface-ui-theme">
            <AuthProvider>
              <WebSocketProvider>
                <Router>
                  <div className="min-h-screen bg-background text-foreground">
                    <Routes>
                      {/* ===== PUBLIC ROUTES WITH COMMERCIAL LAYOUT ===== */}
                      <Route path="/" element={
                        <Suspense fallback={<AppLoadingFallback />}>
                          <PublicLayout />
                        </Suspense>
                      }>
                        {/* Main Pages */}
                        <Route index element={
                          <Suspense fallback={<AppLoadingFallback />}>
                            <HomePage />
                          </Suspense>
                        } />
                        
                        {/* Product Pages */}
                        <Route path="features" element={
                          <Suspense fallback={<AppLoadingFallback />}>
                            <FeaturesPage />
                          </Suspense>
                        } />
                        {/* <Route path="solutions" element={
                          <Suspense fallback={<AppLoadingFallback />}>
                            <SolutionsPage />
                          </Suspense>
                        } />
                        <Route path="solutions/:type" element={
                          <Suspense fallback={<AppLoadingFallback />}>
                            <SolutionsPage />
                          </Suspense>
                        } /> */}
                        <Route path="contact" element={
                          <Suspense fallback={<AppLoadingFallback />}>
                            <ContactPage />
                          </Suspense>
                        } />

                        {/* Resources */}
                        {/* <Route path="blog" element={
                          <Suspense fallback={<AppLoadingFallback />}>
                            <BlogPage />
                          </Suspense>
                        } /> */}
                        {/* <Route path="help" element={
                          <Suspense fallback={<AppLoadingFallback />}>
                            <HelpPage />
                          </Suspense>
                        } /> */}

                        {/* Support Pages */}
                        {/* <Route path="docs" element={
                          <Suspense fallback={<AppLoadingFallback />}>
                            <HelpPage />
                          </Suspense>
                        } />
                        <Route path="api-docs" element={
                          <Suspense fallback={<AppLoadingFallback />}>
                            <HelpPage />
                          </Suspense>
                        } />
                        
                        <Route path="status" element={
                          <Suspense fallback={<AppLoadingFallback />}>
                            <HelpPage />
                          </Suspense>
                        } /> */}

                      </Route>

                      {/* ===== AUTHENTICATION PAGES (NO LAYOUT) ===== */}
                      <Route path="/login" element={
                        <Suspense fallback={<SimpleLoadingFallback />}>
                          <LoginPage />
                        </Suspense>
                      } />
                      <Route path="/register" element={
                        <Suspense fallback={<SimpleLoadingFallback />}>
                          <RegisterPage />
                        </Suspense>
                      } />
                      <Route path="/unauthorized" element={
                        <Suspense fallback={<SimpleLoadingFallback />}>
                          <UnauthorizedPage />
                        </Suspense>
                      } />

                      {/* ===== PROTECTED APPLICATION ROUTES ===== */}
                      <Route path="/app" element={
                        <ProtectedRoute>
                          <Suspense fallback={<AppLoadingFallback />}>
                            < DashboardLayout/>
                          </Suspense>
                        </ProtectedRoute>
                      }>
                        {/* Dashboard & Overview */}
                        <Route index element={<Navigate to="/app/dashboard" replace />} />
                        <Route path="dashboard" element={
                          <Suspense fallback={<LoadingSpinner />}>
                            <DashboardPage />
                          </Suspense>
                        } />
                        <Route path="live" element={
                          <Suspense fallback={<LoadingSpinner />}>
                            <LiveMonitoringPage />
                          </Suspense>
                        } />

                        {/* Camera Management */}
                        <Route path="cameras">
                          <Route index element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <CamerasPage />
                            </Suspense>
                          } />
                          <Route path="new" element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <CameraFormPage />
                            </Suspense>
                          } />
                          <Route path=":cameraId" element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <CameraDetailPage />
                            </Suspense>
                          } />
                          <Route path=":cameraId/edit" element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <CameraFormPage />
                            </Suspense>
                          } />
                          <Route path=":cameraId/stream" element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <CameraDetailPage />
                            </Suspense>
                          } />
                          <Route path=":cameraId/settings" element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <CameraFormPage />
                            </Suspense>
                          } />
                        </Route>

                        {/* Known Persons Management */}
                        <Route path="persons">
                          <Route index element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <PersonsPage />
                            </Suspense>
                          } />
                          <Route path="new" element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <PersonFormPage />
                            </Suspense>
                          } />
                          <Route path=":personId" element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <PersonDetailPage />
                            </Suspense>
                          } />
                          <Route path=":personId/edit" element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <PersonFormPage />
                            </Suspense>
                          } />
                          <Route path="import" element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <PersonFormPage />
                            </Suspense>
                          } />
                          {/* <Route path="bulk-actions" element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <PersonsPage />
                            </Suspense>
                          } /> */}

                          <Route path="persons/bulk-import" element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <PersonFormPage />
                            </Suspense>
                          } />
                        </Route>

                        {/* Detection & Monitoring */}
                        <Route path="detections">
                          <Route index element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <DetectionsPage />
                            </Suspense>
                          } />
                          <Route path="history" element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <DetectionsPage />
                            </Suspense>
                          } />
                          <Route path="alerts" element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <AlertsPage />
                            </Suspense>
                          } />
                          <Route path="archive" element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <DetectionsPage />
                            </Suspense>
                          } />
                        </Route>

                        {/* Analytics & Insights */}
                        <Route path="analytics">
                          <Route index element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <AnalyticsPage />
                            </Suspense>
                          } />
                          <Route path="overview" element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <OverviewPage />
                            </Suspense>
                          } />
                          <Route path="trends" element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <TrendsPage />
                            </Suspense>
                          } />
                          <Route path="heatmap" element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <AnalyticsPage />
                            </Suspense>
                          } />
                          <Route path="performance" element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <AnalyticsPage />
                            </Suspense>
                          } />
                          <Route path="reports" element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <ReportsPage />
                            </Suspense>
                          } />
                        </Route>

                        {/* Settings & Configuration */}
                        <Route path="settings">
                          <Route index element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <SettingsPage />
                            </Suspense>
                          } />
                          <Route path="general" element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <GeneralSettingsPage />
                            </Suspense>
                          } />
                          <Route path="face-recognition" element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <FaceRecognitionSettingsPage />
                            </Suspense>
                          } />
                          <Route path="notifications" element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <NotificationSettingsPage />
                            </Suspense>
                          } />
                          <Route path="security" element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <SecuritySettingsPage />
                            </Suspense>
                          } />
                          <Route path="advanced" element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <SettingsPage />
                            </Suspense>
                          } />
                        </Route>

                      {/* User Profile */}
                      <Route path="profile" element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <ProfilePage />
                        </Suspense>
                      } />
                    </Route>

                    {/* ✅ Protected Dashboard Routes - Sử dụng DashboardLayout */}
                    <Route path="/" element={
                      <ProtectedRoute>
                        <DashboardLayout />
                      </ProtectedRoute>
                    }>
                      <Route path="dashboard" element={<DashboardPage />} />
                      <Route path="cameras" element={<CamerasPage />} />
                      <Route path="cameras/new" element={<CameraFormPage/>} />
                      <Route path="cameras/:id" element={<CameraDetailPage />} />
                      {/* <Route path="cameras/:id/edit" element={<EditCameraPage />} /> */}
                      <Route path="persons" element={<PersonsPage />} />
                      <Route path="persons/new" element={<PersonFormPage />} />
                      <Route path="persons/:id" element={<PersonDetailPage />} />
                      <Route path="persons/:id/edit" element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <PersonFormPage />
                        </Suspense>
                      } />

                      <Route path="detections" element={<DetectionsPage />} />
                      <Route path="analytics" element={<AnalyticsPage />} />
                      <Route path="settings" element={<SettingsPage />} />
                      <Route path="live-monitoring" element={<LiveMonitoringPage />} />
                      {/* <Route path="search" element={<SearchPage />} /> */}
                    </Route>

                    {/* ✅ Admin Panel - Independent, no sidebar */}
                    <Route path="/admin" element={
                      <AdminRoute>
                        <Suspense fallback={<LoadingSpinner />}>
                          <AdminPage />
                        </Suspense>
                      </AdminRoute>
                    } />
                    <Route path="/admin/*" element={
                      <AdminRoute>
                        <Suspense fallback={<LoadingSpinner />}>
                          <AdminPage />
                        </Suspense>
                      </AdminRoute>
                    } />

                      {/* ===== ERROR HANDLING ===== */}
                      <Route path="/404" element={
                        <Suspense fallback={<SimpleLoadingFallback />}>
                          <NotFoundPage />
                        </Suspense>
                      } />
                      <Route path="*" element={<Navigate to="/404" replace />} />
                    </Routes>

                    {/* ===== GLOBAL NOTIFICATIONS ===== */}
                    <Toaster
                      position="top-right"
                      richColors
                      closeButton
                      duration={2000}
                      theme="system"
                      expand={true}
                      toastOptions={{
                      style: {
                        background: 'white',
                        color: '#1a1a1a',
                        border: '1px solid #e5e5e5',
                        borderRadius: '8px',
                        fontSize: '14px',
                        padding: '16px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                      },
                      className: 'font-medium',
                      descriptionClassName: 'text-sm opacity-80',
                      }}
                      icons={{
                      success: '✅',
                      error: '❌',
                      warning: '⚠️',
                      info: '🔔',
                      loading: '⏳',
                      }}
                    />

                    {/* ===== DEVELOPMENT TOOLS ===== */}
                    {process.env.NODE_ENV === 'development' && (
                      <ReactQueryDevtools
                        initialIsOpen={false}
                        position="bottom"
                      />
                    )}
                  </div>
                </Router>
              </WebSocketProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </GlobalErrorHandler>
    </ErrorBoundary>
  );
};

export default App;