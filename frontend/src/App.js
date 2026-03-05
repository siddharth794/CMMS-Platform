import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { SocketProvider } from './context/SocketContext';
import { SocketEvents } from './context/SocketEvents';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TechnicianDashboardPage from './pages/TechnicianDashboardPage';
import RequesterDashboardPage from './pages/RequesterDashboardPage';
import WorkOrdersPage from './pages/WorkOrdersPage';
import WorkOrderDetailPage from './pages/WorkOrderDetailPage';
import AssetsPage from './pages/AssetsPage';
import InventoryPage from './pages/InventoryPage';
import PMSchedulesPage from './pages/PMSchedulesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import TechnicianAnalyticsPage from './pages/TechnicianAnalyticsPage';
import SettingsPage from './pages/SettingsPage';

const RoleBasedDashboard = () => {
  const { isTechnician, isRequester } = useAuth();
  if (isTechnician()) return <TechnicianDashboardPage />;
  if (isRequester()) return <RequesterDashboardPage />;
  return <DashboardPage />;
};

const RoleBasedAnalytics = () => {
  const { isTechnician } = useAuth();
  return isTechnician() ? <TechnicianAnalyticsPage /> : <AnalyticsPage />;
};

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const ManagerRoute = ({ children }) => {
  const { hasRole } = useAuth();
  if (hasRole(['technician', 'requestor', 'requester'])) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const HideFromRequesterRoute = ({ children }) => {
  const { hasRole } = useAuth();
  if (hasRole(['requestor', 'requester'])) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<RoleBasedDashboard />} />
        <Route path="work-orders" element={<HideFromRequesterRoute><WorkOrdersPage /></HideFromRequesterRoute>} />
        <Route path="work-orders/:id" element={<HideFromRequesterRoute><WorkOrderDetailPage /></HideFromRequesterRoute>} />
        <Route path="assets" element={<HideFromRequesterRoute><AssetsPage /></HideFromRequesterRoute>} />
        <Route path="inventory" element={<HideFromRequesterRoute><InventoryPage /></HideFromRequesterRoute>} />
        <Route path="pm-schedules" element={<ManagerRoute><PMSchedulesPage /></ManagerRoute>} />
        <Route path="analytics" element={<HideFromRequesterRoute><RoleBasedAnalytics /></HideFromRequesterRoute>} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
          <BrowserRouter>
            <SocketProvider>
              <SocketEvents />
              <AppRoutes />
              <Toaster
                position="top-right"
                richColors
                closeButton
                toastOptions={{
                  style: {
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    color: 'hsl(var(--foreground))',
                  },
                }}
              />
            </SocketProvider>
          </BrowserRouter>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
