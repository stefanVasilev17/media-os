#!/bin/bash
set -euo pipefail
umask 077

export PORT=8080
export RAILWAY_ENVIRONMENT_NAME=production
export RAILWAY_PROJECT_ID=a2b47ba1-385e-4410-93ee-b2198492b724
export MEDIAOS_VOICE_FRESH_BOOTSTRAP_ENABLED=true
export MEDIAOS_VOICE_TARGET_SERVICE_ID=5f794554-379b-4d25-adb4-4f23bafbe45f
export MEDIAOS_VOICE_TARGET_PGHOST=ep002-voice-qa.railway.internal
export MEDIAOS_LIVE_EP001_PGHOST=postgres.railway.internal
export MEDIAOS_VOICE_TARGET_PGDATABASE=mediaos_voice_clone
export MEDIAOS_VOICE_TARGET_PGPORT=5432
export DATABASE_URL=jdbc:postgresql://ep002-voice-qa.railway.internal:5432/mediaos_voice_clone
export DATABASE_USER=mediaos_voice_user
export DATABASE_PASSWORD=disposable-ci-credentials
export MEDIAOS_VOICE_DB_MARKER=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
export MEDIAOS_GOOGLE_AUTH_ENABLED=false
export MEDIAOS_EP002_VOICE_WRITES_ENABLED=false
export MEDIAOS_EPISODES_CREATION_ENABLED=false
export MEDIAOS_EPISODES_WRITES_ENABLED=false
export MEDIAOS_WORKER_AUTH_ENABLED=false

printf '127.0.0.1 ep002-voice-qa.railway.internal\n' >/tmp/voice-qa-hosts
export JAVA_TOOL_OPTIONS=-Djdk.net.hosts.file=/tmp/voice-qa-hosts
mkdir -p /tmp/voice-qa-bin
cat >/tmp/voice-qa-bin/psql <<'QA_PSQL'
#!/bin/sh
export PGHOST=127.0.0.1
exec /usr/bin/psql "$@"
QA_PSQL
chmod 700 /tmp/voice-qa-bin/psql
export PATH=/tmp/voice-qa-bin:$PATH
mkdir -p /tmp/fresh-voice-db
chown postgres:postgres /tmp/fresh-voice-db
runuser -u postgres -- /usr/lib/postgresql/18/bin/initdb -D /tmp/fresh-voice-db -A trust >/dev/null
runuser -u postgres -- /usr/lib/postgresql/18/bin/pg_ctl -D /tmp/fresh-voice-db -o '-h 127.0.0.1 -p 5432' -w start >/dev/null
runuser -u postgres -- psql -h 127.0.0.1 -v ON_ERROR_STOP=1 -q -c "create role mediaos_voice_user login password 'disposable-ci-credentials'"
runuser -u postgres -- createdb -h 127.0.0.1 -O mediaos_voice_user mediaos_voice_clone

export MEDIAOS_VOICE_AUTHORIZE_FRESH_SCHEMA=
if /bin/sh /app/entrypoint.sh >/tmp/fresh-denied.log 2>&1; then
  echo 'FRESH_VOICE_UNAUTHORIZED_BOOTSTRAP=FAIL'; exit 1
fi
echo 'FRESH_VOICE_UNAUTHORIZED_BOOTSTRAP=PASS'
export MEDIAOS_VOICE_AUTHORIZE_FRESH_SCHEMA=CREATE_ONLY_ON_EMPTY_EP002_POSTGRES
export MEDIAOS_LIVE_EP001_PGHOST="$MEDIAOS_VOICE_TARGET_PGHOST"
if /bin/sh /app/entrypoint.sh >/tmp/fresh-alias.log 2>&1; then
  echo 'FRESH_VOICE_LIVE_HOST_REFUSED=FAIL'; exit 1
fi
echo 'FRESH_VOICE_LIVE_HOST_REFUSED=PASS'
export MEDIAOS_LIVE_EP001_PGHOST=postgres.railway.internal
export MEDIAOS_EP002_VOICE_WRITES_ENABLED=true
if /bin/sh /app/entrypoint.sh >/tmp/fresh-paid.log 2>&1; then
  echo 'FRESH_VOICE_PAID_WITHOUT_GOOGLE=FAIL'; exit 1
fi
echo 'FRESH_VOICE_PAID_WITHOUT_GOOGLE=PASS'
export MEDIAOS_EP002_VOICE_WRITES_ENABLED=false

/bin/sh /app/entrypoint.sh >/tmp/fresh-voice.log 2>&1 &
pid=$!
cleanup() {
 kill "$pid" 2>/dev/null || true
 runuser -u postgres -- /usr/lib/postgresql/18/bin/pg_ctl -D /tmp/fresh-voice-db -m immediate stop >/dev/null 2>&1 || true
}
trap cleanup EXIT
ready=0
for i in $(seq 1 100); do
  kill -0 "$pid" 2>/dev/null || { tail -90 /tmp/fresh-voice.log; exit 1; }
  code=$(curl -m 2 -sS -o /tmp/fresh-health -w '%{http_code}' http://127.0.0.1:8080/actuator/health 2>/dev/null || true)
  if [ "$code" = 200 ] && grep -q '"status":"UP"' /tmp/fresh-health; then ready=1; break; fi
  sleep 2
done
if [ "$ready" != 1 ]; then tail -90 /tmp/fresh-voice.log; exit 1; fi
grep -q 'EP002_FRESH_DB_ISOLATED_AND_MARKED=PASS' /tmp/fresh-voice.log
echo 'EP002_FRESH_DB_MARKER_AND_BOOT=PASS'
query() { runuser -u postgres -- psql -h 127.0.0.1 -d mediaos_voice_clone -At -c "$1"; }
[ "$(query 'select version from flyway_schema_history where success=true order by installed_rank desc limit 1')" = 106 ]
echo 'EP002_FRESH_FLYWAY_V106=PASS'
[ "$(query 'select count(*) from public.mediaos_voice_database_identity')" = 1 ]
[ "$(query "select count(*) from episode where episode_number='EP002'")" = 0 ]
[ "$(query 'select count(*) from ep002_voice_generation_ledger')" = 0 ]
echo 'EP002_FRESH_ZERO_PAID_REQUESTS=PASS'
[ "$(query 'select count(*) from voice_clip_workflow where voice_approved_at is not null')" = 0 ]
echo 'EP002_FRESH_EP001_APPROVAL_NOT_FABRICATED=PASS'
status=$(curl -sS -m 5 -o /tmp/fresh-api -w '%{http_code}' http://127.0.0.1:8080/api/v1/episodes)
[ "$status" = 403 ]
echo 'EP002_FRESH_ANONYMOUS_API_DENIED=PASS'

kill "$pid" 2>/dev/null || true
wait "$pid" 2>/dev/null || true
export MEDIAOS_VOICE_DB_MARKER=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
if /bin/sh /app/entrypoint.sh >/tmp/fresh-marker-refused.log 2>&1; then
  echo 'EP002_FRESH_BAD_RESTART_MARKER=FAIL'; exit 1
fi
echo 'EP002_FRESH_BAD_RESTART_MARKER=PASS'
