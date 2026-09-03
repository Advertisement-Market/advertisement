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
    │   │   ├── common/       # web/ (ApiError, GlobalExceptionHandler) + exception/
    │   │   ├── user/         # User (entity), Role (enum), UserRepository
    │   │   ├── auth/         # AuthController/Service, RefreshToken(+repo/service), dto/
    │   │   ├── advertiser/   # AdvertiserProfile + CampaignBrief (+repos)
    │   │   ├── owner/        # OwnerProfile + BillboardListing (+repos)
    │   │   ├── agency/       # AgencyProfile + PortfolioItem (+repo)
    │   │   ├── registration/ # RegistrationController/Service + role request DTOs
    │   │   └── web/          # PingController (GET /api/ping)
    │   └── resources/
    │       ├── application.yml                # common config + app.jwt.*
    │       ├── application-dev.yml            # H2 (default)
    │       ├── application-prod.yml           # PostgreSQL
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

## Refresh-token cleanup

Refresh tokens are pure housekeeping once expired/rotated, so old rows are deleted after **30 days**.
The cleanup runs **inside PostgreSQL via the `pg_cron` extension** (not an app scheduler) — it fires
once in the database no matter how many backend instances run, so there's no multi-instance
duplication to guard against.

- **Job:** daily at 03:00, `DELETE FROM refresh_tokens WHERE created_at < now() - interval '30 days'`.
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
