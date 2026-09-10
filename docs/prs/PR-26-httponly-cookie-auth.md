# Backend & Frontend Technical Document: Secure HttpOnly Cookie Token Management

- **PR Link / Ticket:** [PR #26](https://github.com/Advertisement-Market/advertisement/pull/26)
- **Author:** @vedant
- **Date:** 2026-09-11
- **Module / Package:** `backend/src/main/java/com/theadbasket/backend/auth`, `frontend/src/lib`

---

## 1. Overview & Requirements
- **Goal:** Harden refresh token storage across the application by migrating away from browser `localStorage` to browser-managed `HttpOnly`, `SameSite=Strict`, `Secure` cookies scoped strictly to `/api/auth`.
- **User Impact:** Affects all user personas (Advertiser, Billboard Owner, Agency, Member) by providing robust defense against Cross-Site Scripting (XSS) token theft while maintaining transparent silent session rehydration and zero-downtime deployment compatibility.
- **Functional Requirements:**
  - `POST /api/auth/register`, `/login`, `/google`, and role registrations emit `Set-Cookie: refreshToken=...; Path=/api/auth; HttpOnly; SameSite=Strict`.
  - Zero-downtime deployment: `AuthResponse` retains `refreshToken` in the JSON body alongside the cookie (Dual-Output) so active or cached frontend clients do not break during deployments.
  - Silent token refresh (`POST /api/auth/refresh`) and logout (`POST /api/auth/logout`) accept either cookie or request body (Dual-Input).
  - Replay of an already-rotated refresh token fails with `401 Unauthorized` and `errorCode: TOKEN_REVOKED`.
  - Frontend Axios client operates with `withCredentials: true` and automatically handles silent background refresh upon 401s.
  - Legacy plaintext tokens in client `localStorage` are proactively purged at module initialization.

---

## 2. Technical Architecture & Component Flow

```mermaid
sequenceDiagram
    autonumber
    actor Client as React Frontend
    participant Controller as AuthController
    participant CookieSvc as AuthCookieService
    participant AuthSvc as AuthService
    participant TokenSvc as RefreshTokenService
    database DB as Database (refresh_tokens)

    Client->>Controller: POST /api/auth/login (email, password)
    Controller->>AuthSvc: login(request)
    AuthSvc->>TokenSvc: create(user)
    TokenSvc->>DB: save(new RefreshToken)
    AuthSvc-->>Controller: AuthResponse(accessToken, refreshToken, user)
    Controller->>CookieSvc: createRefreshTokenCookie(refreshToken)
    CookieSvc-->>Controller: ResponseCookie(HttpOnly, Secure, SameSite=Strict, Path=/api/auth)
    Controller-->>Client: 200 OK + Set-Cookie header + JSON AuthResponse
    Note over Client: Stores accessToken in memory. Cookie held by browser.
```

---

## 3. API Specification & Contracts

### 1. `POST /api/auth/login` / `POST /api/auth/register` / `POST /api/auth/google`
- **Description:** Authenticates or creates an account, issuing access JWT and refresh cookie.
- **Authentication:** `PermitAll`
- **Response `200 OK` / `201 Created`:**
  - **Headers:** `Set-Cookie: refreshToken=<token>; Path=/api/auth; Max-Age=604800; HttpOnly; SameSite=Strict`
  - **Body:**
    ```json
    {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "4a737f9e-2144-486a-8be7-5c222ff492a1",
      "tokenType": "Bearer",
      "expiresIn": 900,
      "user": {
        "id": 1,
        "email": "user@example.com",
        "role": "MEMBER"
      }
    }
    ```

### 2. `POST /api/auth/refresh`
- **Description:** Rotates the single-use refresh token and issues a new access token.
- **Authentication:** `PermitAll` (Requires valid cookie or body token)
- **Response `200 OK`:**
  - **Headers:** `Set-Cookie: refreshToken=<new_token>; Path=/api/auth; Max-Age=604800; HttpOnly; SameSite=Strict`
  - **Body:**
    ```json
    {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "7d21b44a-38d1-4ab8-912f-2d8819e07aa1",
      "tokenType": "Bearer",
      "expiresIn": 900,
      "user": {
        "id": 1,
        "email": "user@example.com",
        "role": "MEMBER"
      }
    }
    ```
- **Error Codes:**
  - `401 Unauthorized` (`TOKEN_INVALID`): Missing or invalid token.
  - `401 Unauthorized` (`TOKEN_REVOKED`): Replay of an already-rotated or revoked token.
  - `401 Unauthorized` (`TOKEN_EXPIRED`): Token exceeded 7-day lifetime.

### 3. `POST /api/auth/logout`
- **Description:** Revokes current refresh token in database and wipes cookie.
- **Authentication:** `PermitAll` (Accepts cookie or body token)
- **Response `204 No Content`:**
  - **Headers:** `Set-Cookie: refreshToken=; Path=/api/auth; Max-Age=0; HttpOnly; SameSite=Strict`

---

## 4. Database & Storage Changes
- **Flyway Migration Script:** None required. Operates on existing `refresh_tokens` entity table.
- **Backward Compatibility:** 100% backward-compatible via Dual-Output (JSON body token preserved during deployment transition) and Dual-Input (supports JSON body fallback for non-browser clients).

---

## 5. Security & Validation
- **XSS Mitigation:** `HttpOnly: true` completely blocks JavaScript access to refresh tokens via `document.cookie`.
- **Man-in-the-Middle Mitigation:** `Secure: true` in production profile guarantees cookie is only transmitted across TLS/HTTPS connections.
- **CSRF Mitigation:** `SameSite: Strict` restricts cookie attachment on cross-origin requests; path scoping (`/api/auth`) prevents cookie exposure on business endpoints (`/api/advertiser/**`, `/api/owner/**`).
- **Zero Hardcoded Strings:** All exception sites pass typed `ErrorCode` values (`TOKEN_INVALID`, `TOKEN_REVOKED`, `TOKEN_EXPIRED`) resolved through Spring `MessageSource`.

---

## 6. Performance, Reliability & Failure Modes
- **Reverse Proxy Ingress:** Configured `server.forward-headers-strategy: framework` in `application-prod.yml` to ensure Spring Boot honors `X-Forwarded-Proto: https` behind Nginx/Cloudflare reverse proxies.
- **Concurrency & Replays:** Axios response interceptor enforces a single in-flight promise lock (`refreshInFlight`) to eliminate duplicate refresh collisions across concurrent requests within the same browser tab.
- **Configuration Immutability:** `AuthCookieProperties` deliberately excludes `@RefreshScope` to maintain static JVM security invariants across application lifecycles.

---

## 7. Verification & Testing Evidence
- **Automated Tests Added / Updated:**
  - Unit Tests: `AuthCookieServiceTest.java` (3 unit tests for cookie creation and deletion).
  - Integration Tests: `AuthFlowIntegrationTest.java` (9 full MockMvc tests verifying Set-Cookie headers, cookie-based refresh, `TOKEN_REVOKED` replay enforcement, body fallback, and logout cookie invalidation).
  - Role Registration Tests: `RegistrationFlowIntegrationTest.java` (5 tests verifying Set-Cookie issuance across Advertiser, Owner, and Agency onboarding).
  - Total Backend Suite: **77 passing tests (0 failures, 0 errors)**.
- **Frontend Automated Tests:**
  - `vitest run` &rarr; **17 passing tests**.
  - `vite build` &rarr; Clean production bundle compilation.
- **Code Style & Linters:**
  - `npm run lint` &rarr; 0 errors.
  - `npm run format:check` &rarr; All files adhere to Prettier standards.
