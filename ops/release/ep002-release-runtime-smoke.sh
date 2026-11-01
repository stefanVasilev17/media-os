#!/usr/bin/env bash
set -euo pipefail
umask 077
export PORT=8080
export DATABASE_URL="jdbc:postgresql://127.0.0.1:5432/media_os"
export DATABASE_USER="media_os"
export DATABASE_PASSWORD="ci-only-isolated"
export MEDIAOS_GOOGLE_AUTH_ENABLED=false
export MEDIAOS_LOCAL_AUTH_ENABLED=false
export MEDIAOS_DIRECTOR_SECURITY_ENABLED=false
export MEDIAOS_EP002_VOICE_WRITES_ENABLED=false
export MEDIAOS_EPISODES_WRITES_ENABLED=false
export MEDIAOS_EPISODES_CREATION_ENABLED=false
export MEDIAOS_EPISODE_RESEARCH_ENABLED=false
export MEDIAOS_LEARNING_PROMOTION_ENABLED=false
mkdir -p /tmp/mediaos-pg18
chown postgres:postgres /tmp/mediaos-pg18
runuser -u postgres -- /usr/lib/postgresql/18/bin/initdb -D /tmp/mediaos-pg18 -A trust >/dev/null
runuser -u postgres -- /usr/lib/postgresql/18/bin/pg_ctl -D /tmp/mediaos-pg18 -o "-h 127.0.0.1 -p 5432" -w start >/dev/null
runuser -u postgres -- psql -h 127.0.0.1 -v ON_ERROR_STOP=1 -c "CREATE ROLE media_os LOGIN PASSWORD 'ci-only-isolated'" >/dev/null
runuser -u postgres -- createdb -h 127.0.0.1 -O media_os media_os
java -Xmx640m -jar /app/app.jar > /tmp/mediaos-app.log 2>&1 &
app_pid=$!
cleanup() {
  kill "$app_pid" 2>/dev/null || true
  wait "$app_pid" 2>/dev/null || true
  runuser -u postgres -- /usr/lib/postgresql/18/bin/pg_ctl -D /tmp/mediaos-pg18 -m immediate stop >/dev/null 2>&1 || true
}
trap cleanup EXIT
ready=0
for attempt in $(seq 1 80); do
  if ! kill -0 "$app_pid" 2>/dev/null; then
    echo "EP002_RELEASE_RUNTIME_STARTUP=FAIL"
    tail -100 /tmp/mediaos-app.log
    exit 1
  fi
  health=$(curl --silent --max-time 2 --output /tmp/mediaos-health --write-out '%{http_code}' http://127.0.0.1:8080/actuator/health || true)
  if [ "$health" = "200" ] && grep -q '"status":"UP"' /tmp/mediaos-health; then
    ready=1
    break
  fi
  sleep 2
done
if [ "$ready" -ne 1 ]; then
  echo "EP002_RELEASE_RUNTIME_STARTUP=FAIL"
  tail -100 /tmp/mediaos-app.log
  exit 1
fi
echo "EP002_RELEASE_RUNTIME_STARTUP=PASS"
version=$(runuser -u postgres -- psql -h 127.0.0.1 -d media_os -At -c "select version from flyway_schema_history where success=true order by installed_rank desc limit 1")
test "$version" = "106" || { echo "EP002_FLYWAY_V106=FAIL"; exit 1; }
echo "EP002_FLYWAY_V106=PASS"
client_code=$(curl --silent --max-time 5 --output /tmp/mediaos-index --write-out '%{http_code}' http://127.0.0.1:8080/ || true)
test "$client_code" = "200" && grep -qi '<html' /tmp/mediaos-index || { echo "EP002_FRONTEND_STATIC=FAIL"; exit 1; }
echo "EP002_FRONTEND_STATIC=PASS"
api_code=$(curl --silent --max-time 5 --output /tmp/mediaos-api --write-out '%{http_code}' http://127.0.0.1:8080/api/v1/episodes || true)
test "$api_code" = "403" || { echo "EP002_ANONYMOUS_READ_DENIED=FAIL_$api_code"; exit 1; }
echo "EP002_ANONYMOUS_READ_DENIED=PASS"
paid_code=$(curl --silent --max-time 5 --output /tmp/mediaos-paid --write-out '%{http_code}' -H 'Content-Type: application/json' -d '{"expectedRevision":0,"requestId":"33333333-3333-4333-8333-333333333333"}' http://127.0.0.1:8080/api/v1/episodes/95b8a4a2-728e-47fe-ad4c-a16748773588/shot-revisions/SHOT%2001/voice/generate || true)
test "$paid_code" = "403" || { echo "EP002_ANONYMOUS_PAID_CALL_DENIED=FAIL_$paid_code"; exit 1; }
echo "EP002_ANONYMOUS_PAID_CALL_DENIED=PASS"
count=$(runuser -u postgres -- psql -h 127.0.0.1 -d media_os -At -c "select count(*) from ep002_voice_generation_ledger")
test "$count" = "0" || { echo "EP002_NO_PAID_ATTEMPTS=FAIL"; exit 1; }
echo "EP002_NO_PAID_ATTEMPTS=PASS"
echo "EP002_RELEASE_RUNTIME_READ_ONLY_PREVIEW=PASS"
