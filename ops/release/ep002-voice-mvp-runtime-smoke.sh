#!/usr/bin/env sh
set -eu
export PORT=8080
export DATABASE_URL=jdbc:postgresql://127.0.0.1:5432/media_os
export DATABASE_USER=media_os
export DATABASE_PASSWORD=voice-ci-disposable
export MEDIAOS_GOOGLE_AUTH_ENABLED=false
export MEDIAOS_LOCAL_AUTH_ENABLED=false
export MEDIAOS_DIRECTOR_SECURITY_ENABLED=false
export MEDIAOS_EP002_VOICE_WRITES_ENABLED=false
export MEDIAOS_EPISODES_WRITES_ENABLED=false
export MEDIAOS_EPISODES_CREATION_ENABLED=false
export MEDIAOS_WORKER_AUTH_ENABLED=false
mkdir -p /tmp/voice-db
chown postgres:postgres /tmp/voice-db
runuser -u postgres -- /usr/lib/postgresql/18/bin/initdb -D /tmp/voice-db -A trust >/dev/null
runuser -u postgres -- /usr/lib/postgresql/18/bin/pg_ctl -D /tmp/voice-db -o "-h 127.0.0.1 -p 5432" -w start >/dev/null
runuser -u postgres -- psql -h 127.0.0.1 -v ON_ERROR_STOP=1 -c "create role media_os login password 'voice-ci-disposable'" >/dev/null
runuser -u postgres -- createdb -h 127.0.0.1 -O media_os media_os
java -Xmx650m -jar /app/app.jar > /tmp/voice-app.log 2>&1 &
pid=$!
trap 'kill "$pid" 2>/dev/null || true; runuser -u postgres -- /usr/lib/postgresql/18/bin/pg_ctl -D /tmp/voice-db -m immediate stop >/dev/null 2>&1 || true' EXIT
ready=0
for i in $(seq 1 90); do
  kill -0 "$pid" 2>/dev/null || { tail -80 /tmp/voice-app.log; exit 1; }
  status=$(curl -sS -m 2 -o /tmp/health -w '%{http_code}' http://127.0.0.1:8080/actuator/health 2>/dev/null || true)
  if [ "$status" = "200" ] && grep -q '"status":"UP"' /tmp/health; then ready=1; break; fi
  sleep 2
done
test "$ready" = 1 || { tail -80 /tmp/voice-app.log; exit 1; }
echo VOICE_MVP_JAVA_STARTUP=PASS
version=$(runuser -u postgres -- psql -h 127.0.0.1 -d media_os -At -c "select version from flyway_schema_history where success=true order by installed_rank desc limit 1")
test "$version" = 106
echo VOICE_MVP_FLYWAY_V106=PASS
status=$(curl -sS -m 5 -o /tmp/index -w '%{http_code}' http://127.0.0.1:8080/)
test "$status" = 200 && grep -q 'EP002 Voice' /tmp/index
echo VOICE_MVP_NO_SPLINE_UI=PASS
status=$(curl -sS -m 5 -o /tmp/episodes -w '%{http_code}' http://127.0.0.1:8080/api/v1/episodes)
test "$status" = 403
echo VOICE_MVP_ANONYMOUS_API_DENIED=PASS
status=$(curl -sS -m 5 -o /tmp/paid -w '%{http_code}' -H 'Content-Type: application/json' -d '{"expectedRevision":0,"requestId":"a68d401e-1f00-4c09-871f-7e949e1e1e1e"}' http://127.0.0.1:8080/api/v1/episodes/95b8a4a2-728e-47fe-ad4c-a16748773588/shot-revisions/SHOT%2001/voice/generate)
test "$status" = 403
echo VOICE_MVP_PAID_GENERATION_DENIED=PASS
count=$(runuser -u postgres -- psql -h 127.0.0.1 -d media_os -At -c "select count(*) from ep002_voice_generation_ledger")
test "$count" = 0
echo VOICE_MVP_ZERO_SPENDING=PASS
test ! -e /app/remotion-engine
test ! -e /app/render-worker
test ! -e /app/spline-runtime
echo VOICE_MVP_NO_VIDEO_WORKER_BINARIES=PASS
