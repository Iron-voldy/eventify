import axios from 'axios';
import { storage } from '../utils/storage';
import { API_BASE } from '../constants/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

// Request interceptor: attach token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await storage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.log('Error getting token:', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: extract data or normalize errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message || error.message || 'Something went wrong';
    return Promise.reject({ message, status: error.response?.status });
  }
);

// ─── AUTH MOCK ────────────────────────────
export const authAPI = {
  getMe: () => Promise.resolve({ data: { _id: 'test-user-id', fullName: 'Test User', role: 'admin' } }),
  login: () => Promise.resolve({ data: { _id: 'test-user-id', fullName: 'Test User', role: 'admin' }, token: 'mock-token' }),
};

// ─── REVIEWS ─────────────────────────────
export const reviewAPI = {
  create: (data) => api.post('/reviews', data),
  getEventReviews: (eventId) => api.get(`/reviews/event/${eventId}`),
  getMy: () => api.get('/reviews/my'),
  update: (id, data) => api.put(`/reviews/${id}`, data),
  delete: (id) => api.delete(`/reviews/${id}`),
  getAll: () => api.get('/reviews'),
  toggle: (id) => api.put(`/reviews/${id}/toggle`),
};

export default api;
