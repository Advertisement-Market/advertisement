/**
 * Frontend runtime configuration, sourced from Vite env vars (build-time).
 * Keep app-wide, environment-specific values here rather than hardcoding them in components.
 */

/** Backend base URL. Defaults to '' so requests are relative to current host. */
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

/** Google OAuth Web client id. Empty string disables the "Continue with Google" button. */
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

/** Whether Google sign-in is configured. */
export const GOOGLE_ENABLED = GOOGLE_CLIENT_ID.length > 0;

/** Maximum video upload limit in bytes (50MB) and user-facing label. */
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
export const MAX_VIDEO_LABEL = 'MP4, MOV · Max 50MB';
export const VIDEO_ACCEPT_TYPES = '.mp4,.mov,video/mp4,video/quicktime';
