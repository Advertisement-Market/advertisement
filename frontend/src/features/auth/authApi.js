import { api } from '@/lib/apiClient';

/** Thin wrappers over the backend auth + registration endpoints. Each resolves to the JSON body. */
export const authApi = {
  login: (email, password) => api.post('/api/auth/login', { email, password }).then((r) => r.data),
  google: (idToken) => api.post('/api/auth/google', { idToken }).then((r) => r.data),
  register: (payload) => api.post('/api/auth/register', payload).then((r) => r.data),
  registerAdvertiser: (dto) => api.post('/api/auth/register/advertiser', dto).then((r) => r.data),
  registerOwner: (dto) => api.post('/api/auth/register/owner', dto).then((r) => r.data),
  registerAgency: (dto) => api.post('/api/auth/register/agency', dto).then((r) => r.data),
  me: () => api.get('/api/auth/me').then((r) => r.data),
  logout: (refreshToken) => api.post('/api/auth/logout', { refreshToken }),
};
