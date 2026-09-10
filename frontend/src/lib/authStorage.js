/**
 * Persists the auth session (JWT access token, current user) in
 * localStorage so it survives reloads.
 * Refresh tokens are managed securely via HttpOnly cookies by the browser.
 */
const ACCESS_KEY = 'ab_access_token';
const REFRESH_KEY = 'ab_refresh_token';
const USER_KEY = 'ab_user';

// Proactive migration cleanup: immediately purge any legacy refresh token from localStorage
try {
  localStorage.removeItem(REFRESH_KEY);
} catch {
  // Ignore in non-browser/restricted environments
}

export const authStorage = {
  getAccessToken: () => localStorage.getItem(ACCESS_KEY),
  /** @deprecated Refresh token is now stored in HttpOnly cookie */
  getRefreshToken: () => localStorage.getItem(REFRESH_KEY),
  getUser: () => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  /** Store session attributes ({ accessToken, user }). Cleans up any legacy refresh token. */
  setSession: ({ accessToken, user }) => {
    if (accessToken) localStorage.setItem(ACCESS_KEY, accessToken);
    try {
      localStorage.removeItem(REFRESH_KEY);
    } catch {
      // Ignore storage errors
    }
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear: () => {
    try {
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {
      // Ignore storage errors
    }
  },
};
