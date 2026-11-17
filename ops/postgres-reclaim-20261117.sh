#!/bin/sh
set -eu
set -o pipefail
umask 077
export AWS_EC2_METADATA_DISABLED=true
export AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-auto}"
export AWS_S3_ADDRESSING_STYLE=virtual
BACKUP_KEY="mediaos/production-postgresql/pre-toast-compaction-2026-11-17-verified.dump"
BACKUP_FILE="/tmp/mediaos-pg-pre-compaction-20261117.dump"
EXPECTED_MASTER_ROWS="$(cat <<'EOT'
56c2a4b7-8bc0-465b-baea-80fa3707e709|83569046|3a295b5952780a8fe9ecb795332bb7edc229aad5fde70b91daa53bf505f13d09
63827ce6-2ea8-4853-a61b-8549fe8db967|152025545|1560d46f8067c735a2578d769bfcda465f651e46babdf4bd7dfa1090f6ce8ff6
904b3075-c5ee-49a3-9d3b-7d4a36f8fbf8|94164846|5c9dcbba1a5293d9a8bb19654b4aacaa0b752e1a8a8f63f26937b1fcc8192066
EOT
)"
for var in DATABASE_URL S3_ENDPOINT S3_BUCKET AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY; do
 eval 'test -n "${'"$var"':-}"' || { echo "MEDIAOS_DB_MAINT_BLOCKED missing_required_$var"; exit 41; }
done
case "${RUN_MODE:-NOT_CONFIGURED}" in
BACKUP|RECLAIM_SMALL|COMPACT_MAIN|VERIFY_ONLY) ;;
*) echo "MEDIAOS_DB_MAINT_BLOCKED no_valid_run_mode"; exit 42;;
esac
psql_preflight(){
 psql -X -v ON_ERROR_STOP=1 "$DATABASE_URL" -qAt -c   "select id::text||'|'||octet_length(video_data)::text||'|'||encode(sha256(video_data),'hex')
   from public.remotion_render
   where video_data is not null
   order by id"
}
verify_masters(){
 ACTUAL="$(psql_preflight)"
 if [ "$ACTUAL" != "$EXPECTED_MASTER_ROWS" ]; then
  echo "MEDIAOS_DB_MAINT_BLOCKED master_sha256_or_size_or_count_mismatch"
  exit 45
 fi
 echo "MEDIAOS_DB_MAINT_THREE_MASTERS_SHA256_PASS count=3 bytes=329759437"
}
report_db(){
 psql -X -v ON_ERROR_STOP=1 "$DATABASE_URL" -qAt -c  "select 'MEDIAOS_DB_MAINT_DB_SIZES database='||pg_database_size(current_database())::text||' relation='||pg_total_relation_size('public.remotion_render'::regclass)::text||' toast='||
  (select pg_total_relation_size(reltoastrelid)::text from pg_class where oid='public.remotion_render'::regclass)||' wal='||
  (select coalesce(sum(size),0)::text from pg_ls_waldir())||' counts='||
  (select count(*)::text from public.remotion_render)"
}
verify_bucket(){
 expected="${EXPECTED_BACKUP_SHA256:-}"
 if [ "${#expected}" -ne 64 ]; then echo "MEDIAOS_DB_MAINT_BLOCKED backup_sha256_not_supplied"; exit 47; fi
 echo "MEDIAOS_DB_MAINT_BACKUP_VERIFY_REMOTE_START"
 HEAD_SIZE="$(aws --endpoint-url "$S3_ENDPOINT" s3api head-object --bucket "$S3_BUCKET" --key "$BACKUP_KEY" --query ContentLength --output text)"
 test "${HEAD_SIZE:-0}" -gt 1000000 || { echo "MEDIAOS_DB_MAINT_BLOCKED backup_remote_missing_or_empty"; exit 48; }
 BACKUP_REMOTE_HASH="$(aws --endpoint-url "$S3_ENDPOINT" s3 cp "s3://${S3_BUCKET}/${BACKUP_KEY}" - --only-show-errors --no-progress | sha256sum | awk '{print $1}')"
 if [ "$BACKUP_REMOTE_HASH" != "$expected" ]; then echo "MEDIAOS_DB_MAINT_BLOCKED remote_backup_sha256_mismatch"; exit 49; fi
 echo "MEDIAOS_DB_MAINT_BACKUP_REMOTE_SHA256_PASS bytes=$HEAD_SIZE hash=$BACKUP_REMOTE_HASH"
}
echo "MEDIAOS_DB_MAINT_BEGIN mode=$RUN_MODE"
verify_masters
report_db
if [ "$RUN_MODE" = "BACKUP" ]; then
 echo "MEDIAOS_DB_MAINT_LOGICAL_BACKUP_START"
 pg_dump --dbname="$DATABASE_URL" --no-owner --no-acl --format=custom --compress=gzip:1 --file="$BACKUP_FILE"
 pg_restore --list "$BACKUP_FILE" > /tmp/mediaos-backup-toc
 grep -q 'TABLE DATA public remotion_render' /tmp/mediaos-backup-toc || { echo "MEDIAOS_DB_MAINT_BLOCKED missing_render_table_in_backup"; exit 50; }
 SIZE="$(wc -c < "$BACKUP_FILE" | tr -d ' ')"
 HASH="$(sha256sum "$BACKUP_FILE" | awk '{print $1}')"
 test "$SIZE" -gt 1000000 || { echo "MEDIAOS_DB_MAINT_BLOCKED backup_too_small"; exit 51; }
 echo "MEDIAOS_DB_MAINT_LOCAL_BACKUP_VALIDATED bytes=$SIZE sha256=$HASH"
 aws --endpoint-url "$S3_ENDPOINT" s3 cp "$BACKUP_FILE" "s3://${S3_BUCKET}/${BACKUP_KEY}" --only-show-errors --no-progress
 export EXPECTED_BACKUP_SHA256="$HASH"
 verify_bucket
 echo "MEDIAOS_DB_MAINT_BACKUP_COMPLETED backup_object=$BACKUP_KEY size=$SIZE sha256=$HASH"
 rm -f "$BACKUP_FILE" /tmp/mediaos-backup-toc
 exit 0
fi
if [ "$RUN_MODE" = "VERIFY_ONLY" ]; then
 verify_bucket
 verify_masters
 report_db
 echo "MEDIAOS_DB_MAINT_VERIFY_ONLY_PASS"
 exit 0
fi
if [ "${ALLOW_PHYSICAL_REWRITE:-}" != "DIRECTOR_DISK_RECLAIM_20261117" ]; then echo "MEDIAOS_DB_MAINT_BLOCKED no_explicit_write_gate"; exit 52; fi
verify_bucket
if [ "$RUN_MODE" = "RECLAIM_SMALL" ]; then
 echo "MEDIAOS_DB_MAINT_SMALL_TOAST_RECLAIM_BEGIN"
 for tbl in ep002_creative_voice_take episode_package_voice_take voice_clip_workflow studio_clip episode_shot05_voice_revision_archive; do
  echo "MEDIAOS_DB_MAINT_SMALL_TABLE_START table=$tbl"
  PGOPTIONS="-c lock_timeout=5000 -c statement_timeout=900000" psql -X -v ON_ERROR_STOP=1 "$DATABASE_URL" -q -c "VACUUM (FULL, ANALYZE) public.$tbl;"
  echo "MEDIAOS_DB_MAINT_SMALL_TABLE_SUCCESS table=$tbl"
 done
 verify_masters
 report_db
 echo "MEDIAOS_DB_MAINT_SMALL_TOAST_RECLAIM_COMPLETE"
 exit 0
fi
STATS="$(psql -X -v ON_ERROR_STOP=1 "$DATABASE_URL" -qAt -c "select pg_total_relation_size('public.remotion_render'::regclass)::text||'|'||count(*) filter (where video_data is not null)::text from public.remotion_render")"
SIZE="${STATS%%|*}"
N="${STATS##*|}"
test "$N" = 3 || { echo "MEDIAOS_DB_MAINT_BLOCKED unexpected_media_payload_count=$N"; exit 53; }
test "$SIZE" -gt 2500000000 || { echo "MEDIAOS_DB_MAINT_BLOCKED no_large_bloat_to_reclaim"; exit 54; }
echo "MEDIAOS_DB_MAINT_VACUUM_FULL_START relation_bytes=$SIZE"
PGOPTIONS="-c lock_timeout=5000 -c statement_timeout=900000" psql -X -v ON_ERROR_STOP=1 "$DATABASE_URL" -c "VACUUM (FULL, ANALYZE, VERBOSE) public.remotion_render;"
echo "MEDIAOS_DB_MAINT_VACUUM_FULL_SQL_SUCCESS"
verify_masters
report_db
echo "MEDIAOS_DB_MAINT_COMPLETE three_masters_untouched=yes metadata_preserved=yes"
