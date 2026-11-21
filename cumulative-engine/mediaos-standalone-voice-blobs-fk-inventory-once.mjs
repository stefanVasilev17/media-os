import {Client} from 'pg';
const db=new Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:12000,application_name:'mediaos_final_voice_video_storage_fks_read_only'});
const fmt=n=>Math.round(Number(n)/1048576*100)/100;
try{
 await db.connect();await db.query('BEGIN READ ONLY');
 const tables=['ep002_creative_voice_take','ep002_creative_voice_choice',
 'episode_locked_script_voice_take','episode_revision_voice_take',
 'episode_package_voice_take','episode_package_voice_choice','episode_package_shot','episode_package_import',
 'episode_shot05_voice_revision_archive','voice_clip_workflow','voice_shot_workflow',
 'studio_clip','studio_clip_revision_history','studio_shot','shot08_v8_voice_preview',
 'episode_director_reference_video','spline_shot_render','spline_snapshot'];
 const schemas=(await db.query(`select table_name,column_name,data_type,is_nullable
 from information_schema.columns where table_schema='public' and table_name=any($1::text[])
 order by table_name,ordinal_position`,[tables])).rows;
 for(const name of tables)console.log('MEDIAOS_VOICE_TABLE_SCHEMA '+JSON.stringify({table:name,cols:schemas.filter(x=>x.table_name===name).map(x=>({name:x.column_name,type:x.data_type,nullable:x.is_nullable}))}));
 const fks=(await db.query(`select conname,conrelid::regclass::text as child,confrelid::regclass::text as parent,
 pg_get_constraintdef(oid) as definition from pg_constraint
 where contype='f' and confrelid=any($1::text[]::regclass[]) order by parent,child`,[tables.filter(x=>!['studio_shot','spline_snapshot'].includes(x))])).rows;
 console.log('MEDIAOS_VOICE_TABLE_FKS '+JSON.stringify(fks));
 const queries={
 EP001_CLIPS:`select count(*)::int as n,coalesce(sum(pg_column_size(generated_audio)),0)::bigint as bytes from voice_clip_workflow`,
 EP001_LEGACY_SHOT_VOICES:`select count(*)::int as n,coalesce(sum(pg_column_size(generated_audio)),0)::bigint as bytes from voice_shot_workflow`,
 EP001_SHOT05_ARCHIVE:`select count(*)::int as n,coalesce(sum(pg_column_size(audio)),0)::bigint as bytes from episode_shot05_voice_revision_archive`,
 EP001_SHOT08_TEMP:`select count(*)::int as n,coalesce(sum(pg_column_size(generated_audio)),0)::bigint as bytes from shot08_v8_voice_preview`,
 EP002_CREATIVE_TAKES:`select count(*)::int as n,coalesce(sum(pg_column_size(audio)),0)::bigint as bytes from ep002_creative_voice_take`,
 EP002_CREATIVE_CHOICES:`select count(*)::int as n from ep002_creative_voice_choice`,
 EP001_LOCKED_TAKES:`select count(*)::int as n,coalesce(sum(pg_column_size(audio)),0)::bigint as bytes from episode_locked_script_voice_take`,
 EP001_REVISION_TAKES:`select count(*)::int as n,coalesce(sum(pg_column_size(audio)),0)::bigint as bytes from episode_revision_voice_take`,
 STUDIO_CLIPS:`select count(*)::int as n,coalesce(sum(pg_column_size(generated_audio)),0)::bigint as bytes from studio_clip`,
 STUDIO_CLIP_HISTORY:`select count(*)::int as n,coalesce(sum(pg_column_size(audio)),0)::bigint as bytes from studio_clip_revision_history`,
 EP_PACKAGE_VOICES:`select p.episode_key,count(*)::int as n,coalesce(sum(pg_column_size(t.audio)),0)::bigint as bytes
 from episode_package_voice_take t join episode_package_shot s on s.id=t.shot_id
 join episode_package_import p on p.id=s.package_id group by p.episode_key`,
 EP_PACKAGE_CHOICES:`select p.episode_key,count(*)::int as n from episode_package_voice_choice t
 join episode_package_shot s on s.id=t.shot_id join episode_package_import p on p.id=s.package_id
 group by p.episode_key`,
 DIRECTOR_REFERENCE_VIDEOS:`select count(*)::int as n,coalesce(sum(pg_column_size(video_data)),0)::bigint as bytes from episode_director_reference_video`,
 SPLINE_SHOT_RENDERS:`select count(*)::int as n,coalesce(sum(pg_column_size(video_data)),0)::bigint as bytes from spline_shot_render`,
 SPLINE_SNAPSHOTS:`select count(*)::int as n,coalesce(sum(pg_column_size(image_data)),0)::bigint as bytes from spline_snapshot`,
 };
 for(const [key,sql] of Object.entries(queries)){try{const rows=(await db.query(sql)).rows.map(x=>({...x,MiB:x.bytes===undefined?undefined:fmt(x.bytes)}));console.log('MEDIAOS_VOICE_BLOB_INVENTORY '+JSON.stringify({group:key,rows}))}catch(e){console.log('MEDIAOS_VOICE_BLOB_AUDIT_ERROR '+JSON.stringify({group:key,error:e.message}))}}
 const dbStats=(await db.query(`select pg_database_size(current_database())::bigint as bytes,
 (select coalesce(sum(size),0)::bigint from pg_ls_waldir()) as walbytes`)).rows[0];
 console.log('MEDIAOS_VOICE_AUDIT_DB_HEADROOM '+JSON.stringify({dbMiB:fmt(dbStats.bytes),walMiB:fmt(dbStats.walbytes)}));
 await db.query('COMMIT');
}catch(e){console.log('MEDIAOS_VOICE_TABLE_AUDIT_BLOCKED '+String(e.stack||e).slice(0,3500));await db.query('ROLLBACK').catch(()=>{});}finally{await db.end().catch(()=>{})}
