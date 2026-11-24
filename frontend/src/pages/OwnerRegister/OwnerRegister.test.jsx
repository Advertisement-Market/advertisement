import React, { useState } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { OwnerRegister } from './OwnerRegister';
import { AuthModal } from '@/features/auth/AuthModal';
import { useAuth } from '@/context/AuthContext';
import { AuthModalContext } from '@/context/AuthModalContext';
import { AuthModalProvider } from '@/context/AuthModalProvider';
import { ToastProvider } from '@/context/ToastProvider';
import { ownerListingApi } from '@/features/owner/ownerListingApi';
import * as pincodeLookupModule from '@/features/auth/pincodeLookup';
import {
  saveOwnerRegisterDraft,
  loadOwnerRegisterDraft,
  migrateAnonDraftToUser,
  clearOwnerRegisterDraft,
  draftKeyFor,
  OWNER_DRAFT_TTL_MS,
  OWNER_DRAFT_MAX_AGE_MS,
} from './ownerDraftStorage';

const navigateSpy = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => navigateSpy };
});

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('OwnerRegister Component, Authenticated Onboarding & Recovery Flows', () => {
  const mockRegisterOwner = vi.fn();
  const mockOnboardOwner = vi.fn();
  const mockClearSessionLocal = vi.fn();
  const mockSyncMedia = vi.spyOn(ownerListingApi, 'syncMedia');
  const mockSubmitListing = vi.spyOn(ownerListingApi, 'submitListing');

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();
    useAuth.mockReturnValue({
      registerOwner: mockRegisterOwner,
      onboardOwner: mockOnboardOwner,
      clearSessionLocal: mockClearSessionLocal,
      user: null,
      isAuthenticated: false,
    });
    window.scrollTo = vi.fn();
  });

  const validRegistrationData = {
    f_firstName: 'Vedant',
    f_lastName: 'Salunkhe',
    f_email: 'vedant@example.com',
    f_phone: '9876543210',
    f_password: 'Password123!',
    f_confirmPassword: 'Password123!',
    f_companyName: 'AdMedia Ltd',
    f_bizAddr1: '100 Main Road',
    f_bizCity: 'Mumbai',
    f_bizState: 'Maharashtra',
    f_bizPin: '400053',
    f_bbName: 'Andheri West Flyover',
    f_bbAddr: 'SV Road, Andheri West',
    f_bbCity: 'Mumbai',
    f_bbState: 'Maharashtra',
    f_bbPin: '400058',
    f_bbType: 'UNIPOLE',
    f_bbWidth: '30',
    f_bbHeight: '15',
    f_facing: 'North',
    f_trafficType: 'vehicular',
    f_trafficOther: '',
    f_audience: 'commuters',
    f_audienceOther: '',
    f_startPrice: '10000',
    f_minBookingValue: 1,
    f_minBookingUnit: 'MONTHS',
    f_termsAccept: true,
  };

  it('uploads media and submits listing for verification post-registration when at least 2 day photos uploaded', async () => {
    const file1 = new File(['content1'], 'day1.jpg', { type: 'image/jpeg' });
    const file2 = new File(['content2'], 'day2.jpg', { type: 'image/jpeg' });

    mockRegisterOwner.mockResolvedValueOnce({
      accessToken: 'jwt-token-123',
      initialListingId: 501,
      user: { id: 10, email: 'vedant@example.com', role: 'OWNER' },
    });
    mockSyncMedia.mockResolvedValueOnce([
      { id: 1, isCover: false, category: 'DAY_PHOTO' },
      { id: 2, isCover: true, category: 'DAY_PHOTO' },
    ]);
    mockSubmitListing.mockResolvedValueOnce({ id: 501, status: 'PENDING_APPROVAL' });

    render(
      <MemoryRouter>
        <OwnerRegister
          initialStep={7}
          initialData={{
            ...validRegistrationData,
            f_dayPhotos: [
              { id: 'up-1', file: file1 },
              { id: 'up-2', file: file2 },
            ],
            f_selectedCover: { type: 'NEW', uploadId: 'up-2' },
          }}
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /submit for verification/i }));

    await waitFor(() => {
      expect(mockRegisterOwner).toHaveBeenCalled();
      expect(mockSyncMedia).toHaveBeenCalledWith(
        501,
        expect.objectContaining({
          fileMappings: [
            expect.objectContaining({ uploadId: 'up-1', isCover: false }),
            expect.objectContaining({ uploadId: 'up-2', isCover: true }),
          ],
        }),
        [file1, file2],
      );
      expect(mockSubmitListing).toHaveBeenCalledWith(501);
      expect(screen.getByText('Submitted!')).toBeDefined();
    });
  });

  it('renders resumable Finish Uploading Photos CTA when syncMedia fails post-registration', async () => {
    const file1 = new File(['content1'], 'day1.jpg', { type: 'image/jpeg' });

    mockRegisterOwner.mockResolvedValueOnce({
      accessToken: 'jwt-token-123',
      initialListingId: 502,
      user: { id: 10, email: 'vedant@example.com', role: 'OWNER' },
    });
    mockSyncMedia.mockRejectedValueOnce(new Error('Upload timeout'));

    render(
      <MemoryRouter>
        <OwnerRegister
          initialStep={7}
          initialData={{
            ...validRegistrationData,
            f_dayPhotos: [{ id: 'up-1', file: file1 }],
          }}
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /submit for verification/i }));

    await waitFor(() => {
      expect(mockRegisterOwner).toHaveBeenCalled();
      expect(mockSyncMedia).toHaveBeenCalled();
      expect(screen.getByText('Account Activated — Draft Saved')).toBeDefined();
      const resumeLink = screen.getByRole('link', { name: /finish uploading photos/i });
      expect(resumeLink.getAttribute('href')).toBe('/owners/listings/502/edit');
    });
  });

  it('does not invoke submitListing when fewer than 2 day photos are uploaded', async () => {
    const file1 = new File(['content1'], 'day1.jpg', { type: 'image/jpeg' });

    mockRegisterOwner.mockResolvedValueOnce({
      accessToken: 'jwt-token-123',
      initialListingId: 503,
      user: { id: 10, email: 'vedant@example.com', role: 'OWNER' },
    });
    mockSyncMedia.mockResolvedValueOnce([{ id: 1, isCover: true, category: 'DAY_PHOTO' }]);

    render(
      <MemoryRouter>
        <OwnerRegister
          initialStep={7}
          initialData={{
            ...validRegistrationData,
            f_dayPhotos: [{ id: 'up-1', file: file1 }],
          }}
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /submit for verification/i }));

    await waitFor(() => {
      expect(mockRegisterOwner).toHaveBeenCalled();
      expect(mockSyncMedia).toHaveBeenCalled();
      expect(mockSubmitListing).not.toHaveBeenCalled();
      expect(screen.getByText('Submitted!')).toBeDefined();
    });
  });

  it('submits signed-in MEMBER via onboardOwner excluding accountEmail and password, and completes media sync across mid-submit role flip', async () => {
    const file1 = new File(['img1'], 'day1.jpg', { type: 'image/jpeg' });
    const file2 = new File(['img2'], 'day2.jpg', { type: 'image/jpeg' });

    let currentAuthUser = {
      id: 42,
      firstName: 'Vedant',
      lastName: 'Salunkhe',
      email: 'member@example.com',
      phone: '+91 98765 43210',
      role: 'MEMBER',
      hasPassword: true,
    };

    mockSyncMedia.mockResolvedValueOnce([
      { id: 1, isCover: true, category: 'DAY_PHOTO' },
      { id: 2, isCover: false, category: 'DAY_PHOTO' },
    ]);
    mockSubmitListing.mockResolvedValueOnce({ id: 700, status: 'PENDING_APPROVAL' });

    let triggerFlip;
    mockOnboardOwner.mockImplementationOnce(async () => {
      // Simulate AuthProvider.applySession flipping user.role from MEMBER -> OWNER mid-onSubmit
      currentAuthUser = { ...currentAuthUser, role: 'OWNER' };
      triggerFlip();
      return {
        accessToken: 'FRESH_OWNER_JWT',
        initialListingId: 700,
        user: currentAuthUser,
      };
    });

    function Harness() {
      const [, setTick] = useState(0);
      triggerFlip = () => setTick((t) => t + 1);
      useAuth.mockReturnValue({
        registerOwner: mockRegisterOwner,
        onboardOwner: mockOnboardOwner,
        clearSessionLocal: mockClearSessionLocal,
        user: currentAuthUser,
        isAuthenticated: true,
      });
      return (
        <OwnerRegister
          initialStep={7}
          initialData={{
            ...validRegistrationData,
            f_dayPhotos: [
              { id: 'up-1', file: file1 },
              { id: 'up-2', file: file2 },
            ],
          }}
        />
      );
    }

    render(
      <MemoryRouter>
        <Harness />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /submit for verification/i }));

    await waitFor(() => {
      expect(mockOnboardOwner).toHaveBeenCalledTimes(1);
      expect(mockRegisterOwner).not.toHaveBeenCalled();
      const dto = mockOnboardOwner.mock.calls[0][0];
      expect(dto).not.toHaveProperty('accountEmail');
      expect(dto).not.toHaveProperty('password');
      expect(mockSyncMedia).toHaveBeenCalledWith(700, expect.any(Object), [file1, file2]);
      expect(mockSubmitListing).toHaveBeenCalledWith(700);
      expect(screen.getByText('Submitted!')).toBeDefined();
    });
  });

  it('renders Step 1 with read-only account phone for local MEMBER and no password section for Google MEMBER', () => {
    // 1. Local MEMBER with phone -> readOnly phone input
    useAuth.mockReturnValue({
      registerOwner: mockRegisterOwner,
      onboardOwner: mockOnboardOwner,
      clearSessionLocal: mockClearSessionLocal,
      user: {
        id: 11,
        firstName: 'Asha',
        lastName: 'Rao',
        email: 'asha@example.com',
        phone: '+91 98765 43210',
        role: 'MEMBER',
        hasPassword: true,
      },
      isAuthenticated: true,
    });
    const { unmount } = render(
      <MemoryRouter>
        <OwnerRegister initialStep={1} />
      </MemoryRouter>,
    );
    const phoneInput = screen.getByPlaceholderText('98765 43210');
    expect(phoneInput.readOnly).toBe(true);
    expect(screen.queryByText(/create password/i)).toBeNull();
    // Both email and phone OTP verification controls must remain available for signed-in MEMBER
    expect(screen.getByRole('button', { name: /send otp to verify email/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /send otp to verify mobile/i })).toBeDefined();
    unmount();

    // 2. Google MEMBER without phone or password -> editable phone, STILL no password section
    useAuth.mockReturnValue({
      registerOwner: mockRegisterOwner,
      onboardOwner: mockOnboardOwner,
      clearSessionLocal: mockClearSessionLocal,
      user: {
        id: 12,
        firstName: 'Gaurav',
        lastName: 'Patel',
        email: 'gaurav@example.com',
        phone: null,
        role: 'MEMBER',
        hasPassword: false,
        authProvider: 'GOOGLE',
      },
      isAuthenticated: true,
    });
    render(
      <MemoryRouter>
        <OwnerRegister initialStep={1} />
      </MemoryRouter>,
    );
    const googlePhoneInput = screen.getByPlaceholderText('98765 43210');
    expect(googlePhoneInput.readOnly).toBe(false);
    expect(screen.queryByText(/set a password/i)).toBeNull();
  });

  it('suppresses duplicate submit error toast when interceptor rejects with SESSION_EXPIRED sentinel', async () => {
    useAuth.mockReturnValue({
      registerOwner: mockRegisterOwner,
      onboardOwner: mockOnboardOwner,
      clearSessionLocal: mockClearSessionLocal,
      user: { id: 10, email: 'member@example.com', role: 'MEMBER', phone: '9876543210' },
      isAuthenticated: true,
    });

    const sentinel = new Error('Session expired');
    sentinel.code = 'SESSION_EXPIRED';
    sentinel.isSessionExpired = true;
    mockOnboardOwner.mockRejectedValueOnce(sentinel);

    render(
      <MemoryRouter>
        <OwnerRegister initialStep={7} initialData={validRegistrationData} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /submit for verification/i }));

    await waitFor(() => {
      expect(mockOnboardOwner).toHaveBeenCalledTimes(1);
    });
    expect(screen.queryByText('Session expired')).toBeNull();
    expect(screen.queryByText('Submitted!')).toBeNull();
  });

  it('recovers from anonymous 409 EMAIL_ALREADY_EXISTS by saving anon draft, opening login modal, and migrating draft on sign-in', async () => {
    const conflictErr = {
      response: {
        status: 409,
        data: {
          errorCode: 'EMAIL_ALREADY_EXISTS',
          message: 'An account already exists for vedant@example.com. Please sign in to continue.',
        },
      },
    };
    mockRegisterOwner.mockRejectedValueOnce(conflictErr);

    const openLoginSpy = vi.fn();
    let currentUser = null;
    let triggerAuthUpdate;

    function RecoveryHarness() {
      const [, setTick] = useState(0);
      triggerAuthUpdate = (nextUser) => {
        currentUser = nextUser;
        setTick((t) => t + 1);
      };
      useAuth.mockReturnValue({
        registerOwner: mockRegisterOwner,
        onboardOwner: mockOnboardOwner,
        clearSessionLocal: mockClearSessionLocal,
        user: currentUser,
        isAuthenticated: Boolean(currentUser),
      });
      return (
        <ToastProvider>
          <AuthModalContext.Provider
            value={{
              view: null,
              open: vi.fn(),
              openLogin: openLoginSpy,
              openRegister: vi.fn(),
              openGate: vi.fn(),
              setView: vi.fn(),
              close: vi.fn(),
            }}
          >
            <OwnerRegister initialStep={7} initialData={validRegistrationData} />
          </AuthModalContext.Provider>
        </ToastProvider>
      );
    }

    render(
      <MemoryRouter>
        <RecoveryHarness />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /submit for verification/i }));

    await waitFor(() => {
      expect(openLoginSpy).toHaveBeenCalledTimes(1);
      expect(loadOwnerRegisterDraft(null)?.f_companyName).toBe('AdMedia Ltd');
    });

    // Simulate user signing in as MEMBER id=55
    triggerAuthUpdate({
      id: 55,
      firstName: 'Vedant',
      lastName: 'Salunkhe',
      email: 'signedin@example.com',
      phone: '+91 98765 43210',
      role: 'MEMBER',
    });

    await waitFor(() => {
      // Anon draft migrated to :u:55 and :anon removed
      expect(sessionStorage.getItem(draftKeyFor(null))).toBeNull();
      const userDraft = loadOwnerRegisterDraft(55);
      expect(userDraft?.f_companyName).toBe('AdMedia Ltd');
      expect(userDraft?.f_email).toBeUndefined();
    });
  });

  it('handles lost-201 409 ALREADY_REGISTERED: clears session, opens login modal, redirects on OWNER login, and clears redirect on non-OWNER login', async () => {
    const alreadyRegErr = {
      response: {
        status: 409,
        data: { errorCode: 'ALREADY_REGISTERED' },
      },
    };
    mockOnboardOwner.mockRejectedValue(alreadyRegErr);

    let currentUser = { id: 10, email: 'member@example.com', role: 'MEMBER', phone: '9876543210' };
    let modalView = null;
    let updateState;

    function Lost201Harness() {
      const [, setTick] = useState(0);
      updateState = (nextUser, nextView) => {
        currentUser = nextUser;
        modalView = nextView;
        setTick((t) => t + 1);
      };
      useAuth.mockReturnValue({
        registerOwner: mockRegisterOwner,
        onboardOwner: mockOnboardOwner,
        clearSessionLocal: () => {
          mockClearSessionLocal();
          currentUser = null;
          setTick((t) => t + 1);
        },
        user: currentUser,
        isAuthenticated: Boolean(currentUser),
      });
      return (
        <ToastProvider>
          <AuthModalContext.Provider
            value={{
              view: modalView,
              open: vi.fn(),
              openLogin: () => {
                modalView = 'login';
                setTick((t) => t + 1);
              },
              openRegister: vi.fn(),
              openGate: vi.fn(),
              setView: vi.fn(),
              close: () => {
                modalView = null;
                setTick((t) => t + 1);
              },
            }}
          >
            <OwnerRegister initialStep={7} initialData={validRegistrationData} />
          </AuthModalContext.Provider>
        </ToastProvider>
      );
    }

    render(
      <MemoryRouter>
        <Lost201Harness />
      </MemoryRouter>,
    );

    // 1. Trigger lost-201 -> signs in as a DIFFERENT non-OWNER (MEMBER) account -> must NOT redirect
    fireEvent.click(screen.getByRole('button', { name: /submit for verification/i }));
    await waitFor(() => expect(mockClearSessionLocal).toHaveBeenCalledTimes(1));

    updateState({ id: 99, email: 'other@example.com', role: 'MEMBER' }, null);
    await waitFor(() => expect(navigateSpy).not.toHaveBeenCalled());

    // 2. Trigger lost-201 again -> re-login as OWNER -> navigates to My Listings
    fireEvent.click(screen.getByRole('button', { name: /submit for verification/i }));
    await waitFor(() => expect(mockClearSessionLocal).toHaveBeenCalledTimes(2));

    updateState({ id: 10, email: 'member@example.com', role: 'OWNER' }, null);
    await waitFor(() => {
      expect(navigateSpy).toHaveBeenCalledWith('/owners/dashboard?tab=listings');
    });
  });

  it('renders "Pin Your Billboard\'s Exact Location" on Step 3 (Billboard Details) and not on Step 5 (Media Uploads)', () => {
    const { unmount } = render(
      <MemoryRouter>
        <OwnerRegister initialStep={3} />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Pin Your Billboard's Exact Location/i)).toBeDefined();
    unmount();

    render(
      <MemoryRouter>
        <OwnerRegister initialStep={5} />
      </MemoryRouter>,
    );

    expect(screen.queryByText(/Pin Your Billboard's Exact Location/i)).toBeNull();
  });

  it('renders standardized upload instructions and renamed surrounding photo title on Step 5', () => {
    render(
      <MemoryRouter>
        <OwnerRegister initialStep={5} />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Shows billboard with its surroundings/i)).toBeDefined();
    expect(screen.queryByText(/Shows billboard in its surroundings/i)).toBeNull();

    // Standardized upload instructions across photo upload fields
    const dragDropPrompts = screen.getAllByText(/Drag & drop or click to browse/i);
    expect(dragDropPrompts.length).toBeGreaterThanOrEqual(3);

    // Surrounding area photo includes 10MB size limit
    expect(screen.getAllByText(/JPG, PNG, WEBP · Max 10MB/i).length).toBeGreaterThanOrEqual(1);

    // Media reference guide link
    const refGuideLink = screen.getByRole('link', { name: /View Media Reference Guide \(PDF\)/i });
    expect(refGuideLink.getAttribute('href')).toBe('/reference_guide.pdf');
    expect(refGuideLink.getAttribute('target')).toBe('_blank');
  });

  it('displays only three non-colliding Pricing Package rows by default on Step 4', () => {
    render(
      <MemoryRouter>
        <OwnerRegister initialStep={4} />
      </MemoryRouter>,
    );

    const durationNumInputs = screen.getAllByLabelText(/Package duration value/i);
    expect(durationNumInputs.length).toBe(3);
    expect(durationNumInputs[0].value).toBe('1');
    expect(durationNumInputs[1].value).toBe('3');
    expect(durationNumInputs[2].value).toBe('6');

    const noteInputs = screen.getAllByLabelText(/Package notes/i);
    expect(noteInputs[0].placeholder).toBe('Standard');
    expect(noteInputs[1].placeholder).toBe('30% off');
    expect(noteInputs[2].placeholder).toBe('Best value');

    const durationUnitSelects = screen.getAllByLabelText(/Package duration unit/i);
    expect(durationUnitSelects.length).toBe(3);
    durationUnitSelects.forEach((select) => {
      expect(select.value).toBe('months');
    });
  });

  it('allows editing package duration, adding packages with default 1 month duration, and removing added packages', () => {
    render(
      <MemoryRouter>
        <OwnerRegister initialStep={4} />
      </MemoryRouter>,
    );

    // 1. Edit duration on a package
    const durationNumInputs = screen.getAllByLabelText(/Package duration value/i);
    fireEvent.change(durationNumInputs[0], { target: { value: '2' } });
    expect(durationNumInputs[0].value).toBe('2');

    // 2. Add a new package
    const addBtn = screen.getByRole('button', { name: /Add Package/i });
    fireEvent.click(addBtn);

    const updatedInputs = screen.getAllByLabelText(/Package duration value/i);
    expect(updatedInputs.length).toBe(4);
    // Newly added package defaults to 1 month
    expect(updatedInputs[3].value).toBe('1');

    const updatedUnits = screen.getAllByLabelText(/Package duration unit/i);
    expect(updatedUnits[3].value).toBe('months');

    // 3. Remove package
    const removeButtons = screen.getAllByRole('button', { name: /Remove package/i });
    expect(removeButtons.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(removeButtons[0]);

    expect(screen.getAllByLabelText(/Package duration value/i).length).toBe(3);
  });

  it('dynamically recalculates base rate on duration change, computes duration-aware discount, and leaves discount blank if no discount or premium', () => {
    render(
      <MemoryRouter>
        <OwnerRegister initialStep={4} />
      </MemoryRouter>,
    );

    // Set starting daily price to 1000
    const startPriceInput = screen.getByPlaceholderText('9500');
    fireEvent.change(startPriceInput, { target: { value: '1000' } });

    // Step 4 Base rate input (Row 1): 1 month (30 days) * 1000 = 30000
    const rateInputs = screen.getAllByLabelText(/Package rate/i);
    expect(rateInputs[0].value).toBe('30000');

    // Edit Base duration to 2 months -> base rate should auto-update to 60000
    const durationNumInputs = screen.getAllByLabelText(/Package duration value/i);
    fireEvent.change(durationNumInputs[0], { target: { value: '2' } });
    expect(rateInputs[0].value).toBe('60000');

    // Set Row 2 to 3 months (90 days). Base daily rate = 60000 / 60 = 1000/day.
    fireEvent.change(durationNumInputs[1], { target: { value: '3' } });
    // Expected rate for row 2 (3 months = 90 days) = 90000.
    // If user enters 72000 (20% discount):
    fireEvent.change(rateInputs[1], { target: { value: '72000' } });
    const discountBadges = document.querySelectorAll('.discount-badge');
    expect(discountBadges[1].textContent).toBe('20% off');

    // If user enters 95000 (premium / more expensive than base):
    // Row 2 should NOT display premium or discount; should be blank
    fireEvent.change(rateInputs[1], { target: { value: '95000' } });
    expect(discountBadges[1].textContent).toBe('');

    // If user enters 90000 (exact base price, no discount):
    fireEvent.change(rateInputs[1], { target: { value: '90000' } });
    expect(discountBadges[1].textContent).toBe('');
  });

  it('displays improved advance reservation calendar instructions, retains date selection below calendar without duplicate top banner, and renders indicators', () => {
    render(
      <MemoryRouter>
        <OwnerRegister initialStep={4} />
      </MemoryRouter>,
    );

    // 1. Improved instructions
    expect(
      screen.getByText(
        /Mark dates on which your billboard already has reservations or bookings scheduled in advance/i,
      ),
    ).toBeDefined();

    // 2. Indicators in legend
    expect(screen.getByText(/^Available$/i)).toBeDefined();
    expect(screen.getByText(/^Blocked by Owner$/i)).toBeDefined();
    expect(screen.getByText(/^Past$/i)).toBeDefined();

    // 3. Click a future date cell to start range selection
    const dayCells = document.querySelectorAll('.cal-day:not(.past):not(.empty)');
    expect(dayCells.length).toBeGreaterThan(0);
    fireEvent.click(dayCells[0]);

    // Ensure NO duplicate hint banner exists above the calendar
    expect(document.querySelector('.cal-selection-hint')).toBeNull();

    // Ensure the date selection indicator and Cancel button are retained below the calendar
    const calSummary = document.querySelector('.cal-summary');
    expect(calSummary).not.toBeNull();
    expect(calSummary.textContent).toMatch(/Start date selected:/i);
    expect(screen.getByRole('button', { name: /Cancel selection/i })).toBeDefined();
  });
});

describe('ownerDraftStorage allowlist, TTL & handoff', () => {
  beforeEach(() => {
    sessionStorage.clear();
    useAuth.mockReturnValue({
      registerOwner: vi.fn(),
      onboardOwner: vi.fn(),
      clearSessionLocal: vi.fn(),
      user: null,
      isAuthenticated: false,
    });
  });

  it('strictly excludes secrets and Files, enforces sliding 30m TTL via injected clock, and preserves expiresAt on anon->user handoff', () => {
    let t = 1_000_000;
    const clock = () => t;

    saveOwnerRegisterDraft(
      {
        f_companyName: 'Skyline OOH',
        f_email: 'anon@example.com',
        f_password: 'SuperSecretPassword!',
        f_confirmPassword: 'SuperSecretPassword!',
        f_termsAccept: true,
        f_dayPhotos: [{ id: '1', file: new File(['x'], 'a.jpg') }],
      },
      null,
      clock,
    );

    const raw = JSON.parse(sessionStorage.getItem(draftKeyFor(null)));
    expect(raw.fields).toEqual({ f_companyName: 'Skyline OOH', f_email: 'anon@example.com' });
    expect(raw.fields.f_password).toBeUndefined();
    expect(raw.fields.f_confirmPassword).toBeUndefined();
    expect(raw.fields.f_termsAccept).toBeUndefined();
    expect(raw.fields.f_dayPhotos).toBeUndefined();
    const originalExpiresAt = raw.expiresAt;

    // Advance 10 minutes, migrate anon -> user 77
    t += 10 * 60 * 1000;
    const migrated = migrateAnonDraftToUser(77, clock);
    expect(migrated).toEqual({ f_companyName: 'Skyline OOH' });
    expect(sessionStorage.getItem(draftKeyFor(null))).toBeNull();

    const migratedEnvelope = JSON.parse(sessionStorage.getItem(draftKeyFor(77)));
    expect(migratedEnvelope.expiresAt).toBe(originalExpiresAt);
    expect(migratedEnvelope.fields.f_email).toBeUndefined();

    // Advance past original TTL -> draft expires cleanly
    t = originalExpiresAt + 1;
    expect(loadOwnerRegisterDraft(77, clock)).toBeNull();

    // Re-save and verify hard 2-hour cap expires draft even across sliding writes
    t = 5_000_000;
    saveOwnerRegisterDraft({ f_companyName: 'Sliding Cap Co' }, 77, clock);
    // Repeated sliding saves every 20 minutes up to 1h50m
    t += 20 * 60 * 1000;
    saveOwnerRegisterDraft({ f_companyName: 'Sliding Cap Co' }, 77, clock);
    t += 90 * 60 * 1000;
    saveOwnerRegisterDraft({ f_companyName: 'Sliding Cap Co' }, 77, clock);
    // Still alive at 1h50m, but must expire past the 2h absolute hard cap (at 2h01m)
    expect(loadOwnerRegisterDraft(77, clock)?.f_companyName).toBe('Sliding Cap Co');
    t = 5_000_000 + OWNER_DRAFT_MAX_AGE_MS + 1;
    expect(loadOwnerRegisterDraft(77, clock)).toBeNull();

    // Re-save and verify clearOwnerRegisterDraft wipes all keys
    saveOwnerRegisterDraft({ f_companyName: 'Another Corp' }, 77, clock);
    expect(loadOwnerRegisterDraft(77, clock)).not.toBeNull();
    clearOwnerRegisterDraft();
    expect(loadOwnerRegisterDraft(77, clock)).toBeNull();
    expect(OWNER_DRAFT_TTL_MS).toBe(30 * 60 * 1000);
  });

  it('does NOT migrate an unrelated :anon draft when a user signs in without an explicit anonymous-409 handoff', async () => {
    // User A leaves an anonymous draft in sessionStorage
    saveOwnerRegisterDraft(
      { f_companyName: 'User A Private Corp', f_gst: '27AAAAA0000A1Z5' },
      null,
    );

    let currentUser = null;
    let signInUser;
    function UnrelatedSignInHarness() {
      const [, setTick] = useState(0);
      signInUser = (u) => {
        currentUser = u;
        setTick((n) => n + 1);
      };
      useAuth.mockReturnValue({
        registerOwner: vi.fn(),
        onboardOwner: vi.fn(),
        clearSessionLocal: vi.fn(),
        user: currentUser,
        isAuthenticated: Boolean(currentUser),
      });
      return <OwnerRegister initialStep={1} />;
    }

    render(
      <MemoryRouter>
        <UnrelatedSignInHarness />
      </MemoryRouter>,
    );

    // User B signs in normally (no anonymous-409 handoff occurred)
    signInUser({
      id: 88,
      firstName: 'UserB',
      lastName: 'Member',
      email: 'userb@example.com',
      phone: '+91 90000 00001',
      role: 'MEMBER',
    });

    await waitFor(() => {
      // :anon must be wiped and User A's company/GST must NOT be copied into :u:88
      expect(sessionStorage.getItem(draftKeyFor(null))).toBeNull();
      const userBDraft = loadOwnerRegisterDraft(88);
      expect(userBDraft?.f_companyName).toBeUndefined();
      expect(userBDraft?.f_gst).toBeUndefined();
    });
  });

  it('persists f_pricingPackages in draft and restores all rows, durations, rates, and notes on page refresh', () => {
    const savedPackages = [
      { id: 1, num: '2', unit: 'months', rate: '50000', note: 'Standard base', isBase: true },
      { id: 2, num: '3', unit: 'months', rate: '70000', note: 'Quarterly saver', isBase: false },
      { id: 3, num: '6', unit: 'months', rate: '130000', note: 'Half year deal', isBase: false },
      { id: 4, num: '1', unit: 'years', rate: '240000', note: 'Annual special', isBase: false },
    ];

    saveOwnerRegisterDraft(
      {
        f_startPrice: '1000',
        f_pricingPackages: savedPackages,
      },
      null,
    );

    render(
      <MemoryRouter>
        <OwnerRegister initialStep={4} />
      </MemoryRouter>,
    );

    const durationInputs = screen.getAllByLabelText(/Package duration value/i);
    expect(durationInputs.length).toBe(4);
    expect(durationInputs[0].value).toBe('2');
    expect(durationInputs[1].value).toBe('3');
    expect(durationInputs[2].value).toBe('6');
    expect(durationInputs[3].value).toBe('1');

    const rateInputs = screen.getAllByLabelText(/Package rate/i);
    expect(rateInputs[0].value).toBe('50000');
    expect(rateInputs[1].value).toBe('70000');
    expect(rateInputs[2].value).toBe('130000');
    expect(rateInputs[3].value).toBe('240000');

    const noteInputs = screen.getAllByLabelText(/Package notes/i);
    expect(noteInputs[0].value).toBe('Standard base');
    expect(noteInputs[1].value).toBe('Quarterly saver');
    expect(noteInputs[2].value).toBe('Half year deal');
    expect(noteInputs[3].value).toBe('Annual special');
  });

  it('persists f_emailVerified and f_phoneVerified flags in draft so user does not need to reverify on refresh', () => {
    saveOwnerRegisterDraft(
      {
        f_email: 'verified.owner@example.com',
        f_phone: '9876543210',
        f_emailVerified: true,
        f_phoneVerified: true,
      },
      null,
    );

    render(
      <MemoryRouter>
        <OwnerRegister initialStep={1} />
      </MemoryRouter>,
    );

    // Both email and phone show verified badges on load without needing reverification
    expect(screen.getByText(/Email verified/i)).toBeDefined();
    expect(screen.getByText(/Mobile verified/i)).toBeDefined();
    expect(screen.queryByRole('button', { name: /send otp to verify email/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /send otp to verify mobile/i })).toBeNull();

    // When the phone number is changed, phone verification resets and requires reverifying
    const phoneInput = screen.getByPlaceholderText(/98765 43210/i);
    fireEvent.change(phoneInput, { target: { value: '9876543219' } });

    expect(screen.queryByText(/Mobile verified/i)).toBeNull();
    expect(screen.getByRole('button', { name: /send otp to verify mobile/i })).toBeDefined();
    // Email verification remains intact
    expect(screen.getByText(/Email verified/i)).toBeDefined();
  });
});

describe('Step 2 & Step 3 Reorganization, Pincode Auto-lock, and Form Validations', () => {
  beforeEach(() => {
    sessionStorage.clear();
    useAuth.mockReturnValue({
      registerOwner: vi.fn(),
      onboardOwner: vi.fn(),
      clearSessionLocal: vi.fn(),
      user: null,
      isAuthenticated: false,
    });
  });

  it('reorganizes Step 2: moves Pincode immediately after Address Line 2 and renames to "Pincode"', () => {
    render(
      <MemoryRouter>
        <OwnerRegister initialStep={2} />
      </MemoryRouter>,
    );

    expect(screen.getByText(/^Pincode$/i)).toBeDefined();
    expect(screen.queryByText(/Office Pincode/i)).toBeNull();

    const addr2 = screen.getByPlaceholderText(/Street, Area, Colony/i);
    const pin = screen.getByPlaceholderText('411001');
    const city = screen.getByPlaceholderText('Pune');
    const state = screen.getByPlaceholderText('Maharashtra');

    // DOM order check: addr2 -> pin -> city -> state
    expect(addr2.compareDocumentPosition(pin) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(pin.compareDocumentPosition(city) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(city.compareDocumentPosition(state) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('auto-fills City and State from Pincode and locks them once detected, and unlocks if PIN is cleared', async () => {
    vi.spyOn(pincodeLookupModule, 'fetchPincode').mockResolvedValue({
      ok: true,
      city: 'Pune',
      state: 'Maharashtra',
      areas: ['Kothrud', 'Shivajinagar'],
    });

    render(
      <MemoryRouter>
        <OwnerRegister initialStep={2} />
      </MemoryRouter>,
    );

    const pinInput = screen.getByPlaceholderText('411001');
    const cityInput = screen.getByPlaceholderText('Pune');
    const stateInput = screen.getByPlaceholderText('Maharashtra');

    expect(cityInput.readOnly).toBe(false);
    expect(stateInput.readOnly).toBe(false);

    // Enter 6-digit PIN and blur to trigger lookup
    fireEvent.change(pinInput, { target: { value: '411001' } });
    fireEvent.blur(pinInput);

    await waitFor(() => {
      expect(cityInput.value).toBe('Pune');
      expect(stateInput.value).toBe('Maharashtra');
      expect(cityInput.readOnly).toBe(true);
      expect(stateInput.readOnly).toBe(true);
      expect(cityInput.className).toContain('locked-field');
      expect(stateInput.className).toContain('locked-field');
    });

    // If PIN is shortened / cleared, City and State unlock for manual entry
    fireEvent.change(pinInput, { target: { value: '411' } });
    expect(cityInput.readOnly).toBe(false);
    expect(stateInput.readOnly).toBe(false);
    expect(cityInput.className).not.toContain('locked-field');
  });

  it('applies Pincode-based auto-fill and locking to Step 3 and shows "Getting your location…"', async () => {
    let resolvePincode;
    const pincodePromise = new Promise((resolve) => {
      resolvePincode = resolve;
    });
    vi.spyOn(pincodeLookupModule, 'fetchPincode').mockImplementation(() => pincodePromise);

    render(
      <MemoryRouter>
        <OwnerRegister initialStep={3} />
      </MemoryRouter>,
    );

    const bbPinInput = screen.getByPlaceholderText('400053');
    const bbCityInput = screen.getByPlaceholderText('Mumbai');
    const bbStateInput = screen.getByPlaceholderText('Maharashtra');

    // Enter 6-digit billboard PIN and blur
    fireEvent.change(bbPinInput, { target: { value: '400053' } });
    fireEvent.blur(bbPinInput);

    // Shows updated lookup message
    expect(screen.getByText(/Getting your location…/i)).toBeDefined();

    // Resolve lookup
    resolvePincode({
      ok: true,
      city: 'Mumbai',
      state: 'Maharashtra',
      areas: ['Andheri West'],
    });

    await waitFor(() => {
      expect(bbCityInput.value).toBe('Mumbai');
      expect(bbStateInput.value).toBe('Maharashtra');
      expect(bbCityInput.readOnly).toBe(true);
      expect(bbStateInput.readOnly).toBe(true);
    });
  });

  it('restricts Billboard Type custom input to alphabets only', () => {
    render(
      <MemoryRouter>
        <OwnerRegister initialStep={3} />
      </MemoryRouter>,
    );

    // Click "Other" billboard type
    const otherOption = screen
      .getAllByText('Other')
      .find((el) => el.classList.contains('type-option-label'));
    fireEvent.click(otherOption);

    const otherInput = screen.getByPlaceholderText(/Bridge Panel, Skywalk, Pillar/i);
    expect(otherInput).toBeDefined();

    // Attempt to enter letters and numbers / special chars
    fireEvent.change(otherInput, { target: { value: 'Skywalk 123 #@!' } });
    // Digits and special characters should be stripped, only letters and spaces allowed
    expect(otherInput.value).toBe('Skywalk  ');
  });

  it('renders Height from Ground as a standard input field matching Width and Height', () => {
    render(
      <MemoryRouter>
        <OwnerRegister initialStep={3} />
      </MemoryRouter>,
    );

    const groundHeightInput = screen.getByPlaceholderText('30');
    expect(groundHeightInput).toBeDefined();
    expect(groundHeightInput.getAttribute('type')).toBe('number');
    expect(groundHeightInput.getAttribute('min')).toBe('0');
    expect(groundHeightInput.getAttribute('max')).toBe('300');
    expect(screen.getByText('Typical range: 0–300 ft')).toBeDefined();
    expect(groundHeightInput.classList.contains('form-control')).toBe(true);
    expect(screen.getByText(/Height from Ground \(ft\)/i)).toBeDefined();

    // Adjust value to 45
    fireEvent.change(groundHeightInput, { target: { value: '45' } });
    expect(groundHeightInput.value).toBe('45');
  });

  it('validates GST Number, Company Registration Number, City, and State fields', async () => {
    render(
      <MemoryRouter>
        <OwnerRegister initialStep={2} />
      </MemoryRouter>,
    );

    // Fill valid company name and address
    fireEvent.change(screen.getByPlaceholderText(/Sharma Outdoor Advertising Pvt\. Ltd\./i), {
      target: { value: 'Apex OOH Ltd' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Office \/ Shop No\./i), {
      target: { value: '101 Corporate Park' },
    });
    fireEvent.change(screen.getByPlaceholderText('411001'), { target: { value: '411001' } });

    // 1. Invalid Company Registration (contains invalid special chars)
    const companyRegInput = screen.getByPlaceholderText(/U74999MH2020PTC123456/i);
    fireEvent.change(companyRegInput, { target: { value: 'INVALID#REG' } });

    const nextBtn = screen.getByRole('button', { name: /Continue to Billboard Details/i });
    fireEvent.click(nextBtn);

    // Must show validation error for company registration
    expect(
      screen.getAllByText(/Enter a valid Company Registration \/ CIN number/i).length,
    ).toBeGreaterThanOrEqual(1);

    // Fix company registration
    fireEvent.change(companyRegInput, { target: { value: 'U74999MH2020PTC123456' } });

    // 2. Invalid GST
    const gstInput = screen.getByPlaceholderText(/27AAPFU0939F1Z5/i);
    fireEvent.change(gstInput, { target: { value: '123BADGST' } });
    fireEvent.click(nextBtn);

    expect(screen.getAllByText(/Enter a valid 15-character GSTIN/i).length).toBeGreaterThanOrEqual(
      1,
    );

    // Fix GST
    fireEvent.change(gstInput, { target: { value: '27AAPFU0939F1Z5' } });

    // 3. Invalid City (contains numbers)
    const cityInput = screen.getByPlaceholderText('Pune');
    fireEvent.change(cityInput, { target: { value: 'Pune123' } });
    fireEvent.blur(cityInput);

    expect(screen.getAllByText(/Enter a valid city name/i).length).toBeGreaterThanOrEqual(1);
  });
});

describe('Mobile & Email Verification, Step 1 Hierarchy, Company Phone & Password Error Visibility', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    useAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      login: vi.fn(),
      registerOwner: vi.fn(),
      onboardOwner: vi.fn(),
    });
  });

  it('repositions Mobile Number Verification as primary focus at the top of Step 1', () => {
    const { container } = render(
      <MemoryRouter>
        <OwnerRegister initialStep={1} />
      </MemoryRouter>,
    );

    const sectionTitles = Array.from(container.querySelectorAll('.form-section-title'));
    expect(sectionTitles.length).toBeGreaterThanOrEqual(4);
    expect(sectionTitles[0].textContent).toContain('Mobile Number Verification');
    expect(sectionTitles[1].textContent).toContain('Email Address');
    expect(sectionTitles[2].textContent).toContain('Your Name');
    expect(sectionTitles[3].textContent).toContain('Set a Password');
  });

  it('disables Email OTP send button until valid email format is entered, and verifies with demo OTP', () => {
    render(
      <MemoryRouter>
        <OwnerRegister initialStep={1} />
      </MemoryRouter>,
    );

    const emailSendBtn = screen.getByRole('button', { name: /send otp to verify email/i });
    expect(emailSendBtn.disabled).toBe(true);

    const emailInput = screen.getByPlaceholderText('rajesh@sharmaoutdoor.com');
    // Invalid email -> still disabled
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    expect(emailSendBtn.disabled).toBe(true);

    // Valid email -> enabled
    fireEvent.change(emailInput, { target: { value: 'valid@example.com' } });
    expect(emailSendBtn.disabled).toBe(false);

    // Send OTP
    fireEvent.click(emailSendBtn);
    const otpBoxes = screen
      .getAllByRole('textbox')
      .filter((el) => el.classList.contains('otp-box'));
    expect(otpBoxes.length).toBe(6);

    // Fill OTP 123456
    '123456'.split('').forEach((digit, i) => {
      fireEvent.change(otpBoxes[i], { target: { value: digit } });
    });

    const verifyBtn = screen.getByRole('button', { name: /^verify$/i });
    fireEvent.click(verifyBtn);

    expect(screen.getAllByText(/Email verified/i).length).toBeGreaterThanOrEqual(1);
  });

  it('persists mobile verification across step navigation without requiring re-verification', () => {
    render(
      <MemoryRouter>
        <OwnerRegister initialStep={1} />
      </MemoryRouter>,
    );

    const phoneInput = screen.getByPlaceholderText('98765 43210');
    fireEvent.change(phoneInput, { target: { value: '9876543210' } });

    const phoneSendBtn = screen.getByRole('button', { name: /send otp to verify mobile/i });
    fireEvent.click(phoneSendBtn);

    let otpBoxes = screen.getAllByRole('textbox').filter((el) => el.classList.contains('otp-box'));
    '123456'.split('').forEach((digit, i) => {
      fireEvent.change(otpBoxes[i], { target: { value: digit } });
    });

    let verifyBtn = screen.getByRole('button', { name: /^verify$/i });
    fireEvent.click(verifyBtn);

    expect(screen.getByText(/Mobile verified/i)).toBeDefined();

    // Fill remaining Step 1 fields
    const emailInput = screen.getByPlaceholderText('rajesh@sharmaoutdoor.com');
    fireEvent.change(emailInput, { target: { value: 'owner@example.com' } });
    const emailSendBtn = screen.getByRole('button', { name: /send otp to verify email/i });
    fireEvent.click(emailSendBtn);
    otpBoxes = screen.getAllByRole('textbox').filter((el) => el.classList.contains('otp-box'));
    '123456'.split('').forEach((digit, i) => {
      fireEvent.change(otpBoxes[i], { target: { value: digit } });
    });
    verifyBtn = screen.getByRole('button', { name: /^verify$/i });
    fireEvent.click(verifyBtn);

    fireEvent.change(screen.getByPlaceholderText('Rajesh'), { target: { value: 'Rajesh' } });
    fireEvent.change(screen.getByPlaceholderText('Sharma'), { target: { value: 'Sharma' } });
    fireEvent.change(screen.getByPlaceholderText(/Min 8 chars/i), {
      target: { value: 'Secret123!' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Re-enter password/i), {
      target: { value: 'Secret123!' },
    });

    // Navigate to Step 2
    const nextBtn = screen.getByRole('button', { name: /Continue to Business Info/i });
    fireEvent.click(nextBtn);

    // On Step 2
    expect(screen.getAllByText(/Business/i).length).toBeGreaterThanOrEqual(1);

    // Navigate back to Step 1
    const backBtn = screen.getByRole('button', { name: /back/i });
    fireEvent.click(backBtn);

    // On Step 1: Mobile verified badge must still be present
    expect(screen.getByText(/Mobile verified/i)).toBeDefined();
    expect(screen.queryByRole('button', { name: /send otp to verify mobile/i })).toBeNull();
  });

  it('provides specific, user-friendly password validation errors in Step 1 and final submission', () => {
    // 1. In Step 1 validation
    render(
      <MemoryRouter>
        <OwnerRegister initialStep={1} />
      </MemoryRouter>,
    );

    const phoneInput = screen.getByPlaceholderText('98765 43210');
    fireEvent.change(phoneInput, { target: { value: '9876543210' } });
    fireEvent.click(screen.getByRole('button', { name: /send otp to verify mobile/i }));
    let otpBoxes = screen.getAllByRole('textbox').filter((el) => el.classList.contains('otp-box'));
    '123456'
      .split('')
      .forEach((digit, i) => fireEvent.change(otpBoxes[i], { target: { value: digit } }));
    fireEvent.click(screen.getByRole('button', { name: /^verify$/i }));

    const emailInput = screen.getByPlaceholderText('rajesh@sharmaoutdoor.com');
    fireEvent.change(emailInput, { target: { value: 'owner@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send otp to verify email/i }));
    otpBoxes = screen.getAllByRole('textbox').filter((el) => el.classList.contains('otp-box'));
    '123456'
      .split('')
      .forEach((digit, i) => fireEvent.change(otpBoxes[i], { target: { value: digit } }));
    fireEvent.click(screen.getByRole('button', { name: /^verify$/i }));

    fireEvent.change(screen.getByPlaceholderText('Rajesh'), { target: { value: 'Rajesh' } });
    fireEvent.change(screen.getByPlaceholderText('Sharma'), { target: { value: 'Sharma' } });

    const pwInput = screen.getByPlaceholderText(/Min 8 chars/i);
    const cpwInput = screen.getByPlaceholderText(/Re-enter password/i);
    const nextBtn = screen.getByRole('button', { name: /Continue to Business Info/i });

    // Test length < 8
    fireEvent.change(pwInput, { target: { value: 'Ab1!' } });
    fireEvent.change(cpwInput, { target: { value: 'Ab1!' } });
    fireEvent.click(nextBtn);
    expect(
      screen.getAllByText(/Password must be at least 8 characters long/i).length,
    ).toBeGreaterThanOrEqual(1);

    // Test missing uppercase
    fireEvent.change(pwInput, { target: { value: 'secret123!' } });
    fireEvent.change(cpwInput, { target: { value: 'secret123!' } });
    fireEvent.click(nextBtn);
    expect(
      screen.getAllByText(/Password must contain at least one uppercase letter/i).length,
    ).toBeGreaterThanOrEqual(1);

    // Test missing number
    fireEvent.change(pwInput, { target: { value: 'Secret!!!!' } });
    fireEvent.change(cpwInput, { target: { value: 'Secret!!!!' } });
    fireEvent.click(nextBtn);
    expect(
      screen.getAllByText(/Password must contain at least one number/i).length,
    ).toBeGreaterThanOrEqual(1);

    // Test missing symbol
    fireEvent.change(pwInput, { target: { value: 'Secret1234' } });
    fireEvent.change(cpwInput, { target: { value: 'Secret1234' } });
    fireEvent.click(nextBtn);
    expect(
      screen.getAllByText(/Password must contain at least one special symbol/i).length,
    ).toBeGreaterThanOrEqual(1);

    // Test mismatch
    fireEvent.change(pwInput, { target: { value: 'Secret123!' } });
    fireEvent.change(cpwInput, { target: { value: 'Different123!' } });
    fireEvent.click(nextBtn);
    expect(screen.getAllByText(/Passwords do not match/i).length).toBeGreaterThanOrEqual(1);
  });

  it('displays prominent alert on Step 7 when password is missing for unauthenticated user with link to Step 1', () => {
    render(
      <MemoryRouter>
        <OwnerRegister initialStep={7} initialData={{ f_companyName: 'AdCorp' }} />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/Please set an account password in Step 1 before submitting/i),
    ).toBeDefined();
    const setPwBtn = screen.getByRole('button', { name: /Set Password →/i });
    expect(setPwBtn).toBeDefined();

    // Clicking button jumps to Step 1
    fireEvent.click(setPwBtn);
    expect(screen.getByText(/Mobile Number Verification/i)).toBeDefined();
  });

  it('displays greyed-out country code (+91) for Company Phone and allows landlines without 10-digit restrictions', () => {
    render(
      <MemoryRouter>
        <OwnerRegister initialStep={2} />
      </MemoryRouter>,
    );

    // Verify +91 country code prefix is displayed
    const prefixElements = screen.getAllByText('+91');
    expect(prefixElements.some((el) => el.classList.contains('phone-prefix'))).toBe(true);

    const compPhoneInput = screen.getByPlaceholderText(/20 2222 3333 or 98765 43210/i);
    // Enter landline format
    fireEvent.change(compPhoneInput, { target: { value: '20 2222 3333' } });

    // Fill other required Step 2 fields
    fireEvent.change(screen.getByPlaceholderText(/Sharma Outdoor Advertising Pvt\. Ltd\./i), {
      target: { value: 'Landline Media Pvt Ltd' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Office \/ Shop No\./i), {
      target: { value: '101 Tower' },
    });
    fireEvent.change(screen.getByPlaceholderText('411001'), { target: { value: '411001' } });

    const nextBtn = screen.getByRole('button', { name: /Continue to Billboard Details/i });
    fireEvent.click(nextBtn);

    // No error for company phone, progresses to Step 3
    expect(screen.getAllByText(/Billboard/i).length).toBeGreaterThanOrEqual(1);
  });

  it('renders visible auth-error-alert inside AuthModal LoginView when login fails with 401', async () => {
    const mockLogin = vi.fn().mockRejectedValue({
      response: { status: 401, data: { message: 'Bad credentials' } },
    });

    useAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      login: mockLogin,
      loginWithGoogle: vi.fn(),
      registerBasic: vi.fn(),
    });

    const TestAuthModalConsumer = () => {
      const auth = React.useContext(AuthModalContext);
      return (
        <div>
          <button onClick={() => auth.openLogin()}>Open Login</button>
          <AuthModal />
        </div>
      );
    };

    const { container } = render(
      <ToastProvider>
        <AuthModalProvider>
          <TestAuthModalConsumer />
        </AuthModalProvider>
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /Open Login/i }));

    const emailInput = screen.getByPlaceholderText('you@company.com');
    const pwInput = screen.getByPlaceholderText('Your password');
    fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
    fireEvent.change(pwInput, { target: { value: 'wrongpass' } });

    const submitBtn = container.querySelector('button.form-submit');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(
          /Incorrect email or password\. Please double-check your credentials and try again\./i,
        ),
      ).toBeDefined();
    });
  });
});
