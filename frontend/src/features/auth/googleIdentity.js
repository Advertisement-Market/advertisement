import { GOOGLE_CLIENT_ID, GOOGLE_ENABLED } from '@/lib/config';

/**
 * Shared Google Identity Services (GIS) loader + initializer. GIS uses a single global callback,
 * so both the rendered button and the One Tap prompt go through one initialization here; the
 * credential handler is swapped to whichever caller last registered.
 */

let gsiPromise = null;
export function loadGsi() {
  if (gsiPromise) return gsiPromise;
  gsiPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services.'));
    document.head.appendChild(script);
  });
  return gsiPromise;
}

let initialized = false;
let handler = null;

/**
 * Loads GIS (once) and initializes it (once), updating the credential handler each call.
 * @param {(idToken: string) => void} onCredential
 * @returns {Promise<object|null>} google.accounts.id, or null if Google is not configured/available
 */
export async function initGoogleIdentity(onCredential) {
  handler = onCredential;
  if (!GOOGLE_ENABLED) return null;
  await loadGsi();
  const id = window.google?.accounts?.id;
  if (!id) return null;
  if (!initialized) {
    id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (resp) => {
        if (resp?.credential) handler?.(resp.credential);
      },
      auto_select: false,
      cancel_on_tap_outside: false,
      use_fedcm_for_prompt: true,
    });
    initialized = true;
  }
  return id;
}
