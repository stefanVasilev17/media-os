import {Client} from 'pg';
const db=new Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:16000,application_name:'mediaos_standalone_audio_inventory_only'});
const MiB=n=>Number((Number(n||0)/1048576).toFixed(3));
const queries=[
['voice_shot_workflow',`select count(*)::int as rows,count(*) filter(where generated_audio is not null)::int as audio_rows,coalesce(sum(pg_column_size(generated_audio)),0)::bigint as bytes from voice_shot_workflow w join episode e on w.episode_id=e.id where e.episode_number in ('EP001','EP002','EP003')`],
['voice_clip_workflow',`select count(*)::int as rows,count(*) filter(where generated_audio is not null)::int as audio_rows,coalesce(sum(pg_column_size(generated_audio)),0)::bigint as bytes from voice_clip_workflow w join episode e on w.episode_id=e.id where e.episode_number in ('EP001','EP002','EP003')`],
['episode_revision_voice_take',`select count(*)::int as rows,count(*) filter(where audio is not null)::int as audio_rows,coalesce(sum(pg_column_size(audio)),0)::bigint as bytes from episode_revision_voice_take w join episode e on w.episode_id=e.id where e.episode_number in ('EP001','EP002','EP003')`],
['episode_locked_script_voice_take',`select count(*)::int as rows,count(*) filter(where audio is not null)::int as audio_rows,coalesce(sum(pg_column_size(audio)),0)::bigint as bytes from episode_locked_script_voice_take w join episode e on w.episode_id=e.id where e.episode_number in ('EP001','EP002','EP003')`],
['episode_shot05_voice_revision_archive',`select count(*)::int as rows,count(*) filter(where audio is not null)::int as audio_rows,coalesce(sum(pg_column_size(audio)),0)::bigint as bytes from episode_shot05_voice_revision_archive w join episode e on w.episode_id=e.id where e.episode_number in ('EP001','EP002','EP003')`],
['studio_clip',`select count(*)::int as rows,count(*) filter(where c.generated_audio is not null)::int as audio_rows,coalesce(sum(pg_column_size(c.generated_audio)),0)::bigint as bytes from studio_clip c join studio_shot s on s.id=c.shot_id join episode e on e.id=s.episode_id where e.episode_number in ('EP001','EP002','EP003')`],
['studio_clip_revision_history',`select count(*)::int as rows,count(*) filter(where h.audio is not null)::int as audio_rows,coalesce(sum(pg_column_size(h.audio)),0)::bigint as bytes from studio_clip_revision_history h join studio_clip c on c.id=h.clip_id join studio_shot s on s.id=c.shot_id join episode e on e.id=s.episode_id where e.episode_number in ('EP001','EP002','EP003')`],
['ep002_creative_voice_take',`select count(*)::int as rows,count(*)::int as audio_rows,coalesce(sum(pg_column_size(audio)),0)::bigint as bytes from ep002_creative_voice_take`],
['ep002_creative_voice_choice',`select count(*)::int as rows,0::int as audio_rows,0::bigint as bytes from ep002_creative_voice_choice`],
['shot08_v8_voice_preview',`select count(*)::int as rows,count(*)::int as audio_rows,coalesce(sum(pg_column_size(generated_audio)),0)::bigint as bytes from shot08_v8_voice_preview`],
['episode_package_voice_take',`select count(*)::int as rows,count(*)::int as audio_rows,coalesce(sum(pg_column_size(t.audio)),0)::bigint as bytes from episode_package_voice_take t join episode_package_shot s on s.id=t.shot_id join episode_package_import p on p.id=s.package_id where p.episode_key in ('EP001','EP002','EP003')`],
['episode_package_voice_choice',`select count(*)::int as rows,0::int as audio_rows,0::bigint as bytes from episode_package_voice_choice t join episode_package_shot s on s.id=t.shot_id join episode_package_import p on p.id=s.package_id where p.episode_key in ('EP001','EP002','EP003')`],
['episode_director_reference_video',`select count(*)::int as rows,count(*) filter(where video_data is not null)::int as audio_rows,coalesce(sum(pg_column_size(video_data)),0)::bigint as bytes from episode_director_reference_video`],
['spline_shot_render',`select count(*)::int as rows,count(*) filter(where video_data is not null)::int as audio_rows,coalesce(sum(pg_column_size(video_data)),0)::bigint as bytes from spline_shot_render`],
['spline_snapshot',`select count(*)::int as rows,count(*) filter(where image_data is not null)::int as audio_rows,coalesce(sum(pg_column_size(image_data)),0)::bigint as bytes from spline_snapshot`]
];
try {
 await db.connect(); await db.query('BEGIN READ ONLY');
 const totals=[];
 for(const [name,q] of queries){try{
 const r=(await db.query(q)).rows[0];totals.push({table:name,...r,MiB:MiB(r.bytes)});
 }catch(e){totals.push({table:name,error:e.message});}}
 const constraints=(await db.query(`select conrelid::regclass::text as child,confrelid::regclass::text as parent,conname,
 pg_get_constraintdef(oid) as def from pg_constraint where contype='f' and
 confrelid in ('ep002_creative_voice_take'::regclass,'episode_package_voice_take'::regclass,
 'episode_locked_script_voice_take'::regclass,'episode_revision_voice_take'::regclass,
 'studio_clip'::regclass) order by confrelid::regclass::text,conrelid::regclass::text`)).rows;
 const rawMediaSchema=(await db.query(`select table_name,column_name,data_type,is_nullable
 from information_schema.columns where table_schema='public' and table_name in
 ('episode_director_reference_video','spline_shot_render','spline_snapshot',
 'ep002_creative_voice_take','episode_package_voice_take','episode_locked_script_voice_take',
 'shot08_v8_voice_preview') order by table_name,ordinal_position`)).rows;
 console.log('MEDIAOS_STANDALONE_AUDIO_AUDIT '+JSON.stringify({tables:totals,totalStandaloneMiB:totals.filter(x=>!x.error&&x.table!=='spline_snapshot').reduce((n,x)=>n+Number(x.MiB),0).toFixed(2),references:constraints,mediaSchema:rawMediaSchema}));
 await db.query('COMMIT');
} catch(e){console.error('MEDIAOS_STANDALONE_AUDIO_AUDIT_FAILED '+String(e.stack||e));await db.query('ROLLBACK').catch(()=>{})} finally {await db.end().catch(()=>{})}
