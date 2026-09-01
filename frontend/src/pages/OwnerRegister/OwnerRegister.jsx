import { ROUTES } from '@/lib/routes';
import { RegisterProvider, RegisterShell, useRegister, SuccessScreen } from '@/features/register';
import { Step1, Step2, Step3, Step4, Step5, Step6, Step7 } from './steps';
import { useAuth } from '@/context/AuthContext';
import { mapOwner } from '@/features/auth/registrationMappers';
import { apiErrorMessage } from '@/lib/apiClient';
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

function validate(step, { data, showToast, user }) {
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
    } else if (!user.hasPassword && pw) {
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
  }
  if (step === 3) {
    if (!d('f_bbName')) return fail('Please enter a billboard name.');
    if (!d('f_bbAddr')) return fail('Please enter the billboard address.');
    if (!d('f_bbCity')) return fail('Please enter the billboard city.');
    if (!d('f_bbState')) return fail('Please enter the billboard state.');
    if (!d('f_bbPin')) return fail('Please enter the billboard pincode.');
    if (!d('f_bbType')) return fail('Please select a billboard type.');
    if (!d('f_bbWidth') || !d('f_bbHeight')) return fail('Please enter the billboard dimensions.');
    if (!d('f_facing')) return fail('Please select a facing direction.');
    if (!d('f_trafficType')) return fail('Please select a traffic type.');
    if (!d('f_audience')) return fail('Please select an audience type.');
  }
  if (step === 4) {
    if (!d('f_startPrice')) return fail('Please enter a starting price.');
    if (!d('f_minBooking')) return fail('Please select a minimum booking duration.');
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

function WizardBody() {
  const { currentStep, submitted } = useRegister();
  if (submitted) {
    return (
      <SuccessScreen
        accent="var(--teal)"
        title="Submitted!"
        desc="Your registration is under review. Our team will verify your business details and listing within 2–3 working days."
        timeline={SUCCESS_TIMELINE}
        dashboardTo={ROUTES.owners}
        dashboardLabel="Back to Owner Hub"
      />
    );
  }
  const Step = STEP_COMPONENTS[currentStep - 1];
  return <Step />;
}

export function OwnerRegister() {
  const { registerOwner, user } = useAuth();
  const prefill = user
    ? {
        f_email: user.email,
        f_firstName: user.firstName || '',
        f_lastName: user.lastName || '',
        f_phone: (user.phone || '').replace(/\D/g, '').slice(-10),
      }
    : {};
  const onSubmit = async ({ data }) => {
    try {
      await registerOwner(mapOwner(data));
    } catch (err) {
      throw new Error(apiErrorMessage(err), { cause: err });
    }
  };
  return (
    <div className="owner-register-page">
      <RegisterProvider
        totalSteps={7}
        validate={(step, ctx) => validate(step, { ...ctx, user })}
        validateSubmit={validateSubmit}
        initialData={prefill}
        onSubmit={onSubmit}
      >
        <RegisterShell
          tagline="Billboard Owner Registration"
          steps={STEPS}
          signInTo={ROUTES.owners}
          cancelTo={ROUTES.owners}
        >
          <WizardBody />
        </RegisterShell>
      </RegisterProvider>
    </div>
  );
}

export default OwnerRegister;
