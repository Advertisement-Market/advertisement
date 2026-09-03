-- Schedules the refresh-token cleanup entirely inside PostgreSQL via pg_cron.
--
-- Runs once, on first cluster initialisation, from /docker-entrypoint-initdb.d as the
-- POSTGRES_USER superuser, connected to POSTGRES_DB. Requires the server to have been started
-- with `shared_preload_libraries=pg_cron` and `cron.database_name=<this db>` (the override
-- compose file sets both) — otherwise CREATE EXTENSION fails.
--
-- NOTE: column is `created_at` today. After the point-1 schema rename it becomes `created_ts`;
-- update the DELETE below to match, or this job silently deletes nothing.

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Make re-runs safe: drop any prior definition of this job before (re)creating it.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'refresh-token-cleanup') THEN
        PERFORM cron.unschedule('refresh-token-cleanup');
    END IF;
END $$;

-- Daily at 03:00 (server time): delete refresh tokens older than 30 days.
SELECT cron.schedule(
    'refresh-token-cleanup',
    '0 3 * * *',
    $$DELETE FROM refresh_tokens WHERE created_at < now() - INTERVAL '30 days'$$
);
