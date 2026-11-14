import {Client} from 'pg';

import {selectComposition,renderMedia} from '@remotion/renderer';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {createHash,randomUUID} from 'node:crypto';

const SHA=String(process.env.RAILWAY_GIT_COMMIT_SHA||'').trim();
const DB=String(process.env.DATABASE_URL||'').trim();
const DIRECTOR_AUTHORIZED=process.env.EP003_DIRECTOR_SHOT02_V4_RENDER_APPROVED==='true';
const PIN='b6fd7f30-7c78-414b-a88c-387c0ee8c43a';
const LOCKED_PREVIOUS_SHA='da6d3cbc77dc3a0dc5374aec4a7ba8beb97739d4c5facffdf36d1585e7587c08';
const LOCKED_V3_REFERENCE_ID='8598d156-438f-4614-a9dd-ce6172233d9b';
const LOCKED_V3_REFERENCE_SHA='eee2308b3f8150ac9ac49db6b0a257374e40fbbf8ddf6b1245ae58d5400ff471';
const PROJECT='11111111-1111-1111-1111-111111111111';
const COMPOSITION='EP003-SHOT02-MOTION-V4-DIRECTOR-CANDIDATE';
const SHOT='SHOT02';
const EXPECTED_FRAMES=2514;
const FPS=30;
const LEAD_IN_FRAMES=60;
const LEAD_IN_SECONDS=LEAD_IN_FRAMES/FPS;
const hash=(input)=>createHash('sha256').update(input).digest('hex');
const voiceCues={
  INTRO:"Let's look at our architecture again.",
  DEMAND:'During our ticket sale, imagine nine hundred new Login requests',
  CAPACITY:'Under this particular workload, the database can complete approximately five hundred account lookups',
  QUEUES:'The extra work creates queues.',
  THROUGHPUT:'Throughput tells us how much work gets finished.',
  BOTTLENECK:'Our User Database is now the bottleneck:',
  MORE_AUTH:'We can add a fourth Auth server.',
  BUDGET:'In the previous episode, we protected that database with a shared admission budget',
  NEXT:'So our next task is not to add machines everywhere.',
};

const termVoiceCues={
  THROUGHPUT_TERM:'This is its measured throughput',
  LATENCY_TERM:'That waiting time is part of latency',
  BOTTLENECK_TERM:'Our User Database is now the bottleneck:',
  ADMISSION_BUDGET_TERM:'shared admission budget of about',
};


function assert(condition,code){if(!condition)throw Error(code);}
function run(executable,args,{cwd}={}){
  return new Promise((resolve,reject)=>{
    const child=spawn(executable,args,{cwd,stdio:['ignore','pipe','pipe']});
    let output='',errors='';
    child.stdout.on('data',b=>{output+=b.toString();});
    child.stderr.on('data',b=>{errors+=b.toString();});
    child.on('error',reject);
    child.on('close',code=>code===0?resolve({stdout:output,stderr:errors}):
      reject(Error('PROCESS_FAILED '+executable+' '+code+' '+errors.slice(-1600))));
  });
}
async function firstFramesMotion(file){
  const width=320,height=180,count=24,frameSize=width*height;
  const chunks=[];
  await new Promise((resolve,reject)=>{
    const child=spawn('ffmpeg',['-hide_banner','-loglevel','error','-nostdin',
      '-i',file,'-vf','scale='+width+':'+height+',format=gray',
      '-frames:v',String(count),'-f','rawvideo','pipe:1'],
      {stdio:['ignore','pipe','pipe']});
    let stderr='';
    child.stdout.on('data',part=>chunks.push(part));
    child.stderr.on('data',part=>{stderr+=part.toString().slice(-900);});
    child.on('error',reject);
    child.on('close',code=>code===0?resolve():reject(Error(
      'EP003_V4_DECODE_EARLY_MOTION_FAILED '+code+' '+stderr.slice(-300))));
  });
  const bytes=Buffer.concat(chunks);
  assert(bytes.length===frameSize*count,
    'EP003_V4_EARLY_FRAMES_BINARY_LENGTH_MISMATCH');
  const differences=[];
  for(let frame=1;frame<count;frame++){
    let total=0;
    const a=(frame-1)*frameSize,c=frame*frameSize;
    for(let pixel=0;pixel<frameSize;pixel+=4){
      total+=Math.abs(bytes[c+pixel]-bytes[a+pixel]);
    }
    differences.push(total/(frameSize/4));
  }
  const avg=a=>a.reduce((sum,value)=>sum+value,0)/a.length;
  return {
    firstStep:differences[0],earlyTenMean:avg(differences.slice(0,10)),
    firstTwentyMean:avg(differences.slice(0,20)),
    uniqueMovingSteps:differences.filter(value=>value>0.001).length,
    firstTenSteps:differences.slice(0,10).map(x=>Number(x.toFixed(5)))
  };
}

async function ffprobe(file){
  const r=await run('ffprobe',['-v','error','-show_entries',
    'format=duration,size:stream=codec_type,codec_name,avg_frame_rate,width,height,nb_frames,nb_read_frames',
    '-of','json',file]);
  return JSON.parse(r.stdout);
}
function getCharacters(doc){
  const nodes=[doc?.normalized_alignment,doc?.alignment,
    doc?.generated_alignment?.normalized_alignment,doc?.generated_alignment?.alignment,
    doc?.audio_alignment,doc];
  for(const a of nodes)if(a&&Array.isArray(a.characters)&&a.characters.length>=120
    &&Array.isArray(a.character_start_times_seconds)
    &&a.characters.length===a.character_start_times_seconds.length
    &&a.character_start_times_seconds.every(x=>Number.isFinite(x))){
    return a;
  }
  throw Error('REAL_ELEVENLABS_ALIGNMENT_MISSING__DO_NOT_USE_GUESSED_CUES_OR_REGENERATE');
}
function cueFramesFromRealVoice(raw,anchors=voiceCues){
  let doc=typeof raw==='string'?JSON.parse(raw):raw;
  const real=getCharacters(doc);
  const spoken=real.characters.join('');
  const frames={};
  let last=-1;
  for(const [key,phrase] of Object.entries(anchors)){
    const pos=spoken.indexOf(phrase);
    assert(pos>=0,'REAL_AUDIO_ANCHOR_NOT_FOUND_'+key);
    assert(spoken.indexOf(phrase,pos+1)<0,'REAL_AUDIO_ANCHOR_NOT_UNIQUE_'+key);
    const seconds=real.character_start_times_seconds[pos];
    const f=Math.round(seconds*FPS);
    assert(f>=last,'REAL_AUDIO_CUES_OUT_OF_ORDER_'+key);
    frames[key]=f;last=f;
  }
  return frames;
}
async function main(){
  assert(DIRECTOR_AUTHORIZED,'RENDER_NOT_AUTHORIZED_BY_DIRECTOR_ENV_GATE');
  assert(/^[a-f0-9]{40}$/.test(SHA),'UNPINNED_SOURCE_COMMIT');
  assert(DB.startsWith('postgres'),'PRODUCTION_DATABASE_REFERENCE_NOT_AVAILABLE');
  const db=new Client({connectionString:DB,connectionTimeoutMillis:12000,
    application_name:'ep003_shot02_v4_once'});
  await db.connect();
  let renderId=null;
  let tmp=null;
  try {
    const source=(await db.query(`
      select p.id as package_id,p.source_sha256,
             s.id as shot_id,s.original_narration,r.narration,
             c.take_id,t.audio,t.content_type,t.duration_seconds,
             t.model_id,t.voice_id,t.generated_alignment::text as timing,
             t.generated_alignment->>'mediaos_delivery_mode' as delivery_mode,
             t.generated_alignment->>'mediaos_spoken_script_sha256' as spoken_sha
      from episode_package_import p
      join episode_package_shot s on s.package_id=p.id and s.shot_key=$1
      join episode_package_shot_revision r on r.shot_id=s.id and r.revision=1
      join lateral(
        select c.take_id from episode_package_voice_choice c
        where c.shot_id=s.id and c.revision=1
        order by c.selected_at desc,c.id desc limit 1
      ) c on true
      join episode_package_voice_take t on t.id=c.take_id
        and t.shot_id=s.id and t.revision=1
      where p.episode_key='EP003'`,[SHOT])).rows[0];
    assert(source,'EP003_SHOT02_NO_DIRECTOR_APPROVED_TAKE__BLOCK_RENDER');
    const file=JSON.parse(await fs.readFile('/app/backend/src/main/resources/ep003-director-locked-voice-package-v1.json','utf8'));
    const locked=file.shots.find(s=>s.shotKey===SHOT)?.narration;
    assert(locked&&source.original_narration===locked&&source.narration===locked,
      'DIRECTOR_LOCKED_EP003_SCRIPT_MISMATCH');
    assert(source.delivery_mode==='ELEVEN_V4_AUTO_SLOW_NATURAL_PAUSES_V1',
      'SELECTED_AUDIO_NOT_VERIFIED_SLOW_NATURAL__NO_AUDIO_REGEN');
    assert(source.spoken_sha===hash(locked),'SELECTED_TAKE_SCRIPT_HASH_MISMATCH');
    assert(Number(source.duration_seconds)>20&&Number(source.duration_seconds)<400,
      'REAL_SELECTED_AUDIO_DURATION_INVALID');
    const unshiftedCues=cueFramesFromRealVoice(source.timing);
    const unshiftedTermCues=cueFramesFromRealVoice(source.timing,termVoiceCues);
    const shift=(cues)=>Object.fromEntries(Object.entries(cues)
      .map(([name,frame])=>[name,frame+LEAD_IN_FRAMES]));
    const cueFrames=shift(unshiftedCues);
    const termCueFrames=shift(unshiftedTermCues);
    assert(cueFrames.INTRO>=LEAD_IN_FRAMES,
      'EP003_SHOT02_V4_NARRATION_CUES_MUST_BEGIN_AFTER_TWO_SECONDS');
    assert(termCueFrames.THROUGHPUT_TERM<termCueFrames.LATENCY_TERM
      && termCueFrames.LATENCY_TERM<cueFrames.THROUGHPUT
      && cueFrames.THROUGHPUT<termCueFrames.BOTTLENECK_TERM,
      'EP003_SHOT02_V4_PAIRED_TERMS_DO_NOT_COVER_SECOND_THROUGHPUT_MENTION');
    const previous=(await db.query(`
      select id,status,render_key,width,height,fps,duration_in_frames,video_data,render_hash
      from remotion_render where id=$1::uuid`,[PIN])).rows[0];
    assert(previous?.status==='SUCCEEDED'&&previous.video_data,
      'EP003_SHOT01_V2_DIRECTOR_LOCKED_SOURCE_MISSING__P0_BLOCK');
    assert(hash(previous.video_data)===LOCKED_PREVIOUS_SHA,
      'EP003_SHOT02_PREDECESSOR_MP4_SHA256_MISMATCH__P0_BLOCK');
    assert(previous.render_key==='EP003_SHOT01_V2',
      'EP003_SHOT02_PREVIOUS_NOT_DIRECTOR_LOCKED_V2');
    assert(Number(previous.width)===1920&&Number(previous.height)===1080
        &&Number(previous.fps)===30&&Number(previous.duration_in_frames)===EXPECTED_FRAMES,
      'EP003_SHOT01_V2_FINAL_RENDER_PIN_METADATA_INVALID');
    const idempotency=hash(
      'EP003_SHOT02_MOTION_V4_MOVING_FRAME1_SAME_LOCKED_VOICE|'+SHA+'|'+source.take_id+'|'+source.spoken_sha+
      '|'+PIN+'|'+previous.render_hash
    );
    const already=(await db.query(`select id,status from remotion_render
      where project_id=$1::uuid and render_hash=$2`,[PROJECT,idempotency])).rows[0];
    if(already){
      console.log('EP003_SHOT02_V4_EXISTING_RENDER '+JSON.stringify(already));
      return;
    }
    tmp=await fs.mkdtemp(path.join(os.tmpdir(),'ep003-shot02-motion-v4-'));
    const prevFile=path.join(tmp,'ep003-shot01-v2-director-locked.mp4');
    const prevPng=path.join(tmp,'real-ep003-shot01-v2-last-frame.png');
    const originalAudio=path.join(tmp,source.content_type==='audio/wav'?'locked-take.wav':'locked-take.mp3');
    await fs.writeFile(prevFile,previous.video_data);
    await fs.writeFile(originalAudio,source.audio);
    const info=await ffprobe(prevFile);
    const v=info.streams.find(s=>s.codec_type==='video');
    assert(v?.width===1920&&v?.height===1080,
      'PINNED_EP003_SHOT01_V2_MEDIA_STREAM_NOT_1920x1080');
    const seconds=Number(info.format.duration);
    assert(seconds>=83.25&&seconds<=84.25,'PINNED_LOCKED_EP003_SHOT01_V2_DURATION_UNEXPECTED');
    await run('ffmpeg',['-hide_banner','-nostdin','-loglevel','error',
      '-i',prevFile,'-vf','select=eq(n\\,2513)','-vsync','0',
      '-frames:v','1','-y',prevPng]);
    const finalPng=await fs.readFile(prevPng);
    assert(finalPng.length>20000,'PINNED_LAST_FRAME_EXTRACTION_FAILED');
    const speech=await ffprobe(originalAudio);
    const audioSeconds=Number(speech.format.duration);
    const storedSeconds=Number(source.duration_seconds);
    assert(Math.abs(audioSeconds-storedSeconds)<1.4,
      'LOCKED_AUDIO_REAL_DURATION_DISAGREES_WITH_STORED_MEASUREMENT');
    const frames=Math.ceil(audioSeconds*FPS)+15+LEAD_IN_FRAMES;
    for(const [name,frame] of Object.entries(cueFrames))
      assert(frame<frames,'CUE_AFTER_AUDIO_'+name);
    for(const [name,frame] of Object.entries(termCueFrames))
      assert(frame<frames,'TERM_CUE_AFTER_REAL_AUDIO_'+name);
    assert(termCueFrames.THROUGHPUT_TERM<termCueFrames.LATENCY_TERM
      &&termCueFrames.LATENCY_TERM<termCueFrames.BOTTLENECK_TERM
      &&termCueFrames.BOTTLENECK_TERM<termCueFrames.ADMISSION_BUDGET_TERM,
      'TERM_DEFINITION_CUE_ORDER_NOT_SUPPORTED_BY_REAL_VOICE');
    const props={
      durationInFrames:frames,
      voiceTakeId:source.take_id,
      previousRenderId:PIN,
      previousLastFrameSha256:hash(finalPng),
      previousLastFrameDataUri:'data:image/png;base64,'+finalPng.toString('base64'),
      cueFrames,
      termCueFrames,
      worldStartFrame:14491,
    };
    const receipt={
      previousRenderId:PIN,previousFrames:2514,
      previousFrameSha256:props.previousLastFrameSha256,
      sourceCommit:SHA,voiceTakeId:source.take_id,
      lockedScriptSha256:source.spoken_sha,
      audioSeconds,frames,leadInFrames:LEAD_IN_FRAMES,
      narrationStartsAtSeconds:LEAD_IN_SECONDS,
      cues:cueFrames,termCues:termCueFrames,
    };
    console.log('EP003_SHOT02_V4_REAL_INPUT_VERIFIED '+JSON.stringify(receipt));
    renderId=randomUUID();
    await db.query(`insert into remotion_render(
       id,project_id,episode_id,composition_id,render_key,engine_version,
       input_props,render_hash,profile,status,width,height,fps,duration_in_frames,progress
       ) values ($1::uuid,$2::uuid,null,$3,$4,$5,$6::jsonb,$7,'REVIEW','RUNNING',
       1920,1080,30,$8,0)`,[
      renderId,PROJECT,COMPOSITION,'EP003_SHOT02_MOTION_V4',
      'EP003_PIN_'+SHA.slice(0,12),
      JSON.stringify({...props,previousLastFrameDataUri:'DATA_URI_SAVED_ONLY_IN_RENDER_RECEIPT'}),
      idempotency,frames
    ]);
    const serveUrl='/app/remotion-engine/build';
    const compiled=await fs.stat(path.join(serveUrl,'index.html'))
      .catch(()=>null);
    assert(compiled&&compiled.size>100,
      'EP003_IMMUTABLE_REMOTION_BUNDLE_NOT_PRESENT');
    const composition=await selectComposition({serveUrl,id:COMPOSITION,inputProps:props,
      browserExecutable:process.env.CHROMIUM_PATH||'/usr/bin/chromium',
      timeoutInMilliseconds:120000});
    assert(composition.durationInFrames===frames&&composition.width===1920
      &&composition.height===1080&&composition.fps===30,
      'COMPOSITION_METADATA_NOT_FROM_REAL_TAKE');
    const silent=path.join(tmp,'ep003-shot02-motion-v4-visual.mp4');
    await renderMedia({
      composition,serveUrl,codec:'h264',outputLocation:silent,inputProps:props,
      browserExecutable:process.env.CHROMIUM_PATH||'/usr/bin/chromium',
      concurrency:2,crf:19,
      onProgress:({progress})=>{
        const pct=Math.floor(progress*100);
        if(pct%10===0&&pct!==0)console.log('EP003_RENDER_PROGRESS '+pct);
      }
    });
    const finished=path.join(tmp,'ep003-shot02-motion-v4-final.mp4');
    await run('ffmpeg',['-hide_banner','-nostdin','-loglevel','error',
      '-i',silent,'-i',originalAudio,'-map','0:v:0','-map','1:a:0',
      '-c:v','copy','-af','adelay=2000:all=1',
      '-c:a','aac','-b:a','160k','-ar','48000',
      '-t',String(frames/30),'-movflags','+faststart','-y',finished]);
    const renderedFirst=path.join(tmp,'ep003-shot02-motion-v4-rendered-first-frame.png');
    await run('ffmpeg',['-hide_banner','-nostdin','-loglevel','error',
      '-i',finished,'-frames:v','1','-y',renderedFirst]);
    const pixelQa=await run('ffmpeg',['-hide_banner','-nostdin',
      '-i',prevPng,'-i',renderedFirst,'-lavfi','psnr',
      '-f','null','-']);
    const score=pixelQa.stderr.match(/average:([0-9.]+)/);
    const psnr=score?Number(score[1]):NaN;
    assert(Number.isFinite(psnr)&&psnr>=27,
      'EP003_SHOT02_V4_FIRST_FRAME_NOT_CONTINUOUS_WITH_LOCKED_SHOT01_V2');
    console.log('EP003_SHOT02_V4_P0_ACTUAL_PIXEL_QA '+JSON.stringify({
      ep002RenderId:PIN,psnrDb:psnr,
      previousLastFrameSha256:props.previousLastFrameSha256,
      acceptedThresholdDb:27,firstFrameVerified:true
    }));
    const final=await ffprobe(finished);
    assert(LEAD_IN_FRAMES===60&&FPS===30&&LEAD_IN_SECONDS===2,
      'EP003_SHOT02_V4_TWO_SECOND_LEAD_MUST_BE_FRAME_EXACT');
    const audioStream=final.streams.find(item=>item.codec_type==='audio');
    assert(audioStream?.codec_name==='aac',
      'EP003_SHOT02_V4_SLOW_NATURAL_VOICE_PRESERVATION_FAILED');
    const streams=final.streams;
    assert(streams.some(s=>s.codec_type==='video'&&s.codec_name==='h264'
          &&s.width===1920&&s.height===1080),
      'EP003_FINAL_MP4_VIDEO_QA_FAILED');
    assert(streams.some(s=>s.codec_type==='audio'&&s.codec_name==='aac'),
      'EP003_FINAL_MP4_AUDIO_QA_FAILED');
    assert(Math.abs(Number(final.format.duration)-frames/30)<.45,
      'EP003_MP4_DURATION_QA_FAILED');
    const historical=(await db.query(`select status,video_data from remotion_render
      where id=$1::uuid and project_id=$2::uuid`,
      [LOCKED_V3_REFERENCE_ID,PROJECT])).rows[0];
    assert(historical?.status==='SUCCEEDED'&&historical.video_data
      &&hash(historical.video_data)===LOCKED_V3_REFERENCE_SHA,
      'EP003_V4_MOTION_BASELINE_LOCKED_V3_SOURCE_MISSING_OR_MUTATED');
    const oldV3=path.join(tmp,'original-locked-v3-motion-baseline.mp4');
    await fs.writeFile(oldV3,historical.video_data);
    const oldMotion=await firstFramesMotion(oldV3);
    const newMotion=await firstFramesMotion(finished);
    console.log('EP003_SHOT02_V4_ACTUAL_FIRST_SECOND_MOTION_COMPARISON '+JSON.stringify({
      lockedV3:oldMotion,motionV4:newMotion,
      relativeEarlyMotionIncrease:newMotion.earlyTenMean/Math.max(oldMotion.earlyTenMean,0.001),
      firstDecodedFramePsnrDb:psnr,
      technique:'REMOVE_55_FRAME_STATIC_PNG_OVERLAY__SHOW_EXACT_SOURCE_ONLY_AT_FRAME_ZERO'
    }));
    assert(newMotion.uniqueMovingSteps>=18,
      'EP003_SHOT02_V4_FIRST_SECOND_HAS_TOO_MANY_FROZEN_FRAMES');
    assert(newMotion.earlyTenMean>oldMotion.earlyTenMean*1.2,
      'EP003_SHOT02_V4_MOVEMENT_NOT_IMPROVED_VS_DIRECTOR_LOCKED_V3');
    assert(newMotion.firstStep<12,
      'EP003_SHOT02_V4_FIRST_STEP_JUMPS_TOO_FAR_FROM_LOCKED_SHOT01_END');
    const bytes=await fs.readFile(finished);
    assert(bytes.length>=1500000&&bytes.length<256*1024*1024,
      'EP003_FINAL_MP4_SIZE_NOT_SAFE_FOR_MEDIAOS_STORAGE');
    const videoSha=hash(bytes);
    await db.query(`update remotion_render
      set video_data=$1,media_type='video/mp4',size_bytes=$2,status='SUCCEEDED',
      progress=100,finished_at=now(),updated_at=now()
      where id=$3::uuid and status='RUNNING'`,
      [bytes,bytes.length,renderId]);
    console.log('EP003_SHOT02_V4_REAL_MP4_SAVED '+JSON.stringify({
      renderId,uri:'/api/v1/remotion/renders/'+renderId+'/video',
      mp4Sha256:videoSha,bytes:bytes.length,codec:'H264/AAC',
      width:1920,height:1080,fps:30,frames,
      selectedTake:source.take_id,leadInFrames:LEAD_IN_FRAMES,
      leadInSeconds:LEAD_IN_SECONDS,
      directorStatus:'VISUAL_REVIEW_REQUIRED__NOT_LOCKED',
      p0:'SOURCE_FRAME_PINNED__ACTUAL_SEAM_QA_STILL_REQUIRED',
    }));
  }catch(e){
    console.error('EP003_SHOT02_V4_RENDER_BLOCKED '+String(e.stack||e));
    if(renderId)await db.query(`update remotion_render
        set status='FAILED',error=$1,finished_at=now(),updated_at=now()
        where id=$2::uuid and status='RUNNING'`,
      [String(e.message||e).slice(0,1200),renderId]).catch(()=>{});
    process.exitCode=1;
  }finally{
    await db.end().catch(()=>{});
    if(tmp)await fs.rm(tmp,{recursive:true,force:true}).catch(()=>{});
  }
}
main().catch(e=>{console.error('EP003_SHOT02_V4_PREFLIGHT_BLOCKED '+String(e.stack||e));process.exitCode=1;});
