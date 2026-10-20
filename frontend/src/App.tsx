import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import Spinner from './components/Spinner';
import { pages, prefetchAuthPages } from './lib/prefetch';

import Home from './pages/Home';

// Every other screen is its own chunk, so the landing page doesn't download the dashboards
const Login = lazy(pages.login);
const Register = lazy(pages.register);
const Profile = lazy(pages.profile);
const Reviews = lazy(pages.reviews);
const Terms = lazy(pages.terms);
const Privacy = lazy(pages.privacy);

const DashboardLayout = lazy(pages.dashboardLayout);

const BuyerDashboard = lazy(pages.buyerDashboard);
const PostDemand = lazy(pages.postDemand);
const MyDemands = lazy(pages.myDemands);
const DemandDetail = lazy(pages.demandDetail);
const BuyerCommitments = lazy(pages.buyerCommitments);
const BuyerMessages = lazy(pages.messages);

const FarmerDashboard = lazy(pages.farmerDashboard);
const BrowseDemands = lazy(pages.browseDemands);
const FarmerDemandDetail = lazy(pages.farmerDemandDetail);
const MyCommitments = lazy(pages.myCommitments);
const FarmRecords = lazy(pages.farmRecords);
const SmsInbox = lazy(pages.smsInbox);
const UssdSimulator = lazy(pages.ussdSimulator);
const FarmerMessages = lazy(pages.messages);

const AdminDashboard = lazy(pages.adminDashboard);
const AdminUsers = lazy(pages.adminUsers);
const AuditLogs = lazy(pages.auditLogs);

const PUBLIC_PATHS = ['/', '/login', '/register', '/terms', '/privacy'];

function AppSplash() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50" role="status" aria-label="Loading">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-forest-700" />
    </div>
  );
}

function PublicFallback() {
  const { pathname } = useLocation();
  return <div className={`min-h-screen ${pathname === '/' ? 'bg-forest-950' : 'bg-cream-100'}`} />;
}

function AppShell() {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();

  useEffect(() => { if (!user) prefetchAuthPages(); }, [user]);

  // Public pages don't depend on the session, so they render straight away;
  // only the signed-in area waits for /auth/me.
  if (loading && !PUBLIC_PATHS.includes(pathname)) return <AppSplash />;

  return (
    <Suspense fallback={<PublicFallback />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />

        <Route path="*" element={
          !user ? <Navigate to="/login" replace /> : (
            <Suspense fallback={<AppSplash />}>
              <DashboardLayout>
                <Suspense fallback={<Spinner />}>
                  <Routes>
                    <Route path="/profile" element={<Profile />} />

                    <Route path="/buyer" element={<ProtectedRoute role="buyer"><BuyerDashboard /></ProtectedRoute>} />
                    <Route path="/buyer/demands" element={<ProtectedRoute role="buyer"><MyDemands /></ProtectedRoute>} />
                    <Route path="/buyer/demands/new" element={<ProtectedRoute role="buyer"><PostDemand /></ProtectedRoute>} />
                    <Route path="/buyer/demands/:id" element={<ProtectedRoute role="buyer"><DemandDetail /></ProtectedRoute>} />
                    <Route path="/buyer/commitments" element={<ProtectedRoute role="buyer"><BuyerCommitments /></ProtectedRoute>} />
                    <Route path="/buyer/messages" element={<ProtectedRoute role="buyer"><BuyerMessages /></ProtectedRoute>} />
                    <Route path="/buyer/reviews" element={<ProtectedRoute role="buyer"><Reviews /></ProtectedRoute>} />

                    <Route path="/farmer" element={<ProtectedRoute role="farmer"><FarmerDashboard /></ProtectedRoute>} />
                    <Route path="/farmer/demands" element={<ProtectedRoute role="farmer"><BrowseDemands /></ProtectedRoute>} />
                    <Route path="/farmer/demands/:id" element={<ProtectedRoute role="farmer"><FarmerDemandDetail /></ProtectedRoute>} />
                    <Route path="/farmer/commitments" element={<ProtectedRoute role="farmer"><MyCommitments /></ProtectedRoute>} />
                    <Route path="/farmer/records" element={<ProtectedRoute role="farmer"><FarmRecords /></ProtectedRoute>} />
                    <Route path="/farmer/sms" element={<ProtectedRoute role="farmer"><SmsInbox /></ProtectedRoute>} />
                    <Route path="/farmer/ussd" element={<ProtectedRoute role="farmer"><UssdSimulator /></ProtectedRoute>} />
                    <Route path="/farmer/messages" element={<ProtectedRoute role="farmer"><FarmerMessages /></ProtectedRoute>} />
                    <Route path="/farmer/reviews" element={<ProtectedRoute role="farmer"><Reviews /></ProtectedRoute>} />

                    <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
                    <Route path="/admin/users" element={<ProtectedRoute role="admin"><AdminUsers /></ProtectedRoute>} />
                    <Route path="/admin/audit" element={<ProtectedRoute role="admin"><AuditLogs /></ProtectedRoute>} />

                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </DashboardLayout>
            </Suspense>
          )
        } />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppShell />
      </NotificationProvider>
    </AuthProvider>
  );
}
