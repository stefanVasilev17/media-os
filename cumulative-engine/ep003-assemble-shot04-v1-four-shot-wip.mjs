import {Client} from 'pg';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {createHash,randomUUID} from 'node:crypto';

const MANIFEST_PATH='/app/remotion-engine/ep003-director-locked-visual-sequence.json';
const DB=String(process.env.DATABASE_URL||'').trim();
const GATE=process.env.EP003_SHOT04_V1_WIP_ASSEMBLY_APPROVED==='true';
const SOURCE_SHA=String(process.env.RAILWAY_GIT_COMMIT_SHA||'').trim();
const PROJECT='11111111-1111-1111-1111-111111111111';
const COMPOSITION='EP003-CUMULATIVE-WIP-REVIEW';
const RENDER_KEY='EP003_WIP_LOCKED_01_TO_03_PLUS_SHOT04_V1_04';
const S04_RENDER_ID=String(process.env.EP003_SHOT04_V1_RENDER_ID||'').trim();
const S04_SHA=String(process.env.EP003_SHOT04_V1_SHA256||'').trim();
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

export function validateWipSequence(m) {
  check(m?.schemaVersion==='at.episode-locked-sequence.v1'&&m.episodeKey==='EP003'&&
    m.projectId===PROJECT&&Array.isArray(m.shots)&&m.shots.length===4,
    'EP003_SHOT04_WIP_REQUIRES_EXACTLY_FOUR_SEQUENTIAL_SHOTS');
  const [one,two,three,four]=m.shots;
  check(one.directorLocked===true&&two.directorLocked===true&&
    three.directorLocked===true&&four.directorLocked===false,
    'EP003_SHOT04_WIP_LOCKED_THREE_SHOTS_PLUS_UNAPPROVED_FOURTH_REQUIRED');
  check(validateLockedSequence({...m,shots:[one,two,three]})===9037,
    'EP003_SHOT04_WIP_LOCKED_THREE_SHOT_PREFIX_CHANGED');
  check(three.renderId==='fc26ca7b-60f2-4c35-b248-6b373736ce99'&&
    three.sha256==='1c4fbe3133775b514e82a2e2aec583859615d8fa86b349732dd7ba1bf2391709'&&
    three.renderKey==='EP003_SHOT03_WORDING_V4'&&three.frames===3080,
    'EP003_SHOT04_WIP_EXACT_DIRECTOR_LOCKED_SHOT03_V4_REQUIRED');
  check(four.shotKey==='SHOT04'&&four.version==='V1_READ_WRITE_CANDIDATE'&&
    four.compositionId==='EP003-SHOT04-READ-WRITE-SPLITTING-V1-DIRECTOR-CANDIDATE'&&
    four.renderKey==='EP003_SHOT04_READ_WRITE_SPLITTING_V1'&&four.frames===3841&&
    four.fps===FPS&&four.width===1920&&four.height===1080&&
    four.voiceTakeId==='59daccf6-009e-4bed-baa8-951a4bae3aa1'&&
    four.voiceLeadInFrames===60&&/^[a-f0-9-]{36}$/i.test(four.renderId)&&
    /^[a-f0-9]{64}$/.test(four.sha256)&&
    ![one.renderId,two.renderId,three.renderId].includes(four.renderId),
    'EP003_SHOT04_WIP_MUST_USE_REAL_UNAPPROVED_LOCKED_VOICE_V1');
  return 12878;
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
  check(GATE,'EP003_SHOT03_WIP_MUST_BE_EXPLICITLY_REQUESTED');
  check(DB.startsWith('postgres'),'EP003_WIP_DATABASE_REFERENCE_REQUIRED');
  check(/^[a-f0-9]{40}$/.test(SOURCE_SHA),'EP003_WIP_SOURCE_UNPINNED');
  check(/^[a-f0-9-]{36}$/i.test(S04_RENDER_ID)&&/^[a-f0-9]{64}$/.test(S04_SHA),
    'EP003_WIP_SHOT04_RENDER_ID_AND_SHA256_MUST_BE_PINNED');
  const locked=JSON.parse(await fs.readFile(MANIFEST_PATH,'utf8'));
  check(Array.isArray(locked.shots)&&locked.shots.length===3,
    'EP003_WIP_OFFICIAL_MASTER_MUST_REMAIN_EXACTLY_3_LOCKED_SHOTS');
  validateLockedSequence(locked);
  const db=new Client({connectionString:DB,connectionTimeoutMillis:12000,
    application_name:'ep003_wip_four_shots_shot04_v1_no_lock'});
  await db.connect();
  let tmp=null,renderId=null;
  try{
    const candidate=(await db.query(`
      select id,project_id,render_key,composition_id,status,profile,width,height,fps,
        duration_in_frames,input_props,video_data
      from remotion_render where id=$1::uuid and project_id=$2::uuid
    `,[S04_RENDER_ID,PROJECT])).rows[0];
    check(candidate?.status==='SUCCEEDED'&&candidate.video_data?.length>1000000&&
      candidate.render_key==='EP003_SHOT04_READ_WRITE_SPLITTING_V1'&&
      candidate.composition_id==='EP003-SHOT04-READ-WRITE-SPLITTING-V1-DIRECTOR-CANDIDATE'&&
      candidate.profile==='REVIEW'&&Number(candidate.width)===1920&&
      Number(candidate.height)===1080&&Number(candidate.fps)===30&&
      Number(candidate.duration_in_frames)===3841,
      'EP003_SHOT04_WIP_REAL_SAVED_FULLHD_MP4_NOT_FOUND');
    check(sha256(candidate.video_data)===S04_SHA,
      'EP003_SHOT04_WIP_MP4_SHA256_MISMATCH');
    check(candidate.input_props?.previousRenderId===locked.shots[2].renderId&&
      candidate.input_props?.voiceTakeId==='59daccf6-009e-4bed-baa8-951a4bae3aa1'&&
      Number(candidate.input_props?.worldStartFrame)===21012&&
      Number(candidate.input_props?.cueFrames?.INTRO)>=60,
      'EP003_SHOT04_WIP_ORIGINAL_VOICE_AND_03_LAST_FRAME_REQUIRED');
    const fourth={
      shotKey:'SHOT04',version:'V1_READ_WRITE_CANDIDATE',directorLocked:false,
      renderId:candidate.id,sha256:S04_SHA,compositionId:candidate.composition_id,
      renderKey:candidate.render_key,frames:3841,fps:30,width:1920,height:1080,
      voiceLeadInFrames:60,voiceTakeId:'59daccf6-009e-4bed-baa8-951a4bae3aa1'
    };
    const m={...locked,shots:[...locked.shots,fourth]};
    const total=validateWipSequence(m);
    const segments=episodeSegments(m.shots);
    const stamp=sha256('EP003_WIP_LOCKED_01_TO_03_PLUS_SHOT04_V1_STREAM_COPY_V1|'+
      JSON.stringify(segments.map(s=>[s.shotKey,s.renderId,s.sha256,s.frames])));
    const name=RENDER_KEY;
    const prior=(await db.query('select id,status,render_key,video_data from remotion_render where project_id=$1::uuid and render_hash=$2',[PROJECT,stamp])).rows[0];
    if(prior){
      check(prior.status==='SUCCEEDED'&&prior.video_data?.length>1000000,
        'EP003_CUMULATIVE_PRIOR_SAME_LOCK_MANIFEST_NOT_SUCCEEDED__NO_AUTO_RETRY');
      console.log('EP003_WIP_FOUR_SHOTS_IDENTICAL_ALREADY_PRESENT '+JSON.stringify({
        renderId:prior.id,shotCount:segments.length,frames:total
      }));
      return;
    }
    tmp=await fs.mkdtemp(path.join(os.tmpdir(),'ep003-shot04-v1-four-shot-wip-'));
    const sources=[];
    for(let i=0;i<m.shots.length;i++){
      const s=m.shots[i];
      const row=(await db.query(`select id,project_id,render_key,composition_id,status,profile,
        width,height,fps,duration_in_frames,video_data from remotion_render
        where id=$1::uuid and project_id=$2::uuid`,[s.renderId,PROJECT])).rows[0];
      check(row?.status==='SUCCEEDED'&&row.video_data?.length>1000000
        &&row.render_key===s.renderKey&&row.composition_id===s.compositionId
        &&Number(row.width)===1920&&Number(row.height)===1080
        &&Number(row.fps)===FPS&&Number(row.duration_in_frames)===s.frames
        &&row.profile==='REVIEW','EP003_WIP_SOURCE_MISSING_OR_CHANGED_'+s.shotKey);
      check(sha256(row.video_data)===s.sha256,
        'EP003_WIP_SOURCE_MP4_HASH_MISMATCH_'+s.shotKey);
      const file=path.join(tmp,'shot-'+String(i+1).padStart(2,'0')+'.mp4');
      await fs.writeFile(file,row.video_data);
      validateMedia(await probe(file),s.frames,s.shotKey);
      sources.push(file);
    }
    console.log('EP003_WIP_FOUR_REAL_MP4_SOURCES_VERIFIED '+JSON.stringify({
      shots:segments.map(s=>({shot:s.shotKey,renderId:s.renderId,sha256:s.sha256,
        frames:s.frames,startFrame:s.startFrame,endFrame:s.endFrame,
        voiceLeadInFrames:s.voiceLeadInFrames})),
      totalFrames:total,totalSeconds:total/FPS,sourceCommit:SOURCE_SHA,
      voiceRegenerated:false,videoReencoded:false
    }));
    const list=path.join(tmp,'four-shot-wip-sources.ffconcat');
    await fs.writeFile(list,'ffconcat version 1.0\n'+sources.map(p=>
      'file '+path.basename(p)).join('\n')+'\n');
    renderId=randomUUID();
    const props={episodeKey:'EP003',directorLocked:false,wip:true,lockedPrefixShotCount:3,candidateShot:'SHOT04',
      sequence:segments,shotCount:segments.length,
      totalFrames:total,fps:FPS,assembly:'FFMPEG_WIP_FOUR_SHOTS_EXACT_SOURCE_STREAM_COPY',
      sourceCommit:SOURCE_SHA,voiceRegenerated:false,videoReencoded:false,
      p0:'VERIFY_ACTUAL_DECODED_JOIN_BEFORE_SUCCESS'};
    await db.query(`insert into remotion_render(
      id,project_id,episode_id,composition_id,render_key,engine_version,
      input_props,render_hash,profile,status,width,height,fps,duration_in_frames,progress)
      values($1::uuid,$2::uuid,null,$3,$4,$5,$6::jsonb,$7,'REVIEW','RUNNING',1920,1080,30,$8,0)`,
      [renderId,PROJECT,COMPOSITION,name,'EP003_WIP_'+SOURCE_SHA.slice(0,12),
        JSON.stringify(props),stamp,total]);
    const master=path.join(tmp,'ep003-four-shots-wip-no-director-lock.mp4');
    await run('ffmpeg',['-hide_banner','-nostdin','-loglevel','error',
      '-f','concat','-safe','0','-i',list,'-map','0:v:0','-map','0:a:0',
      '-c','copy','-movflags','+faststart','-y',master]);
    validateMedia(await probe(master),total,'MASTER');
    const qa=await checkSeams(tmp,sources,master,segments);
    check(qa.length===segments.length-1,
      'EP003_WIP_P0_ALL_THREE_REAL_SEAMS_NOT_VERIFIED');
    console.log('EP003_WIP_ALL_THREE_REAL_ENCODED_SEAMS_VERIFIED '+JSON.stringify(qa));
    const bytes=await fs.readFile(master);
    check(bytes.length>=2000000&&bytes.length<256*1024*1024,
      'EP003_CUMULATIVE_FINAL_MP4_UNSAFE_SIZE');
    const masterSha=sha256(bytes);
    const completedProps={...props,masterSha256:masterSha,qa,verified:true};
    const result=await db.query(`update remotion_render set video_data=$1,
      media_type='video/mp4',size_bytes=$2,progress=100,status='SUCCEEDED',
      input_props=$3::jsonb,finished_at=now(),updated_at=now()
      where id=$4::uuid and status='RUNNING'`,
      [bytes,bytes.length,JSON.stringify(completedProps),renderId]);
    check(result.rowCount===1,'EP003_CUMULATIVE_FINAL_DATABASE_WRITE_NOT_CONFIRMED');
    console.log('EP003_SHOT04_V1_FOUR_SHOT_WIP_FULL_MP4_SAVED '+JSON.stringify({
      wip:true,directorLocked:false,lockedPrefixShotCount:3,
      renderId,videoUrl:'/api/v1/remotion/renders/'+renderId+'/video',
      renderKey:name,shotCount:segments.length,sequence:segments.map(x=>x.shotKey),
      frames:total,seconds:total/FPS,bytes:bytes.length,sha256:masterSha,
      codec:'H264/AAC',width:1920,height:1080,fps:FPS,
      qa,sourceRenderIds:segments.map(s=>s.renderId),
      directorStatus:'WIP_UNAPPROVED_SHOT04_V1__NO_MASTER_PROMOTION'
    }));
  }catch(error){
    console.error('EP003_WIP_FOUR_SHOT_ASSEMBLY_BLOCKED '+String(error.stack||error));
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
if(process.argv[1]&&process.argv[1].endsWith('ep003-assemble-shot04-v1-four-shot-wip.mjs')){
  main().catch(e=>{console.error('EP003_CUMULATIVE_FATAL '+String(e.stack||e));process.exitCode=1;});
}
