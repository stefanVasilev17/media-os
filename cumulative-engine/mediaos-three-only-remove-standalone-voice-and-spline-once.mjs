
import {Client} from 'pg';

const PROJECT='11111111-1111-1111-1111-111111111111';
const epNumbers=['EP001','EP002','EP003'];
const locked=[
 {episode:'EP001',id:'904b3075-c5ee-49a3-9d3b-7d4a36f8fbf8',composition:'EP001-Voice-CurrentPreview',frames:37703,bytes:94164846},
 {episode:'EP002',id:'56c2a4b7-8bc0-465b-baea-80fa3707e709',composition:'EP002-DIRECTOR-MASTER',frames:23446,bytes:83569046},
 {episode:'EP003',id:'63827ce6-2ea8-4853-a61b-8549fe8db967',composition:'EP003-CUMULATIVE-DIRECTOR-MASTER',frames:38593,bytes:152025545}
];
const MB=n=>Math.round(Number(n||0)/1048576*100)/100;
const assert=(x,msg)=>{if(!x)throw Error('MEDIAOS_AUDIO_DELETE_FAIL_CLOSED_'+msg)};
const qMaster=`select id::text,composition_id,status,width,height,fps,duration_in_frames,
 octet_length(video_data)::bigint as stored_bytes,input_props
 from remotion_render where project_id=$1::uuid and id=any($2::uuid[])`;
const queryBytes=[
 ['voice_shot_workflow',`select count(*) filter(where generated_audio is not null)::integer as rows,coalesce(sum(pg_column_size(generated_audio)),0)::bigint as bytes
 from voice_shot_workflow w join episode e on e.id=w.episode_id
 where e.episode_number=any($1::text[])`],
 ['voice_clip_workflow',`select count(*) filter(where generated_audio is not null)::integer as rows,coalesce(sum(pg_column_size(generated_audio)),0)::bigint as bytes
 from voice_clip_workflow w join episode e on e.id=w.episode_id
 where e.episode_number=any($1::text[])`],
 ['episode_revision_voice_take',`select count(*) filter(where octet_length(audio)>0)::integer as rows,coalesce(sum(pg_column_size(audio)),0)::bigint as bytes
 from episode_revision_voice_take w join episode e on e.id=w.episode_id where e.episode_number=any($1::text[])`],
 ['episode_locked_script_voice_take',`select count(*) filter(where octet_length(audio)>0)::integer as rows,coalesce(sum(pg_column_size(audio)),0)::bigint as bytes
 from episode_locked_script_voice_take w join episode e on e.id=w.episode_id where e.episode_number=any($1::text[])`],
 ['episode_shot05_voice_revision_archive',`select count(*) filter(where audio is not null)::integer as rows,coalesce(sum(pg_column_size(audio)),0)::bigint as bytes
 from episode_shot05_voice_revision_archive w join episode e on e.id=w.episode_id where e.episode_number=any($1::text[])`],
 ['studio_clip',`select count(*) filter(where c.generated_audio is not null)::integer as rows,coalesce(sum(pg_column_size(c.generated_audio)),0)::bigint as bytes
 from studio_clip c join studio_shot s on s.id=c.shot_id join episode e on e.id=s.episode_id where e.episode_number=any($1::text[])`],
 ['studio_clip_revision_history',`select count(*) filter(where h.audio is not null)::integer as rows,coalesce(sum(pg_column_size(h.audio)),0)::bigint as bytes
 from studio_clip_revision_history h join studio_clip c on c.id=h.clip_id join studio_shot s on s.id=c.shot_id join episode e on e.id=s.episode_id where e.episode_number=any($1::text[])`],
 ['ep002_creative_voice_take',`select count(*) filter(where octet_length(audio)>0)::integer as rows,coalesce(sum(pg_column_size(audio)),0)::bigint as bytes from ep002_creative_voice_take`],
 ['shot08_v8_voice_preview',`select count(*) filter(where octet_length(generated_audio)>0)::integer as rows,coalesce(sum(pg_column_size(generated_audio)),0)::bigint as bytes from shot08_v8_voice_preview`],
 ['episode_package_voice_take',`select count(*) filter(where octet_length(t.audio)>0)::integer as rows,coalesce(sum(pg_column_size(t.audio)),0)::bigint as bytes
 from episode_package_voice_take t join episode_package_shot s on s.id=t.shot_id join episode_package_import p on p.id=s.package_id
 where p.episode_key=any($1::text[])`],
 ['spline_shot_render',`select count(*) filter(where video_data is not null)::integer as rows,coalesce(sum(pg_column_size(video_data)),0)::bigint as bytes
 from spline_shot_render where project_id=$2::uuid`],
 ['spline_snapshot',`select count(*)::integer as rows,coalesce(sum(pg_column_size(image_data)),0)::bigint as bytes from spline_snapshot where project_id=$2::uuid`],
];
const tx=new Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:14000,application_name:'director_mediaos_final_three_only_delete_separate_voice_and_legacy_media'});
async function checkMasters(){
 const rows=(await tx.query(qMaster,[PROJECT,locked.map(x=>x.id)])).rows;
 assert(rows.length===3,'ONE_OF_THREE_FINAL_MASTERS_MISSING');
 for(const expected of locked){
  const r=rows.find(x=>x.id===expected.id);
  assert(r?.status==='SUCCEEDED'&&r.composition_id===expected.composition
   &&r.width===1920&&r.height===1080&&r.fps===30
   &&r.duration_in_frames===expected.frames&&Number(r.stored_bytes)===expected.bytes,
   'LOCKED_FULL_VIDEO_NOT_EXACT_'+expected.episode);
  const props=r.input_props;
  if(expected.episode==='EP001')assert(props?.soundDesign==='EP001_SOUND_DESIGN_V1','EP001_WRONG_SOUND_MASTER');
  if(expected.episode==='EP002')assert(props?.masterMode==='DIRECTOR_V4_CLEAN_CUT_NO_BRIDGE','EP002_WRONG_MASTER_VERSION');
  if(expected.episode==='EP003')assert(props?.directorLocked===true&&props?.verified===true,'EP003_MASTER_NOT_DIRECTOR_VERIFIED');
 }
 return true;
}
async function totalAudio(){
 const rows=[];
 for(const [name,q] of queryBytes){
  const r=(await tx.query(q,q.includes('$2')?[epNumbers,PROJECT]:[epNumbers])).rows[0];
  rows.push({table:name,rows:r.rows,MiB:MB(r.bytes)});
 }
 return rows;
}
async function perform(label,sql,params=[]){
 const r=await tx.query(sql,params);
 console.log('MEDIAOS_AUDIO_DELETE_STEP '+JSON.stringify({label,rows:r.rowCount}));
 return r.rowCount;
}
try {
 assert(process.env.MEDIAOS_FINAL_THREE_ONLY_VOICE_DELETE==='true','EXPLICIT_DIRECTOR_APPROVAL_MISSING');
 assert(process.env.DATABASE_URL?.startsWith('postgres'),'DATABASE_URL_MISSING');
 await tx.connect();
 await tx.query('BEGIN');
 await tx.query("SET LOCAL lock_timeout = '8s'");
 await tx.query("SET LOCAL statement_timeout = '120s'");
 await checkMasters();
 const obsolete=(await tx.query(`select count(*)::integer as count from remotion_render where project_id=$1::uuid
 and (composition_id like 'EP001-%' or composition_id like 'EP002-%' or composition_id like 'EP003-%')
 and id<>all($2::uuid[]) and video_data is not null`,[PROJECT,locked.map(x=>x.id)])).rows[0];
 assert(obsolete.count===0,'OLD_SHOT_MP4_FILES_STILL_EXIST');
 const initial=await totalAudio();
 const MiB=initial.reduce((n,x)=>n+x.MiB,0);
 assert(MiB<300,'UNEXPECTED_MEDIA_AUDIO_AMOUNT');
 const system=(await tx.query(`select pg_database_size(current_database())::bigint as bytes,
 (select coalesce(sum(size),0)::bigint from pg_ls_waldir()) as wal_bytes`)).rows[0];
 assert(MB(system.wal_bytes)<1050&&MB(system.bytes)<3700,'POSTGRES_UNSAFE_DISK_HEADROOM');
 console.log('MEDIAOS_AUDIO_DELETE_PREFLIGHT '+JSON.stringify({protectedFinalMasters:locked.map(x=>x.episode),
  standaloneRows:initial,logicalMiB:MiB,dbMiB:MB(system.bytes),walMiB:MB(system.wal_bytes)}));
 const whereEpisode=`episode_id in(select id from episode where episode_number=any($1::text[]))`;
 await perform('voice_shot_workflow_audio',`update voice_shot_workflow set generated_audio=null,generated_audio_content_type=null,generated_audio_file_name=null,updated_at=now()
 where ${whereEpisode} and generated_audio is not null`,[epNumbers]);
 await perform('voice_clip_workflow_audio',`update voice_clip_workflow set generated_audio=null,generated_audio_content_type=null,generated_audio_file_name=null,updated_at=now()
 where ${whereEpisode} and generated_audio is not null`,[epNumbers]);
 await perform('archived_voice_take_audio',`update episode_shot05_voice_revision_archive set audio=null
 where ${whereEpisode} and audio is not null`,[epNumbers]);
 await perform('studio_clip_audio',`update studio_clip c set generated_audio=null,generated_audio_content_type=null,updated_at=now()
 from studio_shot s join episode e on e.id=s.episode_id
 where c.shot_id=s.id and e.episode_number=any($1::text[]) and c.generated_audio is not null`,[epNumbers]);
 await perform('studio_clip_revision_audio',`update studio_clip_revision_history h set audio=null
 from studio_clip c join studio_shot s on s.id=c.shot_id join episode e on e.id=s.episode_id
 where h.clip_id=c.id and e.episode_number=any($1::text[]) and h.audio is not null`,[epNumbers]);
 await perform('ep002_creative_voice_audio',`update ep002_creative_voice_take set audio=decode('','hex')
 where octet_length(audio)>0`);
 await perform('ep002_old_shot08_audio',`update shot08_v8_voice_preview set generated_audio=decode('','hex')
 where octet_length(generated_audio)>0`);
 await perform('episode_package_selected_takes_audio',`update episode_package_voice_take t set audio=decode('','hex')
 from episode_package_shot s join episode_package_import p on p.id=s.package_id
 where t.shot_id=s.id and p.episode_key=any($1::text[]) and octet_length(t.audio)>0`,[epNumbers]);
 await perform('episode_revision_voice_takes_audio',`update episode_revision_voice_take set audio=decode('','hex')
 where ${whereEpisode} and octet_length(audio)>0`,[epNumbers]);
 await perform('episode_locked_script_voice_takes_audio',`update episode_locked_script_voice_take set audio=decode('','hex')
 where ${whereEpisode} and octet_length(audio)>0`,[epNumbers]);
 await perform('old_spline_shot_mp4_payloads',`update spline_shot_render set video_data=null,size_bytes=null,updated_at=now()
 where project_id=$1::uuid and video_data is not null`,[PROJECT]);
 await perform('old_spline_temporary_snapshots',`delete from spline_snapshot where project_id=$1::uuid`,[PROJECT]);
 await checkMasters();
 const after=await totalAudio();
 const leftovers=after.filter(x=>x.rows!==0);
 assert(leftovers.length===0,'MEDIA_BYTES_STILL_REMAIN_'+JSON.stringify(leftovers));
 await tx.query('COMMIT');
 console.log('MEDIAOS_THREE_ONLY_VOICES_AND_SPLINE_CLEANED '+JSON.stringify({
  audioAndOtherMediaMiBBefore:MiB,remainingSeparateMediaBytes:0,
  verifiedThreeOriginalMasterFilesStillIntact:true,
  audioMetadataReferencesPreserved:true,
  noPayingForVoiceRegeneration:true,deletedProductionScriptOrArchitecturalSource:false,
  note:'Not-null voice bytea fields retain empty bytea to preserve foreign-key references; audio payload bytes are gone.'
 }));
} catch(e){console.error('MEDIAOS_THREE_ONLY_AUDIO_DELETE_BLOCKED '+String(e.stack||e));try{await tx.query('ROLLBACK')}catch{}process.exitCode=1;}finally{await tx.end().catch(()=>{})}
