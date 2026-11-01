#!/usr/bin/env bash
set -euo pipefail
umask 077

readonly STAGE_DIR="/tmp/mediaos-production-clone"
readonly DUMP_FILE="$STAGE_DIR/source.dump"
readonly LOCAL_DB_DIR="$STAGE_DIR/postgres"
mkdir -p "$STAGE_DIR"
chmod 700 "$STAGE_DIR"

case "${RAILWAY_ENVIRONMENT_NAME:-}" in
  production) ;;
  *) echo "REFUSED: Unknown Railway environment."; exit 1 ;;
esac
case "${SOURCE_HOST:-}" in
  postgres.railway.internal|Postgres.railway.internal|qa-postgres.railway.internal) ;;
  *) echo "REFUSED: Source is not a recognized Railway private PostgreSQL hostname."; exit 1 ;;
esac
[[ "${SOURCE_PORT:-}" =~ ^[0-9]{2,5}$ ]] || { echo "REFUSED: Invalid PostgreSQL source port."; exit 1; }
[[ -n "${SOURCE_DATABASE:-}" && -n "${SOURCE_USER:-}" && -n "${SOURCE_PASSWORD:-}" ]] || {
  echo "REFUSED: Source credentials are missing."; exit 1;
}
[[ "${SOURCE_HOST}" != "127.0.0.1" && "${SOURCE_HOST}" != "localhost" ]] || exit 1

cleanup() {
  rm -f "$DUMP_FILE" "$STAGE_DIR/recovered.dump" || true
}
trap cleanup EXIT

export PGHOST="$SOURCE_HOST"
export PGPORT="$SOURCE_PORT"
export PGDATABASE="$SOURCE_DATABASE"
export PGUSER="$SOURCE_USER"
export PGPASSWORD="$SOURCE_PASSWORD"
export PGOPTIONS="-c default_transaction_read_only=on -c lock_timeout=5000"

timeout 900 /usr/lib/postgresql/18/bin/pg_dump --format=custom --compress=6 --no-owner --no-acl --no-password --file="$DUMP_FILE"
test -s "$DUMP_FILE"
echo "READ_ONLY_SOURCE_BACKUP=PASS"

unset PGHOST PGPORT PGDATABASE PGUSER PGPASSWORD PGOPTIONS SOURCE_PASSWORD
/opt/recovery-venv/bin/python /workspace/backup_to_railway_bucket.py

mkdir -p "$LOCAL_DB_DIR"
chown postgres:postgres "$STAGE_DIR"
chown -R postgres:postgres "$LOCAL_DB_DIR"
runuser -u postgres -- /usr/lib/postgresql/18/bin/initdb -D "$LOCAL_DB_DIR" -A trust > /dev/null
runuser -u postgres -- /usr/lib/postgresql/18/bin/pg_ctl -D "$LOCAL_DB_DIR" -o "-h 127.0.0.1 -p 5432" -w start > /dev/null
runuser -u postgres -- psql -h 127.0.0.1 -v ON_ERROR_STOP=1 -q -c "CREATE ROLE media_os LOGIN PASSWORD 'media_os'"
runuser -u postgres -- createdb -h 127.0.0.1 -O media_os media_os
timeout 900 /usr/lib/postgresql/18/bin/pg_restore --host=127.0.0.1 --port=5432 \
    --username=media_os --dbname=media_os --no-owner --no-acl --exit-on-error "$DUMP_FILE" > /dev/null
echo "PRODUCTION_COPY_RESTORED_TO_ISOLATED_POSTGRES18=PASS"

export CI_PRODUCTION_CLONE_REHEARSAL=true
export CI_PRODUCTION_CLONE_URL=jdbc:postgresql://127.0.0.1:5432/media_os
cd /workspace/backend
timeout 900 mvn -B -ntp -Dstyle.color=never -Dtest=ProductionCloneUpgradeAcceptanceTest \
    -DargLine=-Xmx384m test > /tmp/clone-upgrade-test.log 2>&1 || {
      echo "LOCAL_CLONE_UPGRADE_TEST=FAIL"
      grep -E 'Tests run:|Failures:|Errors:|[Ee]xception|[Ee]rror' /tmp/clone-upgrade-test.log | tail -25 || true
      exit 1
    }
grep 'Tests run:' /tmp/clone-upgrade-test.log | tail -1
echo "LOCAL_CLONE_UPGRADE_V85_TO_V105_AND_EP001_HASHES=PASS"
