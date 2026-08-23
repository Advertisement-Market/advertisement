/**
 * Frontend runtime configuration, sourced from Vite env vars (build-time).
 * Keep app-wide, environment-specific values here rather than hardcoding them in components.
 */

/** Backend base URL. */
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

/** Google OAuth Web client id. Empty string disables the "Continue with Google" button. */
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

/** Whether Google sign-in is configured. */
export const GOOGLE_ENABLED = GOOGLE_CLIENT_ID.length > 0;
