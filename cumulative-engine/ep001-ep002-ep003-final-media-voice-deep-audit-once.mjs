import {Client} from 'pg';
const db=new Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:16000,application_name:'ep001_ep002_ep003_final_voice_deletion_deep_readonly_preflight'});
const MB=n=>Math.round(Number(n)/1048576*100)/100;
const PROJECT='11111111-1111-1111-1111-111111111111';
try{
 await db.connect();
 await db.query('BEGIN READ ONLY');
 const status=(await db.query(`select current_user, now() at time zone 'utc' as utc,
 current_setting('max_wal_size') as max_wal_size,
 current_setting('min_wal_size') as min_wal_size,
 current_setting('checkpoint_timeout') as checkpoint_timeout,
 (select rolsuper from pg_roles where rolname=current_user) as is_superuser,
 pg_database_size(current_database())::bigint as db_bytes,
 pg_total_relation_size('remotion_render')::bigint as render_bytes`)).rows[0];
 console.log('STORAGE_DATABASE_STATE '+JSON.stringify({utc:status.utc,user:status.current_user,
 superuser:status.is_superuser,maxWal:status.max_wal_size,minWal:status.min_wal_size,
 checkpointTimeout:status.checkpoint_timeout,dbMiB:MB(status.db_bytes),
 renderMiB:MB(status.render_bytes)}));
 try{
 const wal=(await db.query(`select count(*)::integer as files,coalesce(sum(size),0)::bigint as wal_bytes
 from pg_ls_waldir()`)).rows[0];
 console.log('STORAGE_WAL_DIR '+JSON.stringify({files:wal.files,walMiB:MB(wal.wal_bytes)}));
 }catch(e){console.log('STORAGE_WAL_DIR_UNAVAILABLE '+String(e.message).slice(0,300))}
 const byteCols=(await db.query(`select table_name,column_name
  from information_schema.columns
  where table_schema='public' and data_type='bytea'
  order by table_name,column_name`)).rows;
 console.log('STORAGE_BYTEA_COLUMNS '+JSON.stringify(byteCols));
 const episodes=(await db.query(`select id::text,episode_number from episode order by episode_number`)).rows;
 console.log('STORAGE_EPISODE_IDS '+JSON.stringify(episodes));
 const slots=(await db.query(`select slot_name,slot_type,active,restart_lsn,wal_status,
 coalesce(safe_wal_size,0)::bigint as safe_wal_size from pg_replication_slots`)).rows;
 console.log('STORAGE_REPLICATION_SLOTS '+JSON.stringify(slots));
 const activity=(await db.query(`select state,count(*)::int as connections
   from pg_stat_activity where datname=current_database() group by 1`)).rows;
 console.log('STORAGE_DB_CONNECTIONS '+JSON.stringify(activity));
 const full=(await db.query(`select id::text,composition_id,render_key,engine_version,status,
 profile,coalesce(size_bytes,octet_length(video_data),0)::bigint as bytes,
 video_data is not null as has_video, duration_in_frames,width,height,fps,
 created_at,finished_at,
 left(input_props::text,1100) as props_preview
 from remotion_render
 where project_id=$1::uuid and (
    (composition_id like 'EP001-%' and (duration_in_frames>15000 or composition_id like '%Master%'))
    or (composition_id like 'EP002-%' and (composition_id like '%MASTER%' or duration_in_frames>18000))
    or (composition_id='EP003-CUMULATIVE-DIRECTOR-MASTER'))
 order by composition_id,created_at desc`,[PROJECT])).rows;
 console.log('STORAGE_EPISODE_FULL_MASTERS '+JSON.stringify(full.map(r=>({...r,MiB:MB(r.bytes),bytes:undefined}))));
 const all=(await db.query(`select substring(composition_id,1,5) as ep,
   count(*) filter (where video_data is not null)::integer as mp4s,
   sum(coalesce(size_bytes,octet_length(video_data),0)) filter (where video_data is not null)::bigint as total_bytes
 from remotion_render where composition_id like 'EP00%-'
 group by 1`)).rows;
 console.log('STORAGE_EPISODE_MEDIA_TOTALS '+JSON.stringify(all.map(r=>({...r,MiB:MB(r.total_bytes||0),total_bytes:undefined}))));
 const voiceTables=['voice_shot_workflow','voice_clip_workflow','episode_revision_voice_take','episode_locked_script_voice_take','episode_package_voice_take','episode_package_voice_choice','studio_clip','episode_shot05_voice_revision_archive','episode_package_import','episode_package_shot'];
 for(const t of voiceTables){
  const cols=(await db.query(`select column_name,data_type from information_schema.columns
 where table_schema='public' and table_name=$1 order by ordinal_position`,[t])).rows;
  if(!cols.length)continue;
  console.log('STORAGE_VOICE_SCHEMA '+JSON.stringify({table:t,columns:cols}));
  const audio=cols.filter(x=>x.data_type==='bytea').map(x=>x.column_name);
  const hasEpisode=cols.some(x=>x.column_name==='episode_id');
  if(hasEpisode&&audio.length){
    const expr=audio.map(x=>`coalesce(pg_column_size("${x}"),0)`).join('+');
    const q=`select e.episode_number,count(*)::integer as rows,sum(${expr})::bigint as stored_bytes
      from "${t}" v join episode e on e.id=v.episode_id
      where e.episode_number in ('EP001','EP002','EP003') group by 1 order by 1`;
    try{const rows=(await db.query(q)).rows;console.log('STORAGE_VOICE_BYTES '+JSON.stringify({table:t,rows:rows.map(x=>({...x,MiB:MB(x.stored_bytes)}))}))}
    catch(e){console.log('STORAGE_VOICE_BYTES_UNAVAILABLE '+JSON.stringify({table:t,error:e.message}))}
  }
 }
 await db.query('COMMIT');
}catch(e){console.log('STORAGE_DEEP_PREFLIGHT_BLOCKED '+String(e.stack||e).slice(0,4000));try{await db.query('ROLLBACK')}catch{}}finally{await db.end().catch(()=>{})}
