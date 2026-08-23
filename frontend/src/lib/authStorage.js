/**
 * Persists the auth session (JWT access token, refresh token, current user) in
 * localStorage so it survives reloads. This is the single source of truth for tokens.
 */
const ACCESS_KEY = 'ab_access_token';
const REFRESH_KEY = 'ab_refresh_token';
const USER_KEY = 'ab_user';

export const authStorage = {
  getAccessToken: () => localStorage.getItem(ACCESS_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_KEY),
  getUser: () => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  /** Store an AuthResponse ({ accessToken, refreshToken, user }). */
  setSession: ({ accessToken, refreshToken, user }) => {
    if (accessToken) localStorage.setItem(ACCESS_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  },
};
