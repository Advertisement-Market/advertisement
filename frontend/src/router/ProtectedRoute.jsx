import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { DASHBOARD_BY_ROLE, ROUTES } from '@/lib/routes';

/**
 * Route guard for authenticated, role-restricted pages (dashboards, listing editor).
 *
 * - Unauthenticated visitors are redirected to the role's landing page with a toast
 *   explaining why, so a direct URL hit never exposes a protected page.
 * - Signed-in users with the wrong role are redirected to their own dashboard,
 *   never shown another role's private data.
 *
 * The auth user hydrates synchronously from localStorage in AuthProvider, so there
 * is no loading flash to guard against — the decision is correct on first render.
 * The landing pages (`<HomeLayout />`) always render `<Toast />`, so the feedback
 * survives the redirect even where the sign-in modal is intentionally disabled.
 *
 * @param {object} props
 * @param {'ADVERTISER'|'OWNER'|'AGENCY'} [props.role]  required role; omit to only require auth
 * @param {string} [props.redirectTo]                   landing page for unauthenticated visitors
 * @param {import('react').ReactNode} props.children     the protected page
 */
export function ProtectedRoute({ role, redirectTo = ROUTES.home, children }) {
  const { isAuthenticated, user } = useAuth();
  const { showToast } = useToast();

  const needsSignIn = !isAuthenticated;

  useEffect(() => {
    if (needsSignIn) showToast('Please sign in to access that page.');
  }, [needsSignIn, showToast]);

  if (needsSignIn) {
    return <Navigate to={redirectTo} replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to={DASHBOARD_BY_ROLE[user.role] ?? ROUTES.home} replace />;
  }

  return children;
}

export default ProtectedRoute;
