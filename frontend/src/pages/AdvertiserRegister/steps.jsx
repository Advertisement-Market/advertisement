import { cn } from '@/lib/cn';
import { ROUTES } from '@/lib/routes';
import * as v from '@/lib/validators';
import { useAuth } from '@/context/AuthContext';
import {
  useRegister,
  useFieldError,
  FieldError,
  Field,
  FormSection,
  FormRow,
  StepHeader,
  RegNav,
  PasswordField,
  ConfirmPasswordField,
  MultiSelectDropdown,
  TogglePills,
  RadioCards,
  YesNoToggle,
  LogoUpload,
  VerificationCard,
  UploadButton,
  AttachZone,
  OtpVerify,
  ReviewBlock,
  ReviewRow,
  TermsRow,
  InfoBanner,
  WarningBanner,
  NotifRow,
  SignedInBanner,
} from '@/features/register';

const TOTAL = 7;

const BUSINESS_TYPES = [
  'Select business type',
  'Startup',
  'SME',
  'Corporate',
  'Manufacturer',
  'Retailer',
  'Service Provider',
  'Educational Institution',
  'NGO',
  'Government Organization',
  'Other',
].map((t, i) => (i === 0 ? { value: '', label: t } : t));

const DURATIONS = [
  'Select duration',
  'Less than 1 week',
  '1–2 weeks',
  '1 month',
  '1–3 months',
  '3–6 months',
  '6–12 months',
  'Ongoing / Long-term',
].map((t, i) => (i === 0 ? { value: '', label: t } : t));

const INDUSTRIES = [
  'Electronics',
  'Healthcare',
  'Real Estate',
  'FMCG',
  'Education',
  'Fashion',
  'Agriculture',
  'Technology',
  'Other',
];

const UNIT_OPTIONS = [
  { value: 'thousand', label: 'Thousand' },
  { value: 'lakh', label: 'Lakh' },
  { value: 'crore', label: 'Crore' },
];

const QUOTE_CARDS = [
  { value: '3', label: '3 Agencies' },
  { value: '5', label: '5 Agencies' },
  { value: '10', label: '10 Agencies' },
  { value: '10+', label: 'More than 10' },
];

const AGENCY_PREFS = [
  { value: 'verified', label: 'Verified Agencies Only' },
  { value: 'local', label: 'Local Agencies' },
  { value: 'national', label: 'National Agencies' },
  { value: 'international', label: 'International Agencies' },
  { value: 'open', label: 'Open to All' },
];

const ADDITIONAL_FILTERS = [
  { value: 'gst', label: 'GST Verified' },
  { value: 'msme', label: 'MSME Verified' },
  { value: 'experience', label: 'Minimum Experience' },
  { value: 'expertise', label: 'Industry Expertise' },
  { value: 'badge', label: 'Verified Badge Holders' },
];

const FLEX_OPTIONS = [
  { value: 'yes', label: 'Yes — open to adjusting based on proposals' },
  { value: 'no', label: 'No — fixed budget' },
];

const PINCODE_MAP = {
  400001: 'Mumbai, Maharashtra',
  400063: 'Mumbai, Maharashtra',
  110001: 'New Delhi, Delhi',
  560001: 'Bengaluru, Karnataka',
  600001: 'Chennai, Tamil Nadu',
  700001: 'Kolkata, West Bengal',
  411001: 'Pune, Maharashtra',
  380001: 'Ahmedabad, Gujarat',
  500001: 'Hyderabad, Telangana',
  302001: 'Jaipur, Rajasthan',
  226001: 'Lucknow, Uttar Pradesh',
  160001: 'Chandigarh, Punjab',
};

const EnvelopeIcon = (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);
const PhoneIcon = (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
  </svg>
);

const FileIcon = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);
const GearIcon = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const attachIcon = (paths) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {paths}
  </svg>
);

/* ── STEP 1 ── */
export function Step1() {
  const { isAuthenticated, user } = useAuth();
  const needsPassword = isAuthenticated && !user?.hasPassword; // Google account without a password

  return (
    <div className="step-panel active">
      <StepHeader
        step={1}
        total={TOTAL}
        heading="Login"
        headingEm="Setup"
        sub={
          isAuthenticated
            ? 'Your account is ready — continue below.'
            : 'Set up your email and password.'
        }
      />
      {isAuthenticated && <SignedInBanner user={user} />}
      <FormSection title="Credentials">
        {!isAuthenticated && (
          <>
            <Field
              name="f_loginEmail"
              type="email"
              label="Login Email"
              required
              placeholder="you@yourcompany.com"
              hint="Use your business email address — this will be your AdBasket login."
            />
            <PasswordField
              name="f_password"
              label="Password"
              required
              placeholder="Min. 8 characters with uppercase, number, symbol"
              showReqs
            />
            <ConfirmPasswordField
              name="f_confirmPassword"
              against="f_password"
              label="Confirm Password"
              required
              placeholder="Re-enter your password"
            />
          </>
        )}
        {needsPassword && (
          <>
            <div className="form-hint" style={{ marginBottom: 12 }}>
              Optionally set a password so you can also sign in with your email. You can skip this
              and keep using Google.
            </div>
            <PasswordField
              name="f_password"
              label="Create Password (optional)"
              placeholder="Min. 8 characters with uppercase, number, symbol"
              showReqs
            />
            <ConfirmPasswordField
              name="f_confirmPassword"
              against="f_password"
              label="Confirm Password"
              placeholder="Re-enter your password"
            />
          </>
        )}
        {isAuthenticated && user?.hasPassword && (
          <div className="form-hint">
            Your login and password are already set — nothing to do here.
          </div>
        )}
      </FormSection>
      <NotifRow>
        Receive email notifications for new quotations and vendor responses{' '}
        <strong style={{ color: 'var(--ink)', fontWeight: 500 }}>(recommended)</strong>
      </NotifRow>
      <RegNav
        showBack={false}
        nextLabel="Continue to Business Info"
        saveHint="Progress auto-saved"
      />
    </div>
  );
}

/* ── STEP 2 ── */
export function Step2() {
  return (
    <div className="step-panel active">
      <StepHeader
        step={2}
        total={TOTAL}
        heading="Business"
        headingEm="Information"
        sub="Tell us about your business."
      />
      <FormSection title="Company Identity">
        <Field
          name="f_companyName"
          label="Company Name"
          required
          placeholder="e.g., Nimbus Foods Pvt. Ltd."
        />
        <FormRow>
          <Field
            name="f_businessType"
            type="select"
            label="Business Type"
            required
            options={BUSINESS_TYPES}
          />
          <Field
            name="f_website"
            type="url"
            label="Website URL"
            optional
            placeholder="https://yourcompany.com"
          />
        </FormRow>
      </FormSection>

      <FormSection
        title={
          <>
            Industry Category <span className="req">*</span>
          </>
        }
        hint="select all that apply"
      >
        <div className="form-group" style={{ marginBottom: 0 }}>
          <MultiSelectDropdown
            group="industries"
            options={INDUSTRIES}
            placeholder="Select one or more industries"
          />
          <div className="form-hint">
            Pick the categories that best describe what your business sells or offers.
          </div>
        </div>
      </FormSection>

      <FormSection
        last
        title={
          <>
            Company Logo{' '}
            <span
              style={{
                fontSize: 10,
                fontWeight: 400,
                textTransform: 'none',
                letterSpacing: 0,
                color: 'var(--ink-faint)',
                marginLeft: 4,
              }}
            >
              optional
            </span>
          </>
        }
      >
        <LogoUpload />
      </FormSection>

      <RegNav nextLabel="Continue to Contact Details" saveHint="Progress auto-saved" />
    </div>
  );
}

/* ── STEP 3 ── */
export function Step3() {
  const { field, setField, showToast } = useRegister();
  const phone = field('f_phone');
  const pincode = field('f_pincode');
  const phoneOk = phone.replace(/\D/g, '').length === 10;
  const suggestion = pincode.length === 6 ? PINCODE_MAP[pincode] || '' : '';
  const emailErr = useFieldError('f_email', [v.required(), v.email()]);
  const phoneErr = useFieldError('f_phone', [v.required(), v.phone()]);
  const pincodeErr = useFieldError('f_pincode', [v.required(), v.pincode()]);
  const line1Err = useFieldError('f_addressLine1', [v.required()]);
  const cityErr = useFieldError('f_city', [v.required()]);
  const stateErr = useFieldError('f_state', [v.required()]);

  const useLoginEmail = () => {
    const login = field('f_loginEmail').trim();
    if (!login) {
      showToast('Please enter your login email in Step 1 first.', 'error');
      return;
    }
    setField('f_email', login);
    showToast('Login email copied to contact email.', 'success');
  };

  const handlePincodeBlur = (e) => {
    pincodeErr.onBlur(e);
    const match = PINCODE_MAP[pincode];
    if (match) {
      const [autoCity, autoState] = match.split(',').map((s) => s.trim());
      if (!field('f_city').trim() && autoCity) setField('f_city', autoCity);
      if (!field('f_state').trim() && autoState) setField('f_state', autoState);
    }
  };

  return (
    <div className="step-panel active">
      <StepHeader
        step={3}
        total={TOTAL}
        heading="Contact"
        headingEm="Details"
        sub="Add your contact details."
      />

      <FormSection title="Personal Details">
        <FormRow>
          <Field
            name="f_firstName"
            label="Contact Person Name"
            required
            placeholder="Rohan Sharma"
          />
          <Field
            name="f_desig"
            label="Designation"
            required
            placeholder="e.g., Marketing Manager, Founder, Owner"
          />
        </FormRow>
      </FormSection>

      <FormSection title="Contact Channels">
        <div className="form-group">
          <label>
            Email Address <span className="req">*</span>
          </label>
          <input
            type="email"
            className={cn('form-control', emailErr.invalidClass)}
            placeholder="rohan@nimbusfoods.in"
            value={field('f_email')}
            onChange={(e) => setField('f_email', e.target.value)}
            onBlur={emailErr.onBlur}
          />
          {emailErr.show ? (
            <FieldError show={emailErr.show} error={emailErr.error} />
          ) : (
            <div className="form-hint">
              We&apos;ll send quotation alerts and updates to this address.
            </div>
          )}
          <button
            type="button"
            onClick={useLoginEmail}
            style={{
              marginTop: 7,
              background: 'none',
              border: '1.5px solid rgba(79,70,229,0.25)',
              borderRadius: 8,
              padding: '6px 13px',
              fontSize: 12,
              color: 'var(--saffron)',
              cursor: 'pointer',
              fontWeight: 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {EnvelopeIcon}
            Use same email as Login Setup
          </button>
          <OtpVerify
            sendIcon={EnvelopeIcon}
            label="Verify Email via OTP"
            typeLabel="Email"
            getDest={() => field('f_email').trim() || 'your email'}
          />
        </div>

        <div className="form-group">
          <label>
            Mobile Number <span className="req">*</span>
          </label>
          <div className="phone-wrap">
            <span className="phone-prefix">+91</span>
            <input
              type="tel"
              className={cn('form-control', phoneErr.invalidClass)}
              placeholder="98765 43210"
              value={phone}
              onChange={(e) => setField('f_phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
              onBlur={phoneErr.onBlur}
            />
          </div>
          {phoneErr.show ? (
            <FieldError show={phoneErr.show} error={phoneErr.error} />
          ) : (
            <div className={cn('form-hint', phoneOk && 'success')}>
              {phoneOk
                ? 'Looks good — verify your number below.'
                : 'Enter your 10-digit mobile number'}
            </div>
          )}
          <OtpVerify
            sendIcon={PhoneIcon}
            label="Verify Mobile via OTP"
            typeLabel="Mobile"
            disabled={!phoneOk}
            getDest={() => `+91 ${phone.trim() || 'your number'}`}
          />
        </div>
      </FormSection>

      <FormSection last title="Office Location">
        <div className="form-group">
          <label>
            Address Line 1 <span className="req">*</span>
          </label>
          <input
            type="text"
            className={cn('form-control', line1Err.invalidClass)}
            placeholder="12th Floor, Lotus Corporate Park"
            value={field('f_addressLine1')}
            onChange={(e) => setField('f_addressLine1', e.target.value)}
            onBlur={line1Err.onBlur}
          />
          <FieldError show={line1Err.show} error={line1Err.error} />
        </div>
        <Field
          name="f_addressLine2"
          label={
            <>
              Address Line 2 <span className="opt">(optional)</span>
            </>
          }
          placeholder="Goregaon East"
        />
        <Field
          name="f_landmark"
          label={
            <>
              Landmark <span className="opt">(optional)</span>
            </>
          }
          placeholder="e.g., Near Filmcity Road"
        />
        <FormRow>
          <div className="form-group">
            <label>
              City <span className="req">*</span>
            </label>
            <input
              type="text"
              className={cn('form-control', cityErr.invalidClass)}
              placeholder="Mumbai"
              value={field('f_city')}
              onChange={(e) => setField('f_city', e.target.value)}
              onBlur={cityErr.onBlur}
            />
            <FieldError show={cityErr.show} error={cityErr.error} />
          </div>
          <div className="form-group">
            <label>
              State <span className="req">*</span>
            </label>
            <input
              type="text"
              className={cn('form-control', stateErr.invalidClass)}
              placeholder="Maharashtra"
              value={field('f_state')}
              onChange={(e) => setField('f_state', e.target.value)}
              onBlur={stateErr.onBlur}
            />
            <FieldError show={stateErr.show} error={stateErr.error} />
          </div>
        </FormRow>
        <div className="form-group">
          <label>
            PIN Code <span className="req">*</span>
          </label>
          <input
            type="text"
            className={cn('form-control', pincodeErr.invalidClass)}
            maxLength={6}
            placeholder="400001"
            value={pincode}
            onChange={(e) => setField('f_pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
            onBlur={handlePincodeBlur}
          />
          <div className={cn('pincode-autofill', suggestion && 'show')}>{suggestion}</div>
          <FieldError show={pincodeErr.show} error={pincodeErr.error} />
        </div>
      </FormSection>

      <RegNav nextLabel="Continue to Project Details" />
    </div>
  );
}
/* ── STEP 4 ── */
export function Step4() {
  return (
    <div className="step-panel active">
      <StepHeader
        step={4}
        total={TOTAL}
        heading="Project"
        headingEm="Details"
        sub="Tell us what you want to advertise."
      />
      <FormSection title="Requirement Overview">
        <Field
          name="f_projectTitle"
          label="Project Title"
          required
          placeholder="e.g., Diwali Season Billboard Campaign — Mumbai & Pune"
        />
        <Field
          name="f_projectDesc"
          type="textarea"
          rows={5}
          label="Project Description"
          required
          placeholder="Describe your advertising requirement — what you want to promote, the kind of media you're looking for (billboards, transit, digital screens, etc.), and any specific creative or placement preferences."
          hint="A clear, detailed brief helps agencies send more accurate and relevant quotations."
        />
      </FormSection>
      <FormSection title="Audience & Reach">
        <Field
          name="f_targetAudience"
          label="Target Audience"
          required
          placeholder="e.g., Urban millennials, age 22–35, mid-to-high income"
          hint="Describe the demographic, age group, or customer segment you want to reach."
        />
        <Field
          name="f_targetLocation"
          label="Target Location"
          required
          placeholder="e.g., Mumbai, Pune, Bengaluru — or Pan India"
          hint="Cities, regions, or specific areas where you want your ad to be displayed."
        />
      </FormSection>
      <FormSection last title="Timeline">
        <FormRow>
          <Field name="f_startDate" type="date" label="Expected Start Date" required />
          <Field
            name="f_duration"
            type="select"
            label="Project Duration"
            required
            options={DURATIONS}
          />
        </FormRow>
      </FormSection>
      <RegNav nextLabel="Continue to Budget & Quotations" />
    </div>
  );
}

/* ── STEP 5 ── */
export function Step5() {
  return (
    <div className="step-panel active">
      <StepHeader
        step={5}
        total={TOTAL}
        heading="Budget &"
        headingEm="Quotations"
        sub="Set your budget and quotation preferences."
      />
      <FormSection
        title={
          <>
            Estimated Budget Range <span className="req">*</span>
          </>
        }
      >
        <FormRow>
          <div className="form-group">
            <label>
              Minimum Budget <span className="req">*</span>
            </label>
            <div className="budget-input-group">
              <BudgetValue name="f_budgetMinValue" placeholder="e.g., 50" />
              <BudgetUnit name="f_budgetMinUnit" defaultUnit="thousand" />
            </div>
          </div>
          <div className="form-group">
            <label>
              Maximum Budget <span className="req">*</span>
            </label>
            <div className="budget-input-group">
              <BudgetValue name="f_budgetMaxValue" placeholder="e.g., 2" />
              <BudgetUnit name="f_budgetMaxUnit" defaultUnit="lakh" />
            </div>
          </div>
        </FormRow>
      </FormSection>

      <FormSection title="Flexible Budget?">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <YesNoToggle name="f_flexBudget" options={FLEX_OPTIONS} />
        </div>
      </FormSection>

      <FormSection
        title={
          <>
            Number of Quotations Required <span className="req">*</span>
          </>
        }
      >
        <RadioCards
          name="f_quoteCount"
          options={QUOTE_CARDS}
          groupStyle={{ flexDirection: 'row', flexWrap: 'wrap' }}
          cardStyle={{ flex: 1, minWidth: 140 }}
        />
      </FormSection>

      <FormSection
        title={
          <>
            Agency Preference <span className="req">*</span>
          </>
        }
        hint="select all that apply"
      >
        <TogglePills group="agencyPref" options={AGENCY_PREFS} />
      </FormSection>

      <FormSection
        last
        title={
          <>
            Additional Filters <span className="opt">(optional)</span>
          </>
        }
        hint="select all that apply"
      >
        <TogglePills group="additionalFilters" options={ADDITIONAL_FILTERS} />
      </FormSection>

      <RegNav nextLabel="Continue to Verification" />
    </div>
  );
}

function BudgetValue({ name, placeholder }) {
  const { field, setField } = useRegister();
  const err = useFieldError(name, [v.required(), v.number()]);
  return (
    <input
      type="number"
      className={cn('form-control', err.invalidClass)}
      min="0"
      step="any"
      placeholder={placeholder}
      value={field(name)}
      onChange={(e) => setField(name, e.target.value)}
      onBlur={err.onBlur}
    />
  );
}
function BudgetUnit({ name, defaultUnit }) {
  const { field, setField } = useRegister();
  const value = field(name) || defaultUnit;
  return (
    <select className="form-control" value={value} onChange={(e) => setField(name, e.target.value)}>
      {UNIT_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/* ── STEP 6 ── */
export function Step6() {
  const { field, setField } = useRegister();
  const gst = field('f_gst');
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  let gstHint = { text: '15-character GSTIN as per your GST registration certificate.', cls: '' };
  if (gst.length > 0 && gst.length < 15)
    gstHint = { text: `${gst.length} / 15 characters`, cls: '' };
  else if (gst.length === 15)
    gstHint = gstRegex.test(gst)
      ? { text: 'Valid GSTIN format.', cls: 'success' }
      : {
        text: "This doesn't look like a valid GSTIN format — please double-check.",
        cls: 'warning',
      };

  return (
    <div className="step-panel active">
      <StepHeader
        step={6}
        total={TOTAL}
        heading="Verification &"
        headingEm="Attachments"
        sub="Verify your business and add files."
      />

      <InfoBanner>
        GST, PAN, registration certificate, and MSME certificate are all <strong>optional</strong>,
        but providing them helps your profile stand out to agencies and speeds up verification.
      </InfoBanner>

      <FormSection title="Business Verification">
        <div className="form-group">
          <label>
            GST Number <span className="opt">(optional)</span>
          </label>
          <input
            type="text"
            className="form-control"
            maxLength={15}
            placeholder="22AAAAA0000A1Z5"
            style={{ fontFamily: 'var(--font-mono)', letterSpacing: 1, textTransform: 'uppercase' }}
            value={gst}
            onChange={(e) => setField('f_gst', e.target.value.toUpperCase().slice(0, 15))}
          />
          <div className={cn('form-hint', gstHint.cls)}>{gstHint.text}</div>
        </div>
        <Field
          name="f_pan"
          label="PAN Number"
          optional
          maxLength={10}
          placeholder="AAAAA0000A"
          style={{ fontFamily: 'var(--font-mono)', letterSpacing: 1, textTransform: 'uppercase' }}
        />
      </FormSection>

      <FormSection
        title={
          <>
            Verification Documents <span className="opt">(optional, but recommended)</span>
          </>
        }
      >
        <div className="verification-row">
          <VerificationCard
            icon={FileIcon}
            title="Company Registration Certificate"
            sub="Incorporation certificate, partnership deed, or business registration proof."
          />
          <VerificationCard
            icon={GearIcon}
            title="MSME Certificate"
            sub="Udyam registration certificate, if your business is MSME registered."
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>
            Company Profile <span className="opt">(optional)</span>
          </label>
          <UploadButton
            label="Upload company profile / brochure (PDF, PPT, DOC — max 10MB)"
            accept=".pdf,.ppt,.pptx,.doc,.docx"
            style={{ padding: '10px 14px' }}
            onUploaded="Company profile uploaded."
          />
        </div>
      </FormSection>

      <FormSection
        last
        title={
          <>
            Campaign Attachments <span className="opt">(optional)</span>
          </>
        }
      >
        <div className="attach-grid">
          <AttachZone
            title="Images"
            sub="Product / brand photos"
            accept="image/*"
            icon={attachIcon(
              <>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </>,
            )}
          />
          <AttachZone
            title="Product Brochure"
            sub="PDF / DOC"
            accept=".pdf,.doc,.docx"
            multiple={false}
            icon={attachIcon(
              <>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </>,
            )}
          />
          <AttachZone
            title="Brand Guidelines"
            sub="Logo usage, colors, fonts"
            accept=".pdf,.zip,image/*"
            icon={attachIcon(
              <>
                <circle cx="13.5" cy="6.5" r=".5" />
                <circle cx="17.5" cy="10.5" r=".5" />
                <circle cx="8.5" cy="7.5" r=".5" />
                <circle cx="6.5" cy="12.5" r=".5" />
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
              </>,
            )}
          />
          <AttachZone
            title="Video Files"
            sub="Ad creatives, reels"
            accept="video/*"
            icon={attachIcon(
              <>
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" />
              </>,
            )}
          />
          <AttachZone
            title="Design Files"
            sub="PSD, AI, Figma exports"
            accept=".psd,.ai,.fig,.pdf,image/*"
            icon={attachIcon(
              <>
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </>,
            )}
          />
          <AttachZone
            title="Additional Documents"
            sub="Anything else relevant"
            icon={attachIcon(
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />,
            )}
          />
        </div>
        <div className="docs-public-notice">
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
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Verification documents are kept private and only used internally for badge approval.
        </div>
      </FormSection>

      <RegNav nextLabel="Continue to Review" />
    </div>
  );
}

/* ── STEP 7 ── */
export function Step7() {
  const { field, selection, submit } = useRegister();
  const v = (name) => String(field(name)).trim();

  const industries = selection('industries');
  const contactName = v('f_firstName');
  const desig = v('f_desig');
  const projTitle = v('f_projectTitle');
  const dur = v('f_duration');

  const unitLabels = { thousand: 'Thousand', lakh: 'Lakh', crore: 'Crore' };
  const minVal = v('f_budgetMinValue');
  const maxVal = v('f_budgetMaxValue');
  const minUnit = field('f_budgetMinUnit') || 'thousand';
  const maxUnit = field('f_budgetMaxUnit') || 'lakh';
  const flex = field('f_flexBudget');
  let budgetText = '—';
  if (minVal && maxVal)
    budgetText = `₹${minVal} ${unitLabels[minUnit]} – ₹${maxVal} ${unitLabels[maxUnit]}`;
  else if (minVal) budgetText = `₹${minVal} ${unitLabels[minUnit]} (min)`;
  else if (maxVal) budgetText = `₹${maxVal} ${unitLabels[maxUnit]} (max)`;
  if (flex) budgetText += ` · ${flex === 'yes' ? 'Flexible' : 'Fixed'} budget`;

  const quoteLabels = {
    3: '3 Agencies',
    5: '5 Agencies',
    10: '10 Agencies',
    '10+': 'More than 10 Agencies',
  };
  const prefLabels = Object.fromEntries(AGENCY_PREFS.map((p) => [p.value, p.label]));
  const quoteVal = field('f_quoteCount');
  const prefText = selection('agencyPref')
    .map((p) => prefLabels[p])
    .join(', ');

  return (
    <div className="step-panel active">
      <StepHeader
        step={7}
        total={TOTAL}
        heading="Review &"
        headingEm="Submit"
        sub="Check everything before you submit."
      />

      <FormSection title="Login & Business">
        <ReviewBlock>
          <ReviewRow label="Login Email" value={v('f_loginEmail')} editStep={1} />
          <ReviewRow label="Company" value={v('f_companyName')} editStep={2} />
          <ReviewRow label="Business Type" value={v('f_businessType')} editStep={2} />
          <ReviewRow
            label="Industries"
            value={industries.length ? industries.join(', ') : ''}
            editStep={2}
          />
        </ReviewBlock>
      </FormSection>

      <FormSection title="Contact">
        <ReviewBlock>
          <ReviewRow
            label="Contact Person"
            value={
              contactName ? (
                <>
                  <strong>{contactName}</strong>
                  {desig ? ` — ${desig}` : ''}
                </>
              ) : (
                ''
              )
            }
            editStep={3}
          />
          <ReviewRow label="Email" value={v('f_email')} editStep={3} />
          <ReviewRow
            label="Mobile"
            value={v('f_phone') ? `+91 ${v('f_phone')}` : ''}
            editStep={3}
          />
          <ReviewRow
            label="Address"
            value={[v('f_addressLine1'), v('f_addressLine2'), v('f_landmark'), v('f_city'), v('f_state'), v('f_pincode')]
              .filter(Boolean)
              .join(', ')}
            editStep={3}
          />
        </ReviewBlock>
      </FormSection>

      <FormSection title="Project & Budget">
        <ReviewBlock>
          <ReviewRow
            label="Project"
            value={
              projTitle ? (
                <>
                  <strong>{projTitle}</strong>
                  {dur ? ` · ${dur}` : ''}
                </>
              ) : (
                ''
              )
            }
            editStep={4}
          />
          <ReviewRow label="Location" value={v('f_targetLocation')} editStep={4} />
          <ReviewRow label="Budget" value={budgetText === '—' ? '' : budgetText} editStep={5} />
          <ReviewRow
            label="Quotations"
            value={[quoteVal ? quoteLabels[quoteVal] : '', prefText].filter(Boolean).join(' · ')}
            editStep={5}
          />
        </ReviewBlock>
      </FormSection>

      <FormSection title="Verification">
        <ReviewBlock>
          <ReviewRow label="GST Number" value={v('f_gst')} editStep={6} />
        </ReviewBlock>
      </FormSection>

      <FormSection last title="Terms">
        <TermsRow name="f_termsAccept">
          I confirm that the information provided is accurate, and I agree to AdBasket&apos;s{' '}
          <a href="#">Terms &amp; Conditions</a> and <a href="#">Privacy Policy</a>. I understand my
          requirement will be reviewed before being made live.
        </TermsRow>
        <WarningBanner>
          After submission, your requirement status will be set to{' '}
          <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>Pending Approval</strong>. Our
          team typically reviews and publishes new requirements within 24 hours.
        </WarningBanner>
      </FormSection>

      <div className="reg-nav">
        <BackButton />
        <button className="btn-next btn-submit btn-large" onClick={submit}>
          Submit Requirement
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function BackButton() {
  const { prevStep } = useRegister();
  return (
    <button className="btn-back" onClick={prevStep}>
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
        <polyline points="15 18 9 12 15 6" />
      </svg>
      Back
    </button>
  );
}
