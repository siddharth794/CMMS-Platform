import axios from 'axios';

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Organizations
export const organizationsApi = {
  list: (params) => api.get('/organizations', { params }),
  get: (id) => api.get(`/organizations/${id}`),
  create: (data) => api.post('/organizations', data),
  update: (id, data) => api.put(`/organizations/${id}`, data),
  delete: (id, force = false) => api.delete(`/organizations/${id}`, { params: { force } }),
};

// Users
export const usersApi = {
  list: (params) => api.get('/users', { params }),
  get: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  restore: (id) => api.post(`/users/${id}/restore`),
  
  bulkDelete: (data) => api.post('/users/bulk-delete', data),
  updateRoles: (id, data) => api.put(`/users/${id}/roles`, data),
  updateProfile: (data) => api.put('/users/me', data),
  updatePassword: (data) => api.put('/users/me/password', data),
};


// Roles
// Assets

export const rolesApi = {
  list: () => api.get('/roles'),
  create: (data) => api.post('/roles', data),
  update: (id, data) => api.put(`/roles/${id}`, data),
  delete: (id) => api.delete(`/roles/${id}`),
  updateAccesses: (id, data) => api.put(`/roles/${id}/accesses`, data),
};

export const accessesApi = {
  list: () => api.get('/accesses'),
  create: (data) => api.post('/accesses', data),
  update: (id, data) => api.put(`/accesses/${id}`, data),
  delete: (id) => api.delete(`/accesses/${id}`),
};

export const groupsApi = {
  list: () => api.get('/groups'),
  create: (data) => api.post('/groups', data),
  update: (id, data) => api.put(`/groups/${id}`, data),
  delete: (id) => api.delete(`/groups/${id}`),
  updateMembers: (id, data) => api.put(`/groups/${id}/members`, data),
  updateRoles: (id, data) => api.put(`/groups/${id}/roles`, data),
};

export const assetsApi = {
  list: (params) => api.get('/assets', { params }),
  get: (id) => api.get(`/assets/${id}`),
  create: (data) => api.post('/assets', data),
  bulkCreate: (data) => api.post('/assets/bulk', data),
  update: (id, data) => api.put(`/assets/${id}`, data),
  delete: (id) => api.delete(`/assets/${id}`),
  restore: (id) => api.post(`/assets/${id}/restore`),
  bulkDelete: (data) => api.post('/assets/bulk-delete', data),
};

// Work Orders
export const workOrdersApi = {
  list: (params) => api.get('/work-orders', { params }),
  get: (id) => api.get(`/work-orders/${id}`),
  create: (data) => api.post('/work-orders', data),
  update: (id, data) => api.put(`/work-orders/${id}`, data),
  updateStatus: (id, data) => api.patch(`/work-orders/${id}/status`, data),
  assign: (id, data) => api.patch(`/work-orders/${id}/assign`, data),
  delete: (id) => api.delete(`/work-orders/${id}`),
  restore: (id) => api.post(`/work-orders/${id}/restore`),
  bulkDelete: (data) => api.post('/work-orders/bulk-delete', data),
  export: () => api.get('/work-orders/export', { responseType: 'blob' }),
  getComments: (id) => api.get(`/work-orders/${id}/comments`),
  addComment: (id, data) => api.post(`/work-orders/${id}/comments`, data),
  getUsedParts: (id) => api.get(`/work-orders/${id}/inventory`),
  addUsedPart: (id, data) => api.post(`/work-orders/${id}/inventory`, data),
  removeUsedPart: (id, usageId) => api.delete(`/work-orders/${id}/inventory/${usageId}`),
  uploadAttachments: (id, formData) => api.post(`/work-orders/${id}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

// PM Schedules
export const pmSchedulesApi = {
  list: (params) => api.get('/pm-schedules', { params }),
  get: (id) => api.get(`/pm-schedules/${id}`),
  create: (data) => api.post('/pm-schedules', data),
  update: (id, data) => api.put(`/pm-schedules/${id}`, data),
  delete: (id) => api.delete(`/pm-schedules/${id}`),
  restore: (id) => api.post(`/pm-schedules/${id}/restore`),
  bulkDelete: (data) => api.post('/pm-schedules/bulk-delete', data),
};

// Analytics
export const analyticsApi = {
  getDashboard: (params) => api.get('/analytics/dashboard', { params }),
  getTechnicianDashboard: (params) => api.get('/analytics/technician-dashboard', { params }),
};

// Audit Logs
export const auditLogsApi = {
  list: (params) => api.get('/audit-logs', { params }),
};

// Inventory
export const inventoryApi = {
  list: (params) => api.get('/inventory', { params }),
  get: (id) => api.get(`/inventory/${id}`),
  create: (data) => api.post('/inventory', data),
  bulkCreate: (data) => api.post('/inventory/bulk', data),
  update: (id, data) => api.put(`/inventory/${id}`, data),
  delete: (id) => api.delete(`/inventory/${id}`),
  restore: (id) => api.post(`/inventory/${id}/restore`),
  bulkDelete: (data) => api.post('/inventory/bulk-delete', data),
  getStats: () => api.get('/inventory/stats'),
  getCategories: () => api.get('/inventory/categories'),
};

// Sites
export const sitesApi = {
  list: (params: any) => api.get('/sites', { params }),
  get: (id: string) => api.get(`/sites/${id}`),
  create: (data: any) => api.post('/sites', data),
  update: (id: string, data: any) => api.put(`/sites/${id}`, data),
  delete: (id: string) => api.delete(`/sites/${id}`),
  bulkDelete: (data: any) => api.post('/sites/bulk-delete', data),
  assignManager: (id: string, managerId: string | null) => api.put(`/sites/${id}/manager`, { manager_id: managerId }),
  assignTechnician: (id: string, userId: string) => api.put(`/sites/${id}/technicians/${userId}`, {}),
  removeTechnician: (id: string, userId: string) => api.delete(`/sites/${id}/technicians/${userId}`),
};

// Seed Demo Data
export const seedDemoData = () => api.post('/seed-demo-data');

export default api;
