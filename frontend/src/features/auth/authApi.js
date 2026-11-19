import { api } from '@/lib/apiClient';

/**
 * Thin wrappers over the backend auth, registration, and onboarding endpoints.
 *
 * All `/api/auth/*` endpoints skip 401 refresh BY DEFAULT in `apiClient.js`; only `me()`
 * explicitly opts in via `{ _allowRefresh: true }`. Protected endpoints outside `/api/auth/*`
 * (such as `/api/onboarding/owner`) refresh and replay automatically on 401.
 */
export const authApi = {
  login: (email, password) => api.post('/api/auth/login', { email, password }).then((r) => r.data),
  google: (idToken) => api.post('/api/auth/google', { idToken }).then((r) => r.data),
  register: (payload) => api.post('/api/auth/register', payload).then((r) => r.data),
  registerAdvertiser: (dto) => api.post('/api/auth/register/advertiser', dto).then((r) => r.data),
  registerOwner: (dto) => api.post('/api/auth/register/owner', dto).then((r) => r.data),
  onboardOwner: (dto) => api.post('/api/onboarding/owner', dto).then((r) => r.data),
  registerAgency: (dto) => api.post('/api/auth/register/agency', dto).then((r) => r.data),
  me: () => api.get('/api/auth/me', { _allowRefresh: true }).then((r) => r.data),
  logout: (refreshToken) => api.post('/api/auth/logout', refreshToken ? { refreshToken } : {}),
};
