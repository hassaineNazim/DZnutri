import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { authAPI } from './api/auth';
import AdditiveReports from './components/AdditiveReports';
import AutoReports from './components/AutoReports';
import Dashboard from './components/Dashboard';
import Layout from './components/Layout';
import Login from './components/Login';
import UserReports from './components/UserReports';
import './index.css';

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
            <Route path="/monitoring" element={<div className="p-6"><h2>Monitoring</h2><p className="text-gray-500 mt-2">Cette fonctionnalité est en cours de développement.</p></div>} />
          </Route>

          {/* Catch-all */}
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;