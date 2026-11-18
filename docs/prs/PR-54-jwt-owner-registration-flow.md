# Full-Stack Technical Document: Authenticated Owner Registration & Single-Flight JWT Refresh Flow

- **PR Link / Ticket:** [PR #54](https://github.com/Advertisement-Market/advertisement/pull/54)
- **Author:** @vedant
- **Date:** 2026-11-19
- **Module / Package:** `backend/src/main/java/com/theadbasket/backend/registration`, `backend/src/main/java/com/theadbasket/backend/auth`, `frontend/src/lib`, `frontend/src/pages/OwnerRegister`

---

## 1. Overview & Problem Statement

### 1.1 Problem Statement
When a user registers on The AdBasket via **"Join Free"**, they receive the default `MEMBER` role. When this authenticated member navigated to **"List Your Billboard"** (`/owners/register`) to onboard as an inventory owner:
1. Submissions previously targeted `POST /api/auth/register/owner`, a public `permitAll()` endpoint.
2. If the user spent more than 15 minutes completing the comprehensive 7-step owner registration wizard, their stateless access JWT expired.
3. Because `/api/auth/register/owner` was configured with `permitAll()`, `JwtAuthenticationFilter` silently ignored the expired token and proceeded with `principal = null`.
4. `AccountRegistrar` treated the request as an anonymous registration, attempting to create a duplicate user with the member's email, which crashed with `409 EMAIL_ALREADY_EXISTS` (or `400 PASSWORD_REQUIRED` if passwords were omitted).
5. Even if a `401` had been returned, `apiClient.js` skipped refresh for all routes containing `/api/auth/`, leaving the user stranded without automatic recovery.

### 1.2 Solution Goals
- Separate **anonymous sign-up** (`POST /api/auth/register/owner`) from **authenticated promotion** (`POST /api/onboarding/owner`).
- Require authentication on `/api/onboarding/**`, guaranteeing Spring Security's `RestAuthenticationEntryPoint` emits `401 Unauthorized` (`errorCode: AUTHENTICATION_REQUIRED`) upon JWT expiry.
- Enable single-flight Axios refresh and replay for `/api/onboarding/**` and JSON/`FormData` submissions, protected by a Web Locks cross-tab mutex (`navigator.locks`).
- Secure the backend role promotion with a pessimistic row lock (`SELECT ... FOR UPDATE` with 5s lock timeout), state machine validation, entity flushing before bulk token revocation, and atomic issue of fresh `OWNER` credentials.
- Provide robust client-side recovery for lost 201 responses (`409 ALREADY_REGISTERED`), same-session anonymous-to-authenticated draft handoff, and partial media failure recovery.

---

## 2. Technical Architecture & Component Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Signed-In Member (Expired JWT)
    participant Wizard as OwnerRegister.jsx
    participant Client as apiClient.js
    participant Sec as Spring Security (RestAuthenticationEntryPoint)
    participant Onboard as OnboardingController
    participant Svc as OwnerRegistrationService
    database DB as PostgreSQL

    User->>Wizard: Submit Step 7 (user != null)
    Wizard->>Client: POST /api/onboarding/owner (Bearer expiredJwt)
    Client->>Sec: Authenticated endpoint check
    Sec-->>Client: 401 Unauthorized (errorCode: AUTHENTICATION_REQUIRED)

    rect rgb(240, 248, 255)
        note right of Client: Web Locks Mutex + Single-Flight Refresh & Replay
        Client->>Sec: POST /api/auth/refresh (HttpOnly cookie, _allowRefresh: true)
        Sec-->>Client: 200 OK { accessToken: freshMemberJwt, user }
        Client->>Client: authStorage.setSession(data) & strip stale Authorization header
    end

    Client->>Sec: Replay POST /api/onboarding/owner (Bearer freshMemberJwt)
    Sec->>Onboard: principal = AuthenticatedUser(id, email, MEMBER)
    Onboard->>Svc: onboardMember(principal.id(), request)

    rect rgb(245, 255, 245)
        note right of Svc: Single @Transactional Boundary
        Svc->>DB: SELECT * FROM users WHERE id = ? FOR UPDATE (5s timeout)
        Svc->>Svc: Guard missing(401), disabled(403), OWNER(409 ALREADY_REGISTERED), other(409 ROLE_CONFLICT)
        Svc->>DB: Promote role = OWNER (+ safe name/blank-phone fill) & saveAndFlush(user)
        Svc->>DB: Save OwnerProfile, BillboardListing (DRAFT), AvailabilityBlocks, Notification
        Svc->>DB: 1) Revoke all active MEMBER refresh tokens (flushAutomatically=true)
        Svc->>DB: 2) Mint fresh OWNER JWT + new refresh token
    end

    Svc-->>Onboard: 201 Created + Set-Cookie (rotated refreshToken)
    Onboard-->>Client: AuthResponse { ownerJwt, user(OWNER), initialListingId }
    Client->>Wizard: AuthProvider.applySession() updates authStorage & user state
    Wizard->>Client: POST /api/owner/listings/{id}/media/sync & /submit (with OWNER JWT)
    Wizard-->>User: SuccessScreen (or resumable Draft recovery screen if media fails)
```

---

## 3. API Specifications & Contracts

### 3.1 Authenticated Owner Promotion (`POST /api/onboarding/owner`)
- **Authentication:** Required (`Bearer <access-token>`). Missing, expired, or malformed tokens yield `401 Unauthorized` (`errorCode: AUTHENTICATION_REQUIRED`).
- **Request Body (`OwnerOnboardingRequest`):**
  - Strictly omits `accountEmail` and `password`. Identity is taken exclusively from `@AuthenticationPrincipal AuthenticatedUser`.
  - Accepts business, billboard, pricing, and legal fields identical to owner registration.
- **Success Response (`201 Created`):**
  - **Headers:** `Set-Cookie: refreshToken=<rotated_token>; Path=/api/auth; HttpOnly; SameSite=Strict`
  - **Body (`AuthResponse`):**
    ```json
    {
      "accessToken": "eyJhbGciOiJIUzI1Ni...",
      "tokenType": "Bearer",
      "expiresIn": 900,
      "user": {
        "id": 42,
        "email": "member@example.com",
        "firstName": "Jane",
        "lastName": "Doe",
        "phone": "+919876543210",
        "role": "OWNER"
      },
      "initialListingId": 101
    }
    ```
- **Error Responses:**
  - `401 Unauthorized` (`SESSION_INVALID`): User not found in database.
  - `403 Forbidden` (`ACCOUNT_DISABLED`): User account is disabled.
  - `409 Conflict` (`ALREADY_REGISTERED`): Account is already an `OWNER`.
  - `409 Conflict` (`ROLE_CONFLICT`): Account has an incompatible role (`ADVERTISER`, `AGENCY`, `ADMIN`).

### 3.2 Anonymous Owner Registration (`POST /api/auth/register/owner`)
- **Authentication:** `PermitAll` (strictly anonymous; any `Authorization` header is ignored).
- **Request Body (`OwnerRegistrationRequest`):** Requires `accountEmail` and `password`.
- **Response:** `201 Created` with `AuthResponse` + HttpOnly refresh cookie.
- **Error Responses:**
  - `409 Conflict` (`EMAIL_ALREADY_EXISTS`): Uniform message (`An account already exists for {0}. Please sign in to continue.`).

### 3.3 Silent Token Refresh (`POST /api/auth/refresh`)
- **Behavior:** Revokes presented refresh token and issues rotated token pair.
- **Hardening:**
  - `@Transactional(noRollbackFor = TokenRefreshException.class)` ensures revocation commits even if user is disabled.
  - If `!user.isEnabled()`, revokes token, clears cookie, and throws `401 ACCOUNT_DISABLED`.

---

## 4. Backend Implementation Details

### 4.1 Security Configuration
- In `SecurityConfig.java`, added `.requestMatchers("/api/onboarding/**").authenticated()` immediately after `PUBLIC_PATHS` and prior to role-scoped rules (`/api/owner/**`).
- Paired with `RestAuthenticationEntryPoint` to guarantee pure JSON `401 AUTHENTICATION_REQUIRED` responses.

### 4.2 Concurrency & State Machine
- `UserRepository.findByIdForUpdate(Long id)` applies `@Lock(LockModeType.PESSIMISTIC_WRITE)` with `@QueryHints(@QueryHint(name = "jakarta.persistence.lock.timeout", value = "5000"))`.
- In `OwnerRegistrationService.onboardMember`:
  - Enforces role state transitions atomically.
  - Profile sync fills `user.phone` only if currently blank (e.g., Google OAuth users), never overwriting existing phone numbers.
  - `saveAndFlush(user)` guarantees role promotion is flushed before calling `RefreshTokenService.revokeAllForUser(user.getId())`.
  - `RefreshTokenRepository.revokeAllActiveByUserId(Long userId)` uses `@Modifying(flushAutomatically = true, clearAutomatically = false)` so user entity state remains managed.
  - Revocation occurs strictly prior to minting fresh `OWNER` tokens via `authService.issueTokensFor(...)`.

### 4.3 Constraint Exception Unwrapping
- `GlobalExceptionHandler.java` inspects cause chains of `DataIntegrityViolationException` and `TransactionSystemException`.
- Recursively traverses causes checking PostgreSQL driver `SQLException` (code `23505`), `ConstraintViolationException`, and constraint names:
  - `uq_users_email` -> `409 EMAIL_ALREADY_EXISTS`
  - `uq_owner_profiles_user` -> `409 ALREADY_REGISTERED`

---

## 5. Frontend Implementation Details

### 5.1 Axios Refresh & Replay
- `apiClient.js` adopts a **default-skip** model for `/api/auth/*`. Only requests with `{ _allowRefresh: true }` (such as `authApi.me()`) are refresh-eligible.
- **Cross-Tab Web Locks Mutex:** `navigator.locks.request('ab_auth_refresh', ...)` prevents multi-tab refresh races and avoids tripping refresh-token reuse detection. Waiting tabs inspect `authStorage.getAccessToken()` upon acquiring the lock; if another tab already refreshed, they immediately replay with the fresh token.
- **Transient Error Preservation:** Network errors, timeouts, or 5xx responses from `/api/auth/refresh` do not clear `authStorage` or wipe wizard drafts. Only definitive `401` or `403` responses trigger `clearSessionLocal` and session expiration.
- **Boot-Time Guard:** Anonymous visitors triggering `401` on `/api/auth/me` do not fire `onSessionExpired` or display false toasts.
- Stale `Authorization` headers are safely stripped across both Axios 1.x `AxiosHeaders` and plain objects before replay.

### 5.2 Cross-Tab Role Synchronization
- In `AuthProvider.jsx`, a `window.addEventListener('storage', ...)` listener synchronizes user state across open browser tabs when `ab_user` updates in `localStorage`.
- Background tabs transition to `OWNER` immediately without waiting for a 15-minute token expiry.

### 5.3 Allowlisted Draft Storage & Recovery
- `ownerDraftStorage.js` enforces an explicit allowlist (`OWNER_DRAFT_ALLOWLIST`) excluding passwords, terms acceptance, and `File` instances.
- Stored under identity-scoped keys in `sessionStorage` (`ab_owner_register_draft:u:<userId>` / `:anon`) with a 30-minute sliding TTL and an absolute 2-hour hard cap (`OWNER_DRAFT_MAX_AGE_MS`).
- **Anonymous Handoff Guard:** `migrateAnonDraftToUser` runs only when `pendingAnonHandoffRef` was set during the current wizard session (after anonymous `409 EMAIL_ALREADY_EXISTS`). Unrelated sign-ins discard `:anon` and load only the signed-in user's draft, using `replaceData()` to avoid retaining prior form data.
- **Lost-201 Recovery:** If a 201 response was dropped, the subsequent submission returns `409 ALREADY_REGISTERED`. The client clears the stale member session, prompts the user to sign in, and routes to `/owners/listings` once `user.role === 'OWNER'` is rehydrated.
- **Partial Media Failure Recovery:** If post-promotion media sync fails, the user is presented with a resumable draft screen linking directly to `/owners/listings/:id/edit`.

---

## 6. Verification & Automated Test Coverage

| Test Suite | Command | Result | Details |
| :--- | :--- | :--- | :--- |
| **Backend Integration & Unit** | `cd backend; mvn test` | **382 run, 0 failed, 0 errors** (7 Docker ITs skipped locally) | Full verification of role promotion, token rotation, lock timeout, constraint mapping, and security rules |
| **PostgreSQL Concurrency IT** | `OwnerOnboardingConcurrencyIT.java` | Verified in CI via Docker | Race condition test under Hikari pool contention; asserts `1 × 201`, `1 × 409`, and 0 orphan rows |
| **CI Concurrency Gate** | `.github/workflows/ci.yml` | Step asserts `skipped="0"` | CI fails if `OwnerOnboardingConcurrencyIT` is skipped |
| **Frontend Unit & Component** | `cd frontend; npm test -- --run` | **17 test files, 227 / 227 passed** | 401 refresh/replay, Web Locks mutex, transient error preservation, draft storage, and recovery flows |
| **Frontend Code Style** | `cd frontend; npm run format:check` | **Passed (All files Prettier-compliant)** | Clean style verification across all frontend files |
| **Frontend Lint** | `cd frontend; npm run lint` | **Passed (0 errors, 0 warnings)** | Full ESLint compliance |
| **Frontend Production Build** | `cd frontend; npm run build` | **Passed (`1.10s`)** | Vite production bundle created cleanly |

---

## 7. Scope Boundaries & Deferred Work

1. **Email & Phone OTP Verification:** Dedicated PR will implement backend OTP verification services. Demo OTP (`123456`) remains active in Step 1 to preserve UI flow.
2. **Phone Normalization & Unique Migration (`V11`):** Dedicated PR will introduce canonical phone formatting and database-level unique indexing.
3. **Advertiser & Agency Onboarding Parity:** Dedicated PR will provide `/api/onboarding/advertiser` and `/api/onboarding/agency` using the same patterns established in this PR.
4. **Single-Role Architecture:** The platform intentionally enforces a single role (`MEMBER`, `ADVERTISER`, `OWNER`, `AGENCY`, `ADMIN`) per account at this stage. `ROLE_CONFLICT` prevents role overwrites.
