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
