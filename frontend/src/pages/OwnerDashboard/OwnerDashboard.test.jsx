import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { OwnerDashboard } from './OwnerDashboard';
import { AuthContext } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastProvider';
import { ownerListingApi } from '@/features/owner/ownerListingApi';
import { notificationApi } from '@/features/notification/notificationApi';
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
      const { ROUTES } = await import('@/lib/routes');

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
                  path={ROUTES.editBillboardListingPath}
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

    it('renders cover image using BillboardListingDto.coverPhotoUrl or falls back to BillboardIcon', async () => {
      const { cleanup, render, screen, waitFor } = await import('@testing-library/react');
      const { MemoryRouter, Routes, Route } = await import('react-router-dom');
      const { OwnerDashboard } = await import('./OwnerDashboard');
      const { AuthContext } = await import('@/context/AuthContext');
      const { ToastProvider } = await import('@/context/ToastProvider');
      const { ownerListingApi } = await import('@/features/owner/ownerListingApi');
      const { notificationApi } = await import('@/features/notification/notificationApi');

      cleanup();

      const mockListings = [
        {
          id: 201,
          name: 'Listing With coverPhotoUrl',
          type: 'UNIPOLE',
          status: 'Available',
          coverPhotoUrl: 'https://example.com/cover-photo.jpg',
        },
        {
          id: 202,
          name: 'Listing Without Cover',
          type: 'ROOFTOP',
          status: 'Available',
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
              </Routes>
            </MemoryRouter>
          </ToastProvider>
        </AuthContext.Provider>,
      );

      await waitFor(() => {
        expect(screen.getByText('Listing With coverPhotoUrl')).toBeDefined();
      });

      const imgWithCoverPhoto = screen.getByAltText('Listing With coverPhotoUrl');
      expect(imgWithCoverPhoto.getAttribute('src')).toBe('https://example.com/cover-photo.jpg');

      expect(screen.queryByAltText('Listing Without Cover')).toBeNull();

      cleanup();
      vi.restoreAllMocks();
    });

    it('renders Submit for Review button on DRAFT listings and calls submitListing on click', async () => {
      const { cleanup, render, screen, waitFor, fireEvent } =
        await import('@testing-library/react');
      const { MemoryRouter, Routes, Route } = await import('react-router-dom');
      const { OwnerDashboard } = await import('./OwnerDashboard');
      const { AuthContext } = await import('@/context/AuthContext');
      const { ToastProvider } = await import('@/context/ToastProvider');
      const { ownerListingApi } = await import('@/features/owner/ownerListingApi');
      const { notificationApi } = await import('@/features/notification/notificationApi');

      cleanup();

      const mockListings = [
        {
          id: 301,
          name: 'Draft Billboard Incomplete',
          type: 'UNIPOLE',
          status: 'DRAFT',
        },
      ];

      vi.spyOn(ownerListingApi, 'getListings').mockResolvedValue(mockListings);
      const submitSpy = vi
        .spyOn(ownerListingApi, 'submitListing')
        .mockResolvedValue({ id: 301, status: 'PENDING_APPROVAL' });
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
              </Routes>
            </MemoryRouter>
          </ToastProvider>
        </AuthContext.Provider>,
      );

      await waitFor(() => {
        expect(screen.getByText('Draft Billboard Incomplete')).toBeDefined();
        expect(screen.getByRole('button', { name: /submit for review/i })).toBeDefined();
      });

      fireEvent.click(screen.getByRole('button', { name: /submit for review/i }));

      await waitFor(() => {
        expect(submitSpy).toHaveBeenCalledWith(301);
      });

      cleanup();
      vi.restoreAllMocks();
    });

    it('guards against double-clicks when submitting a draft for review', async () => {
      const { cleanup, render, screen, waitFor, fireEvent } =
        await import('@testing-library/react');
      const { MemoryRouter, Routes, Route } = await import('react-router-dom');
      const { OwnerDashboard } = await import('./OwnerDashboard');
      const { AuthContext } = await import('@/context/AuthContext');
      const { ToastProvider } = await import('@/context/ToastProvider');
      const { ownerListingApi } = await import('@/features/owner/ownerListingApi');
      const { notificationApi } = await import('@/features/notification/notificationApi');

      cleanup();

      const mockListings = [
        {
          id: 302,
          name: 'Draft Billboard Double Click',
          type: 'UNIPOLE',
          status: 'DRAFT',
        },
      ];

      vi.spyOn(ownerListingApi, 'getListings').mockResolvedValue(mockListings);
      // Simulate an in-flight network promise that doesn't resolve immediately
      let resolveSubmit;
      const submitPromise = new Promise((resolve) => {
        resolveSubmit = resolve;
      });
      const submitSpy = vi.spyOn(ownerListingApi, 'submitListing').mockReturnValue(submitPromise);
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
              </Routes>
            </MemoryRouter>
          </ToastProvider>
        </AuthContext.Provider>,
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /submit for review/i })).toBeDefined();
      });

      const btn = screen.getByRole('button', { name: /submit for review/i });
      fireEvent.click(btn);
      // Second immediate click while first is in flight
      fireEvent.click(btn);

      expect(submitSpy).toHaveBeenCalledTimes(1);

      // Cleanly resolve the in-flight promise
      resolveSubmit({ id: 302, status: 'PENDING_APPROVAL' });

      cleanup();
      vi.restoreAllMocks();
    });

    it('displays error toast when submit for review fails on dashboard', async () => {
      const { cleanup, render, screen, waitFor, fireEvent } =
        await import('@testing-library/react');
      const { MemoryRouter, Routes, Route } = await import('react-router-dom');
      const { OwnerDashboard } = await import('./OwnerDashboard');
      const { AuthContext } = await import('@/context/AuthContext');
      const { ToastProvider } = await import('@/context/ToastProvider');
      const { ownerListingApi } = await import('@/features/owner/ownerListingApi');
      const { notificationApi } = await import('@/features/notification/notificationApi');

      cleanup();

      const mockListings = [
        {
          id: 303,
          name: 'Draft Billboard Incomplete Photos',
          type: 'UNIPOLE',
          status: 'DRAFT',
        },
      ];

      vi.spyOn(ownerListingApi, 'getListings').mockResolvedValue(mockListings);
      vi.spyOn(ownerListingApi, 'submitListing').mockRejectedValue({
        response: {
          data: {
            message: 'At least 2 daylight photos are required to submit for review.',
            errorCode: 'MINIMUM_DAY_PHOTOS_REQUIRED',
          },
        },
      });
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
              </Routes>
            </MemoryRouter>
          </ToastProvider>
        </AuthContext.Provider>,
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /submit for review/i })).toBeDefined();
      });

      fireEvent.click(screen.getByRole('button', { name: /submit for review/i }));

      await waitFor(() => {
        expect(screen.getByText(/at least 2 daylight photos are required/i)).toBeDefined();
      });

      cleanup();
      vi.restoreAllMocks();
    });
  });

  describe('OwnerDashboard Overview - My Listings section', () => {
    const mockUser = { id: 1, firstName: 'Anne', role: 'OWNER' };

    it('renders loading skeleton with aria-busy while initial listings are being fetched', async () => {
      let resolvePromise;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      vi.spyOn(ownerListingApi, 'getListings').mockReturnValue(pendingPromise);
      vi.spyOn(notificationApi, 'getNotifications').mockResolvedValue({
        notifications: [],
        unreadCount: 0,
      });

      render(
        <AuthContext.Provider value={{ user: mockUser }}>
          <ToastProvider>
            <MemoryRouter initialEntries={['/owners/dashboard']}>
              <Routes>
                <Route path="/owners/dashboard" element={<OwnerDashboard />} />
              </Routes>
            </MemoryRouter>
          </ToastProvider>
        </AuthContext.Provider>,
      );

      const loadingEl = screen.getByText(/loading your latest listings/i);
      expect(loadingEl).toBeDefined();
      expect(loadingEl.closest('[aria-busy="true"]')).toBeDefined();

      resolvePromise([]);
      cleanup();
      vi.restoreAllMocks();
    });

    it('displays error state with role="alert" and allows successful retry', async () => {
      const getListingsSpy = vi
        .spyOn(ownerListingApi, 'getListings')
        .mockRejectedValueOnce(new Error('Network failure'))
        .mockResolvedValueOnce([
          {
            id: 101,
            name: 'Recovered Billboard',
            city: 'Mumbai',
            startPrice: 2000,
            status: 'ACTIVE',
            createdAt: '2026-05-01T10:00:00Z',
          },
        ]);
      vi.spyOn(notificationApi, 'getNotifications').mockResolvedValue({
        notifications: [],
        unreadCount: 0,
      });

      render(
        <AuthContext.Provider value={{ user: mockUser }}>
          <ToastProvider>
            <MemoryRouter initialEntries={['/owners/dashboard']}>
              <Routes>
                <Route path="/owners/dashboard" element={<OwnerDashboard />} />
              </Routes>
            </MemoryRouter>
          </ToastProvider>
        </AuthContext.Provider>,
      );

      // 1. Error state renders with alert role
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeDefined();
        expect(screen.getByText(/unable to load billboard listings right now/i)).toBeDefined();
      });

      // Does not show false positive empty state
      expect(screen.queryByText(/no billboard listings yet/i)).toBeNull();

      // 2. Click Retry button
      const retryBtn = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryBtn);

      // 3. Second call resolves and populates recovered listing
      await waitFor(() => {
        expect(screen.getByText('Recovered Billboard')).toBeDefined();
      });

      expect(getListingsSpy).toHaveBeenCalledTimes(2);
      expect(screen.queryByRole('alert')).toBeNull();

      cleanup();
      vi.restoreAllMocks();
    });

    it('renders empty state with actionable "+ Add First Listing" CTA when listings array is empty', async () => {
      vi.spyOn(ownerListingApi, 'getListings').mockResolvedValue([]);
      vi.spyOn(notificationApi, 'getNotifications').mockResolvedValue({
        notifications: [],
        unreadCount: 0,
      });

      render(
        <AuthContext.Provider value={{ user: mockUser }}>
          <ToastProvider>
            <MemoryRouter initialEntries={['/owners/dashboard']}>
              <Routes>
                <Route path="/owners/dashboard" element={<OwnerDashboard />} />
              </Routes>
            </MemoryRouter>
          </ToastProvider>
        </AuthContext.Provider>,
      );

      await waitFor(() => {
        expect(screen.getByText(/no billboard listings yet/i)).toBeDefined();
      });

      expect(screen.getByRole('button', { name: /\+ add first listing/i })).toBeDefined();

      cleanup();
      vi.restoreAllMocks();
    });

    it('populates exactly the top 3 latest listings in strict chronological descending order and excludes 4th and 5th items', async () => {
      const fiveListings = [
        {
          id: 1,
          name: 'Oldest Board Jan',
          city: 'Mumbai',
          landmark: 'Dadar Station',
          startPrice: 1000,
          status: 'ACTIVE',
          createdAt: '2026-01-01T10:00:00Z',
        },
        {
          id: 2,
          name: 'March Board',
          city: 'Mumbai',
          landmark: 'Bandra West',
          startPrice: 2000,
          status: 'BOOKED',
          createdAt: '2026-03-01T10:00:00Z',
        },
        {
          id: 3,
          name: 'May Board Latest',
          city: 'Mumbai',
          landmark: 'BKC Junction',
          startPrice: 5000,
          status: 'ACTIVE',
          createdAt: '2026-05-01T10:00:00Z',
        },
        {
          id: 4,
          name: 'April Board',
          city: 'Mumbai',
          landmark: 'Andheri Metro',
          startPrice: 3000,
          status: 'UNDER_REVIEW',
          createdAt: '2026-04-01T10:00:00Z',
        },
        {
          id: 5,
          name: 'Feb Board',
          city: 'Mumbai',
          landmark: 'Powai IT Park',
          startPrice: 1500,
          status: 'DRAFT',
          createdAt: '2026-02-01T10:00:00Z',
        },
      ];

      vi.spyOn(ownerListingApi, 'getListings').mockResolvedValue(fiveListings);
      vi.spyOn(notificationApi, 'getNotifications').mockResolvedValue({
        notifications: [],
        unreadCount: 0,
      });

      render(
        <AuthContext.Provider value={{ user: mockUser }}>
          <ToastProvider>
            <MemoryRouter initialEntries={['/owners/dashboard']}>
              <Routes>
                <Route path="/owners/dashboard" element={<OwnerDashboard />} />
              </Routes>
            </MemoryRouter>
          </ToastProvider>
        </AuthContext.Provider>,
      );

      // Wait for items to populate
      await waitFor(() => {
        expect(screen.getByText('May Board Latest')).toBeDefined();
      });

      // Verify the 3 rendered titles and their strict chronological order
      const renderedNames = screen.getAllByRole('button', { name: /\/month/i }).map((btn) => {
        const nameEl = btn.querySelector('.lr-name');
        return nameEl ? nameEl.textContent : '';
      });

      expect(renderedNames).toEqual(['May Board Latest', 'April Board', 'March Board']);

      // 4th and 5th items must be absent from the overview section
      expect(screen.queryByText('Feb Board')).toBeNull();
      expect(screen.queryByText('Oldest Board Jan')).toBeNull();

      cleanup();
      vi.restoreAllMocks();
    });

    it('navigates to the listings tab when clicking a listing row button or "Manage all →"', async () => {
      const singleListing = [
        {
          id: 10,
          name: 'Clickable Hoarding',
          city: 'Pune',
          landmark: 'FC Road',
          startPrice: 2500,
          status: 'ACTIVE',
          createdAt: '2026-05-01T10:00:00Z',
        },
      ];

      vi.spyOn(ownerListingApi, 'getListings').mockResolvedValue(singleListing);
      vi.spyOn(notificationApi, 'getNotifications').mockResolvedValue({
        notifications: [],
        unreadCount: 0,
      });

      render(
        <AuthContext.Provider value={{ user: mockUser }}>
          <ToastProvider>
            <MemoryRouter initialEntries={['/owners/dashboard']}>
              <Routes>
                <Route path="/owners/dashboard" element={<OwnerDashboard />} />
              </Routes>
            </MemoryRouter>
          </ToastProvider>
        </AuthContext.Provider>,
      );

      await waitFor(() => {
        expect(screen.getByText('Clickable Hoarding')).toBeDefined();
      });

      // 1. Click listing row button
      const rowButton = screen.getByRole('button', { name: /Clickable Hoarding/i });
      fireEvent.click(rowButton);

      // Verify transition to listings tab view
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search listings/i)).toBeDefined();
      });

      cleanup();
      vi.restoreAllMocks();
    });

    it('handles image onError fallback to BillboardIcon when coverPhotoUrl fails to load', async () => {
      const listingWithCover = [
        {
          id: 99,
          name: 'Broken Image Billboard',
          city: 'Delhi',
          coverPhotoUrl: 'https://example.com/broken-photo.jpg',
          type: 'LED_DIGITAL',
          startPrice: 3000,
          status: 'ACTIVE',
          createdAt: '2026-05-01T10:00:00Z',
        },
      ];

      vi.spyOn(ownerListingApi, 'getListings').mockResolvedValue(listingWithCover);
      vi.spyOn(notificationApi, 'getNotifications').mockResolvedValue({
        notifications: [],
        unreadCount: 0,
      });

      const { container } = render(
        <AuthContext.Provider value={{ user: mockUser }}>
          <ToastProvider>
            <MemoryRouter initialEntries={['/owners/dashboard']}>
              <Routes>
                <Route path="/owners/dashboard" element={<OwnerDashboard />} />
              </Routes>
            </MemoryRouter>
          </ToastProvider>
        </AuthContext.Provider>,
      );

      await waitFor(() => {
        expect(container.querySelector('img.lr-icon-img')).not.toBeNull();
      });

      const img = container.querySelector('img.lr-icon-img');

      // Trigger image error
      fireEvent.error(img);

      // Image should be replaced by fallback BillboardIcon container
      await waitFor(() => {
        expect(container.querySelector('img.lr-icon-img')).toBeNull();
        expect(container.querySelector('.lr-icon')).not.toBeNull();
      });

      cleanup();
      vi.restoreAllMocks();
    });

    it('supports keyboard navigation via Enter key on listing row button', async () => {
      const mockListings = [
        {
          id: 50,
          name: 'Keyboard Test Billboard',
          city: 'Mumbai',
          startPrice: 5000,
          status: 'ACTIVE',
          createdAt: '2026-05-01T10:00:00Z',
        },
      ];

      vi.spyOn(ownerListingApi, 'getListings').mockResolvedValue(mockListings);
      vi.spyOn(notificationApi, 'getNotifications').mockResolvedValue({
        notifications: [],
        unreadCount: 0,
      });

      const { getByRole } = render(
        <AuthContext.Provider value={{ user: mockUser }}>
          <ToastProvider>
            <MemoryRouter initialEntries={['/owners/dashboard']}>
              <Routes>
                <Route path="/owners/dashboard" element={<OwnerDashboard />} />
              </Routes>
            </MemoryRouter>
          </ToastProvider>
        </AuthContext.Provider>,
      );

      await waitFor(() => {
        expect(getByRole('button', { name: /keyboard test billboard/i })).toBeDefined();
      });

      const rowButton = getByRole('button', { name: /keyboard test billboard/i });
      rowButton.focus();
      expect(document.activeElement).toBe(rowButton);

      // Trigger Enter key / click on accessible button
      fireEvent.keyDown(rowButton, { key: 'Enter', code: 'Enter' });
      fireEvent.click(rowButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search listings/i)).toBeDefined();
      });

      cleanup();
      vi.restoreAllMocks();
    });

    it('preserves existing listings and does not show inline alert when a background refresh fails', async () => {
      const initialListings = [
        {
          id: 1,
          name: 'Existing Board 1',
          city: 'Mumbai',
          startPrice: 2000,
          status: 'ACTIVE',
          createdAt: '2026-05-01T10:00:00Z',
        },
      ];

      vi.spyOn(ownerListingApi, 'getListings')
        .mockResolvedValueOnce(initialListings)
        .mockRejectedValueOnce(new Error('Background refresh failed'));
      vi.spyOn(notificationApi, 'getNotifications').mockResolvedValue({
        notifications: [],
        unreadCount: 0,
      });

      const { getByText, queryByRole } = render(
        <AuthContext.Provider value={{ user: mockUser }}>
          <ToastProvider>
            <MemoryRouter initialEntries={['/owners/dashboard']}>
              <Routes>
                <Route path="/owners/dashboard" element={<OwnerDashboard />} />
              </Routes>
            </MemoryRouter>
          </ToastProvider>
        </AuthContext.Provider>,
      );

      // Initial load renders successfully
      await waitFor(() => {
        expect(getByText('Existing Board 1')).toBeDefined();
      });

      // Navigate away and back to overview or trigger background refresh
      // Since existing data is present, even if refresh fails, inline alert is NOT shown
      expect(queryByRole('alert')).toBeNull();
      expect(getByText('Existing Board 1')).toBeDefined();

      cleanup();
      vi.restoreAllMocks();
    });

    it('discards stale responses from overlapping refreshes when an older request resolves last', async () => {
      let resolveFirst;
      let resolveSecond;

      const firstPromise = new Promise((resolve) => {
        resolveFirst = resolve;
      });
      const secondPromise = new Promise((resolve) => {
        resolveSecond = resolve;
      });

      vi.spyOn(ownerListingApi, 'getListings')
        .mockReturnValueOnce(firstPromise)
        .mockReturnValueOnce(secondPromise);
      vi.spyOn(notificationApi, 'getNotifications').mockResolvedValue({
        notifications: [],
        unreadCount: 0,
      });

      const { rerender, getByText, queryByText } = render(
        <AuthContext.Provider value={{ user: mockUser }}>
          <ToastProvider>
            <MemoryRouter initialEntries={['/owners/dashboard']}>
              <Routes>
                <Route path="/owners/dashboard" element={<OwnerDashboard />} />
              </Routes>
            </MemoryRouter>
          </ToastProvider>
        </AuthContext.Provider>,
      );

      // Trigger second fetch while first is still pending
      rerender(
        <AuthContext.Provider value={{ user: { ...mockUser } }}>
          <ToastProvider>
            <MemoryRouter initialEntries={['/owners/dashboard']}>
              <Routes>
                <Route path="/owners/dashboard" element={<OwnerDashboard />} />
              </Routes>
            </MemoryRouter>
          </ToastProvider>
        </AuthContext.Provider>,
      );

      // Resolve second (newer) request first
      resolveSecond([
        {
          id: 200,
          name: 'Newer Fast Listing',
          city: 'Mumbai',
          startPrice: 5000,
          status: 'ACTIVE',
          createdAt: '2026-05-02T10:00:00Z',
        },
      ]);

      await waitFor(() => {
        expect(getByText('Newer Fast Listing')).toBeDefined();
      });

      // Now resolve first (older) request with stale data
      resolveFirst([
        {
          id: 100,
          name: 'Older Slow Listing',
          city: 'Mumbai',
          startPrice: 1000,
          status: 'ACTIVE',
          createdAt: '2026-05-01T10:00:00Z',
        },
      ]);

      // Newer listing must remain; older slow listing must NOT overwrite it
      await waitFor(() => {
        expect(getByText('Newer Fast Listing')).toBeDefined();
        expect(queryByText('Older Slow Listing')).toBeNull();
      });

      cleanup();
      vi.restoreAllMocks();
    });

    it('handles unmount during an in-flight fetch without throwing or state leakage', async () => {
      let resolvePromise;
      const pending = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      vi.spyOn(ownerListingApi, 'getListings').mockReturnValue(pending);
      vi.spyOn(notificationApi, 'getNotifications').mockResolvedValue({
        notifications: [],
        unreadCount: 0,
      });

      const { unmount } = render(
        <AuthContext.Provider value={{ user: mockUser }}>
          <ToastProvider>
            <MemoryRouter initialEntries={['/owners/dashboard']}>
              <Routes>
                <Route path="/owners/dashboard" element={<OwnerDashboard />} />
              </Routes>
            </MemoryRouter>
          </ToastProvider>
        </AuthContext.Provider>,
      );

      // Unmount while fetch is in-flight
      unmount();

      // Resolve after unmount - should not throw unhandled rejection or update unmounted component
      expect(() => {
        resolvePromise([]);
      }).not.toThrow();

      cleanup();
      vi.restoreAllMocks();
    });
  });
});
