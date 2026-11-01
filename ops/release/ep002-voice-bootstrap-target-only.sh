#!/bin/sh
set -eu
umask 077

deny() {
  echo "EP002_VOICE_CLONE_BOOTSTRAP=REFUSED: $1" >&2
  exit 1
}

[ "${MEDIAOS_VOICE_CLONE_BOOTSTRAP_ACK:-}" = "AUTHORIZE_SEPARATE_EP002_POSTGRES_TARGET_ONLY" ] ||
  deny "explicit target-only approval missing"
[ -n "${MEDIAOS_VOICE_TARGET_PGHOST:-}" ] && [ -n "${MEDIAOS_LIVE_EP001_PGHOST:-}" ] ||
  deny "source or target host is missing"
[ "${MEDIAOS_VOICE_TARGET_PGHOST}" != "${MEDIAOS_LIVE_EP001_PGHOST}" ] ||
  deny "refusing the live EP001 PostgreSQL host"
case "$MEDIAOS_VOICE_TARGET_PGHOST" in
  *.railway.internal) ;;
  *) deny "target must be a private Railway PostgreSQL endpoint" ;;
esac
case "${MEDIAOS_VOICE_TARGET_PGPORT:-}" in
  *[!0-9]*|'') deny "invalid target PostgreSQL port" ;;
esac
[ -n "${MEDIAOS_VOICE_TARGET_PGDATABASE:-}" ] && [ -n "${DATABASE_USER:-}" ] &&
  [ -n "${DATABASE_PASSWORD:-}" ] || deny "private destination credentials missing"

case "${MEDIAOS_VOICE_DB_MARKER:-}" in
  *[!0-9a-f]*|'') deny "marker must be hexadecimal" ;;
esac
[ "${#MEDIAOS_VOICE_DB_MARKER}" -eq 64 ] || deny "marker must be 64 characters"

expected="jdbc:postgresql://${MEDIAOS_VOICE_TARGET_PGHOST}:${MEDIAOS_VOICE_TARGET_PGPORT}/${MEDIAOS_VOICE_TARGET_PGDATABASE}"
[ "${DATABASE_URL:-}" = "$expected" ] ||
  deny "application JDBC URL and approved target do not match"

export PGHOST="$MEDIAOS_VOICE_TARGET_PGHOST"
export PGPORT="$MEDIAOS_VOICE_TARGET_PGPORT"
export PGDATABASE="$MEDIAOS_VOICE_TARGET_PGDATABASE"
export PGUSER="$DATABASE_USER"
export PGPASSWORD="$DATABASE_PASSWORD"
export PGOPTIONS="-c mediaos.ep002_voice_target_bootstrap=confirmed -c statement_timeout=10000 -c lock_timeout=3000"
psql -X -w -v ON_ERROR_STOP=1 -v marker="$MEDIAOS_VOICE_DB_MARKER"   -f /workspace/ep002-voice-clone-bootstrap.sql >/dev/null
echo "EP002_VOICE_CLONE_TARGET_BOOTSTRAP=PASS"
