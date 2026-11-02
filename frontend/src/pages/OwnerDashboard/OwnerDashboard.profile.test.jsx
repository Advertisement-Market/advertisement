import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

/**
 * Component tests for the dashboard account menu + profile behaviours introduced in PR #40:
 * avatar dropdown open/close (click, outside-click, Escape), Profile navigation, Logout
 * (logout + toast + redirect), and profile fields populated from the authenticated user.
 */

// Avatar notification effect calls the API on mount — keep it offline.
vi.mock('@/features/notification/notificationApi', () => ({
  notificationApi: {
    getNotifications: vi.fn(() => Promise.resolve({ notifications: [], unreadCount: 0 })),
    markAsRead: vi.fn(() => Promise.resolve()),
    markAllAsRead: vi.fn(() => Promise.resolve()),
  },
}));

// Spy on navigation while keeping the real Router (Link needs it).
const navigateSpy = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => navigateSpy };
});

// Authenticated user + logout spy.
const logoutSpy = vi.fn();
const testUser = {
  id: 7,
  firstName: 'Nisha',
  lastName: 'Rao',
  email: 'nisha.rao@example.com',
  phone: '+91 90000 11111',
  role: 'OWNER',
  emailVerified: true,
};
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: testUser, isAuthenticated: true, logout: logoutSpy }),
}));

import { ROUTES } from '@/lib/routes';
import { ToastProvider } from '@/context/ToastProvider';
import { Toast } from '@/components/ui/Toast/Toast';
import { OwnerDashboard } from './OwnerDashboard';

function renderDashboard() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <OwnerDashboard />
        <Toast />
      </ToastProvider>
    </MemoryRouter>,
  );
}

const menu = () => document.querySelector('.profile-menu');
const avatar = () => screen.getByLabelText('Account menu');

describe('OwnerDashboard — account menu & profile', () => {
  beforeEach(() => {
    navigateSpy.mockClear();
    logoutSpy.mockClear();
  });

  it('renames the sidebar entry to Profile (no Settings)', () => {
    renderDashboard();
    // "Profile" appears in the sidebar nav and in the (always-mounted) account menu.
    expect(screen.getAllByText('Profile').length).toBeGreaterThan(0);
    expect(screen.queryByText('Settings')).toBeNull();
  });

  it('toggles the avatar dropdown open on click and shows Profile + Logout', () => {
    renderDashboard();
    expect(menu().classList.contains('open')).toBe(false);

    fireEvent.click(avatar());
    expect(menu().classList.contains('open')).toBe(true);
    expect(within(menu()).getByText('Profile')).toBeDefined();
    expect(within(menu()).getByText('Logout')).toBeDefined();

    // Clicking again closes it.
    fireEvent.click(avatar());
    expect(menu().classList.contains('open')).toBe(false);
  });

  it('closes the dropdown on Escape', () => {
    renderDashboard();
    fireEvent.click(avatar());
    expect(menu().classList.contains('open')).toBe(true);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(menu().classList.contains('open')).toBe(false);
  });

  it('closes the dropdown on an outside click', () => {
    renderDashboard();
    fireEvent.click(avatar());
    expect(menu().classList.contains('open')).toBe(true);

    fireEvent.click(document.body);
    expect(menu().classList.contains('open')).toBe(false);
  });

  it('navigates to the User Profile page with the user’s data when Profile is clicked', () => {
    renderDashboard();
    fireEvent.click(avatar());
    fireEvent.click(within(menu()).getByText('Profile'));

    // Page title switches to User Profile and fields reflect the signed-in user.
    expect(screen.getAllByText('User Profile').length).toBeGreaterThan(0);
    expect(screen.getByDisplayValue('nisha.rao@example.com')).toBeDefined();
    expect(screen.getByDisplayValue('+91 90000 11111')).toBeDefined();
    expect(screen.getByDisplayValue('Nisha')).toBeDefined();
    expect(screen.getByDisplayValue('Rao')).toBeDefined();
  });

  it('logs out, shows a toast and redirects home when Logout is clicked', async () => {
    renderDashboard();
    fireEvent.click(avatar());
    fireEvent.click(within(menu()).getByText('Logout'));

    expect(logoutSpy).toHaveBeenCalledTimes(1);
    expect(navigateSpy).toHaveBeenCalledWith(ROUTES.home);
    await waitFor(() => expect(screen.getByText('You have been signed out.')).toBeDefined());
  });
});
