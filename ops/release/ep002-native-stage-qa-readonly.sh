#!/bin/sh
set -eu
umask 077
[ "${QA_AUDIT_MODE:-}" = "EP002_READ_ONLY" ] || { echo "QA_AUDIT_NOT_AUTHORIZED"; exit 1; }
[ "${RAILWAY_PROJECT_ID:-}" = "346b2d5f-a706-4fd5-88fe-40b5c94ca3d0" ] || { echo "REFUSED_NON_QA_PROJECT"; exit 1; }
[ "${SOURCE_HOST:-}" = "qa-postgres.railway.internal" ] || { echo "REFUSED_NON_QA_DB"; exit 1; }
export PGHOST="$SOURCE_HOST" PGPORT=5432 PGDATABASE="$SOURCE_DATABASE" PGUSER="$SOURCE_USER" PGPASSWORD="$SOURCE_PASSWORD"
export PGOPTIONS="-c default_transaction_read_only=on -c lock_timeout=5000 -c statement_timeout=15000"
unset SOURCE_PASSWORD
psql -X -w -A -t -v ON_ERROR_STOP=1 <<'SQL'
select 'EP002_QA_EPISODE_COUNT=' || count(*)
from episode
where id='95b8a4a2-728e-47fe-ad4c-a16748773588' and episode_number='EP002';
select 'EP002_STAGE=' || stage_key || '|status=' || status
  || '|revision=' || current_revision
  || '|locked=' || (locked_at is not null)
  || '|artifact_type=' || coalesce(jsonb_typeof(artifact),'null')
from production_stage
where episode_id='95b8a4a2-728e-47fe-ad4c-a16748773588'
order by sequence_no;
select 'EP002_RESEARCH_DATA='
  || 'sources:' || jsonb_array_length(case when jsonb_typeof(artifact->'technicalSources')='array'
      then artifact->'technicalSources' else '[]'::jsonb end)
  || '|truths:' || jsonb_array_length(case when jsonb_typeof(artifact->'truthMap')='array'
      then artifact->'truthMap' else '[]'::jsonb end)
  || '|boundaries:' || jsonb_array_length(case when jsonb_typeof(artifact->'outOfScope')='array'
      then artifact->'outOfScope' else '[]'::jsonb end)
  || '|has_question:' || (coalesce(length(trim(artifact->>'centralQuestion')),0)>0)
  || '|has_promise:' || (coalesce(length(trim(artifact->>'viewerPromise')),0)>0)
from production_stage
where episode_id='95b8a4a2-728e-47fe-ad4c-a16748773588' and stage_key='RESEARCH';
select 'EP002_SCRIPT_DATA='
  || 'shots:' || jsonb_array_length(case when jsonb_typeof(artifact->'timeline')='array'
      then artifact->'timeline' else '[]'::jsonb end)
  || '|is_v4:' || (artifact->>'scriptVersion'='v4.0')
  || '|source_blob_match:' || (artifact->>'sourceGitBlobSha'='e0f8ee8b9c7c22bd7b9947c2cba40b1072a440d0')
  || '|review_only:' || (artifact->>'importedNativeStatus'='READY_FOR_REVIEW_ONLY')
from production_stage
where episode_id='95b8a4a2-728e-47fe-ad4c-a16748773588' and stage_key='SCRIPT';
select 'EP002_SCENE_DATA='
  || 'shots:' || jsonb_array_length(case when jsonb_typeof(artifact->'shots')='array'
      then artifact->'shots' else '[]'::jsonb end)
  || '|is_v1:' || (artifact->>'visualPassVersion'='v1.0')
  || '|source_blob_match:' || (artifact->>'originalSourceGitBlobSha'='5c43c7fd3bd66b5899f0956a9cfd80bdead834f1')
  || '|visual_beats:' || coalesce(artifact->>'visualBeatCount','not_imported')
from production_stage
where episode_id='95b8a4a2-728e-47fe-ad4c-a16748773588' and stage_key='SCENE';
select 'EP002_DIRECTOR_LOCK_AUDIT=' || s.stage_key
  || '|events:' || count(e.id)
  || '|verified_actor:' || coalesce(bool_and(e.actor_issuer is not null
      and e.actor_subject is not null), false)
  || '|preflight_linked:' || coalesce(bool_and(e.preflight_audit_id is not null), false)
  || '|revision_matched:' || coalesce(bool_and(e.revision=s.current_revision), false)
from production_stage s
left join episode_workspace_event e
  on e.episode_id=s.episode_id and e.stage_key=s.stage_key
  and e.event_type='DIRECTOR_LOCKED'
where s.episode_id='95b8a4a2-728e-47fe-ad4c-a16748773588'
  and s.stage_key in ('RESEARCH','SCRIPT','SCENE')
group by s.stage_key order by s.stage_key;
select 'EP002_STAGE_REVISION_MATCH=' || s.stage_key
  || '|count:' || count(r.id)
  || '|source_equal:' || coalesce(bool_and(r.artifact=s.artifact),false)
from production_stage s
left join production_stage_revision r
  on r.production_stage_id=s.id and r.revision=s.current_revision
where s.episode_id='95b8a4a2-728e-47fe-ad4c-a16748773588'
  and s.stage_key in ('RESEARCH','SCRIPT','SCENE')
group by s.stage_key order by s.stage_key;
SQL
echo "EP002_QA_NATIVE_STAGE_AUDIT=PASS_READ_ONLY_QUERY"
