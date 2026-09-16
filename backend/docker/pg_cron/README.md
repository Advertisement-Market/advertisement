# Refresh-token cleanup via pg_cron

Deletes refresh tokens older than **30 days** on a schedule, run entirely inside PostgreSQL by the
[`pg_cron`](https://github.com/citusdata/pg_cron) extension — no application scheduler. The job runs
once in the database regardless of how many backend instances are deployed, so there is no
multi-instance duplication to guard against.

## What's here

| File | Purpose |
| ---- | ------- |
| `Dockerfile` | `postgres:16-alpine` + pg_cron built from source, bakes the preload config, copies the init script |
| `init/01-refresh-token-cleanup.sql` | Creates the extension and schedules the daily DELETE |
| `../../../docker-compose.pgcron.yml` | Opt-in compose override that builds this image and preloads pg_cron |

> **Why Alpine (not Debian)?** The stock stack runs `postgres:16-alpine` (musl libc). Building
> pg_cron on a Debian `postgres:16` (glibc) and pointing it at an existing volume would change the
> cluster's collation definitions and risk silent corruption of text B-Tree indexes, so this image
> keeps the Alpine base and builds pg_cron there.

## Enabling it

The stock stack (`docker-compose.yml`) uses `postgres:16-alpine` **without** pg_cron. To turn the
cleanup on, layer the override:

```bash
docker compose -f docker-compose.yml -f docker-compose.pgcron.yml up -d --build
```

That override builds the DB from this `Dockerfile`. The image **bakes** `shared_preload_libraries =
'pg_cron'` and `cron.database_name = 'adbasket'` into the config template, so pg_cron loads on any
invocation — including a plain `docker run` — without extra flags. The override's `command:` is only
there to point `cron.database_name` at a non-default `POSTGRES_DB`.

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

- **Column name:** the DELETE targets `created_ts` (the normalized name from migration `V3`).
- **Superuser:** `CREATE EXTENSION pg_cron` needs superuser. The compose `POSTGRES_USER` (`adbasket`)
  is superuser in-container, so the init script works; a managed/hardened DB may require a DBA.
- **Retention/schedule** live in the SQL. If they should be configurable, promote them to build args
  or a templated init script.
- The app keeps `RefreshTokenRepository.deleteByCreatedAtBefore(...)` as a tested, manual-trigger
  fallback (see `RefreshTokenRepositoryTest`).
