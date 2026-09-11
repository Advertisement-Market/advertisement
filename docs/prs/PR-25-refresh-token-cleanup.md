# Backend Technical Document: Refresh-Token Cleanup (pg_cron, 30-day retention)

- **PR Link / Ticket:** #25
- **Author:** @AshuLaley
- **Date:** 2026-09-11
- **Module / Package:** `backend/src/main/java/com/theadbasket/backend/auth`

---

## 1. Overview & Business Requirements
- **Goal:** Stop the `refresh_tokens` table from growing without bound by deleting rows older than
  30 days on a schedule.
- **User Impact:** No functional change for any persona (Advertiser, Billboard Owner, Agency,
  Admin). This is an operational/housekeeping improvement that keeps the auth table small and
  queries fast.
- **Functional Requirements:**
  - Refresh tokens older than 30 days are removed automatically.
  - The cleanup runs exactly once regardless of how many backend instances are deployed.
  - The delete predicate is covered by an automated test.

---

## 2. Technical Architecture & Component Flow
- **High-Level Flow:** In production the deletion runs entirely inside PostgreSQL via the `pg_cron`
  extension on a daily schedule — no application scheduler, so it cannot double-run across
  instances. The application keeps an equivalent JPQL delete for testing and as a manual-trigger
  fallback.
- **Architectural Diagram (Mermaid):**
  ```mermaid
  sequenceDiagram
      autonumber
      participant Cron as pg_cron (in PostgreSQL)
      participant DB as refresh_tokens
      participant App as Backend (fallback path)
      participant Repo as RefreshTokenRepository

      Cron->>DB: DELETE WHERE created_ts < now() - 30 days (daily 03:00)
      DB-->>Cron: rows removed
      Note over App,Repo: Same predicate, available to the app for tests / manual runs
      App->>Repo: deleteByCreatedAtBefore(cutoff)
      Repo->>DB: DELETE (JPQL)
      DB-->>Repo: deleted count
  ```

---

## 3. API Specification & Contracts

This change adds no HTTP endpoints and no contract changes — it is a scheduled database job plus a
repository method.

- **Description:** Background maintenance only; no request/response surface.
- **Authentication / Roles:** Not applicable (runs in the database as the DB superuser via pg_cron).
- **Repository method:** `RefreshTokenRepository.deleteByCreatedAtBefore(Instant cutoff)` returns the
  number of rows deleted.
- **Error Codes:** None; the job logs its outcome to `cron.job_run_details` in PostgreSQL.

---

## 4. Database & Storage Changes
- **Flyway Migration Script:** None. The schedule is provisioned by a Postgres init script
  (`backend/docker/pg_cron/init/01-refresh-token-cleanup.sql`), not by Flyway, because
  `CREATE EXTENSION pg_cron` and `cron.schedule` require the DB superuser and a preloaded worker.
- **Tables Modified / Created:** None. Rows are deleted from the existing `refresh_tokens` table.
- **Index Additions & Query Impact:** Migration `V4__index_refresh_tokens_created_ts.sql` adds
  `idx_refresh_tokens_created_ts` on `refresh_tokens (created_ts)`, so the daily DELETE uses an index
  range scan instead of a full sequential scan.
- **Backward Compatibility:** Fully compatible; only stale rows are removed. The predicate uses the
  normalized `created_ts` column introduced by migration `V3`.

---

## 5. Security & Validation
- **Input Validation:** Not applicable.
- **Access Control:** The schedule is created by the container superuser; the application role is
  not granted extension privileges.
- **Data Protection:** Only opaque refresh-token rows are deleted; no PII handling changes.

---

## 6. Performance, Reliability & Failure Modes
- **Caching Strategy:** Not applicable.
- **Transactions & Concurrency:** Running in the database once per schedule avoids the multi-instance
  duplication an application `@Scheduled` job would need ShedLock/Quartz to prevent. The repository
  fallback is annotated `@Modifying(clearAutomatically = true)` + `@Transactional` so it runs safely
  even when called outside an existing transaction.
- **Failure Modes & Fallbacks:** If pg_cron is not enabled (for example the stock `postgres:16-alpine`
  image, or a local H2 dev database), the scheduled job simply does not run and the table is not
  pruned; the tested repository method remains available to run the same delete manually.

---

## 7. Verification & Testing Evidence
- **Automated Tests Added:**
  - Repository Tests: `RefreshTokenRepositoryTest.java` (`@DataJpaTest`, H2) backdates a token's
    `created_ts` past the retention window and asserts only it is deleted.
- **Manual Verification (cURL / HTTP Client):** Not applicable (no HTTP surface). Verify the schedule
  against a real PostgreSQL:
  ```bash
  docker exec advertisement-db psql -U adbasket -d adbasket -c "SELECT jobname, schedule FROM cron.job;"
  ```
- **Log Output Evidence:** Run history is recorded in PostgreSQL:
  ```bash
  docker exec advertisement-db psql -U adbasket -d adbasket -c \
    "SELECT jobid, status, start_time FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;"
  ```
