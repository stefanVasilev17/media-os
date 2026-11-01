#!/bin/sh
set -eu
umask 077
root="$(mktemp -d)"
trap 'rm -rf "$root"' EXIT
mkdir -p "$root/bin"
cat > "$root/bin/java" <<'JAVA'
#!/bin/sh
echo 'STUB_JAVA_REACHED'
JAVA
cat > "$root/bin/psql" <<'SQLSTUB'
#!/bin/sh
printf '%s\n' "${EP002_FAKE_PG_RESULT:-NO}"
SQLSTUB
chmod 700 "$root/bin/java" "$root/bin/psql"
export PATH="$root/bin:$PATH"
export MEDIAOS_VOICE_CLONE_CANARY_ENABLED=true
export MEDIAOS_VOICE_TARGET_PGHOST=voice-canary-postgres.railway.internal
export MEDIAOS_LIVE_EP001_PGHOST=postgres.railway.internal
export MEDIAOS_VOICE_TARGET_PGPORT=5432
export MEDIAOS_VOICE_TARGET_PGDATABASE=mediaos_voice_clone
export DATABASE_URL=jdbc:postgresql://voice-canary-postgres.railway.internal:5432/mediaos_voice_clone
export DATABASE_USER=voice_test_user
export DATABASE_PASSWORD=disposable_test_password
export MEDIAOS_VOICE_DB_MARKER=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
export MEDIAOS_WORKER_AUTH_ENABLED=false
export MEDIAOS_EP002_VOICE_WRITES_ENABLED=false
export MEDIAOS_EPISODES_CREATION_ENABLED=false
export MEDIAOS_EPISODES_WRITES_ENABLED=false
export MEDIAOS_GOOGLE_AUTH_ENABLED=false
entrypoint=/workspace/ep002-voice-isolated-entrypoint.sh

refuse() {
  name="$1"
  if /bin/sh "$entrypoint" >"$root/log" 2>&1; then
    echo "FAIL: $name accepted unsafe configuration"
    exit 1
  fi
  if grep -q 'STUB_JAVA_REACHED' "$root/log"; then
    echo "FAIL: $name reached Java before refusing"
    exit 1
  fi
  echo "PASS: $name refused"
}
refuse "no_clone_marker_in_database"
export EP002_FAKE_PG_RESULT=OK
export MEDIAOS_VOICE_TARGET_PGHOST=postgres.railway.internal
refuse "voice_target_is_live_ep001"
export MEDIAOS_VOICE_TARGET_PGHOST=voice-canary-postgres.railway.internal
export DATABASE_URL=jdbc:postgresql://postgres.railway.internal:5432/mediaos_voice_clone
refuse "application_url_points_at_live_db"
export DATABASE_URL=jdbc:postgresql://voice-canary-postgres.railway.internal:5432/mediaos_voice_clone
export MEDIAOS_EP002_VOICE_WRITES_ENABLED=true
refuse "paid_voice_without_google"
export MEDIAOS_EP002_VOICE_WRITES_ENABLED=false
export MEDIAOS_EPISODES_WRITES_ENABLED=true
refuse "broad_writes_without_google"
export MEDIAOS_EPISODES_WRITES_ENABLED=false
export MEDIAOS_VOICE_CLONE_CANARY_ENABLED=false
refuse "clone_not_enabled"
export MEDIAOS_VOICE_CLONE_CANARY_ENABLED=true
export MEDIAOS_WORKER_AUTH_ENABLED=true
refuse "worker_auth_misconfigured_for_voice_service"
export MEDIAOS_WORKER_AUTH_ENABLED=false
export MEDIAOS_VOICE_DB_MARKER=weak
refuse "weak_isolation_marker"
export MEDIAOS_VOICE_DB_MARKER=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
/bin/sh "$entrypoint" >"$root/log" 2>&1 || { cat "$root/log"; exit 1; }
grep -q 'EP002_VOICE_ISOLATED_DATABASE_PREFLIGHT=PASS' "$root/log"
grep -q 'STUB_JAVA_REACHED' "$root/log"
echo "PASS: matching isolated PostgreSQL marker permits Java startup"
echo "EP002_VOICE_ISOLATION_NEGATIVE_TESTS=PASS"
