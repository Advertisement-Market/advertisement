import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { OwnerDashboard } from './OwnerDashboard';
import { AuthContext } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastProvider';
import { ownerListingApi } from '@/features/owner/ownerListingApi';
import { availabilityApi } from '@/features/availability/availabilityApi';
import { notificationApi } from '@/features/notification/notificationApi';

describe('OwnerDashboard Availability CalendarPage', () => {
  beforeEach(() => {
    cleanup();
    vi.spyOn(notificationApi, 'getNotifications').mockResolvedValue({
      notifications: [],
      unreadCount: 0,
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const renderDashboard = (initialRoute = '/owners/dashboard?tab=calendar') => {
    return render(
      <AuthContext.Provider value={{ user: { id: 1, firstName: 'Ramesh', role: 'OWNER' } }}>
        <ToastProvider>
          <MemoryRouter initialEntries={[initialRoute]}>
            <Routes>
              <Route path="/owners/dashboard" element={<OwnerDashboard />} />
            </Routes>
          </MemoryRouter>
        </ToastProvider>
      </AuthContext.Provider>,
    );
  };

  it('renders empty state when owner has no listings', async () => {
    vi.spyOn(ownerListingApi, 'getListings').mockResolvedValue([]);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/no billboard listings found/i)).toBeDefined();
    });
    expect(screen.getByRole('button', { name: /create new listing/i })).toBeDefined();
  });

  it('hydrates calendar blocks for the primary billboard listing', async () => {
    const mockListings = [
      { id: 101, name: 'Marine Drive Unipole', status: 'ACTIVE' },
      { id: 102, name: 'Bandra Digital LED', status: 'ACTIVE' },
    ];
    vi.spyOn(ownerListingApi, 'getListings').mockResolvedValue(mockListings);

    const getAvailSpy = vi.spyOn(availabilityApi, 'getListingAvailability').mockResolvedValue({
      blocks: [
        { id: 1, startDate: '2026-11-10', endDate: '2026-11-12', blockType: 'OWNER_BLOCKED' },
        { id: 2, startDate: '2026-11-20', endDate: '2026-11-22', blockType: 'CONFIRMED_BOOKING' },
      ],
      etag: 'etag123456',
      today: '2026-11-06',
    });

    renderDashboard();

    await waitFor(() => {
      expect(getAvailSpy).toHaveBeenCalledWith(101);
    });

    await waitFor(() => {
      expect(screen.getByText(/Marine Drive Unipole — Availability/i)).toBeDefined();
      expect(screen.getAllByText(/Confirmed Booking/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/2026-11-20 to 2026-11-22/i)).toBeDefined();
    });
  });

  it('triggers syncListingAvailability on Save Changes with ETag', async () => {
    const mockListings = [{ id: 101, name: 'Marine Drive Unipole', status: 'ACTIVE' }];
    vi.spyOn(ownerListingApi, 'getListings').mockResolvedValue(mockListings);

    const getAvailSpy = vi.spyOn(availabilityApi, 'getListingAvailability').mockResolvedValue({
      blocks: [],
      etag: 'initial-etag',
      today: '2026-11-06',
    });

    const syncSpy = vi.spyOn(availabilityApi, 'syncListingAvailability').mockResolvedValue({
      blocks: [
        { id: 10, startDate: '2026-11-15', endDate: '2026-11-16', blockType: 'OWNER_BLOCKED' },
      ],
      warnings: [],
      etag: 'new-etag',
      today: '2026-11-06',
    });

    renderDashboard();

    // Wait until listing is loaded and availability hydrated
    await waitFor(() => {
      expect(getAvailSpy).toHaveBeenCalledWith(101);
    });

    // Enter Quick Block dates
    const fromInput = screen.getByLabelText(/from/i);
    const toInput = screen.getByLabelText(/to/i);

    fireEvent.change(fromInput, { target: { value: '2026-11-25' } });
    fireEvent.change(toInput, { target: { value: '2026-11-26' } });

    fireEvent.click(screen.getByRole('button', { name: /apply date range/i }));

    // Unsaved changes badge should appear
    await waitFor(() => {
      expect(screen.getByText(/unsaved changes/i)).toBeDefined();
    });

    // Click Save Changes
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(syncSpy).toHaveBeenCalledWith(
        101,
        [
          { startDate: '2026-11-03', endDate: '2026-11-08' },
          { startDate: '2026-11-14', endDate: '2026-11-18' },
          { startDate: '2026-11-21', endDate: '2026-11-22' },
          { startDate: '2026-11-25', endDate: '2026-11-26' },
        ],
        'initial-etag',
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/availability calendar saved successfully/i)).toBeDefined();
    });
  });

  it('selects all dates in between on clicking two dates and stages them for save', async () => {
    const mockListings = [{ id: 101, name: 'Marine Drive Unipole', status: 'ACTIVE' }];
    vi.spyOn(ownerListingApi, 'getListings').mockResolvedValue(mockListings);

    vi.spyOn(availabilityApi, 'getListingAvailability').mockResolvedValue({
      blocks: [],
      etag: 'initial-etag',
      today: '2026-11-06',
    });

    const syncSpy = vi.spyOn(availabilityApi, 'syncListingAvailability').mockResolvedValue({
      blocks: [
        { id: 10, startDate: '2026-11-20', endDate: '2026-11-24', blockType: 'OWNER_BLOCKED' },
      ],
      warnings: [],
      etag: 'new-etag',
      today: '2026-11-06',
    });

    renderDashboard();

    // Wait until listing is loaded and availability hydrated
    await waitFor(() => {
      expect(screen.getByText(/Marine Drive Unipole — Availability/i)).toBeDefined();
    });

    // Find day cell 20 and day cell 24
    const day20 = screen.getByText('20');
    const day24 = screen.getByText('24');

    // Click first date: 20
    fireEvent.click(day20);

    // Click second date: 24 (automatically selects 20 to 24 inclusive)
    fireEvent.click(day24);

    // Verify unsaved changes appear
    await waitFor(() => {
      expect(screen.getByText(/unsaved changes/i)).toBeDefined();
    });

    // Click Save Changes
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    // Verify that syncListingAvailability was called with contiguous range 2026-11-20 to 2026-11-24
    await waitFor(() => {
      expect(syncSpy).toHaveBeenCalledWith(
        101,
        expect.arrayContaining([
          expect.objectContaining({
            startDate: '2026-11-20',
            endDate: '2026-11-24',
          }),
        ]),
        'initial-etag',
      );
    });
  });

  it('displays 503 retry countdown banner on lock timeout', async () => {
    const mockListings = [{ id: 101, name: 'Marine Drive Unipole', status: 'ACTIVE' }];
    vi.spyOn(ownerListingApi, 'getListings').mockResolvedValue(mockListings);

    const getAvailSpy = vi.spyOn(availabilityApi, 'getListingAvailability').mockResolvedValue({
      blocks: [],
      etag: 'etag1',
      today: '2026-11-06',
    });

    vi.spyOn(availabilityApi, 'syncListingAvailability').mockRejectedValue({
      response: {
        status: 503,
        headers: { 'retry-after': '5' },
        data: { message: 'Calendar is busy' },
      },
    });

    renderDashboard();

    await waitFor(() => {
      expect(getAvailSpy).toHaveBeenCalledWith(101);
    });

    // Stage a date
    fireEvent.change(screen.getByLabelText(/from/i), { target: { value: '2026-11-15' } });
    fireEvent.change(screen.getByLabelText(/to/i), { target: { value: '2026-11-15' } });
    fireEvent.click(screen.getByRole('button', { name: /apply date range/i }));

    // Click Save Changes
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(screen.getByText(/calendar is currently busy/i)).toBeDefined();
    });
  });

  it('displays 412 modal on stale concurrent write', async () => {
    const mockListings = [{ id: 101, name: 'Marine Drive Unipole', status: 'ACTIVE' }];
    vi.spyOn(ownerListingApi, 'getListings').mockResolvedValue(mockListings);

    const getAvailSpy = vi.spyOn(availabilityApi, 'getListingAvailability').mockResolvedValue({
      blocks: [],
      etag: 'etag1',
      today: '2026-11-06',
    });

    vi.spyOn(availabilityApi, 'syncListingAvailability').mockRejectedValue({
      response: {
        status: 412,
        data: {
          message: 'Stale write',
          currentBlocks: [
            { id: 99, startDate: '2026-11-25', endDate: '2026-11-26', blockType: 'OWNER_BLOCKED' },
          ],
          etag: 'etag-stale-2',
          today: '2026-11-06',
        },
      },
    });

    renderDashboard();

    await waitFor(() => {
      expect(getAvailSpy).toHaveBeenCalledWith(101);
    });

    // Stage a date
    fireEvent.change(screen.getByLabelText(/from/i), { target: { value: '2026-11-15' } });
    fireEvent.change(screen.getByLabelText(/to/i), { target: { value: '2026-11-15' } });
    fireEvent.click(screen.getByRole('button', { name: /apply date range/i }));

    // Click Save Changes
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(screen.getByText(/calendar updated elsewhere/i)).toBeDefined();
      expect(screen.getByRole('button', { name: /load latest calendar/i })).toBeDefined();
    });
  });

  it('displays 409 alert banner on active booking hold conflict', async () => {
    const mockListings = [{ id: 101, name: 'Marine Drive Unipole', status: 'ACTIVE' }];
    vi.spyOn(ownerListingApi, 'getListings').mockResolvedValue(mockListings);

    const getAvailSpy = vi.spyOn(availabilityApi, 'getListingAvailability').mockResolvedValue({
      blocks: [],
      etag: 'etag1',
      today: '2026-11-06',
    });

    vi.spyOn(availabilityApi, 'syncListingAvailability').mockRejectedValue({
      response: {
        status: 409,
        data: {
          conflictingRanges: [{ startDate: '2026-11-15', endDate: '2026-11-15' }],
        },
      },
    });

    renderDashboard();

    await waitFor(() => {
      expect(getAvailSpy).toHaveBeenCalledWith(101);
    });

    // Stage a date
    fireEvent.change(screen.getByLabelText(/from/i), { target: { value: '2026-11-15' } });
    fireEvent.change(screen.getByLabelText(/to/i), { target: { value: '2026-11-15' } });
    fireEvent.click(screen.getByRole('button', { name: /apply date range/i }));

    // Click Save Changes
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(
        screen.getAllByText(/checkout in progress on selected dates/i).length,
      ).toBeGreaterThanOrEqual(1);
    });
  });

  it('updates minimum booking duration rule via ownerListingApi.updateListing', async () => {
    const mockListings = [
      {
        id: 101,
        name: 'Marine Drive Unipole',
        status: 'ACTIVE',
        minBookingValue: 1,
        minBookingUnit: 'MONTHS',
      },
    ];
    vi.spyOn(ownerListingApi, 'getListings').mockResolvedValue(mockListings);

    vi.spyOn(availabilityApi, 'getListingAvailability').mockResolvedValue({
      blocks: [],
      etag: 'etag1',
      today: '2026-11-06',
    });

    const updateSpy = vi.spyOn(ownerListingApi, 'updateListing').mockResolvedValue({
      id: 101,
      name: 'Marine Drive Unipole',
      minBookingValue: 3,
      minBookingUnit: 'WEEKS',
    });

    renderDashboard();

    // Wait until listing is loaded
    await waitFor(() => {
      expect(screen.getByText(/Marine Drive Unipole — Availability/i)).toBeDefined();
    });

    // Check initialized booking rule inputs
    const valueInput = screen.getByLabelText(/minimum duration value/i);
    const unitSelect = screen.getByLabelText(/minimum duration unit/i);

    expect(valueInput.value).toBe('1');
    expect(unitSelect.value).toBe('MONTHS');

    // Change to custom number (3) and unit (WEEKS)
    fireEvent.change(valueInput, { target: { value: '3' } });
    fireEvent.change(unitSelect, { target: { value: 'WEEKS' } });

    // Click Save button for booking rules
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(101, {
        minBookingValue: 3,
        minBookingUnit: 'WEEKS',
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/minimum booking duration saved: 3 weeks/i)).toBeDefined();
    });
  });
});
