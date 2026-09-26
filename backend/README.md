# The AdBasket — Backend

REST API for The AdBasket OOH advertising marketplace. This implements **authentication
(registration + login)** on a professional, layered, JWT-secured foundation. The rest of the
domain (billboards, agencies, tenders, bids, campaigns, quotes) is built on top of this.

**Auth model:** BCrypt-hashed passwords, stateless JWT **access tokens** (HS256, 15 min) +
opaque **refresh tokens** (7 days, stored in the DB, single-use / rotated on refresh).
Three account roles: `ADVERTISER`, `OWNER`, `AGENCY`.

## Tech stack

| Purpose            | Technology             | Version   |
| ------------------ | ---------------------- | --------- |
| Language           | Java (LTS)             | 25        |
| Framework          | Spring Boot            | 4.1.0     |
| Build              | Maven                  | 3.9.11    |
| Security           | Spring Security        | 7.1.0     |
| Auth tokens        | jjwt (JWT)             | 0.12.6    |
| Persistence        | Spring Data JPA        | 4.1.0     |
| Migrations         | Flyway                 | 12.4.0    |
| Metrics / observ.  | Micrometer             | 1.17.0    |
| Prod database      | PostgreSQL             | 18.4      |
| JDBC driver        | PostgreSQL JDBC        | 42.7.13   |
| Dev / test database| H2                     | 2.4.240   |
| Unit testing       | Mockito                | 5.22.0    |
| Integration testing| Testcontainers         | 1.21.4 \* |

Spring Boot's parent BOM manages Spring Security / Data JPA versions by the Boot version;
Flyway, Micrometer, H2, PostgreSQL, Mockito and Testcontainers are pinned in `pom.xml`.

\* The plan specified Testcontainers `2.0.3`, but that version exists only for the umbrella
`testcontainers-bom` — the actual `junit-jupiter` / `postgresql` modules top out at `1.21.4`,
so the modules are pinned there. All other versions resolve exactly as planned.

## Prerequisites

- **JDK 25** (Temurin 25 recommended) with `JAVA_HOME` pointing at it
- **Maven 3.9+** (or add the wrapper — see below)
- **Docker** — only for the Testcontainers integration test
- **PostgreSQL 18** — only for the `prod` profile

## Project layout

```
backend/
├── pom.xml
├── docker/pg_cron/  # pg_cron-enabled Postgres image + init SQL (refresh-token cleanup)
└── src/
    ├── main/
    │   ├── java/com/theadbasket/backend/
    │   │   ├── TheAdBasketApplication.java
    │   │   ├── config/       # SecurityConfig, JwtProperties, JpaConfig (auditing), CORS
    │   │   ├── security/     # JwtService, JwtAuthenticationFilter, SecurityUser,
    │   │   │                 #   CustomUserDetailsService, RestAuthenticationEntryPoint
    │   │   ├── common/       # web/ (ApiError, GlobalExceptionHandler) + exception/ (AppException +
    │   │   │                 #   typed subclasses) + error/ (ErrorCode catalog) + logging/ (LoggingAspect)
    │   │   ├── lov/          # Config-driven billboard lists-of-values (BillboardType/TrafficType/
    │   │   │                 #   AudienceType enums + config labels, LovService, LovController)
    │   │   ├── user/         # User (entity), Role (enum), UserRepository
    │   │   ├── auth/         # AuthController/Service, RefreshToken(+repo/service), dto/
    │   │   ├── advertiser/   # AdvertiserProfile + CampaignBrief (+repos)
    │   │   ├── owner/        # OwnerProfile + BillboardListing (+repos)
    │   │   ├── agency/       # AgencyProfile + PortfolioItem (+repo)
    │   │   ├── registration/ # RegistrationController/Service + role request DTOs
    │   │   └── web/          # PingController (GET /api/ping)
    │   └── resources/
    │       ├── application.yml                # common config + app.jwt.* + spring.messages + logging levels
    │       ├── application-dev.yml            # H2 (default)
    │       ├── application-prod.yml           # PostgreSQL
    │       ├── messages.properties            # error-message catalog (keyed by ErrorCode)
    │       └── db/migration/V1__init.sql      # Flyway: users + refresh_tokens
    └── test/                                  # unit (Mockito) + MockMvc flow (H2) + Testcontainers IT
```

## Running

Dev profile (in-memory H2, default):

```bash
cd backend
mvn spring-boot:run
```

The API starts on `http://localhost:8080`.

Production profile (PostgreSQL) — copy `.env.example` to `.env`, set the values, then:

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=prod
```

Build a runnable jar:

```bash
mvn clean package
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

## Endpoints

| Method | Path                            | Auth | Description                                        |
| ------ | ------------------------------- | ---- | ------------------------------------------------- |
| POST   | `/api/auth/register`            | —    | Basic account (used by the quick auth modal)       |
| POST   | `/api/auth/register/advertiser` | —    | Full advertiser wizard → account + profile + brief |
| POST   | `/api/auth/register/owner`      | —    | Full owner wizard → account + profile + listing    |
| POST   | `/api/auth/register/agency`     | —    | Full agency wizard → account + profile             |
| POST   | `/api/auth/login`               | —    | Authenticate → tokens + user                       |
| GET    | `/api/lov/billboard-types`      | —    | Config-driven billboard-type options (`{code,label}`) |
| GET    | `/api/lov/traffic-types`        | —    | Config-driven traffic-type options                 |
| GET    | `/api/lov/audience-types`       | —    | Config-driven audience-type options                |
| POST   | `/api/auth/refresh`    | —    | Exchange refresh token for a new pair (rotates)    |
| POST   | `/api/auth/logout`     | —    | Revoke a refresh token → `204`                     |
| GET    | `/api/auth/me`         | ✅   | Current user (Bearer access token)                 |
| GET    | `/api/ping`            | —    | Liveness JSON                                      |
| GET    | `/actuator/health`     | —    | Health check                                       |
| GET    | `/actuator/prometheus` | —    | Prometheus metrics                                 |
| —      | `/h2-console`          | —    | H2 web console (dev profile only)                  |

Example:

```bash
curl -X POST http://localhost:8080/api/auth/register -H 'Content-Type: application/json' \
  -d '{"firstName":"Rahul","lastName":"Sharma","email":"rahul@example.com",
       "phone":"+91 98765 43210","role":"ADVERTISER","password":"Passw0rd!"}'

curl http://localhost:8080/api/auth/me -H "Authorization: Bearer <accessToken>"
```

## Error responses

Every error returns a consistent `ApiError` JSON body. Messages are **not** hardcoded at the
throw site — each error carries a stable, machine-readable **`errorCode`** and its human text is
resolved from `messages.properties` via Spring's `MessageSource`.

```json
{
  "timestamp": "2026-09-04T12:34:56.789Z",
  "status": 409,
  "error": "Conflict",
  "errorCode": "EMAIL_ALREADY_EXISTS",
  "message": "An account already exists for email: rahul@example.com",
  "path": "/api/auth/register"
}
```

- **`errorCode`** — an `ErrorCode` enum name (see
  `common/error/ErrorCode.java`). Clients should branch on this, not on `message` text.
- **`message`** — display text from `messages.properties`; supports `{0}` placeholders
  interpolated from the throw site (email, role, password min/max, …).
- **`fieldErrors`** — present only for `400` bean-validation failures (`errorCode:
  VALIDATION_FAILED`); a `field → message` map. Omitted otherwise.

**Adding / changing an error:** add a constant to `ErrorCode` with a message key, add that key to
`messages.properties`, and throw the matching exception (`BadRequestException`,
`ResourceNotFoundException`, `TokenRefreshException`, `InvalidGoogleTokenException`, …) with the
code plus any args. **Localization:** drop in a `messages_<lang>.properties` (e.g.
`messages_hi.properties`) — no code change needed.

## Config-driven lookups (LOVs)

Billboard **type**, **traffic type** and **audience type** are config-driven lists-of-values rather
than free text. Each is a `LovType` enum in `lov/` whose constants are the stable **codes** stored on
`billboard_listings` (e.g. `STATIC_HOARDING`); the human-readable **labels** live in
`messages.properties` under `lov.<category>.<CODE>`, so wording and locale variants change without a
recompile.

- **Dropdown data:** `GET /api/lov/{billboard-types,traffic-types,audience-types}` returns
  `[{ "code": "STATIC_HOARDING", "label": "Static Hoarding" }, …]` (public, no auth) for the owner form.
- **Validation:** owner registration rejects any value outside the configured list with `400` and a
  specific `errorCode` (`INVALID_BILLBOARD_TYPE` / `INVALID_TRAFFIC_TYPE` / `INVALID_AUDIENCE_TYPE`).
  Submissions may send either the code or the label (case-insensitive); the canonical code is stored.
- **"Other":** each list includes an `OTHER` code. When selected, the caller's free text is sent in the
  companion field (`typeOther` / `trafficTypeOther` / `audienceTypeOther`) and persisted in the matching
  `*_other` column; for any non-`OTHER` value the companion column stays null. The companion text is
  **required** when `OTHER` is selected — a class-level `@RequiredOtherText` bean-validation constraint
  rejects an empty description with a `400` field error.
- **Adding a value:** add a constant to the enum, add its `lov.<category>.<CODE>` label to
  `messages.properties` — the endpoint and validation pick it up automatically.

> **Frontend contract:** to use `OTHER`, the client must send `type=OTHER` (or traffic/audience) plus
> the free text in the `*Other` field. Predefined selections keep working by sending the label as today.

## Logging

Method **entry/exit + elapsed time** are logged automatically for every `@RestController` and
`@Service` by `common/logging/LoggingAspect` (an AOP `@Around` advice) — no per-method boilerplate.

```
DEBUG ... LoggingAspect : → AuthController.register()
DEBUG ... LoggingAspect :   → AuthService.register()
INFO  ... AuthService    : Registered account id=1 role=OWNER (local)
DEBUG ... LoggingAspect :   ← AuthService.register() [623 ms]
DEBUG ... LoggingAspect : ← AuthController.register() [637 ms]
```

- **Never logs argument or return values** — requests carry passwords, JWTs, refresh tokens, and
  PII, so only class/method/timing are recorded. Business-significant events stay as explicit
  `INFO`/`WARN` logs in the services (registration, login, token issuance, …).
- **Level-driven:** entry/exit is `DEBUG`. The `com.theadbasket` logger is **DEBUG in dev**, **INFO
  in prod** (so the tracing is off in prod); override anywhere with `LOG_LEVEL_APP`.
- Servlet filters are intentionally out of scope (proxying a filter breaks it), so the aspect
  targets `@RestController` + `@Service` only (public methods).

## Refresh-token cleanup

Refresh tokens are pure housekeeping once expired/rotated, so old rows are deleted after **30 days**.
The cleanup runs **inside PostgreSQL via the `pg_cron` extension** (not an app scheduler) — it fires
once in the database no matter how many backend instances run, so there's no multi-instance
duplication to guard against.

- **Job:** daily at 03:00, `DELETE FROM refresh_tokens WHERE created_ts < now() - interval '30 days'`.
  Migration `V4` indexes `created_ts` so the sweep uses an index range scan, not a full table scan.
- **Enabling it** (opt-in; the stock `postgres:16-alpine` has no pg_cron):
  ```bash
  docker compose -f docker-compose.yml -f docker-compose.pgcron.yml up -d --build
  ```
  See [`docker/pg_cron/README.md`](docker/pg_cron/README.md) for the image, `shared_preload_libraries`
  requirement, and verification queries.
- **App side:** `RefreshTokenRepository.deleteByCreatedAtBefore(cutoff)` holds the same DELETE
  predicate as a tested (`RefreshTokenRepositoryTest`), manual-trigger fallback.
- Dev/test run on **H2**, which has no pg_cron — the scheduled job exists only against PostgreSQL;
  the predicate itself is covered by the H2 repository test.

## Testing

```bash
mvn test              # unit + context tests (H2)
mvn verify            # also runs the Testcontainers IT (needs Docker)
```

- `AuthServiceTest` — Mockito unit test for registration (no Spring context).
- `AuthFlowIntegrationTest` — full MockMvc flow (register → login → `/me`, 409/401/400 cases) on H2.
- `RefreshTokenRepositoryTest` — `@DataJpaTest` (H2) for the age-based cleanup DELETE predicate.
- `TheAdBasketApplicationTests` — context boots under H2 + Flyway.
- `UserRepositoryIT` — runs against real PostgreSQL 18 via Testcontainers (**Docker required**).

## Maven wrapper (optional)

Not committed yet. To add it so contributors don't need a matching global Maven:

```bash
mvn wrapper:wrapper -Dmaven=3.9.11
```

## Notes

- Flyway owns the schema; JPA `ddl-auto` is `validate` (never mutates the DB).
- Public paths: the auth endpoints (except `/me`), `/api/ping`, actuator health/metrics, H2 console.
  Everything else requires a valid Bearer token; unauthenticated requests get a JSON `401`.
- **Set `JWT_SECRET`** (>= 32 chars) in every non-dev environment — the default is dev-only.
- CORS is open to `http://localhost:5173` (Vite) for the upcoming frontend integration.
- Passwords are BCrypt-hashed and never returned; refresh tokens are rotated (single-use).
- Login and other Spring authentication failures return a generic `INVALID_CREDENTIALS` error so
  the API never reveals whether an account exists for a given email.
