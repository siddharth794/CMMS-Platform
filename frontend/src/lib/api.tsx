import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
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

// Users
export const usersApi = {
  list: (params) => api.get('/users', { params }),
  get: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  bulkDelete: (data) => api.post('/users/bulk-delete', data),
};

// Roles
export const rolesApi = {
  list: () => api.get('/roles'),
  create: (data) => api.post('/roles', data),
  update: (id, data) => api.put(`/roles/${id}`, data),
};

// Assets
export const assetsApi = {
  list: (params) => api.get('/assets', { params }),
  get: (id) => api.get(`/assets/${id}`),
  create: (data) => api.post('/assets', data),
  bulkCreate: (data) => api.post('/assets/bulk', data),
  update: (id, data) => api.put(`/assets/${id}`, data),
  delete: (id) => api.delete(`/assets/${id}`),
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
  update: (id, data) => api.put(`/inventory/${id}`, data),
  delete: (id) => api.delete(`/inventory/${id}`),
  bulkDelete: (data) => api.post('/inventory/bulk-delete', data),
  getStats: () => api.get('/inventory/stats'),
  getCategories: () => api.get('/inventory/categories'),
};

// Seed Demo Data
export const seedDemoData = () => api.post('/seed-demo-data');

export default api;
