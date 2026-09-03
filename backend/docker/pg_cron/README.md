# Refresh-token cleanup via pg_cron

Deletes refresh tokens older than **30 days** on a schedule, run entirely inside PostgreSQL by the
[`pg_cron`](https://github.com/citusdata/pg_cron) extension — no application scheduler. The job runs
once in the database regardless of how many backend instances are deployed, so there is no
multi-instance duplication to guard against.

## What's here

| File | Purpose |
| ---- | ------- |
| `Dockerfile` | `postgres:16` + `postgresql-16-cron` (pg_cron), copies the init script |
| `init/01-refresh-token-cleanup.sql` | Creates the extension and schedules the daily DELETE |
| `../../../docker-compose.pgcron.yml` | Opt-in compose override that builds this image and preloads pg_cron |

## Enabling it

The stock stack (`docker-compose.yml`) uses `postgres:16-alpine` **without** pg_cron. To turn the
cleanup on, layer the override:

```bash
docker compose -f docker-compose.yml -f docker-compose.pgcron.yml up -d --build
```

That override:
- builds the DB from this `Dockerfile` (pg_cron installed), and
- starts Postgres with `shared_preload_libraries=pg_cron` and `cron.database_name=adbasket` — both
  are **required at startup**; they cannot be set from SQL.

The init script runs on **first cluster initialisation** only (empty data volume), as the superuser
connected to the app database, and:
1. `CREATE EXTENSION IF NOT EXISTS pg_cron;`
2. schedules job `refresh-token-cleanup` — `0 3 * * *` (daily 03:00, server time).

> On an **already-initialised** volume the init script does not re-run. Apply it once by hand:
> `docker exec -i advertisement-db psql -U adbasket -d adbasket < init/01-refresh-token-cleanup.sql`

## Verifying

```bash
# The job is registered
docker exec advertisement-db psql -U adbasket -d adbasket -c "SELECT jobid, schedule, jobname FROM cron.job;"

# Recent run history (status should be 'succeeded')
docker exec advertisement-db psql -U adbasket -d adbasket -c \
  "SELECT jobid, status, return_message, start_time FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;"
```

To exercise it without waiting a day, temporarily reschedule to every minute, insert an old-dated
token, wait, then check `cron.job_run_details` and that the row is gone:

```sql
SELECT cron.alter_job((SELECT jobid FROM cron.job WHERE jobname='refresh-token-cleanup'), schedule => '* * * * *');
```

## Caveats / open items

- **Column name:** the DELETE targets `created_at`. After the point-1 schema rename to `created_ts`,
  update `init/01-refresh-token-cleanup.sql` or the job deletes nothing.
- **Superuser:** `CREATE EXTENSION pg_cron` needs superuser. The compose `POSTGRES_USER` (`adbasket`)
  is superuser in-container, so the init script works; a managed/hardened DB may require a DBA.
- **Retention/schedule** live in the SQL. If they should be configurable, promote them to build args
  or a templated init script.
- The app keeps `RefreshTokenRepository.deleteByCreatedAtBefore(...)` as a tested, manual-trigger
  fallback (see `RefreshTokenRepositoryTest`).
