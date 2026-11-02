import { describe, it, expect, vi, afterEach } from 'vitest';
import { cleanup, render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { TYPE_OPTIONS as WIZARD_TYPE_OPTIONS, ListingStep3 } from './steps';
import { RegisterProvider } from '@/features/register';
import { TYPE_OPTIONS as REGISTER_TYPE_OPTIONS } from '../OwnerRegister/steps';
import { validate, NewBillboardListing, createSubmitHandler } from './NewBillboardListing';
import { FieldFormatError, MSG } from '@/lib/validators';
import { ownerListingApi } from '@/features/owner/ownerListingApi';
import { ROUTES } from '@/lib/routes';

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
      // Blank fails with specific message
      expect(validate(1, { data: { ...validBaseData, f_bbPin: '' }, showToast })).toBe(false);
      expect(showToast).toHaveBeenCalledWith('Please enter the billboard pincode.', 'error');

      // Valid pincode with whitespace
      expect(validate(1, { data: { ...validBaseData, f_bbPin: ' 400001 ' }, showToast })).toBe(
        true,
      );

      // Starting with 0 fails
      expect(validate(1, { data: { ...validBaseData, f_bbPin: '012345' }, showToast })).toBe(false);
      expect(showToast).toHaveBeenCalledWith(
        'Please enter a valid 6-digit billboard pincode (cannot start with 0).',
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
            <Route path={ROUTES.editBillboardListingPath} element={<NewBillboardListing />} />
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
            <Route path={ROUTES.editBillboardListingPath} element={<NewBillboardListing />} />
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

    it('displays inline error on blur when pincode starts with 0 (012345)', async () => {
      render(
        <MemoryRouter initialEntries={[ROUTES.newBillboardListing]}>
          <Routes>
            <Route path={ROUTES.newBillboardListing} element={<NewBillboardListing />} />
          </Routes>
        </MemoryRouter>,
      );

      const pinInput = screen.getByPlaceholderText('400053');
      fireEvent.change(pinInput, { target: { value: '012345' } });
      fireEvent.blur(pinInput);

      expect(pinInput.classList.contains('invalid')).toBe(true);
      expect(screen.getByText(MSG.pincode)).toBeDefined();
    });

    it('hydrates legacy "000000" pincode as empty string in edit mode', async () => {
      const legacyListing = {
        id: 77,
        name: 'Legacy Billboard',
        addressLine1: 'Old Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '000000',
        type: 'LED_DIGITAL',
        widthFt: 30,
        heightFt: 15,
        facing: 'NORTH',
        startPrice: 200000,
        minBookingValue: 1,
        minBookingUnit: 'MONTHS',
      };

      vi.spyOn(ownerListingApi, 'getListing').mockResolvedValueOnce({
        data: legacyListing,
      });

      render(
        <MemoryRouter initialEntries={['/owners/listings/77/edit']}>
          <Routes>
            <Route path={ROUTES.editBillboardListingPath} element={<NewBillboardListing />} />
          </Routes>
        </MemoryRouter>,
      );

      // Await proof that async data hydration completed by checking non-empty hydrated fields
      await waitFor(() => {
        expect(screen.getByDisplayValue('Legacy Billboard')).toBeDefined();
        expect(screen.getByDisplayValue('Old Road')).toBeDefined();
      });

      const pinInput = screen.getByPlaceholderText('400053');
      // Must be empty string, blanking out the legacy "000000" placeholder
      expect(pinInput.value).toBe('');
    });

    it('redirects to dashboard when getListing rejects with an error', async () => {
      vi.spyOn(ownerListingApi, 'getListing').mockRejectedValueOnce(new Error('Server error'));

      render(
        <MemoryRouter initialEntries={['/owners/listings/99/edit']}>
          <Routes>
            <Route path={ROUTES.editBillboardListingPath} element={<NewBillboardListing />} />
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
            <Route path={ROUTES.editBillboardListingPath} element={<NewBillboardListing />} />
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
            <Route path={ROUTES.editBillboardListingPath} element={<NewBillboardListing />} />
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
            <Route path={ROUTES.editBillboardListingPath} element={<NewBillboardListing />} />
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
        status: 'ACTIVE',
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
        media: [
          { id: 801, category: 'DAY_PHOTO', storageKey: 'k1', isCover: true, displayOrder: 1 },
          { id: 802, category: 'DAY_PHOTO', storageKey: 'k2', isCover: false, displayOrder: 2 },
        ],
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
            <Route path={ROUTES.editBillboardListingPath} element={<NewBillboardListing />} />
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

    it('invokes submitListing on edit submit when listing status was REJECTED', async () => {
      const stateListing = {
        id: 90,
        name: 'Rejected Billboard To Fix',
        status: 'REJECTED',
        addressLine1: 'Near Metro Station',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400053',
        type: 'UNIPOLE',
        widthFt: 30,
        heightFt: 15,
        facing: 'North',
        trafficType: 'City / Urban',
        audienceType: 'Shoppers',
        startPrice: 350000,
        minBookingValue: 1,
        minBookingUnit: 'MONTHS',
        media: [
          { id: 901, category: 'DAY_PHOTO', storageKey: 'k1', isCover: true, displayOrder: 1 },
          { id: 902, category: 'DAY_PHOTO', storageKey: 'k2', isCover: false, displayOrder: 2 },
        ],
      };

      vi.spyOn(ownerListingApi, 'getListing').mockResolvedValueOnce(stateListing);
      vi.spyOn(ownerListingApi, 'updateListing').mockResolvedValueOnce({ id: 90, status: 'DRAFT' });
      const submitSpy = vi
        .spyOn(ownerListingApi, 'submitListing')
        .mockResolvedValueOnce({ id: 90, status: 'PENDING_APPROVAL' });
      window.scrollTo = vi.fn();

      const { fireEvent } = await import('@testing-library/react');

      render(
        <MemoryRouter
          initialEntries={[
            {
              pathname: '/owners/listings/90/edit',
              state: { listing: stateListing },
            },
          ]}
        >
          <Routes>
            <Route path={ROUTES.editBillboardListingPath} element={<NewBillboardListing />} />
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

      await waitFor(() => {
        expect(ownerListingApi.updateListing).toHaveBeenCalledWith('90', expect.any(Object));
        expect(submitSpy).toHaveBeenCalledWith('90');
        expect(screen.getByText('Billboard Updated!')).toBeDefined();
        expect(
          screen.getByText(
            'Your billboard listing has been updated and submitted for verification. It will be live on the marketplace once verified.',
          ),
        ).toBeDefined();
      });
    });

    it('does not invoke submitListing on edit submit when listing status is DRAFT (preserves partial draft progress)', async () => {
      const stateListing = {
        id: 91,
        name: 'Draft Billboard Progress',
        status: 'DRAFT',
        addressLine1: 'Linking Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400050',
        type: 'UNIPOLE',
        widthFt: 25,
        heightFt: 12,
        facing: 'North',
        trafficType: 'City / Urban',
        audienceType: 'Shoppers',
        startPrice: 250000,
        minBookingValue: 1,
        minBookingUnit: 'MONTHS',
      };

      vi.spyOn(ownerListingApi, 'getListing').mockResolvedValueOnce(stateListing);
      vi.spyOn(ownerListingApi, 'updateListing').mockResolvedValueOnce({ id: 91, status: 'DRAFT' });
      const submitSpy = vi.spyOn(ownerListingApi, 'submitListing');
      window.scrollTo = vi.fn();

      const { fireEvent } = await import('@testing-library/react');

      render(
        <MemoryRouter
          initialEntries={[
            {
              pathname: '/owners/listings/91/edit',
              state: { listing: stateListing },
            },
          ]}
        >
          <Routes>
            <Route path={ROUTES.editBillboardListingPath} element={<NewBillboardListing />} />
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
        expect(screen.getByRole('button', { name: /save draft changes/i })).toBeDefined();
      });
      fireEvent.click(screen.getByRole('button', { name: /save draft changes/i }));

      await waitFor(() => {
        expect(ownerListingApi.updateListing).toHaveBeenCalledWith('91', expect.any(Object));
        expect(submitSpy).not.toHaveBeenCalled();
        expect(screen.getByText('Billboard Updated!')).toBeDefined();
        expect(
          screen.getByText('Your billboard listing has been successfully updated.'),
        ).toBeDefined();
      });
    });

    it('reloading into a DRAFT listing allows checking review submission to submit for review on save', async () => {
      const stateListing = {
        id: 94,
        name: 'Reloaded Draft Listing',
        status: 'DRAFT',
        addressLine1: 'Near Metro Station',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400053',
        type: 'UNIPOLE',
        widthFt: 30,
        heightFt: 15,
        facing: 'North',
        trafficType: 'City / Urban',
        audienceType: 'Commuters',
        startPrice: 85000,
        minBookingValue: 1,
        minBookingUnit: 'WEEKS',
        media: [
          { id: 101, category: 'DAY_PHOTO', storageKey: 'k1', isCover: true, displayOrder: 1 },
          { id: 102, category: 'DAY_PHOTO', storageKey: 'k2', isCover: false, displayOrder: 2 },
        ],
      };

      vi.spyOn(ownerListingApi, 'getListing').mockResolvedValueOnce(stateListing);
      vi.spyOn(ownerListingApi, 'updateListing').mockResolvedValueOnce({ id: 94, status: 'DRAFT' });
      vi.spyOn(ownerListingApi, 'submitListing').mockResolvedValueOnce({
        id: 94,
        status: 'PENDING_APPROVAL',
      });

      render(
        <MemoryRouter
          initialEntries={[
            {
              pathname: '/owners/listings/94/edit',
              state: { listing: stateListing },
            },
          ]}
        >
          <Routes>
            <Route path={ROUTES.editBillboardListingPath} element={<NewBillboardListing />} />
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

      // Step 3: verify DRAFT review submission toggle is present, check it, and submit
      await waitFor(() => {
        expect(screen.getByLabelText(/submit for review once saved/i)).toBeDefined();
      });
      const checkbox = screen.getByLabelText(/submit for review once saved/i);
      expect(checkbox.checked).toBe(false);
      fireEvent.click(checkbox);
      expect(checkbox.checked).toBe(true);

      const submitBtn = screen.getByRole('button', { name: /save & submit for review/i });
      expect(submitBtn).toBeDefined();
      expect(submitBtn.disabled).toBe(false);
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(ownerListingApi.updateListing).toHaveBeenCalledWith('94', expect.any(Object));
        expect(ownerListingApi.submitListing).toHaveBeenCalledWith('94');
        expect(screen.getByText('Billboard Updated!')).toBeDefined();
      });
    });

    it('editing a DRAFT listing with fewer than 2 day photos disables Save & Submit for Review and displays requirement notice', async () => {
      const stateListing = {
        id: 95,
        name: 'Incomplete Draft Billboard',
        status: 'DRAFT',
        addressLine1: 'Near Metro Station',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400053',
        type: 'UNIPOLE',
        widthFt: 30,
        heightFt: 15,
        facing: 'North',
        trafficType: 'City / Urban',
        audienceType: 'Commuters',
        startPrice: 85000,
        minBookingValue: 1,
        minBookingUnit: 'WEEKS',
        media: [],
      };

      vi.spyOn(ownerListingApi, 'getListing').mockResolvedValueOnce(stateListing);

      render(
        <MemoryRouter
          initialEntries={[
            {
              pathname: '/owners/listings/95/edit',
              state: { listing: stateListing },
            },
          ]}
        >
          <Routes>
            <Route path={ROUTES.editBillboardListingPath} element={<NewBillboardListing />} />
          </Routes>
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByText('Edit Billboard Listing')).toBeDefined();
      });

      // Advance to Step 3
      fireEvent.click(screen.getByRole('button', { name: /continue to pricing & availability/i }));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /continue to media uploads/i })).toBeDefined();
      });
      fireEvent.click(screen.getByRole('button', { name: /continue to media uploads/i }));

      // Step 3: By default checkbox is unchecked, button is "Save Draft Changes ->" and ENABLED
      await waitFor(() => {
        expect(screen.getByLabelText(/submit for review once saved/i)).toBeDefined();
      });
      const saveDraftBtn = screen.getByRole('button', { name: /save draft changes/i });
      expect(saveDraftBtn.disabled).toBe(false);

      // Check "Submit for Review once saved"
      const checkbox = screen.getByLabelText(/submit for review once saved/i);
      fireEvent.click(checkbox);
      expect(checkbox.checked).toBe(true);

      // Verify requirement warning appears and button becomes disabled
      await waitFor(() => {
        expect(
          screen.getByText(/at least 2 daylight photos are required to submit for review/i),
        ).toBeDefined();
      });
      const submitBtn = screen.getByRole('button', { name: /save & submit for review/i });
      expect(submitBtn.disabled).toBe(true);

      // Uncheck box -> returns to enabled draft save
      fireEvent.click(checkbox);
      expect(checkbox.checked).toBe(false);
      expect(
        screen.queryByText(/at least 2 daylight photos are required to submit for review/i),
      ).toBeNull();
      expect(screen.getByRole('button', { name: /save draft changes/i }).disabled).toBe(false);
    });

    it('disables submit button proactively on brand-new listing until at least 2 day photos are uploaded', () => {
      globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock');
      globalThis.URL.revokeObjectURL = vi.fn();

      const { unmount } = render(
        <RegisterProvider totalSteps={3} initialData={{ status: '' }}>
          <ListingStep3 />
        </RegisterProvider>,
      );

      const submitBtn = screen.getByRole('button', { name: /submit billboard listing/i });
      expect(submitBtn.disabled).toBe(true);

      unmount();

      // When 2 day photos are provided, the submit button is enabled
      render(
        <RegisterProvider
          totalSteps={3}
          initialData={{
            status: '',
            f_dayPhotos: [new File(['a'], 'day1.jpg'), new File(['b'], 'day2.jpg')],
          }}
        >
          <ListingStep3 />
        </RegisterProvider>,
      );

      const enabledBtn = screen.getByRole('button', { name: /submit billboard listing/i });
      expect(enabledBtn.disabled).toBe(false);
    });

    it('surfaces error banner and remains on Step 3 when submitListing fails after updating a draft', async () => {
      const stateListing = {
        id: 97,
        name: 'Draft Billboard Submit Fail',
        status: 'DRAFT',
        addressLine1: 'Near Metro Station',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400053',
        type: 'UNIPOLE',
        widthFt: 30,
        heightFt: 15,
        facing: 'North',
        trafficType: 'City / Urban',
        audienceType: 'Commuters',
        startPrice: 85000,
        minBookingValue: 1,
        minBookingUnit: 'WEEKS',
        media: [
          { id: 201, category: 'DAY_PHOTO', storageKey: 'k1', isCover: true, displayOrder: 1 },
          { id: 202, category: 'DAY_PHOTO', storageKey: 'k2', isCover: false, displayOrder: 2 },
        ],
      };

      vi.spyOn(ownerListingApi, 'getListing').mockResolvedValueOnce(stateListing);
      vi.spyOn(ownerListingApi, 'updateListing').mockResolvedValueOnce({ id: 97, status: 'DRAFT' });
      vi.spyOn(ownerListingApi, 'submitListing').mockRejectedValueOnce({
        response: {
          data: {
            message: 'Server verification rejected submit.',
            errorCode: 'INVALID_STATE',
          },
        },
      });

      render(
        <MemoryRouter
          initialEntries={[
            {
              pathname: '/owners/listings/97/edit',
              state: { listing: stateListing },
            },
          ]}
        >
          <Routes>
            <Route path={ROUTES.editBillboardListingPath} element={<NewBillboardListing />} />
          </Routes>
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByText('Edit Billboard Listing')).toBeDefined();
      });

      // Step 1 -> Step 2 -> Step 3
      fireEvent.click(screen.getByRole('button', { name: /continue to pricing & availability/i }));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /continue to media uploads/i })).toBeDefined();
      });
      fireEvent.click(screen.getByRole('button', { name: /continue to media uploads/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/submit for review once saved/i)).toBeDefined();
      });
      fireEvent.click(screen.getByLabelText(/submit for review once saved/i));

      const submitBtn = screen.getByRole('button', { name: /save & submit for review/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/changes saved, but submitting for review failed/i)).toBeDefined();
        // User remains on Step 3, success screen is not shown
        expect(screen.queryByText('Billboard Updated!')).toBeNull();
      });
    });

    it('editing an ACTIVE listing displays live listing notice warning only when media changes are pending', async () => {
      const stateListing = {
        id: 96,
        name: 'Live Active Billboard',
        status: 'ACTIVE',
        addressLine1: 'Near Metro Station',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400053',
        type: 'UNIPOLE',
        widthFt: 30,
        heightFt: 15,
        facing: 'North',
        trafficType: 'City / Urban',
        audienceType: 'Commuters',
        startPrice: 85000,
        minBookingValue: 1,
        minBookingUnit: 'WEEKS',
        media: [
          { id: 301, category: 'DAY_PHOTO', storageKey: 'k1', isCover: true, displayOrder: 1 },
          { id: 302, category: 'DAY_PHOTO', storageKey: 'k2', isCover: false, displayOrder: 2 },
        ],
      };

      vi.spyOn(ownerListingApi, 'getListing').mockResolvedValueOnce(stateListing);

      render(
        <MemoryRouter
          initialEntries={[
            {
              pathname: '/owners/listings/96/edit',
              state: { listing: stateListing },
            },
          ]}
        >
          <Routes>
            <Route path={ROUTES.editBillboardListingPath} element={<NewBillboardListing />} />
          </Routes>
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByText('Edit Billboard Listing')).toBeDefined();
      });

      // Advance to Step 3
      fireEvent.click(screen.getByRole('button', { name: /continue to pricing & availability/i }));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /continue to media uploads/i })).toBeDefined();
      });
      fireEvent.click(screen.getByRole('button', { name: /continue to media uploads/i }));

      // Step 3: verify WarningBanner for ACTIVE listing is NOT present initially (zero pending changes)
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /submit billboard listing/i })).toBeDefined();
      });
      expect(screen.queryByText(/Live Listing Notice:/i)).toBeNull();

      // Stage a removal of an existing photo
      const removeButtons = screen.getAllByRole('button', { name: /remove photo/i });
      expect(removeButtons.length).toBeGreaterThan(0);
      fireEvent.click(removeButtons[0]);

      // Now pending changes exist -> WarningBanner appears!
      await waitFor(() => {
        expect(screen.getByText(/Live Listing Notice:/i)).toBeDefined();
        expect(
          screen.getByText(/unpublish this active billboard from the marketplace/i),
        ).toBeDefined();
      });
    });

    it('does not invoke submitListing on edit submit when listing status is ACTIVE', async () => {
      const stateListing = {
        id: 92,
        name: 'Active Billboard Edit',
        status: 'ACTIVE',
        addressLine1: 'Worli Sea Face',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400018',
        type: 'LED_DIGITAL',
        widthFt: 40,
        heightFt: 20,
        facing: 'North',
        trafficType: 'Highway',
        audienceType: 'Commuters',
        startPrice: 500000,
        minBookingValue: 1,
        minBookingUnit: 'MONTHS',
        media: [
          { id: 901, category: 'DAY_PHOTO', storageKey: 'k1', isCover: true, displayOrder: 1 },
          { id: 902, category: 'DAY_PHOTO', storageKey: 'k2', isCover: false, displayOrder: 2 },
        ],
      };

      vi.spyOn(ownerListingApi, 'getListing').mockResolvedValueOnce(stateListing);
      vi.spyOn(ownerListingApi, 'updateListing').mockResolvedValueOnce({
        id: 92,
        status: 'ACTIVE',
      });
      const submitSpy = vi.spyOn(ownerListingApi, 'submitListing');
      window.scrollTo = vi.fn();

      const { fireEvent } = await import('@testing-library/react');

      render(
        <MemoryRouter
          initialEntries={[
            {
              pathname: '/owners/listings/92/edit',
              state: { listing: stateListing },
            },
          ]}
        >
          <Routes>
            <Route path={ROUTES.editBillboardListingPath} element={<NewBillboardListing />} />
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

      await waitFor(() => {
        expect(ownerListingApi.updateListing).toHaveBeenCalledWith('92', expect.any(Object));
        expect(submitSpy).not.toHaveBeenCalled();
        expect(screen.getByText('Billboard Updated!')).toBeDefined();
        expect(
          screen.getByText('Your billboard listing has been successfully updated.'),
        ).toBeDefined();
      });
    });

    it('surfaces distinct retry error when submitListing fails after updateListing succeeded on REJECTED listing', async () => {
      const stateListing = {
        id: 93,
        name: 'Rejected Billboard Submit Failure',
        status: 'REJECTED',
        addressLine1: 'Near Metro Station',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400053',
        type: 'UNIPOLE',
        widthFt: 30,
        heightFt: 15,
        facing: 'North',
        trafficType: 'City / Urban',
        audienceType: 'Shoppers',
        startPrice: 350000,
        minBookingValue: 1,
        minBookingUnit: 'MONTHS',
        media: [
          { id: 931, category: 'DAY_PHOTO', storageKey: 'k1', isCover: true, displayOrder: 1 },
          { id: 932, category: 'DAY_PHOTO', storageKey: 'k2', isCover: false, displayOrder: 2 },
        ],
      };

      vi.spyOn(ownerListingApi, 'getListing').mockResolvedValueOnce(stateListing);
      vi.spyOn(ownerListingApi, 'updateListing').mockResolvedValueOnce({ id: 93, status: 'DRAFT' });
      vi.spyOn(ownerListingApi, 'submitListing').mockRejectedValueOnce({
        response: {
          status: 400,
          data: { message: 'At least 2 day photos are required to submit a billboard listing' },
        },
      });
      window.scrollTo = vi.fn();

      const { fireEvent } = await import('@testing-library/react');

      render(
        <MemoryRouter
          initialEntries={[
            {
              pathname: '/owners/listings/93/edit',
              state: { listing: stateListing },
            },
          ]}
        >
          <Routes>
            <Route path={ROUTES.editBillboardListingPath} element={<NewBillboardListing />} />
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

      await waitFor(() => {
        expect(ownerListingApi.updateListing).toHaveBeenCalledWith('93', expect.any(Object));
        expect(screen.getByText(/Changes saved, but submitting for review failed/i)).toBeDefined();
        expect(screen.getByText(/At least 2 day photos are required/i)).toBeDefined();
        // Success screen must NOT be displayed
        expect(screen.queryByText('Billboard Updated!')).toBeNull();
      });
    });

    it('propagates network errors on submit and does not display success screen', async () => {
      const stateListing = {
        id: 99,
        name: 'Andheri West Screen',
        addressLine1: 'SV Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400058',
        type: 'LED_DIGITAL',
        widthFt: 20,
        heightFt: 10,
        facing: 'North',
        trafficType: 'City / Urban',
        audienceType: 'Shoppers',
        startPrice: 200000,
        minBookingValue: 1,
        minBookingUnit: 'MONTHS',
        media: [
          { id: 991, category: 'DAY_PHOTO', storageKey: 'k1', isCover: true, displayOrder: 1 },
          { id: 992, category: 'DAY_PHOTO', storageKey: 'k2', isCover: false, displayOrder: 2 },
        ],
      };

      vi.spyOn(ownerListingApi, 'getListing').mockResolvedValueOnce(stateListing);
      const networkError = new Error('Network Error');
      vi.spyOn(ownerListingApi, 'updateListing').mockRejectedValueOnce(networkError);
      window.scrollTo = vi.fn();

      const { fireEvent } = await import('@testing-library/react');

      render(
        <MemoryRouter
          initialEntries={[
            {
              pathname: '/owners/listings/99/edit',
              state: { listing: stateListing },
            },
          ]}
        >
          <Routes>
            <Route path={ROUTES.editBillboardListingPath} element={<NewBillboardListing />} />
          </Routes>
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByText('Edit Billboard Listing')).toBeDefined();
      });

      fireEvent.click(screen.getByRole('button', { name: /continue to pricing & availability/i }));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /continue to media uploads/i })).toBeDefined();
      });
      fireEvent.click(screen.getByRole('button', { name: /continue to media uploads/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /submit billboard listing/i })).toBeDefined();
      });
      fireEvent.click(screen.getByRole('button', { name: /submit billboard listing/i }));

      // Network error must NOT be swallowed: success screen should not render
      await waitFor(() => {
        expect(screen.queryByText('Billboard Updated!')).toBeNull();
      });
    });

    it('blocks wizard progression when f_bbGroundHeight has invalid text (15abc)', async () => {
      const stateListing = {
        id: 99,
        name: 'Andheri West Screen',
        addressLine1: 'SV Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400058',
        type: 'LED_DIGITAL',
        widthFt: 20,
        heightFt: 10,
        groundHeightFt: 15,
        facing: 'North',
        trafficType: 'City / Urban',
        audienceType: 'Shoppers',
        startPrice: 200000,
        minBookingValue: 1,
        minBookingUnit: 'MONTHS',
      };

      vi.spyOn(ownerListingApi, 'getListing').mockResolvedValueOnce(stateListing);
      window.scrollTo = vi.fn();
      const { fireEvent } = await import('@testing-library/react');

      render(
        <MemoryRouter
          initialEntries={[
            {
              pathname: '/owners/listings/99/edit',
              state: { listing: stateListing },
            },
          ]}
        >
          <Routes>
            <Route path={ROUTES.editBillboardListingPath} element={<NewBillboardListing />} />
          </Routes>
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByText('Edit Billboard Listing')).toBeDefined();
      });

      // Type 15abc into ground height input
      const groundInput = screen.getByPlaceholderText('30');
      fireEvent.change(groundInput, { target: { value: '15abc' } });
      fireEvent.blur(groundInput);

      // Verify inline error appears
      expect(screen.getByText('Enter a valid number.')).toBeDefined();

      // Attempt to click Continue
      fireEvent.click(screen.getByRole('button', { name: /continue to pricing & availability/i }));

      // Wizard must be blocked on Step 1
      expect(screen.queryByRole('button', { name: /continue to media uploads/i })).toBeNull();
      expect(screen.getByText('Enter a valid number.')).toBeDefined();
    });

    it('allows wizard progression when f_bbGroundHeight has valid decimal formats (.5 and 15.)', async () => {
      const stateListing = {
        id: 99,
        name: 'Andheri West Screen',
        addressLine1: 'SV Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400058',
        type: 'LED_DIGITAL',
        widthFt: 20,
        heightFt: 10,
        groundHeightFt: 15,
        facing: 'North',
        trafficType: 'City / Urban',
        audienceType: 'Shoppers',
        startPrice: 200000,
        minBookingValue: 1,
        minBookingUnit: 'MONTHS',
      };

      vi.spyOn(ownerListingApi, 'getListing').mockResolvedValueOnce(stateListing);
      window.scrollTo = vi.fn();
      const { fireEvent } = await import('@testing-library/react');

      render(
        <MemoryRouter
          initialEntries={[
            {
              pathname: '/owners/listings/99/edit',
              state: { listing: stateListing },
            },
          ]}
        >
          <Routes>
            <Route path={ROUTES.editBillboardListingPath} element={<NewBillboardListing />} />
          </Routes>
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByText('Edit Billboard Listing')).toBeDefined();
      });

      // Type .5 into ground height input
      const groundInput = screen.getByPlaceholderText('30');
      fireEvent.change(groundInput, { target: { value: '.5' } });
      fireEvent.blur(groundInput);

      // No error message
      expect(screen.queryByText('Enter a valid number.')).toBeNull();

      // Next test trailing dot decimal 15.
      fireEvent.change(groundInput, { target: { value: '15.' } });
      fireEvent.blur(groundInput);
      expect(screen.queryByText('Enter a valid number.')).toBeNull();

      // Click Continue
      fireEvent.click(screen.getByRole('button', { name: /continue to pricing & availability/i }));

      // Successfully advances to Step 2
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /continue to media uploads/i })).toBeDefined();
      });
    });
  });

  describe('Submit error handling (FieldFormatError vs Generic TypeError)', () => {
    it('surfaces user-facing message when mapper throws FieldFormatError', async () => {
      const mockMapper = vi.fn().mockImplementation(() => {
        throw new FieldFormatError(
          'f_bbGroundHeight',
          'Invalid numeric value for groundHeightFt: "15abc"',
          'Ground height must be a valid number (e.g. 15 or 24.5).',
        );
      });

      const handler = createSubmitHandler({
        isEdit: true,
        id: '42',
        mapPayload: mockMapper,
        apiClient: { updateListing: vi.fn() },
      });

      await expect(handler({ data: { f_bbGroundHeight: '15abc' } })).rejects.toThrow(
        'Ground height must be a valid number (e.g. 15 or 24.5).',
      );
    });

    it('re-throws unhandled generic TypeError from mapper without mislabeling as ground height', async () => {
      const mockMapper = vi.fn().mockImplementation(() => {
        throw new TypeError('Cannot read properties of undefined (reading "foo")');
      });

      const handler = createSubmitHandler({
        isEdit: true,
        id: '42',
        mapPayload: mockMapper,
        apiClient: { updateListing: vi.fn() },
      });

      await expect(handler({ data: {} })).rejects.toThrow(TypeError);
      await expect(handler({ data: {} })).rejects.toThrow(
        'Cannot read properties of undefined (reading "foo")',
      );
    });

    it('surfaces normal fallback message when fetch/network throws generic TypeError on network failure', async () => {
      const mockApiClient = {
        updateListing: vi.fn().mockRejectedValue(new TypeError('Failed to fetch')),
      };

      const handler = createSubmitHandler({
        isEdit: true,
        id: '42',
        mapPayload: vi.fn().mockReturnValue({ name: 'Valid Board' }),
        apiClient: mockApiClient,
        env: { DEV: false },
      });

      // Must surface the normal fallback message, NOT a ground-height error!
      await expect(handler({ data: {} })).rejects.toThrow('Failed to update billboard listing.');
    });
  });
});
