# [Feature] Availability Calendar Backend & Sync Pipeline (Phase 3 — Rev 2)

## 1. Overview & Context

* **Goal:** Enable persistent availability calendar management for billboard inventory. Replace local React state in `CalendarPage` (`OwnerDashboard.jsx`) with a robust, concurrent, cloud-synced backend.
* **Module:** `com.theadbasket.backend.availability` (plus additions in `owner` and `config`)
* **Reference Plan:** Rev 2 Specification (`availability_calendar_backend_implementation_plan_rev2.md`)

---

## 2. Key Architecture Decisions

1. **Dedicated Table Architecture & Scalar Foreign Keys (Accepted Decision):**
   * **The Trade-off:** Trading polymorphic reuse across unbuilt inventory types for true database-level referential integrity (`ON DELETE CASCADE`), clean scalar mappings, and dedicated table indexes. Future inventory types (e.g. `agency_slot_availability_blocks`) maintain their own decoupled schemas.
   * **Scalar JPA Mappings (`Long billboardId` & `Long createdBy`):** Rather than mapping `@ManyToOne` entities, `BillboardAvailabilityBlock` stores both `billboardId` and `createdBy` as scalar `Long` columns. This eliminates accidental loading of parent entity graphs during availability sync, avoids proxy initialization or N+1 queries, and cleanly powers the correlated `NOT EXISTS` search query. Database-level referential integrity is preserved via:
     * `CONSTRAINT fk_avail_billboard FOREIGN KEY (billboard_id) REFERENCES billboard_listings(id) ON DELETE CASCADE`
     * `CONSTRAINT fk_avail_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL`
   * **Resource Not Found Mapping:** Reuses the existing domain error code `ErrorCode.BILLBOARD_NOT_FOUND` (`error.billboard.notFound`) rather than adding a redundant code.
   * **Cascade vs. Audit Retention & User Deletion Safety:**
     * `created_by` uses `ON DELETE SET NULL` with a nullable `BIGINT`. In Phase 4, `CONFIRMED_BOOKING` creator is the buyer; deleting a buyer user account sets `created_by = NULL` but **keeps the booking row intact**, preventing paid dates from reopening.
     * `billboard_listings.user_id` has `ON DELETE CASCADE` (`V2__registration_profiles.sql:93`). In Phase 3, deleting a listing hard-deletes its `OWNER_BLOCKED` rows. For Phase 4 financial auditing, `OwnerListingService.deleteListing` will explicitly forbid hard-deleting listings that contain `CONFIRMED_BOOKING` records, requiring transition to `ARCHIVED` status. Furthermore, Phase 4 user deletion must be guarded (or soft-deleted) when an owner has listings with active/confirmed bookings to prevent cascading listing deletions.
   * **Column Naming:** Adopts `expiry_ts` to match the project's `V3` naming normalization.
2. **Block Types & Overlap Rules:**
   * `OWNER_BLOCKED`: Owner manual blocks (Phase 3). ETag covers `OWNER_BLOCKED` rows only in Phase 3.
   * `BOOKING_HOLD`: Checkout TTL lock (Phase 4). Overlapping owner range -> **`409 Conflict`** (`AVAILABILITY_HOLD_CONFLICT`).
   * `CONFIRMED_BOOKING`: Paid booking (Phase 4). Overlapping owner range is **trimmed** automatically with a soft warning.
3. **Optimistic Concurrency & Safe Replays:**
   * Content-derived SHA-256 ETag computed over sorted ranges `startDate|endDate;...`.
   * **Replay short-circuit:** If incoming `desiredPairs == existingPairs`, return `200 OK` immediately without checking `If-Match`.
   * If `desiredPairs != existingPairs`, enforce `If-Match` against the current ETag; mismatch returns **`412 Precondition Failed`** with standard `ApiError` envelope alongside `currentBlocks`, `etag`, and `today`.
4. **Deterministic Clock & Timezone Management:**
   * Declares an application-wide `@Bean public Clock clock() { return Clock.system(ZoneId.of("Asia/Kolkata")); }` in `com.theadbasket.backend.config.DateTimeConfig`.
   * All date and time calculations uniformly use the injected `Clock`:
     * `today = LocalDate.now(clock.withZone(ZoneId.of("Asia/Kolkata")))` (never call standalone `LocalDate.now(ZoneId...)`).
     * `now = clock.instant()`.
   * Live queries accept `:now` (`Instant now`) as an explicit parameter rather than using DB `CURRENT_TIMESTAMP`. This decouples tests from the database clock, avoids H2 vs PostgreSQL timestamp semantics differences, and enables sleep-free hold expiry testing via `Clock.fixed(...)`.
   * **Server-Provided "Today" for Frontend:** Owner GET and PUT responses return `today: "YYYY-MM-DD"`. The frontend uses this authoritative server date to disable past calendar dates, preventing client-side timezone mismatches around midnight IST.
5. **Two-List Processing Architecture (History vs. Editable):**
   * **Split once at `today`:**
     * `historyList`: Canonical pre-`today` coverage extracted from existing DB rows (all `endDate < today` rows plus the left slice `[startDate, today - 1]` of existing straddling rows). This list is read-only and carried forward directly.
     * `editableList`: Incoming ranges clamped to `[today, endDate]` (entirely past incoming ranges are dropped from this list).
   * **Process `editableList` in isolation:**
     * Merge adjacent and overlapping ranges within `editableList`.
     * Cap check: `DAYS.between(startDate, endDate) + 1 <= 730` evaluated strictly on each range in `editableList`. An entirely historical row can never trip this check.
     * Trim holds (409) and confirmed bookings (trim with warnings) strictly within `editableList`.
   * **Concatenate & Final Boundary Merge:**
     * Concatenate `historyList` and `editableList`.
     * Run **one final boundary merge** across `today` (merging if the last historical range ending at `today - 1` is contiguous with an editable range starting at `today`).
     * Yields `desiredPairs`.
6. **Past Coverage Rules & Aggregated Dropped-Days Warning:**
   * `incomingPast` is defined as **every incoming range clipped to `(-∞, today - 1]`**:
     * Entirely-past incoming ranges: `[startDate, endDate]` (`endDate < today`).
     * The past slice of any incoming straddling ranges: `[startDate, today - 1]` (`startDate < today && endDate >= today`).
   * These slices are merged into `mergedIncomingPast`.
   * **Rule 1 (Past Removal):** If any piece of `historyList` is missing from `mergedIncomingPast` (`subtractRanges(hist, mergedIncomingPast)` non-empty), emit an explicit warning (*"Cannot remove or shorten past coverage ...: past date coverage is read-only and was preserved"*), and all historical days remain blocked. (Hydrated round-trips produce zero warnings).
   * **Rule 2 (Single Aggregated Dropped Past Warning):** Any incoming day strictly before `today` that is not already in `historyList` (`subtractRanges(mergedIncomingPast, historyList)`) is dropped and produces **one aggregated warning** listing the dropped ranges, preventing multi-range payloads from spamming repeated warnings. This covers disjoint past selections, extension days beyond history, and new past segments on straddling blocks.
7. **ID Lifecycle, Boundary Merge Narrowness & Straddling Churn:**
   * **Unchanged Blocks:** Preserve original database `id` and `created_ts`.
   * **Narrow Boundary Merge:** Merging an existing past block with an incoming editable block occurs **only** when history ends on `today - 1` and the editable range starts on `today`. If there is even a 1-day gap (e.g. history ends on `today - 2`), the gap day is past and cannot be blocked, so no merge occurs. When the narrow boundary merge occurs, the old past row is replaced with the combined range and assigned a new `id`.
   * **Straddling Churn:** Any edit touching an existing straddling block replaces it with a new `(startDate, endDate)` pair, assigning a new `id`. This is an accepted trade-off of contiguous range storage. An unmodified straddling row preserves its `id`.

---

## 3. Database Schema (`V10__create_billboard_availability_blocks.sql`)

```sql
CREATE TABLE billboard_availability_blocks (
    id              BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    billboard_id    BIGINT                   NOT NULL,
    start_date      DATE                     NOT NULL,
    end_date        DATE                     NOT NULL,
    block_type      VARCHAR(30)              NOT NULL DEFAULT 'OWNER_BLOCKED',
    booking_ref_id  BIGINT,
    expiry_ts       TIMESTAMP WITH TIME ZONE,
    created_by      BIGINT,
    created_ts      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_ts      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_avail_date_order CHECK (end_date >= start_date),
    CONSTRAINT fk_avail_billboard   FOREIGN KEY (billboard_id) REFERENCES billboard_listings(id) ON DELETE CASCADE,
    CONSTRAINT fk_avail_created_by  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_avail_billboard_dates ON billboard_availability_blocks (billboard_id, start_date, end_date);
CREATE INDEX idx_avail_billboard_type  ON billboard_availability_blocks (billboard_id, block_type);
CREATE INDEX idx_avail_expiry          ON billboard_availability_blocks (expiry_ts);
```

---

## 4. API Specification

### 4.1 Owner Availability Endpoints

#### `GET /api/owner/listings/{listingId}/availability`
* **Auth:** Role `OWNER`
* **Headers:** Exposes `ETag` via CORS.
* **Response `200 OK`:** Header `ETag: "<sha256>"`
```json
{
  "blocks": [
    { "id": 1, "startDate": "2026-11-20", "endDate": "2026-11-25", "blockType": "OWNER_BLOCKED" }
  ],
  "etag": "b8f2a1c9...",
  "today": "2026-11-05"
}
```

#### `PUT /api/owner/listings/{listingId}/availability`
* **Auth:** Role `OWNER`
* **Headers:** `If-Match: "<etag>"` *(Mandatory; missing -> `428 Precondition Required`)*
* **Request Body:**
```json
{
  "ranges": [
    { "startDate": "2026-11-20", "endDate": "2026-11-25" }
  ]
}
```
* **Success `200 OK`:** Body `{ "blocks": [...], "warnings": [...], "etag": "...", "today": "2026-11-05" }` and `ETag` header.
* **Concurrency Error `412 Precondition Failed`:**
```json
{
  "timestamp": "2026-11-05T14:30:00Z",
  "status": 412,
  "error": "Precondition Failed",
  "errorCode": "AVAILABILITY_STALE_WRITE",
  "message": "Availability was modified by another session. Please refresh and try again.",
  "path": "/api/owner/listings/42/availability",
  "currentBlocks": [...],
  "etag": "newEtag...",
  "today": "2026-11-05"
}
```
* **Hold Conflict `409 Conflict`:**
```json
{
  "timestamp": "2026-11-05T14:30:00Z",
  "status": 409,
  "error": "Conflict",
  "errorCode": "AVAILABILITY_HOLD_CONFLICT",
  "message": "A checkout is in progress on these dates. This will resolve automatically in a few minutes — no action needed from you.",
  "path": "/api/owner/listings/42/availability",
  "conflictingRanges": [{ "startDate": "2026-11-22", "endDate": "2026-11-24" }]
}
```

---

### 4.2 Public Marketplace Availability

#### `GET /api/listings/{listingId}/availability`
* **Auth:** Public (`permitAll` on `GET /api/listings/*/availability`)
* **Query Params:** `from` (optional), `to` (optional)
* **Single-Location Resolution & Privacy Clamping:**
  All defaults and validation execute in `AvailabilityService.getPublicBlocks` **before** DB lookups:
  1. `today = LocalDate.now(clock.withZone(IST_ZONE))`
  2. If `to != null && to.isBefore(today)`: the window is entirely in the past $\rightarrow$ returns empty list `[]` (`200 OK` with `Cache-Control: public, max-age=300`), **not** 400.
  3. Clamp start: `effectiveFrom = (from != null && from.isAfter(today)) ? from : today` (never leaks past owner blocks or historical bookings).
  4. Default end: `effectiveTo = (to != null) ? to : effectiveFrom.plusDays(365)`
  5. Validate `effectiveFrom <= effectiveTo` (`400 AVAILABILITY_WINDOW_INVALID`)
  6. Validate `effectiveTo - effectiveFrom <= 730` (`400 AVAILABILITY_WINDOW_TOO_LARGE`)
* **Visibility & Dedicated 404 Cache-Control:**
  * If listing is not `ACTIVE` / draft: service throws `ListingNotActiveException`, which `PublicAvailabilityController` handles directly to return `404 Not Found` with `Cache-Control: public, max-age=60`.
  * Active listing: returns `200 OK` with `Cache-Control: public, max-age=300`. Contiguous blocks are merged and **clipped to `[effectiveFrom, effectiveTo]`**.
* **Edge Caching Note:** This public route queries the DB per request. In production without an edge CDN/proxy, a rate-limiting filter (e.g. Bucket4j) should front this route.

---

## 5. Bulk Sync Algorithm Lifecycle (Service Step Order)

```
[Incoming Ranges + If-Match]
           │
 0. Pre-Lock Fast Validation (Stateless, Zero DB State):
    ├── Payload size guard (> 500 ranges -> 400 AVAILABILITY_MAX_RANGES)
    └── Date order validation (startDate > endDate -> 400 AVAILABILITY_DATE_ORDER)
           │
 1. Acquire PESSIMISTIC_WRITE Lock via findByIdAndUserIdForUpdate
    ├── Listing not found -> 404 (ErrorCode.BILLBOARD_NOT_FOUND)
    └── Lock timeout -> 503 Service Unavailable + Retry-After: 5 (AvailabilityBusyException)
           │
 2. Load Existing OWNER_BLOCKED & Compute Current ETag
           │
 3. Two-List Split at Today & Past Coverage Checks:
    ├── today = LocalDate.now(clock.withZone(IST_ZONE))
    ├── Extract immutable historyList from DB: [end < today] + [start, today - 1] of straddling
    ├── Extract incomingPast: all incoming coverage clipped to (-inf, today - 1]
    ├── Past unblocks: subtractRanges(historyList, mergedIncomingPast) -> emit past-removal warning
    ├── Dropped past days: subtractRanges(mergedIncomingPast, historyList) -> emit ONE aggregated warning
    └── Extract editableList: incoming ranges clamped to [today, endDate] (past dropped)
           │
 4. Process editableList in Isolation:
    ├── Merge adjacent/overlapping ranges within editableList
    ├── 730-day cap check: DAYS.between(start, end) + 1 <= 730 on editableList ranges only
    └── Active overlaps check (WHERE expiry_ts IS NULL OR expiry_ts > :now):
        ├── Active holds? Deduplicate by ID and THROW 409 HoldConflictException
        └── Confirmed bookings? Subtract from editableList & record trim warnings
           │
 5. Concatenate & Final Boundary Merge:
    ├── historyList + processed editableList
    ├── Merge across boundary IF history.end == today - 1 AND editable.start == today
    └── Yields desiredPairs
           │
 6. Content-Equality Short-Circuit (desiredPairs == existingPairs -> Return 200 OK with today, Replay-Safe)
           │
 7. ETag Concurrency Check (currentETag not in parseETag(If-Match) -> THROW 412 with today)
           │
 8. In-Batch Diff Update:
    ├── blockRepository.deleteAllByIdInBatch(toDeleteIds) [No persistence context clear]
    ├── blockRepository.saveAll(toInsert) [Sets scalar billboardId and createdBy]
    └── entityManager.flush()
           │
 9. Reload From DB, Compute New ETag & Return 200 OK (Preserves IDs for unchanged rows)
```

---

## 6. Concurrency, Locking & Auto-Retry Specification

* **Pessimistic Locking:** Acquire `PESSIMISTIC_WRITE` on `billboard_listings` row via `findByIdAndUserIdForUpdate`. Non-owner requests fail fast without blocking concurrent owner writes.
* **Lock Timeout (5 Seconds):** HikariCP sets `connection-init-sql: "SET lock_timeout = '5s'"` on PostgreSQL. Testcontainers test configures the same init SQL dynamically via `@DynamicPropertySource`.
* **Local Catch to 503:** `AvailabilityService` catches `PessimisticLockingFailureException` and throws `AvailabilityBusyException` (503 with `Retry-After: 5`). Existing global handlers in `GlobalExceptionHandler` (`handlePessimisticLockingFailure` and `handleCannotAcquireLock`) remain **untouched** for 409 mapping.
* **Frontend 503 Auto-Retry Cap (3 Attempts):**
  * When receiving a 503 with `Retry-After: 5`, frontend displays a countdown banner (*"Calendar is busy. Retrying ({attempt}/3) in {n}s..."*) and auto-retries up to **3 times**.
  * After 3 failed attempts, the banner displays a persistent message (*"Calendar is experiencing high demand. Please try again."*) with a **"Retry Now"** button.
  * Retrying the exact same PUT payload is 100% safe due to the content-equality short-circuit and ETag concurrency check.

---

## 7. Implementation Checklist

### Backend Tasks
- [ ] **Database Migration:** Create `V10__create_billboard_availability_blocks.sql` with foreign key `ON DELETE CASCADE` on `billboard_id` and `ON DELETE SET NULL` on `created_by`.
- [ ] **Clock Bean:** Create `com.theadbasket.backend.config.DateTimeConfig` declaring `@Bean public Clock clock() { return Clock.system(ZoneId.of("Asia/Kolkata")); }`.
- [ ] **JPA Entity:** Implement `BillboardAvailabilityBlock` with scalar `Long billboardId` and scalar `Long createdBy` (nullable), using `@PrePersist` / `clock.instant()` for timestamps.
- [ ] **Repositories:**
  - Implement `BillboardAvailabilityBlockRepository` with scalar `billboardId` JPQL, `deleteAllByIdInBatch`, and `:now` parameterized queries.
  - Add `existsByIdAndUserId`, `existsByIdAndStatus`, and `findAvailableListings` to `BillboardListingRepository`.
- [ ] **Security & CORS:** In `SecurityConfig.java`:
  - Expose `ETag` and `Retry-After` in responses.
  - Explicitly allow `If-Match` request header in CORS preflights (`OPTIONS`).
  - Permit unauthenticated public `GET /api/listings/*/availability`.
- [ ] **Timezone & Configuration:** Verify `spring.jpa.properties.hibernate.jdbc.time_zone=UTC` in `application.yml` and test configs; inject `Clock` into service.
- [ ] **Exceptions & DTOs:** Add `AvailabilityBusyException` (503), `StaleAvailabilityException` (412 with `today`), `HoldConflictException` (409), `PreconditionRequiredException` (428), `ListingNotActiveException` (404 with max-age=60); implement `StaleAvailabilityError` and `HoldConflictError` matching `ApiError`.
- [ ] **Messages Catalog:** Add error messages in `messages.properties` for all 10 new `ErrorCode` values ensuring every code has a resolvable key.
- [ ] **Service Core Pipeline:** Implement `AvailabilityService`:
  - Pre-lock fast validation (size guard + date order check).
  - Acquire lock; map not found to existing `ErrorCode.BILLBOARD_NOT_FOUND`.
  - Canonical two-list architecture (`historyList` + `editableList`).
  - Past coverage checks: removal warning on missing history, single aggregated warning on dropped past days outside history.
  - Process `editableList` in isolation (merge, cap-check, trimming).
  - Final boundary merge across `today` (narrow case: `history.end == today - 1 && editable.start == today`).
  - In-batch diffing, explicit `entityManager.flush()`, reload from DB to preserve unchanged row IDs.
  - Zero-dependency SHA-256 ETags covering `OWNER_BLOCKED` rows.
  - Content-equality short-circuit returning `today`.
- [ ] **Public Discovery:** Implement `PublicAvailabilityController`:
  - Clamp window start to `max(from, today)`; if `to < today`, return empty list `[]` with `max-age=300`.
  - Validate parameters before DB query; throw `ListingNotActiveException` on inactive/draft listings.
  - Controller handles `ListingNotActiveException` returning `404 Not Found` with `Cache-Control: public, max-age=60`.
- [ ] **Owner Controller:** Implement `AvailabilityController`:
  - GET returns `blocks`, `etag`, and `today`.
  - PUT returns `blocks`, `warnings`, `etag`, and `today` with `If-Match` pre-guard (missing -> 428).
- [ ] **EXPLAIN Gate:** Benchmark `findAvailableListings` with `EXPLAIN (ANALYZE, BUFFERS)` on seeded PostgreSQL (10k listings, 50k blocks).

### Frontend Tasks
- [ ] Refactor `AvailabilityCalendar` in `calendar.jsx` into a controlled component (`value`, `onChange`, `disabled`) and disable pre-today selection using server-provided `response.data.today`.
- [ ] Integrate cloud sync in `CalendarPage` (`OwnerDashboard.jsx`):
  - Hydrate on listing selection and store `body.etag` and `body.today`.
  - Send `PUT` with `If-Match` on save.
  - **Strict Post-Save Rehydration Rule:** On PUT 200 OK, replace local calendar state **exclusively with `response.data.blocks`** and update stored `today`, never with what was sent.
  - **503 Auto-Retry Banner with Cap:** Parse `Retry-After: 5`, display countdown banner (*"Calendar is busy. Retrying ({attempt}/3) in {n}s..."*), auto-retry up to 3 times, then show manual "Retry Now" button.
  - Handle `412`: Open reconciliation modal showing `currentBlocks`, update `today`, and prompt reload.
  - Handle `409`: Highlight `conflictingRanges` in red with copy: *"A checkout is in progress on these dates. This will resolve automatically in a few minutes — no action needed from you."*
  - Display `warnings` in a toast notification.
  - **Phase 4 Read-Only Stripping:** In `setToRanges`, strip out dates belonging to `CONFIRMED_BOOKING` before sending PUT.

---

## 8. Complete Testing Checklist

* **Unit Tests (`AvailabilityServiceTest`):**
  * Subtraction math: no overlap, left partial, right partial, middle split, full cover.
  * Merging: adjacent days, cap checks (730 passes, 731 throws on editable future slice), history > 730 days passes without lockout, contained intervals using `max(endDate)`.
  * `preLock_dateOrder_throws400BeforeLock`: Range with `startDate > endDate` throws 400 immediately before acquiring lock.
  * `preLock_sizeGuard_throws400BeforeLock`: Ranges > 500 throws 400 immediately before acquiring lock.
  * `pastRange_disjoint_droppedWithWarning`: Disjoint entirely-past range is dropped with aggregated warning.
  * `pastRange_existingExtension_extensionDroppedHistorySurvives`: Existing `[Oct 1, Oct 5]`, client sends `[Oct 1, Oct 6]` with `today = Oct 10` $\rightarrow$ `[Oct 1, Oct 5]` survives, `Oct 6` is dropped with warning.
  * `pastRange_multiRange_aggregatedWarning`: Multiple past dropped ranges emit a single aggregated warning.
  * `historyOnlyPut_passesCapAndShortCircuits`: A PUT consisting only of history (all past days) passes the 730-day cap check and short-circuits to 200 OK.
  * `pastRemoval_fullHydratedSet_noWarning`: Past-removal warning does not fire when client sends the full hydrated set (including straddling rows).
  * `pastRemoval_omittedDay_emitsWarning`: Past-removal warning fires when a past day inside history is omitted.
  * `straddle_clampedToToday_emitsWarning`: A straddling range with new past days is clamped to `today` and produces a warning detailing dropped days.
  * `straddle_existingRoundTrip_sameIdNoDiff200`: Existing straddling row `[Oct 1, Nov 30]` round-trips unchanged: same ID, no diff, 200 OK, zero warnings.
  * `straddle_removeMiddleChunk_historyStaysEditableSplits`: Owner removes middle chunk of straddling row: history stays intact, editable part splits correctly.
  * `straddle_unblockPastDay_dayStaysBlockedWithWarning`: Owner tries to un-block a past day inside straddling row: day stays blocked, with warning.
  * `incomingPast_containedInSplitStraddlingLeftPiece_absorbed`: Contained inside left historical piece of existing straddling block $\rightarrow$ absorbed without warning.
  * `replay_crossingMidnight_shortCircuits`: Replay crossing IST midnight still short-circuits to 200 OK using injected `Clock`.
  * `staleClient_crossingMidnight_shortCircuitsWithoutWarning`: Stale client crossing IST midnight returns 200 with no spurious clamp warning.
  * `adjacentMerge_boundaryAtTodayMinusOneAndToday_pastRowIdChanges`: With `Clock.fixed` set to `today = history.end + 1`, boundary merge merges adjacent slices and changes row ID.
  * `adjacentMerge_oneDayGap_doesNotMerge`: With `Clock.fixed` set to `today = history.end + 2`, gap day prevents boundary merge.
  * `trimmedRange_splitIntoTwo`: Confirmed booking in the middle of editable slice splits owner range into two persisted blocks with warnings.
  * `bookingTrim_appliesOnlyToFutureSlice_preservesPastCoverage`: Historical owner block overlapping a booking in the past $\rightarrow$ historical block is untouched; zero warnings emitted.
  * `holdOverlap_deduplicatedAcrossMergedRanges`: Single hold overlapping two merged ranges is deduplicated by ID and appears once in 409 `conflictingRanges`.
  * `deterministicClock_holdExpiryAndMidnightRollover`: Hold expiry and midnight rollover tested via `Clock.fixed` without sleeps.
  * `etag_emptySet`: Empty block list returns valid 64-character SHA-256 hex (`e3b0c442...`).
  * `etag_sameContentSameHash`: Identical ranges return identical ETag.
  * `etag_orderIndependent`: Unsorted vs sorted ranges produce identical ETag.
  * `etag_deleteChangesHash`: Removing one range changes ETag.
  * `parseETag_quoted`: `"abc"` $\rightarrow$ `{"abc"}`.
  * `parseETag_unquoted`: `abc` $\rightarrow$ `{"abc"}`.
  * `parseETag_list`: `"abc", "def"` $\rightarrow$ `{"abc", "def"}`.
  * `parseETag_weakTag`: `W/"abc"` $\rightarrow$ `{"abc"}`.
  * `parseETag_star`: `*` $\rightarrow$ empty set.
  * `shortCircuit_identicalContent_200`: `desired == existing` returns 200 without checking `If-Match`.
  * `shortCircuit_staleIfMatch_identicalContent_200`: Stale `If-Match` header with identical content returns 200, not 412.
  * `holdOverlap_returns409_structuredBody`: Overlap with active `BOOKING_HOLD` throws 409 with `conflictingRanges`.
  * `confirmedBookingOverlap_trimmedWithWarning`: Overlap with `CONFIRMED_BOOKING` in future slice is trimmed with soft warning.
  * `errorCatalog_everyErrorCodeHasMessageKey`: Every ErrorCode in the application has a resolvable key in `messages.properties`.

* **Integration Tests (`AvailabilityIntegrationTest`):**
  * `springContext_loads`: Confirms Spring Boot context, `@Query`, and `@Lock` methods start up without derivation errors.
  * `deletingListing_cascadesBlocks_h2AndPostgres`: Deleting a listing cascades and removes its availability blocks on both H2 and PostgreSQL.
  * `deletingUser_setsCreatedByToNull_preservesAvailabilityBlock`: Creator user deleted $\rightarrow$ `created_by` on availability block is set to `null` while row remains intact.
  * `security_publicGet_returns200`: Unauthenticated `GET /api/listings/{id}/availability` $\rightarrow$ 200 OK.
  * `security_ownerPut_unauthenticated_returns401`: Unauthenticated `PUT /api/owner/listings/{id}/availability` $\rightarrow$ 401 Unauthorized.
  * `missingIfMatch_returns428`: PUT without `If-Match` header returns 428 Precondition Required.
  * `staleETag_returns412WithBody`: Stale ETag submitted returns 412 with `currentBlocks`, `etag`, `today`, `errorCode`, and `path`.
  * `emptyPutWithStaleETag_returns412`: Submitting empty ranges with stale ETag when blocks exist returns 412.
  * `cors_preflightPutWithIfMatch_returns200AndAllowsIfMatch`: Preflight `OPTIONS` with `Access-Control-Request-Headers: if-match` $\rightarrow$ 200 OK & allowed.
  * `cors_exposedHeaders_containsETagAndRetryAfter`: Cross-origin preflight/response exposes `ETag` and `Retry-After`.
  * `replay_samePayload_200WithNewETag`: PUT $S_0 \rightarrow S_1$; repeat identical PUT $\rightarrow$ 200 OK with ETag of $S_1$.
  * `get_etagInBodyAndHeaderMatch`: GET owner availability body `etag` equals `ETag` response header; body contains `today`.
  * `put_returnsTodayInBody`: PUT 200 response body contains server `today`.
  * `put_weakEtagHeader_realHttpRoundTrip`: Header `If-Match: W/"..."` accepted without error.
  * `concurrency_differentPayloads_oneWinsOneFails`: Two simultaneous PUTs with conflicting payloads $\rightarrow$ one 200 OK, one 412 Precondition Failed.
  * `lockTimeout_returns503WithRetryAfter`: **[Required, PostgreSQL Testcontainers]** Lock held > 5s $\rightarrow$ 503 + `Retry-After: 5`.
  * `globalExceptionHandler_409Cases_passUnchanged`: Existing `GlobalExceptionHandlerTest` 409 cases continue passing unchanged.
  * `nonOwnerPut_doesNotBlockOwnerPut`: Non-owner PUT fails fast with 404 without blocking or acquiring locks against concurrent owner PUT.
  * `unchangedPastRange_sameId`: Past block in DB + PUT preserves it $\rightarrow$ identical row ID preserved.
  * `unchangedRange_createdTsPreserved`: Unchanged row maintains original `created_ts`.
  * `nonOwnerPut_returns404`: Non-owner PUT returns 404 (using `BILLBOARD_NOT_FOUND`, preventing ID scanning).
  * `nonOwnerGet_returns404`: Non-owner GET returns 404 (using `BILLBOARD_NOT_FOUND`, preventing ID scanning).
  * `publicEndpoint_pastDates_clampedToToday_neverReturnsPastBlocks`: Explicit past query `from=2020-01-01` clamps to `today` and never returns past blocks.
  * `publicEndpoint_windowEntirelyInPast_returnsEmptyList200`: Window with `to < today` returns empty list `[]` with `Cache-Control: public, max-age=300`.
  * `publicDto_noIdNoBlockType`: Public GET response contains only `startDate` and `endDate`.
  * `publicWindow_clippedToRequestedDates`: Block spanning `[Oct 1, Dec 31]` queried with `from=Nov 1, to=Nov 30` $\rightarrow$ returned clipped to `[Nov 1, Nov 30]`.
  * `publicMerge_hidesBlockBoundary`: Contiguous blocks of different types $\rightarrow$ merged into single public range.
  * `publicEndpoint_draftListing_returns404`: Public GET on draft billboard returns 404 Not Found with explicit header `Cache-Control: public, max-age=60`.
  * `publicWindow_tooLarge_returns400`: `to - from > 730` $\rightarrow$ 400 `AVAILABILITY_WINDOW_TOO_LARGE` (evaluated before DB query).
  * `publicWindow_fromAfterTo_returns400`: `from > to` $\rightarrow$ 400 `AVAILABILITY_WINDOW_INVALID` (evaluated before DB query).
  * `publicWindow_defaultTo_isFromPlus365`: Omitting `to` parameter defaults to `from + 365 days` (via injected Clock).
  * `findAvailableListings_excludesBlockedIds`: Active block inside query window excludes billboard from discovery search.
  * `databaseMigrations_h2AndPostgresPass`: `V10MigrationTest` (H2) and `V10MigrationPostgresTest` (PostgreSQL Testcontainers) pass.
