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

  it('sets isLoading to true while fetching availability and shows Refreshing indicator', async () => {
    const mockListings = [{ id: 101, name: 'Marine Drive Unipole', status: 'ACTIVE' }];
    vi.spyOn(ownerListingApi, 'getListings').mockResolvedValue(mockListings);

    let resolveAvailability;
    const pendingPromise = new Promise((resolve) => {
      resolveAvailability = resolve;
    });

    vi.spyOn(availabilityApi, 'getListingAvailability').mockReturnValue(pendingPromise);

    renderDashboard();

    // While request is in-flight, Refreshing indicator is displayed and Save button is disabled
    await waitFor(() => {
      expect(screen.getByText(/refreshing\.\.\./i)).toBeDefined();
    });

    const saveBtn = screen.getByRole('button', { name: /save changes/i });
    expect(saveBtn.disabled).toBe(true);

    // Resolve request
    resolveAvailability({
      blocks: [],
      etag: 'etag123',
      today: '2026-11-06',
    });

    // Refreshing indicator disappears after resolution
    await waitFor(() => {
      expect(screen.queryByText(/refreshing\.\.\./i)).toBeNull();
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

  it('preserves multi-cell drag selection across mouseup and trailing click', async () => {
    const mockListings = [{ id: 101, name: 'Marine Drive Unipole', status: 'ACTIVE' }];
    vi.spyOn(ownerListingApi, 'getListings').mockResolvedValue(mockListings);

    vi.spyOn(availabilityApi, 'getListingAvailability').mockResolvedValue({
      blocks: [],
      etag: 'initial-etag',
      today: '2026-11-06',
    });

    const syncSpy = vi.spyOn(availabilityApi, 'syncListingAvailability').mockResolvedValue({
      blocks: [
        { id: 10, startDate: '2026-11-10', endDate: '2026-11-14', blockType: 'OWNER_BLOCKED' },
      ],
      warnings: [],
      etag: 'new-etag',
      today: '2026-11-06',
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/Marine Drive Unipole — Availability/i)).toBeDefined();
    });

    const day10 = screen.getByText('10');
    const day14 = screen.getByText('14');

    // Drag from 10 to 14
    fireEvent.mouseDown(day10);
    fireEvent.mouseEnter(day14);

    // Release mouse
    fireEvent.mouseUp(document);

    // Trailing browser click on the release cell
    fireEvent.click(day14);

    // Click Apply button to stage the range
    fireEvent.click(screen.getByRole('button', { name: /^apply$/i }));

    // Unsaved changes badge should appear
    await waitFor(() => {
      expect(screen.getByText(/unsaved changes/i)).toBeDefined();
    });

    // Save changes
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(syncSpy).toHaveBeenCalledWith(
        101,
        [
          { startDate: '2026-11-10', endDate: '2026-11-14' },
        ],
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

  it('updates minimum booking duration rule via ownerListingApi.updateListing and persists across billboard switching', async () => {
    const mockListings = [
      {
        id: 101,
        name: 'Marine Drive Unipole',
        status: 'ACTIVE',
        minBookingValue: 1,
        minBookingUnit: 'MONTHS',
      },
      {
        id: 102,
        name: 'Bandra Digital LED',
        status: 'ACTIVE',
        minBookingValue: 5,
        minBookingUnit: 'DAYS',
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

    // Switch to listing 102 in billboard selector
    const billboardSelect = screen.getByRole('combobox', { name: /select billboard listing/i });
    fireEvent.change(billboardSelect, { target: { value: '102' } });

    await waitFor(() => {
      expect(screen.getByText(/Bandra Digital LED — Availability/i)).toBeDefined();
    });
    expect(screen.getByLabelText(/minimum duration value/i).value).toBe('5');
    expect(screen.getByLabelText(/minimum duration unit/i).value).toBe('DAYS');

    // Switch back to listing 101
    fireEvent.change(billboardSelect, { target: { value: '101' } });

    await waitFor(() => {
      expect(screen.getByText(/Marine Drive Unipole — Availability/i)).toBeDefined();
    });

    // Verify inputs retain updated values (3 WEEKS) without reverting to pre-save values
    expect(screen.getByLabelText(/minimum duration value/i).value).toBe('3');
    expect(screen.getByLabelText(/minimum duration unit/i).value).toBe('WEEKS');
  });
});
