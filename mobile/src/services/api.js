import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_API_URL } from './config';

const api = axios.create({ timeout: 15000 });
let onUnauthorized = () => {};

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

api.interceptors.request.use(async (config) => {
  const stored = await AsyncStorage.getItem('api_url');
  config.baseURL = (stored || DEFAULT_API_URL).replace(/\/$/, '');
  const token = await AsyncStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const url = original?.url || '';
    const isAuth = url.includes('/api/auth/login') || url.includes('/api/auth/refresh');
    if (error.response?.status === 401 && original && !original._retry && !isAuth) {
      original._retry = true;
      try {
        const storedBase = await AsyncStorage.getItem('api_url');
        const base = (storedBase || DEFAULT_API_URL).replace(/\/$/, '');
        const refresh = await AsyncStorage.getItem('refresh_token');
        if (!refresh) throw error;
        const refreshed = await axios.post(`${base}/api/auth/refresh`, { refresh }, { timeout: 15000 });
        await AsyncStorage.setItem('access_token', refreshed.data.access);
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${refreshed.data.access}`;
        return api(original);
      } catch (refreshError) {
        await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
        onUnauthorized();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

export function errorDetail(error, fallback) {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string' && detail.trim()) return detail;
  if (!error?.response) return 'Cannot reach the server. Check the API address, or the entry will wait on this phone.';
  return fallback;
}

export function unwrap(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

export const AuthApi = {
  login: (body) => api.post('/api/auth/login', body),
  me: () => api.get('/api/auth/me'),
};

export const ErpApi = {
  dashboard: () => api.get('/api/dashboard'),
  orders: () => api.get('/api/orders'),
  approvals: (params) => api.get('/api/approvals', { params }),
  approval: (id) => api.get(`/api/approvals/${id}`),
  decide: (id, body) => api.post(`/api/approvals/${id}/decide`, body),
  lines: () => api.get('/api/production/lines'),
  entries: (date) => api.get('/api/production/entries', { params: date ? { date } : {} }),
  createEntry: (body) => api.post('/api/production/entries', body),
  inspections: () => api.get('/api/qc/inspections'),
  createInspection: (body) => api.post('/api/qc/inspections', body),
  styles: () => api.get('/api/styles'),
  attendance: () => api.get('/api/hr/attendance'),
  clock: () => api.post('/api/hr/attendance/clock'),
  leaves: () => api.get('/api/hr/leaves'),
  createLeave: (body) => api.post('/api/hr/leaves', body),
  payslips: () => api.get('/api/hr/payslips'),
  notices: () => api.get('/api/hr/notices'),
  shipments: () => api.get('/api/shipments'),
  updateShipment: (id, status) => api.post(`/api/shipments/${id}/status`, { status }),
  items: () => api.get('/api/store/items'),
  movements: () => api.get('/api/store/movements'),
  createMovement: (body) => api.post('/api/store/movements', body),
  notifications: () => api.get('/api/notifications'),
  readNotification: (id) => api.post(`/api/notifications/${id}/read`),
  readAll: () => api.post('/api/notifications/read-all'),
  ask: (question) => api.post('/api/assistant', { question }),
};

export default api;
