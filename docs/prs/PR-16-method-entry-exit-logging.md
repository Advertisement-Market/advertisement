# Backend Technical Document: Method Entry/Exit Logging via AOP Aspect

- **PR Link / Ticket:** #16
- **Author:** @AshuLaley
- **Date:** 2026-09-08
- **Module / Package:** `backend/src/main/java/com/theadbasket/backend/common/logging`

---

## 1. Overview & Business Requirements
- **Goal:** Add consistent method entry/exit and timing logs across the request-handling and
  business layers without scattering boilerplate log statements in every method, and keep
  business-significant events as explicit logs at the right levels.
- **User Impact:** No functional change for any persona. This is an operability improvement that
  makes debugging, tracing, and performance analysis of the API easier for developers and
  operators.
- **Functional Requirements:**
  - Every public controller and service method logs entry, exit, and elapsed time.
  - No argument or return values are ever logged (they carry passwords, tokens, and PII).
  - Tracing is enabled in development and off in production, controllable by configuration.
  - Servlet filters are never proxied by the aspect.

---

## 2. Technical Architecture & Component Flow
- **High-Level Flow:** A single Spring AOP `@Around` advice wraps beans annotated with
  `@RestController` or `@Service`. On each public method call it logs an entry line, invokes the
  target, then logs an exit line with elapsed milliseconds — all at `DEBUG`. When `DEBUG` is
  disabled the advice short-circuits with near-zero overhead.
- **Architectural Diagram (Mermaid):**
  ```mermaid
  sequenceDiagram
      autonumber
      actor Client
      participant Proxy as Spring AOP Proxy
      participant Aspect as LoggingAspect
      participant Target as Controller / Service

      Client->>Proxy: invoke public method
      Proxy->>Aspect: around advice
      Aspect->>Aspect: log "-> Class.method()" (DEBUG)
      Aspect->>Target: joinPoint.proceed()
      Target-->>Aspect: return value (or throws)
      Aspect->>Aspect: log "<- Class.method() [N ms]" (DEBUG)
      Aspect-->>Client: return value (exception rethrown as-is)
  ```

---

## 3. API Specification & Contracts

This change is cross-cutting and adds no endpoints and no contract changes. It applies uniformly to
the existing controllers (for example `POST /api/auth/register`, `POST /api/auth/login`,
`GET /api/auth/me`).

- **Description:** Behaviour is observability only; request and response bodies are unchanged.
- **Authentication / Roles:** Unchanged.
- **Observable Effect:** In development, logs show nested entry/exit lines with timing, for example
  `-> AuthController.register()`, `-> AuthService.register()`, `<- AuthService.register() [623 ms]`.
- **Error Codes:** Unchanged; error translation still happens in `GlobalExceptionHandler`. The
  aspect only notes where an exception originated, then rethrows it untouched.

---

## 4. Database & Storage Changes
- **Flyway Migration Script:** None.
- **Tables Modified / Created:** None.
- **Index Additions & Query Impact:** None.
- **Backward Compatibility:** Fully compatible; this is a logging-only change with no persisted
  state.

---

## 5. Security & Validation
- **Input Validation:** Not applicable.
- **Access Control:** Unchanged.
- **Data Protection:** The advice logs only the declaring class, method name, and elapsed time — it
  never logs argument or return values, so passwords, JWTs, refresh tokens, and PII cannot leak
  through the trace. This was verified against a live run in which the seeded password and raw
  refresh-token values appeared zero times in the logs.

---

## 6. Performance, Reliability & Failure Modes
- **Caching Strategy:** Not applicable.
- **Transactions & Concurrency:** The advice is stateless and holds no locks; it wraps existing
  transactional boundaries without altering them.
- **Failure Modes & Fallbacks:** When the `com.theadbasket` logger is above `DEBUG` (as in
  production), the advice returns `joinPoint.proceed()` immediately after a single
  `isDebugEnabled()` check, so overhead is negligible. Exceptions from the target are always
  rethrown unchanged.
- **Scope Safety:** The pointcut excludes `@Component` beans so servlet filters (which extend
  `OncePerRequestFilter`) are never proxied — proxying a filter breaks Tomcat startup. It is also
  restricted to `execution(public * *(..))` so `Object` methods such as `toString()` are not traced.

---

## 7. Verification & Testing Evidence
- **Automated Tests Added:**
  - Unit Tests: `LoggingAspectTest.java` verifies the advice returns the target value and logs
    entry/exit at `DEBUG`, short-circuits without touching the signature when `DEBUG` is disabled,
    and rethrows exceptions transparently while logging the failure.
- **Manual Verification (cURL / HTTP Client):**
  ```bash
  curl -X POST http://localhost:8080/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"firstName":"Demo","lastName":"User","email":"demo@example.com","phone":"9800000000","role":"OWNER","password":"Passw0rd!"}'
  ```
  With the dev profile the console shows nested entry/exit lines with timings.
- **Log Output Evidence:** Sanitised sample —
  `DEBUG LoggingAspect : -> AuthController.register()` followed by
  `DEBUG LoggingAspect : <- AuthController.register() [637 ms]`, with no field values present.
