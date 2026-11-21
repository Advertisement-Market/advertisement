import { describe, it, expect, vi, afterEach } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthContext } from '@/context/AuthContext';
import { ToastContext } from '@/context/ToastContext';
import { ROUTES } from '@/lib/routes';
import { ProtectedRoute } from './ProtectedRoute';

/**
 * Renders a protected `/owners/dashboard` route (role OWNER) alongside stub
 * landing/dashboard pages, so redirects are observable by which stub shows.
 */
function renderGuarded({ user, showToast = vi.fn(), entry = ROUTES.ownerDashboard }) {
  const authValue = { user, isAuthenticated: !!user };
  const toastValue = { showToast, message: '', visible: false };
  render(
    <AuthContext.Provider value={authValue}>
      <ToastContext.Provider value={toastValue}>
        <MemoryRouter initialEntries={[entry]}>
          <Routes>
            <Route path={ROUTES.owners} element={<div data-testid="owner-landing">Owners</div>} />
            <Route
              path={ROUTES.advertiserDashboard}
              element={<div data-testid="advertiser-dashboard">Advertiser</div>}
            />
            <Route
              path={ROUTES.ownerDashboard}
              element={
                <ProtectedRoute role="OWNER" redirectTo={ROUTES.owners}>
                  <div data-testid="owner-dashboard">Owner Dashboard</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </ToastContext.Provider>
    </AuthContext.Provider>,
  );
  return { showToast };
}

describe('ProtectedRoute', () => {
  afterEach(() => cleanup());

  it('renders the protected page for an authenticated user with the required role', () => {
    renderGuarded({ user: { id: 1, firstName: 'Ramesh', role: 'OWNER' } });
    expect(screen.getByTestId('owner-dashboard')).toBeDefined();
  });

  it('redirects an unauthenticated visitor to the landing page with a sign-in toast', () => {
    const { showToast } = renderGuarded({ user: null });
    expect(screen.queryByTestId('owner-dashboard')).toBeNull();
    expect(screen.getByTestId('owner-landing')).toBeDefined();
    expect(showToast).toHaveBeenCalledTimes(1);
    expect(showToast).toHaveBeenCalledWith(expect.stringMatching(/sign in/i));
  });

  it('redirects a signed-in user with the wrong role to their own dashboard', () => {
    const showToast = vi.fn();
    renderGuarded({ user: { id: 2, firstName: 'Anita', role: 'ADVERTISER' }, showToast });
    expect(screen.queryByTestId('owner-dashboard')).toBeNull();
    expect(screen.getByTestId('advertiser-dashboard')).toBeDefined();
    // Wrong-role users are already signed in — no sign-in prompt should fire.
    expect(showToast).not.toHaveBeenCalled();
  });
});
