import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import DashboardLayout from './components/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Reviews from './pages/Reviews';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';

import BuyerDashboard from './pages/buyer/BuyerDashboard';
import PostDemand from './pages/buyer/PostDemand';
import MyDemands from './pages/buyer/MyDemands';
import DemandDetail from './pages/buyer/DemandDetail';
import BuyerCommitments from './pages/buyer/BuyerCommitments';
import BuyerMessages from './pages/buyer/BuyerMessages';

import FarmerDashboard from './pages/farmer/FarmerDashboard';
import BrowseDemands from './pages/farmer/BrowseDemands';
import FarmerDemandDetail from './pages/farmer/FarmerDemandDetail';
import MyCommitments from './pages/farmer/MyCommitments';
import FarmRecords from './pages/farmer/FarmRecords';
import SmsInbox from './pages/farmer/SmsInbox';
import UssdSimulator from './pages/farmer/UssdSimulator';
import FarmerMessages from './pages/farmer/FarmerMessages';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AuditLogs from './pages/admin/AuditLogs';

function AppShell() {
  const { user, loading } = useAuth();
  if (loading) return null;

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />

      <Route path="*" element={
        !user ? <Navigate to="/login" replace /> : (
          <DashboardLayout>
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
          </DashboardLayout>
        )
      } />
    </Routes>
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
