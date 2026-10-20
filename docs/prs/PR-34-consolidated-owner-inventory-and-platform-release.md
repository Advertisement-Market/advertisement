# Consolidated Release Technical Document: Billboard Owner Inventory, Listing Wizard, LOVs, and CI Quality Gates

- **PR Link / Ticket:** [PR #34](https://github.com/Advertisement-Market/advertisement/pull/34)
- **Author:** @vedafactor
- **Date:** 2026-10-16
- **Module / Packages:** `backend/src/main/java/com/theadbasket/backend/owner`, `backend/src/main/java/com/theadbasket/backend/lov`, `frontend/src/pages/OwnerDashboard`, `frontend/src/pages/NewBillboardListing`, `frontend/src/features/owner`, `.github/workflows/ci.yml`

---

## 1. Overview & Release Consolidation Scope

Pull Request #34 is a **compiled release integration** merging the cumulative work of **PR #28 through PR #33** from `release/pending-review` into `master`. It establishes a unified, database-backed inventory management foundation for billboard owners, standardized lists-of-values (LOVs), a full-page listing wizard, controlled booking duration inputs, and automated CI test coverage gates.

### Consolidated PR Composition Matrix

| PR # | Branch / Module | Key Capabilities Delivered |
| :--- | :--- | :--- |
| **[PR #28](PR-28-populating-owner-my-listings.md)** | `feat/populating-my-listings` | Live database-backed inventory CRUD (`/api/owner/listings`), tenant isolation, dynamic dashboard counters/badges, edit/delete modals, and review alignments (controlled inputs & removed redundant `throw err`). |
| **[PR #29](PR-29-config-driven-billboard-lovs.md)** | `Ashutosh/billboard-config-driven` | Config-driven billboard LOVs for `type`, `trafficType`, and `audienceType` backed by `messages.properties` with fallback support for `OTHER`. |
| **[PR #30](PR-30-static-lov-facing-direction.md)** | `Ashutosh/facing-direction-lov` | Static `FacingDirection` enum supporting 8 compass points, degree angles, and public LOV endpoint (`/api/lov/facing-directions`). |
| **[PR #31](PR-31-automated-test-coverage-ci.md)** | `amjangde/test-coverage-ci` | Automated test coverage gating in GitHub Actions CI using JaCoCo (0.8.14) for Java 25 backend and Vitest (v8) for React frontend with artifact uploads. |
| **[PR #32](PR-32-full-page-owner-billboard-listing-wizard.md)** | `feat/owner-new-billboard-wizard` | Full-page 3-step listing creation wizard (`/owners/listings/new`), rate cards, availability calendar, media uploads, and in-app event notifications. |
| **[PR #33](PR-33-min-booking-duration-split.md)** | `Ashutosh/min-booking-duration` | Minimum booking duration model split into `minBookingValue` (Integer), `minBookingUnit` (Enum: `DAYS`, `WEEKS`, `MONTHS`), and normalized `minBookingDays`. |

---

## 2. Technical Architecture & Unified Request Flow

```mermaid
sequenceDiagram
    autonumber
    actor Owner as Authenticated Billboard Owner
    participant Dash as OwnerDashboard (/owners/dashboard)
    participant Wiz as NewBillboardListing (/owners/listings/new)
    participant API as ownerListingApi (Axios Client)
    participant Sec as JwtAuthenticationFilter (SecurityConfig)
    participant Ctrl as OwnerListingController (/api/owner/listings)
    participant Svc as OwnerListingService
    participant Lov as LovService
    participant Notif as NotificationService
    participant Repo as BillboardListingRepository
    database DB as PostgreSQL / H2 Database

    %% LOV Discovery Flow
    Note over Wiz,Lov: Client loads dropdown catalogues
    Wiz->>API: GET /api/lov/booking-duration-units
    API->>Lov: Resolve enum codes & display labels
    Lov-->>Wiz: [{DAYS, "Days"}, {WEEKS, "Weeks"}, {MONTHS, "Months"}]

    %% Creation Flow
    Note over Wiz,Repo: Full-Page Wizard Creation (PR-32 + PR-33)
    Owner->>Wiz: Completes 3-step wizard with controlled duration
    Wiz->>API: createListing(payload: value=15, unit=DAYS)
    API->>Sec: POST /api/owner/listings (Bearer JWT)
    Sec->>Ctrl: AuthenticatedUser (id=42, role=OWNER)
    Ctrl->>Svc: createListing(userId=42, request)
    Svc->>Lov: parseBookingDurationUnit("DAYS")
    Svc->>Svc: Calculate normalized days: 15 * 1 = 15
    Svc->>Repo: save(BillboardListing + Address)
    Repo->>DB: INSERT addresses, billboard_listings
    Svc->>Notif: createNotification(category=ONBOARDING, tone=TEAL)
    Notif->>DB: INSERT notifications
    Ctrl-->>API: 201 Created (BillboardListingDto)
    API-->>Wiz: Display success screen with dashboard redirect

    %% Dashboard List & Edit Flow
    Note over Dash,Repo: Live Dashboard Management (PR-28)
    Owner->>Dash: Loads My Listings
    Dash->>API: getListings()
    API->>Ctrl: GET /api/owner/listings
    Ctrl->>Svc: getOwnerListings(userId=42)
    Svc->>Repo: findByUserIdOrderByCreatedAtDesc(42)
    Repo-->>Ctrl: List of listings
    Ctrl-->>Dash: 200 OK (List<BillboardListingDto>)

    %% Deletion Flow
    Note over Dash,Repo: Listing Deletion with Toast Feedback
    Owner->>Dash: Confirms Delete Modal
    Dash->>API: deleteListing(id=10)
    API->>Ctrl: DELETE /api/owner/listings/10
    Ctrl->>Svc: deleteListing(id=10, userId=42)
    Svc->>Repo: delete(listing) [Cascade Address deletion]
    Repo->>DB: DELETE FROM billboard_listings WHERE id=10
    Ctrl-->>Dash: 204 No Content
    Dash->>Dash: showToast("Billboard listing deleted successfully.")
```

---

## 3. Database Schema & Data Models

The consolidated persistence model utilizes normalized tables in PostgreSQL / H2 (`billboard_listings` and `addresses`):

### `BillboardListing` Entity Attributes
- **Primary Key:** `id` (`BIGINT GENERATED BY DEFAULT AS IDENTITY`)
- **Tenant Scope:** `user_id` (`BIGINT NOT NULL`)
- **Address Association:** `@OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)` with `Address`
- **LOV Enum Fields:**
  - `type` (`BillboardType` enum: `STATIC_HOARDING`, `LED_DIGITAL`, `UNIPOLE`, `GANTRY`, `BUS_SHELTER`, `KIOSK`, `DIGITAL_SCREEN`, `OTHER`)
  - `typeOther` (`VARCHAR(120)`)
  - `facing` (`FacingDirection` static enum: `NORTH`, `NORTH_EAST`, `EAST`, `SOUTH_EAST`, `SOUTH`, `SOUTH_WEST`, `WEST`, `NORTH_WEST`)
  - `trafficType` (`TrafficType` enum: `PEDESTRIAN`, `VEHICULAR`, `TRANSIT`, `HIGHWAY`, `MIXED`, `OTHER`)
  - `trafficTypeOther` (`VARCHAR(120)`)
  - `audienceType` (`AudienceType` enum: `COMMUTERS`, `SHOPPERS`, `STUDENTS`, `BUSINESS`, `RESIDENTIAL`, `TOURISTS`, `OTHER`)
  - `audienceTypeOther` (`VARCHAR(120)`)
- **Booking Duration Split:**
  - `minBookingValue` (`Integer`): Duration quantity entered by owner (e.g., `15`, `2`, `1`).
  - `minBookingUnit` (`BookingDurationUnit` enum: `DAYS`, `WEEKS`, `MONTHS`).
  - `minBookingDays` (`Integer`): Precomputed normalized duration in days (`DAYS` * 1, `WEEKS` * 7, `MONTHS` * 30).
- **Pricing & Dimensions:** `startPrice` (`BigDecimal`), `widthFt` (`BigDecimal`), `heightFt` (`BigDecimal`), `groundHeightFt` (`BigDecimal`), `footfall` (`VARCHAR(60)`), `discountNote` (`VARCHAR(500)`).
- **Auditing Timestamp:** `@CreatedDate @Column(name = "created_ts") private Instant createdAt`.

---

## 4. API Specifications & Contracts

### 1. Owner Inventory Endpoints (`/api/owner/listings`)

| Method | Endpoint | Auth / Role | Status Codes | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/owner/listings` | Bearer JWT / `OWNER` | `200 OK`, `401` | Returns all active listings belonging to the authenticated owner. |
| `GET` | `/api/owner/listings/{id}` | Bearer JWT / `OWNER` | `200 OK`, `404` | Returns a single listing scoped strictly to the authenticated owner. |
| `POST` | `/api/owner/listings` | Bearer JWT / `OWNER` | `201 Created`, `400` | Creates a new billboard listing with cascaded address and triggers onboarding notification. |
| `PATCH` | `/api/owner/listings/{id}` | Bearer JWT / `OWNER` | `200 OK`, `400`, `404` | Partially updates non-null fields with pattern validation against empty/whitespace values. |
| `DELETE` | `/api/owner/listings/{id}` | Bearer JWT / `OWNER` | `204 No Content`, `404` | Deletes listing and orphan address; triggers refresh in owner dashboard. |

### 2. Lists-of-Values Endpoints (`/api/lov/*`)

| Method | Endpoint | Auth | Response Payload | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/lov/billboard-types` | Public | `[{code, label}]` | Catalogue of allowed billboard types (config-driven). |
| `GET` | `/api/lov/traffic-types` | Public | `[{code, label}]` | Catalogue of allowed traffic types (config-driven). |
| `GET` | `/api/lov/audience-types` | Public | `[{code, label}]` | Catalogue of allowed audience types (config-driven). |
| `GET` | `/api/lov/facing-directions` | Public | `[{code, label}]` | 8 compass points in clockwise order (static enum). |
| `GET` | `/api/lov/booking-duration-units` | Public | `[{code, label}]` | `DAYS`, `WEEKS`, `MONTHS` with display labels. |

---

## 5. Frontend Components & Controlled Input Architecture

### 1. `OwnerDashboard.jsx` (Inventory View & Lifecycle Modals)
- **Live Inventory Synchronization:** Connects to `ownerListingApi.getListings()` on mount and syncs listings count with sidebar badges.
- **`ListingFormModal` (Edit Listing):**
  - Features two controlled inputs: numeric input for `minBookingValue` and a `<select>` for `minBookingUnit` (`DAYS`, `WEEKS`, `MONTHS`), eliminating parsing heuristics.
  - Normalizes initial unit state via `resolveInitialUnit()`.
- **`DeleteListingModal` (Delete Confirmation):**
  - Calls `handleDeleteListing` without redundant error re-throws; catches API errors and displays actionable toast feedback (`showToast(apiErrorMessage(err, 'Failed to delete listing.'), 'error')`).

### 2. `NewBillboardListing.jsx` & `steps.jsx` (Full-Page Creation Wizard)
- **3-Step Guided Wizard:**
  - **Step 1:** Specifications (Format, Dimensions, Location, Facing Direction, Traffic, Audience).
  - **Step 2:** Rate Card & Availability (Starting price, `MinBookingInput`, Pricing packages, Calendar).
  - **Step 3:** Media Uploads & Tour (Photos, Video URL, Coordinates).
- **`MinBookingInput` Widget:** Controlled numeric input alongside duration unit dropdown directly mapped via `resolveBookingDuration(d)` in `registrationMappers.js`.

---

## 6. Automated Quality Gates & CI Configuration

PR #31 integration established automated test coverage reporting and baseline threshold gates in `.github/workflows/ci.yml`:

### Backend Quality Pipeline (Maven + JaCoCo 0.8.14)
- **Coverage Reports:** `target/site/jacoco/jacoco.xml` and HTML summaries.
- **Threshold Gating:** JaCoCo `check` execution enforces minimum instruction and branch coverage thresholds.
- **CI Artifact:** Uploads `backend-jacoco-report` (retention: 14 days).

### Frontend Quality Pipeline (Vitest + V8 Engine)
- **Coverage Execution:** `npm run test:coverage` generates LCOV, JSON-summary, and HTML reports in `coverage/`.
- **Threshold Gating:** Configured baseline thresholds in `vite.config.js`.
- **CI Artifact:** Uploads `frontend-coverage-report` (retention: 14 days).

---

## 7. Verification & Testing Evidence

### Backend Automated Test Verification
```bash
mvn clean verify
```
- **Result:** `BUILD SUCCESS`
- **Suites Executed:**
  - `OwnerListingServiceTest`: 7 tests passing (CRUD, tenant isolation, duration normalization, notification dispatch).
  - `OwnerListingControllerTest`: 11 tests passing (Endpoint security, role enforcement, validation, HTTP 201/204 semantics, minBookingValue @Max boundary checks).
  - `LovServiceTest` & `LovEndpointIntegrationTest`: 12 tests passing (LOV catalogues, code/label parsing, error handling).
  - `V8MigrationTest`: 1 test passing (H2 PG-mode verification of V8 min_booking split, data backfills, and SQLState 23502 NOT NULL constraint enforcement).
  - `V8MigrationPostgresTest`: 1 test passing (real PostgreSQL 16 Testcontainers verification matching production docker-compose).
  - Total test count: 134 backend tests passed with 0 failures, 0 errors.

### Frontend Automated Test Verification
```bash
npm run lint
npm test -- --run
npm run build
```
- **Linting:** `eslint .` exited with **code 0 (0 errors, 0 warnings)**.
- **Vitest Suites:** **5 test files passed (29 tests passed)**:
  - `src/features/owner/ownerListingApi.test.js` (5 tests)
  - `src/features/auth/registrationMappers.test.js` (8 tests)
  - `src/features/auth/pincodeAutofill.test.js` (8 tests)
  - `src/features/notification/notificationApi.test.js` (3 tests)
  - `src/lib/validators.test.js` (5 tests)
- **Production Bundle:** Vite production build built successfully with code 0.
- **Documentation Quality Check:**
  ```bash
  python -X utf8 .github/scripts/validate-doc-content.py docs/prs/PR-34-consolidated-owner-inventory-and-platform-release.md
  ```
  Passed: All code blocks balanced, Mermaid syntax valid, no unfilled placeholders, and relative links verified.
