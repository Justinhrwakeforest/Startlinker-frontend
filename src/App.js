// src/App.js - Complete App Component with All Routes including My Claims
import React, { useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { NotificationProvider } from './components/NotificationSystem';
import './config/axios'; // Import axios configuration
import { forceHttpInDevelopment } from './utils/forceHttp';
import Auth from './components/Auth';
import PasswordResetRequest from './components/PasswordResetRequest';
import PasswordResetConfirm from './components/PasswordResetConfirm';
import EmailVerification from './components/EmailVerification';
import EmailVerificationPending from './components/EmailVerificationPending';
import PostsFeed from './components/PostsFeed';
import SocialDashboard from './components/SocialDashboard';
import CollaborationProjectDetail from './components/social/CollaborationProjectDetail';
import Startups from './components/Startups';
import StartupDetail from './components/StartupDetail';
import StartupUploadForm from './components/StartupUploadForm';
import StartupEditForm from './components/StartupEditForm';
import AdminDashboard from './components/AdminDashboard';
import ReportManagement from './components/ReportManagement';
import UnifiedAdminDashboard from './components/UnifiedAdminDashboard';
import Jobs from './components/Jobs';
import JobDetailPage from './components/JobDetailPage';
import JobEditForm from './components/JobEditForm';
import JobUploadForm from './components/JobUploadForm';
import JobAdminDashboard from './components/JobAdminDashboard';
import Profile from './components/Profile';
import UserProfile from './components/UserProfile';
import Bookmarks from './components/Bookmarks';
import Settings from './components/Settings';
import Activity from './components/Activity';
import Help from './components/Help';
import MyClaims from './components/MyClaims';
import MyJobs from './components/MyJobs';
import JobsApplied from './components/JobsApplied';
import Messages from './components/Messages';
import NotificationsPage from './components/NotificationsPage';
import UsernameDemo from './components/UsernameDemo';
import Terms from './components/Terms';
import Privacy from './components/Privacy';
import Welcome from './components/Welcome';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import StartupGuide from './components/StartupGuide';
import NotFoundPage from './components/NotFoundPage';
import { setupNavigationListeners, detectAndFixBrokenState } from './utils/navigationFix';
// Removed deck analyzer imports - functionality disabled
import './App.css';

// Force HTTP in development
forceHttpInDevelopment();

// Loading Component
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
    <div className="text-center">
      <div className="relative">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full animate-pulse"></div>
        </div>
      </div>
      <p className="text-gray-600 font-medium text-lg">Loading StartLinker...</p>
      <p className="text-gray-500 text-sm mt-2">Connecting you to innovation</p>
    </div>
  </div>
);

// Error Fallback Component
const ErrorFallback = ({ error, resetError }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center max-w-md mx-auto p-6">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
      <p className="text-gray-600 mb-4">
        We're sorry, but something unexpected happened. Please try refreshing the page.
      </p>
      <div className="space-y-3">
        <button 
          onClick={resetError}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
        <button 
          onClick={() => window.location.href = '/'}
          className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Go to Homepage
        </button>
        <button 
          onClick={() => window.location.reload()}
          className="w-full px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
        >
          Reload Page
        </button>
      </div>
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-4 text-left">
          <summary className="text-sm text-gray-500 cursor-pointer">Error Details (Development Only)</summary>
          <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
            {error?.stack || error?.message || 'Unknown error'}
          </pre>
        </details>
      )}
    </div>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const authContextValue = useContext(AuthContext);
  
  if (!authContextValue) {
    return <LoadingScreen />;
  }

  const { isAuthenticated, loading } = authContextValue;
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  return isAuthenticated ? children : <Navigate to="/welcome" />;
};

// Admin Route Component
const AdminRoute = ({ children }) => {
  const authContextValue = useContext(AuthContext);
  
  if (!authContextValue) {
    return <LoadingScreen />;
  }

  const { isAuthenticated, loading, user } = authContextValue;
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" />;
  }
  
  if (!user?.is_staff && !user?.is_superuser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-lg shadow-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have permission to access this admin area.</p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  return children;
};

// Navigation Monitor Component
const NavigationMonitor = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Setup navigation listeners and error detection
    setupNavigationListeners(navigate);
    detectAndFixBrokenState();
    
    // Cleanup function
    return () => {
      // Navigation listeners are cleaned up automatically
    };
  }, [navigate]);
  
  return null; // This component doesn't render anything
};

// App Routes Component
const AppRoutes = () => {
  const authContextValue = useContext(AuthContext);

  if (!authContextValue) {
    return <LoadingScreen />;
  }

  const { isAuthenticated, loading } = authContextValue;

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      <NavigationMonitor />
      <div className="App min-h-screen bg-gray-50">
        <Routes>
          {/* Public welcome page - shows when not authenticated (no navbar/footer) */}
          <Route 
            path="/welcome" 
            element={!isAuthenticated ? <Welcome /> : <Navigate to="/" />} 
          />
          
          {/* Auth route - redirects to dashboard if already authenticated (no navbar/footer) */}
          <Route 
            path="/auth" 
            element={!isAuthenticated ? <Auth /> : <Navigate to="/" />} 
          />
          
          {/* Redirect /login to /auth for compatibility */}
          <Route 
            path="/login" 
            element={<Navigate to="/auth" replace />} 
          />
          
          {/* Password reset routes (no navbar/footer) */}
          <Route 
            path="/forgot-password" 
            element={!isAuthenticated ? <PasswordResetRequest /> : <Navigate to="/" />} 
          />
          <Route 
            path="/reset-password/:uid/:token" 
            element={!isAuthenticated ? <PasswordResetConfirm /> : <Navigate to="/" />} 
          />
          
          {/* Email verification routes (no navbar/footer) */}
          <Route 
            path="/auth/verify-email/:token" 
            element={<EmailVerification />} 
          />
          <Route 
            path="/verify-email-pending" 
            element={!isAuthenticated ? <EmailVerificationPending /> : <Navigate to="/" />} 
          />
          
          {/* Public content pages (no navbar/footer) */}
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          
          {/* Protected routes - require authentication (WITH navbar/footer via Layout) */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Layout>
                  <ErrorBoundary fallback={ErrorFallback}>
                    <SocialDashboard />
                  </ErrorBoundary>
                </Layout>
              </ProtectedRoute>
            } 
          />
          

          
          <Route 
            path="/social" 
            element={
              <ProtectedRoute>
                <Layout>
                  <ErrorBoundary fallback={ErrorFallback}>
                    <SocialDashboard />
                  </ErrorBoundary>
                </Layout>
              </ProtectedRoute>
            } 
          />
          
          {/* Collaboration Project Detail Route */}
          <Route 
            path="/social/collaboration/:projectId" 
            element={
              <ProtectedRoute>
                <Layout>
                  <ErrorBoundary fallback={ErrorFallback}>
                    <CollaborationProjectDetail />
                  </ErrorBoundary>
                </Layout>
              </ProtectedRoute>
            } 
          />
          
          {/* Startup Routes */}
          <Route 
            path="/startups" 
            element={
              <ProtectedRoute>
                <Layout>
                  <ErrorBoundary fallback={ErrorFallback}>
                    <Startups />
                  </ErrorBoundary>
                </Layout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/startups/new" 
            element={
              <ProtectedRoute>
                <Layout>
                  <ErrorBoundary fallback={ErrorFallback}>
                    <StartupUploadForm />
                  </ErrorBoundary>
                </Layout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/startups/:id/edit" 
            element={
              <ProtectedRoute>
                <Layout>
                  <ErrorBoundary fallback={ErrorFallback}>
                    <StartupEditForm />
                  </ErrorBoundary>
                </Layout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/startups/:id" 
            element={
              <ProtectedRoute>
                <Layout>
                  <ErrorBoundary fallback={ErrorFallback}>
                    <StartupDetail />
                  </ErrorBoundary>
                </Layout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/startup-guide" 
            element={
              <ProtectedRoute>
                <Layout>
                  <ErrorBoundary fallback={ErrorFallback}>
                    <StartupGuide />
                  </ErrorBoundary>
                </Layout>
              </ProtectedRoute>
            } 
          />
          
          {/* Job Routes */}
          <Route 
            path="/jobs" 
            element={
              <ProtectedRoute>
                <Layout>
                  <ErrorBoundary fallback={ErrorFallback}>
                    <Jobs />
                  </ErrorBoundary>
                </Layout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/jobs/:id" 
            element={
              <ProtectedRoute>
                <Layout>
                  <ErrorBoundary fallback={ErrorFallback}>
                    <JobDetailPage />
                  </ErrorBoundary>
                </Layout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/jobs/create" 
            element={
              <ProtectedRoute>
                <Layout>
                  <ErrorBoundary fallback={ErrorFallback}>
                    <JobUploadForm />
                  </ErrorBoundary>
                </Layout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/jobs/:id/edit" 
            element={
              <ProtectedRoute>
                <Layout>
                  <ErrorBoundary fallback={ErrorFallback}>
                    <JobEditForm />
                  </ErrorBoundary>
                </Layout>
              </ProtectedRoute>
            } 
          />
          
          {/* Admin Routes */}
          <Route 
            path="/admin" 
            element={
              <AdminRoute>
                <Layout>
                  <ErrorBoundary fallback={ErrorFallback}>
                    <UnifiedAdminDashboard />
                  </ErrorBoundary>
                </Layout>
              </AdminRoute>
            } 
          />
          
          <Route 
            path="/job-admin" 
            element={
              <AdminRoute>
                <Layout>
                  <ErrorBoundary fallback={ErrorFallback}>
                    <JobAdminDashboard />
                  </ErrorBoundary>
                </Layout>
              </AdminRoute>
            } 
          />
          
          {/* User Profile and Settings Routes */}
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Layout>
                  <ErrorBoundary fallback={ErrorFallback}>
                    <Profile />
                  </ErrorBoundary>
                </Layout>
              </ProtectedRoute>
            } 
          />
          
          {/* Dynamic User Profile Route */}
          <Route 
            path="/profile/:identifier" 
            element={
              <ProtectedRoute>
                <Layout>
                  <ErrorBoundary fallback={ErrorFallback}>
                    <UserProfile />
                  </ErrorBoundary>
                </Layout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/bookmarks" 
            element={
              <ProtectedRoute>
                <Layout>
                  <ErrorBoundary fallback={ErrorFallback}>
                    <Bookmarks />
                  </ErrorBoundary>
                </Layout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <Layout>
                  <ErrorBoundary fallback={ErrorFallback}>
                    <Settings />
                  </ErrorBoundary>
                </Layout>
              </ProtectedRoute>
            } 
          />

          
          <Route 
            path="/activity" 
            element={
              <ProtectedRoute>
                <Layout>
                  <ErrorBoundary fallback={ErrorFallback}>
                    <Activity />
                  </ErrorBoundary>
                </Layout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/help" 
            element={
              <ProtectedRoute>
                <Layout>
                  <ErrorBoundary fallback={ErrorFallback}>
                    <Help />
                  </ErrorBoundary>
                </Layout>
              </ProtectedRoute>
            } 
          />
          
          {/* My Claims Route - NEW */}
          <Route 
            path="/my-claims" 
            element={
              <ProtectedRoute>
                <Layout>
                  <ErrorBoundary fallback={ErrorFallback}>
                    <MyClaims />
                  </ErrorBoundary>
                </Layout>
              </ProtectedRoute>
            } 
          />
          
          {/* My Jobs Route - Job Poster Dashboard */}
          <Route 
            path="/my-jobs" 
            element={
              <ProtectedRoute>
                <Layout>
                  <ErrorBoundary fallback={ErrorFallback}>
                    <MyJobs />
                  </ErrorBoundary>
                </Layout>
              </ProtectedRoute>
            } 
          />
          
          {/* Jobs Posted Route - Job Poster Dashboard */}
          <Route 
            path="/my-jobs/posted" 
            element={
              <ProtectedRoute>
                <Layout>
                  <ErrorBoundary fallback={ErrorFallback}>
                    <MyJobs />
                  </ErrorBoundary>
                </Layout>
              </ProtectedRoute>
            } 
          />
          
          {/* Jobs Applied Route - View job applications */}
          <Route 
            path="/my-jobs/applied" 
            element={
              <ProtectedRoute>
                <Layout>
                  <ErrorBoundary fallback={ErrorFallback}>
                    <JobsApplied />
                  </ErrorBoundary>
                </Layout>
              </ProtectedRoute>
            } 
          />
          
          {/* Messages Routes */}
          <Route 
            path="/messages" 
            element={
              <ProtectedRoute>
                <Layout>
                  <ErrorBoundary fallback={ErrorFallback}>
                    <Messages />
                  </ErrorBoundary>
                </Layout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/messages/:conversationId" 
            element={
              <ProtectedRoute>
                <Layout>
                  <ErrorBoundary fallback={ErrorFallback}>
                    <Messages />
                  </ErrorBoundary>
                </Layout>
              </ProtectedRoute>
            } 
          />
          
          {/* Notifications Route */}
          <Route 
            path="/notifications" 
            element={
              <ProtectedRoute>
                <Layout>
                  <ErrorBoundary fallback={ErrorFallback}>
                    <NotificationsPage />
                  </ErrorBoundary>
                </Layout>
              </ProtectedRoute>
            } 
          />
          
          {/* Pitch Deck Analysis Routes - REMOVED */}
          
          {/* Username Demo - for testing */}
          <Route 
            path="/username-demo" 
            element={<UsernameDemo />} 
          />
          
          {/* 404 Not Found Route */}
          <Route 
            path="/404" 
            element={<NotFoundPage />}
          />
          
          {/* Catch-all route - handle unknown URLs */}
          <Route 
            path="*" 
            element={
              <Layout>
                <NotFoundPage />
              </Layout>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
};

// Main App Component
function App() {
  return (
    <ErrorBoundary fallback={ErrorFallback}>
      <AuthProvider>
        <NotificationProvider>
          <AppRoutes />
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;