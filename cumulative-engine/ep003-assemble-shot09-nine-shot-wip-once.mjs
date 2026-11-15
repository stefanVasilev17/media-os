import {Client} from 'pg';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {createHash,randomUUID} from 'node:crypto';

const PROJECT='11111111-1111-1111-1111-111111111111';
const EIGHT_MASTER_ID='624da8ff-78e7-404e-8202-a4aa6e02e4f5';
const EIGHT_MASTER_SHA='4759e926cf4c3880e7a5fe6ecbaba94627d9489bb233ae2eeccebf4547f084e7';
const SHOT08_ID='22059373-cc17-44fd-ad03-56d092cc57dc';
const SHOT09_RENDER_KEY='EP003_SHOT09_FAILOVER_V1';
const SHOT09_COMPOSITION='EP003-SHOT09-FAILOVER-V1-DIRECTOR-CANDIDATE';
const MASTER_FRAMES=28328;
const GATE=process.env.EP003_SHOT09_NINE_SHOT_WIP_ASSEMBLY_APPROVED==='true';
const DB=String(process.env.DATABASE_URL||'');
const SHA=String(process.env.RAILWAY_GIT_COMMIT_SHA||'');
const CANDIDATE=String(process.env.EP003_SHOT09_WIP_RENDER_ID||'');
const CANDIDATE_SHA=String(process.env.EP003_SHOT09_WIP_SHA256||'');
const sha=x=>createHash('sha256').update(x).digest('hex');
const check=(x,reason)=>{if(!x)throw Error(reason);};
const name='EP003_CUMULATIVE_WIP_SHOTS_01_TO_09';
const composition='EP003-CUMULATIVE-WIP-SHOT09';
function run(cmd,args){
 return new Promise((resolve,reject)=>{
  const p=spawn(cmd,args,{stdio:['ignore','pipe','pipe']});
  let out='',err='';
  p.stdout.on('data',b=>out+=b.toString());
  p.stderr.on('data',b=>err+=b.toString());
  p.on('error',reject);
  p.on('close',code=>code===0?resolve({out,err}):
    reject(Error('EP003_SHOT09_WIP_PROCESS_FAILED '+cmd+' '+err.slice(-1200))));
 });
}
async function probe(p){
 return JSON.parse((await run('ffprobe',['-v','error','-show_entries',
  'format=duration,size:stream=codec_type,codec_name,width,height,avg_frame_rate,nb_frames',
  '-of','json',p])).out);
}
function media(info,frames,label){
 const video=info.streams.find(x=>x.codec_type==='video');
 const audio=info.streams.find(x=>x.codec_type==='audio');
 check(video?.codec_name==='h264'&&video.width===1920&&video.height===1080&&
  Number(video.nb_frames)===frames&&
  ['30/1','30'].includes(video.avg_frame_rate)&&audio?.codec_name==='aac',
  'EP003_SHOT09_WIP_MEDIA_INVALID_'+label);
}
async function extract(movie,n,file){
 await run('ffmpeg',['-hide_banner','-nostdin','-loglevel','error','-i',movie,
  '-vf','select=eq(n\\,'+n+')','-vsync','0','-frames:v','1','-y',file]);
 check((await fs.stat(file)).size>10000,'EP003_SHOT09_WIP_FRAME_MISSING');
}
async function psnr(a,b){
 const {err}=await run('ffmpeg',['-hide_banner','-nostdin','-i',a,'-i',b,
  '-lavfi','psnr','-frames:v','1','-f','null','-']);
 const raw=err.match(/average:(inf|[0-9.]+)/i)?.[1];
 check(Boolean(raw),'EP003_SHOT09_WIP_PSNR_NOT_MEASURED');
 return raw.toLowerCase()==='inf'?100:Number(raw);
}
async function main(){
 check(GATE,'EP003_SHOT09_WIP_ASSEMBLY_NOT_AUTHORIZED');
 check(DB.startsWith('postgres'),'EP003_SHOT09_WIP_POSTGRES_REQUIRED');
 check(/^[a-f0-9]{40}$/.test(SHA),'EP003_SHOT09_WIP_SOURCE_UNPINNED');
 check(/^[a-f0-9-]{36}$/.test(CANDIDATE)&&/^[a-f0-9]{64}$/.test(CANDIDATE_SHA),
  'EP003_SHOT09_WIP_CANDIDATE_NOT_VERIFIED');
 const db=new Client({connectionString:DB,connectionTimeoutMillis:12000,
  application_name:'ep003_shot09_nine_shot_wip_once'});
 await db.connect();
 let tmp=null,renderId=null;
 try{
  const locked=JSON.parse(await fs.readFile(
   '/app/remotion-engine/ep003-director-locked-visual-sequence.json','utf8'));
  check(locked.episodeKey==='EP003'&&locked.shots?.length===8&&
    locked.shots.every((v,i)=>v.directorLocked===true&&v.shotKey==='SHOT'+String(i+1).padStart(2,'0'))&&
    locked.shots[7].renderId===SHOT08_ID&&
    locked.shots.reduce((n,v)=>n+v.frames,0)===MASTER_FRAMES,
    'EP003_SHOT09_WIP_LOCKED_EIGHT_SHOT_MANIFEST_CHANGED');
  const rows=(await db.query(`
    select id,render_key,composition_id,engine_version,profile,status,
     width,height,fps,duration_in_frames,video_data
    from remotion_render where id in ($1::uuid,$2::uuid)
    and project_id=$3::uuid
   `,[EIGHT_MASTER_ID,CANDIDATE,PROJECT])).rows;
  const master=rows.find(x=>String(x.id)===EIGHT_MASTER_ID);
  const candidate=rows.find(x=>String(x.id)===CANDIDATE);
  check(master?.status==='SUCCEEDED'&&master.render_key==='EP003_CUMULATIVE_LOCKED_SHOTS_01_TO_08'&&
   master.composition_id==='EP003-CUMULATIVE-DIRECTOR-MASTER'&&
   master.profile==='REVIEW'&&Number(master.duration_in_frames)===MASTER_FRAMES&&
   master.video_data?.length>1000000&&sha(master.video_data)===EIGHT_MASTER_SHA,
   'EP003_SHOT09_WIP_OFFICIAL_EIGHT_SHOT_SOURCE_UNSAFE');
  check(candidate?.status==='SUCCEEDED'&&candidate.render_key===SHOT09_RENDER_KEY&&
   candidate.composition_id===SHOT09_COMPOSITION&&candidate.profile==='REVIEW'&&
   candidate.video_data?.length>1000000&&sha(candidate.video_data)===CANDIDATE_SHA&&
   String(candidate.engine_version).startsWith('EP003_SHOT09_PIN_')&&
   Number(candidate.duration_in_frames)>=3000&&Number(candidate.duration_in_frames)<=4500,
   'EP003_SHOT09_WIP_CANDIDATE_DOES_NOT_MATCH_VERIFIED_RENDER');
  const frames=MASTER_FRAMES+Number(candidate.duration_in_frames);
  const stamp=sha('EP003_SHOT09_WIP_V1|'+EIGHT_MASTER_SHA+'|'+CANDIDATE_SHA+'|'+frames);
  const prior=(await db.query('select id,status,video_data from remotion_render where project_id=$1::uuid and render_hash=$2',[PROJECT,stamp])).rows[0];
  if(prior){check(prior.status==='SUCCEEDED'&&prior.video_data?.length>1000000,
    'EP003_SHOT09_WIP_PREVIOUS_INCOMPLETE_NOT_RETRIED');
   console.log('EP003_SHOT09_WIP_IDENTICAL_ALREADY_SAVED '+JSON.stringify({renderId:prior.id,frames}));
   return;
  }
  tmp=await fs.mkdtemp(path.join(os.tmpdir(),'ep003-nine-shot-wip-'));
  const first=path.join(tmp,'locked-eight-shot-master.mp4');
  const second=path.join(tmp,'unlocked-shot09-v1.mp4');
  const output=path.join(tmp,'ep003-nine-shot-wip.mp4');
  await fs.writeFile(first,master.video_data);
  await fs.writeFile(second,candidate.video_data);
  media(await probe(first),MASTER_FRAMES,'MASTER8');
  media(await probe(second),Number(candidate.duration_in_frames),'SHOT09');
  const list=path.join(tmp,'source.ffconcat');
  await fs.writeFile(list,'ffconcat version 1.0\nfile locked-eight-shot-master.mp4\nfile unlocked-shot09-v1.mp4\n');
  console.log('EP003_SHOT09_WIP_VERIFIED_LOCKED_MASTER_AND_UNLOCKED_CANDIDATE '+JSON.stringify({
   officialMasterRenderId:EIGHT_MASTER_ID,candidateRenderId:CANDIDATE,sha256:CANDIDATE_SHA,
   sourceSha:SHA,frames,lockedShots:8,unlockedShots:1}));
  renderId=randomUUID();
  await db.query(`insert into remotion_render(
   id,project_id,composition_id,render_key,engine_version,profile,status,
   width,height,fps,duration_in_frames,progress,render_hash,input_props)
   values($1::uuid,$2::uuid,$3,$4,$5,'REVIEW','RUNNING',1920,1080,30,$6,0,$7,$8::jsonb)`,
   [renderId,PROJECT,composition,name,'EP003_SHOT09_WIP_'+SHA.slice(0,12),
    frames,stamp,JSON.stringify({directorLocked:false,lockedShots:8,unlockedCandidate:'SHOT09',
      officialMasterRenderId:EIGHT_MASTER_ID,candidateRenderId:CANDIDATE,frames,sourceSha:SHA})]);
  await run('ffmpeg',['-hide_banner','-nostdin','-loglevel','error',
   '-f','concat','-safe','0','-i',list,'-map','0:v:0','-map','0:a:0',
   '-c','copy','-movflags','+faststart','-y',output]);
  media(await probe(output),frames,'NINE_SHOT_WIP');
  const p8=path.join(tmp,'p8.png'),p9=path.join(tmp,'p9.png');
  const out8=path.join(tmp,'o8.png'),out9=path.join(tmp,'o9.png');
  await extract(first,MASTER_FRAMES-1,p8);
  await extract(second,0,p9);
  await extract(output,MASTER_FRAMES-1,out8);
  await extract(output,MASTER_FRAMES,out9);
  const boundary=await psnr(p8,p9),match8=await psnr(p8,out8),match9=await psnr(p9,out9);
  check(boundary>=27&&match8>=50&&match9>=50,
   'EP003_SHOT09_WIP_REAL_ENCODED_EIGHT_TO_NINE_SEAM_FAILED');
  const bytes=await fs.readFile(output);
  check(bytes.length>1000000&&bytes.length<256*1024*1024,
    'EP003_SHOT09_WIP_MP4_SIZE_UNSAFE');
  const videoSha=sha(bytes);
  const result=await db.query(`update remotion_render
   set status='SUCCEEDED',progress=100,video_data=$1,size_bytes=$2,
       media_type='video/mp4',finished_at=now(),updated_at=now()
   where id=$3::uuid and status='RUNNING'`,[bytes,bytes.length,renderId]);
  check(result.rowCount===1,'EP003_SHOT09_WIP_MP4_NOT_SAVED');
  console.log('EP003_SHOT09_NINE_SHOT_WIP_FULL_MP4_SAVED '+JSON.stringify({
   renderId,renderKey:name,sourceSha:SHA,frames,seconds:frames/30,
   bytes:bytes.length,sha256:videoSha,lockedShots:8,unlockedShot09:true,
   seam:{from:'SHOT08',to:'SHOT09',boundaryPsnrDb:boundary,
    previousSourceMatchDb:match8,nextSourceMatchDb:match9},
   officialEightShotMasterPreserved:true,
   directorStatus:'UNLOCKED_NINE_SHOT_WIP__NOT_OFFICIAL_MASTER'}));
 }catch(e){
  console.error('EP003_SHOT09_WIP_ASSEMBLY_BLOCKED '+String(e.stack||e));
  if(renderId)await db.query(`update remotion_render
   set status='FAILED',error=$1,finished_at=now(),updated_at=now()
   where id=$2::uuid and status='RUNNING'`,
   [String(e.message||e).slice(0,1000),renderId]).catch(()=>{});
  process.exitCode=1;
 }finally{
  await db.end().catch(()=>{});
  if(tmp)await fs.rm(tmp,{recursive:true,force:true}).catch(()=>{});
 }
}
main().catch(e=>{console.error('EP003_SHOT09_WIP_FATAL '+String(e.stack||e));process.exitCode=1;});
