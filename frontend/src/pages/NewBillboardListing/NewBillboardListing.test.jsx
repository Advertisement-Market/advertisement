import { describe, it, expect, vi, afterEach } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { TYPE_OPTIONS as WIZARD_TYPE_OPTIONS } from './steps';
import { TYPE_OPTIONS as REGISTER_TYPE_OPTIONS } from '../OwnerRegister/steps';
import { validate, NewBillboardListing } from './NewBillboardListing';
import { ownerListingApi } from '@/features/owner/ownerListingApi';

/**
 * Cross-stack canonical parity code list.
 * Mirrors backend enum constants in com.theadbasket.backend.lov.BillboardType,
 * verified on the backend by LovServiceTest.frontendCanonicalCodes_matchBillboardTypeEnumExactValueOf().
 * Keep these lists in exact synchronization.
 */
const BACKEND_CANONICAL_CODES = [
  'STATIC_HOARDING',
  'LED_DIGITAL',
  'UNIPOLE',
  'GANTRY',
  'BUS_SHELTER',
  'KIOSK',
  'DIGITAL_SCREEN',
  'OTHER',
];

describe('NewBillboardListing - Canonical Codes & Step 1 Validation', () => {
  describe('TYPE_OPTIONS Parity with Backend Enum', () => {
    it('ensures every option in wizard TYPE_OPTIONS has code and label', () => {
      expect(WIZARD_TYPE_OPTIONS.length).toBe(BACKEND_CANONICAL_CODES.length);
      WIZARD_TYPE_OPTIONS.forEach((opt) => {
        expect(opt.code).toBeDefined();
        expect(typeof opt.code).toBe('string');
        expect(opt.label).toBeDefined();
      });
      const wizardCodes = WIZARD_TYPE_OPTIONS.map((opt) => opt.code);
      expect(wizardCodes).toEqual(BACKEND_CANONICAL_CODES);
    });

    it('ensures OwnerRegister TYPE_OPTIONS matches wizard TYPE_OPTIONS canonical codes', () => {
      expect(REGISTER_TYPE_OPTIONS.length).toBe(BACKEND_CANONICAL_CODES.length);
      const registerCodes = REGISTER_TYPE_OPTIONS.map((opt) => opt.code);
      expect(registerCodes).toEqual(BACKEND_CANONICAL_CODES);
    });
  });

  describe('Wizard Step 1 Validation for Other Companion Text', () => {
    const validBaseData = {
      f_bbName: 'Prime Highway Billboard',
      f_bbAddr: '12 Express Way',
      f_bbCity: 'Mumbai',
      f_bbState: 'Maharashtra',
      f_bbPin: '400001',
      f_bbType: 'STATIC_HOARDING',
      f_bbWidth: '40',
      f_bbHeight: '20',
      f_facing: 'North',
      f_trafficType: 'Vehicular',
      f_audience: 'Commuters',
    };

    it('passes validation when all standard fields are present without Other', () => {
      const showToast = vi.fn();
      const isValid = validate(1, { data: validBaseData, showToast });
      expect(isValid).toBe(true);
      expect(showToast).not.toHaveBeenCalled();
    });

    it('blocks step 1 advance when f_bbType is OTHER but f_bbTypeOther is missing', () => {
      const showToast = vi.fn();
      const data = { ...validBaseData, f_bbType: 'OTHER', f_bbTypeOther: '' };
      const isValid = validate(1, { data, showToast });
      expect(isValid).toBe(false);
      expect(showToast).toHaveBeenCalledWith('Please describe the billboard type.', 'error');
    });

    it('blocks step 1 advance when f_bbTypeOther contains only zero-width or whitespace characters', () => {
      const showToast = vi.fn();
      const data = { ...validBaseData, f_bbType: 'OTHER', f_bbTypeOther: ' \u200B  ' };
      const isValid = validate(1, { data, showToast });
      expect(isValid).toBe(false);
      expect(showToast).toHaveBeenCalledWith('Please describe the billboard type.', 'error');
    });

    it('allows step 1 advance when f_bbType is OTHER and f_bbTypeOther is provided', () => {
      const showToast = vi.fn();
      const data = { ...validBaseData, f_bbType: 'OTHER', f_bbTypeOther: 'Skywalk Hoarding' };
      const isValid = validate(1, { data, showToast });
      expect(isValid).toBe(true);
      expect(showToast).not.toHaveBeenCalled();
    });

    it('blocks step 1 advance when f_trafficType is other but f_trafficOther is missing', () => {
      const showToast = vi.fn();
      const data = { ...validBaseData, f_trafficType: 'other', f_trafficOther: '   ' };
      const isValid = validate(1, { data, showToast });
      expect(isValid).toBe(false);
      expect(showToast).toHaveBeenCalledWith('Please describe the traffic type.', 'error');
    });

    it('allows step 1 advance when f_trafficType is other and f_trafficOther is provided', () => {
      const showToast = vi.fn();
      const data = { ...validBaseData, f_trafficType: 'other', f_trafficOther: 'Port Corridor' };
      const isValid = validate(1, { data, showToast });
      expect(isValid).toBe(true);
      expect(showToast).not.toHaveBeenCalled();
    });

    it('blocks step 1 advance when f_audience is other but f_audienceOther is missing', () => {
      const showToast = vi.fn();
      const data = { ...validBaseData, f_audience: 'other', f_audienceOther: '' };
      const isValid = validate(1, { data, showToast });
      expect(isValid).toBe(false);
      expect(showToast).toHaveBeenCalledWith('Please describe the audience type.', 'error');
    });

    it('allows step 1 advance when f_audience is other and f_audienceOther is provided', () => {
      const showToast = vi.fn();
      const data = { ...validBaseData, f_audience: 'other', f_audienceOther: 'Cruise passengers' };
      const isValid = validate(1, { data, showToast });
      expect(isValid).toBe(true);
      expect(showToast).not.toHaveBeenCalled();
    });

    it('validates 6-digit pincode starting with 1-9 and trims whitespace', () => {
      const showToast = vi.fn();
      // Valid pincode with whitespace
      expect(validate(1, { data: { ...validBaseData, f_bbPin: ' 400001 ' }, showToast })).toBe(
        true,
      );

      // Starting with 0 fails
      expect(validate(1, { data: { ...validBaseData, f_bbPin: '012345' }, showToast })).toBe(false);
      expect(showToast).toHaveBeenCalledWith(
        'Please enter a valid 6-digit billboard pincode.',
        'error',
      );

      // 5 digits fails
      expect(validate(1, { data: { ...validBaseData, f_bbPin: '40000' }, showToast })).toBe(false);

      // Non-digits fail
      expect(validate(1, { data: { ...validBaseData, f_bbPin: '40000a' }, showToast })).toBe(false);
    });
  });

  describe('NewBillboardListing Component Lifecycle & Edit Mode', () => {
    afterEach(() => {
      cleanup();
      vi.restoreAllMocks();
    });

    it('redirects to dashboard when listing ID is not numeric', async () => {
      render(
        <MemoryRouter initialEntries={['/owners/listings/not-a-number/edit']}>
          <Routes>
            <Route path="/owners/listings/:id/edit" element={<NewBillboardListing />} />
            <Route
              path="/owners/dashboard"
              element={<div data-testid="dashboard-page">Dashboard</div>}
            />
          </Routes>
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-page')).toBeDefined();
      });
    });

    it('fetches listing and pre-fills form in edit mode', async () => {
      const mockListing = {
        id: 42,
        name: 'Bandra Reclamation Unipole',
        address: 'Bandra West',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400050',
        type: 'UNIPOLE',
        widthFt: 40,
        heightFt: 20,
        facing: 'WEST',
        trafficType: 'VEHICULAR',
        audienceType: 'COMMUTERS',
        startPrice: 200000,
        minBookingValue: 1,
        minBookingUnit: 'MONTHS',
      };

      const getListingSpy = vi
        .spyOn(ownerListingApi, 'getListing')
        .mockResolvedValueOnce(mockListing);

      render(
        <MemoryRouter initialEntries={['/owners/listings/42/edit']}>
          <Routes>
            <Route path="/owners/listings/:id/edit" element={<NewBillboardListing />} />
          </Routes>
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByText('Edit Billboard Listing')).toBeDefined();
        expect(screen.getByDisplayValue('Bandra Reclamation Unipole')).toBeDefined();
      });

      expect(getListingSpy).toHaveBeenCalledWith(
        '42',
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        }),
      );
    });

    it('redirects to dashboard when getListing rejects with an error', async () => {
      vi.spyOn(ownerListingApi, 'getListing').mockRejectedValueOnce(new Error('Server error'));

      render(
        <MemoryRouter initialEntries={['/owners/listings/99/edit']}>
          <Routes>
            <Route path="/owners/listings/:id/edit" element={<NewBillboardListing />} />
            <Route
              path="/owners/dashboard"
              element={<div data-testid="dashboard-page">Dashboard</div>}
            />
          </Routes>
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-page')).toBeDefined();
      });
    });

    it('ignores aborted/canceled requests without redirecting to dashboard', async () => {
      const canceledError = new Error('Request canceled');
      canceledError.name = 'CanceledError';
      vi.spyOn(ownerListingApi, 'getListing').mockRejectedValueOnce(canceledError);

      render(
        <MemoryRouter initialEntries={['/owners/listings/99/edit']}>
          <Routes>
            <Route path="/owners/listings/:id/edit" element={<NewBillboardListing />} />
            <Route
              path="/owners/dashboard"
              element={<div data-testid="dashboard-page">Dashboard</div>}
            />
          </Routes>
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('listing-loading')).toBeDefined();
      });

      // Dashboard should NOT be rendered
      expect(screen.queryByTestId('dashboard-page')).toBeNull();
    });

    it('falls back to mock listing in dev mode when getListing fails', async () => {
      vi.spyOn(ownerListingApi, 'getListing').mockRejectedValueOnce(new Error('Network error'));

      render(
        <MemoryRouter initialEntries={['/owners/listings/1/edit']}>
          <Routes>
            <Route path="/owners/listings/:id/edit" element={<NewBillboardListing />} />
          </Routes>
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByText('Edit Billboard Listing')).toBeDefined();
        expect(screen.getByDisplayValue('BKC LED Screen')).toBeDefined();
        expect(screen.getByDisplayValue('Plot C-59, G Block, Bandra Kurla Complex')).toBeDefined();
      });
    });

    it('pre-fills form immediately from location.state.listing', async () => {
      const stateListing = {
        id: 77,
        name: 'Worli Sea Link Digital',
        addressLine1: 'Worli Sea Face Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400018',
        type: 'LED_DIGITAL',
        widthFt: 50,
        heightFt: 25,
        facing: 'North',
        trafficType: 'Highway',
        audienceType: 'Commuters',
        startPrice: 750000,
        minBookingValue: 3,
        minBookingUnit: 'MONTHS',
      };

      vi.spyOn(ownerListingApi, 'getListing').mockResolvedValueOnce(stateListing);

      render(
        <MemoryRouter
          initialEntries={[
            {
              pathname: '/owners/listings/77/edit',
              state: { listing: stateListing },
            },
          ]}
        >
          <Routes>
            <Route path="/owners/listings/:id/edit" element={<NewBillboardListing />} />
          </Routes>
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByText('Edit Billboard Listing')).toBeDefined();
        expect(screen.getByDisplayValue('Worli Sea Link Digital')).toBeDefined();
        expect(screen.getByDisplayValue('Worli Sea Face Road')).toBeDefined();
        expect(screen.getByDisplayValue('400018')).toBeDefined();
        expect(screen.getByDisplayValue('50')).toBeDefined();
        expect(screen.getByDisplayValue('25')).toBeDefined();
      });
    });

    it('displays acknowledgement success screen and Back to Dashboard button on submit', async () => {
      const stateListing = {
        id: 88,
        name: 'Juhu Tara Road Unipole',
        addressLine1: 'Near Juhu Beach',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400049',
        type: 'UNIPOLE',
        widthFt: 30,
        heightFt: 15,
        facing: 'North',
        trafficType: 'City / Urban',
        audienceType: 'Shoppers',
        startPrice: 350000,
        minBookingValue: 1,
        minBookingUnit: 'MONTHS',
      };

      vi.spyOn(ownerListingApi, 'getListing').mockResolvedValueOnce(stateListing);
      vi.spyOn(ownerListingApi, 'updateListing').mockResolvedValueOnce({ id: 88 });
      window.scrollTo = vi.fn();

      const { fireEvent } = await import('@testing-library/react');

      render(
        <MemoryRouter
          initialEntries={[
            {
              pathname: '/owners/listings/88/edit',
              state: { listing: stateListing },
            },
          ]}
        >
          <Routes>
            <Route path="/owners/listings/:id/edit" element={<NewBillboardListing />} />
          </Routes>
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByText('Edit Billboard Listing')).toBeDefined();
      });

      // Step 1 -> Step 2
      fireEvent.click(screen.getByRole('button', { name: /continue to pricing & availability/i }));

      // Step 2 -> Step 3
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /continue to media uploads/i })).toBeDefined();
      });
      fireEvent.click(screen.getByRole('button', { name: /continue to media uploads/i }));

      // Step 3 -> Submit
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /submit billboard listing/i })).toBeDefined();
      });
      fireEvent.click(screen.getByRole('button', { name: /submit billboard listing/i }));

      // Should display acknowledgement success screen without white screen
      await waitFor(() => {
        expect(screen.getByText('Billboard Updated!')).toBeDefined();
        expect(
          screen.getByText('Your billboard listing has been successfully updated.'),
        ).toBeDefined();
        expect(screen.getByText('Changes saved')).toBeDefined();
        expect(screen.getByText('Marketplace updated')).toBeDefined();
        const dashboardBtn = screen.getByRole('link', { name: /back to dashboard/i });
        expect(dashboardBtn).toBeDefined();
        expect(dashboardBtn.getAttribute('href')).toBe('/owners/dashboard?tab=listings');
      });
    });
  });
});
