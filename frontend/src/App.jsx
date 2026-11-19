import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from '@/context/ToastProvider';
import { AuthModalProvider } from '@/context/AuthModalProvider';
import { AuthProvider } from '@/context/AuthProvider';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useAuthModal } from '@/context/AuthModalContext';
import { registerSessionExpiredHandler } from '@/lib/apiClient';
import { GoogleOneTap } from '@/features/auth/GoogleOneTap';
import { AppRoutes } from '@/router/AppRoutes';

/**
 * Connects apiClient's single-fire session-expiry callback to AuthProvider, ToastProvider,
 * and AuthModalProvider so expired/disabled sessions clear state, show a single accurate
 * toast, and prompt sign-in cleanly across the entire app.
 */
function SessionExpiryBridge() {
  const { clearSessionLocal } = useAuth();
  const { showToast } = useToast();
  const { openLogin } = useAuthModal();

  useEffect(() => {
    return registerSessionExpiredHandler(({ reason } = {}) => {
      clearSessionLocal();
      if (reason === 'ACCOUNT_DISABLED') {
        showToast('This account has been disabled. Please contact support.', 'error');
      } else {
        showToast('Your session has expired. Please sign in to continue.', 'error');
      }
      openLogin();
    });
  }, [clearSessionLocal, showToast, openLogin]);

  return null;
}

/**
 * App root: Router → global providers → routes.
 * Providers sit inside the Router so the auth modal can use navigation.
 */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AuthModalProvider>
            <SessionExpiryBridge />
            <GoogleOneTap />
            <AppRoutes />
          </AuthModalProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
