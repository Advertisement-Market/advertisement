# Backend Technical Document: Minimum Booking Duration Split (value + unit + normalized days)

- **PR Link / Ticket:** #33
- **Author:** @AshuLaley
- **Date:** 2026-09-19
- **Module / Package:** `backend/src/main/java/com/theadbasket/backend/lov`

---

## 1. Overview & Business Requirements
- **Goal:** Replace the single free-text `min_booking` field on a billboard listing with a structured
  minimum booking duration — the number the owner entered, the unit they picked, and the duration
  normalized to days — so availability and pricing logic can compare listings on one scale.
- **User Impact:** Billboard Owners set the minimum booking while registering a listing (two
  dropdowns: a number and a unit). Advertisers/Agencies benefit later from consistent,
  machine-comparable durations when filtering inventory.
- **Functional Requirements:**
  - The owner picks a number and a unit (Days, Weeks or Months).
  - The backend stores both what was picked and the duration normalized to days.
  - A month is treated as a flat 30 days.
  - An unknown unit is rejected; the number must be a positive integer.

---

## 2. Technical Architecture & Component Flow
- **High-Level Flow:** The unit is modelled as the static `BookingDurationUnit` enum, which carries a
  days-per-unit factor (Days = 1, Weeks = 7, Months = 30). `LovController` serves the unit options for
  the dropdown. During owner registration, `OwnerRegistrationService` calls
  `LovService.parseBookingDurationUnit(...)` to resolve the unit and rejects unknown values, then
  stores the raw value, the unit, and `unit.toDays(value)` on the listing.
- **Architectural Diagram (Mermaid):**
  ```mermaid
  sequenceDiagram
      autonumber
      actor Client
      participant Lov as LovController
      participant Svc as LovService
      participant Reg as OwnerRegistrationService
      participant Repo as BillboardListingRepository
      database DB as PostgreSQL

      Client->>Lov: GET /api/lov/booking-duration-units
      Lov->>Svc: bookingDurationUnits()
      Svc-->>Lov: [{code,label}] (Days/Weeks/Months)
      Lov-->>Client: 200 OK (3 options)
      Client->>Reg: POST /api/auth/register/owner (value + unit)
      Reg->>Svc: parseBookingDurationUnit(unit)
      Svc-->>Reg: BookingDurationUnit (or 400 on unknown)
      Reg->>Reg: days = unit.toDays(value)
      Reg->>Repo: save(listing: value, unit, days)
      Repo->>DB: INSERT billboard_listings
      DB-->>Repo: id
      Reg-->>Client: 201 Created (tokens)
  ```

---

## 3. API Specification & Contracts

### Endpoint: `GET /api/lov/booking-duration-units`
- **Description:** Returns the three minimum-booking units as `{code, label}` pairs for the unit
  dropdown.
- **Authentication / Roles:** `PermitAll` (the form loads before sign-in).
- **Request Headers:**
  ```http
  Content-Type: application/json
  ```
- **Response `200 OK`:**
  ```json
  [
    { "code": "DAYS", "label": "Days" },
    { "code": "WEEKS", "label": "Weeks" },
    { "code": "MONTHS", "label": "Months" }
  ]
  ```
- **Error Codes:**
  - `400 Bad Request`: not applicable (read-only lookup).
  - `500 Internal Server Error`: unexpected failure building the option list.

### Contract change: `POST /api/auth/register/owner` (billboard block)
- **Description:** The single `minBooking` string is replaced by `minBookingValue` (a positive
  integer) and `minBookingUnit` (`DAYS` / `WEEKS` / `MONTHS`, accepted as code or label). The backend
  stores both plus the normalized `minBookingDays`.
- **Error Codes:**
  - `400 Bad Request` `INVALID_BOOKING_DURATION_UNIT`: `minBookingUnit` is not a known unit.
  - `400 Bad Request` `VALIDATION_FAILED`: `minBookingValue` is missing or not positive.

---

## 4. Database & Storage Changes
- **Flyway Migration Script:** `V8__billboard_min_booking_split.sql`
- **Tables Modified / Created:** `billboard_listings` gains `min_booking_value` (`INTEGER`),
  `min_booking_unit` (`VARCHAR(20)`) and `min_booking_days` (`INTEGER`), all `NOT NULL`; the legacy
  `min_booking` (`VARCHAR(50)`) column is dropped.
- **Index Additions & Query Impact:** None yet. `min_booking_days` is the intended future filter/sort
  key for availability queries; an index can be added when that query path lands.
- **Backward Compatibility:** The migration backfills existing rows from the known legacy dropdown
  values and labels into value + unit, computes `min_booking_days`, and only then enforces `NOT NULL`
  before dropping the old column, so upgrades keep working for pre-existing listings.

---

## 5. Security & Validation
- **Input Validation:** `minBookingValue` is `@NotNull`, `@Positive` and `@Max(1000)` — the upper
  bound prevents an absurd value from overflowing `int` when multiplied by the unit's day factor.
  `minBookingUnit` is `@NotBlank`/`@Size` at the DTO and then resolved against the enum by
  `LovService`, which throws `BadRequestException(INVALID_BOOKING_DURATION_UNIT)` for unknown units.
- **Access Control:** The unit lookup is served under the already-public `/api/lov/**` paths; no
  security rule changes.
- **Data Protection:** Booking durations are non-sensitive reference data; nothing new is logged.

---

## 6. Performance, Reliability & Failure Modes
- **Caching Strategy:** The three units never change, so the option list is built once into a
  `private static final` field in `LovService` and the same immutable instance is returned per request;
  normalization to days is a single multiplication.
- **Transactions & Concurrency:** Unit parsing and day computation happen inside the existing
  `@Transactional` owner registration; a rejected unit aborts the transaction before any row is
  written.
- **Failure Modes & Fallbacks:** Labels and factors are baked into the enum, so there is no
  missing-config failure mode; an unknown unit or a non-positive value are the only rejection paths.

---

## 7. Verification & Testing Evidence
- **Automated Tests Added:**
  - Unit Tests: `LovServiceTest.java` (units list is the static three; parse by code or label; unknown
    rejected; `toDays` normalization with a 30-day month).
  - Integration Tests: `LovEndpointIntegrationTest.java` (units endpoint; registration stores value +
    unit + normalized days for `3 MONTHS → 90`; unknown unit rejected).
  - Full suite: `mvn test` runs 108 tests, 0 failures.
- **Manual Verification (cURL / HTTP Client):**
  ```bash
  curl http://localhost:8080/api/lov/booking-duration-units
  # [{"code":"DAYS","label":"Days"},{"code":"WEEKS","label":"Weeks"},{"code":"MONTHS","label":"Months"}]
  ```
- **Log Output Evidence:** Owner registration with `minBookingValue=3`, `minBookingUnit=MONTHS`
  persists a `billboard_listings` row with `min_booking_days = 90`; an unknown unit returns `400` with
  body `{"errorCode":"INVALID_BOOKING_DURATION_UNIT", ...}` and writes no row.
