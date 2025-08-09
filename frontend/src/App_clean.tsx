import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientProfile from './pages/ClientProfile';
import Services from './pages/Services';
import Quotations from './pages/Quotations';
import Invoices from './pages/Invoices';
import Users from './pages/Users';
import AdminDashboard from './pages/AdminDashboard';
import FinancialActivities from './pages/FinancialActivities';

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
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} 
      />
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
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
                <Clients />
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
                <ClientProfile />
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
                <Services />
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
                <Quotations />
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
                <Invoices />
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
                <FinancialActivities />
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
                <Users />
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
                <AdminDashboard />
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
