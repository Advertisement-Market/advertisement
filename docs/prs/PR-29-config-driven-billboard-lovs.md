# Backend Technical Document: Config-Driven Billboard Type / Traffic / Audience LOVs

- **PR Link / Ticket:** #29
- **Author:** @AshuLaley
- **Date:** 2026-09-17
- **Module / Package:** `backend/src/main/java/com/theadbasket/backend/lov`

---

## 1. Overview & Business Requirements
- **Goal:** Move the billboard `type`, `trafficType` and `audienceType` fields from unconstrained
  free text to config-driven lists-of-values (LOVs), so the owner form dropdowns and the backend
  share one authoritative catalogue and bad data can no longer be persisted.
- **User Impact:** Billboard Owners select these values while registering a listing; the catalogue
  also feeds Advertiser/Agency browsing filters downstream. Admins can re-word or localize the
  labels without a code change.
- **Functional Requirements:**
  - A single source of truth defines the allowed values for each of the three fields.
  - The frontend can fetch the options (code + display label) from a public endpoint.
  - Owner registration rejects any value outside the catalogue with a clear, machine-readable error.
  - Users may still describe a value the catalogue does not list via an `OTHER` option that captures
    the free text.

---

## 2. Technical Architecture & Component Flow
- **High-Level Flow:** Each field is modelled as an enum implementing `LovType`; the enum constant is
  the stored code, and the display label is resolved from `messages.properties` by `LovService` via
  Spring's `MessageSource`. `LovController` exposes the options for the dropdowns. During owner
  registration, `OwnerRegistrationService` calls `LovService.parse(...)` to convert each submitted
  string (code or label) into its enum, rejecting unknown values before the listing is saved.
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

      Client->>Lov: GET /api/lov/billboard-types
      Lov->>Svc: billboardTypes()
      Svc-->>Lov: [{code,label}]
      Lov-->>Client: 200 OK (options)
      Client->>Reg: POST /api/auth/register/owner
      Reg->>Svc: parse(type/traffic/audience)
      Svc-->>Reg: enum value (or 400 on unknown)
      Reg->>Repo: save(listing)
      Repo->>DB: INSERT billboard_listings
      DB-->>Repo: id
      Reg-->>Client: 201 Created (tokens)
  ```

---

## 3. API Specification & Contracts

### Endpoint: `GET /api/lov/billboard-types` (also `traffic-types`, `audience-types`)
- **Description:** Returns the configured options for a billboard field as `{code, label}` pairs,
  in declaration order, for the owner-form dropdowns.
- **Authentication / Roles:** `PermitAll` (the form loads before sign-in).
- **Request Headers:**
  ```http
  Content-Type: application/json
  ```
- **Response `200 OK`:**
  ```json
  [
    { "code": "STATIC_HOARDING", "label": "Static Hoarding" },
    { "code": "LED_DIGITAL", "label": "LED Digital" },
    { "code": "OTHER", "label": "Other" }
  ]
  ```
- **Error Codes:**
  - `400 Bad Request`: not applicable (read-only lookup).
  - `500 Internal Server Error`: unexpected failure resolving labels.

### Contract change: `POST /api/auth/register/owner` (billboard block)
- **Description:** `type`, `trafficType` and `audienceType` are validated against the catalogue. The
  value may be sent as the code (`STATIC_HOARDING`) or the label (`Static Hoarding`); the code is
  stored. New optional fields `typeOther` / `trafficTypeOther` / `audienceTypeOther` carry the free
  text when the value is `OTHER`.
- **Error Codes:**
  - `400 Bad Request` `INVALID_BILLBOARD_TYPE`: `type` is not in the catalogue.
  - `400 Bad Request` `INVALID_TRAFFIC_TYPE`: `trafficType` is not in the catalogue.
  - `400 Bad Request` `INVALID_AUDIENCE_TYPE`: `audienceType` is not in the catalogue.

---

## 4. Database & Storage Changes
- **Flyway Migration Script:** `V6__billboard_config_driven_types.sql`
- **Tables Modified / Created:** `billboard_listings` gains three nullable companion columns
  (`type_other`, `traffic_type_other`, `audience_type_other`, each `VARCHAR(120)`). The existing
  `type`, `traffic_type` and `audience_type` columns now store enum codes instead of free text.
- **Index Additions & Query Impact:** None. Values remain short `VARCHAR`s; no new indexes needed.
- **Backward Compatibility:** The migration backfills existing rows — known legacy labels are mapped
  to their codes, and any unrecognized free text is moved into the matching `*_other` column with the
  value set to `OTHER`, so every pre-existing row validates against the enums after upgrade.

---

## 5. Security & Validation
- **Input Validation:** Bean validation still enforces `@NotBlank`/`@Size` on the raw strings;
  `LovService.parse` then enforces membership in the catalogue and throws `BadRequestException` with
  a specific `ErrorCode` for unknown values. Companion `*Other` fields are `@Size(max = 120)`.
- **Access Control:** The lookup endpoints are added to `SecurityConfig` public paths
  (`/api/lov/**`); every other rule is unchanged.
- **Data Protection:** The catalogue holds no sensitive data; nothing new is logged. Labels are
  static reference text, and codes are non-PII.

---

## 6. Performance, Reliability & Failure Modes
- **Caching Strategy:** None required — the options come from in-memory enum values and a resource
  bundle, so each call is a cheap iteration with no database round-trip.
- **Transactions & Concurrency:** Parsing happens inside the existing `@Transactional` owner
  registration; a rejected value aborts the transaction before any row is written.
- **Failure Modes & Fallbacks:** If a label key is missing from `messages.properties`, `LovService`
  falls back to the code (via `use-code-as-default-message`), so the endpoint never fails on a
  missing translation.

---

## 7. Verification & Testing Evidence
- **Automated Tests Added:**
  - Unit Tests: `LovServiceTest.java` (options expose code + config label; parse by code or label;
    unknown and blank values rejected with the right `ErrorCode`).
  - Integration Tests: `LovEndpointIntegrationTest.java` (endpoint is public; owner registration
    rejects an unknown audience type; `OTHER` free text is persisted in the companion column).
  - Full suite: `mvn test` runs 81 tests, 0 failures.
- **Manual Verification (cURL / HTTP Client):**
  ```bash
  curl http://localhost:8080/api/lov/traffic-types
  # [{"code":"CITY_URBAN","label":"City / Urban"}, ... , {"code":"OTHER","label":"Other"}]
  ```
- **Log Output Evidence:** Owner registration with an unknown audience type returns
  `400` with body `{"errorCode":"INVALID_AUDIENCE_TYPE", ...}` and writes no `billboard_listings` row.
