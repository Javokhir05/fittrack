import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import WorkoutsPage from './pages/WorkoutsPage';
import ExercisesPage from './pages/ExercisesPage';
import ProgressPage from './pages/ProgressPage';
import AdminPage from './pages/AdminPage';
import LandingPage from './pages/LandingPage';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';

function ProtectedRoute({ children, adminOnly }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading…</div>;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'ADMIN') return <Navigate to="/dashboard" />;
  return children;
}

// Keyed by pathname so navigating away from a crashed page recovers automatically.
function RouteErrorBoundary({ children }) {
  const location = useLocation();
  return <ErrorBoundary key={location.pathname}>{children}</ErrorBoundary>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <RouteErrorBoundary>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="workouts" element={<WorkoutsPage />} />
              <Route path="exercises" element={<ExercisesPage />} />
              <Route path="progress" element={<ProgressPage />} />
              <Route path="admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
            </Route>
          </Routes>
        </RouteErrorBoundary>
      </BrowserRouter>
    </AuthProvider>
  );
}