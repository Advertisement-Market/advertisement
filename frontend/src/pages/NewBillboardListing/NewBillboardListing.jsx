import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { ROUTES } from '@/lib/routes';
import { RegisterProvider, RegisterShell, useRegister, SuccessScreen } from '@/features/register';
import { ListingStep1, ListingStep2, ListingStep3 } from './steps';
import {
  mapBillboardListing,
  mapListingToFormData,
  mapFormDataToPatchPayload,
} from '@/features/auth/registrationMappers';
import { availabilityApi } from '@/features/availability/availabilityApi';
import {
  blocksToDayStatusMap,
  dayStatusMapToRanges,
} from '@/features/availability/availabilityUtils';
import { ownerListingApi } from '@/features/owner/ownerListingApi';
import { normalizeUploadItem } from '../OwnerRegister/widgets';
import { LISTINGS } from '@/pages/OwnerDashboard/data';
import { apiErrorMessage } from '@/lib/apiClient';
import { isOther, isBlank, FieldFormatError, decimalRange, isValidPincode } from '@/lib/validators';
import './NewBillboardListing.css';

const STEPS = [
  { title: 'Billboard Details', desc: 'Location, type, size, audience' },
  { title: 'Pricing & Availability', desc: 'Rates, packages, calendar' },
  { title: 'Media Uploads', desc: 'Photos with geotag, video' },
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
    title: 'Listing submitted',
    text: 'Your billboard specifications and media uploads have been recorded.',
    icon: tIcon(
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </>,
    ),
  },
  {
    title: 'Admin verification in progress',
    text: 'Our team verifies listing parameters within 24–48 hours.',
    icon: tIcon(
      <>
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </>,
    ),
  },
  {
    title: 'Live on marketplace',
    text: 'Once approved, advertisers can discover and send quote requests.',
    icon: tIcon(<polyline points="20 6 9 17 4 12" />),
  },
];

const EDIT_SUCCESS_TIMELINE = [
  {
    title: 'Changes saved',
    text: 'Your updated inventory specifications and rate card have been saved.',
    icon: tIcon(<polyline points="20 6 9 17 4 12" />),
  },
  {
    title: 'Marketplace updated',
    text: 'Your listing updates are now active and visible to advertisers.',
    icon: tIcon(
      <>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </>,
    ),
  },
];

// eslint-disable-next-line react-refresh/only-export-components
export function validate(step, { data, showToast }) {
  const d = (k) => String(data[k] ?? '').trim();
  const fail = (msg) => {
    showToast(msg, 'error');
    return false;
  };
  if (step === 1) {
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
    if (!d('f_bbWidth') || Number(d('f_bbWidth')) <= 0)
      return fail('Please enter a valid width in feet.');
    if (!d('f_bbHeight') || Number(d('f_bbHeight')) <= 0)
      return fail('Please enter a valid height in feet.');
    if (d('f_bbGroundHeight') && decimalRange(0, 300)(d('f_bbGroundHeight')))
      return fail('Please enter a valid height from ground (0–300 ft).');
    if (!d('f_facing')) return fail('Please select a facing direction.');
    if (!d('f_trafficType')) return fail('Please select a traffic type.');
    if (isOther(d('f_trafficType')) && isBlank(d('f_trafficOther')))
      return fail('Please describe the traffic type.');
    if (!d('f_audience')) return fail('Please select an audience type.');
    if (isOther(d('f_audience')) && isBlank(d('f_audienceOther')))
      return fail('Please describe the audience type.');
  }
  if (step === 2) {
    if (!d('f_startPrice') || Number(d('f_startPrice')) <= 0)
      return fail('Please enter a starting price.');
    const minVal = d('f_minBookingValue') ?? (d('f_minBooking') ? 1 : null);
    if (!minVal || Number(minVal) <= 0)
      return fail('Please enter a valid minimum booking duration.');
    const minUnit = d('f_minBookingUnit') || 'MONTHS';
    if (!['DAYS', 'WEEKS', 'MONTHS'].includes(minUnit))
      return fail('Please select a valid booking duration unit.');
  }
  if (step === 3) {
    const isDraft = data.status === 'DRAFT';
    const isSavingDraftOnly = isDraft && !data.f_submitForReview;
    if (!isSavingDraftOnly) {
      const existingDay = Array.isArray(data.f_existingDayPhotos)
        ? data.f_existingDayPhotos.length
        : 0;
      const newDay = Array.isArray(data.f_dayPhotos) ? data.f_dayPhotos.length : 0;
      if (existingDay + newDay < 2) {
        return fail('At least 2 daylight photos are required to submit a billboard listing.');
      }
    }
  }
  return true;
}

const STEP_COMPONENTS = [ListingStep1, ListingStep2, ListingStep3];

function EditAvailabilityHydrator({ isEdit, listingId }) {
  const { field, setField } = useRegister();
  const dirtyRef = useRef(false);
  const isDirty = Boolean(field('f_availabilityDirty'));

  useEffect(() => {
    dirtyRef.current = isDirty;
  }, [isDirty]);

  useEffect(() => {
    if (!isEdit || !listingId || !/^\d+$/.test(String(listingId))) return;
    let ignore = false;
    Promise.resolve(availabilityApi.getListingAvailability(listingId))
      .then((res) => {
        if (ignore || !res) return;
        const { statusMap, confirmedDates, holdDates } = blocksToDayStatusMap(res.blocks || []);
        if (!dirtyRef.current) {
          const ownerBlocked = {};
          for (const [k, v] of Object.entries(statusMap)) {
            if (v === 'blocked' && !confirmedDates.has(k) && !holdDates.has(k)) {
              ownerBlocked[k] = 'blocked';
            }
          }
          setField('f_blockedDates', ownerBlocked);
        }
        setField('f_lockedBookedDates', Array.from(confirmedDates));
        setField('f_lockedHoldDates', Array.from(holdDates));
        setField('f_availabilityEtag', res.etag ?? null);
        setField('f_availabilityServerToday', res.today ?? null);
        setField('f_availabilityLoaded', true);
      })
      .catch(() => {
        // Edit metadata/media flow still works even if availability preload is unavailable.
      });
    return () => {
      ignore = true;
    };
  }, [isEdit, listingId, setField]);

  return null;
}

function WizardBody({ isEdit, listingId, initialStatus }) {
  const { currentStep, submitted, field } = useRegister();
  if (submitted) {
    const isResubmitted =
      isEdit &&
      (initialStatus === 'REJECTED' ||
        (initialStatus === 'DRAFT' && Boolean(field('f_submitForReview'))));
    return (
      <SuccessScreen
        accent="var(--teal)"
        title={isEdit ? 'Billboard Updated!' : 'Billboard Listed!'}
        desc={
          isResubmitted
            ? 'Your billboard listing has been updated and submitted for verification. It will be live on the marketplace once verified.'
            : isEdit
              ? 'Your billboard listing has been successfully updated.'
              : 'Your billboard listing has been created and submitted for verification. It will be live on the marketplace once verified.'
        }
        timeline={
          isResubmitted ? SUCCESS_TIMELINE : isEdit ? EDIT_SUCCESS_TIMELINE : SUCCESS_TIMELINE
        }
        dashboardTo={ROUTES.ownerListingsTab}
        dashboardLabel="Back to Dashboard"
      />
    );
  }
  const Step = STEP_COMPONENTS[currentStep - 1];
  return (
    <>
      <EditAvailabilityHydrator isEdit={isEdit} listingId={listingId} />
      <Step />
    </>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function createSubmitHandler({
  isEdit,
  id,
  apiClient = ownerListingApi,
  env = import.meta.env,
  mapPayload,
} = {}) {
  return async ({ data }) => {
    let payload;
    try {
      payload = mapPayload
        ? mapPayload(data, isEdit)
        : isEdit
          ? mapFormDataToPatchPayload(data)
          : mapBillboardListing(data);
    } catch (err) {
      if (err instanceof FieldFormatError) {
        throw new Error(err.userMessage, { cause: err });
      }
      throw err;
    }

    try {
      if (isEdit) {
        await apiClient.updateListing(id, payload);
      } else {
        await apiClient.createListing(payload);
      }
    } catch (err) {
      if (env?.DEV && (err?.response?.status === 401 || err?.response?.status === 403)) {
        console.warn('[DEV] Auth error suppressed on edit submit.');
        return;
      }
      const fallback = isEdit
        ? 'Failed to update billboard listing.'
        : 'Failed to create billboard listing.';
      throw new Error(apiErrorMessage(err, fallback), { cause: err });
    }
  };
}

export function NewBillboardListing() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const stateListing = location.state?.listing;
  const isEdit = Boolean(id);

  const [initialData, setInitialData] = useState(() => {
    if (!isEdit) return { f_minBookingValue: 1, f_minBookingUnit: 'MONTHS' };
    if (stateListing) return mapListingToFormData(stateListing);
    return null;
  });
  const [loading, setLoading] = useState(() => isEdit && !stateListing);

  useEffect(() => {
    if (!isEdit) {
      return;
    }

    if (!/^\d+$/.test(id)) {
      navigate(ROUTES.ownerDashboard, { replace: true });
      return;
    }

    let ignore = false;
    const controller = new AbortController();

    async function fetchListing() {
      try {
        if (!stateListing) setLoading(true);
        const res = await ownerListingApi.getListing(id, { signal: controller.signal });
        if (ignore) return;
        const dto = res?.data ?? res;
        const mapped = mapListingToFormData(dto);
        setInitialData(mapped);
      } catch (err) {
        if (ignore || axios.isCancel?.(err) || err?.name === 'CanceledError') return;
        if (stateListing) {
          setInitialData(mapListingToFormData(stateListing));
          return;
        }
        if (import.meta.env.DEV) {
          const mock = LISTINGS.find((l) => String(l.id) === String(id));
          if (mock) {
            setInitialData(mapListingToFormData(mock));
            return;
          }
        }
        navigate(ROUTES.ownerDashboard, { replace: true });
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    fetchListing();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [id, isEdit, navigate, stateListing]);

  const onSubmit = async ({ data }) => {
    try {
      const stagedDeleteIds = data.f_stagedDeleteIds || [];
      const dayPhotos = data.f_dayPhotos || [];
      const nightPhotos = data.f_nightPhotos || [];
      const surroundingPhotos = data.f_surroundingPhotos || [];
      const video = data.f_video || [];

      const allNewFiles = [
        ...dayPhotos
          .map(normalizeUploadItem)
          .filter(Boolean)
          .map((it) => ({ ...it, category: 'DAY_PHOTO' })),
        ...nightPhotos
          .map(normalizeUploadItem)
          .filter(Boolean)
          .map((it) => ({ ...it, category: 'NIGHT_PHOTO' })),
        ...surroundingPhotos
          .map(normalizeUploadItem)
          .filter(Boolean)
          .map((it) => ({ ...it, category: 'SURROUNDING_PHOTO' })),
        ...video
          .map(normalizeUploadItem)
          .filter(Boolean)
          .map((it) => ({ ...it, category: 'VIDEO' })),
      ];

      const selectedCover = data.f_selectedCover;

      if (isEdit) {
        const payload = mapFormDataToPatchPayload(data);
        await ownerListingApi.updateListing(id, payload);

        // 1. Synchronize media first (settles additions & staged deletions)
        if (stagedDeleteIds.length > 0 || allNewFiles.length > 0) {
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
            stagedDeleteIds,
            fileMappings,
          };
          const syncResult = await ownerListingApi.syncMedia(id, manifest, filesToSend);

          // Safe state hydration: clear staged files and deletes immediately so retries won't duplicate
          data.f_stagedDeleteIds = [];
          data.f_dayPhotos = [];
          data.f_nightPhotos = [];
          data.f_surroundingPhotos = [];
          data.f_video = [];

          if (selectedCover?.type === 'NEW') {
            const activeCover = syncResult.find((m) => m.isCover);
            data.f_selectedCover = activeCover ? { type: 'EXISTING', id: activeCover.id } : null;
          }
        }

        // 2. If an existing photo was designated as cover, invoke setCover AFTER syncMedia
        const serverInitialCoverId = initialData?.media?.find((m) => m.isCover)?.id || null;
        if (
          selectedCover?.type === 'EXISTING' &&
          (selectedCover.id !== serverInitialCoverId ||
            stagedDeleteIds.includes(serverInitialCoverId))
        ) {
          try {
            await ownerListingApi.setCover(id, selectedCover.id);
          } catch (coverErr) {
            const coverError = new Error(
              `Media updated, but setting cover photo failed: ${apiErrorMessage(coverErr)}. Please retry setting cover.`,
              { cause: coverErr },
            );
            coverError.isSubmissionFailure = true;
            throw coverError;
          }
        }

        // Sync availability calendar if user modified blocked dates after hydration
        if (data.f_availabilityLoaded && data.f_availabilityDirty) {
          const ranges = dayStatusMapToRanges(
            data.f_blockedDates || {},
            new Set(data.f_lockedBookedDates || []),
            new Set(data.f_lockedHoldDates || []),
          );
          await availabilityApi.syncListingAvailability(id, ranges, data.f_availabilityEtag);
        }

        // If the listing was previously REJECTED, or DRAFT with submit requested,
        // submit for moderation review to prevent leaving listings stranded in DRAFT status.
        const prevStatus = data?.status || initialData?.status || stateListing?.status;
        const shouldSubmitForReview =
          prevStatus === 'REJECTED' || (prevStatus === 'DRAFT' && Boolean(data?.f_submitForReview));

        if (shouldSubmitForReview) {
          try {
            await ownerListingApi.submitListing(id);
          } catch (submitErr) {
            const submitMsg = apiErrorMessage(
              submitErr,
              'Failed to submit listing for verification.',
            );
            const submissionError = new Error(
              `Changes saved, but submitting for review failed: ${submitMsg} Please retry.`,
              { cause: submitErr },
            );
            submissionError.isSubmissionFailure = true;
            throw submissionError;
          }
        }
      } else {
        const payload = mapBillboardListing(data);
        const res = await ownerListingApi.createListing(payload);
        const newListingId = res?.id ?? res?.data?.id;

        // Upload media files if any
        if (allNewFiles.length > 0) {
          const hasExplicitDayCover = allNewFiles.some(
            (item) =>
              item.category === 'DAY_PHOTO' &&
              selectedCover?.type === 'NEW' &&
              selectedCover.uploadId === item.id,
          );
          let firstDayAssigned = false;
          const fileMappings = allNewFiles.map((item, idx) => {
            let isCover = false;
            if (item.category === 'DAY_PHOTO') {
              if (hasExplicitDayCover) {
                isCover = selectedCover?.type === 'NEW' && selectedCover.uploadId === item.id;
              } else if (!firstDayAssigned) {
                isCover = true;
                firstDayAssigned = true;
              }
            }
            return {
              clientIndex: idx,
              category: item.category,
              uploadId: item.id,
              isCover,
            };
          });
          const filesToSend = allNewFiles.map((item) => item.file);
          const manifest = {
            stagedDeleteIds: [],
            fileMappings,
          };
          await ownerListingApi.syncMedia(newListingId, manifest, filesToSend);
        }

        // Submit listing for moderation approval
        await ownerListingApi.submitListing(newListingId);
      }
    } catch (err) {
      if (err.isSubmissionFailure) {
        throw err;
      }
      if (err instanceof FieldFormatError) {
        throw new Error(err.userMessage, { cause: err });
      }
      if (import.meta.env.DEV && (err?.response?.status === 401 || err?.response?.status === 403)) {
        console.warn('[DEV] Auth error suppressed on edit submit.');
        return;
      }
      const fallback = isEdit
        ? 'Failed to update billboard listing.'
        : 'Failed to create billboard listing.';
      throw new Error(apiErrorMessage(err, fallback), { cause: err });
    }
  };

  if (loading || !initialData) {
    return (
      <div className="owner-register-page new-billboard-listing-page" data-testid="listing-loading">
        <div
          className="new-billboard-loading"
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '50vh',
            color: 'var(--text-muted, #888)',
          }}
        >
          <p>Loading billboard details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="owner-register-page new-billboard-listing-page">
      <RegisterProvider
        key={id ?? 'new'}
        totalSteps={3}
        validate={validate}
        initialData={initialData}
        onSubmit={onSubmit}
      >
        <RegisterShell
          tagline={isEdit ? 'Edit Billboard Listing' : 'Add New Billboard Listing'}
          steps={STEPS}
          signInTo={ROUTES.ownerListingsTab}
          cancelTo={ROUTES.ownerListingsTab}
        >
          <WizardBody
            isEdit={isEdit}
            listingId={id}
            initialStatus={initialData?.status || stateListing?.status}
          />
        </RegisterShell>
      </RegisterProvider>
    </div>
  );
}

export default NewBillboardListing;
