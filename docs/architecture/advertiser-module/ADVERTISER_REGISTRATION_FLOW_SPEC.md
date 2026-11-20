# Advertiser Registration Flow — Detailed Specification & Component Breakdown

> **Project:** The AdBasket  
> **Module:** Advertiser (Brand / Business Onboarding)  
> **Branch:** `master`  
> **Status:** Production-Ready Architectural & Field Specification (Standard 7-Step Flow)  
> **Target Files:**
> - Frontend: `frontend/src/pages/AdvertiserRegister/AdvertiserRegister.jsx`, `steps.jsx`, `frontend/src/features/auth/registrationMappers.js`
> - Backend: `AdvertiserRegistrationRequest.java`, `CampaignBriefRequest.java`, `AdvertiserProfile.java`, `CampaignBrief.java`, `Address.java`
> - Database: `users`, `advertiser_profiles`, `advertiser_industries`, `campaign_briefs`, `campaign_brief_agency_prefs`, `addresses`

---

## 1. Executive Summary & Flow Architecture

The Advertiser Onboarding flow allows brand marketers, business owners, and campaign managers to onboard onto The AdBasket marketplace.

### 1.1 Standard 7-Step Architecture

The onboarding wizard follows the **standard 7-step layout** defined in `AdvertiserRegister.jsx`:
1. **Separation of Concerns:** Project requirements are defined in **Step 4 (Project Details)** and spending parameters are defined in **Step 5 (Budget & Quotations)**.
2. **Single Mandatory Initial Campaign:** Exactly **one campaign requirement** is captured during registration. This requirement is mandatory for onboarding.
3. **Subsequent Campaigns via Dashboard:** To keep registration focused, multi-campaign creation is managed post-onboarding via the authenticated dashboard (`/advertisers/dashboard` $\rightarrow$ Campaigns tab $\rightarrow$ `+ New Campaign`).

```mermaid
flowchart TD
    Start([User arrives at /advertisers/register]) --> AuthCheck{Is User Signed In?}
    
    AuthCheck -- No (Anonymous) --> Step1Anon[Step 1: Login Setup<br/>f_loginEmail + f_password required]
    AuthCheck -- Yes (MEMBER) --> Step1Auth[Step 1: Login Setup<br/>Prefilled email, optional password]
    
    Step1Anon --> Step2[Step 2: Business Information<br/>Company, Type, Industry, Logo]
    Step1Auth --> Step2
    
    Step2 --> Step3[Step 3: Contact Details<br/>Contact Person, Email, Mobile, Office Address]
    
    Step3 --> Step4[Step 4: Project Details<br/>Title, Description, Target Audience, Location, Dates, Duration]
    
    Step4 --> Step5[Step 5: Budget & Quotations<br/>Min/Max Budget, Units, Flexibility, Quote Count, Agency Prefs]
    
    Step5 --> Step6[Step 6: Verification & Attachments<br/>GST, PAN, Verification Notices]
    Step6 --> Step7[Step 7: Review & Submit<br/>Review Blocks for All Steps, Terms & Conditions]
    
    Step7 --> Submit[Submit POST /api/auth/register/advertiser]
    Submit --> Success[Success Screen<br/>Timeline: Under Review -> Goes Live -> Receive Quotations]
    Success --> Dashboard[/advertisers/dashboard<br/>Subsequent campaigns added here via + New Campaign]
```

### 1.2 Advertiser Authentication & Login Lifecycle

The Advertiser authentication and session lifecycle spans both onboarding and returning user workflows:

1. **Returning Advertiser Login (`POST /api/auth/login` & `POST /api/auth/google`):**
   - **Local Credentials:** Validated against `users` table via `AuthenticationManager` with BCrypt password hashing; verifies account is enabled and extracts `Role.ADVERTISER`.
   - **Google OneTap / FedCM:** Verifies Google ID token via `GoogleTokenVerifier`, linking `googleSubjectId` to the advertiser's profile.
   - **Token Emission & Rotation:** Issues short-lived JWT Access Token (15 min) with `ROLE_ADVERTISER` authority and an HttpOnly, Secure, SameSite refresh token cookie (`refreshToken`).
   - **Role-Aware Redirection:** Frontend routes authenticated users via `DASHBOARD_BY_ROLE['ADVERTISER'] = ROUTES.advertiserDashboard` (`/advertisers/dashboard`).
   - **API Namespace Protection:** Spring `SecurityConfig` enforces `.requestMatchers("/api/advertiser/**").hasRole("ADVERTISER")`. Requests lacking valid advertiser JWT claims receive HTTP 401 (`AUTHENTICATION_REQUIRED`) or HTTP 403 (`ACCESS_DENIED`).

2. **Step 1 Dual-State Onboarding Entry:**
   - **Anonymous Visitor:** Step 1 requires `f_loginEmail` and `f_password` (min 8 chars, complexity checks). Backend creates a new `User` with `role = Role.ADVERTISER`.
   - **Signed-in `MEMBER` Account:** Detected via `useAuth()`. Step 1 renders `SignedInBanner`, pre-populates name and email, and marks password optional. Backend elevates existing record from `MEMBER` to `ADVERTISER` via `AccountRegistrar.attachOrCreate(...)` without creating duplicate accounts.

3. **Session Synchronization & Conflict Recovery:**
   - **Cross-Tab Role Sync:** Listens to `storage` events on `ab_user` so background tabs update immediately to the promoted `ADVERTISER` role without waiting for token expiry.
   - **Email Conflict (HTTP 409):** If an anonymous user enters an already registered email, backend emits `EMAIL_ALREADY_EXISTS`. Handled via sign-in prompt in `AuthModal` so users can authenticate and complete onboarding via role promotion.

---

## 2. Standard 7-Step Stepper Inventory

| Step # | Step Title | Subtitle / Tagline | Key Responsibility |
| :---: | :--- | :--- | :--- |
| **1** | **Login Setup** | Credentials & Notifications | Email & password (anonymous) or verified session confirmation (`MEMBER`). |
| **2** | **Business Information** | Company Identity & Industry | Company name, business entity type, industry verticals, company logo. |
| **3** | **Contact Details** | Primary Contact & Office Address | Contact person first/last name, designation, email, mobile phone, physical address with PIN code auto-fill. |
| **4** | **Project Details** | What you want to advertise | Scope of initial campaign: title, detailed description, target audience, location, start date, end date, duration. |
| **5** | **Budget & Quotations** | Budget range, agency prefs | Min/max budget with unit, budget flexibility toggle, quotations required count, agency preferences. |
| **6** | **Verification & Attachments** | Tax & Identity Verification | GSTIN, PAN, and notice clarifying creative file uploads occur post-registration. |
| **7** | **Review & Submit** | Summary & Agreement | Consolidated review cards for company, contact, project, budget, verification, terms acceptance, and submission trigger. |
| **Post** | **Success Screen** | Onboarding Confirmation | 3-stage timeline (*Under Review $\rightarrow$ Goes Live $\rightarrow$ Receive Quotations*) + redirect to `/advertisers/dashboard`. |

---

## 3. Comprehensive Step-by-Step Field Specifications

---

### Step 1: Login Setup (`Step1`)
- **Frontend File:** `frontend/src/pages/AdvertiserRegister/steps.jsx`
- **Purpose:** Establishes account credentials for anonymous visitors or verifies active identity for signed-in `MEMBER` users.

| Field Name | Form Key | UI Control | Frontend Constraints | DTO Field & Validation | Entity Field & DB Column | DB Type & Nullability | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Login Email** | `f_loginEmail` | Text Input (`type="email"`) | Required if anon. Valid email format. | `accountEmail`<br>`@Email`, `@Size(max=180)` | `User.email`<br>`users.email` | `VARCHAR(180)`<br>**NOT NULL, UNIQUE** | Case-insensitive uniqueness enforced by DB. |
| **Password** | `f_password` | `PasswordField` | Required if anon. Min 8 chars. | `password`<br>`@Size(max=72)` | `User.password`<br>`users.password` | `VARCHAR(100)`<br>NULL (for Google-only) | Enforces uppercase, lowercase, number, symbol. Stored as BCrypt hash. |
| **Confirm Password** | `f_confirmPassword` | `ConfirmPasswordField` | Must match `f_password`. | *Client-side only* | *None* | N/A | Validated by client prior to step advancement. |
| **Signed-in Identity** | *N/A* | `SignedInBanner` | Read-only | `currentUserId` passed via Auth Principal | `User.id` | `BIGINT` | If authenticated, bypasses email/password entry. |

---

### Step 2: Business Information (`Step2`)
- **Frontend File:** `frontend/src/pages/AdvertiserRegister/steps.jsx`
- **Purpose:** Identifies the commercial legal entity and business sector.

| Field Name | Form Key | UI Control | Frontend Constraints | DTO Field & Validation | Entity Field & DB Column | DB Type & Nullability | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Company Name** | `f_companyName` | Text Input | Required. Max 150 chars. | `companyName`<br>`@NotBlank`, `@SanitizeText`, `@Size(max=150)` | `AdvertiserProfile.companyName`<br>`advertiser_profiles.company_name` | `VARCHAR(150)`<br>**NOT NULL** | Official trading or corporate name. |
| **Business Type** | `f_businessType` | Select Dropdown | Required. Selected from list. | `businessType`<br>`@NotBlank`, `@SanitizeText`, `@Size(max=80)` | `AdvertiserProfile.businessType`<br>`advertiser_profiles.business_type` | `VARCHAR(80)`<br>**NOT NULL** | Allowed: *Startup, SME, Corporate, Manufacturer, Retailer, Service Provider, Educational Institution, NGO, Government Organization, Other*. |
| **Website URL** | `f_website` | Text Input (`type="url"`) | Optional. Max 255 chars. | `website`<br>`@SanitizeText`, `@Size(max=255)` | `AdvertiserProfile.website`<br>`advertiser_profiles.website` | `VARCHAR(255)`<br>NULLABLE | Empty string converted to `null`. |
| **Industry Categories** | `selections.industries` | `MultiSelectDropdown` | Required. Min 1 category selected. | `industries`<br>`@NotEmpty List<@NotBlank String>` | `AdvertiserProfile.industries`<br>`advertiser_industries.industry` | `VARCHAR(80)`<br>**NOT NULL** | Stored in child table `advertiser_industries` with FK cascade. Allowed: *Electronics, Healthcare, Real Estate, FMCG, Education, Fashion, Agriculture, Technology, Other*. |
| **Company Logo** | *f_logo (state)* | `LogoUpload` | Optional. Max 5MB (PNG/JPG/SVG). | *Not mapped in current DTO* | *Missing column* | None | **Gap:** UI renders logo uploader, but column is missing in DB schema. |

---

### Step 3: Contact Details (`Step3`)
- **Frontend File:** `frontend/src/pages/AdvertiserRegister/steps.jsx`
- **Purpose:** Captures the primary account representative and registered office location.

| Field Name | Form Key | UI Control | Frontend Constraints | DTO Field & Validation | Entity Field & DB Column | DB Type & Nullability | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Contact First Name** | `f_firstName` | Text Input | Required. Max 80 chars. | `firstName`<br>`@NotBlank`, `@SanitizeText`, `@Size(max=80)` | `User.firstName`<br>`users.first_name` | `VARCHAR(80)`<br>**NOT NULL** | Representative's first name. |
| **Contact Last Name** | `f_lastName` | Text Input | Optional. Max 80 chars. | `lastName`<br>`@SanitizeText`, `@Size(max=80)` | `User.lastName`<br>`users.last_name` | `VARCHAR(80)`<br>NULLABLE | **Fix:** Split from single name field into first/last name. |
| **Designation** | `f_desig` | Text Input | Required. Max 120 chars. | `contactDesignation`<br>`@NotBlank`, `@SanitizeText`, `@Size(max=120)` | `AdvertiserProfile.contactDesignation`<br>`advertiser_profiles.contact_designation` | `VARCHAR(120)`<br>**NOT NULL** | e.g. *Marketing Director, Founder*. |
| **Contact Email** | `f_email` | Text Input (`type="email"`) | Required. Valid email format. | `contactEmail`<br>`@NotBlank`, `@Email`, `@Size(max=180)` | `AdvertiserProfile.contactEmail`<br>`advertiser_profiles.contact_email` | `VARCHAR(180)`<br>**NOT NULL** | Operational email for alerts & quotes. Has copy shortcut. |
| **Mobile Number** | `f_phone` | Tel Input (`+91` prefix) | Required. Exactly 10 digits. | `contactPhone`<br>`@NotBlank`, `@Pattern(PHONE)` | `User.phone`<br>`users.phone` | `VARCHAR(20)`<br>NULLABLE (in DB) | Cleaned to digits only. Pattern: `^[0-9+\-\s]{10,15}$`. |
| **Address Line 1** | `f_addressLine1` | Text Input | Required. Max 300 chars. | `addressLine1`<br>`@NotBlank`, `@SanitizeText`, `@Size(max=300)` | `Address.line1`<br>`addresses.line1` | `VARCHAR(300)`<br>**NOT NULL** | Unit, Building, Street. |
| **Address Line 2** | `f_addressLine2` | Text Input | Optional. Max 300 chars. | `addressLine2`<br>`@SanitizeText`, `@Size(max=300)` | `Address.line2`<br>`addresses.line2` | `VARCHAR(300)`<br>NULLABLE | Area, Sub-locality. |
| **Landmark** | `f_landmark` | Text Input | Optional. Max 200 chars. | `landmark`<br>`@SanitizeText`, `@Size(max=200)` | `Address.landmark`<br>`addresses.landmark` | `VARCHAR(200)`<br>NULLABLE | Nearby reference landmark. |
| **City** | `f_city` | Text Input | Required. Max 100 chars. | `city`<br>`@NotBlank`, `@SanitizeText`, `@Size(max=100)` | `Address.city`<br>`addresses.city` | `VARCHAR(100)`<br>**NOT NULL** | Auto-populated by PIN lookup or manual. |
| **State** | `f_state` | Text Input | Required. Max 100 chars. | `state`<br>`@NotBlank`, `@SanitizeText`, `@Size(max=100)` | `Address.state`<br>`addresses.state` | `VARCHAR(100)`<br>**NOT NULL** | Auto-populated by PIN lookup or manual. |
| **PIN Code** | `f_pincode` | Text Input (6 digits) | Required. Regex `^[1-9][0-9]{5}$`. | `pincode`<br>`@NotBlank`, `@Pattern(PINCODE)` | `Address.pincode`<br>`addresses.pincode` | `VARCHAR(6)`<br>**NOT NULL, INDEXED** | Cannot start with 0. Triggers postal autofill. |

---

### Step 4: Project Details (`Step4`)
- **Frontend File:** `frontend/src/pages/AdvertiserRegister/steps.jsx`
- **Purpose:** Captures the core scope and timeline for the initial mandatory campaign.

| Field Name | Form Key | UI Control | Frontend Constraints | DTO Field & Validation | Entity Field & DB Column | DB Type & Nullability | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Project Title** | `f_projectTitle` | Text Input | Required. Max 200 chars. | `project.title`<br>`@NotBlank`, `@SanitizeText`, `@Size(max=200)` | `CampaignBrief.title`<br>`campaign_briefs.title` | `VARCHAR(200)`<br>**NOT NULL** | Name of advertising initiative. |
| **Description** | `f_projectDesc` | Textarea (`rows={5}`) | Required. Max 2000 chars. | `project.description`<br>`@NotBlank`, `@SanitizeText`, `@Size(max=2000)` | `CampaignBrief.description`<br>`campaign_briefs.description` | `VARCHAR(2000)`<br>**NOT NULL** | Detailed requirements & media types. |
| **Target Audience** | `f_targetAudience` | Text Input | Required. Max 500 chars. | `project.targetAudience`<br>`@NotBlank`, `@SanitizeText`, `@Size(max=500)` | `CampaignBrief.targetAudience`<br>`campaign_briefs.target_audience` | `VARCHAR(500)`<br>**NOT NULL** | Demographics & customer segments. |
| **Target Location** | `f_targetLocation` | Text Input | Required. Max 300 chars. | `project.targetLocation`<br>`@NotBlank`, `@SanitizeText`, `@Size(max=300)` | `CampaignBrief.targetLocation`<br>`campaign_briefs.target_location` | `VARCHAR(300)`<br>**NOT NULL** | Target cities/markets. |
| **Expected Start Date** | `f_startDate` | Date Input (`type="date"`) | Required. Valid ISO Date. | `project.startDate`<br>`@NotNull LocalDate` | `CampaignBrief.startDate`<br>`campaign_briefs.start_date` | `DATE`<br>**NOT NULL** | Planned start date. |
| **Expected End Date** | `f_endDate` | Date Input (`type="date"`) | Required. End Date $\ge$ Start Date. | `project.endDate`<br>`@NotNull LocalDate`, `isValidDateRange()` | `CampaignBrief.endDate`<br>`campaign_briefs.end_date` | `DATE`<br>**NOT NULL** | Cross-field validation prevents inverted dates. |
| **Project Duration** | `f_duration` | Select Dropdown | Required. Selected from list. | `project.duration`<br>`@NotBlank`, `@Size(max=50)` | `CampaignBrief.duration`<br>`campaign_briefs.duration` | `VARCHAR(50)`<br>**NOT NULL** | Options: *Less than 1 week, 1–2 weeks, 1 month, 1–3 months, 3–6 months, 6–12 months, Ongoing*. |

---

### Step 5: Budget & Quotations (`Step5`)
- **Frontend File:** `frontend/src/pages/AdvertiserRegister/steps.jsx`
- **Purpose:** Defines the spending parameters and agency matching preferences for the initial campaign.

| Field Name | Form Key | UI Control | Frontend Constraints | DTO Field & Validation | Entity Field & DB Column | DB Type & Nullability | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Min Budget Value** | `f_budgetMinValue` | Number Input (`min="0"`) | Required. Numeric scalar $\ge 0$. | `project.budgetMinValue`<br>`@NotNull`, `@PositiveOrZero BigDecimal` | `CampaignBrief.budgetMinValue`<br>`campaign_briefs.budget_min_value` | `NUMERIC(14,2)`<br>NULLABLE (in DB) | Numerical unit multiplier (e.g. `50`). |
| **Min Budget Unit** | `f_budgetMinUnit` | Select Dropdown | Optional. Default: `thousand`. | `project.budgetMinUnit`<br>`@Size(max=20)` | `CampaignBrief.budgetMinUnit`<br>`campaign_briefs.budget_min_unit` | `VARCHAR(20)`<br>NULLABLE | Options: *thousand, lakh, crore*. |
| **Max Budget Value** | `f_budgetMaxValue` | Number Input (`min="0"`) | Required. Numeric scalar $\ge 0$. | `project.budgetMaxValue`<br>`@NotNull`, `@PositiveOrZero BigDecimal` | `CampaignBrief.budgetMaxValue`<br>`campaign_briefs.budget_max_value` | `NUMERIC(14,2)`<br>NULLABLE (in DB) | Numerical unit multiplier (e.g. `2`). |
| **Max Budget Unit** | `f_budgetMaxUnit` | Select Dropdown | Optional. Default: `lakh`. | `project.budgetMaxUnit`<br>`@Size(max=20)` | `CampaignBrief.budgetMaxUnit`<br>`campaign_briefs.budget_max_unit` | `VARCHAR(20)`<br>NULLABLE | Options: *thousand, lakh, crore*. |
| **Flexible Budget?** | `f_flexBudget` | `YesNoToggle` | Optional. Default: `no`. | `project.flexibleBudget`<br>`boolean` | `CampaignBrief.flexibleBudget`<br>`campaign_briefs.flexible_budget` | `BOOLEAN`<br>**NOT NULL, DEFAULT FALSE** | Whether advertiser accepts bids outside budget. |
| **Quotations Count** | `f_quoteCount` | `RadioCards` | Required. Selected card. | `project.quotationsRequired`<br>`@NotBlank`, `@Size(max=20)` | `CampaignBrief.quotationsRequired`<br>`campaign_briefs.quotations_required` | `VARCHAR(20)`<br>NULLABLE (in DB) | Desired bidder volume: *3, 5, 10, 10+*. |
| **Agency Preferences** | `selections.agencyPref` | `TogglePills` | Required. Min 1 selected. | `project.agencyPreferences`<br>`@NotEmpty List<@NotBlank String>` | `CampaignBrief.agencyPreferences`<br>`campaign_brief_agency_prefs.preference` | `VARCHAR(80)`<br>**NOT NULL** | Child table with FK cascade. Allowed: *verified, local, national, international, open*. |

---

### Step 6: Verification & Attachments (`Step6`)
- **Frontend File:** `frontend/src/pages/AdvertiserRegister/steps.jsx`
- **Purpose:** Collects optional statutory tax credentials (GSTIN/PAN).

| Field Name | Form Key | UI Control | Frontend Constraints | DTO Field & Validation | Entity Field & DB Column | DB Type & Nullability | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **GST Number** | `f_gst` | Text Input (mono, uppercase) | Optional. If provided, exactly 15 alphanumeric chars. | `gstNumber`<br>`@Pattern(GST_OPTIONAL)` | `AdvertiserProfile.gstNumber`<br>`advertiser_profiles.gst_number` | `VARCHAR(15)`<br>NULLABLE, **UNIQUE** | Regex: `^[0-9A-Za-z]{15}$`. Empty converted to `null`. Unique constraint enforced in DB (`uq_advertiser_profiles_gst`). |
| **PAN Number** | `f_pan` | Text Input (mono, uppercase) | Optional. If provided, exactly 10 alphanumeric chars. | `panNumber`<br>`@Pattern(PAN_OPTIONAL)` | `AdvertiserProfile.panNumber`<br>`advertiser_profiles.pan_number` | `VARCHAR(10)`<br>NULLABLE | Regex: `^[0-9A-Za-z]{10}$`. Empty converted to `null`. |
| **Creative Assets Notice** | *N/A* | Informational Callout | Read-only | *N/A* | *N/A* | N/A | Clarifies that creative artwork (PSD, AI, Video) is attached directly to specific quotes from the dashboard. |

---

### Step 7: Review & Submit (`Step7`)
- **Frontend File:** `frontend/src/pages/AdvertiserRegister/steps.jsx`
- **Purpose:** Full review of all entered details with step-jump edit capabilities, legal terms consent, and atomic submission.

| Field Name | Form Key | UI Control | Frontend Constraints | DTO Field & Validation | Entity Field & DB Column | DB Type & Nullability | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Review Cards** | *N/A* | `ReviewBlock` & `ReviewRow` | Read-only | *N/A* | *N/A* | N/A | Displays consolidated summaries for Steps 1–6 with step-jump edit links. |
| **Terms Acceptance** | `f_termsAccept` | Checkbox (`TermsRow`) | **Mandatory** (`true`). | `acceptedTerms`<br>`@AssertTrue` | *Validation constraint only* | N/A | Explicit consent to Terms & Conditions and Privacy Policy. |
| **Submit Button** | *N/A* | `button.btn-submit` | Disabled while submitting | Triggers `POST /api/auth/register/advertiser` | Multiple tables | N/A | Submits all data in single atomic backend transaction. |

---

## 4. Backend DTO & Service Mapping

### 4.1 Backend DTO: `AdvertiserRegistrationRequest.java`

Captures the single mandatory campaign as `CampaignBriefRequest project`:

```java
package com.theadbasket.backend.registration.dto;

import java.util.List;
import com.theadbasket.backend.common.validation.SanitizeText;
import com.theadbasket.backend.common.validation.ValidationPatterns;
import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

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

        // Single Mandatory Initial Campaign Brief
        @NotNull(message = "Project details are required.")
        @Valid
        CampaignBriefRequest project,

        @AssertTrue(message = "You must accept the Terms & Conditions.")
        boolean acceptedTerms
) {}
```

---

### 4.2 Backend Service: `AdvertiserRegistrationService.java`

Saves the single initial campaign brief atomically with the user and profile:

```java
@Transactional
public AuthResponse register(AdvertiserRegistrationRequest request, Long currentUserId) {
    if (!rolePolicyProperties.isEnabled(Role.ADVERTISER)) {
        throw new BadRequestException(ErrorCode.ADVERTISER_REGISTRATION_UNAVAILABLE);
    }

    User user = accountRegistrar.attachOrCreate(currentUserId, request.firstName().trim(),
            request.lastName(), request.accountEmail(), request.password(), request.contactPhone(),
            Role.ADVERTISER);

    Address address = Address.of(
            request.addressLine1(),
            request.addressLine2(),
            request.landmark(),
            request.city(),
            request.state(),
            request.pincode()
    );

    AdvertiserProfile profile = new AdvertiserProfile();
    profile.setUser(user);
    profile.setCompanyName(request.companyName().trim());
    profile.setBusinessType(request.businessType());
    profile.setWebsite(blankToNull(request.website()));
    profile.setGstNumber(blankToNull(request.gstNumber()));
    profile.setPanNumber(blankToNull(request.panNumber()));
    profile.setContactDesignation(request.contactDesignation());
    profile.setContactEmail(request.contactEmail().trim().toLowerCase());
    profile.setAddress(address);
    profile.setIndustries(new ArrayList<>(request.industries()));
    advertiserProfileRepository.save(profile);

    // Save initial mandatory campaign brief
    campaignBriefRepository.save(toBrief(request.project(), user));

    log.info("Advertiser registration complete for user id={}", user.getId());
    return authService.issueTokensFor(user);
}
```

---

## 5. Architectural Findings & Action Plan

1. **Duplicate GST Pre-Check:** Pre-check `existsByGstNumber()` in `AdvertiserRegistrationService` to emit an HTTP 409 `ConflictException` instead of letting PostgreSQL throw an unhandled 500 `DataIntegrityViolationException`.
2. **Onboarding Welcome Notification:** Inject `NotificationService` into `AdvertiserRegistrationService` and generate a welcome notification (aligning with `OwnerRegistrationService` and `V5__create_notifications.sql`).
3. **Contact Name Split:** Split `Contact Person Name` (`f_firstName`) in Step 3 into `First Name` (required) and `Last Name` (optional) to populate `users.first_name` and `users.last_name` accurately.
4. **Campaign Lifecycle Tracking:** Add `status VARCHAR(20) NOT NULL DEFAULT 'PENDING_REVIEW'` and `updated_ts` to `campaign_briefs` via a migration.
5. **Budget Query Normalization:** Compute and store normalized absolute INR amounts (`budget_min_amount NUMERIC(14,2)`) during ingestion for SQL range queries.

---

## 6. Multi-Campaign Lifecycle: Handled Post-Registration in Dashboard

Since exactly 1 campaign is captured during onboarding, creating additional campaigns is handled inside the authenticated dashboard:

1. **Dashboard Route:** `/advertisers/dashboard`
2. **Action Trigger:** Click `+ New Campaign` button on:
   - Top right of `Overview` page
   - Header of `My Campaigns` page (`/advertisers/dashboard?tab=campaigns`)
3. **Modal / Form View:** Opens a dedicated "Create Campaign Brief" dialog containing the fields from Step 4 and Step 5.
4. **Endpoint:** `POST /api/advertiser/campaigns` (authenticated, role `ADVERTISER`).
5. **Result:** Creates an additional `campaign_briefs` record linked to the user's ID without re-entering company or contact details.
