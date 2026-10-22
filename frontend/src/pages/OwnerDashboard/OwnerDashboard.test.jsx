import { describe, it, expect, vi } from 'vitest';
import { DEFAULT_BILLBOARD_TYPES, resolveInitialType, formatBillboardType } from './data';

describe('OwnerDashboard Billboard Type LOV helpers', () => {
  it('DEFAULT_BILLBOARD_TYPES contains canonical enum codes and excludes legacy Skywalk', () => {
    const codes = DEFAULT_BILLBOARD_TYPES.map((t) => t.code);
    expect(codes).toEqual([
      'LED_DIGITAL',
      'STATIC_HOARDING',
      'UNIPOLE',
      'GANTRY',
      'BUS_SHELTER',
      'KIOSK',
      'DIGITAL_SCREEN',
      'OTHER',
    ]);
    expect(codes).not.toContain('Skywalk');
  });

  describe('resolveInitialType', () => {
    it('defaults to LED_DIGITAL when empty or undefined', () => {
      expect(resolveInitialType('')).toBe('LED_DIGITAL');
      expect(resolveInitialType(null)).toBe('LED_DIGITAL');
      expect(resolveInitialType(undefined)).toBe('LED_DIGITAL');
    });

    it('resolves display labels to enum codes', () => {
      expect(resolveInitialType('LED Digital')).toBe('LED_DIGITAL');
      expect(resolveInitialType('Static Hoarding')).toBe('STATIC_HOARDING');
      expect(resolveInitialType('Unipole')).toBe('UNIPOLE');
      expect(resolveInitialType('Gantry')).toBe('GANTRY');
      expect(resolveInitialType('Bus Shelter')).toBe('BUS_SHELTER');
      expect(resolveInitialType('Kiosk')).toBe('KIOSK');
      expect(resolveInitialType('Digital Screen')).toBe('DIGITAL_SCREEN');
      expect(resolveInitialType('Other')).toBe('OTHER');
    });

    it('preserves valid enum codes', () => {
      expect(resolveInitialType('STATIC_HOARDING')).toBe('STATIC_HOARDING');
      expect(resolveInitialType('LED_DIGITAL')).toBe('LED_DIGITAL');
      expect(resolveInitialType('OTHER')).toBe('OTHER');
    });

    it('maps legacy Skywalk value to OTHER', () => {
      expect(resolveInitialType('Skywalk')).toBe('OTHER');
      expect(resolveInitialType('skywalk')).toBe('OTHER');
    });
  });

  describe('formatBillboardType', () => {
    it('returns empty string for null or empty values', () => {
      expect(formatBillboardType('')).toBe('');
      expect(formatBillboardType(null)).toBe('');
    });

    it('formats enum codes to human-readable labels', () => {
      expect(formatBillboardType('LED_DIGITAL')).toBe('LED Digital');
      expect(formatBillboardType('STATIC_HOARDING')).toBe('Static Hoarding');
      expect(formatBillboardType('BUS_SHELTER')).toBe('Bus Shelter');
    });

    it('formats OTHER with optional companion text', () => {
      expect(formatBillboardType('OTHER')).toBe('Other');
      expect(formatBillboardType('OTHER', 'Skywalk')).toBe('Other (Skywalk)');
      expect(formatBillboardType('OTHER', 'Bridge Panel')).toBe('Other (Bridge Panel)');
    });

    it('returns original label if already formatted', () => {
      expect(formatBillboardType('LED Digital')).toBe('LED Digital');
    });
  });

  describe('VALID_TABS and URL Tab Query Param', () => {
    it('defines VALID_TABS containing all supported dashboard tabs', async () => {
      const { VALID_TABS } = await import('./data');
      expect(VALID_TABS).toEqual([
        'overview',
        'listings',
        'calendar',
        'quotes',
        'tenders',
        'analytics',
        'settings',
      ]);
    });

    it('initializes tab from ?tab=listings query param and navigates to edit listing', async () => {
      const { cleanup, render, screen, fireEvent, waitFor } =
        await import('@testing-library/react');
      const { MemoryRouter, Routes, Route } = await import('react-router-dom');
      const { OwnerDashboard } = await import('./OwnerDashboard');
      const { AuthContext } = await import('@/context/AuthContext');
      const { ToastProvider } = await import('@/context/ToastProvider');
      const { ownerListingApi } = await import('@/features/owner/ownerListingApi');
      const { notificationApi } = await import('@/features/notification/notificationApi');

      const mockListings = [
        {
          id: 101,
          name: 'Bandra Reclamation Unipole',
          type: 'UNIPOLE',
          status: 'Available',
          price: '₹2.5L',
        },
      ];

      vi.spyOn(ownerListingApi, 'getListings').mockResolvedValue(mockListings);
      vi.spyOn(notificationApi, 'getNotifications').mockResolvedValue({
        notifications: [],
        unreadCount: 0,
      });

      render(
        <AuthContext.Provider value={{ user: { id: 1, firstName: 'Ramesh', role: 'OWNER' } }}>
          <ToastProvider>
            <MemoryRouter initialEntries={['/owners/dashboard?tab=listings']}>
              <Routes>
                <Route path="/owners/dashboard" element={<OwnerDashboard />} />
                <Route
                  path="/owners/listings/:id/edit"
                  element={<div data-testid="edit-page">Edit Page</div>}
                />
              </Routes>
            </MemoryRouter>
          </ToastProvider>
        </AuthContext.Provider>,
      );

      // Verify the Listings page is active, not Overview
      await waitFor(() => {
        expect(screen.getByText('Bandra Reclamation Unipole')).toBeDefined();
      });

      // Click Edit button on the listing card
      const editBtn = screen.getByRole('button', { name: /^edit$/i });
      fireEvent.click(editBtn);

      // Verify it navigated to edit page with ID 101
      await waitFor(() => {
        expect(screen.getByTestId('edit-page')).toBeDefined();
      });

      cleanup();
      vi.restoreAllMocks();
    });

    it('safely falls back to overview when ?tab contains an invalid tab name', async () => {
      const { cleanup, render, screen } = await import('@testing-library/react');
      const { MemoryRouter, Routes, Route } = await import('react-router-dom');
      const { OwnerDashboard } = await import('./OwnerDashboard');
      const { AuthContext } = await import('@/context/AuthContext');
      const { ToastProvider } = await import('@/context/ToastProvider');
      const { ownerListingApi } = await import('@/features/owner/ownerListingApi');
      const { notificationApi } = await import('@/features/notification/notificationApi');

      vi.spyOn(ownerListingApi, 'getListings').mockResolvedValue([]);
      vi.spyOn(notificationApi, 'getNotifications').mockResolvedValue({
        notifications: [],
        unreadCount: 0,
      });

      render(
        <AuthContext.Provider value={{ user: { id: 1, firstName: 'Ramesh', role: 'OWNER' } }}>
          <ToastProvider>
            <MemoryRouter initialEntries={['/owners/dashboard?tab=invalid_tab_name']}>
              <Routes>
                <Route path="/owners/dashboard" element={<OwnerDashboard />} />
              </Routes>
            </MemoryRouter>
          </ToastProvider>
        </AuthContext.Provider>,
      );

      // In overview, the Topbar title is "Overview"
      expect(screen.getByText('Overview', { selector: '.topbar-title' })).toBeDefined();
      expect(screen.getByRole('button', { name: /^overview$/i }).className).toContain('active');

      cleanup();
      vi.restoreAllMocks();
    });
  });
});
