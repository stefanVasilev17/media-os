#!/usr/bin/env bash
set -euo pipefail
umask 077
[ "${RAILWAY_ENVIRONMENT_NAME:-}" = "production" ] || { echo "REFUSED_NONPRODUCTION_ENV"; exit 1; }
[ "${SOURCE_HOST:-}" = "postgres.railway.internal" ] || [ "${SOURCE_HOST:-}" = "Postgres.railway.internal" ] || { echo "REFUSED_SOURCE_HOST"; exit 1; }
[ -n "${SOURCE_PASSWORD:-}" ] && [ -n "${EXPECTED_VOICE_ID:-}" ] && [ -n "${EXPECTED_MODEL_ID:-}" ] || { echo "MISSING_PRIVATE_REFERENCES"; exit 1; }
export PGHOST="$SOURCE_HOST" PGPORT="${SOURCE_PORT:-5432}" PGDATABASE="${SOURCE_DATABASE:-railway}" PGUSER="$SOURCE_USER" PGPASSWORD="$SOURCE_PASSWORD"
export PGOPTIONS="-c default_transaction_read_only=on -c lock_timeout=5000 -c statement_timeout=15000"
unset SOURCE_PASSWORD
psql -X -q -w -v ON_ERROR_STOP=1 -v expected_voice="$EXPECTED_VOICE_ID" -v expected_model="$EXPECTED_MODEL_ID" <<'SQL'
WITH clips AS (
  SELECT DISTINCT generated_voice_id AS voice_id, generated_model_id AS model_id
  FROM voice_clip_workflow
  WHERE episode_id='22222222-2222-2222-2222-222222222222'
    AND voice_approved_at IS NOT NULL AND generated_audio IS NOT NULL
    AND nullif(trim(generated_voice_id),'') IS NOT NULL
    AND nullif(trim(generated_model_id),'') IS NOT NULL
), shots AS (
  SELECT DISTINCT generated_voice_id AS voice_id, generated_model_id AS model_id
  FROM voice_shot_workflow
  WHERE episode_id='22222222-2222-2222-2222-222222222222'
    AND voice_approved_at IS NOT NULL AND generated_audio IS NOT NULL
    AND nullif(trim(generated_voice_id),'') IS NOT NULL
    AND nullif(trim(generated_model_id),'') IS NOT NULL
), selected AS (
  SELECT * FROM clips
  UNION ALL
  SELECT * FROM shots WHERE NOT EXISTS (SELECT 1 FROM clips)
), results AS (
  SELECT count(*) AS profile_count, 
    bool_and(voice_id = :'expected_voice' AND model_id = :'expected_model') AS all_match
  FROM selected
)
SELECT 'EP001_APPROVED_VOICE_PROFILES=' || profile_count FROM results;
WITH clips AS (
  SELECT DISTINCT generated_voice_id AS voice_id, generated_model_id AS model_id
  FROM voice_clip_workflow
  WHERE episode_id='22222222-2222-2222-2222-222222222222'
    AND voice_approved_at IS NOT NULL AND generated_audio IS NOT NULL
    AND nullif(trim(generated_voice_id),'') IS NOT NULL
    AND nullif(trim(generated_model_id),'') IS NOT NULL
), shots AS (
  SELECT DISTINCT generated_voice_id AS voice_id, generated_model_id AS model_id
  FROM voice_shot_workflow
  WHERE episode_id='22222222-2222-2222-2222-222222222222'
    AND voice_approved_at IS NOT NULL AND generated_audio IS NOT NULL
    AND nullif(trim(generated_voice_id),'') IS NOT NULL
    AND nullif(trim(generated_model_id),'') IS NOT NULL
), selected AS (
  SELECT * FROM clips
  UNION ALL
  SELECT * FROM shots WHERE NOT EXISTS (SELECT 1 FROM clips)
)
SELECT 'EP001_VOICE_MATCHES_RUNTIME=' ||
  CASE WHEN count(*)=1 AND bool_and(voice_id = :'expected_voice' AND model_id = :'expected_model')
  THEN 'YES' ELSE 'NO' END FROM selected;
SQL
echo "EP001_VOICE_REFERENCE_READ_ONLY_CHECK=COMPLETE"
