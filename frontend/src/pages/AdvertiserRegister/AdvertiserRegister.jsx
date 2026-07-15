import { ROUTES } from '@/lib/routes';
import { RegisterProvider, RegisterShell, useRegister, SuccessScreen } from '@/features/register';
import { Step1, Step2, Step3, Step4, Step5, Step6, Step7 } from './steps';
import './AdvertiserRegister.css';

const STEPS = [
  { title: 'Login Setup', desc: 'Email & password' },
  { title: 'Business Information', desc: 'Company, type, industry' },
  { title: 'Contact Details', desc: 'Primary contact & address' },
  { title: 'Project Details', desc: 'What you want to advertise' },
  { title: 'Budget & Quotations', desc: 'Budget range, agency prefs' },
  { title: 'Verification & Attachments', desc: 'GST, PAN, brand files' },
  { title: 'Review & Submit', desc: 'Final check, terms' },
];

const timelineIcon = (paths) => (
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
    title: 'Under Review',
    text: 'Our team verifies your business and requirement details — usually within 24 hours.',
    icon: timelineIcon(
      <>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </>,
    ),
  },
  {
    title: 'Goes Live',
    text: 'Once approved, your requirement becomes visible to matching agencies on AdBasket.',
    icon: timelineIcon(
      <>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </>,
    ),
  },
  {
    title: 'Receive Quotations',
    text: 'Agencies matching your filters submit proposals — compare and award from your dashboard.',
    icon: timelineIcon(<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />),
  },
];

function validate(step, { data, selections, showToast }) {
  const d = (k) => String(data[k] ?? '').trim();
  const fail = (msg) => {
    showToast(msg, 'error');
    return false;
  };

  if (step === 1) {
    const email = d('f_loginEmail');
    const pw = data.f_password ?? '';
    if (!email || !email.includes('@')) return fail('Please enter a valid login email.');
    if (pw.length < 8) return fail('Password must be at least 8 characters.');
    if (pw !== (data.f_confirmPassword ?? '')) return fail('Passwords do not match.');
  }
  if (step === 2) {
    if (!d('f_companyName')) return fail('Please enter your company name.');
    if (!d('f_businessType')) return fail('Please select a business type.');
    if ((selections.industries ?? []).length === 0)
      return fail('Please select at least one industry category.');
  }
  if (step === 3) {
    if (!d('f_firstName')) return fail("Please enter the contact person's name.");
    if (!d('f_desig')) return fail('Please enter a designation.');
    if (!d('f_email')) return fail('Please enter an email address.');
    if (d('f_phone').replace(/\D/g, '').length !== 10)
      return fail('Please enter a valid 10-digit mobile number.');
    if (!d('f_pincode')) return fail('Please enter your PIN code.');
    if (!d('f_officeAddress')) return fail('Please enter your office address.');
  }
  if (step === 4) {
    if (!d('f_projectTitle')) return fail('Please enter a project title.');
    if (!d('f_projectDesc')) return fail('Please describe your project.');
    if (!d('f_targetAudience')) return fail('Please describe your target audience.');
    if (!d('f_targetLocation')) return fail('Please enter a target location.');
    if (!d('f_startDate')) return fail('Please select an expected start date.');
    if (!d('f_duration')) return fail('Please select a project duration.');
  }
  if (step === 5) {
    if (!d('f_budgetMinValue')) return fail('Please enter a minimum budget.');
    if (!d('f_budgetMaxValue')) return fail('Please enter a maximum budget.');
    if (!d('f_quoteCount')) return fail('Please select the number of quotations required.');
    if ((selections.agencyPref ?? []).length === 0)
      return fail('Please select at least one agency preference.');
  }
  if (step === 6) {
    const gst = d('f_gst');
    if (gst && gst.length !== 15) return fail('GST Number should be 15 characters.');
  }
  return true;
}

function validateSubmit({ data, showToast }) {
  if (!data.f_termsAccept) {
    showToast('Please accept the Terms & Conditions to continue.', 'error');
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
        title="You're"
        titleEm="all set"
        desc="Your account is created and your requirement is submitted for review."
        timeline={SUCCESS_TIMELINE}
        dashboardTo={ROUTES.advertiserDashboard}
        dashboardLabel="Go to My Dashboard"
      />
    );
  }
  const Step = STEP_COMPONENTS[currentStep - 1];
  return <Step />;
}

export function AdvertiserRegister() {
  return (
    <div className="advertiser-register-page">
      <RegisterProvider totalSteps={7} validate={validate} validateSubmit={validateSubmit}>
        <RegisterShell
          tagline="Advertiser Registration"
          steps={STEPS}
          signInTo={ROUTES.advertisers}
          cancelTo={ROUTES.advertisers}
        >
          <WizardBody />
        </RegisterShell>
      </RegisterProvider>
    </div>
  );
}

export default AdvertiserRegister;
