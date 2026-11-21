import {Client} from 'pg';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {createHash,randomUUID} from 'node:crypto';

const MANIFEST_PATH='/app/remotion-engine/ep003-director-locked-visual-sequence.json';
const DB=String(process.env.DATABASE_URL||'').trim();
const GATE=process.env.EP003_CORRECTED_TEN_SHOT_WIP_ASSEMBLY_APPROVED==='true';
const SOURCE_SHA=String(process.env.RAILWAY_GIT_COMMIT_SHA||'').trim();
const PROJECT='11111111-1111-1111-1111-111111111111';
const COMPOSITION='EP003-CUMULATIVE-WIP-CORRECTED-TEN-SHOT';
const RENDER_KEY_PREFIX='EP003_CUMULATIVE_WIP_CORRECTED_SHOTS_01_TO_';
const FPS=30;
const sha256=x=>createHash('sha256').update(x).digest('hex');
function check(condition,reason){if(!condition)throw Error(reason);}

export function validateLockedSequence(m){
  check(m?.schemaVersion==='at.episode-locked-sequence.v1'&&m?.episodeKey==='EP003'&&m?.projectId===PROJECT,
    'EP003_CUMULATIVE_MANIFEST_WRONG_EPISODE_OR_SCHEMA');
  check(Array.isArray(m.shots)&&m.shots.length>=2&&m.shots.length<=30,
    'EP003_CUMULATIVE_SHOT_COUNT_NOT_DIRECTOR_APPROVED');
  const seen=new Set();
  for(let i=0;i<m.shots.length;i++){
    const s=m.shots[i];
    check(s.shotKey==='SHOT'+String(i+1).padStart(2,'0')
      &&s.directorLocked===true
      &&/^[a-f0-9-]{36}$/i.test(s.renderId)
      &&/^[a-f0-9]{64}$/.test(s.sha256)
      &&Number.isInteger(s.frames)&&s.frames>200&&s.frames<18000
      &&s.fps===FPS&&s.width===1920&&s.height===1080
      &&typeof s.renderKey==='string'&&s.renderKey.startsWith('EP003_')
      &&typeof s.compositionId==='string'&&s.compositionId.startsWith('EP003-')
      &&typeof s.voiceTakeId==='string'&&s.voiceTakeId.length===36,
      'EP003_CUMULATIVE_SHOT_NOT_SEQUENTIALLY_DIRECTOR_LOCKED_'+(i+1));
    check(!seen.has(s.renderId),'EP003_CUMULATIVE_DUPLICATED_SHOT_RENDER');
    seen.add(s.renderId);
  }
  const one=m.shots[0],two=m.shots[1];
  check(one.renderId==='b6fd7f30-7c78-414b-a88c-387c0ee8c43a'
    &&one.sha256==='da6d3cbc77dc3a0dc5374aec4a7ba8beb97739d4c5facffdf36d1585e7587c08'
    &&one.frames===2514&&one.renderKey==='EP003_SHOT01_V2',
    'EP003_CUMULATIVE_MUST_BEGIN_WITH_DIRECTOR_LOCKED_SHOT01_V2');
  check(two.renderId==='78db6f85-ba05-4714-ba4f-fc70d64def88'
    &&two.sha256==='5eceeb39954b9a5b6d755d136b3dd29fe04b5fc9e30992fcc65464f40bc2914e'
    &&two.frames===3443&&two.renderKey==='EP003_SHOT02_MOTION_V4'
    &&two.voiceLeadInFrames===60,
    'EP003_CUMULATIVE_SHOT02_V4_TWO_SECOND_BREATH_NOT_LOCKED');
  return m.shots.reduce((n,s)=>n+s.frames,0);
}

const CANDIDATES=[
 {shotKey:'SHOT08',version:'V4',renderKey:'EP003_SHOT08_SHARDING_V4',compositionId:'EP003-SHOT08-SHARDING-V4-DIRECTOR-CANDIDATE',engineVersion:'EP003_SHOT08_PIN_143975e3d6c0',frames:5372,voiceTakeId:'368c239c-a93b-437e-a833-2f955fa51803',idVar:'EP003_SHOT08_V4_RENDER_ID',shaVar:'EP003_SHOT08_V4_SHA256'},
 {shotKey:'SHOT09',version:'V3',renderKey:'EP003_SHOT09_FAILOVER_V3',compositionId:'EP003-SHOT09-FAILOVER-V3-DIRECTOR-CANDIDATE',engineVersion:'EP003_SHOT09_PIN_599d23563c9c',frames:3145,voiceTakeId:'7510815a-d096-415f-b4f0-52ae8398ce45',idVar:'EP003_SHOT09_V3_RENDER_ID',shaVar:'EP003_SHOT09_V3_SHA256'},
 {shotKey:'SHOT10',version:'V2',renderKey:'EP003_SHOT10_MEASUREMENT_V2',compositionId:'EP003-SHOT10-MEASUREMENT-V2-DIRECTOR-CANDIDATE',engineVersion:'EP003_SHOT10_PIN_51403eaa9dde',frames:4016,voiceTakeId:'0168eb87-538f-49d8-9c79-132d822bdb60',idVar:'EP003_SHOT10_V2_RENDER_ID',shaVar:'EP003_SHOT10_V2_SHA256'}
];
export function correctedWipSequence(m){
 check(validateLockedSequence(m)===31473&&m.shots.length===9
 &&m.shots[7].renderId==='d67eec72-66bb-427b-bdb9-0d4043ed5dd2'
 &&m.shots[8].renderId==='b3a3912f-79ee-4c72-b313-cbe09f950a5e',
 'EP003_WIP_OFFICIAL_NINE_SHOT_MANIFEST_CHANGED');
 const updated=CANDIDATES.map(x=>{
   const renderId=String(process.env[x.idVar]||'');
   const sha256=String(process.env[x.shaVar]||'');
   check(/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(renderId)&&/^[0-9a-f]{64}$/.test(sha256),
    'EP003_WIP_VERIFIED_SOURCE_MISSING_'+x.shotKey);
   return {shotKey:x.shotKey,version:x.version,renderId,sha256,
    compositionId:x.compositionId,renderKey:x.renderKey,engineVersion:x.engineVersion,
    frames:x.frames,fps:30,width:1920,height:1080,voiceTakeId:x.voiceTakeId,
    voiceLeadInFrames:60,directorLocked:false};
 });
 const shots=[...m.shots.slice(0,7),...updated];
 check(shots.length===10&&shots.reduce((n,s)=>n+s.frames,0)===35489,
  'EP003_WIP_EXPECTED_TEN_SHOTS_35489_FRAMES');
 return shots;
}

export function episodeSegments(shots){
  let offset=0;
  return shots.map(s=>{const segment={
    shotKey:s.shotKey,version:s.version,renderId:s.renderId,sha256:s.sha256,
    renderKey:s.renderKey,frames:s.frames,startFrame:offset,endFrame:offset+s.frames-1,
    voiceTakeId:s.voiceTakeId,voiceLeadInFrames:s.voiceLeadInFrames??0,
    directorLocked:s.directorLocked===true
  };offset+=s.frames;return segment;});
}

async function run(command,args,{cwd}={}){
  return new Promise((resolve,reject)=>{
    const child=spawn(command,args,{cwd,stdio:['ignore','pipe','pipe']});
    let stdout='',stderr='';
    child.stdout.on('data',chunk=>{stdout+=chunk.toString();if(stdout.length>1000000)stdout=stdout.slice(-200000);});
    child.stderr.on('data',chunk=>{stderr+=chunk.toString();if(stderr.length>1000000)stderr=stderr.slice(-200000);});
    child.on('error',reject);
    child.on('close',code=>code===0?resolve({stdout,stderr}):
      reject(Error('EP003_CUMULATIVE_PROCESS_FAILED '+command+' EXIT='+code+' '+stderr.slice(-1500))));
  });
}
async function probe(file){
  const x=await run('ffprobe',['-v','error','-show_entries',
    'format=duration,size:stream=codec_type,codec_name,width,height,avg_frame_rate,nb_frames,duration,time_base',
    '-of','json',file]);
  return JSON.parse(x.stdout);
}
function validateMedia(metadata,expectedFrames,label){
  const video=metadata.streams.find(s=>s.codec_type==='video');
  const audio=metadata.streams.find(s=>s.codec_type==='audio');
  check(video?.codec_name==='h264'&&video.width===1920&&video.height===1080
    &&['30/1','30'].includes(video.avg_frame_rate)
    &&Number(video.nb_frames)===expectedFrames,
    'EP003_CUMULATIVE_VIDEO_STREAM_OR_FRAMES_INVALID_'+label);
  check(audio?.codec_name==='aac','EP003_CUMULATIVE_MISSING_OR_NON_AAC_ORIGINAL_AUDIO_'+label);
  check(Math.abs(Number(video.duration)-expectedFrames/FPS)<0.11,
    'EP003_CUMULATIVE_VIDEO_DURATION_MISMATCH_'+label);
  return {video,audio};
}
async function extractFrame(video,index,png){
  await run('ffmpeg',['-hide_banner','-nostdin','-loglevel','error',
    '-i',video,'-vf','select=eq(n\\,'+index+')','-vsync','0',
    '-frames:v','1','-y',png]);
  const stat=await fs.stat(png);
  check(stat.size>10000,'EP003_CUMULATIVE_EXTRACTED_PIXEL_SOURCE_EMPTY');
}
async function imagePsnr(first,second){
  const q=await run('ffmpeg',['-hide_banner','-nostdin','-i',first,'-i',second,
    '-lavfi','psnr','-frames:v','1','-f','null','-']);
  const match=q.stderr.match(/average:(inf|[0-9]+(?:\.[0-9]+)?)/i);
  check(Boolean(match),'EP003_CUMULATIVE_P0_PSNR_MEASUREMENT_MISSING');
  return match[1].toLowerCase()==='inf'?100:Number(match[1]);
}
async function checkSeams(tmp,sources,master,segments){
  const cumulativeIndices=[];
  for(let i=0;i<segments.length-1;i++){
    cumulativeIndices.push(segments[i].endFrame,segments[i+1].startFrame);
  }
  const pattern=path.join(tmp,'master-seam-%03d.png');
  const select=cumulativeIndices.map(n=>'eq(n\\,'+n+')').join('+');
  await run('ffmpeg',['-hide_banner','-nostdin','-loglevel','error','-i',master,
    '-vf','select='+select,'-vsync','0','-y',pattern]);
  const qa=[];
  for(let i=0;i<sources.length-1;i++){
    const prevPng=path.join(tmp,'previous-'+i+'.png');
    const nextPng=path.join(tmp,'next-'+i+'.png');
    await extractFrame(sources[i],segments[i].frames-1,prevPng);
    await extractFrame(sources[i+1],0,nextPng);
    const atLeft=path.join(tmp,'master-seam-'+String(i*2+1).padStart(3,'0')+'.png');
    const atRight=path.join(tmp,'master-seam-'+String(i*2+2).padStart(3,'0')+'.png');
    const seamScore=await imagePsnr(prevPng,nextPng);
    const leftSourceMatch=await imagePsnr(prevPng,atLeft);
    const rightSourceMatch=await imagePsnr(nextPng,atRight);
    check(seamScore>=27,'EP003_CUMULATIVE_DIRECTOR_P0_VISUAL_CUT_'+(i+1));
    check(leftSourceMatch>=50&&rightSourceMatch>=50,
      'EP003_CUMULATIVE_STREAM_COPY_CHANGED_LOCKED_PIXELS_'+(i+1));
    qa.push({from:segments[i].shotKey,to:segments[i+1].shotKey,
      leftFrame:segments[i].endFrame,rightFrame:segments[i+1].startFrame,
      actualJoinPsnrDb:seamScore,matchedOriginalPreviousPsnrDb:leftSourceMatch,
      matchedOriginalNextPsnrDb:rightSourceMatch,thresholdDb:27,
      predecessorFrameSha256:sha256(await fs.readFile(prevPng))});
  }
  return qa;
}

async function main(){
  check(GATE,'EP003_CUMULATIVE_DIRECTOR_RENDER_AUTHORIZATION_REQUIRED');
  check(DB.startsWith('postgres'),'EP003_CUMULATIVE_DATABASE_REFERENCE_REQUIRED');
  check(/^[a-f0-9]{40}$/.test(SOURCE_SHA),'EP003_CUMULATIVE_SOURCE_UNPINNED');
  const m=JSON.parse(await fs.readFile(MANIFEST_PATH,'utf8'));
  const shots=correctedWipSequence(m);
  const total=shots.reduce((n,s)=>n+s.frames,0);
  const segments=episodeSegments(shots);
  const stamp=sha256('EP003_CUMULATIVE_CORRECTED_TEN_SHOT_WIP_V1|'+
    JSON.stringify(segments.map(s=>[s.shotKey,s.renderId,s.sha256,s.frames])));
  const name=RENDER_KEY_PREFIX+String(segments.length).padStart(2,'0');
  const db=new Client({connectionString:DB,connectionTimeoutMillis:12000,
    application_name:'ep003_corrected_ten_shot_wip_once'});
  await db.connect();
  let tmp=null,renderId=null;
  try{
    const prior=(await db.query('select id,status,render_key,video_data from remotion_render where project_id=$1::uuid and render_hash=$2',[PROJECT,stamp])).rows[0];
    if(prior){
      check(prior.status==='SUCCEEDED'&&prior.video_data?.length>1000000,
        'EP003_CUMULATIVE_PRIOR_SAME_LOCK_MANIFEST_NOT_SUCCEEDED__NO_AUTO_RETRY');
      console.log('EP003_CUMULATIVE_IDENTICAL_MASTER_ALREADY_PRESENT '+JSON.stringify({
        renderId:prior.id,shotCount:segments.length,frames:total
      }));
      return;
    }
    tmp=await fs.mkdtemp(path.join(os.tmpdir(),'ep003-cumulative-master-'));
    const sources=[];
    for(let i=0;i<shots.length;i++){
      const s=shots[i];
      const row=(await db.query(`select id,project_id,render_key,composition_id,engine_version,status,profile,
        width,height,fps,duration_in_frames,video_data from remotion_render
        where id=$1::uuid and project_id=$2::uuid`,[s.renderId,PROJECT])).rows[0];
      check(row?.status==='SUCCEEDED'&&row.video_data?.length>1000000
        &&row.render_key===s.renderKey&&row.composition_id===s.compositionId
        &&Number(row.width)===1920&&Number(row.height)===1080
        &&Number(row.fps)===FPS&&Number(row.duration_in_frames)===s.frames
        &&row.profile==='REVIEW','EP003_CUMULATIVE_LOCKED_SOURCE_MISSING_OR_CHANGED_'+s.shotKey);
      check(sha256(row.video_data)===s.sha256,
        'EP003_WIP_SOURCE_MP4_HASH_MISMATCH_'+s.shotKey);
      if(!s.directorLocked)check(row.engine_version===s.engineVersion,
        'EP003_WIP_SOURCE_ENGINE_PIN_MISMATCH_'+s.shotKey);
      const file=path.join(tmp,'shot-'+String(i+1).padStart(2,'0')+'.mp4');
      await fs.writeFile(file,row.video_data);
      validateMedia(await probe(file),s.frames,s.shotKey);
      sources.push(file);
    }
    console.log('EP003_CUMULATIVE_REAL_DIRECTOR_LOCKED_SOURCES_VERIFIED '+JSON.stringify({
      shots:segments.map(s=>({shot:s.shotKey,renderId:s.renderId,sha256:s.sha256,
        frames:s.frames,startFrame:s.startFrame,endFrame:s.endFrame,
        voiceLeadInFrames:s.voiceLeadInFrames})),
      totalFrames:total,totalSeconds:total/FPS,sourceCommit:SOURCE_SHA,
      voiceRegenerated:false,videoReencoded:false
    }));
    const list=path.join(tmp,'approved-locked-sources.ffconcat');
    await fs.writeFile(list,'ffconcat version 1.0\n'+sources.map(p=>
      'file '+path.basename(p)).join('\n')+'\n');
    renderId=randomUUID();
    const props={episodeKey:'EP003',directorLocked:false,wip:true,verified:false,
      lockedPrefixShotCount:7,correctedCandidateVersions:['SHOT08 V4','SHOT09 V3','SHOT10 V2'],
      sequence:segments,shotCount:segments.length,
      totalFrames:total,fps:FPS,assembly:'FFMPEG_CONCAT_DEMUXER_STREAM_COPY',
      sourceCommit:SOURCE_SHA,voiceRegenerated:false,videoReencoded:false,
      p0:'VERIFY_ACTUAL_DECODED_JOIN_BEFORE_SUCCESS'};
    await db.query(`insert into remotion_render(
      id,project_id,episode_id,composition_id,render_key,engine_version,
      input_props,render_hash,profile,status,width,height,fps,duration_in_frames,progress)
      values($1::uuid,$2::uuid,null,$3,$4,$5,$6::jsonb,$7,'REVIEW','RUNNING',1920,1080,30,$8,0)`,
      [renderId,PROJECT,COMPOSITION,name,'EP003_WIP_OWNER_B_V2',
        JSON.stringify(props),stamp,total]);
    const master=path.join(tmp,'ep003-current-complete-locked-master.mp4');
    await run('ffmpeg',['-hide_banner','-nostdin','-loglevel','error',
      '-f','concat','-safe','0','-i',list,'-map','0:v:0','-map','0:a:0',
      '-c','copy','-movflags','+faststart','-y',master]);
    validateMedia(await probe(master),total,'MASTER');
    const qa=await checkSeams(tmp,sources,master,segments);
    check(qa.length===segments.length-1,
      'EP003_CUMULATIVE_P0_ALL_LOCKED_SEAMS_NOT_VERIFIED');
    console.log('EP003_CUMULATIVE_REAL_ENCODED_SEAMS_VERIFIED '+JSON.stringify(qa));
    const bytes=await fs.readFile(master);
    check(bytes.length>=2000000&&bytes.length<256*1024*1024,
      'EP003_CUMULATIVE_FINAL_MP4_UNSAFE_SIZE');
    const masterSha=sha256(bytes);
    check(qa.length===9,'EP003_WIP_REQUIRES_NINE_VERIFIED_JOINS');
    const completedProps={...props,masterSha256:masterSha,qa,verified:true};
    const result=await db.query(`update remotion_render set video_data=$1,
      media_type='video/mp4',size_bytes=$2,progress=100,status='SUCCEEDED',
      input_props=$3::jsonb,finished_at=now(),updated_at=now()
      where id=$4::uuid and status='RUNNING'`,
      [bytes,bytes.length,JSON.stringify(completedProps),renderId]);
    check(result.rowCount===1,'EP003_CUMULATIVE_FINAL_DATABASE_WRITE_NOT_CONFIRMED');
    console.log('EP003_CUMULATIVE_DIRECTOR_FULL_VIDEO_SAVED '+JSON.stringify({
      renderId,videoUrl:'/api/v1/remotion/renders/'+renderId+'/video',
      renderKey:name,shotCount:segments.length,sequence:segments.map(x=>x.shotKey),
      frames:total,seconds:total/FPS,bytes:bytes.length,sha256:masterSha,
      codec:'H264/AAC',width:1920,height:1080,fps:FPS,
      qa,sourceRenderIds:segments.map(s=>s.renderId),
      directorStatus:'CORRECTED_TEN_SHOT_WIP__NOT_DIRECTOR_LOCKED'
    }));
  }catch(error){
    console.error('EP003_CUMULATIVE_ASSEMBLY_BLOCKED '+String(error.stack||error));
    if(renderId)await db.query(`update remotion_render set status='FAILED',
      error=$1,finished_at=now(),updated_at=now()
      where id=$2::uuid and status='RUNNING'`,
      [String(error.message||error).slice(0,1100),renderId]).catch(()=>{});
    process.exitCode=1;
  }finally{
    await db.end().catch(()=>{});
    if(tmp)await fs.rm(tmp,{recursive:true,force:true}).catch(()=>{});
  }
}
if(process.argv[1]&&process.argv[1].endsWith('ep003-assemble-corrected-ten-shot-wip.mjs')){
  main().catch(e=>{console.error('EP003_CUMULATIVE_FATAL '+String(e.stack||e));process.exitCode=1;});
}
