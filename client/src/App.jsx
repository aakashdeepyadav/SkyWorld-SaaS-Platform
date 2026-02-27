import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import RoleRoute from './components/common/RoleRoute';
import Layout from './components/layout/Layout';

/* ── Suspense fallback ── */
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
  </div>
);

/* ── Lazy-loaded pages ──────────────────────────────────────────────────────
   Each page is code-split into its own chunk. The browser only downloads
   a chunk when the user navigates to that route.
   ────────────────────────────────────────────────────────────────────────── */

// Public
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const GoogleCallback = lazy(() => import('./pages/auth/GoogleCallback'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const FAQ = lazy(() => import('./pages/FAQ'));
const ServiceDetail = lazy(() => import('./pages/services/ServiceDetail'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Dashboards
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const DeveloperDashboard = lazy(() => import('./pages/developer/Dashboard'));
const ClientDashboard = lazy(() => import('./pages/client/Dashboard'));

// Requests
const RequestList = lazy(() => import('./pages/requests/RequestList'));
const NewRequest = lazy(() => import('./pages/requests/NewRequest'));
const RequestDetail = lazy(() => import('./pages/requests/RequestDetail'));
const CustomRequestList = lazy(() => import('./pages/requests/CustomRequestList'));
const CustomRequestForm = lazy(() => import('./pages/requests/CustomRequestForm'));
const CustomRequestThankYou = lazy(() => import('./pages/requests/CustomRequestThankYou'));

// Projects
const ProjectList = lazy(() => import('./pages/projects/ProjectList'));
const ProjectDetail = lazy(() => import('./pages/projects/ProjectDetail'));

// Admin
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const ServiceManagement = lazy(() => import('./pages/admin/ServiceManagement'));

// Payments
const PaymentList = lazy(() => import('./pages/payments/PaymentList'));
const Checkout = lazy(() => import('./pages/checkout/Checkout'));

// Profile
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));

/* ═════════════════════════════════════════════════════════════════════════ */

function App() {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader />;

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Root */}
        <Route path="/" element={<Home />} />
        <Route path="/website" element={<Home />} />

        {/* Public routes */}
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />
        <Route path="/forgot-password" element={user ? <Navigate to="/dashboard" /> : <ForgotPassword />} />
        <Route path="/reset-password" element={user ? <Navigate to="/dashboard" /> : <ResetPassword />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/services/:slug" element={<ServiceDetail />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Navigate to={`/dashboard/${user?.role || 'client'}`} />} />

          <Route path="/dashboard/admin" element={<RoleRoute allowedRoles={['admin']}><AdminDashboard /></RoleRoute>} />
          <Route path="/dashboard/developer" element={<RoleRoute allowedRoles={['developer']}><DeveloperDashboard /></RoleRoute>} />
          <Route path="/dashboard/client" element={<RoleRoute allowedRoles={['client']}><ClientDashboard /></RoleRoute>} />

          {/* Service Requests */}
          <Route path="/requests" element={<RequestList />} />
          <Route path="/requests/new" element={<RoleRoute allowedRoles={['client', 'admin']}><NewRequest /></RoleRoute>} />
          <Route path="/requests/:id" element={<RequestDetail />} />
          <Route path="/custom-requests" element={<RoleRoute allowedRoles={['client', 'admin']}><CustomRequestList /></RoleRoute>} />

          {/* Projects */}
          <Route path="/projects" element={<ProjectList />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />

          {/* Payments */}
          <Route path="/payments" element={<RoleRoute allowedRoles={['client', 'admin']}><PaymentList /></RoleRoute>} />
          <Route path="/checkout" element={<RoleRoute allowedRoles={['client', 'admin']}><Checkout /></RoleRoute>} />

          {/* Admin Only */}
          <Route path="/admin/users" element={<RoleRoute allowedRoles={['admin']}><UserManagement /></RoleRoute>} />
          <Route path="/admin/services" element={<RoleRoute allowedRoles={['admin']}><ServiceManagement /></RoleRoute>} />

          {/* Profile & Settings */}
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/custom-request" element={<RoleRoute allowedRoles={['client', 'admin']}><CustomRequestForm /></RoleRoute>} />
          <Route path="/custom-request/thanks" element={<RoleRoute allowedRoles={['client', 'admin']}><CustomRequestThankYou /></RoleRoute>} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default App;
