import {Client} from 'pg';
const P='11111111-1111-1111-1111-111111111111';
const keep=[
 {episode:'EP001',id:'904b3075-c5ee-49a3-9d3b-7d4a36f8fbf8',bytes:94164846,frames:37703},
 {episode:'EP002',id:'56c2a4b7-8bc0-465b-baea-80fa3707e709',bytes:83569046,frames:23446},
 {episode:'EP003',id:'63827ce6-2ea8-4853-a61b-8549fe8db967',bytes:152025545,frames:38593}
];
const checks=[
 ['EP001_VOICE_CLIP_BYTES',"select count(*)::int as n from voice_clip_workflow where generated_audio is not null and octet_length(generated_audio)>0"],
 ['EP001_SHOT_VOICE_BYTES',"select count(*)::int as n from voice_shot_workflow where generated_audio is not null and octet_length(generated_audio)>0"],
 ['EP001_STUDIO_VOICE_BYTES',"select count(*)::int as n from studio_clip where generated_audio is not null and octet_length(generated_audio)>0"],
 ['EP001_STUDIO_ARCHIVE_BYTES',"select count(*)::int as n from studio_clip_revision_history where audio is not null and octet_length(audio)>0"],
 ['EP001_SHOT05_ARCHIVE_BYTES',"select count(*)::int as n from episode_shot05_voice_revision_archive where audio is not null and octet_length(audio)>0"],
 ['EP001_SHOT08_LEGACY_BYTES',"select count(*)::int as n from shot08_v8_voice_preview where octet_length(generated_audio)>0"],
 ['EP001_REVISION_TAKE_BYTES',"select count(*)::int as n from episode_revision_voice_take where octet_length(audio)>0"],
 ['EP001_LOCKED_SCRIPT_TAKE_BYTES',"select count(*)::int as n from episode_locked_script_voice_take where octet_length(audio)>0"],
 ['EP002_CREATIVE_VOICE_TAKE_BYTES',"select count(*)::int as n from ep002_creative_voice_take where octet_length(audio)>0"],
 ['EP003_PACKAGE_VOICE_TAKE_BYTES',"select count(*)::int as n from episode_package_voice_take where octet_length(audio)>0"],
 ['ARCHITECTURAL_THINKING_SPLINE_VIDEO_BYTES',`select count(*)::int as n from spline_shot_render where project_id='11111111-1111-1111-1111-111111111111' and video_data is not null`],
];
const db=new Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:13000,application_name:'verify_final_three_film_only_post_cleanup_readonly'});
const mb=n=>Math.round(Number(n)/1048576*100)/100;
try{
 await db.connect();await db.query('BEGIN READ ONLY');
 const rows=(await db.query(`select id::text,status,composition_id,render_key,
  octet_length(video_data)::bigint as bytes,duration_in_frames,width,height,fps,
  input_props->>'directorLocked' as director_locked
  from remotion_render where project_id=$1::uuid
  and (composition_id like 'EP001-%' or composition_id like 'EP002-%' or composition_id like 'EP003-%')
  and video_data is not null order by id`,[P])).rows;
 const ids=keep.map(x=>x.id).sort();
 const actual=rows.map(x=>x.id).sort();
 if(JSON.stringify(ids)!==JSON.stringify(actual))throw Error('NOT_EXACTLY_THREE_WHOLE_MP4S');
 for(const k of keep){
  const r=rows.find(x=>x.id===k.id);
  if(r?.status!=='SUCCEEDED'||Number(r.bytes)!==k.bytes||
     r.width!==1920||r.height!==1080||r.fps!==30||
     r.duration_in_frames!==k.frames)throw Error('MASTER_CHANGED_'+k.episode);
 }
 const remaining=[];
 for(const [name,sql] of checks){
  const x=(await db.query(sql)).rows[0].n;
  remaining.push({name,count:x});
 }
 if(remaining.some(x=>x.count!==0))throw Error('STANDALONE_AUDIO_OR_SPLINE_VIDEO_BYTES_REMAIN_'+JSON.stringify(remaining));
 const stats=(await db.query(`select pg_database_size(current_database())::bigint as database_bytes,
  (select coalesce(sum(size),0)::bigint from pg_ls_waldir()) as wal_bytes,
  current_setting('max_wal_size') as max_wal`)).rows[0];

 await db.query("SET LOCAL statement_timeout = '30000ms'");
 const tableRows=(await db.query(
  'select n.nspname as schema_name,c.relname as table_name,c.oid::regclass::text as relation_name,'+
  'pg_total_relation_size(c.oid)::bigint as total_bytes,'+
  'pg_table_size(c.oid)::bigint as table_with_toast_bytes,'+
  'pg_relation_size(c.oid)::bigint as heap_bytes,'+
  'pg_indexes_size(c.oid)::bigint as index_bytes,'+
  'case when c.reltoastrelid=0 then 0 else pg_total_relation_size(c.reltoastrelid)::bigint end as toast_bytes,'+
  'coalesce(st.n_live_tup,0)::bigint as estimated_live_tuples,'+
  'coalesce(st.n_dead_tup,0)::bigint as estimated_dead_tuples,'+
  'st.last_vacuum,st.last_autovacuum,st.last_analyze,st.last_autoanalyze '+
  'from pg_class c join pg_namespace n on n.oid=c.relnamespace '+
  'left join pg_stat_user_tables st on st.relid=c.oid '+
  "where c.relkind in ('r','p') and n.nspname not in ('pg_catalog','information_schema') "+
  "and n.nspname not like 'pg_toast%' "+
  'order by pg_total_relation_size(c.oid) desc limit 35'
 )).rows;
 const toastRows=(await db.query(
  'select owner.oid::regclass::text as owner_table,toast.oid::regclass::text as toast_relation,'+
  'pg_total_relation_size(toast.oid)::bigint as total_bytes,'+
  'pg_relation_size(toast.oid)::bigint as heap_bytes,'+
  'pg_indexes_size(toast.oid)::bigint as index_bytes,'+
  'coalesce(stat.n_live_tup,0)::bigint as estimated_live_chunks,'+
  'coalesce(stat.n_dead_tup,0)::bigint as estimated_dead_chunks,'+
  'stat.last_autovacuum '+
  'from pg_class owner join pg_class toast on toast.oid=owner.reltoastrelid '+
  'left join pg_stat_all_tables stat on stat.relid=toast.oid '+
  'where owner.relkind in ('+"'r','p'"+') '+
  'order by pg_total_relation_size(toast.oid) desc limit 20'
 )).rows;
 const databaseStats=(await db.query(
  "select current_database() as database_name,pg_database_size(current_database())::bigint as database_bytes,"+
  "(select coalesce(sum(size),0)::bigint from pg_ls_waldir()) as wal_bytes,"+
  "(select count(*)::int from pg_replication_slots) as replication_slots,"+
  "(select count(*)::int from pg_stat_activity where datname=current_database() and xact_start is not null and now()-xact_start > interval '2 minutes') as long_transactions,"+
  "(select count(*)::int from pg_stat_activity where datname=current_database()) as connections"
 )).rows[0];
 const currentSettings=(await db.query(
  "select name,setting,unit from pg_settings where name in ('max_wal_size','min_wal_size','autovacuum','autovacuum_vacuum_scale_factor','autovacuum_analyze_scale_factor','full_page_writes','max_connections') order by name"
 )).rows;
 const extensions=(await db.query(
  "select name,installed_version from pg_available_extensions where name in ('pgstattuple','pg_freespacemap') order by name"
 )).rows;
 const mediaRows=(await db.query(
  "select split_part(composition_id,'-',1) as episode,count(*)::int as render_metadata_rows,"+
  "count(*) filter(where video_data is not null)::int as physical_mp4_rows,"+
  "coalesce(sum(octet_length(video_data)) filter(where video_data is not null),0)::bigint as mp4_bytes "+
  "from remotion_render where project_id=$1::uuid group by 1 order by 1",[P]
 )).rows;
 const castRow=r=>Object.fromEntries(Object.entries(r).map(([k,v])=>[k,typeof v==='string'&&/bytes|tuples|chunks/.test(k)?Number(v):v]));
 console.log('MEDIAOS_POSTGRES_STORAGE_AUDIT_READONLY '+JSON.stringify({
  mode:'READ_ONLY_NO_VACUUM_NO_DELETE_NO_ALTER',sourceCommit:process.env.RAILWAY_GIT_COMMIT_SHA,
  database:castRow(databaseStats),protectedMastersVerified:3,
  totalTableCount:(await db.query("select count(*)::int as n from pg_class c join pg_namespace n on n.oid=c.relnamespace where c.relkind in ('r','p') and n.nspname not in ('pg_catalog','information_schema') and n.nspname not like 'pg_toast%'")).rows[0].n,
  largestRelations:tableRows.map(castRow),largestToastRelations:toastRows.map(castRow),
  mediaRows:mediaRows.map(castRow),settings:currentSettings,extensions
 }));

 await db.query('COMMIT');
 console.log('MEDIAOS_ONLY_THREE_COMPLETE_MP4S_FINAL_STORAGE_QA_PASS '+JSON.stringify({
  savedFullVideos:keep.map(x=>({episode:x.episode,id:x.id,frames:x.frames,bytes:x.bytes})),
  masterCount:rows.length,
  oldEP001EP002EP003VideoBlobCount:0,standaloneAudioBlobCount:0,
  voiceTableChecks:remaining.length,results:remaining,
  dbMiB:mb(stats.database_bytes),walMiB:mb(stats.wal_bytes),
  walSizeSetting:stats.max_wal,
  previousFFprobeAudioCodecs:['aac','aac','aac'],metadataPreserved:true
 }));
}catch(e){console.error('MEDIAOS_ONLY_THREE_COMPLETE_MP4S_FINAL_STORAGE_QA_BLOCKED '+String(e.stack||e));await db.query('ROLLBACK').catch(()=>{});process.exitCode=1;}
finally{await db.end().catch(()=>{})}
