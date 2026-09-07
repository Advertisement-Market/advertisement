import { useEffect } from 'react';
import { GOOGLE_ENABLED } from '@/lib/config';
import { initGoogleIdentity } from './googleIdentity';
import { useAuth } from '@/context/AuthContext';
import { useAuthModal } from '@/context/AuthModalContext';
import { useToast } from '@/context/ToastContext';

/**
 * Shows Google's One Tap prompt (the auto-popup with the user's Google account) for signed-out
 * visitors, like large sites do. Selecting an account signs the user in via the backend. Renders
 * nothing; it just drives the GIS prompt. No-op when Google isn't configured or the user is signed
 * in. The prompt itself may not appear if the visitor previously dismissed it (Google's cooldown),
 * has no Google session, or the browser blocks it.
 */
export function GoogleOneTap() {
  const { isAuthenticated, loginWithGoogle } = useAuth();
  const { close } = useAuthModal();
  const { showToast } = useToast();

  useEffect(() => {
    if (!GOOGLE_ENABLED || isAuthenticated) return undefined;
    let cancelled = false;

    const onCredential = async (idToken) => {
      try {
        await loginWithGoogle(idToken);
        showToast("You're signed in with Google.");
        close();
      } catch {
        // Silent: the visitor can still use the Sign In modal.
      }
    };

    // In local development, bypass Google One Tap cooldown by clearing the g_state cookie.
    const clearCooldown = () => {
      if (import.meta.env.DEV) {
        document.cookie = 'g_state=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        if (typeof window !== 'undefined') {
          document.cookie = `g_state=;path=/;domain=${window.location.hostname};expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
        }
      }
    };
    clearCooldown();

    initGoogleIdentity(onCredential).then((id) => {
      if (cancelled || !id) return;
      id.prompt((notification) => {
        if (notification.isDismissedMoment()) {
          clearCooldown();
        }
      });
    });

    return () => {
      cancelled = true;
      window.google?.accounts?.id?.cancel?.();
    };
  }, [isAuthenticated, loginWithGoogle, showToast, close]);

  return null;
}
