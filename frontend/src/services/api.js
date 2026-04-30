import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE } from '../constants/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      // SecureStore not available (web)
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

// ─── AUTH ─────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  adminLogin: (data) => api.post('/auth/admin-login', data),
  getMe: () => api.get('/auth/me'),
};

// ─── EVENTS ──────────────────────────────
export const eventAPI = {
  getAll: (params) => api.get('/events', { params }),
  getOne: (id) => api.get(`/events/${id}`),
  getSeats: (id) => api.get(`/events/${id}/seats`),
  create: (data) => api.post('/events', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, data) => api.put(`/events/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id) => api.delete(`/events/${id}`),
};

// ─── PAYMENTS (PayHere) ──────────────────
export const paymentAPI = {
  initiate: (data) => api.post('/payments/initiate', data),
  confirm: (bookingId) => api.put(`/payments/confirm/${bookingId}`),
};

// ─── BOOKINGS ────────────────────────────
export const bookingAPI = {
  create: (data) => api.post('/bookings', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getMy: () => api.get('/bookings/my'),
  getAll: () => api.get('/bookings'),
  getOne: (id) => api.get(`/bookings/${id}`),
  cancel: (id) => api.put(`/bookings/${id}/cancel`),
  reviewPayment: (id, data) => api.put(`/bookings/${id}/review-payment`, data),
  scanQR: (bookingId) => api.get(`/bookings/scan/${bookingId}`),
};

// ─── REVIEWS ─────────────────────────────
export const reviewAPI = {
  create: (data) => api.post('/reviews', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getEventReviews: (eventId) => api.get(`/reviews/event/${eventId}`),
  getMy: () => api.get('/reviews/my'),
  update: (id, data) => api.put(`/reviews/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id) => api.delete(`/reviews/${id}`),
  getAll: () => api.get('/reviews'),
  toggle: (id) => api.put(`/reviews/${id}/toggle`),
};

// ─── COMPLAINTS ──────────────────────────
export const complaintAPI = {
  create: (data) => api.post('/complaints', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getMy: () => api.get('/complaints/my'),
  getAll: (params) => api.get('/complaints', { params }),
  getOne: (id) => api.get(`/complaints/${id}`),
  update: (id, data) => api.put(`/complaints/${id}`, data),
  delete: (id) => api.delete(`/complaints/${id}`),
};

// ─── PROMO CODES ─────────────────────────
export const promoAPI = {
  getActive: () => api.get('/promo-codes/active'),
  validate: (data) => api.post('/promo-codes/validate', data),
  getAll: () => api.get('/promo-codes'),
  getOne: (id) => api.get(`/promo-codes/${id}`),
  create: (data) => api.post('/promo-codes', data),
  update: (id, data) => api.put(`/promo-codes/${id}`, data),
  delete: (id) => api.delete(`/promo-codes/${id}`),
};

// ─── USERS (ADMIN) ───────────────────────
export const userAPI = {
  getAll: () => api.get('/users'),
  getOne: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  updateProfile: (data) => api.put('/users/profile', data),
  updateProfileImage: (data) => api.put('/users/profile/image', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// ─── WISHLIST ────────────────────────────
export const wishlistAPI = {
  get: () => api.get('/wishlist'),
  toggle: (eventId) => api.post(`/wishlist/toggle/${eventId}`),
};

// ─── DASHBOARD ───────────────────────────
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};
// ─── VENUES ──────────────────────────────────
export const venueAPI = {
  getAll: (params) => api.get('/venues', { params }),
  getOne: (id) => api.get(`/venues/${id}`),
  getVenueEvents: (id) => api.get(`/venues/${id}/events`),
  create: (data) => api.post('/venues', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, data) => api.put(`/venues/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id) => api.delete(`/venues/${id}`),
};
export default api;
