#!/bin/sh
set -eu
umask 077

die() {
  echo "EP002_VOICE_ISOLATION=REFUSED: $1" >&2
  exit 1
}

[ "${MEDIAOS_VOICE_CLONE_CANARY_ENABLED:-}" = "true" ] ||
  die "isolated clone mode was not explicitly enabled"
[ -n "${MEDIAOS_VOICE_TARGET_PGHOST:-}" ] ||
  die "target PostgreSQL hostname not provided"
[ -n "${MEDIAOS_LIVE_EP001_PGHOST:-}" ] ||
  die "live EP001 PostgreSQL hostname not provided"
[ "${MEDIAOS_VOICE_TARGET_PGHOST}" != "${MEDIAOS_LIVE_EP001_PGHOST}" ] ||
  die "voice database hostname is identical to live EP001"
[ -n "${MEDIAOS_VOICE_TARGET_PGDATABASE:-}" ] ||
  die "target database name not provided"
[ -n "${MEDIAOS_VOICE_TARGET_PGPORT:-}" ] ||
  die "target port not provided"
[ -n "${DATABASE_USER:-}" ] && [ -n "${DATABASE_PASSWORD:-}" ] ||
  die "isolated database credentials not provided"

case "${MEDIAOS_VOICE_TARGET_PGPORT}" in
  *[!0-9]*|'') die "invalid PostgreSQL port" ;;
esac

expected_url="jdbc:postgresql://${MEDIAOS_VOICE_TARGET_PGHOST}:${MEDIAOS_VOICE_TARGET_PGPORT}/${MEDIAOS_VOICE_TARGET_PGDATABASE}"
[ "${DATABASE_URL:-}" = "$expected_url" ] ||
  die "application JDBC URL does not match the explicitly declared isolated database"

case "${MEDIAOS_VOICE_DB_MARKER:-}" in
  *[!0-9a-f]*|'') die "missing or invalid database isolation marker" ;;
esac
[ "${#MEDIAOS_VOICE_DB_MARKER}" -eq 64 ] ||
  die "isolation marker must be 64 lowercase hexadecimal characters"

[ "${MEDIAOS_WORKER_AUTH_ENABLED:-false}" != "true" ] ||
  die "this Voice-only service must not accept render worker workload credentials"

if [ "${MEDIAOS_EP002_VOICE_WRITES_ENABLED:-false}" = "true" ] ||
   [ "${MEDIAOS_EPISODES_CREATION_ENABLED:-false}" = "true" ] ||
   [ "${MEDIAOS_EPISODES_WRITES_ENABLED:-false}" = "true" ]; then
  [ "${MEDIAOS_GOOGLE_AUTH_ENABLED:-false}" = "true" ] ||
    die "Director Google authentication must be enabled before production episode writes"
fi

export PGHOST="$MEDIAOS_VOICE_TARGET_PGHOST"
export PGPORT="$MEDIAOS_VOICE_TARGET_PGPORT"
export PGDATABASE="$MEDIAOS_VOICE_TARGET_PGDATABASE"
export PGUSER="$DATABASE_USER"
export PGPASSWORD="$DATABASE_PASSWORD"
export PGOPTIONS="-c default_transaction_read_only=on -c statement_timeout=10000 -c lock_timeout=3000"

verified="$(psql -X -w -A -t -v ON_ERROR_STOP=1 -v marker="$MEDIAOS_VOICE_DB_MARKER" <<'SQL'
select case when
  (select count(*) from mediaos_voice_isolated_bootstrap
   where singleton_id=1 and marker=:'marker')=1
  and (select count(*) from episode where episode_number='EP001')=1
  then 'OK' else 'NO' end;
SQL
)" || die "database read-only marker verification failed"
[ "$verified" = "OK" ] ||
  die "database isolation marker or EP001 reference invariant failed"

unset PGPASSWORD PGOPTIONS MEDIAOS_VOICE_DB_MARKER
echo "EP002_VOICE_ISOLATED_DATABASE_PREFLIGHT=PASS"
exec java -XX:MaxRAMPercentage=70.0 -jar /app/app.jar
