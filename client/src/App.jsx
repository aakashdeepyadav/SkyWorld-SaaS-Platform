import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import RoleRoute from './components/common/RoleRoute';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import GoogleCallback from './pages/auth/GoogleCallback';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Dashboard pages
import AdminDashboard from './pages/admin/Dashboard';
import DeveloperDashboard from './pages/developer/Dashboard';
import ClientDashboard from './pages/client/Dashboard';

// Request pages
import RequestList from './pages/requests/RequestList';
import NewRequest from './pages/requests/NewRequest';
import RequestDetail from './pages/requests/RequestDetail';
import CustomRequestList from './pages/requests/CustomRequestList';
import CustomRequestForm from './pages/requests/CustomRequestForm';
import CustomRequestThankYou from './pages/requests/CustomRequestThankYou';

// Project pages
import ProjectList from './pages/projects/ProjectList';
import ProjectDetail from './pages/projects/ProjectDetail';

// Service pages
import ServiceDetail from './pages/services/ServiceDetail';

// Admin pages
import UserManagement from './pages/admin/UserManagement';
import ServiceManagement from './pages/admin/ServiceManagement';

// Payment pages
import PaymentList from './pages/payments/PaymentList';
import Checkout from './pages/checkout/Checkout';

// Common pages
import NotFound from './pages/NotFound';
import Home from './pages/Home';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
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
      {/* Root — public landing page or dashboard */}
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Home />} />

      {/* Public routes */}
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
      <Route path="/auth/google/callback" element={<GoogleCallback />} />
      <Route path="/forgot-password" element={user ? <Navigate to="/dashboard" /> : <ForgotPassword />} />
      <Route path="/reset-password" element={user ? <Navigate to="/dashboard" /> : <ResetPassword />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/services/:slug" element={<ServiceDetail />} />

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

        {/* Service Requests */}
        <Route path="/requests" element={<RequestList />} />
        <Route
          path="/requests/new"
          element={<RoleRoute allowedRoles={['client', 'admin']}><NewRequest /></RoleRoute>}
        />
        <Route path="/requests/:id" element={<RequestDetail />} />
        <Route path="/custom-requests" element={<CustomRequestList />} />

        {/* Projects */}
        <Route path="/projects" element={<ProjectList />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />

        {/* Payments */}
        <Route path="/payments" element={<PaymentList />} />
        <Route path="/checkout" element={<Checkout />} />

        {/* Admin Only */}
        <Route
          path="/admin/users"
          element={<RoleRoute allowedRoles={['admin']}><UserManagement /></RoleRoute>}
        />
        <Route
          path="/admin/services"
          element={<RoleRoute allowedRoles={['admin']}><ServiceManagement /></RoleRoute>}
        />

        {/* Profile & Settings */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/custom-request" element={<CustomRequestForm />} />
        <Route path="/custom-request/thanks" element={<CustomRequestThankYou />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
