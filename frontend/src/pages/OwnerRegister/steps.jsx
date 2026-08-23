import { cn } from '@/lib/cn';
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
  TermsRow,
  PasswordField,
  ConfirmPasswordField,
  SignedInBanner,
} from '@/features/register';
import {
  OtpBoxes,
  PasswordRulesField,
  ConfirmPwField,
  TypeGrid,
  SelectWithOther,
  OwnershipOptions,
  ApprovalOptions,
  UploadZone,
} from './widgets';
import { AvailabilityCalendar, PricingTable, MapPin } from './calendar';

const TOTAL = 7;

const PINCODE_MAP = {
  400001: 'Mumbai, Maharashtra',
  400053: 'Mumbai, Maharashtra',
  411001: 'Pune, Maharashtra',
  110001: 'New Delhi, Delhi',
  560001: 'Bengaluru, Karnataka',
  600001: 'Chennai, Tamil Nadu',
  700001: 'Kolkata, West Bengal',
  380001: 'Ahmedabad, Gujarat',
  500001: 'Hyderabad, Telangana',
};

const typeIcon = (paths) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {paths}
  </svg>
);

const TYPE_OPTIONS = [
  {
    label: 'Static Hoarding',
    icon: typeIcon(
      <>
        <rect x="3" y="3" width="18" height="18" rx="1" />
        <path d="M3 12h18M12 3v18" />
      </>,
    ),
  },
  {
    label: 'LED Digital',
    icon: typeIcon(
      <>
        <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
        <line x1="9" y1="21" x2="15" y2="21" />
        <line x1="10" y1="17" x2="14" y2="17" />
      </>,
    ),
  },
  {
    label: 'Unipole',
    icon: typeIcon(
      <>
        <line x1="12" y1="2" x2="12" y2="22" />
        <rect x="7" y="4" width="10" height="8" rx="1" />
      </>,
    ),
  },
  { label: 'Gantry', icon: typeIcon(<path d="M3 6h18M3 12h18M3 18h18" />) },
  {
    label: 'Bus Shelter',
    icon: typeIcon(
      <>
        <rect x="2" y="8" width="20" height="10" rx="1" />
        <path d="M8 8V6M16 8V6" />
      </>,
    ),
  },
  {
    label: 'Kiosk',
    icon: typeIcon(
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4l3 3" />
      </>,
    ),
  },
  {
    label: 'Digital Screen',
    icon: typeIcon(
      <>
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </>,
    ),
  },
  {
    label: 'Other',
    icon: typeIcon(
      <>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </>,
    ),
  },
];

const FACING = [
  'North',
  'North-East',
  'East',
  'South-East',
  'South',
  'South-West',
  'West',
  'North-West',
];
const TRAFFIC = [
  'City / Urban',
  'Highway',
  'Commercial Zone',
  'Residential Area',
  'Industrial',
  { value: 'other', label: 'Other' },
];
const AUDIENCE = [
  'IT Crowd / Tech Professionals',
  'Commuters',
  'Highway Travelers',
  'Local Residents',
  'Shoppers',
  'Students',
  'Mixed',
  { value: 'other', label: 'Other' },
];
const MIN_BOOKING = [
  { value: '1week', label: '1 Week' },
  { value: '2weeks', label: '2 Weeks' },
  { value: '3weeks', label: '3 Weeks' },
  { value: '1month', label: '1 Month (4 Weeks)' },
  { value: '2months', label: '2 Months (8 Weeks)' },
  { value: '3months', label: '3 Months' },
];

const OWNERSHIP = [
  {
    value: 'owned',
    label: 'Owned',
    desc: 'You own the structure completely',
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    value: 'leased',
    label: 'Leased / Rented',
    desc: 'You use the property on rent',
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
];
const APPROVAL = [
  { value: 'approved', text: 'Yes — Approved (Government approval obtained)' },
  { value: 'pending', text: 'No — Pending (Application submitted, awaiting approval)' },
  { value: 'na', text: 'Not Applicable (Private property, no municipal approval needed)' },
];

function usePincode(name) {
  const { field, setField } = useRegister();
  const val = field(name);
  const city = val.length === 6 ? PINCODE_MAP[val] || 'India' : '';
  const err = useFieldError(name, [v.required(), v.pincode()]);
  return { val, city, err, set: (val2) => setField(name, val2.replace(/\D/g, '').slice(0, 6)) };
}

/* ── STEP 1 ── */
export function Step1() {
  const { field } = useRegister();
  const { isAuthenticated, user } = useAuth();
  const needsPassword = isAuthenticated && !user?.hasPassword; // Google account without a password
  const phone = field('f_phone').replace(/\D/g, '');
  const phoneErr = useFieldError('f_phone', [v.required(), v.phone()]);
  return (
    <div className="step-panel active">
      <StepHeader
        step={1}
        total={TOTAL}
        heading="Personal"
        headingEm="Information"
        sub={
          isAuthenticated
            ? 'Your account is ready — just a few details to complete your owner profile.'
            : 'Your login details are secure & kept private.'
        }
      />
      {isAuthenticated && <SignedInBanner user={user} />}
      <FormSection title="Your Name">
        <FormRow>
          <Field name="f_firstName" label="First Name" required placeholder="Rajesh" />
          <Field name="f_lastName" label="Last Name" required placeholder="Sharma" />
        </FormRow>
      </FormSection>

      <FormSection title="Contact Details">
        {!isAuthenticated && (
          <div className="form-group">
            <Field
              name="f_email"
              type="email"
              label="Email Address"
              required
              placeholder="rajesh@sharmaoutdoor.com"
              hint="This will be your login ID"
              groupStyle={{ marginBottom: 8 }}
            />
            <OtpBoxes channel="email" dest={() => field('f_email').trim() || 'your email'} />
          </div>
        )}
        <div className="form-group">
          <label>
            Mobile Number <span className="req">*</span>
          </label>
          <PhoneInput invalidClass={phoneErr.invalidClass} onBlur={phoneErr.onBlur} />
          {phoneErr.show ? (
            <FieldError show={phoneErr.show} error={phoneErr.error} />
          ) : (
            <div className={cn('form-hint', phone.length === 10 && 'success')}>
              {phone.length === 10
                ? 'Looks good — verify your number below.'
                : 'Enter your 10-digit mobile number'}
            </div>
          )}
          <OtpBoxes
            channel="phone"
            disabled={phone.length !== 10}
            dest={() => `+91 ${phone || 'your number'}`}
          />
        </div>
      </FormSection>

      {!isAuthenticated && (
        <FormSection title="Set a Password">
          <PasswordRulesField
            name="f_password"
            placeholder="Min 8 chars, uppercase, number, symbol"
          />
          <ConfirmPwField name="f_confirmPassword" placeholder="Re-enter password" />
        </FormSection>
      )}
      {needsPassword && (
        <FormSection title="Set a Password (optional)">
          <div className="form-hint" style={{ marginBottom: 12 }}>
            Optionally set a password so you can also sign in with your email. You can skip this and
            keep using Google.
          </div>
          <PasswordField
            name="f_password"
            label="Create Password (optional)"
            placeholder="Min. 8 characters"
            showReqs
          />
          <ConfirmPasswordField
            name="f_confirmPassword"
            against="f_password"
            label="Confirm Password"
            placeholder="Re-enter password"
          />
        </FormSection>
      )}

      <RegNav
        showBack={false}
        nextLabel="Continue to Business Info"
        saveHint="Progress auto-saved"
      />
    </div>
  );
}

function PhoneInput({ invalidClass, onBlur }) {
  const { field, setField } = useRegister();
  return (
    <div className="phone-wrap">
      <span className="phone-prefix">+91</span>
      <input
        type="tel"
        className={cn('form-control', invalidClass)}
        placeholder="98765 43210"
        maxLength={10}
        value={field('f_phone')}
        onChange={(e) => setField('f_phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
        onBlur={onBlur}
      />
    </div>
  );
}

/* ── STEP 2 ── */
export function Step2() {
  const biz = usePincode('f_bizPin');
  return (
    <div className="step-panel active">
      <StepHeader
        step={2}
        total={TOTAL}
        heading="Business"
        headingEm="Information"
        sub="Your company details for verification. These are kept private from advertisers."
      />
      <FormSection title="Company Identity">
        <Field
          name="f_companyName"
          label="Company / Agency Name"
          required
          placeholder="Sharma Outdoor Advertising Pvt. Ltd."
        />
        <FormRow>
          <Field
            name="f_companyReg"
            label="Company Registration Number"
            optional
            placeholder="U74999MH2020PTC123456"
          />
          <Field
            name="f_companyPhone"
            type="tel"
            label="Company Phone"
            optional
            placeholder="+91 20 2222 3333"
          />
        </FormRow>
        <Field
          name="f_gst"
          label={
            <>
              GST Number <span className="opt">Optional — boosts trust</span>
            </>
          }
          placeholder="27AAPFU0939F1Z5"
          hint="Format: 27XXXXXXXXXX1Z5 (15 characters)"
        />
      </FormSection>

      <FormSection title="Office Address">
        <div className="form-group">
          <label>
            Office Pincode <span className="req">*</span>
          </label>
          <input
            type="text"
            className={cn('form-control', biz.err.invalidClass)}
            placeholder="411001"
            maxLength={6}
            value={biz.val}
            onChange={(e) => biz.set(e.target.value)}
            onBlur={biz.err.onBlur}
          />
          <div className={cn('pincode-autofill', biz.city && 'show')}>{biz.city}</div>
          <FieldError show={biz.err.show} error={biz.err.error} />
        </div>
        <Field
          name="f_bizAddr1"
          label="Address Line 1"
          required
          placeholder="Office / Shop No., Building Name"
        />
        <Field
          name="f_bizAddr2"
          label="Address Line 2"
          optional
          placeholder="Street, Area, Colony"
        />
      </FormSection>

      <RegNav nextLabel="Continue to Billboard Details" />
    </div>
  );
}

/* ── STEP 3 ── */
export function Step3() {
  const bb = usePincode('f_bbPin');
  return (
    <div className="step-panel active">
      <StepHeader
        step={3}
        total={TOTAL}
        heading="Billboard"
        headingEm="Details"
        sub="Begin with one billboard. You can add more later."
      />
      <FormSection title="Location">
        <Field
          name="f_bbName"
          label="Billboard Name / Title"
          required
          placeholder="e.g., Andheri Flyover — West Side Hoarding"
        />
        <FormRow>
          <div className="form-group">
            <label>
              Billboard Pincode <span className="req">*</span>
            </label>
            <input
              type="text"
              className={cn('form-control', bb.err.invalidClass)}
              placeholder="400053"
              maxLength={6}
              value={bb.val}
              onChange={(e) => bb.set(e.target.value)}
              onBlur={bb.err.onBlur}
            />
            <div className={cn('pincode-autofill', bb.city && 'show')}>{bb.city}</div>
            <FieldError show={bb.err.show} error={bb.err.error} />
          </div>
          <Field
            name="f_bbLandmark"
            label="Nearby Landmark"
            optional
            placeholder="e.g., Andheri Station flyover"
          />
        </FormRow>
        <Field
          name="f_bbAddr"
          label="Address / Street Name"
          required
          placeholder="Road / Street / Highway name"
        />
      </FormSection>

      <FormSection title="Structure Type">
        <div className="form-group">
          <label>
            Billboard Type <span className="req">*</span>
          </label>
        </div>
        <TypeGrid name="f_bbType" options={TYPE_OPTIONS} />
      </FormSection>

      <FormSection last title="Dimensions & Traffic">
        <FormRow>
          <Field
            name="f_bbWidth"
            type="number"
            label="Width (ft)"
            required
            placeholder="40"
            min="1"
            max="200"
            hint="Typical range: 1–200 ft"
          />
          <Field
            name="f_bbHeight"
            type="number"
            label="Height (ft)"
            required
            placeholder="20"
            min="1"
            max="100"
            hint="Typical range: 1–100 ft"
          />
        </FormRow>
        <FormRow>
          <Field
            name="f_bbGroundHeight"
            type="number"
            label="Height from Ground (ft)"
            optional
            placeholder="30"
            min="0"
            max="300"
            hint="0–300 ft from ground level"
          />
          <div className="form-group" />
        </FormRow>
        <FormRow>
          <Field
            name="f_facing"
            type="select"
            label="Facing Direction"
            required
            options={[{ value: '', label: 'Select direction' }, ...FACING]}
          />
          <div className="form-group">
            <label>
              Traffic Type <span className="req">*</span>
            </label>
            <SelectWithOther name="f_trafficType" otherName="f_trafficOther" options={TRAFFIC} />
          </div>
        </FormRow>
        <FormRow>
          <div className="form-group">
            <label>
              Audience Type <span className="req">*</span>
            </label>
            <SelectWithOther name="f_audience" otherName="f_audienceOther" options={AUDIENCE} />
          </div>
          <FootfallField />
        </FormRow>
      </FormSection>

      <RegNav nextLabel="Continue to Pricing & Availability" />
    </div>
  );
}

function FootfallField() {
  const { field, setField } = useRegister();
  return (
    <div className="form-group">
      <label>
        Daily Footfall (approx.) <span className="opt">(optional)</span>
      </label>
      <input
        type="text"
        className="form-control"
        placeholder="e.g., 80,000"
        value={field('f_footfall')}
        onChange={(e) => setField('f_footfall', e.target.value.replace(/[^0-9,]/g, ''))}
      />
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
        heading="Pricing &"
        headingEm="Availability"
        sub="Set your rates, packages, and mark your availability calendar."
      />
      <FormSection title="Rate Card">
        <FormRow>
          <Field
            name="f_startPrice"
            type="number"
            label="Starting From Price (₹/Day)"
            required
            placeholder="9500"
            min="100"
            max="10000000"
            hint={'₹100 – ₹1,00,00,000 per day. This is the "from" price shown on listings'}
          />
          <Field
            name="f_minBooking"
            type="select"
            label="Minimum Booking Duration"
            required
            options={MIN_BOOKING}
          />
        </FormRow>
        <div className="form-group">
          <label>Pricing Packages</label>
          <div className="form-hint" style={{ marginBottom: 10 }}>
            The 1-month base rate is auto-calculated from your daily rate above. All rates are
            editable.
          </div>
        </div>
        <PricingTable />
      </FormSection>

      <FormSection title="Availability Calendar">
        <div className="form-group">
          <div className="form-hint" style={{ marginBottom: 12 }}>
            Click a start date then an end date to mark a range as booked. Click a booked date to
            clear it.
          </div>
        </div>
        <AvailabilityCalendar />
        <div className="form-group" style={{ marginTop: 16 }}>
          <Field
            name="f_discountNote"
            label="Long-term Discount Note"
            optional
            placeholder="e.g., Special rates for annual contracts — discuss on connect"
          />
        </div>
      </FormSection>

      <RegNav nextLabel="Continue to Media Uploads" />
    </div>
  );
}

/* ── STEP 5 ── */
const SunIcon = (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
  </svg>
);
const MoonIcon = (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);
const GlobeIcon = (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);
const VideoIcon = (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);

export function Step5() {
  return (
    <div className="step-panel active">
      <StepHeader
        step={5}
        total={TOTAL}
        heading="Media"
        headingEm="Uploads"
        sub="Upload clear day and night photos. Geotagged photos increase trust."
      />

      <div
        style={{
          background: 'linear-gradient(135deg,var(--teal-light),var(--cream-warm))',
          border: '1.5px solid rgba(8,145,178,0.25)',
          borderRadius: 14,
          padding: '18px 20px',
          marginBottom: 28,
          display: 'flex',
          gap: 14,
          alignItems: 'flex-start',
        }}
      >
        <div
          style={{
            flexShrink: 0,
            width: 38,
            height: 38,
            background: 'var(--teal)',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        </div>
        <div>
          <div
            style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--teal-dark)', marginBottom: 5 }}
          >
            📋 Please read the reference guide before uploading
          </div>
          <div
            style={{ fontSize: 13, color: 'var(--ink-muted)', fontWeight: 400, lineHeight: 1.6 }}
          >
            This guide explains the exact photo angles, shot types, video requirements, and examples
            we expect from you. Following it ensures your listing gets approved faster.
          </div>
          <a
            href="#"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              marginTop: 10,
              background: 'var(--teal)',
              color: 'white',
              textDecoration: 'none',
              fontSize: 12.5,
              fontWeight: 600,
              padding: '8px 16px',
              borderRadius: 8,
            }}
          >
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
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            View Media Reference Guide (PDF)
          </a>
        </div>
      </div>

      <FormSection title="Location Pin Verification">
        <div
          style={{
            background: 'var(--cream-warm)',
            border: '1.5px solid var(--border-strong)',
            borderRadius: 12,
            padding: '16px 18px',
            marginBottom: 8,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--ink)',
              marginBottom: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 7,
            }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--teal)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            Pin Your Billboard&apos;s Exact Location
          </div>
          <div
            style={{ fontSize: 12.5, color: 'var(--ink-muted)', marginBottom: 12, lineHeight: 1.6 }}
          >
            The map below is pre-zoomed to your billboard&apos;s pincode. Drag the pin or click on
            the map to mark the exact location of your billboard.
          </div>
          <MapPin />
        </div>
      </FormSection>

      <FormSection title="Day Photos">
        <UploadZone
          sectionTitle="Day Photos"
          badge={<span className="badge-mandatory">Mandatory · Min 2</span>}
          icon={SunIcon}
          title="Drag & drop day photos here"
          sub="JPG, PNG, WEBP · Max 10MB each · Clear angle required"
          accept="image/*"
        />
      </FormSection>
      <FormSection title="Night Photos">
        <UploadZone
          sectionTitle="Night Photos"
          badge={<span className="badge-optional">Optional</span>}
          icon={MoonIcon}
          title="Drag & drop night photos here"
          sub="JPG, PNG, WEBP · Must show actual illumination · Max 10MB"
          accept="image/*"
        />
      </FormSection>
      <FormSection last title="Optional Media">
        <UploadZone
          sectionTitle="Surrounding Area Photo"
          badge={<span className="badge-optional">Optional</span>}
          icon={GlobeIcon}
          title="Shows billboard in its surroundings"
          sub="Drag & drop or click to browse · JPG, PNG"
          accept="image/*"
          style={{ padding: 0 }}
        />
        <UploadZone
          sectionTitle="Short Video"
          badge={<span className="badge-optional">Optional</span>}
          icon={VideoIcon}
          title="Drag & drop or click to browse"
          sub="MP4, MOV · Max 100MB"
          accept="video/*"
          multiple={false}
          single
          style={{ marginBottom: 0 }}
        />
      </FormSection>

      <RegNav nextLabel="Continue to Legal Data" />
    </div>
  );
}

/* ── STEP 6 ── */
const DocIcon = (
  <svg
    width="24"
    height="24"
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
);
const CertIcon = (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="8" r="6" />
    <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
  </svg>
);

export function Step6() {
  return (
    <div className="step-panel active">
      <StepHeader
        step={6}
        total={TOTAL}
        heading="Legal"
        headingEm="Data"
        sub="Private document used only for verification."
      />
      <FormSection title="Ownership & Approval">
        <div className="form-group">
          <label>
            Ownership Type <span className="req">*</span>
          </label>
        </div>
        <OwnershipOptions name="f_ownership" options={OWNERSHIP} />
        <div className="form-group">
          <label>
            Government Approval Status <span className="req">*</span>
          </label>
        </div>
        <ApprovalOptions name="f_approval" options={APPROVAL} />
      </FormSection>

      <FormSection title="Licensing & Registration">
        <Field
          name="f_licenseNo"
          label="License Number"
          optional
          placeholder="e.g., MCGM/OA/2024/MU-1234"
          hint="Municipal or state advertising license number, if issued"
        />
      </FormSection>

      <FormSection last title="Document Upload">
        <UploadZone
          sectionTitle="Ownership / Lease Document"
          badge={<span className="badge-optional">Optional</span>}
          icon={DocIcon}
          title="Ownership deed or lease agreement"
          sub="PDF, JPG, PNG · Max 20MB"
          accept=".pdf,image/*"
          multiple={false}
          single
          style={{ padding: 0 }}
        />
        <UploadZone
          sectionTitle="Government Approval Certificate"
          badge={<span className="badge-optional">Optional</span>}
          icon={CertIcon}
          title="Approval certificate"
          sub="PDF, JPG, PNG · Max 20MB"
          accept=".pdf,image/*"
          multiple={false}
          single
          style={{ marginBottom: 0 }}
        />
      </FormSection>

      <RegNav nextLabel="Review & Submit" />
    </div>
  );
}

/* ── STEP 7 ── */
function ReviewSection({ title, editStep, body }) {
  const { goToStep } = useRegister();
  return (
    <>
      <div
        className="review-section-head"
        style={editStep > 1 ? { borderTop: '1px solid var(--border)' } : undefined}
      >
        <span>{title}</span>
        <button className="review-edit-btn" onClick={() => goToStep(editStep)}>
          Edit →
        </button>
      </div>
      <div className="review-section-body">{body || '—'}</div>
    </>
  );
}

export function Step7() {
  const { field, submit } = useRegister();
  const v = (n) => String(field(n)).trim();
  const join = (arr) => arr.filter(Boolean).join(' · ');

  return (
    <div className="step-panel active">
      <StepHeader
        step={7}
        total={TOTAL}
        heading="Review &"
        headingEm="Submit"
        sub="Review your submission before sending for verification."
      />
      <div className="review-card">
        <ReviewSection
          title="Personal Information"
          editStep={1}
          body={join([
            [v('f_firstName'), v('f_lastName')].filter(Boolean).join(' '),
            v('f_email'),
            v('f_phone') && `+91 ${v('f_phone')}`,
          ])}
        />
        <ReviewSection
          title="Business Information"
          editStep={2}
          body={join([
            v('f_companyName'),
            v('f_gst'),
            [v('f_bizAddr1'), v('f_bizPin')].filter(Boolean).join(', '),
          ])}
        />
        <ReviewSection
          title="Billboard Details"
          editStep={3}
          body={join([
            v('f_bbName'),
            v('f_bbType'),
            v('f_bbWidth') && v('f_bbHeight') && `${v('f_bbWidth')} × ${v('f_bbHeight')} ft`,
            v('f_facing'),
          ])}
        />
        <ReviewSection title="Media Uploads" editStep={5} body="Photos & media as uploaded" />
        <ReviewSection
          title="Pricing & Availability"
          editStep={4}
          body={join([v('f_startPrice') && `From ₹${v('f_startPrice')}/day`, v('f_discountNote')])}
        />
        <ReviewSection
          title="Legal Data"
          editStep={6}
          body={join([
            v('f_ownership') === 'leased' ? 'Leased / Rented' : 'Owned',
            v('f_licenseNo'),
          ])}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <TermsRow name="f_termsAccept">
          I confirm that all details provided are accurate and I accept the{' '}
          <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
        </TermsRow>
      </div>
      <div
        style={{
          fontSize: 12,
          color: 'var(--ink-faint)',
          fontWeight: 300,
          marginBottom: 8,
          padding: '0 4px',
        }}
      >
        Your account will be reviewed within 2–3 business days. You&apos;ll receive an email once
        approved.
      </div>

      <div className="reg-nav">
        <BackButton />
        <button className="btn-next btn-submit" onClick={submit}>
          Submit for Verification →
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
