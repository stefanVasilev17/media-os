#!/bin/sh
set -eu
umask 077

refuse() { echo "EP002_FRESH_VOICE_DB=REFUSED: $1" >&2; exit 1; }

[ "${MEDIAOS_VOICE_FRESH_BOOTSTRAP_ENABLED:-}" = "true" ] ||
  refuse "fresh isolated Voice database mode is not enabled"
[ "${RAILWAY_ENVIRONMENT_NAME:-}" = "production" ] ||
  refuse "not in the approved Railway environment"
[ "${RAILWAY_PROJECT_ID:-}" = "a2b47ba1-385e-4410-93ee-b2198492b724" ] ||
  refuse "not in the approved Railway project"
[ "${MEDIAOS_VOICE_TARGET_SERVICE_ID:-}" = "5f794554-379b-4d25-adb4-4f23bafbe45f" ] ||
  refuse "the destination PostgreSQL service ID is incorrect"
[ -n "${MEDIAOS_VOICE_TARGET_PGHOST:-}" ] &&
[ -n "${MEDIAOS_LIVE_EP001_PGHOST:-}" ] &&
[ "$MEDIAOS_VOICE_TARGET_PGHOST" != "$MEDIAOS_LIVE_EP001_PGHOST" ] ||
  refuse "the target and protected EP001 source cannot be the same"
case "$MEDIAOS_VOICE_TARGET_PGHOST" in
  *.railway.internal) ;;
  *) refuse "target must be a private Railway PostgreSQL hostname" ;;
esac
[ "${MEDIAOS_VOICE_TARGET_PGDATABASE:-}" = "mediaos_voice_clone" ] ||
  refuse "unexpected target database"
case "${MEDIAOS_VOICE_TARGET_PGPORT:-}" in
  *[!0-9]*|'') refuse "invalid destination port" ;;
esac
[ -n "${DATABASE_USER:-}" ] && [ -n "${DATABASE_PASSWORD:-}" ] ||
  refuse "database credentials are missing"
[ "${DATABASE_USER}" = "mediaos_voice_user" ] ||
  refuse "unexpected destination database user"
expected="jdbc:postgresql://${MEDIAOS_VOICE_TARGET_PGHOST}:${MEDIAOS_VOICE_TARGET_PGPORT}/mediaos_voice_clone"
[ "${DATABASE_URL:-}" = "$expected" ] ||
  refuse "JDBC connection does not match the isolated Voice database"
case "${MEDIAOS_VOICE_DB_MARKER:-}" in
  *[!0-9a-f]*|'') refuse "missing or malformed 64-hex database marker" ;;
esac
[ "${#MEDIAOS_VOICE_DB_MARKER}" -eq 64 ] ||
  refuse "marker must be exactly 64 hexadecimal characters"

[ "${MEDIAOS_WORKER_AUTH_ENABLED:-false}" != "true" ] ||
  refuse "Voice-only service must not accept rendering workers"
if [ "${MEDIAOS_EP002_VOICE_WRITES_ENABLED:-false}" = "true" ] ||
   [ "${MEDIAOS_EPISODES_CREATION_ENABLED:-false}" = "true" ] ||
   [ "${MEDIAOS_EPISODES_WRITES_ENABLED:-false}" = "true" ]; then
  [ "${MEDIAOS_GOOGLE_AUTH_ENABLED:-false}" = "true" ] ||
    refuse "Google Director authentication is required for any episode writes"
fi

export PGHOST="$MEDIAOS_VOICE_TARGET_PGHOST"
export PGPORT="$MEDIAOS_VOICE_TARGET_PGPORT"
export PGDATABASE="$MEDIAOS_VOICE_TARGET_PGDATABASE"
export PGUSER="$DATABASE_USER"
export PGPASSWORD="$DATABASE_PASSWORD"
export PGOPTIONS="-c statement_timeout=10000 -c lock_timeout=3000"

state="$(psql -X -w -A -t -v ON_ERROR_STOP=1 <<'SQL'
select case
  when to_regclass('public.mediaos_voice_database_identity') is not null then 'MARKED'
  when to_regclass('public.flyway_schema_history') is not null then 'REFUSE'
  when (select count(*) from pg_catalog.pg_class c
      join pg_catalog.pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relkind in ('r','p','v','m','f','S'))=0
    then 'EMPTY'
  else 'REFUSE' end;
SQL
)" || refuse "cannot inspect the destination database"
case "$state" in
  EMPTY)
    [ "${MEDIAOS_VOICE_AUTHORIZE_FRESH_SCHEMA:-}" = "CREATE_ONLY_ON_EMPTY_EP002_POSTGRES" ] ||
      refuse "fresh schema creation needs explicit destination-only authorization"
    psql -X -w -v ON_ERROR_STOP=1 -v marker="$MEDIAOS_VOICE_DB_MARKER" >/dev/null <<'SQL'
begin;
do $guard$
begin
  if current_database() <> 'mediaos_voice_clone'
    or to_regclass('public.flyway_schema_history') is not null
    or to_regclass('public.mediaos_voice_database_identity') is not null
    or (select count(*) from pg_catalog.pg_class c
        join pg_catalog.pg_namespace n on n.oid=c.relnamespace
        where n.nspname='public' and c.relkind in ('r','p','v','m','f','S')) <> 0 then
    raise exception 'EP002 target is not an empty isolated database';
  end if;
end
$guard$;
create table public.mediaos_voice_database_identity (
  singleton_id integer primary key check (singleton_id=1),
  marker char(64) not null,
  created_at timestamptz not null default now()
);
insert into public.mediaos_voice_database_identity (singleton_id,marker)
values (1,:'marker');
commit;
SQL
    ;;
  MARKED) ;;
  *) refuse "target is neither empty nor a marked EP002 database" ;;
esac

export PGOPTIONS="-c default_transaction_read_only=on -c statement_timeout=10000"
check="$(psql -X -w -A -t -v ON_ERROR_STOP=1 -v marker="$MEDIAOS_VOICE_DB_MARKER" <<'SQL'
select case when (select count(*) from public.mediaos_voice_database_identity
  where singleton_id=1 and marker=:'marker')=1
then 'MATCH' else 'REFUSE' end;
SQL
)" || refuse "database isolation marker inspection failed"
[ "$check" = "MATCH" ] || refuse "database marker mismatch"

unset PGOPTIONS PGPASSWORD MEDIAOS_VOICE_DB_MARKER
echo "EP002_FRESH_DB_ISOLATED_AND_MARKED=PASS"
exec java -XX:MaxRAMPercentage=70.0 -jar /app/app.jar
