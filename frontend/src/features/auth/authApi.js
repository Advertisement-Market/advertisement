import { api } from '@/lib/apiClient';

/**
 * Thin wrappers over the backend auth, registration, and onboarding endpoints.
 *
 * IMPORTANT: Any credential/challenge endpoint under `/api/auth/` (including future OTP or
 * password-reset endpoints) MUST pass `{ _skipRefresh: true }` so 401 responses never trigger
 * unnecessary token refreshes. Protected endpoints (`/api/auth/me`, `/api/onboarding/*`) omit
 * `_skipRefresh` so expired JWTs refresh and replay automatically.
 */
export const authApi = {
  login: (email, password) =>
    api.post('/api/auth/login', { email, password }, { _skipRefresh: true }).then((r) => r.data),
  google: (idToken) =>
    api.post('/api/auth/google', { idToken }, { _skipRefresh: true }).then((r) => r.data),
  register: (payload) =>
    api.post('/api/auth/register', payload, { _skipRefresh: true }).then((r) => r.data),
  registerAdvertiser: (dto) =>
    api.post('/api/auth/register/advertiser', dto, { _skipRefresh: true }).then((r) => r.data),
  registerOwner: (dto) =>
    api.post('/api/auth/register/owner', dto, { _skipRefresh: true }).then((r) => r.data),
  onboardOwner: (dto) => api.post('/api/onboarding/owner', dto).then((r) => r.data),
  registerAgency: (dto) =>
    api.post('/api/auth/register/agency', dto, { _skipRefresh: true }).then((r) => r.data),
  me: () => api.get('/api/auth/me').then((r) => r.data),
  logout: (refreshToken) =>
    api.post('/api/auth/logout', refreshToken ? { refreshToken } : {}, { _skipRefresh: true }),
};
