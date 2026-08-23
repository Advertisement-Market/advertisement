import axios from 'axios';
import { authStorage } from './authStorage';

/** Backend base URL (override with VITE_API_URL). */
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach the bearer access token to every request.
api.interceptors.request.use((config) => {
  const token = authStorage.getAccessToken();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On a 401 for a protected call, try a one-time token refresh, then replay the request.
let refreshInFlight = null;
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const refreshToken = authStorage.getRefreshToken();
    const isAuthCall = original?.url?.includes('/api/auth/');

    if (status === 401 && refreshToken && !original?._retry && !isAuthCall) {
      original._retry = true;
      try {
        refreshInFlight =
          refreshInFlight ||
          axios.post(`${API_BASE_URL}/api/auth/refresh`, { refreshToken });
        const { data } = await refreshInFlight;
        refreshInFlight = null;
        authStorage.setSession(data);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (refreshError) {
        refreshInFlight = null;
        authStorage.clear();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

/** Turn an axios error into a user-facing message using the backend's ApiError body. */
export function apiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const data = error?.response?.data;
  if (data?.message) return data.message;
  if (data?.fieldErrors) {
    const first = Object.values(data.fieldErrors)[0];
    if (first) return first;
  }
  if (error?.code === 'ERR_NETWORK' || error?.message === 'Network Error') {
    return 'Cannot reach the server. Make sure the backend is running.';
  }
  return fallback;
}
