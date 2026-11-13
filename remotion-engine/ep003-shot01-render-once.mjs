import {Client} from 'pg';
import {bundle} from '@remotion/bundler';
import {selectComposition,renderMedia} from '@remotion/renderer';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {createHash,randomUUID} from 'node:crypto';

const SHA=String(process.env.RAILWAY_GIT_COMMIT_SHA||'').trim();
const DB=String(process.env.DATABASE_URL||'').trim();
const DIRECTOR_AUTHORIZED=process.env.EP003_DIRECTOR_SHOT01_RENDER_APPROVED==='true';
const PIN='73ec0e6f-d348-4518-a32b-573bf89a8ab5';
const PROJECT='11111111-1111-1111-1111-111111111111';
const COMPOSITION='EP003-SHOT01-DIRECTOR-CANDIDATE';
const SHOT='SHOT01';
const EXPECTED_FRAMES=1572;
const FPS=30;
const hash=(input)=>createHash('sha256').update(input).digest('hex');
const voiceCues={
  STABLE:'The retry storm has stopped.',
  UNRESOLVED:'But something important has not changed.',
  SHEDDING:'When traffic becomes too high, we can reject some requests early.',
  CONSEQUENCE:'A fast rejection is still a failed Login.',
  CAPACITY:'What if the business needs more capacity than our database can provide?',
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
function cueFramesFromRealVoice(raw){
  let doc=typeof raw==='string'?JSON.parse(raw):raw;
  const real=getCharacters(doc);
  const spoken=real.characters.join('');
  const frames={};
  let last=-1;
  for(const [key,phrase] of Object.entries(voiceCues)){
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
    application_name:'ep003_shot01_once'});
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
    assert(source,'EP003_SHOT01_NO_DIRECTOR_APPROVED_TAKE__BLOCK_RENDER');
    const file=JSON.parse(await fs.readFile('/app/backend/src/main/resources/ep003-director-locked-voice-package-v1.json','utf8'));
    const locked=file.shots.find(s=>s.shotKey===SHOT)?.narration;
    assert(locked&&source.original_narration===locked&&source.narration===locked,
      'DIRECTOR_LOCKED_EP003_SCRIPT_MISMATCH');
    assert(source.delivery_mode==='ELEVEN_V4_AUTO_SLOW_NATURAL_PAUSES_V1',
      'SELECTED_AUDIO_NOT_VERIFIED_SLOW_NATURAL__NO_AUDIO_REGEN');
    assert(source.spoken_sha===hash(locked),'SELECTED_TAKE_SCRIPT_HASH_MISMATCH');
    assert(Number(source.duration_seconds)>20&&Number(source.duration_seconds)<400,
      'REAL_SELECTED_AUDIO_DURATION_INVALID');
    const cueFrames=cueFramesFromRealVoice(source.timing);
    const previous=(await db.query(`
      select id,status,width,height,fps,duration_in_frames,video_data,render_hash
      from remotion_render where id=$1::uuid`,[PIN])).rows[0];
    assert(previous?.status==='SUCCEEDED'&&previous.video_data,
      'EP002_APPROVED_FINAL_RENDER_NOT_IN_DATABASE__P0_BLOCK');
    assert(Number(previous.width)===1920&&Number(previous.height)===1080
        &&Number(previous.fps)===30&&Number(previous.duration_in_frames)===EXPECTED_FRAMES,
      'EP002_FINAL_RENDER_PIN_METADATA_INVALID');
    const idempotency=hash(
      'EP003_SHOT01_DIRECTOR_V1|'+SHA+'|'+source.take_id+'|'+source.spoken_sha+
      '|'+PIN+'|'+previous.render_hash
    );
    const already=(await db.query(`select id,status from remotion_render
      where project_id=$1::uuid and render_hash=$2`,[PROJECT,idempotency])).rows[0];
    if(already){
      console.log('EP003_SHOT01_EXISTING_RENDER '+JSON.stringify(already));
      return;
    }
    tmp=await fs.mkdtemp(path.join(os.tmpdir(),'ep003-shot01-director-v1-'));
    const prevFile=path.join(tmp,'ep002-shot11-pinned.mp4');
    const prevPng=path.join(tmp,'real-ep002-final-frame.png');
    const originalAudio=path.join(tmp,source.content_type==='audio/wav'?'locked-take.wav':'locked-take.mp3');
    await fs.writeFile(prevFile,previous.video_data);
    await fs.writeFile(originalAudio,source.audio);
    const info=await ffprobe(prevFile);
    const v=info.streams.find(s=>s.codec_type==='video');
    assert(v?.width===1920&&v?.height===1080,
      'PINNED_EP002_MEDIA_STREAM_NOT_1920x1080');
    const seconds=Number(info.format.duration);
    assert(seconds>=51&&seconds<=54,'PINNED_EP002_SHOT11_DURATION_UNEXPECTED');
    await run('ffmpeg',['-hide_banner','-nostdin','-loglevel','error',
      '-i',prevFile,'-vf','select=eq(n\\,1571)','-vsync','0',
      '-frames:v','1','-y',prevPng]);
    const finalPng=await fs.readFile(prevPng);
    assert(finalPng.length>20000,'PINNED_LAST_FRAME_EXTRACTION_FAILED');
    const speech=await ffprobe(originalAudio);
    const audioSeconds=Number(speech.format.duration);
    const storedSeconds=Number(source.duration_seconds);
    assert(Math.abs(audioSeconds-storedSeconds)<1.4,
      'LOCKED_AUDIO_REAL_DURATION_DISAGREES_WITH_STORED_MEASUREMENT');
    const frames=Math.ceil(audioSeconds*30)+15;
    for(const [name,frame] of Object.entries(cueFrames))
      assert(frame<frames,'CUE_AFTER_AUDIO_'+name);
    const props={
      durationInFrames:frames,
      voiceTakeId:source.take_id,
      previousRenderId:PIN,
      previousLastFrameSha256:hash(finalPng),
      previousLastFrameDataUri:'data:image/png;base64,'+finalPng.toString('base64'),
      cueFrames,
      worldStartFrame:11978,
    };
    const receipt={
      previousRenderId:PIN,previousFrames:1572,
      previousFrameSha256:props.previousLastFrameSha256,
      sourceCommit:SHA,voiceTakeId:source.take_id,
      lockedScriptSha256:source.spoken_sha,
      audioSeconds,frames,cues:cueFrames,
    };
    console.log('EP003_SHOT01_REAL_INPUT_VERIFIED '+JSON.stringify(receipt));
    renderId=randomUUID();
    await db.query(`insert into remotion_render(
       id,project_id,episode_id,composition_id,render_key,engine_version,
       input_props,render_hash,profile,status,width,height,fps,duration_in_frames,progress
       ) values ($1::uuid,$2::uuid,null,$3,$4,$5,$6::jsonb,$7,'REVIEW','RUNNING',
       1920,1080,30,$8,0)`,[
      renderId,PROJECT,COMPOSITION,'EP003_SHOT01_V1',
      'EP003_PIN_'+SHA.slice(0,12),
      JSON.stringify({...props,previousLastFrameDataUri:'DATA_URI_SAVED_ONLY_IN_RENDER_RECEIPT'}),
      idempotency,frames
    ]);
    const bundlePath=path.join(tmp,'bundle');
    const serveUrl=await bundle({entryPoint:'/app/remotion-engine/src/index.ts',
      outDir:bundlePath,onProgress:p=>{
        if(p%25===0)console.log('EP003_REMOTION_BUNDLE_PROGRESS '+p);
      }});
    const composition=await selectComposition({serveUrl,id:COMPOSITION,inputProps:props,
      browserExecutable:process.env.CHROMIUM_PATH||'/usr/bin/chromium',
      timeoutInMilliseconds:120000});
    assert(composition.durationInFrames===frames&&composition.width===1920
      &&composition.height===1080&&composition.fps===30,
      'COMPOSITION_METADATA_NOT_FROM_REAL_TAKE');
    const silent=path.join(tmp,'ep003-shot01-visual.mp4');
    await renderMedia({
      composition,serveUrl,codec:'h264',outputLocation:silent,inputProps:props,
      browserExecutable:process.env.CHROMIUM_PATH||'/usr/bin/chromium',
      concurrency:2,crf:19,
      onProgress:({progress})=>{
        const pct=Math.floor(progress*100);
        if(pct%10===0&&pct!==0)console.log('EP003_RENDER_PROGRESS '+pct);
      }
    });
    const finished=path.join(tmp,'ep003-shot01-final.mp4');
    await run('ffmpeg',['-hide_banner','-nostdin','-loglevel','error',
      '-i',silent,'-i',originalAudio,'-map','0:v:0','-map','1:a:0',
      '-c:v','copy','-c:a','aac','-b:a','160k','-ar','48000',
      '-t',String(frames/30),'-movflags','+faststart','-y',finished]);
    const final=await ffprobe(finished);
    const streams=final.streams;
    assert(streams.some(s=>s.codec_type==='video'&&s.codec_name==='h264'
          &&s.width===1920&&s.height===1080),
      'EP003_FINAL_MP4_VIDEO_QA_FAILED');
    assert(streams.some(s=>s.codec_type==='audio'&&s.codec_name==='aac'),
      'EP003_FINAL_MP4_AUDIO_QA_FAILED');
    assert(Math.abs(Number(final.format.duration)-frames/30)<.45,
      'EP003_MP4_DURATION_QA_FAILED');
    const bytes=await fs.readFile(finished);
    assert(bytes.length>=1500000&&bytes.length<256*1024*1024,
      'EP003_FINAL_MP4_SIZE_NOT_SAFE_FOR_MEDIAOS_STORAGE');
    const videoSha=hash(bytes);
    await db.query(`update remotion_render
      set video_data=$1,media_type='video/mp4',size_bytes=$2,status='SUCCEEDED',
      progress=100,finished_at=now(),updated_at=now()
      where id=$3::uuid and status='RUNNING'`,
      [bytes,bytes.length,renderId]);
    console.log('EP003_SHOT01_REAL_MP4_SAVED '+JSON.stringify({
      renderId,uri:'/api/v1/remotion/renders/'+renderId+'/video',
      mp4Sha256:videoSha,bytes:bytes.length,codec:'H264/AAC',
      width:1920,height:1080,fps:30,frames,
      selectedTake:source.take_id,
      directorStatus:'VISUAL_REVIEW_REQUIRED__NOT_LOCKED',
      p0:'SOURCE_FRAME_PINNED__ACTUAL_SEAM_QA_STILL_REQUIRED',
    }));
  }catch(e){
    console.error('EP003_SHOT01_RENDER_BLOCKED '+String(e.stack||e));
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
main().catch(e=>{console.error('EP003_SHOT01_PREFLIGHT_BLOCKED '+String(e.stack||e));process.exitCode=1;});
