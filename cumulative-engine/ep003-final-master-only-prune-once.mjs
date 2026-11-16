import {Client} from 'pg';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';

const PROJECT='11111111-1111-1111-1111-111111111111';
const MASTER_ID='63827ce6-2ea8-4853-a61b-8549fe8db967';
const MASTER_SHA='1560d46f8067c735a2578d769bfcda465f651e46babdf4bd7dfa1090f6ce8ff6';
const MASTER_FRAMES=38593;
const MASTER_BYTES=152025545;
const MANIFEST='/app/remotion-engine/ep003-director-locked-visual-sequence-11.json';
const DB=String(process.env.DATABASE_URL||'').trim();
const PIN=String(process.env.RAILWAY_GIT_COMMIT_SHA||'').trim();
const DELETE=process.env.EP003_FINISHED_MASTER_PRUNE_CONFIRMED==='true';
const check=(c,m)=>{if(!c)throw Error('EP003_STORAGE_FAIL_CLOSED_'+m);};
const mb=n=>Math.round(Number(n)/1048576*100)/100;
export function validateApprovedMaster(master,manifest){
 check(manifest?.episodeKey==='EP003'&&manifest.shots?.length===11,'WRONG_CANONICAL_MANIFEST');
 check(master?.id===MASTER_ID&&master.status==='SUCCEEDED'&&master.project_id===PROJECT,
  'MASTER_ROW_OR_PROJECT_WRONG');
 check(master.composition_id==='EP003-CUMULATIVE-DIRECTOR-MASTER'
    &&master.render_key==='EP003_CUMULATIVE_LOCKED_SHOTS_01_TO_11',
  'MASTER_NOT_OFFICIAL_FINAL_11');
 check(Number(master.duration_in_frames)===MASTER_FRAMES
   &&Number(master.actual_bytes)===MASTER_BYTES&&master.profile==='REVIEW'
   &&master.width===1920&&master.height===1080&&master.fps===30,
  'FINAL_MASTER_BYTES_DURATION_OR_PROFILE_CHANGED');
 const props=typeof master.input_props==='string'?JSON.parse(master.input_props):master.input_props;
 check(props?.directorLocked===true&&props?.verified===true
   &&props?.masterSha256===MASTER_SHA&&props?.shotCount===11,
  'FINAL_MASTER_SHA_OR_DIRECTOR_LOCK_UNVERIFIED');
 check(Array.isArray(props.sequence)&&props.sequence.length===11&&
  Array.isArray(props.qa)&&props.qa.length===10,
  'FINAL_MASTER_PROVENANCE_OR_TEN_SEAMS_MISSING');
 for(let i=0;i<manifest.shots.length;i++){
  const shot=manifest.shots[i],source=props.sequence[i];
  check(shot.directorLocked===true&&source.directorLocked===true
   &&source.renderId===shot.renderId&&source.sha256===shot.sha256
   &&source.frames===shot.frames&&source.shotKey===shot.shotKey,
   'FINAL_MASTER_LOCKED_SOURCE_MISMATCH_'+shot.shotKey);
 }
 check(props.qa.every(x=>Number(x.actualJoinPsnrDb)>=27&&
   Number(x.matchedOriginalPreviousPsnrDb)>=50&&
   Number(x.matchedOriginalNextPsnrDb)>=50),
  'MASTER_TEN_DECODED_SEAMS_NOT_VERIFIED');
 check(manifest.shots.reduce((n,x)=>n+x.frames,0)===MASTER_FRAMES,
  'FULL_MASTER_FRAME_MANIFEST_MISMATCH');
 return true;
}
async function diskStats(db){
 const x=(await db.query(`select pg_database_size(current_database())::bigint as allocated,
    pg_total_relation_size('remotion_render')::bigint as table_allocated,
    pg_total_relation_size(c.reltoastrelid::regclass)::bigint as toast_allocated
    from pg_class c where c.oid='remotion_render'::regclass`)).rows[0];
 return {databaseAllocatedMb:mb(x.allocated),renderRelationAllocatedMb:mb(x.table_allocated),
  toastAllocatedMb:mb(x.toast_allocated)};
}
async function main(){
 check(DB.startsWith('postgres'),'DATABASE_URL_MISSING');
 check(/^[a-f0-9]{40}$/.test(PIN),'PINNED_SOURCE_SHA_MISSING');
 const manifest=JSON.parse(await fs.readFile(MANIFEST,'utf8'));
 const db=new Client({connectionString:DB,connectionTimeoutMillis:12000,
  application_name:'ep003_final_master_only_conservative_storage_cleanup'});
 await db.connect();
 try{
  const master=(await db.query(`select id::text,id::text as render_id,project_id::text,
   composition_id,render_key,status,profile,width,height,fps,duration_in_frames,
   octet_length(video_data)::bigint as actual_bytes,input_props,finished_at
   from remotion_render where id=$1::uuid and project_id=$2::uuid`,
   [MASTER_ID,PROJECT])).rows[0];
  validateApprovedMaster(master,manifest);
  const inFlight=await db.query(`select id::text,composition_id,render_key,status,
    created_at,updated_at,progress
    from remotion_render where project_id=$1::uuid
      and composition_id like 'EP003-%' and status in ('QUEUED','RUNNING')
    order by created_at desc limit 25`,[PROJECT]);
  if(inFlight.rows.length>0)console.log('EP003_STORAGE_INFLIGHT_PREFLIGHT '+JSON.stringify({
    count:inFlight.rows.length,rows:inFlight.rows
  }));
  check(inFlight.rows.length===0,'EP003_RENDER_IN_FLIGHT__PRUNE_NOT_ALLOWED');
  const q=`select id::text as id,composition_id,render_key,status,
     coalesce(size_bytes,octet_length(video_data),0)::bigint as bytes,
     object_url,created_at
    from remotion_render
    where project_id=$1::uuid and composition_id like 'EP003-%'
      and id<>$2::uuid and created_at <= $3::timestamptz
      and video_data is not null and profile<>'REEL'
    order by created_at,id`;
  const candidate=(await db.query(q,[PROJECT,MASTER_ID,master.finished_at])).rows;
  const objects=candidate.filter(x=>x.object_url);
  check(objects.length===0,'OTHER_EXTERNAL_OBJECT_URL_STORAGE_FOUND__MANUAL_REVIEW_REQUIRED');
  const total=candidate.reduce((n,x)=>n+Number(x.bytes),0);
  const grouped=Object.values(candidate.reduce((acc,r)=>{
   const category=r.composition_id.includes('CUMULATIVE')?'OBSOLETE_FULL_MASTER_OR_WIP':'OBSOLETE_INDIVIDUAL_SHOT';
   const t=acc[category]??(acc[category]={category,count:0,logicalBytes:0});
   t.count++;t.logicalBytes+=Number(r.bytes);return acc;
  },{})).map(x=>({category:x.category,count:x.count,logicalMb:mb(x.logicalBytes)}));
  const before=await diskStats(db);
  console.log('EP003_FINAL_MASTER_ONLY_STORAGE_AUDIT '+JSON.stringify({
   mode:DELETE?'EXPLICIT_DIRECTOR_PRUNE':'READ_ONLY_PREFLIGHT',
   protectedMasterId:MASTER_ID,masterSha256:MASTER_SHA,masterMb:mb(MASTER_BYTES),
   lockedSourcesVerified:11,decodedSeamsVerified:10,inFlightRenders:0,
   candidateCount:candidate.length,candidateLogicalMb:mb(total),grouped,
   databaseBefore:before,sourceCommit:PIN,otherEpisodesUntouched:true,
   originalVoiceAudioUntouched:true,sourceCodeUntouched:true,
   reassemblingPriorMastersFromPurgedSourceMp4RequiresRerender:true
  }));
  if(!DELETE)return;
  let removed=0,released=0;
  for(const row of candidate){
   const affected=await db.query(`update remotion_render r
    set video_data=null,size_bytes=null,updated_at=now()
    where id=$1::uuid and project_id=$2::uuid
      and id<>$3::uuid and composition_id like 'EP003-%'
      and created_at <= $4::timestamptz and video_data is not null and profile<>'REEL'
      and not exists(select 1 from remotion_render live
        where live.project_id=r.project_id
          and live.composition_id like 'EP003-%' and live.status in ('QUEUED','RUNNING'))`,
    [row.id,PROJECT,MASTER_ID,master.finished_at]);
   check(affected.rowCount===1,'RACE_OR_UNEXPECTED_PRUNE_TARGET_'+row.id);
   removed++;released+=Number(row.bytes);
   if(removed%10===0)console.log('EP003_STORAGE_PRUNE_PROGRESS '+JSON.stringify({removed,total:candidate.length,logicalMb:mb(released)}));
  }
  const remaining=(await db.query(q,[PROJECT,MASTER_ID,master.finished_at])).rows;
  check(remaining.length===0,'EP003_OBSOLETE_MP4_PAYLOADS_REMAIN');
  const protectedRow=(await db.query(`select status,octet_length(video_data)::bigint as bytes,
    input_props->>'masterSha256' as sha from remotion_render
    where id=$1::uuid and project_id=$2::uuid`,[MASTER_ID,PROJECT])).rows[0];
  check(protectedRow?.status==='SUCCEEDED'&&Number(protectedRow.bytes)===MASTER_BYTES
    &&protectedRow.sha===MASTER_SHA,'FINAL_MASTER_WAS_MODIFIED_DURING_PRUNE');
  const after=await diskStats(db);
  console.log('EP003_FINAL_MASTER_ONLY_STORAGE_PRUNE_SAVED '+JSON.stringify({
    protectedMasterId:MASTER_ID,removedVideoPayloads:removed,
    releasedSourceBytes:released,releasedSourceMb:mb(released),
    remainingObsoleteMp4Count:0,remainingFullEpisodeMasterMb:mb(MASTER_BYTES),
    databaseBefore:before,databaseAfter:after,
    note:'Removed bytes are logical MP4 payload size. PostgreSQL allocated file size may require VACUUM/reuse; it is not the same as free physical volume.',
    metadataRetained:true,voiceRetained:true,otherEpisodesUntouched:true
  }));
 }finally{await db.end();}
}
if(process.argv[1]&&process.argv[1].endsWith('ep003-final-master-only-prune-once.mjs')){
 main().catch(e=>{console.error('EP003_STORAGE_PRUNE_BLOCKED '+String(e.stack||e));process.exitCode=1;});
}
