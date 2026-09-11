# PostgreSQL 16 (Alpine) with the pg_cron extension, so the refresh-token cleanup can run inside
# the database (no application scheduler).
#
# IMPORTANT: the base is postgres:16-alpine — the SAME image the stock stack uses — so an existing
# data directory keeps its musl/glibc collation definitions. Switching an initialised volume
# between Alpine (musl) and Debian (glibc) changes collation and risks silent corruption of B-Tree
# text indexes, so we build pg_cron on Alpine from source rather than switching distributions.
FROM postgres:16-alpine

# pg_cron 1.6.x supports PostgreSQL 16. Built without LLVM (JIT bitcode is optional for extensions)
# to avoid clang/llvm version matching; build deps are dropped afterwards to keep the image slim.
ARG PG_CRON_VERSION=v1.6.4
RUN set -eux; \
    apk add --no-cache --virtual .build-deps build-base git; \
    git clone --depth 1 --branch "${PG_CRON_VERSION}" https://github.com/citusdata/pg_cron.git /tmp/pg_cron; \
    make -C /tmp/pg_cron with_llvm=no; \
    make -C /tmp/pg_cron with_llvm=no install; \
    rm -rf /tmp/pg_cron; \
    apk del .build-deps

# Bake the preload settings into the config template so the pg_cron background worker loads on ANY
# invocation — `docker run` as well as Compose. (shared_preload_libraries needs a server start, so
# setting it only via a Compose `command:` breaks a plain `docker run`.) These are applied to fresh
# clusters at initdb time; cron.database_name defaults to the app database.
RUN set -eux; \
    { \
      echo ""; \
      echo "# pg_cron (refresh-token cleanup)"; \
      echo "shared_preload_libraries = 'pg_cron'"; \
      echo "cron.database_name = 'adbasket'"; \
    } >> "$(pg_config --sharedir)/postgresql.conf.sample"

# Runs once on first cluster init (as the superuser, connected to POSTGRES_DB).
COPY init/ /docker-entrypoint-initdb.d/
