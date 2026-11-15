import {Client} from 'pg';
import {selectComposition,renderMedia,renderStill} from '@remotion/renderer';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {createHash,randomUUID} from 'node:crypto';

const SHA=String(process.env.RAILWAY_GIT_COMMIT_SHA||'').trim();
const DB=String(process.env.DATABASE_URL||'').trim();
const DIRECTOR_AUTHORIZED=process.env.EP003_SHOT08_V1_DIRECTOR_RENDER_APPROVED==='true';
const PIN='09457c3c-32d9-432c-aa92-67f0e7b13f60';
const PIN_SHA='7f7429a6a4117c49b4338dec256eae72fbe5e269728729dfdb23ab63e6ba27f8';
const PROJECT='11111111-1111-1111-1111-111111111111';
const COMPOSITION='EP003-SHOT08-SHARDING-V1-DIRECTOR-CANDIDATE';
const SHOT='SHOT08',FPS=30,LEAD_IN_FRAMES=60,PREVIOUS_FRAMES=3476;
const SELECTED_TAKE='368c239c-a93b-437e-a833-2f955fa51803';
const hash=input=>createHash('sha256').update(input).digest('hex');
const voiceCues=JSON.parse(await fs.readFile('/app/remotion-engine/ep003-shot08-real-cue-anchors.json','utf8'));
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
 const doc=typeof raw==='string'?JSON.parse(raw):raw;
 const real=getCharacters(doc);
 const spoken=real.characters.join('');
 const chars=[],originalIndices=[];
 for(let i=0;i<spoken.length;i++){
  const c=spoken[i].toLowerCase();
  if(c>='a'&&c<='z'||c>='0'&&c<='9'){
   chars.push(c);originalIndices.push(i);
  }
 }
 const compact=chars.join('');
 const frames={};
 let lastFrame=-1,lastPosition=-1;
 for(const [key,phrase] of Object.entries(anchors)){
  let pos=spoken.indexOf(phrase);
  let mode='EXACT';
  if(pos<0){
   const words=phrase.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
   const sizes=[words.length,Math.min(14,words.length),
     Math.min(10,words.length),Math.min(7,words.length),
     Math.min(5,words.length),Math.min(4,words.length)];
   pos=-1;
   for(const count of [...new Set(sizes)]){
    const term=words.slice(0,count).join('');
    const offset=compact.indexOf(term);
    if(offset<0||compact.indexOf(term,offset+1)>=0)continue;
    pos=originalIndices[offset];
    mode='REAL_NORMALIZED_'+count+'_WORDS';
    break;
   }
  }else{
   assert(spoken.indexOf(phrase,pos+1)<0,'REAL_AUDIO_ANCHOR_NOT_UNIQUE_'+key);
  }
  assert(pos>=0,'REAL_AUDIO_ANCHOR_NOT_FOUND_'+key);
  assert(pos>lastPosition,'REAL_AUDIO_ANCHOR_OUT_OF_ORDER_'+key);
  const seconds=real.character_start_times_seconds[pos];
  const frame=Math.round(seconds*FPS);
  assert(Number.isInteger(frame)&&frame>=lastFrame,'REAL_AUDIO_CUES_OUT_OF_ORDER_'+key);
  frames[key]=frame;
  if(mode!=='EXACT')console.log('EP003_SHOT08_REAL_ALIGNMENT_NORMALIZED_MATCH '+JSON.stringify({
    cue:key,mode,frame,source:'REAL_ELEVENLABS_CHARACTER_START'
  }));
  lastFrame=frame;lastPosition=pos;
 }
 return frames;
}

async function main(){
  assert(DIRECTOR_AUTHORIZED,'EP003_SHOT08_REQUIRES_EXPLICIT_DIRECTOR_RENDER_APPROVAL');
  assert(/^[a-f0-9]{40}$/.test(SHA),'EP003_SHOT08_UNPINNED_SOURCE_COMMIT');
  assert(DB.startsWith('postgres'),'EP003_SHOT08_PRODUCTION_DATABASE_NOT_CONNECTED');
  const db=new Client({connectionString:DB,connectionTimeoutMillis:12000,
    application_name:'ep003_shot07_bottleneck_v3_once'});
  await db.connect();
  let renderId=null,tmp=null;
  try{
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
      join lateral (
        select c.take_id from episode_package_voice_choice c
        where c.shot_id=s.id and c.revision=1
        order by c.selected_at desc,c.id desc limit 1
      ) c on true
      join episode_package_voice_take t on t.id=c.take_id
        and t.shot_id=s.id and t.revision=1
      where p.episode_key='EP003'`,[SHOT])).rows[0];
    assert(source,
      'EP003_SHOT08_NO_SELECTED_SLOW_NATURAL_TAKE__USE_DIRECTOR_VOICE_STUDIO_ONCE__NEVER_AUTOGENERATE');
    const file=JSON.parse(await fs.readFile(
      '/app/backend/src/main/resources/ep003-director-locked-voice-package-v1.json','utf8'));
    const locked=file.shots.find(s=>s.shotKey===SHOT)?.narration;
    assert(locked&&source.original_narration===locked&&source.narration===locked,
      'EP003_SHOT08_DIRECTOR_LOCKED_SCRIPT_MISMATCH');
    assert(String(source.take_id)===SELECTED_TAKE,'EP003_SHOT08_SELECTED_TAKE_CHANGED__NO_AUTO_TTS');
    assert(source.delivery_mode==='ELEVEN_V4_AUTO_SLOW_NATURAL_PAUSES_V1',
      'EP003_SHOT08_SELECTED_TAKE_MUST_BE_ORIGINAL_SLOW_NATURAL');
    assert(source.spoken_sha===hash(locked),
      'EP003_SHOT08_SELECTED_TAKE_SCRIPT_SHA_MISMATCH');
    assert(Number(source.duration_seconds)>20&&Number(source.duration_seconds)<400,
      'EP003_SHOT08_SELECTED_TAKE_DURATION_INVALID');
    const realCues=cueFramesFromRealVoice(source.timing);
    const cueFrames=Object.fromEntries(Object.entries(realCues)
      .map(([name,frame])=>[name,frame+LEAD_IN_FRAMES]));
    assert(cueFrames.INTRO>=LEAD_IN_FRAMES,'EP003_SHOT08_TWO_SECOND_PRELUDE_MISSING');
    const previous=(await db.query(`
      select id,status,render_key,width,height,fps,duration_in_frames,video_data,render_hash
      from remotion_render where id=$1::uuid`,[PIN])).rows[0];
    assert(previous?.status==='SUCCEEDED'&&previous.video_data,
      'EP003_SHOT08_V1_PREDECESSOR_MP4_MISSING');
    assert(previous.render_key==='EP003_SHOT07_BOTTLENECK_V3',
      'EP003_SHOT08_REQUIRES_EXACT_DIRECTOR_LOCKED_SHOT06_V1');
    assert(hash(previous.video_data)===PIN_SHA,
      'EP003_SHOT08_DIRECTOR_LOCKED_V1_SHA256_CHANGED');
    assert(Number(previous.width)===1920&&Number(previous.height)===1080&&
      Number(previous.fps)===FPS&&Number(previous.duration_in_frames)===PREVIOUS_FRAMES,
      'EP003_SHOT08_SHOT06_V1_SOURCE_METADATA_INVALID');
    const signature=hash('EP003_SHOT08_SHARDING_V1|'+SHA+'|'+source.take_id+
      '|'+source.spoken_sha+'|'+PIN+'|'+previous.render_hash);
    const existing=(await db.query(`select id,status from remotion_render
      where project_id=$1::uuid and render_hash=$2`,[PROJECT,signature])).rows[0];
    if(existing){console.log('EP003_SHOT08_IDEMPOTENT_EXISTING_RENDER '+JSON.stringify(existing));return;}
    tmp=await fs.mkdtemp(path.join(os.tmpdir(),'ep003-shot08-sharding-'));
    const oldFile=path.join(tmp,'shot07-v3-director-locked.mp4');
    const oldEnd=path.join(tmp,'actual-shot07-v3-last-frame.png');
    const audioFile=path.join(tmp,source.content_type==='audio/wav'?'original-voice.wav':'original-voice.mp3');
    await fs.writeFile(oldFile,previous.video_data);
    await fs.writeFile(audioFile,source.audio);
    await run('ffmpeg',['-hide_banner','-nostdin','-loglevel','error','-i',oldFile,
      '-vf','select=eq(n\\,3475)','-vsync','0','-frames:v','1','-y',oldEnd]);
    const lastPng=await fs.readFile(oldEnd);
    assert(lastPng.length>20000,'EP003_SHOT08_REAL_FINAL_FRAME_NOT_EXTRACTED');
    const voiceProbe=await ffprobe(audioFile);
    const audioSeconds=Number(voiceProbe.format.duration);
    assert(Math.abs(audioSeconds-Number(source.duration_seconds))<1.4,
      'EP003_SHOT08_VOICE_DURATION_DISAGREES_WITH_SELECTED_TAKE');
    const frames=Math.ceil(audioSeconds*FPS)+15+LEAD_IN_FRAMES;
    for(const [cue,frame] of Object.entries(cueFrames))
      assert(Number.isInteger(frame)&&frame<frames,'EP003_SHOT08_REAL_CUE_OUTSIDE_TAKE_'+cue);
    const props={
      durationInFrames:frames,voiceTakeId:source.take_id,previousRenderId:PIN,
      previousLastFrameSha256:hash(lastPng),
      previousLastFrameDataUri:'data:image/png;base64,'+lastPng.toString('base64'),
      worldStartFrame:34927,cueFrames,
    };
    console.log('EP003_SHOT08_DIRECTOR_SOURCE_AND_VOICE_VERIFIED '+JSON.stringify({
      previousRenderId:PIN,previousVideoSha256:PIN_SHA,
      decodedLastFrameSha256:props.previousLastFrameSha256,
      selectedOriginalSlowNaturalTake:source.take_id,realVoiceSeconds:audioSeconds,
      frames,voiceLeadInFrames:LEAD_IN_FRAMES,
      worldStartFrame:34927,realAudioCues:cueFrames,
      scriptSha256:source.spoken_sha,sourceCommit:SHA,
      narrationRegenerated:false,previousVideoModified:false,
    }));
    renderId=randomUUID();
    await db.query(`insert into remotion_render(
      id,project_id,episode_id,composition_id,render_key,engine_version,
      input_props,render_hash,profile,status,width,height,fps,duration_in_frames,progress
    ) values($1::uuid,$2::uuid,null,$3,$4,$5,$6::jsonb,$7,'REVIEW','RUNNING',
      1920,1080,30,$8,0)`,[
      renderId,PROJECT,COMPOSITION,'EP003_SHOT08_SHARDING_V1',
      'EP003_SHOT08_PIN_'+SHA.slice(0,12),
      JSON.stringify({...props,previousLastFrameDataUri:'EXACT_FRAME_HANDED_TO_RENDERER_ONLY'}),
      signature,frames,
    ]);
    const serveUrl='/app/remotion-engine/build';
    const index=await fs.stat(path.join(serveUrl,'index.html')).catch(()=>null);
    assert(index?.size>100,'EP003_SHOT08_IMMUTABLE_REMOTION_BUNDLE_MISSING');
    const composition=await selectComposition({serveUrl,id:COMPOSITION,inputProps:props,
      browserExecutable:process.env.CHROMIUM_PATH||'/usr/bin/chromium',
      timeoutInMilliseconds:120000});
    assert(composition.durationInFrames===frames&&composition.fps===FPS&&
      composition.width===1920&&composition.height===1080,
      'EP003_SHOT08_COMPOSITION_NOT_LOCKED_VOICE_DURATION');
    const still=path.join(tmp,'shot08-still-frame-zero.png');
    await renderStill({composition,serveUrl,output:still,imageFormat:'png',
      frame:0,inputProps:props,
      browserExecutable:process.env.CHROMIUM_PATH||'/usr/bin/chromium',
      timeoutInMilliseconds:120000});
    const stillPsnrResult=await run('ffmpeg',['-hide_banner','-nostdin',
      '-i',oldEnd,'-i',still,'-lavfi','psnr','-f','null','-']);
    const rawStillPsnr=stillPsnrResult.stderr.match(/average:(inf|[0-9.]+)/i)?.[1];
    const stillPsnr=rawStillPsnr?.toLowerCase()==='inf'?100:Number(rawStillPsnr);
    console.log('EP003_SHOT08_PRE_RENDER_P0_STILL_QA '+JSON.stringify({
      exactShot07V3LastFrameSha256:props.previousLastFrameSha256,
      stillPsnrDb:stillPsnr,thresholdDb:27,
      sourceCommit:SHA,
    }));
    assert(Number.isFinite(stillPsnr)&&stillPsnr>=27,
      'EP003_SHOT08_P0_STILL_VISUAL_MISMATCH__STOP_BEFORE_FULL_RENDER');
    const silent=path.join(tmp,'ep003-shot08-sharding-visual.mp4');
    await renderMedia({composition,serveUrl,codec:'h264',outputLocation:silent,
      inputProps:props,browserExecutable:process.env.CHROMIUM_PATH||'/usr/bin/chromium',
      concurrency:2,crf:19,
      onProgress:({progress})=>{
        const pct=Math.floor(progress*100);
        if(pct>0&&pct%10===0)console.log('EP003_SHOT08_RENDER_PROGRESS '+pct);
      }});
    const final=path.join(tmp,'ep003-shot08-sharding-review.mp4');
    await run('ffmpeg',['-hide_banner','-nostdin','-loglevel','error',
      '-i',silent,'-i',audioFile,
      '-map','0:v:0','-map','1:a:0','-c:v','copy',
      '-af','adelay=2000:all=1','-c:a','aac','-b:a','160k','-ar','48000',
      '-t',String(frames/FPS),'-movflags','+faststart','-y',final]);
    const first=path.join(tmp,'real-shot07-first-frame.png');
    await run('ffmpeg',['-hide_banner','-nostdin','-loglevel','error',
      '-i',final,'-frames:v','1','-y',first]);
    const psnrResult=await run('ffmpeg',['-hide_banner','-nostdin',
      '-i',oldEnd,'-i',first,'-lavfi','psnr','-f','null','-']);
    const rawPsnr=psnrResult.stderr.match(/average:(inf|[0-9.]+)/i)?.[1];
    const psnr=rawPsnr?.toLowerCase()==='inf'?100:Number(rawPsnr);
    console.log('EP003_SHOT08_ENCODED_P0_FRAME_QA '+JSON.stringify({
      firstFramePsnrDb:psnr,thresholdDb:27,sourceCommit:SHA,
      rawPsnr:rawPsnr??'NO_AVERAGE_METRIC'
    }));
    assert(Number.isFinite(psnr)&&psnr>=27,
      'EP003_SHOT08_ACTUAL_DECODED_FIRST_FRAME_SEAM_QA_FAILED');
    const motion=await firstFramesMotion(final);
    assert(motion.uniqueMovingSteps>=18,
      'EP003_SHOT08_FIRST_SECOND_MUST_NOT_BE_STATIC');
    assert(motion.firstStep>0.12&&motion.firstStep<4.5,
      'EP003_SHOT08_INITIAL_MOTION_JUMP_OR_FREEZE');
    console.log('EP003_SHOT08_P0_REAL_SEAM_AND_MOTION_QA '+JSON.stringify({
      firstFramePsnrDb:psnr,thresholdDb:27,motion,
      method:'EXACT_PREDECESSOR_IMAGE_AT_FRAME_ZERO_ONLY__LIVE_WORLD_FROM_FRAME_ONE'}));
    const info=await ffprobe(final);
    const video=info.streams.find(s=>s.codec_type==='video');
    const audio=info.streams.find(s=>s.codec_type==='audio');
    assert(video?.codec_name==='h264'&&audio?.codec_name==='aac'&&
      video.width===1920&&video.height===1080&&
      Number(video.nb_frames)===frames&&
      Math.abs(Number(info.format.duration)-frames/FPS)<.45,
      'EP003_SHOT08_FINAL_VIDEO_STREAM_OR_DURATION_INVALID');
    const bytes=await fs.readFile(final);
    assert(bytes.length>1500000&&bytes.length<256*1024*1024,
      'EP003_SHOT08_OUTPUT_MP4_SIZE_INVALID');
    const finished=(await db.query(`update remotion_render
      set video_data=$1,media_type='video/mp4',size_bytes=$2,status='SUCCEEDED',
      progress=100,finished_at=now(),updated_at=now()
      where id=$3::uuid and status='RUNNING' returning id`,
      [bytes,bytes.length,renderId])).rows[0];
    assert(finished,'EP003_SHOT08_MP4_SAVE_DID_NOT_COMPLETE');
    console.log('EP003_SHOT08_V1_REAL_MP4_SAVED '+JSON.stringify({
      renderId,videoUrl:'/api/v1/remotion/renders/'+renderId+'/video',
      sourceCommit:SHA,frames,seconds:frames/FPS,bytes:bytes.length,
      videoSha256:hash(bytes),firstFramePsnrDb:psnr,earlyMotion:motion,
      codec:'H264/AAC',resolution:'1920x1080',fps:FPS,
      predecessor:'SHOT07 V3 Director LOCK',previousRenderId:PIN,
      voiceSource:'ORIGINAL_SELECTED_SLOW_NATURAL_TAKE__NO_REGEN',
      directorStatus:'SHOT08_V1_CANDIDATE__VISUAL_APPROVAL_REQUIRED'
    }));
  }catch(error){
    console.error('EP003_SHOT08_RENDER_BLOCKED '+String(error?.stack||error));
    if(renderId)await db.query(`update remotion_render
      set status='FAILED',error=$1,finished_at=now(),updated_at=now()
      where id=$2::uuid and status='RUNNING'`,
      [String(error?.message||error).slice(0,1200),renderId]).catch(()=>{});
    process.exitCode=1;
  }finally{
    await db.end().catch(()=>{});
    if(tmp)await fs.rm(tmp,{recursive:true,force:true}).catch(()=>{});
  }
}
main().catch(error=>{
  console.error('EP003_SHOT08_PREFLIGHT_BLOCKED '+String(error?.stack||error));
  process.exitCode=1;
});
