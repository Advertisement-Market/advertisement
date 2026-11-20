# Advertiser Registration Flow — Detailed Specification & Component Breakdown

> **Project:** The AdBasket  
> **Module:** Advertiser (Brand / Business Onboarding)  
> **Branch:** `amjangde/advertiser-module-architecture`  
> **Document Status:** Approved Architecture & Field Specification (Consolidated 6-Step Flow)  
> **Target Files:**
> - Frontend: `frontend/src/pages/AdvertiserRegister/AdvertiserRegister.jsx`, `steps.jsx`, `frontend/src/features/auth/registrationMappers.js`
> - Backend: `AdvertiserRegistrationRequest.java`, `CampaignBriefRequest.java`, `AdvertiserProfile.java`, `CampaignBrief.java`, `Address.java`
> - Database: `users`, `advertiser_profiles`, `advertiser_industries`, `campaign_briefs`, `campaign_brief_agency_prefs`, `addresses`

---

## 1. Executive Summary & Flow Architecture

The Advertiser Onboarding flow allows brand marketers, business owners, and campaign managers to register on The AdBasket marketplace. 

### 1.1 Consolidated 6-Step Stepper Architecture

Following architectural optimization, **Project Details (previously Step 4)** and **Budget & Quotations (previously Step 5)** are now **combined into a single unified step: Step 4 ("Campaign & Budget Details")**. 

This reduces the wizard from 7 steps to **6 steps**, eliminating context fragmentation and allowing advertisers to define a complete campaign (brief + budget + agency matching) in one unified card. Furthermore, Step 4 supports **multi-campaign creation** via an `+ Add Another Campaign` button, keeping the first one as **Primary**.

```mermaid
flowchart TD
    Start([User arrives at /advertisers/register]) --> AuthCheck{Is User Signed In?}
    
    AuthCheck -- No (Anonymous) --> Step1Anon[Step 1: Login Setup<br/>f_loginEmail + f_password required]
    AuthCheck -- Yes (MEMBER) --> Step1Auth[Step 1: Login Setup<br/>Prefilled email, optional password]
    
    Step1Anon --> Step2[Step 2: Business Information<br/>Company, Type, Industry, Logo]
    Step1Auth --> Step2
    
    Step2 --> Step3[Step 3: Contact Details<br/>Contact Person, Email, Mobile, Office Address]
    
    Step3 --> Step4[Step 4: Campaign & Budget Details<br/>Campaign 1: Primary Brief + Budget + Agency Prefs<br/>+ Add More Campaign button for Campaign 2..N]
    
    Step4 --> Step5[Step 5: Verification & Attachments<br/>GST, PAN, Verification Docs, Creative Files]
    Step5 --> Step6[Step 6: Review & Submit<br/>Review Blocks for All Steps + Campaigns, Terms & Conditions]
    
    Step6 --> Submit[Submit POST /api/auth/register/advertiser]
    Submit --> Success[Success Screen<br/>Timeline: Under Review -> Goes Live -> Receive Quotations]
    Success --> Dashboard[/advertisers/dashboard]
```

---

## 2. Updated 6-Step Stepper Inventory

| Step # | Step Title | Subtitle / Tagline | Key Responsibility |
| :---: | :--- | :--- | :--- |
| **1** | **Login Setup** | Credentials & Notifications | Email & password (anonymous) or verified session confirmation (`MEMBER`). |
| **2** | **Business Information** | Company Identity & Industry | Company name, business entity type, industry verticals, company logo. |
| **3** | **Contact Details** | Primary Contact & Office Address | Contact person first/last name, designation, email, mobile phone, physical address with PIN code auto-fill. |
| **4** | **Campaign & Budget Details** *(Combined)* | Requirement Brief & Spending Plan | **Campaign 1 (Primary)** + optional **Campaigns 2..N** via `+ Add More Campaign`. Each holds title, description, audience, location, dates, duration, min/max budget, flexibility, quote counts, and agency preferences. |
| **5** | **Verification & Attachments** | Tax & Identity Verification | GSTIN, PAN, optional registration certificates, and creative media notes. |
| **6** | **Review & Submit** | Summary & Agreement | Consolidated review cards for company, contact, all campaigns, terms acceptance, and submission trigger. |
| **Post** | **Success Screen** | Onboarding Confirmation | 3-stage timeline (*Under Review $\rightarrow$ Goes Live $\rightarrow$ Receive Quotations*) + redirect to `/advertisers/dashboard`. |

---

## 3. Step 4: Combined Multi-Campaign & Budget Specification

### 3.1 UI & Interaction Pattern

Step 4 presents **Campaign 1** by default with a distinct `Primary Campaign` badge.

```
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 4: Campaign & Budget Details                                      │
│ Tell us what you want to advertise and your budget preferences.        │
├────────────────────────────────────────────────────────────────────────┤
│ ┌─ CAMPAIGN 1 [PRIMARY CAMPAIGN] ────────────────────────────────────┐ │
│ │                                                                    │ │
│ │ ▼ REQUIREMENT OVERVIEW                                             │ │
│ │   Project Title *               [e.g., Summer 2026 MG Road Blitz ] │ │
│ │   Project Description *         [Detailed brief describing scope...] │ │
│ │                                                                    │ │
│ │ ▼ AUDIENCE & LOCATION                                              │ │
│ │   Target Audience *             [e.g., Tech commuters age 22–40   ] │ │
│ │   Target Location *             [e.g., Bengaluru, Mumbai          ] │ │
│ │                                                                    │ │
│ │ ▼ TIMELINE                                                         │ │
│ │   Start Date * [ 2026-08-01 ]   End Date * [ 2026-10-31 ]          │ │
│ │   Project Duration *            [ 3 Months                       ▼] │ │
│ │                                                                    │ │
│ │ ▼ BUDGET RANGE                                                     │ │
│ │   Min Budget * [ 50 ] [Thousand ▼]   Max Budget * [ 2 ] [Lakh ▼]   │ │
│ │   Flexible Budget? ( ) Yes — open to proposals   (•) No — fixed    │ │
│ │                                                                    │ │
│ │ ▼ QUOTATIONS & AGENCY PREFERENCES                                  │ │
│ │   Quotations Required *  [ (•) 3 Agencies ] [ 5 Agencies ] [ 10+ ] │ │
│ │   Agency Preferences *   [✓ Verified] [✓ Local] [ National ]        │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│ ┌─ + Add More Campaign (Optional) ───────────────────────────────────┐ │
│ │ Click to add a 2nd requirement (e.g. Pune Highway Launch)           │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│ [ < Back to Contact Details ]          [ Continue to Verification > ]  │
└────────────────────────────────────────────────────────────────────────┘
```

#### Behavior & Rules:
1. **Primary Campaign (Campaign 1):**
   - Cannot be deleted or removed.
   - All required fields must be validated before moving to Step 5.
2. **Secondary Campaigns (Campaign 2..N):**
   - Added dynamically when clicking `+ Add More Campaign`.
   - Renders as a collapsible card with a header: `Campaign 2` and a `Remove [×]` button.
   - If an advertiser adds Campaign 2 but leaves it blank, the validator will prompt them to either complete it or click `Remove`.
3. **Form State Structure:**
   Managed as an array of campaign objects in `RegisterContext`:
   ```javascript
   campaigns: [
     {
       id: 'c1',
       isPrimary: true,
       title: '',
       description: '',
       targetAudience: '',
       targetLocation: '',
       startDate: '',
       endDate: '',
       duration: '',
       budgetMinValue: '',
       budgetMinUnit: 'thousand',
       budgetMaxValue: '',
       budgetMaxUnit: 'lakh',
       flexibleBudget: false,
       quotationsRequired: '3',
       agencyPreferences: ['verified'],
     }
   ]
   ```

---

### 3.2 Detailed Field Specifications (Per Campaign)

Each campaign in Step 4 contains the following 12 fields:

| Field Label | Object Key | UI Control | Frontend Type | Backend DTO Field | DB Column & Type | Required? | Constraints & Validation |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Project Title** | `title` | Text Input | `string` | `CampaignBriefRequest.title` | `campaign_briefs.title`<br>`VARCHAR(200)` | **Yes** | Max: 200 chars. `@NotBlank`, `@SanitizeText`. |
| **Project Description** | `description` | Textarea (`rows={4}`) | `string` | `CampaignBriefRequest.description` | `campaign_briefs.description`<br>`VARCHAR(2000)` | **Yes** | Max: 2000 chars. `@NotBlank`, `@SanitizeText`. |
| **Target Audience** | `targetAudience` | Text Input | `string` | `CampaignBriefRequest.targetAudience` | `campaign_briefs.target_audience`<br>`VARCHAR(500)` | **Yes** | Max: 500 chars. `@NotBlank`. |
| **Target Location** | `targetLocation` | Text Input | `string` | `CampaignBriefRequest.targetLocation` | `campaign_briefs.target_location`<br>`VARCHAR(300)` | **Yes** | Max: 300 chars. `@NotBlank`. |
| **Expected Start Date** | `startDate` | Date Input | `string` (`YYYY-MM-DD`) | `CampaignBriefRequest.startDate` | `campaign_briefs.start_date`<br>`DATE` | **Yes** | `@NotNull`. ISO date format. |
| **Expected End Date** | `endDate` | Date Input | `string` (`YYYY-MM-DD`) | `CampaignBriefRequest.endDate` | `campaign_briefs.end_date`<br>`DATE` | **Yes** | `@NotNull`. Must be on or after `startDate`. |
| **Project Duration** | `duration` | Select Dropdown | `string` | `CampaignBriefRequest.duration` | `campaign_briefs.duration`<br>`VARCHAR(50)` | **Yes** | Max: 50 chars. Options: *Less than 1 week, 1–2 weeks, 1 month, 1–3 months, 3–6 months, 6–12 months, Ongoing*. |
| **Min Budget Value** | `budgetMinValue` | Number Input | `number` | `CampaignBriefRequest.budgetMinValue` | `campaign_briefs.budget_min_value`<br>`NUMERIC(14,2)` | **Yes** | `@NotNull`, $\ge 0$. Scalar value (e.g. 50). |
| **Min Budget Unit** | `budgetMinUnit` | Select Dropdown | `string` | `CampaignBriefRequest.budgetMinUnit` | `campaign_briefs.budget_min_unit`<br>`VARCHAR(20)` | Optional | Default: `thousand`. Options: *thousand, lakh, crore*. |
| **Max Budget Value** | `budgetMaxValue` | Number Input | `number` | `CampaignBriefRequest.budgetMaxValue` | `campaign_briefs.budget_max_value`<br>`NUMERIC(14,2)` | **Yes** | `@NotNull`, $\ge 0$. Scalar value (e.g. 2). |
| **Max Budget Unit** | `budgetMaxUnit` | Select Dropdown | `string` | `CampaignBriefRequest.budgetMaxUnit` | `campaign_briefs.budget_max_unit`<br>`VARCHAR(20)` | Optional | Default: `lakh`. Options: *thousand, lakh, crore*. |
| **Flexible Budget?** | `flexibleBudget` | `YesNoToggle` | `boolean` | `CampaignBriefRequest.flexibleBudget` | `campaign_briefs.flexible_budget`<br>`BOOLEAN DEFAULT FALSE` | Optional | Boolean flag. |
| **Quotations Required** | `quotationsRequired` | `RadioCards` | `string` | `CampaignBriefRequest.quotationsRequired` | `campaign_briefs.quotations_required`<br>`VARCHAR(20)` | **Yes** | Options: *3, 5, 10, 10+*. |
| **Agency Preferences** | `agencyPreferences` | `TogglePills` | `string[]` | `CampaignBriefRequest.agencyPreferences` | `campaign_brief_agency_prefs.preference`<br>`VARCHAR(80)` | **Yes** | Min 1 selection. Allowed: *verified, local, national, international, open*. |

---

## 4. Full 6-Step Component Specification

### Step 1: Login Setup (`Step1`)
- **Component File:** `frontend/src/pages/AdvertiserRegister/steps.jsx`
- **Fields:**
  - `f_loginEmail`: Mandatory for anonymous users (`@Email`, max 180 chars). Maps to `users.email`.
  - `f_password`: Mandatory for anonymous users (min 8, max 72 chars, upper/lower/number/symbol). BCrypt hashed into `users.password`.
  - `f_confirmPassword`: Client-side validation only. Must match `f_password`.
  - `SignedInBanner`: Displayed if user is authenticated via Google or Quick Modal (`MEMBER`), skipping password requirement.

### Step 2: Business Information (`Step2`)
- **Component File:** `frontend/src/pages/AdvertiserRegister/steps.jsx`
- **Fields:**
  - `f_companyName`: Mandatory (`@NotBlank`, max 150 chars). Maps to `advertiser_profiles.company_name`.
  - `f_businessType`: Mandatory select (max 80 chars). Maps to `advertiser_profiles.business_type`.
  - `f_website`: Optional URL (max 255 chars). Maps to `advertiser_profiles.website`.
  - `selections.industries`: Mandatory multi-select (min 1, max 80 chars per item). Maps to `advertiser_industries.industry`.
  - `LogoUpload`: Optional company logo.

### Step 3: Contact Details (`Step3`)
- **Component File:** `frontend/src/pages/AdvertiserRegister/steps.jsx`
- **Fields:**
  - `f_firstName`: Mandatory Contact Person First Name (`@NotBlank`, max 80 chars). Maps to `users.first_name`.
  - `f_lastName`: Optional Contact Person Last Name (max 80 chars). Maps to `users.last_name`.
  - `f_desig`: Mandatory Designation (`@NotBlank`, max 120 chars). Maps to `advertiser_profiles.contact_designation`.
  - `f_email`: Mandatory Contact Email (`@NotBlank`, `@Email`, max 180 chars). Maps to `advertiser_profiles.contact_email`.
  - `f_phone`: Mandatory Mobile Number (10 digits). Maps to `users.phone`.
  - `f_addressLine1`: Mandatory Office Address (`@NotBlank`, max 300 chars). Maps to `addresses.line1`.
  - `f_addressLine2`: Optional Office Address (max 300 chars). Maps to `addresses.line2`.
  - `f_landmark`: Optional Landmark (max 200 chars). Maps to `addresses.landmark`.
  - `f_city`: Mandatory City (`@NotBlank`, max 100 chars). Auto-filled by pincode. Maps to `addresses.city`.
  - `f_state`: Mandatory State (`@NotBlank`, max 100 chars). Auto-filled by pincode. Maps to `addresses.state`.
  - `f_pincode`: Mandatory PIN Code (`^[1-9][0-9]{5}$`). Maps to `addresses.pincode`.

### Step 4: Campaign & Budget Details (`Step4` — Consolidated)
- Combines Requirement Overview + Audience + Dates + Duration + Min/Max Budget + Flexibility + Quotation Count + Agency Preferences.
- Supports **Campaign 1 (Primary)** and unlimited additional campaigns via `+ Add More Campaign`.
- All fields follow Section 3.2.

### Step 5: Verification & Attachments (`Step5`, previously Step 6)
- **Component File:** `frontend/src/pages/AdvertiserRegister/steps.jsx`
- **Fields:**
  - `f_gst`: Optional GSTIN (15 characters). Tested with `^[0-9A-Za-z]{15}$`. Maps to `advertiser_profiles.gst_number`.
  - `f_pan`: Optional PAN (10 characters). Tested with `^[0-9A-Za-z]{10}$`. Maps to `advertiser_profiles.pan_number`.
  - Creative media & verification notice: Clarifies that creative assets and proof documents can be uploaded per quote from the dashboard.

### Step 6: Review & Submit (`Step6`, previously Step 7)
- **Component File:** `frontend/src/pages/AdvertiserRegister/steps.jsx`
- **Sections:**
  - `Login & Business Review`: Shows email, company, business type, industries.
  - `Contact Review`: Shows contact person, phone, email, formatted office address.
  - `Campaigns Review`: Displays summary cards for **every created campaign** (Primary Campaign + Secondary Campaigns) showing Title, Location, Dates, Duration, Budget Range, and Preferences.
  - `Verification Review`: Displays GST number if provided.
  - `f_termsAccept`: Mandatory checkbox agreeing to Terms & Conditions (`@AssertTrue`).
- **Submit Action:** Submits all data to backend in a single atomic transaction.

---

## 5. Backend DTO & Service Changes

### 5.1 Updated `AdvertiserRegistrationRequest.java`

Notice the update from single `project` to `List<CampaignBriefRequest> projects`:

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
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AdvertiserRegistrationRequest(
        // Login credentials
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

        // Multi-Campaign List (at least one campaign required)
        @NotEmpty(message = "At least one campaign requirement is required.")
        List<@Valid CampaignBriefRequest> projects,

        @AssertTrue(message = "You must accept the Terms & Conditions.")
        boolean acceptedTerms
) {}
```

---

### 5.2 Updated `AdvertiserRegistrationService.java`

The service iterates over `request.projects()` to persist all briefs atomically:

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

    // Save all campaigns in atomic transaction
    for (CampaignBriefRequest briefReq : request.projects()) {
        campaignBriefRepository.save(toBrief(briefReq, user));
    }

    log.info("Advertiser registration complete for user id={}, campaigns count={}", 
            user.getId(), request.projects().size());
    return authService.issueTokensFor(user);
}
```

---

## 6. Frontend Mapping (`registrationMappers.js`)

`mapAdvertiser(d, s)` maps the multi-campaign array:

```javascript
export function mapAdvertiser(d, s) {
  // Support both legacy single campaign state and multi-campaign array
  const rawCampaigns = d.campaigns && d.campaigns.length > 0 
    ? d.campaigns 
    : [
        {
          title: d.f_projectTitle,
          description: d.f_projectDesc,
          targetAudience: d.f_targetAudience,
          targetLocation: d.f_targetLocation,
          startDate: d.f_startDate,
          endDate: d.f_endDate,
          duration: d.f_duration,
          budgetMinValue: d.f_budgetMinValue,
          budgetMinUnit: d.f_budgetMinUnit,
          budgetMaxValue: d.f_budgetMaxValue,
          budgetMaxUnit: d.f_budgetMaxUnit,
          flexibleBudget: d.f_flexBudget === 'yes',
          quotationsRequired: d.f_quoteCount,
          agencyPreferences: s.agencyPref ?? [],
        }
      ];

  const projects = rawCampaigns.map((c) => ({
    title: c.title?.trim(),
    description: c.description?.trim(),
    targetAudience: c.targetAudience?.trim(),
    targetLocation: c.targetLocation?.trim(),
    startDate: c.startDate,
    endDate: c.endDate,
    duration: c.duration,
    budgetMinValue: toNumber(c.budgetMinValue),
    budgetMinUnit: trimOrNull(c.budgetMinUnit),
    budgetMaxValue: toNumber(c.budgetMaxValue),
    budgetMaxUnit: trimOrNull(c.budgetMaxUnit),
    flexibleBudget: !!c.flexibleBudget,
    quotationsRequired: c.quotationsRequired,
    agencyPreferences: c.agencyPreferences ?? [],
  }));

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
    projects,
    acceptedTerms: !!d.f_termsAccept,
  };
}
```

---

## 7. Summary of Changes & Next Steps

1. **Wizard Stepper Length:** Reduced from 7 steps to **6 steps**.
2. **Step 4 Consolidates:** Campaign brief (title, desc, audience, location, timeline) + Budget range + Quotation count + Agency preferences into a unified view.
3. **Multi-Campaign Support:** First campaign marked **Primary**; `+ Add More Campaign` allows adding secondary campaigns on demand.
4. **DTO & Backend:** Updated `AdvertiserRegistrationRequest` to accept `List<CampaignBriefRequest> projects`, saving all campaigns atomically in `AdvertiserRegistrationService`.
5. **No DB Migration Needed for Multi-Campaign:** Database already supports `1 User : N CampaignBriefs` without unique constraints on `campaign_briefs.user_id`.
