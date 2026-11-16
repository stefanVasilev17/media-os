import {Client} from 'pg';
const PROJECT='11111111-1111-1111-1111-111111111111';
const kept=[
 {id:'904b3075-c5ee-49a3-9d3b-7d4a36f8fbf8',bytes:94164846,frames:37703,ep:'EP001'},
 {id:'56c2a4b7-8bc0-465b-baea-80fa3707e709',bytes:83569046,frames:23446,ep:'EP002'},
 {id:'63827ce6-2ea8-4853-a61b-8549fe8db967',bytes:152025545,frames:38593,ep:'EP003'}];
const check=(x,m)=>{if(!x)throw Error('THREE_FINAL_FILMS_STANDALONE_VOICE_CLEANUP_BLOCKED_'+m)};
const mb=n=>Math.round(Number(n)/1048576*100)/100;
const tasks=[
 {name:'EP001_VOICE_CLIP_WORKFLOW',table:'voice_clip_workflow',col:'generated_audio',mode:'null',where:"episode_id in (select id from episode where episode_number='EP001')"},
 {name:'EP001_SHOT_VOICE_WORKFLOW',table:'voice_shot_workflow',col:'generated_audio',mode:'null',where:"episode_id in (select id from episode where episode_number='EP001')"},
 {name:'EP001_STUDIO_CLIPS',table:'studio_clip',col:'generated_audio',mode:'null',where:"shot_id in (select s.id from studio_shot s join episode e on e.id=s.episode_id where e.episode_number='EP001')"},
 {name:'EP001_STUDIO_CLIP_REVISION_HISTORY',table:'studio_clip_revision_history',col:'audio',mode:'null',where:"clip_id in (select c.id from studio_clip c join studio_shot s on s.id=c.shot_id join episode e on e.id=s.episode_id where e.episode_number='EP001')"},
 {name:'EP001_SHOT05_ARCHIVED_AUDIO',table:'episode_shot05_voice_revision_archive',col:'audio',mode:'null',where:"episode_id in (select id from episode where episode_number='EP001')"},
 {name:'EP001_SHOT08_LEGACY_AUDIO',table:'shot08_v8_voice_preview',col:'generated_audio',mode:'empty',where:"true"},
 {name:'EP001_EP002_EP003_REVISION_TAKES',table:'episode_revision_voice_take',col:'audio',mode:'empty',where:"episode_id in (select id from episode where episode_number in ('EP001','EP002','EP003'))"},
 {name:'EP001_EP002_EP003_LOCKED_SCRIPT_TAKES',table:'episode_locked_script_voice_take',col:'audio',mode:'empty',where:"episode_id in (select id from episode where episode_number in ('EP001','EP002','EP003'))"},
 {name:'EP002_CREATIVE_TAKES',table:'ep002_creative_voice_take',col:'audio',mode:'empty',where:"true"},
 {name:'EP003_PACKAGE_VOICE_TAKES',table:'episode_package_voice_take',col:'audio',mode:'empty',where:"shot_id in (select s.id from episode_package_shot s join episode_package_import p on p.id=s.package_id where p.episode_key='EP003')"},
];
const db=new Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:14000,
 application_name:'mediaos_remove_all_standalone_voices_but_keep_three_actual_audio_mp4s'});
async function verify(){
 const r=(await db.query(`select id::text,status,composition_id,width,height,fps,duration_in_frames,octet_length(video_data)::bigint as bytes
  from remotion_render where id=any($1::uuid[]) and project_id=$2::uuid`,[kept.map(x=>x.id),PROJECT])).rows;
 check(r.length===3,'THREE_MASTERS_NOT_PRESENT');
 for(const k of kept){
  const row=r.find(x=>x.id===k.id);
  check(row?.status==='SUCCEEDED'&&Number(row.bytes)===k.bytes
   &&row.duration_in_frames===k.frames&&row.width===1920&&row.height===1080&&row.fps===30,
   'FINAL_MP4_CHANGED_'+k.ep);
 }
}
try{
 check(process.env.MEDIAOS_VOICE_DELETE_EXPLICIT==='true','USER_DELETION_GATE_DISABLED');
 await db.connect();await verify();
 const before=(await db.query(`select pg_database_size(current_database())::bigint as dbbytes,
 (select coalesce(sum(size),0)::bigint from pg_ls_waldir()) as walbytes`)).rows[0];
 check(mb(before.dbbytes)<3500&&mb(before.walbytes)<=512,'DATABASE_OUT_OF_SPACE_RISK');
 const plan=[];
 for(const task of tasks){
  const q=`select count(*)::int as rows,coalesce(sum(pg_column_size(${task.col})),0)::bigint as bytes
    from ${task.table} where ${task.where}
    and ${task.col} is not null and octet_length(${task.col})>0`;
  const row=(await db.query(q)).rows[0];
  plan.push({name:task.name,rows:row.rows,MiB:mb(row.bytes)});
 }
 check(plan.reduce((n,x)=>n+x.MiB,0)<120,'UNEXPECTED_STANDALONE_VOICE_AUDIO_TOO_LARGE');
 console.log('MEDIAOS_THREE_FINAL_FILMS_VOICE_DELETE_PLAN '+JSON.stringify({plan,
   totalMiB:Math.round(plan.reduce((n,x)=>n+x.MiB,0)*100)/100,
   dbMiB:mb(before.dbbytes),walMiB:mb(before.walbytes),protectedMp4Count:3}));
 const results=[];
 for(const task of tasks){
  const q=`update ${task.table} set ${task.col}=${task.mode==='null'?'null':"decode('','hex')"}
   where ${task.where} and ${task.col} is not null and octet_length(${task.col})>0`;
  const out=await db.query(q);
  const planRow=plan.find(x=>x.name===task.name);
  check(out.rowCount===planRow.rows,'CHANGED_WORKLOAD_ROW_COUNT_'+task.name);
  results.push({name:task.name,audioRowsPurged:out.rowCount,MiB:planRow.MiB});
  console.log('MEDIAOS_THREE_FINAL_FILMS_VOICE_DELETE_STEP '+JSON.stringify(results.at(-1)));
 }
 await verify();
 const residual=[];
 for(const task of tasks){
  const count=(await db.query(`select count(*)::int as n from ${task.table}
    where ${task.where} and ${task.col} is not null and octet_length(${task.col})>0`)).rows[0].n;
  if(count)residual.push({name:task.name,count});
 }
 check(residual.length===0,'VOICE_AUDIO_BYTES_STILL_PRESENT');
 const after=(await db.query(`select pg_database_size(current_database())::bigint as dbbytes,
 (select coalesce(sum(size),0)::bigint from pg_ls_waldir()) as walbytes`)).rows[0];
 console.log('MEDIAOS_THREE_FINAL_FILMS_ALL_STANDALONE_VOICES_REMOVED '+JSON.stringify({
  deletedAudioRows:results.reduce((n,x)=>n+x.audioRowsPurged,0),deletedAudioMiB:mb(plan.reduce((n,x)=>n+x.MiB,0)*1048576),
  dataTypesHandled:tasks.length,allResidualVoices:0,
  dbMiBBefore:mb(before.dbbytes),dbMiBAfter:mb(after.dbbytes),
  walMiBBefore:mb(before.walbytes),walMiBAfter:mb(after.walbytes),
  allThreeMp4WithEmbeddedAACPreserved:true,
  scriptAndProducerMetadataPreserved:true,
  nonNullAudioColumnsClearedToZeroByteInsteadOfBreakingForeignKeys:true
 }));
}catch(e){console.error('MEDIAOS_THREE_FINAL_FILMS_VOICE_DELETE_BLOCKED '+String(e.stack||e));process.exitCode=1;}
finally{await db.end().catch(()=>{})}
