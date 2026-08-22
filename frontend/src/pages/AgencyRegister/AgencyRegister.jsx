import { ROUTES } from '@/lib/routes';
import { RegisterProvider, RegisterShell, useRegister, SuccessScreen } from '@/features/register';
import { Step1, Step2, Step3, Step4, Step5, Step6, Step7 } from './steps';
import { useAuth } from '@/context/AuthContext';
import { mapAgency } from '@/features/auth/registrationMappers';
import { apiErrorMessage } from '@/lib/apiClient';
import './AgencyRegister.css';

const STEPS = [
  { title: 'Login Setup', desc: 'Email & password' },
  { title: 'Agency Info', desc: 'Name, type, HQ location' },
  { title: 'Contact Person', desc: 'Primary contact details' },
  { title: 'Services & Expertise', desc: 'What you offer, industries' },
  { title: 'Business Details', desc: 'Scale, geography, pricing' },
  { title: 'Verification Docs', desc: 'GST + PAN for verified tag' },
  { title: 'Review & Submit', desc: 'Final check, terms' },
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
    text: 'Check your registered email for your registration receipt and what to expect next.',
    icon: tIcon(
      <>
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </>,
    ),
  },
  {
    title: 'Admin verification in progress',
    text: 'GST, company details and profile reviewed — typically within 48 hrs.',
    icon: tIcon(
      <>
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </>,
    ),
  },
  {
    title: 'Profile goes live',
    text: "Your agency appears in The AdBasket's agency directory — visible to thousands of businesses immediately.",
    icon: tIcon(
      <>
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </>,
    ),
  },
  {
    title: 'Start receiving inquiries & tenders',
    text: 'Businesses can find and contact you. Browse active tenders to submit bids right away.',
    icon: tIcon(
      <>
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      </>,
    ),
  },
];

function validate(step, { data, selections, showToast }) {
  const d = (k) => String(data[k] ?? '').trim();
  const fail = (msg) => {
    showToast(msg, 'error');
    return false;
  };
  if (step === 1) {
    if (!d('f_loginEmail').includes('@')) return fail('Please enter a valid login email.');
    if ((data.f_password ?? '').length < 8) return fail('Password must be at least 8 characters.');
    if ((data.f_password ?? '') !== (data.f_confirmPassword ?? ''))
      return fail('Passwords do not match.');
  }
  if (step === 2) {
    if (!d('f_agencyName')) return fail('Please enter your agency name.');
    if (!d('f_agencyType')) return fail('Please select an agency type.');
    if (!d('f_yearEst')) return fail('Please enter the year established.');
    if (!d('f_pincode')) return fail('Please enter your headquarters pincode.');
    if (!d('f_officeAddress')) return fail('Please enter your office address.');
  }
  if (step === 3) {
    if (!d('f_firstName') || !d('f_lastName')) return fail('Please enter the contact person name.');
    if (!d('f_desig')) return fail('Please enter a designation.');
    if (!d('f_email')) return fail('Please enter a business email.');
    if (d('f_phone').replace(/\D/g, '').length !== 10)
      return fail('Please enter a valid 10-digit mobile number.');
  }
  if (step === 4) {
    if ((selections.services ?? []).length === 0)
      return fail('Please select at least one service.');
    if (!d('f_yearsExp')) return fail('Please select your years of experience.');
    if ((selections.industries ?? []).length === 0)
      return fail('Please select at least one industry.');
  }
  if (step === 5) {
    if (!d('f_campaigns')) return fail('Please enter the number of campaigns completed.');
    if (!d('f_pricingModel')) return fail('Please select a pricing model.');
    if (!d('f_geoCoverage')) return fail('Please select your geographic coverage.');
  }
  if (step === 6) {
    const gst = d('f_gst');
    if (gst && gst.length !== 15) return fail('GST Number should be 15 characters.');
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
        accent="var(--saffron)"
        title="Application Sent!"
        desc="Your agency registration is under review. Our team verifies all agencies within 48 hrs before your profile goes live on The AdBasket."
        timeline={SUCCESS_TIMELINE}
        dashboardTo={ROUTES.agencies}
        dashboardLabel="Back to Agency Hub"
      />
    );
  }
  const Step = STEP_COMPONENTS[currentStep - 1];
  return <Step />;
}

export function AgencyRegister() {
  const { registerAgency } = useAuth();
  const onSubmit = async ({ data, selections }) => {
    try {
      await registerAgency(mapAgency(data, selections));
    } catch (err) {
      throw new Error(apiErrorMessage(err), { cause: err });
    }
  };
  return (
    <div className="agency-register-page">
      <RegisterProvider
        totalSteps={7}
        validate={validate}
        validateSubmit={validateSubmit}
        initialData={{ f_tenderBudget: '₹0 – ₹1 Lakh' }}
        onSubmit={onSubmit}
      >
        <RegisterShell
          tagline="Agency Registration"
          steps={STEPS}
          signInTo={ROUTES.agencies}
          cancelTo={ROUTES.agencies}
        >
          <WizardBody />
        </RegisterShell>
      </RegisterProvider>
    </div>
  );
}

export default AgencyRegister;
