import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';
import { RegisterProvider, RegisterShell, useRegister, SuccessScreen } from '@/features/register';
import { Step1, Step2, Step3, Step4, Step5, Step6, Step7 } from './steps';
import { useAuth } from '@/context/AuthContext';
import { AuthModalContext } from '@/context/AuthModalContext';
import { AuthModal } from '@/features/auth/AuthModal';
import { mapOwner, mapOwnerOnboarding } from '@/features/auth/registrationMappers';
import { apiErrorMessage } from '@/lib/apiClient';
import { isOther, isBlank, isValidPincode } from '@/lib/validators';
import { ownerListingApi } from '@/features/owner/ownerListingApi';
import { normalizeUploadItem } from './widgets';
import {
  saveOwnerRegisterDraft,
  loadOwnerRegisterDraft,
  migrateAnonDraftToUser,
  clearAnonOwnerDraft,
  clearOwnerRegisterDraft,
} from './ownerDraftStorage';
import './OwnerRegister.css';

const STEPS = [
  { title: 'Personal Information', desc: 'Name, email, phone, password' },
  { title: 'Business Information', desc: 'Company, GST, address' },
  { title: 'Billboard Details', desc: 'Location, type, size, audience' },
  { title: 'Pricing & Availability', desc: 'Rates, packages, calendar' },
  { title: 'Media Uploads', desc: 'Photos with geotag, video' },
  { title: 'Legal Data', desc: 'Ownership, approval, documents' },
  { title: 'Review & Submit', desc: 'Terms, submit for verification' },
];

const tIcon = (paths) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {paths}
  </svg>
);

const SUCCESS_TIMELINE = [
  {
    title: 'Confirmation email sent',
    text: 'Check your inbox for a confirmation and next steps.',
    icon: tIcon(
      <>
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </>,
    ),
  },
  {
    title: 'Admin review in progress',
    text: 'Verification takes about 2-3 business days.',
    icon: tIcon(
      <>
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </>,
    ),
  },
  {
    title: 'Account activated',
    text: 'Once approved, you can start receiving inquiries.',
    icon: tIcon(<polyline points="20 6 9 17 4 12" />),
  },
];

// eslint-disable-next-line react-refresh/only-export-components
export function validate(step, { data, showToast, user }) {
  const d = (k) => String(data[k] ?? '').trim();
  const fail = (msg) => {
    showToast(msg, 'error');
    return false;
  };
  if (step === 1) {
    if (!d('f_firstName') || !d('f_lastName')) return fail('Please enter your full name.');
    if (d('f_phone').replace(/\D/g, '').length !== 10)
      return fail('Please enter a valid 10-digit mobile number.');
    const pw = data.f_password ?? '';
    const confirm = data.f_confirmPassword ?? '';
    if (!user) {
      if (!d('f_email').includes('@')) return fail('Please enter a valid email address.');
      if (pw.length < 8) return fail('Password must be at least 8 characters.');
      if (pw !== confirm) return fail('Passwords do not match.');
    }
  }
  if (step === 2) {
    if (!d('f_companyName')) return fail('Please enter your company name.');
    if (!d('f_bizAddr1')) return fail('Please enter your address.');
    if (!d('f_bizCity')) return fail('Please enter your city.');
    if (!d('f_bizState')) return fail('Please enter your state.');
    if (!d('f_bizPin')) return fail('Please enter your office pincode.');
    if (!isValidPincode(d('f_bizPin')))
      return fail('Please enter a valid 6-digit office pincode (cannot start with 0).');
  }
  if (step === 3) {
    if (!d('f_bbName')) return fail('Please enter a billboard name.');
    if (!d('f_bbAddr')) return fail('Please enter the billboard address.');
    if (!d('f_bbCity')) return fail('Please enter the billboard city.');
    if (!d('f_bbState')) return fail('Please enter the billboard state.');
    if (!d('f_bbPin')) return fail('Please enter the billboard pincode.');
    if (!isValidPincode(d('f_bbPin')))
      return fail('Please enter a valid 6-digit billboard pincode (cannot start with 0).');
    if (!d('f_bbType')) return fail('Please select a billboard type.');
    if (isOther(d('f_bbType')) && isBlank(d('f_bbTypeOther')))
      return fail('Please describe the billboard type.');
    if (!d('f_bbWidth') || !d('f_bbHeight')) return fail('Please enter the billboard dimensions.');
    if (!d('f_facing')) return fail('Please select a facing direction.');
    if (!d('f_trafficType')) return fail('Please select a traffic type.');
    if (isOther(d('f_trafficType')) && isBlank(d('f_trafficOther')))
      return fail('Please describe the traffic type.');
    if (!d('f_audience')) return fail('Please select an audience type.');
    if (isOther(d('f_audience')) && isBlank(d('f_audienceOther')))
      return fail('Please describe the audience type.');
  }
  if (step === 4) {
    if (!d('f_startPrice') || Number(d('f_startPrice')) <= 0)
      return fail('Please enter a starting price.');
    const minVal = d('f_minBookingValue') ?? (d('f_minBooking') ? 1 : null);
    if (!minVal || Number(minVal) <= 0)
      return fail('Please enter a valid minimum booking duration.');
    const minUnit = d('f_minBookingUnit') || 'MONTHS';
    if (!['DAYS', 'WEEKS', 'MONTHS'].includes(minUnit))
      return fail('Please select a valid booking duration unit.');
  }
  return true;
}

function validateSubmit({ data, showToast }) {
  if (!data.f_termsAccept) {
    showToast('Please accept the Terms of Service to continue.', 'error');
    return false;
  }
  return true;
}

const STEP_COMPONENTS = [Step1, Step2, Step3, Step4, Step5, Step6, Step7];

/**
 * Synchronizes allowlisted wizard fields to sessionStorage and handles anonymous-to-authenticated
 * draft handoff when the user signs in via the in-place AuthModal mid-wizard.
 */
function DraftAndAuthSync({ user, pendingAnonHandoffRef }) {
  const { data, submitted, mergeData, replaceData } = useRegister();
  const prevUserIdRef = useRef(user?.id ?? null);
  const skipNextSaveRef = useRef(false);

  // Handle identity transitions BEFORE saving drafts so pre-transition data is never written
  // under a newly signed-in user's storage key (or leaked back to :anon on logout).
  useEffect(() => {
    const prevId = prevUserIdRef.current;
    const nextId = user?.id ?? null;
    if (prevId === nextId) return;
    prevUserIdRef.current = nextId;

    if (prevId == null && nextId != null && user) {
      const shouldMigrate = Boolean(pendingAnonHandoffRef?.current);
      if (pendingAnonHandoffRef) {
        pendingAnonHandoffRef.current = false;
      }
      const userPhone = (user.phone || '').replace(/\D/g, '').slice(-10);
      const userIdentity = {
        f_email: user.email || '',
        ...(user.firstName ? { f_firstName: user.firstName } : {}),
        ...(user.lastName ? { f_lastName: user.lastName } : {}),
        ...(userPhone.length === 10 ? { f_phone: userPhone } : {}),
      };
      skipNextSaveRef.current = true;
      if (shouldMigrate) {
        const hydrated = migrateAnonDraftToUser(nextId) || loadOwnerRegisterDraft(nextId);
        mergeData({
          ...(hydrated || {}),
          ...userIdentity,
        });
      } else {
        clearAnonOwnerDraft();
        const userDraft = loadOwnerRegisterDraft(nextId);
        replaceData({
          f_minBookingValue: 1,
          f_minBookingUnit: 'MONTHS',
          ...(userDraft || {}),
          ...userIdentity,
        });
      }
    } else if (prevId != null && nextId == null) {
      skipNextSaveRef.current = true;
    }
  }, [user, mergeData, replaceData, pendingAnonHandoffRef]);

  // Persist allowlisted non-secret fields whenever wizard state changes (until submitted).
  useEffect(() => {
    if (submitted) return;
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }
    saveOwnerRegisterDraft(data, user?.id ?? null);
  }, [data, user?.id, submitted]);

  return null;
}

function WizardBody({ partialFailure }) {
  const { currentStep, submitted } = useRegister();
  if (submitted) {
    if (partialFailure?.stage === 'media' && partialFailure.listingId) {
      return (
        <div>
          <SuccessScreen
            accent="var(--teal)"
            title="Account Activated — Draft Saved"
            desc="Your owner account and billboard draft are saved, but photo upload could not finish. Finish uploading photos to submit your listing for review."
            timeline={SUCCESS_TIMELINE}
            dashboardTo={ROUTES.editBillboardListing(partialFailure.listingId)}
            dashboardLabel="Finish Uploading Photos"
          />
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <Link to={ROUTES.ownerListingsTab} className="cancel-link">
              Go to My Listings
            </Link>
          </div>
        </div>
      );
    }
    if (partialFailure?.stage === 'submit' || partialFailure?.stage === 'missing_listing') {
      return (
        <SuccessScreen
          accent="var(--teal)"
          title="Account Activated!"
          desc="Your owner account and billboard draft were saved. Open My Listings to review and submit your listing for verification."
          timeline={SUCCESS_TIMELINE}
          dashboardTo={ROUTES.ownerListingsTab}
          dashboardLabel="Go to My Listings"
        />
      );
    }
    return (
      <SuccessScreen
        accent="var(--teal)"
        title="Submitted!"
        desc="Your registration is under review. Our team will verify your business details and listing within 2–3 working days."
        timeline={SUCCESS_TIMELINE}
        dashboardTo={ROUTES.ownerListingsTab}
        dashboardLabel="Go to My Listings"
      />
    );
  }
  const Step = STEP_COMPONENTS[currentStep - 1];
  return <Step />;
}

export function OwnerRegister({ initialData: customInitialData, initialStep = 1 } = {}) {
  const { registerOwner, onboardOwner, clearSessionLocal, user } = useAuth();
  const authModal = useContext(AuthModalContext);
  const navigate = useNavigate();

  const [partialFailure, setPartialFailure] = useState(null);
  const [pendingPostLoginRedirect, setPendingPostLoginRedirect] = useState(null);
  const clearedForReLoginRef = useRef(false);
  const modalWasOpenForRedirectRef = useRef(false);
  const pendingAnonHandoffRef = useRef(false);

  // Manage lost-201 post-login redirect: wait for clearSessionLocal() to take effect (user === null),
  // then navigate ONLY once user.role === 'OWNER' is in state; clear immediately on modal close
  // without login OR on sign-in with any non-OWNER account.
  useEffect(() => {
    if (!pendingPostLoginRedirect) {
      clearedForReLoginRef.current = false;
      modalWasOpenForRedirectRef.current = false;
      return;
    }

    if (authModal?.view === 'login') {
      modalWasOpenForRedirectRef.current = true;
    }

    if (!user) {
      clearedForReLoginRef.current = true;
      if (modalWasOpenForRedirectRef.current && authModal && authModal.view === null) {
        setPendingPostLoginRedirect(null);
        clearedForReLoginRef.current = false;
        modalWasOpenForRedirectRef.current = false;
      }
      return;
    }

    if (clearedForReLoginRef.current && user) {
      const target = pendingPostLoginRedirect;
      setPendingPostLoginRedirect(null);
      clearedForReLoginRef.current = false;
      modalWasOpenForRedirectRef.current = false;
      if (user.role === 'OWNER') {
        navigate(target);
      }
    }
  }, [pendingPostLoginRedirect, user, authModal, navigate]);

  const prefill = useMemo(() => {
    const savedDraft = loadOwnerRegisterDraft(user?.id ?? null) || {};
    return {
      f_minBookingValue: 1,
      f_minBookingUnit: 'MONTHS',
      ...savedDraft,
      ...(user
        ? {
            f_email: user.email,
            f_firstName: savedDraft.f_firstName || user.firstName || '',
            f_lastName: savedDraft.f_lastName || user.lastName || '',
            f_phone: (user.phone || '').replace(/\D/g, '').slice(-10) || savedDraft.f_phone || '',
          }
        : {}),
      ...customInitialData,
    };
    // Initial mount snapshot only (RegisterProvider holds live wizard state).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async ({ data, showToast }) => {
    let authRes;
    try {
      if (user) {
        authRes = await onboardOwner(mapOwnerOnboarding(data));
      } else {
        authRes = await registerOwner(mapOwner(data));
      }
    } catch (err) {
      // Let RegisterProvider suppress duplicate toast when interceptor already handled session expiry.
      if (err?.isSessionExpired || err?.code === 'SESSION_EXPIRED') {
        throw err;
      }

      const status = err?.response?.status;
      const errorCode = err?.response?.data?.errorCode;

      // Anonymous dead-end recovery: email already exists -> save draft, arm handoff flag, and open login modal.
      if (!user && status === 409 && errorCode === 'EMAIL_ALREADY_EXISTS') {
        saveOwnerRegisterDraft(data, null);
        pendingAnonHandoffRef.current = true;
        showToast(apiErrorMessage(err), 'error');
        authModal?.openLogin?.();
        return false;
      }

      // Lost-201 retry recovery: backend already promoted user and revoked the old MEMBER refresh token.
      // Clear stale MEMBER session, prompt re-login, and route to My Listings once signed in as OWNER.
      if (user && status === 409 && errorCode === 'ALREADY_REGISTERED') {
        clearSessionLocal?.();
        clearOwnerRegisterDraft();
        showToast(
          'Your owner account is already active. Please sign in again to continue.',
          'info',
        );
        setPendingPostLoginRedirect(ROUTES.ownerListingsTab);
        authModal?.openLogin?.();
        return false;
      }

      throw new Error(apiErrorMessage(err), { cause: err });
    }

    // Account + initial listing are now committed; clear wizard draft immediately.
    clearOwnerRegisterDraft();

    const listingId = authRes?.initialListingId;
    if (!listingId) {
      console.warn('Owner onboarding succeeded without initialListingId in response.');
      setPartialFailure({ listingId: null, stage: 'missing_listing' });
      if (showToast) {
        showToast(
          'Account activated! Open My Listings to review and complete your billboard.',
          'warning',
        );
      }
      return;
    }

    const dayPhotos = (data.f_dayPhotos || []).map(normalizeUploadItem).filter(Boolean);
    const nightPhotos = (data.f_nightPhotos || []).map(normalizeUploadItem).filter(Boolean);
    const surroundingPhotos = (data.f_surroundingPhotos || [])
      .map(normalizeUploadItem)
      .filter(Boolean);
    const video = (data.f_video || []).map(normalizeUploadItem).filter(Boolean);

    const allNewFiles = [
      ...dayPhotos.map((it) => ({ ...it, category: 'DAY_PHOTO' })),
      ...nightPhotos.map((it) => ({ ...it, category: 'NIGHT_PHOTO' })),
      ...surroundingPhotos.map((it) => ({ ...it, category: 'SURROUNDING_PHOTO' })),
      ...video.map((it) => ({ ...it, category: 'VIDEO' })),
    ];

    const selectedCover = data.f_selectedCover;

    if (allNewFiles.length > 0) {
      try {
        const fileMappings = allNewFiles.map((item, idx) => ({
          clientIndex: idx,
          category: item.category,
          uploadId: item.id,
          isCover:
            item.category === 'DAY_PHOTO' &&
            selectedCover?.type === 'NEW' &&
            selectedCover.uploadId === item.id,
        }));
        const filesToSend = allNewFiles.map((item) => item.file);
        const manifest = {
          stagedDeleteIds: [],
          fileMappings,
        };
        await ownerListingApi.syncMedia(listingId, manifest, filesToSend);

        if (dayPhotos.length >= 2) {
          try {
            await ownerListingApi.submitListing(listingId);
          } catch (submitErr) {
            console.warn('Auto-submit listing failed after registration:', submitErr);
            setPartialFailure({ listingId, stage: 'submit' });
            if (showToast) {
              showToast(
                'Listing created & photos saved, but submit for review failed. You can submit from My Listings.',
                'warning',
              );
            }
          }
        }
      } catch (mediaErr) {
        console.warn('Post-registration media sync failed:', mediaErr);
        setPartialFailure({ listingId, stage: 'media' });
        if (showToast) {
          showToast(
            'Account created, but media upload failed. You can add photos from My Listings.',
            'warning',
          );
        }
      }
    }
  };

  return (
    <div className="owner-register-page">
      <RegisterProvider
        totalSteps={7}
        initialStep={initialStep}
        validate={(step, ctx) => validate(step, { ...ctx, user })}
        validateSubmit={validateSubmit}
        initialData={prefill}
        onSubmit={onSubmit}
      >
        <DraftAndAuthSync user={user} pendingAnonHandoffRef={pendingAnonHandoffRef} />
        <RegisterShell
          tagline="Billboard Owner Registration"
          steps={STEPS}
          signInTo={ROUTES.owners}
          cancelTo={ROUTES.owners}
          onCancel={clearOwnerRegisterDraft}
        >
          <WizardBody partialFailure={partialFailure} />
        </RegisterShell>
      </RegisterProvider>
      {authModal && <AuthModal submitVariant="primary" />}
    </div>
  );
}

export default OwnerRegister;
