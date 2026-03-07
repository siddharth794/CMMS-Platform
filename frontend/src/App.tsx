import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { SocketProvider } from './context/SocketContext';
import { SocketEvents } from './context/SocketEvents';
import Layout from './components/Layout';

const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const TechnicianDashboardPage = React.lazy(() => import('./pages/TechnicianDashboardPage'));
const RequesterDashboardPage = React.lazy(() => import('./pages/RequesterDashboardPage'));
const WorkOrdersPage = React.lazy(() => import('./pages/WorkOrdersPage'));
const WorkOrderDetailPage = React.lazy(() => import('./pages/WorkOrderDetailPage'));
const AssetsPage = React.lazy(() => import('./pages/AssetsPage'));
const InventoryPage = React.lazy(() => import('./pages/InventoryPage'));
const PMSchedulesPage = React.lazy(() => import('./pages/PMSchedulesPage'));
const AnalyticsPage = React.lazy(() => import('./pages/AnalyticsPage'));
const TechnicianAnalyticsPage = React.lazy(() => import('./pages/TechnicianAnalyticsPage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));
const OrganizationsPage = React.lazy(() => import('./pages/OrganizationsPage'));
const OrganizationDetailPage = React.lazy(() => import('./pages/OrganizationDetailPage'));
const AssetDetailPage = React.lazy(() => import('./pages/AssetDetailPage'));
const InventoryDetailPage = React.lazy(() => import('./pages/InventoryDetailPage'));
const UsersPage = React.lazy(() => import('./pages/UsersPage'));
const UserDetailPage = React.lazy(() => import('./pages/UserDetailPage'));

const queryClient = new QueryClient();

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

const SuperAdminRoute = ({ children }) => {
  const { hasRole } = useAuth();
  if (!hasRole(['super_admin'])) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const SuspenseFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const AppRoutes = () => {
  return (
    <Suspense fallback={<SuspenseFallback />}>
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
          <Route path="assets/:id" element={<HideFromRequesterRoute><AssetDetailPage /></HideFromRequesterRoute>} />
          <Route path="inventory" element={<HideFromRequesterRoute><InventoryPage /></HideFromRequesterRoute>} />
          <Route path="inventory/:id" element={<HideFromRequesterRoute><InventoryDetailPage /></HideFromRequesterRoute>} />
          <Route path="pm-schedules" element={<ManagerRoute><PMSchedulesPage /></ManagerRoute>} />
          <Route path="analytics" element={<HideFromRequesterRoute><RoleBasedAnalytics /></HideFromRequesterRoute>} />
          <Route path="organizations" element={<SuperAdminRoute><OrganizationsPage /></SuperAdminRoute>} />
          <Route path="organizations/:id" element={<SuperAdminRoute><OrganizationDetailPage /></SuperAdminRoute>} />
          <Route path="users" element={<ManagerRoute><UsersPage /></ManagerRoute>} />
          <Route path="users/:id" element={<ManagerRoute><UserDetailPage /></ManagerRoute>} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  );
}

export default App;
