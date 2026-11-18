import axios from 'axios';
import { authStorage } from './authStorage';
import { clearOwnerRegisterDraft } from '@/pages/OwnerRegister/ownerDraftStorage';

/** Backend base URL (override with VITE_API_URL; defaults to '' to use reverse proxies). */
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

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

/**
 * Fail-safe refresh eligibility check:
 * - Any request with `_skipRefresh: true` skips refresh.
 * - All `/api/auth/*` endpoints skip refresh BY DEFAULT unless explicitly opted in via
 *   `_allowRefresh: true` (e.g., `GET /api/auth/me`). Future challenge endpoints under `/api/auth/`
 *   (OTP verify, password reset) automatically fail safe without triggering pointless refreshes.
 * - Protected endpoints outside `/api/auth/` (e.g., `/api/onboarding/*`, `/api/owner/*`) refresh
 *   automatically on 401.
 */
function shouldSkipRefresh(config) {
  if (!config) return true;
  if (config._skipRefresh) return true;
  const pathname = normalizePathname(config.url, config.baseURL);
  if (pathname === '/api/auth' || pathname.startsWith('/api/auth/')) {
    return !config._allowRefresh;
  }
  return false;
}

function getAuthorizationHeader(headers) {
  if (!headers) return null;
  if (typeof headers.get === 'function') {
    return headers.get('Authorization') || headers.get('authorization') || null;
  }
  return headers.Authorization || headers.authorization || null;
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

function extractBearerToken(authHeader) {
  if (typeof authHeader !== 'string') return null;
  return authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
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

/** Registers a single-fire listener invoked when refresh definitively fails or session is invalid. */
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

/**
 * Coordinates token refresh across browser tabs using the Web Locks API (`navigator.locks`) when
 * available. If another tab rotated the token while we waited for the lock, we adopt the fresh
 * token from `authStorage` without issuing a duplicate `/api/auth/refresh` call that would trip
 * single-use refresh-token reuse detection.
 */
async function performCoordinatedRefresh(failedToken) {
  const runRefresh = async () => {
    const latestToken = authStorage.getAccessToken();
    if (failedToken && latestToken && latestToken !== failedToken) {
      const latestUser = authStorage.getUser();
      if (latestUser) {
        sessionRefreshedHandler?.({ accessToken: latestToken, user: latestUser });
      }
      return { accessToken: latestToken, user: latestUser };
    }

    const legacyRefreshToken = authStorage.getRefreshToken();
    const refreshPayload = legacyRefreshToken ? { refreshToken: legacyRefreshToken } : {};
    const { data } = await axios.post(`${API_BASE_URL}/api/auth/refresh`, refreshPayload, {
      withCredentials: true,
    });
    authStorage.setSession(data);
    sessionExpiryNotified = false;
    sessionRefreshedHandler?.(data);
    return data;
  };

  if (typeof navigator !== 'undefined' && typeof navigator.locks?.request === 'function') {
    return navigator.locks.request('ab_auth_refresh', runRefresh);
  }
  return runRefresh();
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

// Single-flight token refresh on 401 (in-tab deduplication + cross-tab Web Lock mutex).
let refreshInFlight = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const errorCode = error.response?.data?.errorCode;

    if (status !== 401 || shouldSkipRefresh(original)) {
      return Promise.reject(error);
    }

    // Never fire "session expired" or attempt refresh for an anonymous visitor with no prior session.
    const failedToken = extractBearerToken(getAuthorizationHeader(original?.headers));
    const hadSession = Boolean(
      failedToken || authStorage.getAccessToken() || authStorage.getUser(),
    );
    if (!hadSession) {
      return Promise.reject(error);
    }

    // Valid token whose user row was deleted -> skip refresh and clear the dead session immediately.
    if (errorCode === 'SESSION_INVALID') {
      notifySessionExpired('SESSION_INVALID');
      return Promise.reject(tagSessionExpiredError(error, 'SESSION_INVALID'));
    }

    if (!original?._retry) {
      original._retry = true;
      try {
        refreshInFlight = refreshInFlight || performCoordinatedRefresh(failedToken);
        await refreshInFlight;
        refreshInFlight = null;
        // Strip stale Authorization header so the request interceptor injects the fresh token.
        clearAuthorizationHeader(original.headers);
        return api(original);
      } catch (refreshError) {
        refreshInFlight = null;
        const refreshStatus = refreshError?.response?.status;
        // Only definitive auth rejections (401/403) invalidate the session and clear drafts.
        // Transient network errors, timeouts, or 5xx keep authStorage & wizard drafts intact.
        if (refreshStatus === 401 || refreshStatus === 403) {
          const refreshCode = refreshError?.response?.data?.errorCode;
          const reason =
            refreshCode === 'ACCOUNT_DISABLED' ? 'ACCOUNT_DISABLED' : 'SESSION_EXPIRED';
          notifySessionExpired(reason);
          return Promise.reject(tagSessionExpiredError(refreshError, reason));
        }
        return Promise.reject(refreshError);
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
