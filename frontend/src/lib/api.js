import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
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
};

// Audit Logs
export const auditLogsApi = {
  list: (params) => api.get('/audit-logs', { params }),
};

// Seed Demo Data
export const seedDemoData = () => api.post('/seed-demo-data');

export default api;
