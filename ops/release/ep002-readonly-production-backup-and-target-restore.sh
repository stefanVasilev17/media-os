#!/usr/bin/env bash
set -euo pipefail
umask 077

readonly PROD_SERVICE="5573c99f-dce7-4798-93f1-1b44ce594282"
readonly CLONE_SERVICE="5f794554-379b-4d25-adb4-4f23bafbe45f"
readonly SOURCE_EPISODE="22222222-2222-2222-2222-222222222222"
readonly BACKUP_DIR="/tmp/mediaos-production-clone"
readonly DUMP="$BACKUP_DIR/source.dump"
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

refuse() { echo "EP002_CLONE=REFUSED: $1"; exit 1; }
[ "${RAILWAY_ENVIRONMENT_NAME:-}" = "production" ] || refuse "not in production environment"
[ "${RAILWAY_PROJECT_ID:-}" = "a2b47ba1-385e-4410-93ee-b2198492b724" ] || refuse "unexpected project"
[ "${SOURCE_SERVICE_ID:-}" = "$PROD_SERVICE" ] || refuse "source service identity mismatch"
[ "${TARGET_SERVICE_ID:-}" = "$CLONE_SERVICE" ] || refuse "target service identity mismatch"
[ "${CLONE_APPROVAL:-}" = "READ_ONLY_SOURCE_RESTORE_ONLY_TO_NEW_EP002_VOLUME" ] || refuse "clone authorization missing"
[ "${SOURCE_HOST:-}" != "${TARGET_HOST:-}" ] || refuse "source and destination host are identical"
[ "${SOURCE_HOST:-}" != "" ] && [ "${TARGET_HOST:-}" != "" ] || refuse "missing private endpoints"
case "$SOURCE_HOST" in *.railway.internal) ;; *) refuse "source hostname not private" ;; esac
case "$TARGET_HOST" in *.railway.internal) ;; *) refuse "target hostname not private" ;; esac
[ "${TARGET_DATABASE:-}" = "mediaos_voice_clone" ] || refuse "unexpected target database"
[ "${SOURCE_DATABASE:-}" != "" ] || refuse "source database missing"
[ "${TARGET_USER:-}" != "${SOURCE_USER:-}" ] || refuse "database users must be distinct"
[ "${TARGET_PASSWORD:-}" != "" ] && [ "${SOURCE_PASSWORD:-}" != "" ] || refuse "credentials not available"

for port in "${SOURCE_PORT:-}" "${TARGET_PORT:-}"; do
  [[ "$port" =~ ^[0-9]{2,5}$ ]] || refuse "invalid database port"
done

source_psql() {
  PGHOST="$SOURCE_HOST" PGPORT="$SOURCE_PORT" PGDATABASE="$SOURCE_DATABASE" \
  PGUSER="$SOURCE_USER" PGPASSWORD="$SOURCE_PASSWORD" \
  PGOPTIONS="-c default_transaction_read_only=on -c statement_timeout=15000 -c lock_timeout=3000" \
  psql -X -w -A -t -v ON_ERROR_STOP=1 "$@"
}
target_psql_readonly() {
  PGHOST="$TARGET_HOST" PGPORT="$TARGET_PORT" PGDATABASE="$TARGET_DATABASE" \
  PGUSER="$TARGET_USER" PGPASSWORD="$TARGET_PASSWORD" \
  PGOPTIONS="-c default_transaction_read_only=on -c statement_timeout=15000 -c lock_timeout=3000" \
  psql -X -w -A -t -v ON_ERROR_STOP=1 "$@"
}
episode_fingerprints() {
  cat <<'SQL'
select count(*)::text from episode where id='22222222-2222-2222-2222-222222222222' and episode_number='EP001';
select md5(to_jsonb(e)::text) from episode e where id='22222222-2222-2222-2222-222222222222';
select coalesce(md5(string_agg(md5(to_jsonb(s)::text), ',' order by md5(to_jsonb(s)::text))), 'EMPTY')
  from studio_shot s where episode_id='22222222-2222-2222-2222-222222222222';
select coalesce(md5(string_agg(md5(to_jsonb(c)::text), ',' order by md5(to_jsonb(c)::text))), 'EMPTY')
  from studio_clip c join studio_shot s on s.id=c.shot_id
  where s.episode_id='22222222-2222-2222-2222-222222222222';
select coalesce(md5(string_agg(md5(to_jsonb(h)::text), ',' order by md5(to_jsonb(h)::text))), 'EMPTY')
  from studio_clip_revision_history h join studio_clip c on c.id=h.clip_id
  join studio_shot s on s.id=c.shot_id
  where s.episode_id='22222222-2222-2222-2222-222222222222';
select coalesce(md5(string_agg(md5(to_jsonb(h)::text), ',' order by md5(to_jsonb(h)::text))), 'EMPTY')
  from studio_visual_revision_history h join studio_shot s on s.id=h.shot_id
  where s.episode_id='22222222-2222-2222-2222-222222222222';
SQL
}

[ "$(source_psql -c "select count(*) from episode where episode_number='EP001'")" = "1" ] ||
  refuse "expected one EP001 source record"
[ "$(source_psql -c "select count(*) from episode where episode_number='EP002'")" = "0" ] ||
  refuse "EP002 already exists in source"
[ "$(source_psql -c "select version from flyway_schema_history where success=true order by installed_rank desc limit 1")" = "85" ] ||
  refuse "source is not Flyway V85"
[ "$(target_psql_readonly -c "select count(*) from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind in ('r','p','v','m','f','S')")" = "0" ] ||
  refuse "target database is not empty: abort without overwrite"
echo "EP002_SOURCE_V85_AND_EMPTY_DISTINCT_TARGET=PASS"

episode_fingerprints | source_psql >"$BACKUP_DIR/source-before.txt"
[ "$(sed -n '1p' "$BACKUP_DIR/source-before.txt")" = "1" ] || refuse "EP001 source ID mismatch"

PGHOST="$SOURCE_HOST" PGPORT="$SOURCE_PORT" PGDATABASE="$SOURCE_DATABASE" \
PGUSER="$SOURCE_USER" PGPASSWORD="$SOURCE_PASSWORD" \
PGOPTIONS="-c default_transaction_read_only=on -c lock_timeout=3000" \
timeout 900 pg_dump -w --format=custom --compress=6 --no-owner --no-acl --file="$DUMP"

test -s "$DUMP" || refuse "backup missing"
pg_restore --list "$DUMP" >/dev/null || refuse "source dump failed archive integrity check"
episode_fingerprints | source_psql >"$BACKUP_DIR/source-after.txt"
cmp -s "$BACKUP_DIR/source-before.txt" "$BACKUP_DIR/source-after.txt" ||
  refuse "EP001 changed during source backup"
echo "EP002_LIVE_EP001_READ_ONLY_BACKUP_AND_HASHES=PASS"

unset SOURCE_PASSWORD SOURCE_USER
/opt/recovery-venv/bin/python /workspace/backup_to_railway_bucket.py

[ "$(target_psql_readonly -c "select count(*) from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind in ('r','p','v','m','f','S')")" = "0" ] ||
  refuse "target gained objects after backup; refusing restore"

echo "EP002_TARGET_RESTORE_START=VERIFIED_ONLY"
PGHOST="$TARGET_HOST" PGPORT="$TARGET_PORT" PGDATABASE="$TARGET_DATABASE" \
PGUSER="$TARGET_USER" PGPASSWORD="$TARGET_PASSWORD" \
timeout 900 pg_restore -w --dbname="$TARGET_DATABASE" --no-owner --no-acl \
  --exit-on-error --single-transaction "$DUMP" >/dev/null

[ "$(target_psql_readonly -c "select count(*) from episode where episode_number='EP001'")" = "1" ] ||
  refuse "EP001 missing after isolated target restore"
[ "$(target_psql_readonly -c "select count(*) from episode where episode_number='EP002'")" = "0" ] ||
  refuse "target already contains EP002"
[ "$(target_psql_readonly -c "select version from flyway_schema_history where success=true order by installed_rank desc limit 1")" = "85" ] ||
  refuse "target Flyway source version wrong"
episode_fingerprints | target_psql_readonly >"$BACKUP_DIR/target-after.txt"
cmp -s "$BACKUP_DIR/source-before.txt" "$BACKUP_DIR/target-after.txt" ||
  refuse "EP001 record/shot/clip/history fingerprint mismatch"
echo "EP002_TARGET_EP001_IMMUTABLE_HASHES=PASS"
echo "EP002_TARGET_RESTORED_ISOLATED_V85=PASS"
