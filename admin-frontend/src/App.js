import React, { Suspense } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { authAPI } from './api/auth';
import Layout from './components/Layout';
import './index.css';

// Lazy loading for components
const AdditiveReports = React.lazy(() => import('./components/AdditiveReports'));
const AutoReports = React.lazy(() => import('./components/AutoReports'));
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const Login = React.lazy(() => import('./components/Login'));
const Monitoring = React.lazy(() => import('./components/Monitoring'));
const UserReports = React.lazy(() => import('./components/UserReports'));

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = authAPI.isAuthenticated();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route Component (redirects to dashboard if already authenticated)
const PublicRoute = ({ children }) => {
  const isAuthenticated = authAPI.isAuthenticated();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Suspense fallback={<div className="flex h-screen items-center justify-center">Chargement...</div>}>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />

            {/* Protected Routes wrapped in Layout */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              {/* Main Dashboard (Soumissions) */}
              <Route path="/" element={<Dashboard />} />

              {/* Redirect legacy /dashboard to / */}
              <Route path="/dashboard" element={<Navigate to="/" replace />} />

              {/* Report Routes */}
              <Route path="/reports/auto" element={<AutoReports />} />
              <Route path="/reports/users" element={<UserReports />} />
              <Route path="/additives/pending" element={<AdditiveReports />} />
              <Route path="/monitoring" element={<Monitoring />} />
            </Route>

            {/* Catch-all */}
            <Route
              path="*"
              element={<Navigate to="/" replace />}
            />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;