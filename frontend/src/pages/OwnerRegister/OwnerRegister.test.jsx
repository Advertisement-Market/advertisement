import React, { useState } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { OwnerRegister } from './OwnerRegister';
import { useAuth } from '@/context/AuthContext';
import { AuthModalContext } from '@/context/AuthModalContext';
import { ToastProvider } from '@/context/ToastProvider';
import { ownerListingApi } from '@/features/owner/ownerListingApi';
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
});

describe('ownerDraftStorage allowlist, TTL & handoff', () => {
  beforeEach(() => {
    sessionStorage.clear();
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
});
