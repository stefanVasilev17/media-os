#!/bin/sh
set -eu
umask 077
[ "${RAILWAY_ENVIRONMENT_NAME:-}" = "production" ] || { echo "REFUSED_NON_PRODUCTION_ENV"; exit 1; }
[ -n "${SOURCE_HOST:-}" ] && [ -n "${SOURCE_USER:-}" ] && [ -n "${SOURCE_PASSWORD:-}" ] || { echo "REFUSED_MISSING_DB_REFERENCE"; exit 1; }
export PGHOST="$SOURCE_HOST" PGPORT="${SOURCE_PORT:-5432}" PGDATABASE="$SOURCE_DATABASE" PGUSER="$SOURCE_USER" PGPASSWORD="$SOURCE_PASSWORD"
export PGOPTIONS="-c default_transaction_read_only=on -c lock_timeout=5000 -c statement_timeout=15000"
unset SOURCE_PASSWORD
psql -X -A -t -w -v ON_ERROR_STOP=1 <<'SQL'
select 'PRODUCTION_EP002_COUNT=' || count(*) from episode where episode_number='EP002';
select 'PRODUCTION_EP001_COUNT=' || count(*) from episode where episode_number='EP001';
select 'PRODUCTION_FLYWAY_VERSION=' || version from flyway_schema_history where success=true order by installed_rank desc limit 1;
SQL
echo "PRODUCTION_EP002_CATALOG_READ_ONLY=PASS"
