import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import { Suspense, lazy } from 'react';

// Lazy load components for better performance
const Login = lazy(() => import('./pages/Login'));
const CleanDashboard = lazy(() => import('./pages/CleanDashboard'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Clients = lazy(() => import('./pages/Clients'));
const ClientProfile = lazy(() => import('./pages/ClientProfile'));
const Services = lazy(() => import('./pages/Services'));
const Quotations = lazy(() => import('./pages/Quotations'));
const Invoices = lazy(() => import('./pages/Invoices'));
const Users = lazy(() => import('./pages/Users'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const FinancialActivities = lazy(() => import('./pages/FinancialActivities'));
const Settings = lazy(() => import('./pages/Settings'));
const Projects = lazy(() => import('./pages/Projects'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const EditProject = lazy(() => import('./pages/EditProject'));

// Loading component for lazy loading
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
  </div>
);

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/" replace /> : 
          <Suspense fallback={<LoadingSpinner />}>
            <Login />
          </Suspense>
        } 
      />
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Layout>
              <Suspense fallback={<LoadingSpinner />}>
                <CleanDashboard />
              </Suspense>
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/analytics" 
        element={
          <ProtectedRoute>
            <Layout>
              <ErrorBoundary>
                <Suspense fallback={<LoadingSpinner />}>
                  <Analytics />
                </Suspense>
              </ErrorBoundary>
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/clients" 
        element={
          <ProtectedRoute>
            <Layout>
              <ErrorBoundary>
                <Suspense fallback={<LoadingSpinner />}>
                  <Clients />
                </Suspense>
              </ErrorBoundary>
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/clients/:id" 
        element={
          <ProtectedRoute>
            <Layout>
              <ErrorBoundary>
                <Suspense fallback={<LoadingSpinner />}>
                  <ClientProfile />
                </Suspense>
              </ErrorBoundary>
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/services" 
        element={
          <ProtectedRoute>
            <Layout>
              <ErrorBoundary>
                <Suspense fallback={<LoadingSpinner />}>
                  <Services />
                </Suspense>
              </ErrorBoundary>
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/projects" 
        element={
          <ProtectedRoute>
            <Layout>
              <ErrorBoundary>
                <Suspense fallback={<LoadingSpinner />}>
                  <Projects />
                </Suspense>
              </ErrorBoundary>
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/projects/:id" 
        element={
          <ProtectedRoute>
            <Layout>
              <ErrorBoundary>
                <Suspense fallback={<LoadingSpinner />}>
                  <ProjectDetail />
                </Suspense>
              </ErrorBoundary>
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/projects/:id/edit" 
        element={
          <ProtectedRoute>
            <Layout>
              <ErrorBoundary>
                <Suspense fallback={<LoadingSpinner />}>
                  <EditProject />
                </Suspense>
              </ErrorBoundary>
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/quotations" 
        element={
          <ProtectedRoute>
            <Layout>
              <ErrorBoundary>
                <Suspense fallback={<LoadingSpinner />}>
                  <Quotations />
                </Suspense>
              </ErrorBoundary>
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/invoices" 
        element={
          <ProtectedRoute>
            <Layout>
              <ErrorBoundary>
                <Suspense fallback={<LoadingSpinner />}>
                  <Invoices />
                </Suspense>
              </ErrorBoundary>
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/financial-activities" 
        element={
          <ProtectedRoute>
            <Layout>
              <ErrorBoundary>
                <Suspense fallback={<LoadingSpinner />}>
                  <FinancialActivities />
                </Suspense>
              </ErrorBoundary>
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/users" 
        element={
          <ProtectedRoute requiredRole="admin">
            <Layout>
              <ErrorBoundary>
                <Suspense fallback={<LoadingSpinner />}>
                  <Users />
                </Suspense>
              </ErrorBoundary>
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute requiredRole="admin">
            <Layout>
              <ErrorBoundary>
                <Suspense fallback={<LoadingSpinner />}>
                  <AdminDashboard />
                </Suspense>
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
              <ErrorBoundary>
                <Suspense fallback={<LoadingSpinner />}>
                  <Settings />
                </Suspense>
              </ErrorBoundary>
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/reports" 
        element={
          <ProtectedRoute>
            <Layout>
              <ErrorBoundary>
                <div className="p-6">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Reports</h1>
                  <p className="text-gray-600 dark:text-gray-400">Reports functionality coming soon...</p>
                </div>
              </ErrorBoundary>
            </Layout>
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppRoutes />
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
