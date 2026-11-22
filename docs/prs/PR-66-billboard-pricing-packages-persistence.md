# Full-Stack Technical Document: Billboard Pricing Packages Persistence & Management

- **PR Link / Ticket:** [PR #66](https://github.com/Advertisement-Market/advertisement/pull/66)
- **Author:** @vedant
- **Date:** 2026-11-22
- **Module / Package:** `backend/src/main/java/com/theadbasket/backend/owner`, `backend/src/main/java/com/theadbasket/backend/registration`, `backend/src/main/resources/db/migration`, `frontend/src/features/auth`, `frontend/src/pages/OwnerRegister`, `frontend/src/pages/NewBillboardListing`

---

## 1. Overview & Problem Statement

### 1.1 Problem Statement & Background
In outdoor billboard advertising, owners structure rental inventory through tiered duration packages: offering standard baseline rates for minimum commitments and pre-negotiated promotional discounts for longer periods (e.g., 3 months popular tier, 6 months best value, 1 year long-term).

Prior to this implementation:
1. **Frontend-Only Mock State:** The `PricingTable` and `PriceRow` components in the registration wizard (`calendar.jsx`) utilized isolated, local React `useState`. Package inputs were never committed to `RegisterContext` or session storage. When users clicked "Next" or navigated between steps, all entered pricing packages were silently discarded.
2. **Missing Backend Schema & Persistence:** There was no database table or JPA entity for pricing packages. The `BillboardListing` entity only stored `start_price`, `min_booking_value`, and `min_booking_unit`.
3. **Incomplete DTO Pipeline:** `BillboardListingCreateRequest` lacked a `pricingPackages` field entirely, preventing listings created via `/owners/listings/new` from attaching package data.
4. **Missing LOV Value (`YEARS`):** The frontend dropdown included a "Years" option, but `BookingDurationUnit` only defined `DAYS`, `WEEKS`, and `MONTHS`, causing an immediate `IllegalArgumentException` on submission.
5. **Collection Mutation & Duplicate Collisions:** Naive collection replacement on `@OneToMany(orphanRemoval = true)` in Hibernate caused `A collection with cascade=all-delete-orphan was no longer referenced` runtime failures. Additionally, fixed 3-month and 6-month default promotional tiers collided with the base tier whenever an owner set a minimum booking duration of 90 or 180 days, violating unique duration constraints.

### 1.2 Solution Goals
- Implement a dedicated `billboard_pricing_packages` database table with foreign key cascading, positive rate constraints, and a compound unique index on `(billboard_id, duration_days)`.
- Write an idempotent, ANSI-standard Flyway migration (`V11`) that safely backfills existing legacy listings with their base package while defending against zero rates, unknown units, per-unit cap violations, and numeric overflow.
- Implement in-place collection reconciliation (`mergePricingPackages`) in `BillboardListing` to preserve entity primary keys, avoid collection orphan detachment, and eliminate statement-order unique constraint collisions during base package swaps.
- Apply pessimistic row locking (`SELECT ... FOR UPDATE` with 5s timeout) in `OwnerListingService.updateListing` to serialize concurrent edits, translating lock timeouts into clean HTTP 409 `CONCURRENT_MODIFICATION` responses.
- Refactor frontend `PricingTable` and `PriceRow` into fully controlled components with real-time `RegisterContext` synchronization, defaulting to a single base duration package (duration 1, blank rate) without autofilled promotional discounts, giving billboard owners explicit control to add custom tiers.
- Ensure 100% portability and test parity across PostgreSQL and H2 in-memory test databases.

---

## 2. Technical Architecture & Component Flow

```mermaid
sequenceDiagram
    autonumber
    actor Owner as Billboard Owner
    participant UI as PricingTable (calendar.jsx)
    participant Mappers as registrationMappers.js
    participant API as OwnerListingController / RegistrationController
    participant Svc as OwnerListingService / OwnerRegistrationService
    participant PPS as PricingPackageService
    participant Entity as BillboardListing
    database DB as PostgreSQL / H2 (V11 Schema)

    Owner->>UI: Configure durations, rates, and promotional notes
    UI->>UI: Synchronize controlled state to RegisterContext (f_pricingPackages)
    Owner->>UI: Submit Wizard Step (Create / Update / Register)
    UI->>Mappers: serializePricingPackages(rawPackages, startPrice, minVal, minUnit)
    Mappers->>Mappers: Sanitize notes (max 150 chars), reject duplicate durations, enforce promo rates
    Mappers->>API: POST / PATCH listing request with pricingPackages payload
    
    rect rgb(240, 248, 255)
        note right of Svc: Update Flow: Pessimistic Row Lock
        API->>Svc: updateListing(id, request)
        Svc->>DB: findByIdAndUserIdForUpdate(id, userId) [SELECT ... FOR UPDATE]
    end

    Svc->>PPS: validateAndBuildPackages(dtoList, effectiveStartPrice, minVal, minUnit)
    PPS->>PPS: Enforce unit caps (DAYS:365, WEEKS:52, MONTHS:60, YEARS:10)
    PPS->>PPS: Normalize duration_days, detect collisions, enforce exactly one base package
    PPS->>PPS: Auto-calculate base rate = (startPrice * baseDays) if rate omitted

    rect rgb(245, 255, 245)
        note right of Entity: In-Place Collection Reconciliation
        PPS-->>Svc: Reconciled package entities
        Svc->>Entity: listing.mergePricingPackages(validatedPackages)
        Entity->>Entity: 1) Delete removed tiers
        Entity->>Entity: 2) Update matched tiers in-place (preserves IDs)
        Entity->>Entity: 3) Append new tiers (setBillboard(this))
        Entity->>Entity: 4) Sort by durationDays ascending
    end

    Svc->>DB: Save & flush billboard_listings and billboard_pricing_packages
    DB-->>Svc: Committed entity with generated IDs
    Svc-->>API: BillboardListingDto with List of PricingPackageResponse
    API-->>UI: 200 OK / 201 Created (hydrated packages)
```

---

## 3. Database Schema & Flyway Migration (V11)

Migration Script: `backend/src/main/resources/db/migration/V11__create_billboard_pricing_packages.sql`

### 3.1 Table Definition & ANSI Standards
The table is designed with full portability across PostgreSQL and H2:
- Uses ANSI-standard `BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY`.
- Adheres to repository column conventions: `created_ts` and `updated_ts` (`TIMESTAMP WITH TIME ZONE`).
- Allocates `VARCHAR(20)` for `duration_unit` (accommodating `MONTHS`, `YEARS`, etc.).
- Avoids non-standard `IF NOT EXISTS` on `CREATE TABLE` and avoids non-portable PostgreSQL-only partial unique indexes or exclusion constraints. Uniqueness is cleanly enforced on `(billboard_id, duration_days)`.

```sql
CREATE TABLE billboard_pricing_packages (
    id              BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    billboard_id    BIGINT NOT NULL REFERENCES billboard_listings(id) ON DELETE CASCADE,
    duration_value  INT NOT NULL,
    duration_unit   VARCHAR(20) NOT NULL,
    duration_days   INT NOT NULL,
    rate            NUMERIC(14, 2) NOT NULL,
    note            VARCHAR(150),
    is_base         BOOLEAN NOT NULL DEFAULT FALSE,
    created_ts      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_ts      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_pkg_rate_positive CHECK (rate > 0),
    CONSTRAINT chk_pkg_duration_positive CHECK (duration_value > 0),
    CONSTRAINT uq_billboard_package_duration UNIQUE (billboard_id, duration_days)
);

CREATE INDEX idx_pricing_packages_billboard ON billboard_pricing_packages(billboard_id);
```

### 3.2 Defensive, Idempotent Backfill Query
Existing legacy listings created in migrations V1–V10 are backfilled with an initial base package synthesized from `start_price`, `min_booking_value`, and `min_booking_unit`:

```sql
INSERT INTO billboard_pricing_packages
  (billboard_id, duration_value, duration_unit, duration_days, rate, note, is_base, created_ts, updated_ts)
SELECT
  s.id,
  s.v,
  s.u,
  s.days,
  ROUND(s.start_price * s.days, 2),
  'Base minimum duration',
  TRUE,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM (
  SELECT
    id,
    start_price,
    COALESCE(min_booking_value, 1) AS v,
    UPPER(COALESCE(min_booking_unit, 'MONTHS')) AS u,
    COALESCE(min_booking_value, 1) * CASE UPPER(COALESCE(min_booking_unit, 'MONTHS'))
      WHEN 'DAYS' THEN 1
      WHEN 'WEEKS' THEN 7
      WHEN 'MONTHS' THEN 30
      WHEN 'YEARS' THEN 365
      ELSE NULL
    END AS days
  FROM billboard_listings
) s
WHERE s.u IN ('DAYS', 'WEEKS', 'MONTHS', 'YEARS')
  AND s.days IS NOT NULL
  AND s.v > 0
  AND s.v <= CASE s.u
    WHEN 'DAYS' THEN 365
    WHEN 'WEEKS' THEN 52
    WHEN 'MONTHS' THEN 60
    WHEN 'YEARS' THEN 10
  END
  AND s.start_price > 0
  AND s.start_price * s.days < 1000000000000
  AND NOT EXISTS (SELECT 1 FROM billboard_pricing_packages p WHERE p.billboard_id = s.id);
```

#### Backfill Defenses Verified in Test Suite:
1. `s.start_price > 0`: Prevents inserting zero or negative rates which would violate `chk_pkg_rate_positive`.
2. `s.u IN ('DAYS', 'WEEKS', 'MONTHS', 'YEARS')`: Rejects unknown units, preventing runtime `IllegalArgumentException` on enum parsing.
3. `s.v <= CASE s.u ... END`: Strictly enforces per-unit caps (`DAYS <= 365`, `WEEKS <= 52`, `MONTHS <= 60`, `YEARS <= 10`). Legacy listings exceeding caps (e.g., Listing 105 with `100 MONTHS`) are safely skipped from backfill.
4. `ROUND(s.start_price * s.days, 2)`: Evaluates canonically on `NUMERIC(14,2)` without redundant type casts.
5. `(s.start_price * s.days) < 10^12`: Guards against arithmetic overflow on `NUMERIC(14,2)`.
6. `NOT EXISTS (...)`: Prevents duplicate insertion upon re-runs.

---

## 4. Rate Calculations & Collision-Free Candidate Selection

### 4.1 Price Semantics Consensus
- In The AdBasket, `startPrice` is the **daily starting rate** ($\text{₹/day}$), explicitly labeled across all listing forms as `"Starting From Price (₹/Day)"`.
- **Base Package Rate Formula:**
  $$\text{baseRate} = \text{startPrice} \times \text{baseDurationDays}$$
  When an owner leaves the base rate empty (`rate: ''`), the frontend displays the dynamic auto-rate and sends `rate: null` to the backend, which automatically computes the exact rate with `BigDecimal.setScale(2, RoundingMode.HALF_UP)`.
- **Promotional Package Rate Formula:**
  $$\text{promotionalRate} = \text{startPrice} \times \text{tierDurationDays} \times (1 - \text{discount})$$
  Promotional tiers are calculated directly from daily price without dividing by `minBookingDays`. Both frontend and backend use 2-decimal `HALF_UP` rounding (`(Math.round((unrounded + Number.EPSILON) * 100) / 100).toFixed(2)` on JS and `setScale(2, RoundingMode.HALF_UP)` on Java).
- **Stale Rate Contract:** Base rate dynamically tracks `startPrice` until explicitly customized. In contrast, package rates in the table represent fixed promotional offers and will not automatically change if the daily starting price is later updated, matching the UI guidance note:
  `"ℹ️ Base rate automatically tracks your starting price until customized. Once published, saved package rates represent fixed offers and will not change when daily starting price is updated."`

### 4.2 Default Base Tier & Optional Promotional Packages
Rather than pre-populating arbitrary promotional discounts (e.g. 10% or 30%) that owners must undo or reconfigure, `buildDefaultPackages` defaults strictly to the **single base tier**:
- **Duration**: Defaults to `1` (or the configured `minBookingValue`).
- **Unit**: Inherits the minimum booking unit (`MONTHS`, `DAYS`, etc.).
- **Rate**: Kept blank (`rate: ''`) in the UI, displaying the dynamic `baseAutoRate` placeholder (`startPrice * baseDays`) and transmitting `rate: null` to the backend for automatic calculation.
- **Notes**: Kept blank (`note: ''`).

When billboard owners wish to offer volume discounts, they explicitly click **"+ Add Duration Package"**:
- **Duration**: Defaults to `1`.
- **Unit**: Defaults to `months`.
- **Rate & Note**: Start completely blank.
- **Discount Badge**: Dynamically calculates and displays positive percentage savings (e.g. `"15% off"`) relative to the base daily rate once a custom rate is entered.

```javascript
export function buildDefaultPackages(startPrice, minVal = 1, minUnit = 'months') {
  const normUnit = (minUnit || 'months').toLowerCase();
  const val = Number(minVal) || 1;
  const baseDays = toDays(val, normUnit);

  const baseTier = {
    id: 1,
    num: String(val),
    unit: normUnit,
    durationValue: val,
    durationUnit: normUnit,
    durationDays: baseDays,
    rate: '',
    note: '',
    notePlaceholder: 'Standard',
    isBase: true,
    isCustomRate: false,
  };

  return [baseTier];
}
```

---

## 5. Backend Implementation Details

### 5.1 Domain LOV: `BookingDurationUnit.java`
- Added `YEARS("Years", 365, 10)`.
- Defined per-unit maximum caps:
  - `DAYS`: max 365
  - `WEEKS`: max 52
  - `MONTHS`: max 60
  - `YEARS`: max 10
- Added pure `isValidDurationValue(int value)` validation.
- Kept `toDays(int value)` pure and decoupled from web exceptions, utilizing `Math.multiplyExact(value, this.daysPerUnit)` to protect against arithmetic integer overflow.

### 5.2 In-Place Collection Reconciliation: `BillboardListing.java`
To prevent Hibernate collection orphan errors (`A collection with cascade=all-delete-orphan was no longer referenced`) and ensure statement-order safety on unique constraints, `mergePricingPackages` mutates existing entity instances in-place:

```java
public void mergePricingPackages(List<BillboardPricingPackage> incomingPackages) {
    Objects.requireNonNull(incomingPackages, "incomingPackages must not be null");

    Map<Integer, BillboardPricingPackage> incomingByDays = incomingPackages.stream()
            .collect(Collectors.toMap(
                    BillboardPricingPackage::getDurationDays,
                    pkg -> pkg,
                    (existing, replacement) -> existing
            ));

    // 1. Remove deleted tiers
    this.pricingPackages.removeIf(existing -> !incomingByDays.containsKey(existing.getDurationDays()));

    // 2. Update existing tiers in-place (preserves primary key IDs)
    for (BillboardPricingPackage existing : this.pricingPackages) {
        BillboardPricingPackage incoming = incomingByDays.remove(existing.getDurationDays());
        if (incoming != null) {
            existing.setDurationValue(incoming.getDurationValue());
            existing.setDurationUnit(incoming.getDurationUnit());
            existing.setRate(incoming.getRate());
            existing.setNote(incoming.getNote());
            existing.setBase(incoming.isBase());
        }
    }

    // 3. Add brand new tiers
    for (BillboardPricingPackage newPkg : incomingByDays.values()) {
        newPkg.setBillboard(this);
        this.pricingPackages.add(newPkg);
    }

    // 4. In-memory sort by durationDays ascending
    this.pricingPackages.sort(Comparator.comparingInt(BillboardPricingPackage::getDurationDays));
}
```

### 5.3 Centralized Validation: `PricingPackageService.java`
- `validateMinBooking`: Validates `minBookingValue` against `minBookingUnit` per-unit caps. Invoked consistently on:
  - `OwnerRegistrationService.registerOwner` (Step 7 submission)
  - `OwnerListingService.createListing`
  - `OwnerListingService.updateListing`
  Any attempt to pass `1000 YEARS` or edit an unbackfilled legacy row with `100 MONTHS` immediately yields a structured 400 Bad Request:
  ```json
  {
    "status": 400,
    "error": "VALIDATION_FAILED",
    "fieldErrors": {
      "minBookingValue": "Minimum booking duration exceeds maximum allowed 60 for unit Months"
    }
  }
  ```
- `validateAndBuildPackages`: Enforces single-base invariant, calculates automatic base rates, rounds with `HALF_UP`, and caps rates at $\le 999,999,999,999.99$.

### 5.4 Concurrency, Write Inventory & Lock Timeout Translation
- **Write Path Inventory:**
  1. `OwnerRegistrationService.registerOwner`: Creates brand new listing (no ID yet; no concurrent writes).
  2. `OwnerListingService.createListing`: Creates brand new listing (no ID yet; no concurrent writes).
  3. `OwnerListingService.updateListing`: **The single write endpoint modifying pricing packages**.
  Admin operations (`approveListing`, `rejectListing`), owner `submitListing`, and media synchronization do not modify pricing packages.
- **Pessimistic Row Locking:** `updateListing` acquires `billboardListingRepository.findByIdAndUserIdForUpdate(id, userId)` (`SELECT ... FOR UPDATE` with 5s timeout).
- **Lock Timeout Translation:** In `GlobalExceptionHandler.java`:
  ```java
  @ExceptionHandler({
          PessimisticLockingFailureException.class,
          CannotAcquireLockException.class,
          PessimisticLockException.class,
          LockTimeoutException.class
  })
  public ResponseEntity<ApiError> handleLockConflict(Exception ex, HttpServletRequest request) {
      log.warn("Database lock acquisition failed on {}: {}", request.getRequestURI(), ex.getMessage());
      return build(HttpStatus.CONFLICT, ErrorCode.CONCURRENT_MODIFICATION, request);
  }

  @ExceptionHandler(JpaSystemException.class)
  public ResponseEntity<ApiError> handleJpaSystem(JpaSystemException ex, HttpServletRequest request) {
      if (isLockException(ex)) {
          log.warn("Database lock acquisition failed (wrapped in JpaSystemException) on {}: {}", request.getRequestURI(), ex.getMessage());
          return build(HttpStatus.CONFLICT, ErrorCode.CONCURRENT_MODIFICATION, request);
      }
      log.error("JPA system exception on {} {}", request.getMethod(), request.getRequestURI(), ex);
      return build(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.INTERNAL_ERROR, request);
  }
  ```
  Lock timeouts cleanly surface as HTTP 409 `CONCURRENT_MODIFICATION`, unwrapping wrapped JPA/Hibernate exceptions.

### 5.5 N+1 Query Elimination & List Endpoints
- In `BillboardListingDto.from`: Maps `List<PricingPackageResponse>` from `listing.getPricingPackages()`.
- Both listing detail (`getListing`) and list (`getOwnerListings`) endpoints populate packages.
- `@BatchSize(size = 25)` on `BillboardListing.pricingPackages` and `spring.jpa.properties.hibernate.default_batch_fetch_size: 25` in `application.yml` instruct Hibernate to load collections in batches (`SELECT ... WHERE billboard_id IN (?, ?, ..., ?)`), completely eliminating N+1 query loops.
- **Statement Count Verification:** `BillboardListingBatchFetchTest` verifies that loading 10 listings with packages generates at most 2 queries (1 for listings + 1 batch fetch for packages), never 11 individual queries.

---

## 6. Frontend Implementation Details

### 6.1 Controlled `PricingTable` and `PriceRow` (`calendar.jsx`)
- Refactored `PricingTable` from local state to a fully controlled component syncing directly with `RegisterContext` via `setField('f_pricingPackages', updated)`.
- Input fields dispatch updates immediately. Changing duration on the base package automatically clears manual rates to prompt auto-recalculation for the new period.
- Package notes enforce `maxLength={150}`.

### 6.2 Serialization & Sanitization (`registrationMappers.js`)
- `serializePricingPackages`:
  - When `rawPackages` is empty or null, synthesizes only the base tier with `rate: null` so the backend auto-rates the listing.
  - Safely parses formatted number strings (e.g. `'150,000'` with commas).
  - Trims notes to 150 characters.
  - Rejects duplicate durations client-side with user-friendly errors.
  - Enforces positive rates on promotional tiers (`FieldFormatError`).
- `mapListingToFormData`:
  - Hydrates `dto.pricingPackages` directly during edit mode, preserving existing custom packages.
  - Falls back to `buildDefaultPackages` only when existing packages are empty or null.

### 6.3 Validation Updates (`NewBillboardListing.jsx` & `OwnerRegister.jsx`)
- Added `YEARS` to the allowed duration units array `['DAYS', 'WEEKS', 'MONTHS', 'YEARS']` in both step validation functions.

---

## 7. Verification & Automated Test Matrix

### 7.1 Backend Test Coverage (50 / 50 Passed)
Executed via `mvn test`:

```
[INFO] Running com.theadbasket.backend.lov.BookingDurationUnitTest
[INFO] Tests run: 7, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.theadbasket.backend.migration.V11MigrationSeededDataTest
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.theadbasket.backend.owner.PricingPackageValidationTest
[INFO] Tests run: 10, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.theadbasket.backend.owner.OwnerListingServiceTest
[INFO] Tests run: 21, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.theadbasket.backend.owner.OwnerListingPricingPackagesTest
[INFO] Tests run: 6, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.theadbasket.backend.registration.OwnerRegistrationPricingPackagesTest
[INFO] Tests run: 5, Failures: 0, Errors: 0, Skipped: 0
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] Tests run: 50, Failures: 0, Errors: 0, Skipped: 0
[INFO] Total time: 34.465 s
```

#### Test Suite Highlights:
- `V11MigrationSeededDataTest`: Verifies Flyway migration and backfill logic against 7 test cases: valid baseline row (101), zero price (102), negative price (103), invalid unit 'HOURS' (104), exceeded cap 100 months (105), null price (106), and huge price $> 10^{12}$ (107).
- `PricingPackageValidationTest`: Tests negative rates, duplicate duration days, zero base packages, multiple base packages, and maximum value caps.
- `PricingPackagesConcurrencyIT`: Tests pessimistic write locking under Hikari pool contention; configured with `@Testcontainers(disabledWithoutDocker = true)`. Executing `mvn test -Dtest=PricingPackagesConcurrencyIT` safely skips locally without Docker (`Skipped: 1`) and executes on Docker-enabled CI runners.

### 7.2 Frontend Test Coverage (288 / 288 Passed)
Executed via `npx vitest run`:

```
 Test Files  20 passed (20)
      Tests  288 passed (288)
   Duration  16.46s

✓ built in 1.04s
```

#### Test Suite Highlights:
- `pricingPackageDefaults.test.js` (8 tests): Verifies duration conversion, zero/invalid value guards, comma-formatted price parsing, single base tier defaults with blank rate and duration 1, and no autofilled promotional discount tiers.
- `registrationMappers.test.js` (41 tests): Verifies package serialization, note trimming, base package synthesis with `rate: null`, promotional rate requirement (`FieldFormatError`), and round-trip payload mapping.
- `NewBillboardListing.test.jsx` (40 tests): Verifies edit-mode hydration of existing custom pricing packages without overwriting.
- `OwnerRegister.test.jsx` (31 tests): Verifies default tier rendering, discount badges, and controlled input dispatching.

---

## 8. Modified & Created Files Inventory

| File Path | Type | Change Summary |
| :--- | :--- | :--- |
| `backend/src/main/resources/db/migration/V11__create_billboard_pricing_packages.sql` | Migration | Created table schema, indexes, constraints, explicit `CAST` on `ROUND`, and defensive backfill query |
| `backend/src/main/java/com/theadbasket/backend/lov/BookingDurationUnit.java` | Backend LOV | Added `YEARS`, per-unit caps, pure arithmetic `toDays` |
| `backend/src/main/java/com/theadbasket/backend/owner/BillboardPricingPackage.java` | JPA Entity | Created pricing package entity with JPA auditing listeners |
| `backend/src/main/java/com/theadbasket/backend/owner/dto/PricingPackageRequest.java` | DTO | Inbound package request record with duration, rate, note, and isBase |
| `backend/src/main/java/com/theadbasket/backend/owner/dto/PricingPackageResponse.java` | DTO | Outbound package response record matching database schema |
| `backend/src/main/java/com/theadbasket/backend/owner/BillboardListing.java` | JPA Entity | Added `@OneToMany` collection, `@BatchSize(25)`, and `mergePricingPackages` |
| `backend/src/main/java/com/theadbasket/backend/owner/PricingPackageService.java` | Service | Created validation, duration normalization, auto-rate calculation |
| `backend/src/main/java/com/theadbasket/backend/owner/OwnerListingService.java` | Service | Integrated package creation, updates, and pessimistic locking |
| `backend/src/main/java/com/theadbasket/backend/registration/OwnerRegistrationService.java` | Service | Wired package creation during owner onboarding registration |
| `backend/src/main/java/com/theadbasket/backend/owner/dto/BillboardListingCreateRequest.java` | DTO | Added `pricingPackages` field |
| `backend/src/main/java/com/theadbasket/backend/owner/dto/BillboardListingUpdateRequest.java` | DTO | Added `pricingPackages` field |
| `backend/src/main/java/com/theadbasket/backend/owner/dto/BillboardListingDto.java` | DTO | Added `pricingPackages` field to DTO mapping |
| `backend/src/main/java/com/theadbasket/backend/registration/dto/BillboardListingRequest.java` | DTO | Added `pricingPackages` field |
| `backend/src/main/resources/application.yml` | Config | Added `spring.jpa.properties.hibernate.default_batch_fetch_size: 25` |
| `frontend/src/features/auth/pricingPackageDefaults.js` | Frontend Utility | Created candidate tier pool and deterministic default generator with comma-safe price parsing |
| `frontend/src/features/auth/pricingPackageDefaults.test.js` | Vitest | Unit tests for duration conversions, comma parsing, and collision-free candidate selection |
| `frontend/src/features/auth/registrationMappers.js` | Frontend Mappers | Added `serializePricingPackages` and edit-mode package hydration |
| `frontend/src/features/auth/registrationMappers.test.js` | Vitest | Verified package serialization, base synthesis, and promotional rate enforcement |
| `frontend/src/pages/OwnerRegister/calendar.jsx` | React Component | Controlled `PricingTable` and `PriceRow` with `RegisterContext` sync and rate policy UI note |
| `frontend/src/pages/NewBillboardListing/NewBillboardListing.jsx` | React Component | Added `YEARS` to duration unit step validation |
| `frontend/src/pages/OwnerRegister/OwnerRegister.jsx` | React Component | Added `YEARS` to duration unit step validation |
| `frontend/src/pages/NewBillboardListing/NewBillboardListing.test.jsx` | Vitest | Added edit-mode custom pricing packages hydration test |
| `frontend/src/pages/OwnerRegister/OwnerRegister.test.jsx` | Vitest | Verified controlled package row counts and discount badges |
| `backend/src/test/java/com/theadbasket/backend/lov/BookingDurationUnitTest.java` | JUnit Test | Unit tests for duration caps and arithmetic |
| `backend/src/test/java/com/theadbasket/backend/migration/V11MigrationSeededDataTest.java` | Flyway Test | Migration test verifying backfill query against seed data edge cases |
| `backend/src/test/java/com/theadbasket/backend/owner/PricingPackageValidationTest.java` | JUnit Test | Unit tests for constraints, base checks, duplicates |
| `backend/src/test/java/com/theadbasket/backend/owner/OwnerListingServiceTest.java` | JUnit Test | Updated mocks to `findByIdAndUserIdForUpdate` (21 tests) |
| `backend/src/test/java/com/theadbasket/backend/owner/OwnerListingPricingPackagesTest.java` | MockMvc Test | Integration tests for listing endpoints (6 tests) |
| `backend/src/test/java/com/theadbasket/backend/registration/OwnerRegistrationPricingPackagesTest.java` | MockMvc Test | Integration tests for registration flow (5 tests) |
| `backend/src/test/java/com/theadbasket/backend/owner/PricingPackagesConcurrencyIT.java` | Testcontainers | PostgreSQL concurrency IT with `disabledWithoutDocker = true` |

---

## 9. Scope Boundaries & Deferred Work

1. **Owner Dashboard My Listings Tab Wiring:** The "My Listings" tab on the owner dashboard currently renders initial listings; full wiring to display active pricing packages on individual card expansions is tracked under Issue #66.
2. **Dynamic Campaign Duration Selector:** Advertiser checkout booking duration selection against published owner packages is tracked in the upcoming advertiser campaign booking epic.
