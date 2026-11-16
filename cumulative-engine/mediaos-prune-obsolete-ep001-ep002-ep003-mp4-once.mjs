import {Client} from 'pg';
const PROJECT='11111111-1111-1111-1111-111111111111';
const keep=[
 {episode:'EP001',id:'904b3075-c5ee-49a3-9d3b-7d4a36f8fbf8',composition:'EP001-Voice-CurrentPreview',bytes:94164846,frames:37703},
 {episode:'EP002',id:'56c2a4b7-8bc0-465b-baea-80fa3707e709',composition:'EP002-DIRECTOR-MASTER',bytes:83569046,frames:23446},
 {episode:'EP003',id:'63827ce6-2ea8-4853-a61b-8549fe8db967',composition:'EP003-CUMULATIVE-DIRECTOR-MASTER',bytes:152025545,frames:38593}
];
const mib=n=>Math.round(Number(n)/1048576*100)/100;
const check=(v,m)=>{if(!v)throw Error('MEDIAOS_FINAL_THREE_ONLY_PRUNE_FAIL_CLOSED_'+m)};
const cap=Number(process.env.MEDIAOS_FINAL_FILMS_PRUNE_PASS_MIB||'32');
const confirmed=process.env.MEDIAOS_FINAL_FILMS_PRUNE_EXPLICIT==='true';
const db=new Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:12000,
 application_name:'mediaos_prune_only_obsolete_3_episodes_preserving_3_verified_full_mp4'});
async function verify(){
 const rows=(await db.query(`select id::text,composition_id,status,width,height,fps,duration_in_frames,
  octet_length(video_data)::bigint as stored_bytes,input_props
  from remotion_render where project_id=$1::uuid and id=any($2::uuid[])`,
  [PROJECT,keep.map(x=>x.id)])).rows;
 check(rows.length===3,'ALL_THREE_FINAL_MASTERS_NOT_PRESENT');
 for(const master of keep){
  const r=rows.find(x=>x.id===master.id);
  check(r&&r.status==='SUCCEEDED'&&r.composition_id===master.composition
   &&r.width===1920&&r.height===1080&&r.fps===30
   &&r.duration_in_frames===master.frames&&Number(r.stored_bytes)===master.bytes,
   'WRONG_FINAL_MASTER_'+master.episode);
  const p=typeof r.input_props==='string'?JSON.parse(r.input_props):r.input_props;
  if(master.episode==='EP001')check(p.soundDesign==='EP001_SOUND_DESIGN_V1','EP001_SOUND_DESIGN_MASTER_MISSING');
  if(master.episode==='EP002')check(p.masterMode==='DIRECTOR_V4_CLEAN_CUT_NO_BRIDGE','EP002_LAST_CLEAN_CUT_MASTER_CHANGED');
  if(master.episode==='EP003')check(p.directorLocked===true&&p.verified===true,'EP003_LOCK_MISSING');
 }
 return true;
}
const scope=`project_id=$1::uuid
 and (composition_id like 'EP001-%' or composition_id like 'EP002-%' or composition_id like 'EP003-%')
 and id<>all($2::uuid[]) and video_data is not null`;
async function main(){try{
 check(process.env.DATABASE_URL?.startsWith('postgres'),'DATABASE_NOT_AUTHORIZED');
 check(Number.isInteger(cap)&&cap>=16&&cap<=160,'UNSAFE_PASS_CAP');
 await db.connect();await verify();
 const inFlight=(await db.query(`select id::text,composition_id,status,progress,created_at
  from remotion_render where project_id=$1::uuid
  and (composition_id like 'EP001-%' or composition_id like 'EP002-%' or composition_id like 'EP003-%')
  and status in ('QUEUED','RUNNING')
  and (progress>0 or created_at>now()-interval '12 hours') limit 10`,[PROJECT])).rows;
 check(inFlight.length===0,'ACTIVE_CURRENT_EPISODE_RENDERS_EXIST');
 const candidates=(await db.query(`select id::text,composition_id,coalesce(size_bytes,octet_length(video_data),0)::bigint as bytes,
 object_url,created_at from remotion_render where ${scope}
 order by coalesce(size_bytes,octet_length(video_data),0),id`,[PROJECT,keep.map(x=>x.id)])).rows;
 check(candidates.every(x=>!x.object_url),'SOME_MP4_FILES_EXTERNAL_STORAGE__MANUAL_REVIEW');
 const before=(await db.query(`select pg_database_size(current_database())::bigint as dbbytes,
 (select coalesce(sum(size),0)::bigint from pg_ls_waldir()) as walbytes`)).rows[0];
 const available=candidates.reduce((n,x)=>n+Number(x.bytes),0);
 console.log('MEDIAOS_FINAL_THREE_ONLY_PRUNE_AUDIT '+JSON.stringify({
  candidates:candidates.length,obsoleteMiB:mib(available),
  protectedMasters:keep.map(x=>({episode:x.episode,id:x.id,MiB:mib(x.bytes)})),
  capMiB:cap,confirmed,dbMiB:mib(before.dbbytes),walMiB:mib(before.walbytes)
 }));
 check(mib(before.walbytes)<=1030&&mib(before.dbbytes)<=3440,'POSTGRES_CAPACITY_ALREADY_SPIKING');
 if(!confirmed)return;
 const selected=[];let planBytes=0;
 for(const x of candidates){
  const n=Number(x.bytes);
  if(n>cap*1048576-planBytes)continue;
  selected.push(x);planBytes+=n;
 }
 check(selected.length>0||candidates.length===0,'NO_CANDIDATE_FITS_PASS_CAP');
 console.log('MEDIAOS_FINAL_THREE_ONLY_BATCH_PLAN '+JSON.stringify({batchCount:selected.length,MiB:mib(planBytes)}));
 let removed=0;
 for(const x of selected){
  const result=await db.query(`update remotion_render r
   set video_data=null,size_bytes=null,updated_at=now()
   where id=$1::uuid and project_id=$2::uuid
   and id<>all($3::uuid[])
   and (composition_id like 'EP001-%' or composition_id like 'EP002-%' or composition_id like 'EP003-%')
   and video_data is not null and object_url is null
   and not exists(select 1 from remotion_render active
    where active.project_id=r.project_id
    and active.status in ('QUEUED','RUNNING') and active.progress>0
    and active.input_props::text like ('%'||r.id::text||'%'))`,
   [x.id,PROJECT,keep.map(y=>y.id)]);
  check(result.rowCount===1,'TARGET_CHANGED_'+x.id);
  removed++;
 }
 await verify();
 const left=(await db.query(`select count(*)::integer as count,
 coalesce(sum(coalesce(size_bytes,octet_length(video_data))),0)::bigint as bytes
 from remotion_render where ${scope}`,[PROJECT,keep.map(x=>x.id)])).rows[0];
 const after=(await db.query(`select pg_database_size(current_database())::bigint as dbbytes,
 (select coalesce(sum(size),0)::bigint from pg_ls_waldir()) as walbytes`)).rows[0];
 console.log((left.count===0?'MEDIAOS_FINAL_THREE_ONLY_ALL_SHOT_MP4S_PRUNED':'MEDIAOS_FINAL_THREE_ONLY_BATCH_DONE')+' '+JSON.stringify({
  deletedPayloadCount:removed,deletedSourceMiB:mib(planBytes),
  remainingCount:left.count,remainingMiB:mib(left.bytes),
  protectedMastersStillByteIntact:true,
  dbMiBBefore:mib(before.dbbytes),dbMiBAfter:mib(after.dbbytes),
  walMiBBefore:mib(before.walbytes),walMiBAfter:mib(after.walbytes),
  noVoiceDeletionInThisWorker:true,noPaidGeneration:true,
  note:'Logical data removal; PostgreSQL physical allocated files may remain until safe vacuum.'
 }));
}catch(e){console.error('MEDIAOS_FINAL_THREE_ONLY_PRUNE_BLOCKED '+String(e.stack||e));process.exitCode=1;}
finally{await db.end().catch(()=>{})}

}
await main();
