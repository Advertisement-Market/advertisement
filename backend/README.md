# The AdBasket — Backend

REST API for The AdBasket OOH advertising marketplace. This is the **runnable skeleton**:
project structure, build + config, database migrations, and a sample module to prove the
stack end-to-end. The real domain (users/roles, billboards, agencies, tenders, bids,
campaigns, quotes) is built on top of this.

## Tech stack

| Purpose            | Technology             | Version   |
| ------------------ | ---------------------- | --------- |
| Language           | Java (LTS)             | 25        |
| Framework          | Spring Boot            | 4.1.0     |
| Build              | Maven                  | 3.9.11    |
| Security           | Spring Security        | 7.1.0     |
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
└── src/
    ├── main/
    │   ├── java/com/theadbasket/backend/
    │   │   ├── TheAdBasketApplication.java   # entry point
    │   │   ├── config/SecurityConfig.java    # baseline (permit-all, TODO: lock down)
    │   │   ├── common/web/                   # ApiError + GlobalExceptionHandler
    │   │   ├── web/PingController.java        # GET /api/ping
    │   │   └── sample/                       # sample module (entity→repo→service→controller)
    │   └── resources/
    │       ├── application.yml                # common config
    │       ├── application-dev.yml            # H2 (default)
    │       ├── application-prod.yml           # PostgreSQL
    │       └── db/migration/V1__init.sql      # Flyway baseline
    └── test/                                  # context-load + Mockito unit + Testcontainers IT
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

| Method | Path                   | Description                              |
| ------ | ---------------------- | ---------------------------------------- |
| GET    | `/api/ping`            | Liveness JSON (`{status, service, ...}`) |
| GET    | `/api/samples`         | Flyway-seeded sample rows (JPA)          |
| GET    | `/actuator/health`     | Health check                             |
| GET    | `/actuator/prometheus` | Prometheus metrics                       |
| —      | `/h2-console`          | H2 web console (dev profile only)        |

## Testing

```bash
mvn test              # unit + context tests (H2)
mvn verify            # also runs the Testcontainers IT (needs Docker)
```

- `SampleServiceTest` — Mockito unit test (no Spring context).
- `TheAdBasketApplicationTests` — context boots under H2 + Flyway.
- `SampleItemRepositoryIT` — runs against real PostgreSQL 18 via Testcontainers (**Docker required**).

## Maven wrapper (optional)

Not committed yet. To add it so contributors don't need a matching global Maven:

```bash
mvn wrapper:wrapper -Dmaven=3.9.11
```

## Notes

- Flyway owns the schema; JPA `ddl-auto` is `validate` (never mutates the DB).
- Security currently permits all requests — real authN/authZ comes with the users module.
- The `sample` package is a placeholder to be replaced by the real domain.
