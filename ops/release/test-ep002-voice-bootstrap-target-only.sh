#!/bin/sh
set -eu
umask 077
temp="$(mktemp -d)"
trap 'rm -rf "$temp"' EXIT
mkdir -p "$temp/bin"
cat > "$temp/bin/psql" <<'FAKE'
#!/bin/sh
case "$PGOPTIONS" in
  *mediaos.ep002_voice_target_bootstrap=confirmed*) ;;
  *) exit 27 ;;
esac
[ "$PGHOST" != "postgres.railway.internal" ] || exit 28
[ "$PGDATABASE" = "ep002_voice_clone" ] || exit 29
exit 0
FAKE
chmod 700 "$temp/bin/psql"
export PATH="$temp/bin:$PATH"
export MEDIAOS_VOICE_TARGET_PGHOST=voice-postgres.railway.internal
export MEDIAOS_LIVE_EP001_PGHOST=postgres.railway.internal
export MEDIAOS_VOICE_TARGET_PGPORT=5432
export MEDIAOS_VOICE_TARGET_PGDATABASE=ep002_voice_clone
export DATABASE_URL=jdbc:postgresql://voice-postgres.railway.internal:5432/ep002_voice_clone
export DATABASE_USER=ci-test-user
export DATABASE_PASSWORD=ci-test-no-real-data
export MEDIAOS_VOICE_DB_MARKER=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
bootstrap=/workspace/ep002-voice-bootstrap-target-only.sh
reject() {
  name="$1"
  if /bin/sh "$bootstrap" >"$temp/last" 2>&1; then
    echo "FAIL: $name was accepted"
    exit 1
  fi
  echo "PASS: refused $name"
}
reject "missing_explicit_ack"
export MEDIAOS_VOICE_CLONE_BOOTSTRAP_ACK=AUTHORIZE_SEPARATE_EP002_POSTGRES_TARGET_ONLY
export MEDIAOS_VOICE_TARGET_PGHOST=postgres.railway.internal
reject "live_EP001_host"
export MEDIAOS_VOICE_TARGET_PGHOST=public.example.com
reject "public_host"
export MEDIAOS_VOICE_TARGET_PGHOST=voice-postgres.railway.internal
export DATABASE_URL=jdbc:postgresql://postgres.railway.internal:5432/ep002_voice_clone
reject "mismatched_JDBC_URL"
export DATABASE_URL=jdbc:postgresql://voice-postgres.railway.internal:5432/ep002_voice_clone
export MEDIAOS_VOICE_DB_MARKER=invalid
reject "weak_marker"
export MEDIAOS_VOICE_DB_MARKER=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
/bin/sh "$bootstrap" >"$temp/last" 2>&1
grep -q 'EP002_VOICE_CLONE_TARGET_BOOTSTRAP=PASS' "$temp/last"
echo "EP002_VOICE_CLONE_BOOTSTRAP_NEGATIVE_TESTS=PASS"
