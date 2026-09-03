# PostgreSQL 16 with the pg_cron extension, so the refresh-token cleanup can run inside the
# database (no application scheduler). Base is the Debian image (not -alpine) because pg_cron is
# packaged for it via the PostgreSQL APT repo the official image already configures.
#
# shared_preload_libraries / cron.database_name must still be passed at startup (see the override
# compose file's `command:`) — they cannot be baked in here.
FROM postgres:16

RUN apt-get update \
    && apt-get install -y --no-install-recommends postgresql-16-cron \
    && rm -rf /var/lib/apt/lists/*

# Runs once on first cluster init (as the superuser, connected to POSTGRES_DB).
COPY init/ /docker-entrypoint-initdb.d/
