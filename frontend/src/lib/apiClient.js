import axios from 'axios';
import { authStorage } from './authStorage';
import { clearOwnerRegisterDraft } from '@/pages/OwnerRegister/ownerDraftStorage';

/** Backend base URL (override with VITE_API_URL; defaults to '' to use reverse proxies). */
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Credential/public auth paths that must NEVER trigger a 401 refresh-and-retry loop.
 *
 * IMPORTANT FOR FUTURE PRs:
 * Endpoints under `/api/auth/` are now refresh-eligible by default (e.g., `/api/auth/me` refreshes
 * seamlessly on 401). Any future unauthenticated or challenge endpoints added under `/api/auth/`
 * (such as OTP send/verify or password reset, where 401 means wrong code rather than expired JWT)
 * MUST pass `{ _skipRefresh: true }` in `authApi.js` and/or be added to this skip list.
 */
const CREDENTIAL_SKIP_REFRESH_PATHS = new Set([
  '/api/auth/login',
  '/api/auth/google',
  '/api/auth/register',
  '/api/auth/register/owner',
  '/api/auth/register/advertiser',
  '/api/auth/register/agency',
  '/api/auth/refresh',
  '/api/auth/logout',
]);

/** Normalizes a request URL (relative or absolute, with or without query string / trailing slash). */
export function normalizePathname(url = '', baseURL = API_BASE_URL) {
  if (!url) return '';
  try {
    const origin =
      typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : 'http://localhost';
    const base = baseURL ? new URL(baseURL, origin) : new URL(origin);
    const resolved = new URL(url, base);
    const stripped = resolved.pathname.replace(/\/+$/, '');
    return stripped || '/';
  } catch {
    return String(url).split('?')[0].replace(/\/+$/, '');
  }
}

function shouldSkipRefresh(config) {
  if (!config) return true;
  if (config._skipRefresh) return true;
  const pathname = normalizePathname(config.url, config.baseURL);
  return CREDENTIAL_SKIP_REFRESH_PATHS.has(pathname);
}

function clearAuthorizationHeader(headers) {
  if (!headers) return;
  if (typeof headers.delete === 'function') {
    headers.delete('Authorization');
    headers.delete('authorization');
  } else {
    delete headers.Authorization;
    delete headers.authorization;
  }
}

let sessionRefreshedHandler = null;
let sessionExpiredHandler = null;
let sessionExpiryNotified = false;

/** Registers a listener invoked whenever background refresh mints a fresh session. */
export function registerSessionRefreshedHandler(fn) {
  sessionRefreshedHandler = fn;
  return () => {
    if (sessionRefreshedHandler === fn) sessionRefreshedHandler = null;
  };
}

/** Registers a single-fire listener invoked when refresh fails or the session is invalidated. */
export function registerSessionExpiredHandler(fn) {
  sessionExpiredHandler = fn;
  return () => {
    if (sessionExpiredHandler === fn) sessionExpiredHandler = null;
  };
}

/** Resets the single-fire session-expiry guard after a fresh login/registration. */
export function resetSessionExpiryGuard() {
  sessionExpiryNotified = false;
}

function notifySessionExpired(reason = 'SESSION_EXPIRED') {
  authStorage.clear();
  clearOwnerRegisterDraft();
  if (!sessionExpiryNotified) {
    sessionExpiryNotified = true;
    sessionExpiredHandler?.({ reason });
  }
}

function tagSessionExpiredError(err, reason = 'SESSION_EXPIRED') {
  const target = err && typeof err === 'object' ? err : new Error('Session expired');
  target.code = 'SESSION_EXPIRED';
  target.isSessionExpired = true;
  target.sessionReason = reason;
  return target;
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Attach the bearer access token from authStorage to every request.
api.interceptors.request.use((config) => {
  const token = authStorage.getAccessToken();
  if (token) {
    if (typeof config.headers?.get === 'function') {
      if (!config.headers.get('Authorization')) {
        config.headers.set('Authorization', `Bearer ${token}`);
      }
    } else if (config.headers && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Single-flight token refresh on 401 for protected endpoints (including /api/onboarding/* and /api/auth/me).
let refreshInFlight = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const errorCode = error.response?.data?.errorCode;

    // A valid token whose user row was deleted returns 401 SESSION_INVALID:
    // skip pointless refresh and immediately trigger session-loss cleanup.
    if (status === 401 && errorCode === 'SESSION_INVALID' && !shouldSkipRefresh(original)) {
      notifySessionExpired('SESSION_INVALID');
      return Promise.reject(tagSessionExpiredError(error, 'SESSION_INVALID'));
    }

    if (status === 401 && !original?._retry && !shouldSkipRefresh(original)) {
      original._retry = true;
      try {
        const legacyRefreshToken = authStorage.getRefreshToken();
        const refreshPayload = legacyRefreshToken ? { refreshToken: legacyRefreshToken } : {};
        refreshInFlight =
          refreshInFlight ||
          axios.post(`${API_BASE_URL}/api/auth/refresh`, refreshPayload, {
            withCredentials: true,
          });
        const { data } = await refreshInFlight;
        refreshInFlight = null;
        authStorage.setSession(data);
        sessionExpiryNotified = false;
        sessionRefreshedHandler?.(data);
        // Strip the stale Authorization header so the request interceptor attaches the fresh token.
        clearAuthorizationHeader(original.headers);
        return api(original);
      } catch (refreshError) {
        refreshInFlight = null;
        const refreshCode = refreshError?.response?.data?.errorCode;
        const reason = refreshCode === 'ACCOUNT_DISABLED' ? 'ACCOUNT_DISABLED' : 'SESSION_EXPIRED';
        notifySessionExpired(reason);
        return Promise.reject(tagSessionExpiredError(refreshError, reason));
      }
    }

    return Promise.reject(error);
  },
);

const FIELD_LABELS = {
  typeOther: 'Billboard Type',
  trafficTypeOther: 'Traffic Type',
  audienceTypeOther: 'Audience Type',
  type: 'Billboard Type',
  trafficType: 'Traffic Type',
  audienceType: 'Audience Type',
  minBookingValue: 'Minimum Booking',
  startPrice: 'Starting Price',
  pincode: 'PIN Code',
  name: 'Billboard Name',
  groundHeightFt: 'Ground Height',
  groundHeightConsistent: '',
  clearGroundHeight: '',
};

const ERROR_CODE_MESSAGES = {
  CONCURRENT_MODIFICATION:
    'Another request is already in progress. Please wait a moment and try again.',
  SESSION_INVALID: 'Your session is no longer valid. Please sign in again.',
  TOKEN_EXPIRED: 'Your session has expired. Please sign in again.',
  TOKEN_REVOKED: 'Your session has expired. Please sign in again.',
  ACCOUNT_DISABLED: 'This account has been disabled. Please contact support.',
  ALREADY_REGISTERED: 'Your owner account is already active. Please sign in again to continue.',
  ROLE_CONFLICT:
    'This account is already registered with another role and cannot be onboarded as an owner.',
};

/** Turn an axios error into a user-facing message using the backend's ApiError body. */
export function apiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const data = error?.response?.data;
  if (data?.fieldErrors) {
    const entries = Object.entries(data.fieldErrors);
    if (entries.length > 0) {
      const [field, msg] = entries[0];
      const label = FIELD_LABELS[field];
      return label ? `${label}: ${msg}` : msg;
    }
  }
  if (data?.message) return data.message;
  if (data?.errorCode && ERROR_CODE_MESSAGES[data.errorCode]) {
    return ERROR_CODE_MESSAGES[data.errorCode];
  }
  if (error?.code === 'ERR_NETWORK' || error?.message === 'Network Error') {
    return 'Cannot reach the server. Make sure the backend is running.';
  }
  return fallback;
}
