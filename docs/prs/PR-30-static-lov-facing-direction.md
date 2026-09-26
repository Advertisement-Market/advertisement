# Backend Technical Document: Static LOV for Billboard Facing Direction

- **PR Link / Ticket:** #30
- **Author:** @AshuLaley
- **Date:** 2026-09-17
- **Module / Package:** `backend/src/main/java/com/theadbasket/backend/lov`

---

## 1. Overview & Business Requirements
- **Goal:** Move the billboard `facing` field from unconstrained free text to a static
  list-of-values — the eight compass directions — so the value is always one of a fixed, known set.
- **User Impact:** Billboard Owners pick the facing direction while registering a listing; a
  consistent value improves Advertiser/Agency filtering and reporting later.
- **Functional Requirements:**
  - The allowed facing values are the eight compass points and never change at runtime.
  - The frontend can fetch these options (code + display label) from a public endpoint.
  - Owner registration rejects any facing value outside the fixed set with a clear error.

> **Stacked on #29.** This PR targets `Ashutosh/billboard-config-driven`; review/merge #29 first and
> GitHub retargets this PR to `master` automatically. The diff here is the facing change only.

---

## 2. Technical Architecture & Component Flow
- **High-Level Flow:** Facing is modelled as the `FacingDirection` enum. Unlike the config-driven
  billboard LOVs, this is a **static** LOV: the labels are baked into the enum rather than resolved
  from `messages.properties`, because the eight compass points are fixed. `LovController` serves the
  options, and `OwnerRegistrationService` calls `LovService.parseFacing(...)` to convert the
  submitted string into the enum, rejecting unknown values before the listing is saved.
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

      Client->>Lov: GET /api/lov/facing-directions
      Lov->>Svc: facingDirections()
      Svc-->>Lov: [{code,label}] (baked labels)
      Lov-->>Client: 200 OK (8 options)
      Client->>Reg: POST /api/auth/register/owner
      Reg->>Svc: parseFacing(facing)
      Svc-->>Reg: FacingDirection (or 400 on unknown)
      Reg->>Repo: save(listing)
      Repo->>DB: INSERT billboard_listings
      DB-->>Repo: id
      Reg-->>Client: 201 Created (tokens)
  ```

---

## 3. API Specification & Contracts

### Endpoint: `GET /api/lov/facing-directions`
- **Description:** Returns the eight compass directions as `{code, label}` pairs, in clockwise order
  from North, for the owner-form dropdown.
- **Authentication / Roles:** `PermitAll` (the form loads before sign-in).
- **Request Headers:**
  ```http
  Content-Type: application/json
  ```
- **Response `200 OK`:**
  ```json
  [
    { "code": "NORTH", "label": "North" },
    { "code": "NORTH_EAST", "label": "North-East" },
    { "code": "NORTH_WEST", "label": "North-West" }
  ]
  ```
- **Error Codes:**
  - `400 Bad Request`: not applicable (read-only lookup).
  - `500 Internal Server Error`: unexpected failure building the option list.

### Contract change: `POST /api/auth/register/owner` (billboard block)
- **Description:** `facing` is validated against the fixed set. The value may be sent as the code
  (`NORTH_EAST`) or the label (`North-East`); the code is stored. There is no `OTHER` option — the
  compass is a closed set.
- **Error Codes:**
  - `400 Bad Request` `INVALID_FACING_DIRECTION`: `facing` is not one of the eight compass points.

---

## 4. Database & Storage Changes
- **Flyway Migration Script:** `V7__billboard_facing_direction_lov.sql`
- **Tables Modified / Created:** No schema change — `billboard_listings.facing` remains
  `VARCHAR(60)` but now stores the enum code.
- **Index Additions & Query Impact:** None.
- **Backward Compatibility:** The migration backfills existing rows, mapping each legacy label
  (for example `North-East`) to its code (`NORTH_EAST`). Matching is done on a normalized value
  (uppercased, separators stripped) so casing/separator variants map correctly, and any value that is
  still not a valid code (a legacy typo or empty string) is defaulted to `NORTH` — so no row can fail
  to parse into the enum and cause a `500` on read.

---

## 5. Security & Validation
- **Input Validation:** Bean validation still enforces `@NotBlank`/`@Size` on the raw string;
  `LovService.parseFacing` then enforces membership in the fixed set and throws
  `BadRequestException(INVALID_FACING_DIRECTION)` for unknown values.
- **Access Control:** Facing is served under the already-public `/api/lov/**` paths added in #29; no
  security rule changes here.
- **Data Protection:** Facing is non-sensitive reference data; nothing new is logged.

---

## 6. Performance, Reliability & Failure Modes
- **Caching Strategy:** The eight options never change, so the list is built once into a
  `private static final` field in `LovService` and the same immutable instance is returned on every
  request (no per-request allocation).
- **Transactions & Concurrency:** Parsing happens inside the existing `@Transactional` owner
  registration; a rejected facing aborts the transaction before any row is written.
- **Failure Modes & Fallbacks:** Labels are baked into the enum, so there is no missing-translation
  failure mode; an unknown submitted value is the only rejection path.

---

## 7. Verification & Testing Evidence
- **Automated Tests Added:**
  - Unit Tests: `LovServiceTest.java` (facing options are the static eight with baked labels; parse
    by code or label; unknown and blank values rejected with `INVALID_FACING_DIRECTION`).
  - Integration Tests: `LovEndpointIntegrationTest.java` (facing endpoint returns the eight points;
    owner registration rejects an unknown facing value).
  - Full suite: `mvn test` runs 85 tests, 0 failures.
- **Manual Verification (cURL / HTTP Client):**
  ```bash
  curl http://localhost:8080/api/lov/facing-directions
  # [{"code":"NORTH","label":"North"}, ... , {"code":"NORTH_WEST","label":"North-West"}]
  ```
- **Log Output Evidence:** Owner registration with `facing` set to an unknown value returns
  `400` with body `{"errorCode":"INVALID_FACING_DIRECTION", ...}` and writes no `billboard_listings`
  row.
