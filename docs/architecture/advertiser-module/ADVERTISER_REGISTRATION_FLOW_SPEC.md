# Advertiser Registration Flow — Detailed Specification & Component Breakdown

> **Project:** The AdBasket  
> **Module:** Advertiser (Brand / Business Onboarding)  
> **Branch:** `amjangde/advertiser-module-architecture`  
> **Document Status:** Complete Architecture & Field Specification  
> **Target Files:**
> - Frontend: `frontend/src/pages/AdvertiserRegister/AdvertiserRegister.jsx`, `steps.jsx`, `frontend/src/features/auth/registrationMappers.js`
> - Backend: `AdvertiserRegistrationRequest.java`, `CampaignBriefRequest.java`, `AdvertiserProfile.java`, `CampaignBrief.java`, `Address.java`
> - Database: `users`, `advertiser_profiles`, `advertiser_industries`, `campaign_briefs`, `campaign_brief_agency_prefs`, `addresses`

---

## 1. Executive Summary & Flow Architecture

The Advertiser Onboarding flow allows brand marketers, business owners, and campaign managers to onboard onto The AdBasket marketplace.

### 1.1 Dual Entry-Point Architecture

The flow supports two distinct entry states:
1. **Anonymous Registration (New User):** User arrives unauthenticated. Step 1 collects login credentials (`accountEmail`, `password`), creating a new `User` record with role `ADVERTISER`.
2. **Authenticated Onboarding (Role Promotion):** A user already signed in as a basic `MEMBER` (via Google OneTap/FedCM or quick modal sign-up) accesses the wizard. Step 1 detects their authenticated session via `useAuth()`, displays a `SignedInBanner`, skips mandatory email/password creation, and promotes the existing account to `ADVERTISER`.

```mermaid
flowchart TD
    Start([User arrives at /advertisers/register]) --> AuthCheck{Is User Signed In?}
    
    AuthCheck -- No (Anonymous) --> Step1Anon[Step 1: Login Setup<br/>f_loginEmail + f_password required]
    AuthCheck -- Yes (MEMBER) --> Step1Auth[Step 1: Login Setup<br/>Prefilled email, optional password]
    
    Step1Anon --> Step2[Step 2: Business Information<br/>Company, Type, Industry, Logo]
    Step1Auth --> Step2
    
    Step2 --> Step3[Step 3: Contact Details<br/>Contact Person, Email, Phone, Office Address]
    Step3 --> Step4[Step 4: Project Details<br/>Campaign Brief: Title, Desc, Audience, Location, Dates]
    Step4 --> Step5[Step 5: Budget & Quotations<br/>Min/Max Budget, Units, Flexibility, Quotation Counts, Agency Prefs]
    Step5 --> Step6[Step 6: Verification & Attachments<br/>GST, PAN, Verification Docs, Campaign Creative Dropzones]
    Step6 --> Step7[Step 7: Review & Submit<br/>Consolidated Review Cards, Terms & Conditions]
    
    Step7 --> Submit[Submit POST /api/auth/register/advertiser]
    Submit --> Success[Success Screen<br/>Timeline: Under Review -> Goes Live -> Receive Quotations]
    Success --> Dashboard[/advertisers/dashboard]
```

### 1.2 Layout & Stepper Infrastructure

- **Container:** `RegisterShell` with left fixed dark sidebar (`--sidebar-w: 288px`) and scrollable main content panel.
- **State Provider:** `RegisterProvider` managing:
  - Form field dictionary (`data: { f_* }`)
  - Multi-select collections (`selections: { industries, agencyPref, additionalFilters }`)
  - Step progression (`currentStep`, `maxStepReached`, `goToStep`, `prevStep`, `nextStep`)
  - Per-step and submission validation hooks (`validate`, `validateSubmit`)

---

## 2. Component & Field Specifications (Step-by-Step)

---

### Step 1: Login Setup (`Step1`)
- **Component File:** `frontend/src/pages/AdvertiserRegister/steps.jsx` (Lines 186–268)
- **Purpose:** Capture account credentials for new users, or present verified identity for signed-in users.

| Field Label | Form Key | UI Control | Frontend Type | Backend DTO Field | Java Type | DB Column & Type | Required? | Constraints & Validation |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Login Email** | `f_loginEmail` | Text Input (`type="email"`) | `string` | `accountEmail` | `String` | `users.email`<br>`VARCHAR(180) UNIQUE` | **Yes** (Anon)<br>N/A (Auth) | Max: 180 chars. Valid email format (`@Email`). Sanitized, lowercase. |
| **Password** | `f_password` | `PasswordField` (toggle show/hide, strength check) | `string` | `password` | `String` | `users.password`<br>`VARCHAR(100)` (BCrypt hash) | **Yes** (Anon)<br>Optional (Google Auth) | Min: 8 chars, Max: 72 chars. Must include uppercase, number, symbol. |
| **Confirm Password** | `f_confirmPassword` | `ConfirmPasswordField` | `string` | *Ignored (client only)* | N/A | None | **Yes** (Anon) | Must strictly equal `f_password`. |
| **Email Quotation Notifications** | *None* | `<NotifRow>` (checkbox UI) | `boolean` (untracked) | *None* | N/A | None | Optional | UI toggle only; **not currently bound to form state or DTO.** |

#### Validation Logic (`validate(1)`):
- If `!user`:
  - `f_loginEmail` required, must be valid email format.
  - `f_password` length $\ge 8$.
  - `f_password === f_confirmPassword`.
- If `user && !user.hasPassword && f_password`:
  - Enforces length $\ge 8$ and matching confirm password if user chooses to set a password.

---

### Step 2: Business Information (`Step2`)
- **Component File:** `frontend/src/pages/AdvertiserRegister/steps.jsx` (Lines 271–352)
- **Purpose:** Capture commercial identity and operational industry of the business.

| Field Label | Form Key | UI Control | Frontend Type | Backend DTO Field | Java Type | DB Column & Type | Required? | Constraints & Validation |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Company Name** | `f_companyName` | Text Input (`type="text"`) | `string` | `companyName` | `String` | `advertiser_profiles.company_name`<br>`VARCHAR(150)` | **Yes** | Max: 150 chars. `@NotBlank`, `@SanitizeText`. |
| **Business Type** | `f_businessType` | Select Dropdown | `string` | `businessType` | `String` | `advertiser_profiles.business_type`<br>`VARCHAR(80)` | **Yes** | Max: 80 chars. `@NotBlank`. Allowed values: *Startup, SME, Corporate, Manufacturer, Retailer, Service Provider, Educational Institution, NGO, Government Organization, Other*. |
| **Website URL** | `f_website` | Text Input (`type="url"`) | `string` | `website` | `String` | `advertiser_profiles.website`<br>`VARCHAR(255)` | Optional | Max: 255 chars. Blank mapped to `null`. |
| **Industry Category** | `selections.industries` | `MultiSelectDropdown` (with search & tags) | `string[]` | `industries` | `List<String>` | `advertiser_industries.industry`<br>`VARCHAR(80)` | **Yes** | Minimum 1 required (`@NotEmpty`). Available: *Electronics, Healthcare, Real Estate, FMCG, Education, Fashion, Agriculture, Technology, Other*. |
| **Company Logo** | *Internal upload state* | `LogoUpload` (dropzone with 120x120 preview) | `File` / Base64 | *None* | N/A | None | Optional | Max size 5MB. Formats: PNG, JPG, SVG. **Not mapped to backend DTO.** |

#### Validation Logic (`validate(2)`):
- `f_companyName` cannot be empty.
- `f_businessType` cannot be empty.
- `selections.industries` array length $\ge 1$.

---

### Step 3: Contact Details (`Step3`)
- **Component File:** `frontend/src/pages/AdvertiserRegister/steps.jsx` (Lines 354–570)
- **Purpose:** Primary contact person details and physical office location for billing and legal correspondence.

| Field Label | Form Key | UI Control | Frontend Type | Backend DTO Field | Java Type | DB Column & Type | Required? | Constraints & Validation |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Contact Person Name** | `f_firstName` | Text Input | `string` | `firstName` | `String` | `users.first_name`<br>`VARCHAR(80)` | **Yes** | Max: 80 chars. `@NotBlank`, `@SanitizeText`. |
| *Last Name* | `f_lastName` *(missing from UI)* | *None* | `null` | `lastName` | `String` | `users.last_name`<br>`VARCHAR(80)` | Optional | Max: 80 chars. Sent as `null` by `mapAdvertiser()`. |
| **Designation** | `f_desig` | Text Input | `string` | `contactDesignation` | `String` | `advertiser_profiles.contact_designation`<br>`VARCHAR(120)` | **Yes** | Max: 120 chars. `@NotBlank`, `@SanitizeText`. (e.g., Marketing Head, Founder). |
| **Email Address** | `f_email` | Text Input (`type="email"`) | `string` | `contactEmail` | `String` | `advertiser_profiles.contact_email`<br>`VARCHAR(180)` | **Yes** | Max: 180 chars. `@NotBlank`, `@Email`. Has "Use same email as Login Setup" shortcut button. |
| **Verify Email via OTP** | *None* | `OtpVerify` widget | *None* | *None* | N/A | None | Optional *(Stub)* | UI simulation. Does not invoke backend OTP service or block submission. |
| **Mobile Number** | `f_phone` | Tel Input (with fixed `+91` prefix) | `string` | `contactPhone` | `String` | `users.phone`<br>`VARCHAR(20)` | **Yes** | Exactly 10 digits (non-digits stripped). Matches `^[0-9+\-\s]{10,15}$`. |
| **Verify Mobile via OTP** | *None* | `OtpVerify` widget | *None* | *None* | N/A | None | Optional *(Stub)* | UI simulation. Does not invoke backend SMS OTP service. |
| **Address Line 1** | `f_addressLine1` | Text Input | `string` | `addressLine1` | `String` | `addresses.line1`<br>`VARCHAR(300)` | **Yes** | Max: 300 chars. `@NotBlank`, `@SanitizeText`. Building, Street. |
| **Address Line 2** | `f_addressLine2` | Text Input | `string` | `addressLine2` | `String` | `addresses.line2`<br>`VARCHAR(300)` | Optional | Max: 300 chars. Area, Floor. Blank to `null`. |
| **Landmark** | `f_landmark` | Text Input | `string` | `landmark` | `String` | `addresses.landmark`<br>`VARCHAR(200)` | Optional | Max: 200 chars. Blank to `null`. |
| **City** | `f_city` | Text Input | `string` | `city` | `String` | `addresses.city`<br>`VARCHAR(100)` | **Yes** | Max: 100 chars. `@NotBlank`. Auto-filled by pincode hook or manually editable. |
| **State** | `f_state` | Text Input | `string` | `state` | `String` | `addresses.state`<br>`VARCHAR(100)` | **Yes** | Max: 100 chars. `@NotBlank`. Auto-filled by pincode hook or manually editable. |
| **PIN Code** | `f_pincode` | Text Input (`maxLength={6}`) | `string` | `pincode` | `String` | `addresses.pincode`<br>`VARCHAR(6)` | **Yes** | Regex `^[1-9][0-9]{5}$` (cannot start with 0). Triggers India Post PIN lookup API via `usePincode`. |

#### Validation Logic (`validate(3)`):
- `f_firstName` non-empty.
- `f_desig` non-empty.
- `f_email` valid email.
- `f_phone` exactly 10 digits.
- `f_addressLine1`, `f_city`, `f_state`, `f_pincode` non-empty.
- `isValidPincode(f_pincode)` returns true (`/^[1-9][0-9]{5}$/`).

---

### Step 4: Project Details (`Step4`)
- **Component File:** `frontend/src/pages/AdvertiserRegister/steps.jsx` (Lines 572–639)
- **Purpose:** Captures the advertiser's first initial campaign brief.

| Field Label | Form Key | UI Control | Frontend Type | Backend DTO Field | Java Type | DB Column & Type | Required? | Constraints & Validation |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Project Title** | `f_projectTitle` | Text Input | `string` | `project.title` | `String` | `campaign_briefs.title`<br>`VARCHAR(200)` | **Yes** | Max: 200 chars. `@NotBlank`, `@SanitizeText`. (e.g. *Diwali 2026 OOH Blitz*). |
| **Project Description** | `f_projectDesc` | Textarea (`rows={5}`) | `string` | `project.description` | `String` | `campaign_briefs.description`<br>`VARCHAR(2000)` | **Yes** | Max: 2000 chars. `@NotBlank`, `@SanitizeText`. Detailed scope & creative plan. |
| **Target Audience** | `f_targetAudience` | Text Input | `string` | `project.targetAudience` | `String` | `campaign_briefs.target_audience`<br>`VARCHAR(500)` | **Yes** | Max: 500 chars. `@NotBlank`, `@SanitizeText`. (e.g. *Urban working professionals 25-40*). |
| **Target Location** | `f_targetLocation` | Text Input | `string` | `project.targetLocation` | `String` | `campaign_briefs.target_location`<br>`VARCHAR(300)` | **Yes** | Max: 300 chars. `@NotBlank`, `@SanitizeText`. (e.g. *Mumbai, Pune, Bengaluru*). |
| **Expected Start Date** | `f_startDate` | Date Picker (`type="date"`) | `string` (`YYYY-MM-DD`) | `project.startDate` | `LocalDate` | `campaign_briefs.start_date`<br>`DATE` | **Yes** | `@NotNull`. ISO date format. |
| **Expected End Date** | `f_endDate` | Date Picker (`type="date"`) | `string` (`YYYY-MM-DD`) | `project.endDate` | `LocalDate` | `campaign_briefs.end_date`<br>`DATE` | **Yes** | `@NotNull`. Must be on or after `startDate` (`isValidDateRange()`). |
| **Project Duration** | `f_duration` | Select Dropdown | `string` | `project.duration` | `String` | `campaign_briefs.duration`<br>`VARCHAR(50)` | **Yes** | Max: 50 chars. Options: *Less than 1 week, 1–2 weeks, 1 month, 1–3 months, 3–6 months, 6–12 months, Ongoing / Long-term*. |

#### Validation Logic (`validate(4)`):
- All 7 fields are strictly required.
- `f_endDate >= f_startDate` cross-field date validation.

---

### Step 5: Budget & Quotations (`Step5`)
- **Component File:** `frontend/src/pages/AdvertiserRegister/steps.jsx` (Lines 641–757)
- **Purpose:** Specifies spending appetite and vendor matching criteria.

| Field Label | Form Key | UI Control | Frontend Type | Backend DTO Field | Java Type | DB Column & Type | Required? | Constraints & Validation |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Minimum Budget Value** | `f_budgetMinValue` | Number Input (`min="0"`) | `string` $\rightarrow$ `number` | `project.budgetMinValue` | `BigDecimal` | `campaign_briefs.budget_min_value`<br>`NUMERIC(14,2)` | **Yes** | `@NotNull`, `@PositiveOrZero`. Raw numeric scalar (e.g., 50). |
| **Minimum Budget Unit** | `f_budgetMinUnit` | Select Dropdown | `string` | `project.budgetMinUnit` | `String` | `campaign_briefs.budget_min_unit`<br>`VARCHAR(20)` | Optional | Max: 20 chars. Options: *thousand, lakh, crore*. Default: `thousand`. |
| **Maximum Budget Value** | `f_budgetMaxValue` | Number Input (`min="0"`) | `string` $\rightarrow$ `number` | `project.budgetMaxValue` | `BigDecimal` | `campaign_briefs.budget_max_value`<br>`NUMERIC(14,2)` | **Yes** | `@NotNull`, `@PositiveOrZero`. Raw numeric scalar (e.g., 2). |
| **Maximum Budget Unit** | `f_budgetMaxUnit` | Select Dropdown | `string` | `project.budgetMaxUnit` | `String` | `campaign_briefs.budget_max_unit`<br>`VARCHAR(20)` | Optional | Max: 20 chars. Options: *thousand, lakh, crore*. Default: `lakh`. |
| **Flexible Budget?** | `f_flexBudget` | `YesNoToggle` radio cards | `string` ("yes" / "no") | `project.flexibleBudget` | `boolean` | `campaign_briefs.flexible_budget`<br>`BOOLEAN DEFAULT FALSE` | Optional | Mapped as `d.f_flexBudget === 'yes'`. Default `false`. |
| **Quotations Required** | `f_quoteCount` | `RadioCards` | `string` | `project.quotationsRequired` | `String` | `campaign_briefs.quotations_required`<br>`VARCHAR(20)` | **Yes** | Max: 20 chars. `@NotBlank`. Options: *3, 5, 10, 10+*. |
| **Agency Preference** | `selections.agencyPref` | `TogglePills` | `string[]` | `project.agencyPreferences` | `List<String>` | `campaign_brief_agency_prefs.preference`<br>`VARCHAR(80)` | **Yes** | Minimum 1 required (`@NotEmpty`). Options: *verified, local, national, international, open*. |
| **Additional Filters** | `selections.additionalFilters` | `TogglePills` | `string[]` | *None* | N/A | None | Optional | Options: *gst, msme, experience, expertise, badge*. **Selected in UI but not sent to backend DTO or DB.** |

#### Validation Logic (`validate(5)`):
- `f_budgetMinValue` and `f_budgetMaxValue` must be numbers $> 0$.
- `f_quoteCount` must be selected.
- `selections.agencyPref` array length $\ge 1$.

---

### Step 6: Verification & Attachments (`Step6`)
- **Component File:** `frontend/src/pages/AdvertiserRegister/steps.jsx` (Lines 760–947)
- **Purpose:** Tax identity, business credential verification, and initial campaign creative assets.

| Field Label | Form Key | UI Control | Frontend Type | Backend DTO Field | Java Type | DB Column & Type | Required? | Constraints & Validation |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **GST Number** | `f_gst` | Text Input (mono, uppercase) | `string` | `gstNumber` | `String` | `advertiser_profiles.gst_number`<br>`VARCHAR(15)` | Optional | Exact 15 chars if provided. Regex: `^[0-9A-Za-z]{15}$`. Tested with Indian GSTIN pattern. |
| **PAN Number** | `f_pan` | Text Input (mono, uppercase) | `string` | `panNumber` | `String` | `advertiser_profiles.pan_number`<br>`VARCHAR(10)` | Optional | Exact 10 chars if provided. Regex: `^[0-9A-Za-z]{10}$`. |
| **Company Registration Certificate** | *None* | `VerificationCard` | *None* | *None* | N/A | None | Optional | UI card mockup. No file input or upload endpoint attached. |
| **MSME Certificate** | *None* | `VerificationCard` | *None* | *None* | N/A | None | Optional | UI card mockup. No file input or upload endpoint attached. |
| **Company Profile / Brochure** | *None* | `UploadButton` | *None* | *None* | N/A | None | Optional | Shows mock toast "Company profile uploaded". File not transmitted. |
| **Images Dropzone** | *None* | `AttachZone` | `File[]` | *None* | N/A | None | Optional | Drag-and-drop zone (`image/*`). Not sent to backend. |
| **Product Brochure** | *None* | `AttachZone` | `File` | *None* | N/A | None | Optional | Drag-and-drop zone (`.pdf,.doc,.docx`). Not sent to backend. |
| **Brand Guidelines** | *None* | `AttachZone` | `File` | *None* | N/A | None | Optional | Drag-and-drop zone (`.pdf,.zip,image/*`). Not sent to backend. |
| **Video Files** | *None* | `AttachZone` | `File[]` | *None* | N/A | None | Optional | Drag-and-drop zone (`video/*`). Not sent to backend. |
| **Design Files** | *None* | `AttachZone` | `File[]` | *None* | N/A | None | Optional | Drag-and-drop zone (`.psd,.ai,.fig`). Not sent to backend. |
| **Additional Documents** | *None* | `AttachZone` | `File[]` | *None* | N/A | None | Optional | Drag-and-drop zone. Not sent to backend. |

#### Validation Logic (`validate(6)`):
- If `f_gst` is present, it must be exactly 15 characters.

---

### Step 7: Review & Submit (`Step7`)
- **Component File:** `frontend/src/pages/AdvertiserRegister/steps.jsx` (Lines 950–1111)
- **Purpose:** Consolidated summary of all entered information across 5 category review blocks, with interactive step jump-links, terms acceptance, and submission trigger.

| Review Section | Displayed Fields | Edit Target | Notes |
| :--- | :--- | :--- | :--- |
| **Login & Business** | Login Email, Company Name, Business Type, Industries | Step 1, Step 2 | Formatted string of selected industries. |
| **Contact** | Contact Person & Designation, Email, Mobile (`+91`), Full Address | Step 3 | Joined address string (Line 1, Line 2, Landmark, City, State, PIN). |
| **Project & Budget** | Project Title & Duration, Target Location, Formatted Budget Range, Quotation Count & Preferences | Step 4, Step 5 | Budget formatted with unit strings (e.g., `₹50 Thousand – ₹2 Lakh · Flexible budget`). |
| **Verification** | GST Number (or "—") | Step 6 | Shows GSTIN if entered. |
| **Terms Acceptance** | Checkbox: `f_termsAccept` | Step 7 | **Mandatory.** Label links to Terms & Conditions and Privacy Policy. |

#### Submission Execution:
1. `validateSubmit({ data })`: Checks `f_termsAccept === true`. Displays error toast if unchecked.
2. `onSubmit`:
   - Runs `mapAdvertiser(data, selections)` $\rightarrow$ builds `AdvertiserRegistrationRequest`.
   - Calls `registerAdvertiser(payload)` via `AuthContext`.
   - Hits `POST /api/auth/register/advertiser`.
   - On success: sets `submitted = true` $\rightarrow$ renders `SuccessScreen`. Sets JWT cookie and local auth session.

---

### Post-Submission Screen (`SuccessScreen`)
- **Component:** `frontend/src/features/register/index.js` (rendered by `WizardBody` in `AdvertiserRegister.jsx`)
- **Timeline Items Displayed:**
  1. *Under Review:* "Our team verifies your business and requirement details — usually within 24 hours."
  2. *Goes Live:* "Once approved, your requirement becomes visible to matching agencies on AdBasket."
  3. *Receive Quotations:* "Agencies matching your filters submit proposals — compare and award from your dashboard."
- **CTA Button:** "Go to My Dashboard" $\rightarrow$ redirects to `/advertisers/dashboard`.

---

## 3. End-to-End Data Flow & Mapping Matrix

| UI Step & Form Field | Form State Key | `mapAdvertiser()` DTO Field | DTO Record & Validation | Java Entity & Field | Database Table & Column |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Step 1:** Login Email | `f_loginEmail` | `accountEmail` | `AdvertiserRegistrationRequest.accountEmail` (`@Email`, max 180) | `User.email` | `users.email` (VARCHAR 180) |
| **Step 1:** Password | `f_password` | `password` | `AdvertiserRegistrationRequest.password` (max 72) | `User.password` (BCrypt hash) | `users.password` (VARCHAR 100) |
| **Step 2:** Company Name | `f_companyName` | `companyName` | `AdvertiserRegistrationRequest.companyName` (`@NotBlank`, max 150) | `AdvertiserProfile.companyName` | `advertiser_profiles.company_name` (VARCHAR 150) |
| **Step 2:** Business Type | `f_businessType` | `businessType` | `AdvertiserRegistrationRequest.businessType` (`@NotBlank`, max 80) | `AdvertiserProfile.businessType` | `advertiser_profiles.business_type` (VARCHAR 80) |
| **Step 2:** Website | `f_website` | `website` | `AdvertiserRegistrationRequest.website` (max 255) | `AdvertiserProfile.website` | `advertiser_profiles.website` (VARCHAR 255) |
| **Step 2:** Industries | `selections.industries` | `industries` | `AdvertiserRegistrationRequest.industries` (`@NotEmpty`) | `AdvertiserProfile.industries` | `advertiser_industries.industry` (VARCHAR 80) |
| **Step 3:** Contact Name | `f_firstName` | `firstName` | `AdvertiserRegistrationRequest.firstName` (`@NotBlank`, max 80) | `User.firstName` | `users.first_name` (VARCHAR 80) |
| **Step 3:** Designation | `f_desig` | `contactDesignation` | `AdvertiserRegistrationRequest.contactDesignation` (`@NotBlank`, max 120) | `AdvertiserProfile.contactDesignation` | `advertiser_profiles.contact_designation` (VARCHAR 120) |
| **Step 3:** Contact Email | `f_email` | `contactEmail` | `AdvertiserRegistrationRequest.contactEmail` (`@NotBlank`, `@Email`, max 180) | `AdvertiserProfile.contactEmail` | `advertiser_profiles.contact_email` (VARCHAR 180) |
| **Step 3:** Phone | `f_phone` | `contactPhone` | `AdvertiserRegistrationRequest.contactPhone` (`@NotBlank`, `@Pattern`) | `User.phone` | `users.phone` (VARCHAR 20) |
| **Step 3:** Address Line 1 | `f_addressLine1` | `addressLine1` | `AdvertiserRegistrationRequest.addressLine1` (`@NotBlank`, max 300) | `Address.line1` | `addresses.line1` (VARCHAR 300) |
| **Step 3:** Address Line 2 | `f_addressLine2` | `addressLine2` | `AdvertiserRegistrationRequest.addressLine2` (max 300) | `Address.line2` | `addresses.line2` (VARCHAR 300) |
| **Step 3:** Landmark | `f_landmark` | `landmark` | `AdvertiserRegistrationRequest.landmark` (max 200) | `Address.landmark` | `addresses.landmark` (VARCHAR 200) |
| **Step 3:** City | `f_city` | `city` | `AdvertiserRegistrationRequest.city` (`@NotBlank`, max 100) | `Address.city` | `addresses.city` (VARCHAR 100) |
| **Step 3:** State | `f_state` | `state` | `AdvertiserRegistrationRequest.state` (`@NotBlank`, max 100) | `Address.state` | `addresses.state` (VARCHAR 100) |
| **Step 3:** PIN Code | `f_pincode` | `pincode` | `AdvertiserRegistrationRequest.pincode` (`@NotBlank`, `@Pattern`) | `Address.pincode` | `addresses.pincode` (VARCHAR 6) |
| **Step 4:** Project Title | `f_projectTitle` | `project.title` | `CampaignBriefRequest.title` (`@NotBlank`, max 200) | `CampaignBrief.title` | `campaign_briefs.title` (VARCHAR 200) |
| **Step 4:** Description | `f_projectDesc` | `project.description` | `CampaignBriefRequest.description` (`@NotBlank`, max 2000) | `CampaignBrief.description` | `campaign_briefs.description` (VARCHAR 2000) |
| **Step 4:** Target Audience | `f_targetAudience` | `project.targetAudience` | `CampaignBriefRequest.targetAudience` (`@NotBlank`, max 500) | `CampaignBrief.targetAudience` | `campaign_briefs.target_audience` (VARCHAR 500) |
| **Step 4:** Target Location | `f_targetLocation` | `project.targetLocation` | `CampaignBriefRequest.targetLocation` (`@NotBlank`, max 300) | `CampaignBrief.targetLocation` | `campaign_briefs.target_location` (VARCHAR 300) |
| **Step 4:** Start Date | `f_startDate` | `project.startDate` | `CampaignBriefRequest.startDate` (`@NotNull`) | `CampaignBrief.startDate` | `campaign_briefs.start_date` (DATE) |
| **Step 4:** End Date | `f_endDate` | `project.endDate` | `CampaignBriefRequest.endDate` (`@NotNull`) | `CampaignBrief.endDate` | `campaign_briefs.end_date` (DATE) |
| **Step 4:** Duration | `f_duration` | `project.duration` | `CampaignBriefRequest.duration` (`@NotBlank`, max 50) | `CampaignBrief.duration` | `campaign_briefs.duration` (VARCHAR 50) |
| **Step 5:** Min Budget | `f_budgetMinValue` | `project.budgetMinValue` | `CampaignBriefRequest.budgetMinValue` (`@NotNull`, `@PositiveOrZero`) | `CampaignBrief.budgetMinValue` | `campaign_briefs.budget_min_value` (NUMERIC 14,2) |
| **Step 5:** Min Unit | `f_budgetMinUnit` | `project.budgetMinUnit` | `CampaignBriefRequest.budgetMinUnit` (max 20) | `CampaignBrief.budgetMinUnit` | `campaign_briefs.budget_min_unit` (VARCHAR 20) |
| **Step 5:** Max Budget | `f_budgetMaxValue` | `project.budgetMaxValue` | `CampaignBriefRequest.budgetMaxValue` (`@NotNull`, `@PositiveOrZero`) | `CampaignBrief.budgetMaxValue` | `campaign_briefs.budget_max_value` (NUMERIC 14,2) |
| **Step 5:** Max Unit | `f_budgetMaxUnit` | `project.budgetMaxUnit` | `CampaignBriefRequest.budgetMaxUnit` (max 20) | `CampaignBrief.budgetMaxUnit` | `campaign_briefs.budget_max_unit` (VARCHAR 20) |
| **Step 5:** Flexible Budget | `f_flexBudget` | `project.flexibleBudget` | `CampaignBriefRequest.flexibleBudget` (boolean) | `CampaignBrief.flexibleBudget` | `campaign_briefs.flexible_budget` (BOOLEAN) |
| **Step 5:** Quote Count | `f_quoteCount` | `project.quotationsRequired` | `CampaignBriefRequest.quotationsRequired` (`@NotBlank`, max 20) | `CampaignBrief.quotationsRequired` | `campaign_briefs.quotations_required` (VARCHAR 20) |
| **Step 5:** Agency Prefs | `selections.agencyPref` | `project.agencyPreferences` | `CampaignBriefRequest.agencyPreferences` (`@NotEmpty`) | `CampaignBrief.agencyPreferences` | `campaign_brief_agency_prefs.preference` (VARCHAR 80) |
| **Step 6:** GST Number | `f_gst` | `gstNumber` | `AdvertiserRegistrationRequest.gstNumber` (`@Pattern`, 15) | `AdvertiserProfile.gstNumber` | `advertiser_profiles.gst_number` (VARCHAR 15) |
| **Step 6:** PAN Number | `f_pan` | `panNumber` | `AdvertiserRegistrationRequest.panNumber` (`@Pattern`, 10) | `AdvertiserProfile.panNumber` | `advertiser_profiles.pan_number` (VARCHAR 10) |
| **Step 7:** Terms Accept | `f_termsAccept` | `acceptedTerms` | `AdvertiserRegistrationRequest.acceptedTerms` (`@AssertTrue`) | *Checked during registration* | *Implicit (user active)* |

---

## 4. Discrepancies, Gaps & "Ghost" Fields Identified

### 4.1 UI Fields Present in Wizard but Dropped in Backend
1. **`additionalFilters` in Step 5:**
   - User selects items like *GST Verified, MSME Verified, Minimum Experience, Industry Expertise, Verified Badge Holders*.
   - **Gap:** These are completely ignored by `mapAdvertiser()` and do not exist on `CampaignBriefRequest` or `campaign_briefs` table!
2. **Company Logo in Step 2 (`LogoUpload`):**
   - User can upload an image preview in Step 2.
   - **Gap:** Neither `AdvertiserRegistrationRequest` nor `AdvertiserProfile` has a `logoUrl` or storage key column. Logo data is discarded upon submission.
3. **Step 6 Verification Documents & Attachments:**
   - 2 Verification Cards (*Registration Certificate, MSME Certificate*).
   - 1 Upload Button (*Company Brochure*).
   - 6 Attach Zones (*Images, Product Brochure, Brand Guidelines, Video Files, Design Files, Additional Documents*).
   - **Gap:** None of these file inputs upload files or bind to the DTO payload. They are purely client-side static placeholders.
4. **Step 1 Email Notification Toggle:**
   - `<NotifRow>` contains a toggle for "Receive email notifications for new quotations".
   - **Gap:** It is not stored in state or persisted in user notification preferences.
5. **Step 3 OTP Verification:**
   - "Verify Email via OTP" and "Verify Mobile via OTP" components render buttons with OTP dialogs.
   - **Gap:** They are simulated stubs and do not call real SMS/Email OTP APIs. Validation permits proceeding without completing OTP.

### 4.2 Backend Expectations Missing or Misaligned in UI
1. **First Name vs. Last Name Disconnect:**
   - DB `users` table has `first_name` (VARCHAR 80) and `last_name` (VARCHAR 80).
   - Step 3 only presents one input: `f_firstName` with label "Contact Person Name" (placeholder: "Rohan Sharma").
   - Result: If the user types "Rohan Sharma", `firstName` becomes `"Rohan Sharma"` and `lastName` is stored as `null`.
2. **Missing Campaign Status:**
   - The UI success screen tells the user: "Under Review — our team verifies your requirement details within 24 hours."
   - The dashboard filters campaigns by *Live, Scheduled, In Review, Completed*.
   - **Gap:** The database table `campaign_briefs` has **no status column**. It defaults to undefined state.

---

## 5. Architectural Evaluation & Recommendations

### 5.1 Critical Flow Problem: The Mandatory Campaign Brief Barrier

> [!WARNING]
> **Major Conversion Drop-off Risk:**
> Currently, an advertiser cannot simply register an account on The AdBasket to browse listings, check billboard prices, or evaluate agencies.
> They are **forced** to fill out 2 full steps (Steps 4 & 5) containing 12 mandatory fields about a specific campaign brief (title, description, audience, dates, min/max budget, quotation counts, preferences).

#### Recommendation: Decouple Registration from Campaign Posting
Two implementation paths:
1. **Option A (Recommended — Progressive Onboarding):**
   - Allow Step 4 & 5 to be **optional** during registration (add a "Skip for now, I want to browse first" button).
   - If skipped, only `User` and `AdvertiserProfile` are created; `campaign_briefs` entry is deferred until they click "+ Post Campaign" from the dashboard or browse page.
   - Requires relaxing `@NotNull CampaignBriefRequest project` to `@Valid CampaignBriefRequest project` (nullable).
2. **Option B (Tabbed / Dual Mode):**
   - Provide a toggle on Step 1: "Quick Registration (Browse Only)" vs "Full Onboarding (Post a Campaign Now)".

---

### 5.2 Fields/Features to REMOVE or DEFER

1. **Remove / Clean up Step 6 File Dropzones (Temporary Deferral):**
   - Currently, Step 6 displays 6 elaborate creative attachment zones (PSD, AI, Video, Guidelines).
   - Because no cloud storage pipeline (S3/GCS) exists for advertiser campaign files at registration time, having mock upload zones creates user frustration and confusion.
   - **Action:** Replace the 6 drag-and-drop zones with a clear notification:  
     *"You can upload creative assets and brand files directly to individual campaign quotes from your dashboard after registration."*
2. **Clean up Step 3 OTP Stubs:**
   - Either hook them up to real backend OTP endpoints (`/api/auth/otp/send`, `/api/auth/otp/verify`) OR remove the "Verify OTP" buttons until Phase 2 so users don't think their verification failed.
3. **Remove `selections.additionalFilters` or Persist it:**
   - If agency filters like *GST Verified, MSME Verified* are important to advertisers, persist them in a dedicated child table `campaign_brief_filters` (similar to `campaign_brief_agency_prefs`). If not yet used by agency matching algorithms, remove the toggle pills to avoid dead UI.

---

### 5.3 Fields/Features to INTRODUCE or FIX

1. **Split Contact Person Name into First Name & Last Name:**
   - Replace single `f_firstName` in Step 3 with:
     - `f_firstName` ("First Name", Required, max 80)
     - `f_lastName` ("Last Name", Optional / Recommended, max 80)
   - Matches the existing `users` table schema and Owner registration design.
2. **Introduce Company Phone / Landline (Optional):**
   - Currently only personal mobile `f_phone` is captured. For corporate brands, adding `companyPhone` (VARCHAR 20) on `AdvertiserProfile` allows company verification without relying solely on personal mobile numbers.
3. **Persist Company Logo (`logo_url`):**
   - Add `logo_url VARCHAR(500)` to `advertiser_profiles`.
   - Update `AdvertiserProfile.java` and `AdvertiserRegistrationRequest`.
4. **Normalize Budget Values for Query Performance:**
   - Currently, budget is stored as scalar (e.g. `50`) + unit (`"thousand"`).
   - Querying campaigns with `budget_min_value BETWEEN 100000 AND 500000` is impossible without complex SQL string/unit parsing.
   - **Action:** Calculate and store normalized INR amounts in DB:
     - `budget_min_amount NUMERIC(14,2)` (e.g. `50000.00`)
     - `budget_max_amount NUMERIC(14,2)` (e.g. `200000.00`)
5. **Add Campaign Status Column:**
   - Add `status VARCHAR(20) NOT NULL DEFAULT 'PENDING_REVIEW'` to `campaign_briefs`.
   - Enum values: `DRAFT`, `PENDING_REVIEW`, `ACTIVE`, `IN_REVIEW`, `COMPLETED`, `CANCELLED`.
6. **Implement LocalStorage Draft Auto-Save:**
   - Introduce `advertiserDraftStorage.js` (mirroring `ownerDraftStorage.js`).
   - If an advertiser closes their tab or browser at Step 5, their entered form fields, dates, and selections are restored upon return.

---

## 6. Proposed Schema & DTO Evolution

### 6.1 Database Migration: `V3__advertiser_improvements.sql`

```sql
-- 1. Add status and normalized budget columns to campaign briefs
ALTER TABLE campaign_briefs 
    ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'PENDING_REVIEW',
    ADD COLUMN budget_min_amount NUMERIC(14,2),
    ADD COLUMN budget_max_amount NUMERIC(14,2),
    ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 2. Add logo and company contact to advertiser profiles
ALTER TABLE advertiser_profiles 
    ADD COLUMN logo_url VARCHAR(500),
    ADD COLUMN company_phone VARCHAR(20);

-- 3. Persist additional agency requirement filters
CREATE TABLE campaign_brief_filters (
    brief_id BIGINT NOT NULL,
    filter_key VARCHAR(50) NOT NULL,
    CONSTRAINT fk_campaign_brief_filters FOREIGN KEY (brief_id) REFERENCES campaign_briefs (id) ON DELETE CASCADE
);

CREATE INDEX idx_campaign_brief_filters ON campaign_brief_filters (brief_id);
CREATE INDEX idx_campaign_briefs_status ON campaign_briefs (status);
```

### 6.2 Updated DTO Structure (`AdvertiserRegistrationRequest.java`)

```java
public record AdvertiserRegistrationRequest(
        // Login credentials (required for anonymous, optional if authenticated)
        @Email(message = "Enter a valid email address.")
        @Size(max = 180)
        String accountEmail,
        
        @Size(max = 72, message = "Password must be at most 72 characters.")
        String password,

        // Company
        @SanitizeText
        @NotBlank(message = "Company name is required.")
        @Size(max = 150)
        String companyName,

        @SanitizeText
        @NotBlank(message = "Business type is required.")
        @Size(max = 80)
        String businessType,

        @SanitizeText
        @Size(max = 255)
        String website,

        @SanitizeText
        @Size(max = 500)
        String logoUrl,

        @Pattern(regexp = ValidationPatterns.PHONE_OPTIONAL)
        String companyPhone,

        @Pattern(regexp = ValidationPatterns.GST_OPTIONAL, message = "GST number must be 15 characters.")
        String gstNumber,

        @Pattern(regexp = ValidationPatterns.PAN_OPTIONAL, message = "PAN must be 10 characters.")
        String panNumber,

        @NotEmpty(message = "Select at least one industry.")
        List<@NotBlank String> industries,

        // Primary Contact
        @SanitizeText
        @NotBlank(message = "First name is required.")
        @Size(max = 80)
        String firstName,

        @SanitizeText
        @Size(max = 80)
        String lastName,

        @SanitizeText
        @NotBlank(message = "Designation is required.")
        @Size(max = 120)
        String contactDesignation,

        @NotBlank(message = "Contact email is required.")
        @Email(message = "Enter a valid email address.")
        @Size(max = 180)
        String contactEmail,

        @NotBlank(message = "Phone number is required.")
        @Pattern(regexp = ValidationPatterns.PHONE, message = "Enter a valid phone number.")
        String contactPhone,

        // Office Address
        @SanitizeText
        @NotBlank(message = "Address line 1 is required.")
        @Size(max = 300)
        String addressLine1,

        @SanitizeText
        @Size(max = 300)
        String addressLine2,

        @SanitizeText
        @Size(max = 200)
        String landmark,

        @SanitizeText
        @NotBlank(message = "City is required.")
        @Size(max = 100)
        String city,

        @SanitizeText
        @NotBlank(message = "State is required.")
        @Size(max = 100)
        String state,

        @SanitizeText
        @NotBlank(message = "PIN code is required.")
        @Pattern(regexp = ValidationPatterns.PINCODE, message = ValidationPatterns.PINCODE_MESSAGE)
        String pincode,

        // Campaign Brief (Made optional to allow quick onboarding)
        @Valid
        CampaignBriefRequest project,

        @AssertTrue(message = "You must accept the Terms & Conditions.")
        boolean acceptedTerms
) {}
```

---

## 7. Next Steps for Implementation

1. **Frontend Step 3 UI adjustment:** Split `Contact Person Name` into `First Name` and `Last Name` inputs.
2. **Backend relaxation:** Allow `project` in `AdvertiserRegistrationRequest` to be optional (`null`), so advertisers can onboard without being forced to write an immediate campaign brief.
3. **Step 6 cleanup:** Streamline verification documents to indicate that creative media files can be uploaded directly within campaign bids post-registration.
4. **Persist normalized budget amounts:** Multiply budget value by unit (`thousand` $\times 1,000$, `lakh` $\times 100,000$, `crore` $\times 10,000,000$) on the backend for standard numeric SQL comparisons.
5. **Add draft storage:** Implement `advertiserDraftStorage.js` in the frontend so progress across the 7 steps is resilient to page refreshes.
