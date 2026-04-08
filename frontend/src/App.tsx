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
const CreateWorkOrderPage = React.lazy(() => import('./pages/CreateWorkOrderPage'));
const CreatePMSchedulePage = React.lazy(() => import('./pages/CreatePMSchedulePage'));
const WorkOrdersPage = React.lazy(() => import('./pages/WorkOrdersPage'));
const WorkOrderDetailPage = React.lazy(() => import('./pages/WorkOrderDetailPage'));
const AssetsPage = React.lazy(() => import('./pages/AssetsPage'));
const InventoryPage = React.lazy(() => import('./pages/InventoryPage'));
const PMSchedulesPage = React.lazy(() => import('./pages/PMSchedulesPage'));
const PMScheduleDetailPage = React.lazy(() => import('./pages/PMScheduleDetailPage'));
const AnalyticsPage = React.lazy(() => import('./pages/AnalyticsPage'));
const TechnicianAnalyticsPage = React.lazy(() => import('./pages/TechnicianAnalyticsPage'));
const OrganizationsPage = React.lazy(() => import('./pages/OrganizationsPage'));
const OrganizationDetailPage = React.lazy(() => import('./pages/OrganizationDetailPage'));
const CreateAssetPage = React.lazy(() => import('./pages/CreateAssetPage'));
const AssetDetailPage = React.lazy(() => import('./pages/AssetDetailPage'));
const InventoryDetailPage = React.lazy(() => import('./pages/InventoryDetailPage'));
const InventoryCreatePage = React.lazy(() => import('./pages/InventoryCreatePage'));
const UsersPage = React.lazy(() => import('./pages/UsersPage'));
const CreateUserPage = React.lazy(() => import('./pages/CreateUserPage'));
const UserDetailPage = React.lazy(() => import('./pages/UserDetailPage'));
const SitesList = React.lazy(() => import('./pages/Sites/SitesList'));
const SiteDetails = React.lazy(() => import('./pages/Sites/SiteDetails'));

const RolesPage = React.lazy(() => import('./pages/RolesPage'));
const GroupsPage = React.lazy(() => import('./pages/GroupsPage'));
const AccessesPage = React.lazy(() => import('./pages/AccessesPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));

const ChecklistsPage = React.lazy(() => import('./pages/ChecklistsPage'));
const CreateChecklistPage = React.lazy(() => import('./pages/CreateChecklistPage'));
const ChecklistDetailPage = React.lazy(() => import('./pages/ChecklistDetailPage'));
const AreaDetailsPage = React.lazy(() => import('./pages/AreaDetailsPage'));
const AreaTasksPage = React.lazy(() => import('./pages/AreaTasksPage'));
const AreaTaskExecutionPage = React.lazy(() => import('./pages/AreaTaskExecutionPage'));

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

const HideFromTechnicianRoute = ({ children }) => {
  const { hasRole } = useAuth();
  if (hasRole(['technician'])) {
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

const AdminRoute = ({ children }) => {
  const { isAdmin } = useAuth();
  if (!isAdmin()) {
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
          <Route path="work-orders/new" element={<HideFromTechnicianRoute><CreateWorkOrderPage /></HideFromTechnicianRoute>} />
          <Route path="work-orders/:id" element={<HideFromRequesterRoute><WorkOrderDetailPage /></HideFromRequesterRoute>} />
          <Route path="assets" element={<HideFromRequesterRoute><AssetsPage /></HideFromRequesterRoute>} />
          <Route path="assets/new" element={<ManagerRoute><CreateAssetPage /></ManagerRoute>} />
          <Route path="assets/:id" element={<ManagerRoute><AssetDetailPage /></ManagerRoute>} />
          <Route path="inventory" element={<HideFromRequesterRoute><InventoryPage /></HideFromRequesterRoute>} />
          <Route path="inventory/create" element={<ManagerRoute><InventoryCreatePage /></ManagerRoute>} />
          <Route path="inventory/:id" element={<ManagerRoute><InventoryDetailPage /></ManagerRoute>} />
          <Route path="pm-schedules" element={<ManagerRoute><PMSchedulesPage /></ManagerRoute>} />
          <Route path="pm-schedules/new" element={<ManagerRoute><CreatePMSchedulePage /></ManagerRoute>} />
          <Route path="pm-schedules/:id" element={<ManagerRoute><PMScheduleDetailPage /></ManagerRoute>} />
          <Route path="analytics" element={<HideFromRequesterRoute><RoleBasedAnalytics /></HideFromRequesterRoute>} />
          <Route path="organizations" element={<SuperAdminRoute><OrganizationsPage /></SuperAdminRoute>} />
          <Route path="organizations/:id" element={<SuperAdminRoute><OrganizationDetailPage /></SuperAdminRoute>} />
          <Route path="sites" element={<AdminRoute><SitesList /></AdminRoute>} />
          <Route path="sites/:id" element={<AdminRoute><SiteDetails /></AdminRoute>} />
          <Route path="users" element={<AdminRoute><UsersPage /></AdminRoute>} />
          <Route path="users/new" element={<AdminRoute><CreateUserPage /></AdminRoute>} />
          <Route path="users/:id" element={<AdminRoute><UserDetailPage /></AdminRoute>} />

          <Route path="checklists" element={<ManagerRoute><ChecklistsPage /></ManagerRoute>} />
          <Route path="checklists/new" element={<ManagerRoute><CreateChecklistPage /></ManagerRoute>} />
          <Route path="checklists/:id" element={<ManagerRoute><ChecklistDetailPage /></ManagerRoute>} />
          <Route path="areas/:id" element={<ManagerRoute><AreaDetailsPage /></ManagerRoute>} />
          
          <Route path="area-tasks" element={<ProtectedRoute><AreaTasksPage /></ProtectedRoute>} />
          <Route path="area-tasks/:id" element={<ProtectedRoute><AreaTaskExecutionPage /></ProtectedRoute>} />

          <Route path="roles" element={<AdminRoute><RolesPage /></AdminRoute>} />
          <Route path="groups" element={<AdminRoute><GroupsPage /></AdminRoute>} />
          <Route path="accesses" element={<SuperAdminRoute><AccessesPage /></SuperAdminRoute>} />
          <Route path="profile" element={<ProfilePage />} />

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
