# Backend & Frontend Technical Document: Populating Billboard Owner "My Listings"

- **PR Link / Ticket:** #28
- **Author:** @vedafactor
- **Date:** 2026-09-17
- **Module / Package:** `backend/src/main/java/com/theadbasket/backend/owner`, `frontend/src/features/owner`, `frontend/src/pages/OwnerDashboard`

---

## 1. Overview & Business Requirements

- **Goal:** Replace static mock data on the Billboard Owner Dashboard (`/owners/dashboard`) with live, database-backed inventory management supporting complete CRUD operations (List, Get, Create, Partial Update / PATCH, Delete), row-level tenant isolation, dynamic dashboard counters/badges, and full test automation.
- **User Impact:** Billboard Owners can view their live inventory, create new billboard listings, update existing listing parameters (pricing, specs, location, booking terms), and delete decommissioned listings with immediate synchronization across sidebar counters and overview KPI metrics.
- **Key Architectural Decisions:**
  - **Strict Row-Level Tenant Isolation:** All operations (list, find, patch, delete) are scoped to the authenticated caller's `user_id` extracted from `AuthenticatedUser`. Accessing or mutating another user's listing returns `404 Not Found` (indistinguishable from non-existent IDs to prevent enumeration).
  - **Entity Timestamp Alignment:** Uses the `@CreatedDate @Column(name = "created_ts") private Instant createdAt;` convention on `BillboardListing`, queried via Spring Data repository method `findByUserIdOrderByCreatedAtDesc(Long userId)`.
  - **Child Address Cascade & Orphan Removal:** `BillboardListing` maintains `@OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)` with `Address`. Deleting a listing removes the parent record first, and Hibernate handles the deletion of the associated address row, preventing foreign key constraint violations and orphaned address records.
  - **Robust PATCH Validation Semantics:** `BillboardListingUpdateRequest` applies `@Pattern(regexp = "^(?!\\s*$).+", message = "...")` to non-nullable fields. This permits omitted (`null`) fields to pass validation cleanly while rejecting empty or whitespace-only strings (`""` or `"   "`) with `400 Bad Request` (`ErrorCode.VALIDATION_FAILED`), avoiding unexpected database constraint failures. Optional fields (`discountNote`, `addressLine2`, `landmark`) use `blankToNull()` normalization.
  - **Response Status Alignment:** The creation endpoint utilizes `@ResponseStatus(HttpStatus.CREATED)` returning the serialized `BillboardListingDto` with the newly generated `id` and `createdAt` timestamp in the response body.

---

## 2. Technical Architecture & Component Flow

```mermaid
sequenceDiagram
    autonumber
    actor Owner as Authenticated Owner
    participant FE as React OwnerDashboard (/owners/dashboard)
    participant API as ownerListingApi (Axios Client)
    participant SEC as JwtAuthenticationFilter (SecurityConfig)
    participant Ctrl as OwnerListingController (/api/owner/listings)
    participant Svc as OwnerListingService
    participant Repo as BillboardListingRepository
    database DB as PostgreSQL / H2 Database

    Owner->>FE: Loads Dashboard or My Listings
    FE->>API: getListings()
    API->>SEC: GET /api/owner/listings (Bearer JWT)
    SEC->>Ctrl: AuthenticatedUser principal (id=42, role=OWNER)
    Ctrl->>Svc: getOwnerListings(userId=42)
    Svc->>Repo: findByUserIdOrderByCreatedAtDesc(42)
    Repo->>DB: SELECT l, a FROM billboard_listings l JOIN addresses a WHERE l.user_id = 42 ORDER BY l.created_ts DESC
    DB-->>Repo: List<BillboardListing>
    Repo-->>Svc: Entity List
    Svc-->>Ctrl: List<BillboardListingDto> (flattened address)
    Ctrl-->>API: 200 OK (JSON)
    API-->>FE: Update listings state, sidebar badge, & overview active count

    alt Create Listing
        Owner->>FE: Submits Add Listing Modal
        FE->>API: createListing(payload)
        API->>Ctrl: POST /api/owner/listings
        Ctrl->>Svc: createListing(userId=42, request)
        Svc->>DB: INSERT INTO addresses ... ; INSERT INTO billboard_listings ...
        DB-->>Svc: Saved Entity
        Svc-->>Ctrl: BillboardListingDto
        Ctrl-->>FE: 201 Created (JSON)
        FE->>FE: Trigger toast + refreshListings()
    else PATCH / Update Listing
        Owner->>FE: Submits Edit Listing Modal
        FE->>API: updateListing(id=10, payload)
        API->>Ctrl: PATCH /api/owner/listings/10
        Ctrl->>Svc: updateListing(id=10, userId=42, request)
        Svc->>Repo: findByIdAndUserId(10, 42)
        Svc->>DB: UPDATE billboard_listings SET ... ; UPDATE addresses SET ...
        Ctrl-->>FE: 200 OK (BillboardListingDto)
        FE->>FE: Trigger toast + refreshListings()
    else Delete Listing
        Owner->>FE: Confirms Delete Modal
        FE->>API: deleteListing(id=10)
        API->>Ctrl: DELETE /api/owner/listings/10
        Ctrl->>Svc: deleteListing(id=10, userId=42)
        Svc->>Repo: findByIdAndUserId(10, 42)
        Svc->>Repo: delete(listing)
        Repo->>DB: DELETE FROM billboard_listings WHERE id=10; DELETE FROM addresses WHERE id=...
        Ctrl-->>FE: 204 No Content
        FE->>FE: Trigger toast + refreshListings()
    end
```

---

## 3. Database Schema & Data Integrity

The data layer utilizes the normalized `billboard_listings` and `addresses` tables established in `V3__normalize_schema.sql` (PR-11):

```sql
-- Existing Schema Reference
CREATE TABLE addresses (
    id            BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    address_line1 VARCHAR(300) NOT NULL,
    address_line2 VARCHAR(300),
    landmark      VARCHAR(200),
    city          VARCHAR(100) NOT NULL,
    state         VARCHAR(100) NOT NULL,
    pincode       VARCHAR(10)  NOT NULL,
    country       VARCHAR(100) NOT NULL DEFAULT 'India',
    created_ts    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE billboard_listings (
    id               BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    user_id          BIGINT         NOT NULL,
    address_id       BIGINT         NOT NULL,
    name             VARCHAR(150)   NOT NULL,
    type             VARCHAR(60)    NOT NULL,
    width_ft         NUMERIC(8, 2)  NOT NULL,
    height_ft        NUMERIC(8, 2)  NOT NULL,
    ground_height_ft NUMERIC(8, 2),
    facing           VARCHAR(60)    NOT NULL,
    traffic_type     VARCHAR(80)    NOT NULL,
    audience_type    VARCHAR(120)   NOT NULL,
    footfall         VARCHAR(60),
    start_price      NUMERIC(14, 2) NOT NULL,
    min_booking      VARCHAR(50)    NOT NULL,
    discount_note    VARCHAR(500),
    created_ts       TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_billboards_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_billboards_address FOREIGN KEY (address_id) REFERENCES addresses (id) ON DELETE CASCADE
);
```

### Cascade Lifecycle & Address Cleanup
`BillboardListing.java` manages the address relationship with:
```java
@OneToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
@JoinColumn(name = "address_id", nullable = false)
private Address address;
```
When `ownerListingService.deleteListing(id, userId)` executes, deleting the `BillboardListing` entity cascades the deletion to the referenced `Address` row, preventing orphaned rows in `addresses`.

---

## 4. API Specification & Contracts

Base URL: `/api/owner/listings`  
Authorization: Bearer JWT (`hasRole('OWNER')`)

### 1. `GET /api/owner/listings`
- **Description:** Returns all billboard listings belonging to the authenticated owner ordered by creation timestamp descending.
- **Response `200 OK`:**
  ```json
  [
    {
      "id": 1,
      "name": "Bandra West Highway Unipole",
      "addressLine1": "Opp Bandra Station, SV Road",
      "addressLine2": null,
      "landmark": "Near Lucky Restaurant",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400050",
      "type": "Unipole",
      "widthFt": 40.0,
      "heightFt": 20.0,
      "groundHeightFt": 15.0,
      "facing": "North-Bound Traffic",
      "trafficType": "Vehicular & Pedestrian",
      "audienceType": "Daily Commuters, Shoppers",
      "footfall": "120,000+ daily",
      "startPrice": 350000.00,
      "minBooking": "1 month",
      "discountNote": "10% off for 3+ months",
      "createdAt": "2026-09-17T01:30:00Z"
    }
  ]
  ```

### 2. `GET /api/owner/listings/{id}`
- **Description:** Returns a single billboard listing by ID.
- **Response `200 OK`:** `BillboardListingDto` JSON.
- **Response `404 Not Found`:** If listing does not exist or belongs to another user.

### 3. `POST /api/owner/listings`
- **Description:** Creates a new billboard listing with its associated address record.
- **Request Body (`BillboardListingCreateRequest`):**
  ```json
  {
    "name": "Worli Sea Face LED Digital",
    "addressLine1": "Khan Abdul Ghaffar Khan Road",
    "addressLine2": "Promenade",
    "landmark": "Opposite Coast Guard HQ",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400030",
    "type": "LED Digital",
    "widthFt": 30.0,
    "heightFt": 15.0,
    "groundHeightFt": 10.0,
    "facing": "South-Bound Traffic",
    "trafficType": "High-Speed Vehicular",
    "audienceType": "HNIs, Corporate Professionals",
    "footfall": "85,000 daily",
    "startPrice": 450000.00,
    "minBooking": "15 days",
    "discountNote": "Special inaugural rate"
  }
  ```
- **Response `201 Created`:** Serialized `BillboardListingDto` in body.
- **Response `400 Bad Request`:** Bean validation failure (`ErrorCode.VALIDATION_FAILED`).

### 4. `PATCH /api/owner/listings/{id}`
- **Description:** Partially updates an existing billboard listing and its address.
- **Request Body (`BillboardListingUpdateRequest`):**
  ```json
  {
    "startPrice": 375000.00,
    "discountNote": "15% off for annual bookings"
  }
  ```
- **Response `200 OK`:** Updated `BillboardListingDto`.
- **Response `400 Bad Request`:** If non-nullable string fields contain blank whitespace.
- **Response `404 Not Found`:** If listing does not exist or caller is unauthorized.

### 5. `DELETE /api/owner/listings/{id}`
- **Description:** Deletes the listing and its child address record.
- **Response `204 No Content`:** Successfully deleted.
- **Response `404 Not Found`:** If listing does not exist or caller is unauthorized.

---

## 5. Frontend Integration & Dashboard State Sync

- **API Client:** [`frontend/src/features/owner/ownerListingApi.js`](../../frontend/src/features/owner/ownerListingApi.js)
  - Exports async methods: `getListings()`, `getListing(id)`, `createListing(payload)`, `updateListing(id, payload)`, `deleteListing(id)`.
- **Owner Dashboard Component:** [`OwnerDashboard.jsx`](../../frontend/src/pages/OwnerDashboard/OwnerDashboard.jsx)
  - **Dynamic State Fetching:** Loads live listings on mount for authenticated users, falling back to development mocks only when unauthenticated in `DEV` mode.
  - **Search & Status Filtering:**
    - Text search filters listings in real time client-side across name, city, type, and address metadata.
    - The status dropdown (`All Status`, `Available`, `Booked`) operates client-side: all persisted listings default to `Available`, with UI session state (`statusOverrides`) supporting interactive availability toggling. Persistent status lifecycle/booking calendar synchronization is scoped for future quote/booking integration.
  - **Overview Metrics:** KPI tile "Active Listings" displays total inventory count (`listingsCount = listings.length`).
  - **Modal Interactions:**
    - `ListingFormModal` (Add & Edit modes) with form state validation and prefill.
    - `DeleteListingModal` with confirmation prompt and destructive action trigger.
    - Automated refresh trigger (`refreshListings()`) and localized toast notifications on mutation success/failure.

---

## 6. Test Suite & Verification Results

### Backend Automated Test Suites
1. **`OwnerListingServiceTest` (Unit Tests):**
   - Verified `getOwnerListings` returns mapped DTO list ordered by creation date.
   - Verified tenant isolation: `getListingById`, `updateListing`, and `deleteListing` throw `ResourceNotFoundException(BILLBOARD_NOT_FOUND)` when listing belongs to another user or ID does not exist.
   - Verified partial PATCH update logic: retains unchanged fields and updates modified fields.
   - Verified `blankToNull()` normalization for nullable fields.
   - Verified address cascade deletion upon `deleteListing`.
2. **`OwnerListingControllerTest` (MockMvc Integration Tests):**
   - Verified `GET /api/owner/listings` returns `200 OK` with JSON array.
   - Verified `POST /api/owner/listings` returns `201 Created` with valid body.
   - Verified `POST /api/owner/listings` rejects invalid payloads with `400 Bad Request`.
   - Verified `PATCH /api/owner/listings/{id}` returns `200 OK` with updated fields.
   - Verified `PATCH /api/owner/listings/{id}` with blank string on required fields returns `400 Bad Request`.
   - Verified `DELETE /api/owner/listings/{id}` returns `204 No Content`.
   - Verified endpoint security: unauthenticated requests return `401 Unauthorized`; non-owner roles return `403 Forbidden`.

```text
[INFO] Results:
[INFO] Tests run: 107, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

### Frontend Automated Test Suites
1. **`ownerListingApi.test.js` (Vitest Tests):**
   - Verified `getListings`, `getListing`, `createListing`, `updateListing`, and `deleteListing` execute correct HTTP methods and paths.
   - Verified proper payload passing and error handling.

```text
 ✓ src/features/owner/ownerListingApi.test.js (5 tests)
 Test Files  5 passed (5)
      Tests  25 passed (25)
```

### Linting & Production Build
- **ESLint:** `npm run lint` exited with **code 0 (0 errors, 0 warnings)**.
- **Vite Build:** `npm run build` completed successfully with **code 0**.
