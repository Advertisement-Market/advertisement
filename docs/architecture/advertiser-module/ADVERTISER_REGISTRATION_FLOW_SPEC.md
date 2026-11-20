# Advertiser Registration Flow — Detailed Specification & Component Breakdown

> **Project:** The AdBasket  
> **Module:** Advertiser (Brand / Business Onboarding)  
> **Branch:** `amjangde/advertiser-module-architecture`  
> **Document Status:** Approved Architecture & Field Specification (Consolidated 6-Step Flow, Single Mandatory Campaign)  
> **Target Files:**
> - Frontend: `frontend/src/pages/AdvertiserRegister/AdvertiserRegister.jsx`, `steps.jsx`, `frontend/src/features/auth/registrationMappers.js`
> - Backend: `AdvertiserRegistrationRequest.java`, `CampaignBriefRequest.java`, `AdvertiserProfile.java`, `CampaignBrief.java`, `Address.java`
> - Database: `users`, `advertiser_profiles`, `advertiser_industries`, `campaign_briefs`, `campaign_brief_agency_prefs`, `addresses`

---

## 1. Executive Summary & Flow Architecture

The Advertiser Onboarding flow allows brand marketers, business owners, and campaign managers to onboard onto The AdBasket marketplace.

### 1.1 Consolidated 6-Step Architecture

To streamline onboarding and eliminate context switching:
1. **Consolidated Step 4:** Project Details and Budget & Quotations are merged into a single step: **Step 4 ("Campaign & Budget Details")**.
2. **Total Steps:** The wizard is reduced from 7 steps to **6 steps**.
3. **Single Mandatory Campaign:** Exactly **one campaign requirement** is captured during registration. This requirement is mandatory. 
4. **Subsequent Campaigns via Dashboard:** To keep onboarding fast and focused, multi-campaign creation is deferred to the authenticated dashboard (`/advertisers/dashboard` $\rightarrow$ Campaigns tab $\rightarrow$ `+ New Campaign`).

```mermaid
flowchart TD
    Start([User arrives at /advertisers/register]) --> AuthCheck{Is User Signed In?}
    
    AuthCheck -- No (Anonymous) --> Step1Anon[Step 1: Login Setup<br/>f_loginEmail + f_password required]
    AuthCheck -- Yes (MEMBER) --> Step1Auth[Step 1: Login Setup<br/>Prefilled email, optional password]
    
    Step1Anon --> Step2[Step 2: Business Information<br/>Company, Type, Industry, Logo]
    Step1Auth --> Step2
    
    Step2 --> Step3[Step 3: Contact Details<br/>Contact Person, Email, Mobile, Office Address]
    
    Step3 --> Step4[Step 4: Campaign & Budget Details<br/>Mandatory Initial Campaign Brief + Budget + Agency Prefs]
    
    Step4 --> Step5[Step 5: Verification & Attachments<br/>GST, PAN, Verification Notices]
    Step5 --> Step6[Step 6: Review & Submit<br/>Review Blocks for All Steps, Terms & Conditions]
    
    Step6 --> Submit[Submit POST /api/auth/register/advertiser]
    Submit --> Success[Success Screen<br/>Timeline: Under Review -> Goes Live -> Receive Quotations]
    Success --> Dashboard[/advertisers/dashboard<br/>Subsequent campaigns added here via + New Campaign]
```

---

## 2. Updated 6-Step Stepper Inventory

| Step # | Step Title | Subtitle / Tagline | Key Responsibility |
| :---: | :--- | :--- | :--- |
| **1** | **Login Setup** | Credentials & Notifications | Email & password (anonymous) or verified session confirmation (`MEMBER`). |
| **2** | **Business Information** | Company Identity & Industry | Company name, business entity type, industry verticals, company logo. |
| **3** | **Contact Details** | Primary Contact & Office Address | Contact person first/last name, designation, email, mobile phone, physical address with PIN code auto-fill. |
| **4** | **Campaign & Budget Details** *(Combined)* | Initial Requirement & Spending Plan | **Exactly 1 mandatory campaign.** Combines title, description, audience, location, dates, duration, min/max budget, flexibility, quote counts, and agency preferences. |
| **5** | **Verification & Attachments** | Tax & Identity Verification | GSTIN, PAN, and notices clarifying creative file uploads occur post-registration. |
| **6** | **Review & Submit** | Summary & Agreement | Consolidated review cards for company, contact, campaign & budget, terms acceptance, and submission trigger. |
| **Post** | **Success Screen** | Onboarding Confirmation | 3-stage timeline (*Under Review $\rightarrow$ Goes Live $\rightarrow$ Receive Quotations*) + redirect to `/advertisers/dashboard`. |

---

## 3. Step 4: Combined Campaign & Budget Specification

Step 4 consolidates the entire campaign specification into a single cohesive form with 4 visual sections:

```
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 4: Campaign & Budget Details                                      │
│ Tell us what you want to advertise and your budget preferences.        │
├────────────────────────────────────────────────────────────────────────┤
│ ▼ REQUIREMENT OVERVIEW                                                 │
│   Project Title *               [e.g., Summer 2026 MG Road Blitz     ] │
│   Project Description *         [Detailed brief describing scope...   ] │
│                                                                        │
│ ▼ AUDIENCE & LOCATION                                                  │
│   Target Audience *             [e.g., Tech commuters age 22–40       ] │
│   Target Location *             [e.g., Bengaluru, Mumbai              ] │
│                                                                        │
│ ▼ TIMELINE                                                             │
│   Start Date * [ 2026-08-01 ]   End Date * [ 2026-10-31 ]              │
│   Project Duration *            [ 3 Months                           ▼] │
│                                                                        │
│ ▼ BUDGET RANGE                                                         │
│   Min Budget * [ 50 ] [Thousand ▼]   Max Budget * [ 2 ] [Lakh ▼]       │
│   Flexible Budget? ( ) Yes — open to proposals   (•) No — fixed        │
│                                                                        │
│ ▼ QUOTATIONS & AGENCY PREFERENCES                                      │
│   Quotations Required *  [ (•) 3 Agencies ] [ 5 Agencies ] [ 10+ ]     │
│   Agency Preferences *   [✓ Verified] [✓ Local] [ National ]            │
│                                                                        │
│ [ < Back to Contact Details ]          [ Continue to Verification > ]  │
└────────────────────────────────────────────────────────────────────────┘
```

### Detailed Field Specifications (Step 4)

| Field Label | Form Key | UI Control | Frontend Type | Backend DTO Field | DB Column & Type | Required? | Constraints & Validation |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Project Title** | `f_projectTitle` | Text Input | `string` | `project.title` | `campaign_briefs.title`<br>`VARCHAR(200)` | **Yes** | Max: 200 chars. `@NotBlank`, `@SanitizeText`. (e.g. *Diwali 2026 Billboard Campaign*). |
| **Project Description** | `f_projectDesc` | Textarea (`rows={5}`) | `string` | `project.description` | `campaign_briefs.description`<br>`VARCHAR(2000)` | **Yes** | Max: 2000 chars. `@NotBlank`, `@SanitizeText`. Detailed scope and media preferences. |
| **Target Audience** | `f_targetAudience` | Text Input | `string` | `project.targetAudience` | `campaign_briefs.target_audience`<br>`VARCHAR(500)` | **Yes** | Max: 500 chars. `@NotBlank`. Demographic & target segment. |
| **Target Location** | `f_targetLocation` | Text Input | `string` | `project.targetLocation` | `campaign_briefs.target_location`<br>`VARCHAR(300)` | **Yes** | Max: 300 chars. `@NotBlank`. Cities or areas for display. |
| **Expected Start Date** | `f_startDate` | Date Input (`type="date"`) | `string` (`YYYY-MM-DD`) | `project.startDate` | `campaign_briefs.start_date`<br>`DATE` | **Yes** | `@NotNull`. ISO date format. |
| **Expected End Date** | `f_endDate` | Date Input (`type="date"`) | `string` (`YYYY-MM-DD`) | `project.endDate` | `campaign_briefs.end_date`<br>`DATE` | **Yes** | `@NotNull`. Must be on or after `startDate` (`isValidDateRange()`). |
| **Project Duration** | `f_duration` | Select Dropdown | `string` | `project.duration` | `campaign_briefs.duration`<br>`VARCHAR(50)` | **Yes** | Max: 50 chars. Options: *Less than 1 week, 1–2 weeks, 1 month, 1–3 months, 3–6 months, 6–12 months, Ongoing*. |
| **Min Budget Value** | `f_budgetMinValue` | Number Input (`min="0"`) | `number` | `project.budgetMinValue` | `campaign_briefs.budget_min_value`<br>`NUMERIC(14,2)` | **Yes** | `@NotNull`, $\ge 0$. Scalar value (e.g. 50). |
| **Min Budget Unit** | `f_budgetMinUnit` | Select Dropdown | `string` | `project.budgetMinUnit` | `campaign_briefs.budget_min_unit`<br>`VARCHAR(20)` | Optional | Default: `thousand`. Options: *thousand, lakh, crore*. |
| **Max Budget Value** | `f_budgetMaxValue` | Number Input (`min="0"`) | `number` | `project.budgetMaxValue` | `campaign_briefs.budget_max_value`<br>`NUMERIC(14,2)` | **Yes** | `@NotNull`, $\ge 0$. Scalar value (e.g. 2). |
| **Max Budget Unit** | `f_budgetMaxUnit` | Select Dropdown | `string` | `project.budgetMaxUnit` | `campaign_briefs.budget_max_unit`<br>`VARCHAR(20)` | Optional | Default: `lakh`. Options: *thousand, lakh, crore*. |
| **Flexible Budget?** | `f_flexBudget` | `YesNoToggle` | `boolean` | `project.flexibleBudget` | `campaign_briefs.flexible_budget`<br>`BOOLEAN DEFAULT FALSE` | Optional | Mapped as `d.f_flexBudget === 'yes'`. |
| **Quotations Required** | `f_quoteCount` | `RadioCards` | `string` | `project.quotationsRequired` | `campaign_briefs.quotations_required`<br>`VARCHAR(20)` | **Yes** | Options: *3, 5, 10, 10+*. |
| **Agency Preferences** | `selections.agencyPref` | `TogglePills` | `string[]` | `project.agencyPreferences` | `campaign_brief_agency_prefs.preference`<br>`VARCHAR(80)` | **Yes** | Minimum 1 required. Allowed: *verified, local, national, international, open*. |

#### Validation Logic (`validate(4)`):
- All required fields must be non-empty.
- `f_budgetMinValue` and `f_budgetMaxValue` must be positive numbers.
- `f_endDate >= f_startDate` cross-field check.
- `selections.agencyPref` must have $\ge 1$ item selected.

---

## 4. Full 6-Step Component Specification

### Step 1: Login Setup (`Step1`)
- **Component File:** `frontend/src/pages/AdvertiserRegister/steps.jsx`
- **Fields:**
  - `f_loginEmail`: Mandatory for anonymous users (`@Email`, max 180 chars). Maps to `users.email` (`VARCHAR(180) UNIQUE`).
  - `f_password`: Mandatory for anonymous users (min 8, max 72 chars, uppercase, number, symbol). BCrypt hashed into `users.password` (`VARCHAR(100)`).
  - `f_confirmPassword`: Client-side validation only. Must match `f_password`.
  - `SignedInBanner`: Displayed if user is authenticated via Google or Quick Modal (`MEMBER`), skipping password requirement.

### Step 2: Business Information (`Step2`)
- **Component File:** `frontend/src/pages/AdvertiserRegister/steps.jsx`
- **Fields:**
  - `f_companyName`: Mandatory (`@NotBlank`, max 150 chars). Maps to `advertiser_profiles.company_name`.
  - `f_businessType`: Mandatory select (max 80 chars). Maps to `advertiser_profiles.business_type`. Allowed: *Startup, SME, Corporate, Manufacturer, Retailer, Service Provider, Educational Institution, NGO, Government Organization, Other*.
  - `f_website`: Optional URL (max 255 chars). Maps to `advertiser_profiles.website`.
  - `selections.industries`: Mandatory multi-select (min 1, max 80 chars per item). Maps to `advertiser_industries.industry`.
  - `LogoUpload`: Optional company logo.

### Step 3: Contact Details (`Step3`)
- **Component File:** `frontend/src/pages/AdvertiserRegister/steps.jsx`
- **Fields:**
  - `f_firstName`: Mandatory Contact Person First Name (`@NotBlank`, max 80 chars). Maps to `users.first_name`.
  - `f_lastName`: Optional Contact Person Last Name (max 80 chars). Maps to `users.last_name`.
  - `f_desig`: Mandatory Designation (`@NotBlank`, max 120 chars). Maps to `advertiser_profiles.contact_designation`.
  - `f_email`: Mandatory Contact Email (`@NotBlank`, `@Email`, max 180 chars). Maps to `advertiser_profiles.contact_email`. Has shortcut to copy login email.
  - `f_phone`: Mandatory Mobile Number (10 digits). Maps to `users.phone`.
  - `f_addressLine1`: Mandatory Office Address (`@NotBlank`, max 300 chars). Maps to `addresses.line1`.
  - `f_addressLine2`: Optional Office Address (max 300 chars). Maps to `addresses.line2`.
  - `f_landmark`: Optional Landmark (max 200 chars). Maps to `addresses.landmark`.
  - `f_city`: Mandatory City (`@NotBlank`, max 100 chars). Auto-filled by pincode. Maps to `addresses.city`.
  - `f_state`: Mandatory State (`@NotBlank`, max 100 chars). Auto-filled by pincode. Maps to `addresses.state`.
  - `f_pincode`: Mandatory PIN Code (`^[1-9][0-9]{5}$`). Maps to `addresses.pincode`.

### Step 4: Campaign & Budget Details (`Step4` — Consolidated)
- Combines requirement overview, audience, location, dates, duration, min/max budget, flexibility, quote counts, and agency preferences into one unified form.
- Exactly 1 campaign captured; mandatory for registration.
- All fields follow Section 3.

### Step 5: Verification & Attachments (`Step5`, previously Step 6)
- **Component File:** `frontend/src/pages/AdvertiserRegister/steps.jsx`
- **Fields:**
  - `f_gst`: Optional GSTIN (15 characters). Tested with `^[0-9A-Za-z]{15}$`. Maps to `advertiser_profiles.gst_number`.
  - `f_pan`: Optional PAN (10 characters). Tested with `^[0-9A-Za-z]{10}$`. Maps to `advertiser_profiles.pan_number`.
  - Informational notice: Clarifies that creative media assets and brand collateral can be attached directly to campaign quotes from the dashboard post-registration.

### Step 6: Review & Submit (`Step6`, previously Step 7)
- **Component File:** `frontend/src/pages/AdvertiserRegister/steps.jsx`
- **Sections:**
  - `Login & Business Review`: Shows email, company, business type, industries.
  - `Contact Review`: Shows contact person, phone, email, formatted office address.
  - `Campaign & Budget Review`: Displays a formatted summary card of the campaign (Title, Location, Dates, Duration, Budget Range, Quotations, and Agency Preferences).
  - `Verification Review`: Displays GST number if provided.
  - `f_termsAccept`: Mandatory checkbox agreeing to Terms & Conditions (`@AssertTrue`).
- **Submit Action:** Submits all data to backend in a single atomic transaction.

---

## 5. Backend DTO & Service Mapping

### 5.1 Backend DTO: `AdvertiserRegistrationRequest.java`

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

### 5.2 Backend Service: `AdvertiserRegistrationService.java`

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

### 5.3 Frontend Mapper: `registrationMappers.js`

```javascript
export function mapAdvertiser(d, s) {
  return {
    accountEmail: d.f_loginEmail,
    password: d.f_password,
    companyName: d.f_companyName,
    businessType: d.f_businessType,
    website: trimOrNull(d.f_website),
    gstNumber: trimOrNull(d.f_gst),
    panNumber: trimOrNull(d.f_pan),
    industries: s.industries ?? [],
    firstName: d.f_firstName,
    lastName: trimOrNull(d.f_lastName),
    contactDesignation: d.f_desig,
    contactEmail: d.f_email,
    contactPhone: d.f_phone,
    addressLine1: d.f_addressLine1,
    addressLine2: trimOrNull(d.f_addressLine2),
    landmark: trimOrNull(d.f_landmark),
    city: d.f_city,
    state: d.f_state,
    pincode: d.f_pincode,
    project: {
      title: d.f_projectTitle,
      description: d.f_projectDesc,
      targetAudience: d.f_targetAudience,
      targetLocation: d.f_targetLocation,
      startDate: d.f_startDate,
      endDate: d.f_endDate,
      duration: d.f_duration,
      budgetMinValue: toNumber(d.f_budgetMinValue),
      budgetMinUnit: trimOrNull(d.f_budgetMinUnit),
      budgetMaxValue: toNumber(d.f_budgetMaxValue),
      budgetMaxUnit: trimOrNull(d.f_budgetMaxUnit),
      flexibleBudget: d.f_flexBudget === 'yes',
      quotationsRequired: d.f_quoteCount,
      agencyPreferences: s.agencyPref ?? [],
    },
    acceptedTerms: !!d.f_termsAccept,
  };
}
```

---

## 6. Multi-Campaign Lifecycle: Handled Post-Registration in Dashboard

Since only 1 campaign is captured during onboarding, creating additional campaigns is handled inside the authenticated dashboard:

1. **Dashboard Route:** `/advertisers/dashboard`
2. **Action Trigger:** Click `+ New Campaign` button on:
   - Top right of `Overview` page
   - Header of `My Campaigns` page (`/advertisers/dashboard?tab=campaigns`)
3. **Modal / Form View:** Opens a dedicated "Create Campaign Brief" dialog or page containing the same 12 fields from Step 4.
4. **Endpoint:** `POST /api/advertiser/campaigns` (authenticated, role `ADVERTISER`).
5. **Result:** Creates an additional `campaign_briefs` record linked to the user's ID without re-entering company or contact details.

---

## 7. Summary of Changes

1. **Wizard Stepper Length:** Reduced from 7 steps to **6 steps**.
2. **Consolidated Step 4:** Requirement Overview + Audience + Dates + Duration + Budget + Quotations + Agency Preferences in a single step.
3. **Strictly 1 Mandatory Campaign:** Registration focuses on one initial requirement; no "add more campaign" clutter during onboarding.
4. **Additional Campaigns:** Managed post-registration via the Dashboard's `+ New Campaign` feature.
5. **Backend Cleanliness:** DTO and Service maintain the clean, single `project` payload pattern (`@NotNull @Valid CampaignBriefRequest project`).
