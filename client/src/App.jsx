import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { useAuth } from './context/AuthContext';
import { ModalProvider } from './context/ModalContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import RoleRoute from './components/common/RoleRoute';
import Layout from './components/layout/Layout';
import ScrollToTop from './components/common/ScrollToTop';
import { RouteSeoDefaults } from './components/seo/Seo';

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
      background: '#FFFFFF',
    }}
  >
    <svg width="40" height="82" viewBox="0 0 327 700" fill="none" style={{ overflow: 'visible' }}>
      <g className="_pl-s">
        <path
          d="M0 0 C0.36076355 2.97390747 0.36076355 2.97390747 0.34057617 6.83642578 C0.34101425 7.53897491 0.34145233 8.24152405 0.34190369 8.96536255 C0.33981021 11.29229326 0.31645395 13.61850736 0.29296875 15.9453125 C0.28737476 17.55670783 0.28310373 19.16810825 0.28010559 20.7795105 C0.26864126 25.0244145 0.23916068 29.26901142 0.20599365 33.51379395 C0.17532682 37.84378912 0.16160752 42.17383382 0.14648438 46.50390625 C0.11429227 55.00274521 0.06307704 63.50133443 0 72 C-3.8729023 70.51207106 -7.04144503 68.73855472 -10.5 66.4375 C-52.78261554 39.58013991 -113.41653941 33.52968028 -161.58056641 43.53613281 C-187.70025572 49.36736478 -211.03398575 61.11699659 -226.6875 83.625 C-236.38410168 99.92843876 -237.6488623 121.94695071 -233.375 140.125 C-226.1908708 167.81860725 -204.00152937 184.90941362 -180.58203125 198.92041016 C-164.28275022 208.46923594 -147.30796895 216.89733085 -130.38671875 225.28125 C-114.80497119 233.00375277 -99.42756852 240.87258245 -84.38818359 249.62451172 C-82.16520304 250.90485034 -79.92766064 252.15027584 -77.67578125 253.37890625 C-59.57368572 263.26367485 -42.43846047 274.92212102 -27.26171875 288.92578125 C-25.21675333 290.80121586 -23.12380525 292.59032533 -21 294.375 C1.19043578 313.90258349 19.57407413 344.09179957 22 374 C22.06413086 374.77972168 22.12826172 375.55944336 22.19433594 376.36279297 C25.13628114 414.76995793 17.89391784 451.60625453 -7.6015625 481.40673828 C-19.50026745 494.96311895 -33.07274843 504.79787536 -49 513 C-50.02915527 513.53004639 -50.02915527 513.53004639 -51.07910156 514.07080078 C-116.84225389 547.44521556 -203.69372568 543.04983212 -272.44335938 520.84375 C-283.71966564 517.1223105 -293.36946267 512.72413548 -304 507 C-304 481.92 -304 456.84 -304 431 C-300.10647154 433.33611708 -296.72029756 435.70740497 -293.125 438.4375 C-277.40500907 449.90334206 -259.34164839 457.77657774 -241 464 C-240.12504883 464.30244629 -239.25009766 464.60489258 -238.34863281 464.91650391 C-191.21628616 480.99019433 -133.40358941 487.16399967 -86.86279297 465.92431641 C-81.24832959 463.13842409 -76.09927306 459.62351445 -71 456 C-69.93652344 455.24589844 -69.93652344 455.24589844 -68.8515625 454.4765625 C-54.28111375 443.07073611 -47.54380255 423.87840327 -45.25 406.125 C-45.14395323 404.75156506 -45.06029079 403.37620292 -45 402 C-44.96003906 401.25105469 -44.92007812 400.50210937 -44.87890625 399.73046875 C-44.29923498 378.62361494 -51.49057338 360.88090388 -65 345 C-65.51949219 344.33484375 -66.03898438 343.6696875 -66.57421875 342.984375 C-86.62377158 318.13707024 -121.45916024 304.18338637 -149.16296387 289.94458008 C-158.79133159 284.99379867 -168.40533795 280.01579876 -178 275 C-179.15387207 274.39687988 -180.30774414 273.79375977 -181.49658203 273.17236328 C-228.10041413 248.72898453 -280.5471435 219.73429079 -297.75 166.25 C-307.75524254 132.70206372 -305.62604353 94.842988 -289.1015625 63.75390625 C-268.35851216 26.06974047 -232.40370369 3.09768544 -191.9375 -8.8125 C-139.42361268 -23.61342181 -47.96604228 -31.97736152 0 0 Z"
          fill="#37BBEC"
          transform="translate(304,19)"
        />
      </g>
      <g className="_pl-arc">
        <path
          d="M0 0 C1.05542999 0.00182281 2.11085999 0.00364563 3.19827271 0.00552368 C19.13349998 0.05180538 34.70717883 0.54960683 50.4375 3.3125 C51.4776123 3.48942383 52.51772461 3.66634766 53.58935547 3.84863281 C86.64904714 9.59943993 120.44091198 20.32098857 146.4375 42.3125 C147.25476563 42.96734375 148.07203125 43.6221875 148.9140625 44.296875 C155.20032392 49.52462505 159.75011776 55.66373087 164.4375 62.3125 C161.4375 63.3125 161.4375 63.3125 158.41015625 61.828125 C157.10492212 61.07611634 155.80171499 60.32058393 154.5 59.5625 C113.61112008 36.99025648 62.77298688 26.30385315 16.21875 26.109375 C15.09028152 26.10236069 13.96181305 26.09534637 12.79914856 26.08811951 C9.17855797 26.07071439 5.55813089 26.06426746 1.9375 26.0625 C0.70107758 26.06182526 -0.53534485 26.06115051 -1.80923462 26.06045532 C-19.61227092 26.07591499 -36.9622098 26.44668627 -54.5625 29.3125 C-55.68897949 29.48410645 -56.81545898 29.65571289 -57.97607422 29.83251953 C-92.61300836 35.16164497 -124.9678594 45.38253101 -156.21020508 61.24023438 C-158.33647712 62.20947016 -160.28120372 62.84021197 -162.5625 63.3125 C-149.01707347 36.22164693 -115.53420381 21.65665407 -88.15429688 12.5078125 C-77.57201163 9.10124418 -66.85722932 6.62358253 -55.9375 4.5625 C-54.89086182 4.36382324 -53.84422363 4.16514648 -52.76586914 3.96044922 C-35.19532545 0.81191571 -17.82428692 -0.06403851 0 0 Z"
          fill="#030304"
          transform="translate(162.5625,597.6875)"
        />
      </g>
    </svg>
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
const ClientOnboarding = lazy(() => import('./pages/onboarding/ClientOnboarding'));
const DeveloperOnboarding = lazy(() => import('./pages/onboarding/DeveloperOnboarding'));
const ServiceDetail = lazy(() => import('./pages/services/ServiceDetail'));
const PlanDetail = lazy(() => import('./pages/services/PlanDetail'));
const ComboDetail = lazy(() => import('./pages/services/ComboDetail'));
const AddOns = lazy(() => import('./pages/services/AddOns'));
const MonthlyPlans = lazy(() => import('./pages/services/MonthlyPlans'));
const MonthlyPlanDetail = lazy(() => import('./pages/services/MonthlyPlanDetail'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Meetings
const BookMeeting = lazy(() => import('./pages/meetings/BookMeeting'));

// Dashboards
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const DeveloperDashboard = lazy(() => import('./pages/developer/Dashboard'));
const ClientDashboard = lazy(() => import('./pages/client/Dashboard'));

// Requests
const RequestList = lazy(() => import('./pages/requests/RequestList'));
const NewRequest = lazy(() => import('./pages/requests/NewRequest'));
const RequestDetail = lazy(() => import('./pages/requests/RequestDetail'));
const CustomRequestList = lazy(() => import('./pages/requests/CustomRequestList'));
const RequestForm = lazy(() => import('./pages/requests/RequestForm'));
const CustomRequestThankYou = lazy(() => import('./pages/requests/CustomRequestThankYou'));

// Projects
const ProjectList = lazy(() => import('./pages/projects/ProjectList'));
const ProjectDetail = lazy(() => import('./pages/projects/ProjectDetail'));

// Admin
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const ServiceManagement = lazy(() => import('./pages/admin/ServiceManagement'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminMeetings = lazy(() => import('./pages/admin/AdminMeetings'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminDocuments = lazy(() => import('./pages/admin/AdminDocuments'));

// Payments
const PaymentList = lazy(() => import('./pages/payments/PaymentList'));
const Checkout = lazy(() => import('./pages/checkout/Checkout'));
const ComboCheckout = lazy(() => import('./pages/checkout/ComboCheckout'));
const MonthlyCheckout = lazy(() => import('./pages/checkout/MonthlyCheckout'));
const AddOnCheckout = lazy(() => import('./pages/checkout/AddOnCheckout'));

// Profile
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));

/* ═════════════════════════════════════════════════════════════════════════ */

function App() {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader />;

  return (
    <ModalProvider>
      <>
        <ScrollToTop />
        <RouteSeoDefaults />
        <Routes>
          {/* Root */}
          <Route
            path="/"
            element={
              <Suspense fallback={null}>
                <Home />
              </Suspense>
            }
          />
          <Route
            path="/website"
            element={
              <Suspense fallback={null}>
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
            path="/onboarding/client"
            element={
              <Suspense fallback={<PageLoader />}>
                <ClientOnboarding />
              </Suspense>
            }
          />
          <Route
            path="/onboarding/developer"
            element={
              <Suspense fallback={<PageLoader />}>
                <DeveloperOnboarding />
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
            path="/services/:slug/:planSlug"
            element={
              <Suspense fallback={<PageLoader />}>
                <PlanDetail />
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
          <Route
            path="/checkout/combo/:slug"
            element={
              <Suspense fallback={<PageLoader />}>
                <ComboCheckout />
              </Suspense>
            }
          />
          <Route
            path="/checkout/monthly/:slug"
            element={
              <Suspense fallback={<PageLoader />}>
                <MonthlyCheckout />
              </Suspense>
            }
          />
          <Route
            path="/checkout/addons"
            element={
              <Suspense fallback={<PageLoader />}>
                <AddOnCheckout />
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
            <Route
              path="/request"
              element={
                <RoleRoute allowedRoles={['client', 'admin']}>
                  <RequestForm />
                </RoleRoute>
              }
            />
            <Route
              path="/request/thanks"
              element={
                <RoleRoute allowedRoles={['client', 'admin']}>
                  <CustomRequestThankYou />
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
            <Route
              path="/admin/settings"
              element={
                <RoleRoute allowedRoles={['admin']}>
                  <AdminSettings />
                </RoleRoute>
              }
            />
            <Route
              path="/admin/meetings"
              element={
                <RoleRoute allowedRoles={['admin']}>
                  <AdminMeetings />
                </RoleRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <RoleRoute allowedRoles={['admin']}>
                  <AdminAnalytics />
                </RoleRoute>
              }
            />
            <Route
              path="/admin/documents"
              element={
                <RoleRoute allowedRoles={['admin']}>
                  <AdminDocuments />
                </RoleRoute>
              }
            />

            {/* Profile & Settings */}
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />

            {/* Support Pages — rendered within Layout with sidebar visible */}
            <Route path="/book-meeting" element={<BookMeeting />} />

            {/* Legacy routes redirect to new paths */}
            <Route path="/custom-request" element={<Navigate to="/request" replace />} />
            <Route
              path="/custom-request/thanks"
              element={<Navigate to="/request/thanks" replace />}
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
      </>
    </ModalProvider>
  );
}

export default App;
