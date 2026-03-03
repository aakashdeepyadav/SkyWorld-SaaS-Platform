import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import RoleRoute from './components/common/RoleRoute';
import Layout from './components/layout/Layout';

/* ── Suspense fallback ── */
const PageLoader = () => (
  <div
    style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0f172a',
      fontFamily: "'Inter',system-ui,-apple-system,sans-serif",
    }}
  >
    <div style={{ position: 'relative', width: 32, height: 32 }}>
      <img
        src="/icon_logo_coloured.png"
        alt=""
        width={32}
        height={32}
        style={{ position: 'relative', zIndex: 1, animation: '_plPulse 2s ease-in-out infinite' }}
      />
      <div
        style={{
          position: 'absolute',
          inset: -6,
          borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(14,165,233,.12) 0%,transparent 70%)',
          animation: '_plGlow 2s ease-in-out infinite',
        }}
      />
    </div>
    <style>{`
      @keyframes _plPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.06);opacity:.85}}
      @keyframes _plGlow{0%,100%{transform:scale(1);opacity:.5}50%{transform:scale(1.3);opacity:1}}
    `}</style>
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
const Contact = lazy(() => import('./pages/Contact'));
const ServiceDetail = lazy(() => import('./pages/services/ServiceDetail'));
const ComboDetail = lazy(() => import('./pages/services/ComboDetail'));
const AddOns = lazy(() => import('./pages/services/AddOns'));
const MonthlyPlans = lazy(() => import('./pages/services/MonthlyPlans'));
const MonthlyPlanDetail = lazy(() => import('./pages/services/MonthlyPlanDetail'));
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
    <Routes>
      {/* Root */}
      <Route
        path="/"
        element={
          <Suspense fallback={<PageLoader />}>
            <Home />
          </Suspense>
        }
      />
      <Route
        path="/website"
        element={
          <Suspense fallback={<PageLoader />}>
            <Home />
          </Suspense>
        }
      />

      {/* Public routes */}
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to="/dashboard" />
          ) : (
            <Suspense fallback={<PageLoader />}>
              <Login />
            </Suspense>
          )
        }
      />
      <Route
        path="/register"
        element={
          user ? (
            <Navigate to="/dashboard" />
          ) : (
            <Suspense fallback={<PageLoader />}>
              <Register />
            </Suspense>
          )
        }
      />
      <Route
        path="/auth/google/callback"
        element={
          <Suspense fallback={<PageLoader />}>
            <GoogleCallback />
          </Suspense>
        }
      />
      <Route
        path="/forgot-password"
        element={
          user ? (
            <Navigate to="/dashboard" />
          ) : (
            <Suspense fallback={<PageLoader />}>
              <ForgotPassword />
            </Suspense>
          )
        }
      />
      <Route
        path="/reset-password"
        element={
          user ? (
            <Navigate to="/dashboard" />
          ) : (
            <Suspense fallback={<PageLoader />}>
              <ResetPassword />
            </Suspense>
          )
        }
      />
      <Route
        path="/privacy"
        element={
          <Suspense fallback={<PageLoader />}>
            <PrivacyPolicy />
          </Suspense>
        }
      />
      <Route
        path="/terms"
        element={
          <Suspense fallback={<PageLoader />}>
            <TermsOfService />
          </Suspense>
        }
      />
      <Route
        path="/faq"
        element={
          <Suspense fallback={<PageLoader />}>
            <FAQ />
          </Suspense>
        }
      />
      <Route
        path="/contact"
        element={
          <Suspense fallback={<PageLoader />}>
            <Contact />
          </Suspense>
        }
      />
      <Route
        path="/services/:slug"
        element={
          <Suspense fallback={<PageLoader />}>
            <ServiceDetail />
          </Suspense>
        }
      />
      <Route
        path="/combos/:slug"
        element={
          <Suspense fallback={<PageLoader />}>
            <ComboDetail />
          </Suspense>
        }
      />
      <Route
        path="/addons"
        element={
          <Suspense fallback={<PageLoader />}>
            <AddOns />
          </Suspense>
        }
      />
      <Route
        path="/plans/monthly"
        element={
          <Suspense fallback={<PageLoader />}>
            <MonthlyPlans />
          </Suspense>
        }
      />
      <Route
        path="/plans/monthly/:slug"
        element={
          <Suspense fallback={<PageLoader />}>
            <MonthlyPlanDetail />
          </Suspense>
        }
      />

      {/* Protected routes — Suspense is handled INSIDE Layout around <Outlet> */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route
          path="/dashboard"
          element={<Navigate to={`/dashboard/${user?.role || 'client'}`} />}
        />

        <Route
          path="/dashboard/admin"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="/dashboard/developer"
          element={
            <RoleRoute allowedRoles={['developer']}>
              <DeveloperDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="/dashboard/client"
          element={
            <RoleRoute allowedRoles={['client']}>
              <ClientDashboard />
            </RoleRoute>
          }
        />

        {/* Service Requests */}
        <Route path="/requests" element={<RequestList />} />
        <Route
          path="/requests/new"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <NewRequest />
            </RoleRoute>
          }
        />
        <Route path="/requests/:id" element={<RequestDetail />} />
        <Route
          path="/custom-requests"
          element={
            <RoleRoute allowedRoles={['client', 'admin']}>
              <CustomRequestList />
            </RoleRoute>
          }
        />

        {/* Projects */}
        <Route path="/projects" element={<ProjectList />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />

        {/* Payments */}
        <Route
          path="/payments"
          element={
            <RoleRoute allowedRoles={['client', 'admin']}>
              <PaymentList />
            </RoleRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <RoleRoute allowedRoles={['client', 'admin']}>
              <Checkout />
            </RoleRoute>
          }
        />

        {/* Admin Only */}
        <Route
          path="/admin/users"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <UserManagement />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/services"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <ServiceManagement />
            </RoleRoute>
          }
        />

        {/* Profile & Settings */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route
          path="/custom-request"
          element={
            <RoleRoute allowedRoles={['client', 'admin']}>
              <CustomRequestForm />
            </RoleRoute>
          }
        />
        <Route
          path="/custom-request/thanks"
          element={
            <RoleRoute allowedRoles={['client', 'admin']}>
              <CustomRequestThankYou />
            </RoleRoute>
          }
        />
      </Route>

      {/* 404 */}
      <Route
        path="*"
        element={
          <Suspense fallback={<PageLoader />}>
            <NotFound />
          </Suspense>
        }
      />
    </Routes>
  );
}

export default App;
