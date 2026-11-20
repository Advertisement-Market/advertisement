# Architecture Technical Document: Advertiser Module Architecture & Registration Specification

- **PR Link / Ticket:** [PR #59](https://github.com/Advertisement-Market/advertisement/pull/59)
- **Author:** @amjangde
- **Date:** 2026-11-20
- **Module / Package:** `docs/architecture/advertiser-module/`, `frontend/src/pages/AdvertiserRegister`, `backend/src/main/java/com/theadbasket/backend/advertiser`, `backend/src/main/java/com/theadbasket/backend/registration`

---

## 1. Overview & Business Requirements

### 1.1 Goal
Provide an authoritative architecture blueprint and comprehensive field specification for the **Advertiser Module** of The AdBasket, with immediate focus on streamlining the **Advertiser Registration & Onboarding Flow**.

### 1.2 User Impact
- **Advertisers (Brands & Media Buyers):** Experience a guided, standard 7-step onboarding wizard maintaining clear separation between campaign creative scope and budget parameters.
- **Platform Integrity:** Aligns the advertiser data pipeline with normalized database entities (`addresses`, `users`, `advertiser_profiles`, `campaign_briefs`), ensuring robust unique constraints, transaction isolation, and audit readiness.

### 1.3 Key Functional Decisions
1. **Standard 7-Step Stepper Flow:** Retains the dedicated separation between campaign scoping (**Step 4: Project Details**) and financial/quotation requirements (**Step 5: Budget & Quotations**).
2. **Single Mandatory Campaign at Registration:** Registration strictly captures **one initial campaign requirement** (mandatory). Multi-campaign creation is deferred to the authenticated dashboard (`/advertisers/dashboard` $\rightarrow$ `+ New Campaign`) to prevent onboarding fatigue.
3. **Normalized Schema Alignment:** Grounded in database migrations `V1__init.sql` through `V10__create_billboard_availability_blocks.sql`, especially `V3__normalize_schema.sql` (standalone `addresses` table, standardized `created_ts`/`updated_ts`, `end_date`, and unique GST constraint).

---

## 2. Technical Architecture & Component Flow

### 2.1 Request Lifecycle & Service Interactions

```mermaid
sequenceDiagram
    autonumber
    actor Advertiser as Brand Marketer / User
    participant UI as React Register Wizard (RegisterShell)
    participant Ctrl as RegistrationController
    participant Svc as AdvertiserRegistrationService
    participant Reg as AccountRegistrar
    database DB as PostgreSQL
    participant Auth as AuthService & CookieService

    Advertiser->>UI: Fills 7-Step Registration Form & Accepts Terms
    UI->>Ctrl: POST /api/auth/register/advertiser (JSON Payload)
    activate Ctrl
    
    Ctrl->>Svc: register(request, currentUserId)
    activate Svc
    
    Svc->>Reg: attachOrCreate(currentUserId, firstName, lastName, email, password, phone, ADVERTISER)
    activate Reg
    alt Anonymous User
        Reg->>DB: INSERT INTO users (role='ADVERTISER', auth_provider='LOCAL', ...)
    else Signed-In MEMBER
        Reg->>DB: UPDATE users SET role='ADVERTISER' WHERE id = currentUserId
    end
    Reg-->>Svc: User entity
    deactivate Reg
    
    Svc->>DB: INSERT INTO addresses (line1, line2, landmark, city, state, pincode)
    Svc->>DB: INSERT INTO advertiser_profiles (user_id, address_id, company_name, ...)
    Svc->>DB: INSERT INTO advertiser_industries (profile_id, industry)
    Svc->>DB: INSERT INTO campaign_briefs (user_id, title, description, start_date, end_date, ...)
    Svc->>DB: INSERT INTO campaign_brief_agency_prefs (brief_id, preference)
    
    Svc->>Auth: issueTokensFor(user)
    Auth-->>Svc: AuthResponse (AccessToken, RefreshToken, UserDto)
    Svc-->>Ctrl: AuthResponse
    deactivate Svc
    
    Ctrl->>Auth: createRefreshTokenCookie(refreshToken)
    Ctrl-->>UI: HTTP 201 Created + Set-Cookie (HttpOnly) + AuthResponse
    deactivate Ctrl
    
    UI-->>Advertiser: Displays SuccessScreen -> Redirects to /advertisers/dashboard
```

### 2.2 Advertiser Authentication & Login Architecture

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

## 3. Stepper Inventory & Field Specifications

### 3.1 Stepper Structure (7 Steps)

| Step | Component | Title | Key Data Captured |
| :---: | :--- | :--- | :--- |
| **1** | `Step1` | **Login Setup** | `f_loginEmail`, `f_password` (anonymous) or verified session confirmation (`MEMBER`). |
| **2** | `Step2` | **Business Information** | `f_companyName`, `f_businessType`, `f_website`, `selections.industries`, `LogoUpload`. |
| **3** | `Step3` | **Contact Details** | `f_firstName`, `f_lastName`, `f_desig`, `f_email`, `f_phone`, `f_addressLine1`, `f_addressLine2`, `f_landmark`, `f_city`, `f_state`, `f_pincode`. |
| **4** | `Step4` | **Project Details** | `f_projectTitle`, `f_projectDesc`, `f_targetAudience`, `f_targetLocation`, `f_startDate`, `f_endDate`, `f_duration`. |
| **5** | `Step5` | **Budget & Quotations** | `f_budgetMinValue`, `f_budgetMinUnit`, `f_budgetMaxValue`, `f_budgetMaxUnit`, `f_flexBudget`, `f_quoteCount`, `selections.agencyPref`. |
| **6** | `Step6` | **Verification & Attachments** | `f_gst`, `f_pan`, and notice clarifying creative asset uploads occur post-registration per quote. |
| **7** | `Step7` | **Review & Submit** | Consolidated review blocks, `f_termsAccept` (`@AssertTrue`), atomic submission. |
| **Post** | `SuccessScreen` | **Success Confirmation** | 3-stage progress timeline + CTA redirect to `/advertisers/dashboard`. |

---

## 4. Database Alignment & Entity Mapping

The registration transaction writes across 6 tables normalized in `V3__normalize_schema.sql`:

1. **`users`:** Identity, BCrypt password hash, role (`ADVERTISER`), provider (`LOCAL` / `GOOGLE`).
2. **`addresses`:** Normalized standalone table (`line1`, `line2`, `landmark`, `city`, `state`, `pincode`, `created_ts`, `updated_ts`).
3. **`advertiser_profiles`:** Linked to `users.id` (1:1, unique) and `addresses.id` (FK `address_id`, indexed). Holds `company_name`, `business_type`, `website`, `gst_number` (unique constraint `uq_advertiser_profiles_gst`), `pan_number`, `contact_designation`, `contact_email`.
4. **`advertiser_industries`:** Element collection table linked to `advertiser_profiles.id` (`industry VARCHAR(80)`).
5. **`campaign_briefs`:** Initial campaign brief linked to `users.id` (`start_date`, `end_date`, `duration`, `budget_min_value`, `budget_max_value`, `flexible_budget`, `quotations_required`).
6. **`campaign_brief_agency_prefs`:** Element collection table linked to `campaign_briefs.id` (`preference VARCHAR(80)`).

---

## 5. Architectural Findings & Action Plan

1. **Duplicate GST Pre-Check:** Pre-check `existsByGstNumber()` in `AdvertiserRegistrationService` to emit an HTTP 409 `ConflictException` instead of letting PostgreSQL throw an unhandled 500 `DataIntegrityViolationException`.
2. **Onboarding Welcome Notification:** Inject `NotificationService` into `AdvertiserRegistrationService` and generate a welcome notification (aligning with `OwnerRegistrationService` and `V5__create_notifications.sql`).
3. **Contact Name Split:** Split `Contact Person Name` (`f_firstName`) in Step 3 into `First Name` (required) and `Last Name` (optional) to populate `users.first_name` and `users.last_name` accurately.
4. **Campaign Lifecycle Tracking:** Add `status VARCHAR(20) NOT NULL DEFAULT 'PENDING_REVIEW'` and `updated_ts` to `campaign_briefs` via a migration.
5. **Budget Query Normalization:** Compute and store normalized absolute INR amounts (`budget_min_amount NUMERIC(14,2)`) during ingestion for SQL range queries.

---

## 6. Documentation Files in this PR

- [`docs/architecture/advertiser-module/ADVERTISER_MODULE_ANALYSIS.md`](../architecture/advertiser-module/ADVERTISER_MODULE_ANALYSIS.md): Comprehensive module overview, page/code inventories, ER diagram, and Phase 1 scope.
- [`docs/architecture/advertiser-module/ADVERTISER_REGISTRATION_FLOW_SPEC.md`](../architecture/advertiser-module/ADVERTISER_REGISTRATION_FLOW_SPEC.md): Complete field-by-field specification, DTO/Entity mappings, sequence diagram, and action plan.
