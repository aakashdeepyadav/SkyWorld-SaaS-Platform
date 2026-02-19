import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import RoleRoute from './components/common/RoleRoute';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import GoogleCallback from './pages/auth/GoogleCallback';

// Dashboard pages
import AdminDashboard from './pages/admin/Dashboard';
import DeveloperDashboard from './pages/developer/Dashboard';
import ClientDashboard from './pages/client/Dashboard';

// Common pages
import NotFound from './pages/NotFound';
import Layout from './components/layout/Layout';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />

      {/* Public routes */}
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
      <Route path="/auth/google/callback" element={<GoogleCallback />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Navigate to={`/dashboard/${user?.role || 'client'}`} />} />

        <Route
          path="/dashboard/admin"
          element={<RoleRoute allowedRoles={['admin']}><AdminDashboard /></RoleRoute>}
        />
        <Route
          path="/dashboard/developer"
          element={<RoleRoute allowedRoles={['developer']}><DeveloperDashboard /></RoleRoute>}
        />
        <Route
          path="/dashboard/client"
          element={<RoleRoute allowedRoles={['client']}><ClientDashboard /></RoleRoute>}
        />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;

