import { cn } from '@/lib/cn';
import * as vr from '@/lib/validators';
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
  LogoUpload,
  OtpVerify,
  TermsRow,
  ReviewBlock,
  ReviewRow,
  InfoBanner,
  WarningBanner,
  NotifRow,
  SignedInBanner,
} from '@/features/register';
import { CategoryAccordion, KeyClients, Portfolio } from './widgets';

const TOTAL = 7;

const PINCODE_MAP = {
  400001: 'Mumbai, Maharashtra',
  400093: 'Mumbai, Maharashtra',
  110001: 'New Delhi, Delhi',
  560001: 'Bengaluru, Karnataka',
  600001: 'Chennai, Tamil Nadu',
  411001: 'Pune, Maharashtra',
  500001: 'Hyderabad, Telangana',
};

const AGENCY_TYPES = [
  { value: '', label: 'Select type' },
  'Full-Service Ad Agency',
  'Media Planning Agency',
  'Creative Studio',
  'PR & Communications Firm',
  'Production House',
  'Market Research Firm',
  'Digital Agency (with OOH)',
  'Other',
];
const YEARS_EXP = [
  { value: '', label: 'Select range' },
  'Less than 1 year',
  '1–3 years',
  '3–5 years',
  '5–10 years',
  '10–20 years',
  '20+ years',
];
const TENDER_BUDGETS = [
  '₹0 – ₹1 Lakh',
  '₹1L – ₹10L',
  '₹10L – ₹50L',
  '₹50L – ₹1 Crore',
  '₹1 Crore – ₹50 Crore',
  '₹50 Crore – ₹200 Crore',
  '₹200 Crore+',
  'All budgets',
];
const PRICING_MODELS = [
  { value: '', label: 'Select pricing model' },
  'Fixed',
  'Monthly Retainer',
  'Commission-Based',
  'Flexible',
];
const GEO_COVERAGE = [
  { value: '', label: 'Select coverage' },
  { value: 'pan_india', label: 'Pan India' },
  { value: 'single_city', label: 'Single City' },
  { value: 'multi_city', label: 'Multiple Cities (More than 2)' },
  { value: 'state', label: 'State-level' },
  { value: 'regional', label: 'Regional (North / South / West / East)' },
];

const SERVICE_CATEGORIES = [
  {
    key: 'pr',
    title: 'PR & Communications',
    items: [
      'Media Relations',
      'Crisis Management',
      'Brand Reputation',
      'Press Release Writing',
      'Event PR',
    ],
  },
  {
    key: 'media-buy',
    title: 'Media Buying & Planning',
    items: [
      'OOH / Outdoor Media',
      'Print Media',
      'TV & Radio',
      'Transit Advertising',
      'Airport Advertising',
      'Mall Activations',
    ],
  },
  {
    key: 'creative',
    title: 'Creative Agency',
    items: [
      'Brand Identity & Design',
      'Copywriting',
      'Art Direction',
      'Campaign Conceptualisation',
      'Motion Graphics / Animation',
    ],
  },
  {
    key: 'digital',
    title: 'Digital Marketing',
    items: [
      'SEO & Content Marketing',
      'Social Media Marketing',
      'Google / Meta Ads',
      'Email Marketing',
      'Programmatic Advertising',
      'App Marketing',
    ],
  },
  {
    key: 'production',
    title: 'Production House',
    items: [
      'TVC & Ad Films',
      'Photography & Product Shoots',
      'Corporate Films',
      '3D Visualisation',
      'Jingle & Audio Production',
    ],
  },
  {
    key: 'influencer',
    title: 'Influencer Marketing',
    items: [
      'Micro Influencers',
      'Celebrity Endorsements',
      'UGC Campaigns',
      'Instagram / Reels',
      'YouTube Campaigns',
    ],
  },
  {
    key: 'fullsvc',
    title: 'Full-Service Agency',
    items: [
      '360° Campaign Management',
      'Integrated Brand Strategy',
      'Research & Consumer Insights',
      'ATL + BTL Execution',
    ],
  },
];

const INDUSTRY_CATEGORIES = [
  {
    key: 'finance',
    title: 'Finance & Protection',
    items: ['Financial Services', 'Banking & Insurance', 'Legal Services', 'Accounting & Auditing'],
  },
  {
    key: 'commerce',
    title: 'Commerce & Lifestyle',
    items: [
      'Retail & E-Commerce',
      'Food & Beverage',
      'Personal Care & Beauty',
      'Textiles & Apparel',
      'Furniture & Home Goods',
    ],
  },
  {
    key: 'health',
    title: 'Health & Life Sciences',
    items: ['Healthcare & Pharmaceuticals', 'Biotechnology & Life Sciences'],
  },
  {
    key: 'tech',
    title: 'Technology & Connectivity',
    items: [
      'Information Technology & Software',
      'Telecommunications',
      'Electronics & Semiconductors',
    ],
  },
  {
    key: 'media',
    title: 'Media, Entertainment & Sports',
    items: ['Media & Entertainment', 'Sports & Recreation', 'Advertising & Marketing'],
  },
  {
    key: 'mobility',
    title: 'Mobility & Manufacturing',
    items: ['Automotive', 'Aerospace & Defense'],
  },
  {
    key: 'travel',
    title: 'Travel, Living & Real Estate',
    items: ['Hospitality & Tourism', 'Real Estate'],
  },
  {
    key: 'education',
    title: 'Education & Professional Services',
    items: ['Education', 'Consulting & Professional Services'],
  },
  { key: 'energy', title: 'Energy & Materials', items: ['Renewable Energy', 'Chemicals'] },
];

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

/* ── STEP 1: LOGIN SETUP ── */
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
            : 'Create your login credentials first — this secures your account from the start.'
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
              placeholder="priya@pixelprint.in"
              hint="Use your agency's official business email address."
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
        Receive email notifications for new matching tenders and direct inquiries{' '}
        <strong style={{ color: 'var(--ink)', fontWeight: 500 }}>(recommended)</strong>
      </NotifRow>
      <RegNav showBack={false} nextLabel="Continue to Agency Info" saveHint="Progress auto-saved" />
    </div>
  );
}

/* ── STEP 2: AGENCY INFO ── */
export function Step2() {
  const { field, setField } = useRegister();
  const pin = field('f_pincode');
  const suggestion = pin.length === 6 ? PINCODE_MAP[pin] || '' : '';
  const pinErr = useFieldError('f_pincode', [vr.required(), vr.pincode()]);
  const line1Err = useFieldError('f_addressLine1', [vr.required()]);
  const cityErr = useFieldError('f_city', [vr.required()]);
  const stateErr = useFieldError('f_state', [vr.required()]);

  const handlePincodeBlur = (e) => {
    pinErr.onBlur(e);
    const match = PINCODE_MAP[pin];
    if (match) {
      const [autoCity, autoState] = match.split(',').map((s) => s.trim());
      if (!field('f_city').trim() && autoCity) setField('f_city', autoCity);
      if (!field('f_state').trim() && autoState) setField('f_state', autoState);
    }
  };

  return (
    <div className="step-panel active">
      <StepHeader
        step={2}
        total={TOTAL}
        heading="Agency"
        headingEm="Information"
        sub="Tell us about your company. This becomes your public profile."
      />
      <FormSection title="Brand Identity">
        <Field
          name="f_agencyName"
          label="Agency / Company Name"
          required
          placeholder="e.g., Pixel & Print Communications Pvt. Ltd."
        />
        <Field
          name="f_tagline"
          label={
            <>
              Tagline <span className="opt">(optional — but recommended)</span>
            </>
          }
          placeholder="e.g., India's most trusted OOH media planning agency"
          hint="One punchy line that appears on your public profile. A great tagline helps you stand out and attracts more inquiries."
        />
      </FormSection>

      <FormSection title="Company Details">
        <FormRow>
          <Field
            name="f_agencyType"
            type="select"
            label="Agency Type"
            required
            options={AGENCY_TYPES}
          />
          <Field
            name="f_yearEst"
            type="number"
            label="Year Established"
            required
            placeholder="2010"
            min="1980"
            max="2026"
          />
        </FormRow>
        <Field
          name="f_about"
          type="textarea"
          rows={4}
          label={
            <>
              About Your Agency <span className="opt">(optional — but recommended)</span>
            </>
          }
          placeholder="Describe your agency's specialisations, notable clients or campaigns, and what makes you stand out. This appears prominently on your public profile."
          hint="Well-written profiles attract 3× more inquiries. Keep it concise and compelling."
        />
      </FormSection>

      <FormSection title="Location">
        <FormRow>
          <Field
            name="f_website"
            type="url"
            label="Website"
            optional
            placeholder="https://yourwebsite.com"
          />
          <div className="form-group">
            <label>
              Headquarters Pincode <span className="req">*</span>
            </label>
            <input
              type="text"
              className={cn('form-control', pinErr.invalidClass)}
              maxLength={6}
              placeholder="400001"
              value={pin}
              onChange={(e) => setField('f_pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
              onBlur={handlePincodeBlur}
            />
            <div className={cn('pincode-autofill', suggestion && 'show')}>{suggestion}</div>
            <FieldError show={pinErr.show} error={pinErr.error} />
          </div>
        </FormRow>

        <Field
          name="f_addressLine1"
          label="Address Line 1"
          required
          placeholder="e.g., 4th Floor, Pinnacle Business Park"
          error={line1Err}
        />
        <Field
          name="f_addressLine2"
          label={
            <>
              Address Line 2 <span className="opt">(optional)</span>
            </>
          }
          placeholder="e.g., Andheri East"
        />
        <FormRow>
          <Field
            name="f_landmark"
            label={
              <>
                Landmark <span className="opt">(optional)</span>
              </>
            }
            placeholder="e.g., Near Metro Station"
          />
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
        </FormRow>
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
      </FormSection>

      <FormSection
        last
        title={
          <>
            Agency Logo{' '}
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

      <RegNav nextLabel="Continue to Services" saveHint="Progress auto-saved" />
    </div>
  );
}

/* ── STEP 3: CONTACT PERSON ── */
export function Step3() {
  const { field, setField, showToast } = useRegister();
  const phone = field('f_phone').replace(/\D/g, '');
  const emailErr = useFieldError('f_email', [vr.required(), vr.email()]);
  const phoneErr = useFieldError('f_phone', [vr.required(), vr.phone()]);
  const useLoginEmail = () => {
    const login = field('f_loginEmail').trim();
    if (!login) {
      showToast('Please enter your login email in Step 1 first.', 'error');
      return;
    }
    setField('f_email', login);
    showToast('Login email copied to contact email.', 'success');
  };
  return (
    <div className="step-panel active">
      <StepHeader
        step={3}
        total={TOTAL}
        heading="Contact"
        headingEm="Person"
        sub="Your designated AdBasket contact for all business inquiries."
      />
      <FormSection title="Personal Details">
        <FormRow>
          <Field name="f_firstName" label="First Name" required placeholder="Priya" />
          <Field name="f_lastName" label="Last Name" required placeholder="Mehta" />
        </FormRow>
        <Field
          name="f_desig"
          label="Designation / Role"
          required
          placeholder="e.g., Managing Director, Business Head, Account Manager"
        />
      </FormSection>

      <FormSection last title="Contact Channels">
        <div className="form-group">
          <label>
            Business Email <span className="req">*</span>
          </label>
          <input
            type="email"
            className={cn('form-control', emailErr.invalidClass)}
            placeholder="priya@pixelprint.in"
            value={field('f_email')}
            onChange={(e) => setField('f_email', e.target.value)}
            onBlur={emailErr.onBlur}
          />
          {emailErr.show ? (
            <FieldError show={emailErr.show} error={emailErr.error} />
          ) : (
            <div className="form-hint">Must be your agency domain email — not Gmail or Yahoo.</div>
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
              value={field('f_phone')}
              onChange={(e) => setField('f_phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
              onBlur={phoneErr.onBlur}
            />
          </div>
          {phoneErr.show ? (
            <FieldError show={phoneErr.show} error={phoneErr.error} />
          ) : (
            <div className={cn('form-hint', phone.length === 10 && 'success')}>
              {phone.length === 10
                ? 'Looks good — verify your number below.'
                : 'Enter your 10-digit mobile number'}
            </div>
          )}
          <OtpVerify
            sendIcon={PhoneIcon}
            label="Verify Mobile via OTP"
            typeLabel="Mobile"
            disabled={phone.length !== 10}
            getDest={() => `+91 ${phone || 'your number'}`}
          />
        </div>
        <div className="form-group">
          <label>
            Office Landline <span className="opt">(optional)</span>
          </label>
          <div className="phone-wrap">
            <span className="phone-prefix">+91</span>
            <input
              type="tel"
              className="form-control"
              placeholder="22 2222 3333"
              value={field('f_contactNo')}
              onChange={(e) => setField('f_contactNo', e.target.value)}
            />
          </div>
        </div>
        <Field
          name="f_linkedin"
          type="url"
          label="LinkedIn Profile"
          optional
          placeholder="https://linkedin.com/in/yourname"
        />
      </FormSection>

      <RegNav nextLabel="Continue to Services" />
    </div>
  );
}

/* ── STEP 4: SERVICES & EXPERTISE ── */
export function Step4() {
  return (
    <div className="step-panel active">
      <StepHeader
        step={4}
        total={TOTAL}
        heading="Services &"
        headingEm="Expertise"
        sub="The more relevant your offerings, the more targeted your inquiries."
      />
      <FormSection
        title={
          <>
            Services Offered <span className="req">*</span>
          </>
        }
        hint="click a category to expand · select all that apply"
      >
        <CategoryAccordion group="services" categories={SERVICE_CATEGORIES} />
      </FormSection>

      <FormSection title="Scale & Range">
        <FormRow>
          <Field
            name="f_yearsExp"
            type="select"
            label="Years of Experience"
            required
            options={YEARS_EXP}
          />
        </FormRow>
        <KeyClients />
      </FormSection>

      <FormSection
        title={
          <>
            Industries Served <span className="req">*</span>
          </>
        }
        hint="click a category to expand · select all that apply"
      >
        <CategoryAccordion group="industries" categories={INDUSTRY_CATEGORIES} headerCheckbox />
      </FormSection>

      <FormSection
        last
        title={
          <>
            Expertise Tags{' '}
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
              shown on your public profile
            </span>
          </>
        }
      >
        <Field
          name="f_expertiseTags"
          label={null}
          placeholder="e.g., FMCG, Retail, Real Estate, Automotive, Healthcare"
          hint="Separate tags with commas. These appear prominently on your public profile."
        />
      </FormSection>

      <Portfolio />

      <RegNav nextLabel="Continue to Business Details" />
    </div>
  );
}

/* ── STEP 5: BUSINESS DETAILS ── */
export function Step5() {
  const { field, setField } = useRegister();
  const coverage = field('f_geoCoverage');
  const needsCity = coverage && coverage !== 'pan_india';
  const cityLabel =
    coverage === 'single_city'
      ? 'City of Operation'
      : coverage === 'state'
        ? 'State'
        : coverage === 'regional'
          ? 'Region'
          : 'Cities of Operation';
  return (
    <div className="step-panel active">
      <StepHeader
        step={5}
        total={TOTAL}
        heading="Business"
        headingEm="Details"
        sub="Lets clients see your capacity and service location before they reach you."
      />
      <FormSection title="Track Record">
        <FormRow>
          <Field
            name="f_campaigns"
            type="number"
            label="Campaigns Completed (Approx.)"
            required
            placeholder="e.g., 120"
            min="0"
            step="1"
          />
          <Field
            name="f_tenderBudget"
            type="select"
            label="Tender Budgets to Bid On"
            required
            options={TENDER_BUDGETS}
          />
        </FormRow>
        <FormRow>
          <Field
            name="f_pricingModel"
            type="select"
            label="Pricing Model"
            required
            options={PRICING_MODELS}
            hint={
              <>
                <strong style={{ color: 'var(--ink)' }}>Fixed</strong> — one-time fee &nbsp;·&nbsp;{' '}
                <strong style={{ color: 'var(--ink)' }}>Retainer</strong> — recurring &nbsp;·&nbsp;{' '}
                <strong style={{ color: 'var(--ink)' }}>Commission</strong> — % of spend
              </>
            }
          />
          <Field name="f_languages" label="Languages" placeholder="Hindi, English, Marathi" />
        </FormRow>
      </FormSection>

      <FormSection last title="Geography">
        <FormRow>
          <Field
            name="f_geoCoverage"
            type="select"
            label="Geographic Coverage"
            required
            options={GEO_COVERAGE}
          />
          {needsCity && (
            <div className="form-group">
              <label>
                {cityLabel} <span className="req">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g., Mumbai"
                value={field('f_cities')}
                onChange={(e) => setField('f_cities', e.target.value)}
              />
            </div>
          )}
        </FormRow>
      </FormSection>

      <RegNav nextLabel="Continue to Verification" />
    </div>
  );
}

/* ── STEP 6: VERIFICATION DOCS ── */
export function Step6() {
  const { field, setField } = useRegister();
  const gst = field('f_gst');
  const pan = field('f_pan');
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  const gstStatus = !gst
    ? ''
    : gst.length < 15
      ? `${gst.length} / 15 characters`
      : gstRegex.test(gst)
        ? 'Valid GSTIN format ✓'
        : 'Invalid GSTIN format';
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
  const panStatus = !pan
    ? ''
    : pan.length < 10
      ? `${pan.length} / 10 characters`
      : panRegex.test(pan)
        ? 'Valid PAN format ✓'
        : 'Invalid PAN format';

  return (
    <div className="step-panel active">
      <StepHeader
        step={6}
        total={TOTAL}
        heading="Verification"
        headingEm="Documents"
        sub="Clients trust verified agencies. Add your GST & PAN now."
      />
      <InfoBanner>
        <strong>Verified tag = 3× more inquiries.</strong> Agencies with both GST + PAN verified
        receive significantly more direct business leads. It takes under 30 seconds to enter.
      </InfoBanner>

      <div className="verification-row">
        <div className="verification-card">
          <div className="v-icon-wrap">
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
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <div className="v-title">GST Registration</div>
          <input
            type="text"
            className="form-control"
            placeholder="27AAPFU0939F1Z5"
            maxLength={15}
            style={{
              marginBottom: 10,
              fontFamily: 'var(--font-mono)',
              letterSpacing: 1.5,
              fontSize: 13,
            }}
            value={gst}
            onChange={(e) => setField('f_gst', e.target.value.toUpperCase().slice(0, 15))}
          />
          <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{gstStatus}</div>
        </div>
        <div className="verification-card">
          <div className="v-icon-wrap">
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
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          </div>
          <div className="v-title">
            PAN Card{' '}
            <span
              style={{
                fontSize: 11.5,
                fontWeight: 300,
                color: 'var(--ink-faint)',
                fontStyle: 'italic',
              }}
            >
              (Optional — not compulsory)
            </span>
          </div>
          <input
            type="text"
            className="form-control"
            placeholder="AAPFU0939F"
            maxLength={10}
            style={{
              marginBottom: 10,
              fontFamily: 'var(--font-mono)',
              letterSpacing: 1.5,
              fontSize: 13,
              textTransform: 'uppercase',
            }}
            value={pan}
            onChange={(e) => setField('f_pan', e.target.value.toUpperCase().slice(0, 10))}
          />
          <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{panStatus}</div>
        </div>
      </div>

      <div className="docs-public-notice">
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0, marginTop: 2 }}
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <span>Documents are never shared publicly.</span>
      </div>

      <FormSection last title="Other Identification" style={{ marginTop: 28, paddingTop: 0 }}>
        <Field
          name="f_regNum"
          label="Company Registration Number"
          optional
          placeholder="U74999MH2020PTC123456"
        />
      </FormSection>

      <RegNav nextLabel="Continue to Review" />
    </div>
  );
}

/* ── STEP 7: REVIEW ── */
export function Step7() {
  const { field, selection, submit } = useRegister();
  const v = (n) => String(field(n)).trim();
  const svcCount = selection('services').length;
  const indCount = selection('industries').length;
  const pan = v('f_pan');

  return (
    <div className="step-panel active">
      <StepHeader
        step={7}
        total={TOTAL}
        heading="Review &"
        headingEm="Submit"
        sub="Please review your information. Your profile will go live within 48 hrs."
      />
      <ReviewBlock>
        <ReviewRow label="Login Email" value={v('f_loginEmail')} editStep={1} />
        <ReviewRow
          label="Agency"
          value={v('f_agencyName') ? <strong>{v('f_agencyName')}</strong> : ''}
          editStep={2}
        />
        <ReviewRow label="Tagline" value={v('f_tagline')} editStep={2} />
        <ReviewRow
          label="Headquarters"
          value={[
            v('f_addressLine1'),
            v('f_addressLine2'),
            v('f_landmark'),
            v('f_city'),
            v('f_state'),
          ]
            .filter(Boolean)
            .join(', ')}
          editStep={2}
        />
        <ReviewRow
          label="Contact"
          value={[[v('f_firstName'), v('f_lastName')].filter(Boolean).join(' '), v('f_desig')]
            .filter(Boolean)
            .join(' — ')}
          editStep={3}
        />
        <ReviewRow label="Services" value={svcCount ? `${svcCount} selected` : ''} editStep={4} />
        <ReviewRow label="Industries" value={indCount ? `${indCount} selected` : ''} editStep={4} />
        <ReviewRow
          label="Business"
          value={[v('f_campaigns') && `${v('f_campaigns')} campaigns`, v('f_pricingModel')]
            .filter(Boolean)
            .join(' · ')}
          editStep={5}
        />
        <ReviewRow label="Reg. No." value={v('f_regNum')} editStep={6} />
        <ReviewRow
          label="Verification"
          value={[v('f_gst') && 'GST ✓', pan && 'PAN ✓'].filter(Boolean).join(' · ')}
          editStep={6}
        />
      </ReviewBlock>

      {!pan && (
        <WarningBanner>
          PAN not yet entered. Add PAN now to unlock the full Verified tag and get 3× more
          inquiries.
        </WarningBanner>
      )}

      <TermsRow name="f_termsAccept">
        I confirm all information is accurate and agree to the <a href="#">Terms of Service</a> and{' '}
        <a href="#">Privacy Policy</a> of The AdBasket.
      </TermsRow>
      <div
        style={{
          fontSize: 12,
          color: 'var(--ink-faint)',
          fontWeight: 300,
          marginBottom: 8,
          padding: '0 4px',
        }}
      >
        Profile will be live within 48 hrs after admin verification.
      </div>

      <div className="reg-nav">
        <BackButton />
        <button className="btn-next btn-submit" onClick={submit}>
          Submit Agency for Review →
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
