import { ROUTES } from '@/lib/routes';
import { RegisterProvider, RegisterShell, useRegister, SuccessScreen } from '@/features/register';
import { ListingStep1, ListingStep2, ListingStep3 } from './steps';
import { mapBillboardListing } from '@/features/auth/registrationMappers';
import { ownerListingApi } from '@/features/owner/ownerListingApi';
import { apiErrorMessage } from '@/lib/apiClient';
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

function validate(step, { data, showToast }) {
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
    if (!d('f_bbPin') || !/^\d{6}$/.test(d('f_bbPin')))
      return fail('Please enter a valid 6-digit billboard pincode.');
    if (!d('f_bbType')) return fail('Please select a billboard type.');
    if (!d('f_bbWidth') || Number(d('f_bbWidth')) <= 0)
      return fail('Please enter a valid width in feet.');
    if (!d('f_bbHeight') || Number(d('f_bbHeight')) <= 0)
      return fail('Please enter a valid height in feet.');
    if (!d('f_facing')) return fail('Please select a facing direction.');
    if (!d('f_trafficType')) return fail('Please select a traffic type.');
    if (!d('f_audience')) return fail('Please select an audience type.');
  }
  if (step === 2) {
    if (!d('f_startPrice') || Number(d('f_startPrice')) <= 0)
      return fail('Please enter a starting price.');
    if (!d('f_minBooking')) return fail('Please select a minimum booking duration.');
  }
  return true;
}

const STEP_COMPONENTS = [ListingStep1, ListingStep2, ListingStep3];

function WizardBody() {
  const { currentStep, submitted } = useRegister();
  if (submitted) {
    return (
      <SuccessScreen
        accent="var(--teal)"
        title="Billboard Listed!"
        desc="Your billboard listing has been created and submitted for verification. It will be live on the marketplace once verified."
        timeline={SUCCESS_TIMELINE}
        dashboardTo={ROUTES.ownerDashboard}
        dashboardLabel="Back to My Listings"
      />
    );
  }
  const Step = STEP_COMPONENTS[currentStep - 1];
  return <Step />;
}

export function NewBillboardListing() {
  const onSubmit = async ({ data }) => {
    try {
      const payload = mapBillboardListing(data);
      await ownerListingApi.createListing(payload);
    } catch (err) {
      throw new Error(apiErrorMessage(err, 'Failed to create billboard listing.'), { cause: err });
    }
  };

  return (
    <div className="owner-register-page new-billboard-listing-page">
      <RegisterProvider totalSteps={3} validate={validate} initialData={{}} onSubmit={onSubmit}>
        <RegisterShell
          tagline="Add New Billboard Listing"
          steps={STEPS}
          signInTo={ROUTES.ownerDashboard}
          cancelTo={ROUTES.ownerDashboard}
        >
          <WizardBody />
        </RegisterShell>
      </RegisterProvider>
    </div>
  );
}

export default NewBillboardListing;
