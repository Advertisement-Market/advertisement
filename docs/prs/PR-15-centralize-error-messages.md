# Backend Technical Document: Centralized Error Messages (MessageSource + Error Codes)

- **PR Link / Ticket:** #15
- **Author:** @AshuLaley
- **Date:** 2026-09-08
- **Module / Package:** `backend/src/main/java/com/theadbasket/backend/common`

---

## 1. Overview & Business Requirements
- **Goal:** Remove hardcoded, user-facing error strings from throw sites. Every error now carries a
  stable, machine-readable `errorCode`, and its human-readable text is resolved from a resource
  bundle via Spring `MessageSource` (internationalisation-ready).
- **User Impact:** Affects all personas (Advertiser, Billboard Owner, Agency, Admin) indirectly —
  every API error response gains a consistent, documented shape that clients can rely on.
- **Functional Requirements:**
  - No user-facing message is a literal string at the throw site.
  - Error responses expose an `errorCode` clients can branch on instead of matching display text.
  - Message text lives in `messages.properties` and supports positional arguments.
  - Authentication failures never reveal whether an account exists.

---

## 2. Technical Architecture & Component Flow
- **High-Level Flow:** A service throws a typed exception carrying an `ErrorCode` (and optional
  arguments). `GlobalExceptionHandler` (an `@RestControllerAdvice`) catches it, resolves the text
  through `MessageSource`, and returns a consistent `ApiError` body. Unauthenticated requests that
  never reach a controller are handled the same way by `RestAuthenticationEntryPoint`.
- **Architectural Diagram (Mermaid):**
  ```mermaid
  sequenceDiagram
      autonumber
      actor Client
      participant Controller as Spring Controller
      participant Service as Domain Service
      participant Advice as GlobalExceptionHandler
      participant Messages as MessageSource

      Client->>Controller: HTTP Request
      Controller->>Service: Call domain method
      Service-->>Advice: throw AppException(ErrorCode, args)
      Advice->>Messages: resolve(code.messageKey(), args, locale)
      Messages-->>Advice: localized message
      Advice-->>Client: ApiError JSON (status, errorCode, message, path)
  ```

---

## 3. API Specification & Contracts

This change does not add endpoints; it standardises the **error envelope** returned by every
existing endpoint (for example `POST /api/auth/register`, `POST /api/auth/login`,
`GET /api/auth/me`).

- **Description:** All error responses share the `ApiError` JSON body below.
- **Authentication / Roles:** Unchanged. `GET /api/auth/me` still requires a Bearer token; the
  other auth endpoints remain `PermitAll`.
- **Error Response Body:**
  ```json
  {
    "timestamp": "2026-09-08T12:34:56.789Z",
    "status": 409,
    "error": "Conflict",
    "errorCode": "EMAIL_ALREADY_EXISTS",
    "message": "An account already exists for email: rahul@example.com",
    "path": "/api/auth/register"
  }
  ```
- **Error Codes:**
  - `400 Bad Request`: `VALIDATION_FAILED` (adds a `fieldErrors` map), `PASSWORD_LENGTH`,
    `PASSWORD_REQUIRED`, `LOGIN_EMAIL_REQUIRED`, `SESSION_INVALID`, `GOOGLE_NOT_CONFIGURED`.
  - `401 Unauthorized`: `INVALID_CREDENTIALS`, `AUTHENTICATION_REQUIRED`, `TOKEN_INVALID`,
    `TOKEN_REVOKED`, `TOKEN_EXPIRED`, and the Google sign-in failures.
  - `404 Not Found`: `ACCOUNT_NOT_FOUND`.
  - `409 Conflict`: `EMAIL_ALREADY_EXISTS`.
  - `500 Internal Server Error`: `INTERNAL_ERROR` (details are logged, never leaked).

---

## 4. Database & Storage Changes
- **Flyway Migration Script:** None. This change introduces no schema changes.
- **Tables Modified / Created:** None.
- **Index Additions & Query Impact:** None.
- **Backward Compatibility:** Fully backward compatible. The `ApiError` body only **gains** an
  `errorCode` field; existing `status`, `error`, `message`, and `path` fields are unchanged, so
  current clients keep working.

---

## 5. Security & Validation
- **Input Validation:** Bean-validation failures are funnelled into `VALIDATION_FAILED` with a
  `fieldErrors` map, preserving the existing per-field messages.
- **Access Control:** No URL or method-security rules changed.
- **Data Protection:** Spring authentication failures — including `UsernameNotFoundException` — are
  mapped to a generic `INVALID_CREDENTIALS`, so the API never discloses whether an account exists
  for a given email. `RestAuthenticationEntryPoint` returns `AUTHENTICATION_REQUIRED` with the same
  envelope for unauthenticated requests to protected endpoints.

---

## 6. Performance, Reliability & Failure Modes
- **Caching Strategy:** `MessageSource` is configured through `spring.messages` (UTF-8) with
  `use-code-as-default-message` enabled, so a missing key degrades to the code rather than throwing.
- **Transactions & Concurrency:** Not applicable; error resolution is stateless and read-only.
- **Failure Modes & Fallbacks:** If a message key is absent, the response falls back to the key
  itself instead of failing the request.

---

## 7. Verification & Testing Evidence
- **Automated Tests Added:**
  - Integration Tests: `AuthFlowIntegrationTest.java` asserts `errorCode` and the resolved
    message (including argument interpolation) for the 409, 401, 400, and no-token cases.
- **Manual Verification (cURL / HTTP Client):**
  ```bash
  curl -i http://localhost:8080/api/auth/me
  ```
  Returns `401` with `"errorCode":"AUTHENTICATION_REQUIRED"` and the resolved message.
- **Log Output Evidence:** The exception handler logs the error code (not raw copy), for example
  `Conflict on /api/auth/register: EMAIL_ALREADY_EXISTS`.
