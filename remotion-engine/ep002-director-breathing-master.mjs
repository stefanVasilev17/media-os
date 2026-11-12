import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';

export const EP002_BREATH_FPS=30;
export const EP002_BREATH_FRAMES=60;
export const EP002_BREATH_SOURCE_TAIL_FRAMES=60;
export const EP002_BREATH_SHOTS=11;

function block(message) {
  throw new Error('EP002_DIRECTOR_BREATH_MASTER_BLOCKED: '+message);
}

export function planEp002DirectorBreaths(frames) {
  if(!Array.isArray(frames)||frames.length!==EP002_BREATH_SHOTS
      ||frames.some(n=>!Number.isInteger(n)||n<=EP002_BREATH_SOURCE_TAIL_FRAMES+30))
    block('Exactly eleven verified source frame counts are required.');
  const video=[];
  const audio=[];
  const parts=[];
  for(let i=0;i<frames.length;i++){
    const last=i===frames.length-1;
    if(last){
      parts.push('['+i+':v]trim=end_frame='+frames[i]+',setpts=PTS-STARTPTS[v'+i+']');
    }else{
      const pivot=frames[i]-EP002_BREATH_SOURCE_TAIL_FRAMES;
      parts.push('['+i+':v]split=2[v'+i+'pre][v'+i+'tail]');
      parts.push('[v'+i+'pre]trim=end_frame='+pivot+',setpts=PTS-STARTPTS[v'+i+'front]');
      parts.push('[v'+i+'tail]trim=start_frame='+pivot+
        ',setpts=2*(PTS-STARTPTS),'+
        'minterpolate=fps=30:mi_mode=mci:mc_mode=obmc:me=epzs,'+
        'tpad=stop_mode=clone:stop=2,'+
        'trim=end_frame=120,setpts=PTS-STARTPTS[v'+i+'slow]');
      parts.push('[v'+i+'front][v'+i+'slow]concat=n=2:v=1:a=0[v'+i+']');
    }
    const shotFrames=frames[i]+(last?0:EP002_BREATH_FRAMES);
    parts.push('['+i+':a]aresample=48000,atrim=end='+
      (frames[i]/EP002_BREATH_FPS).toFixed(9)+
      ',apad,atrim=end='+(shotFrames/EP002_BREATH_FPS).toFixed(9)+
      ',asetpts=PTS-STARTPTS[a'+i+']');
    video.push('[v'+i+']');
    audio.push('[a'+i+']');
  }
  parts.push(video.map((v,i)=>v+audio[i]).join('')+
    'concat=n='+frames.length+':v=1:a=1[vout][aout]');
  const totalSourceFrames=frames.reduce((a,b)=>a+b,0);
  const addedFrames=EP002_BREATH_FRAMES*(frames.length-1);
  return Object.freeze({
    sourceFrames:totalSourceFrames,
    addedFrames,
    outputFrames:totalSourceFrames+addedFrames,
    outputSeconds:(totalSourceFrames+addedFrames)/EP002_BREATH_FPS,
    boundaryCount:frames.length-1,
    filterComplex:parts.join(';'),
    audioPolicy:'ORIGINAL_APPROVED_VOICE_THEN_60_FRAMES_OF_SILENCE',
    visualPolicy:'LAST_60_MOVING_SOURCE_FRAMES_OPTICALLY_INTERPOLATED_TO_120',
  });
}

async function execute(bin,args){
  return new Promise((resolve,reject)=>{
    const child=spawn(bin,args,{stdio:['ignore','pipe','pipe']});
    let output='',errors='';
    child.stdout.on('data',chunk=>{output+=chunk.toString();});
    child.stderr.on('data',chunk=>{errors+=chunk.toString();});
    child.on('error',reject);
    child.on('close',code=>code===0?resolve({output,errors}):
      reject(new Error(bin+' exited '+code+': '+errors.slice(-1800))));
  });
}

export async function renderEp002DirectorBreathMaster({
  inputs,outputFile,confirmDirectorPaidRender=false,ffmpeg='ffmpeg',ffprobe='ffprobe',
}={}){
  if(confirmDirectorPaidRender!==true)block('A new explicitly approved CPU render is required.');
  if(!Array.isArray(inputs)||inputs.length!==11||inputs.some(s=>
      !s||!Number.isInteger(s.frames)||s.frames<=90||
      typeof s.file!=='string'||!path.isAbsolute(s.file)||!s.file.endsWith('.mp4')))
    block('Exactly eleven verified, absolute MP4 input paths and actual frame counts are required.');
  const files=inputs.map(s=>path.resolve(s.file));
  if(new Set(files).size!==11)block('Duplicate SHOT source file.');
  const output=path.resolve(outputFile||'');
  if(!outputFile||!output.endsWith('.mp4')||files.includes(output))
    block('A distinct MP4 output filename is required.');
  if(await fs.stat(output).then(()=>true).catch(()=>false))
    block('Review master already exists; never replace an earlier version.');
  for(const file of files){
    if(!(await fs.stat(file).catch(()=>null))?.isFile())
      block('Missing approved source MP4: '+path.basename(file));
  }
  const plan=planEp002DirectorBreaths(inputs.map(s=>s.frames));
  await fs.mkdir(path.dirname(output),{recursive:true});
  const temp=path.join(path.dirname(output),'.ep002-director-breath-'+
    process.pid+'-'+Date.now()+'.mp4');
  const args=['-hide_banner','-loglevel','error','-xerror','-nostdin'];
  for(const file of files)args.push('-i',file);
  args.push('-filter_complex',plan.filterComplex,
    '-map','[vout]','-map','[aout]',
    '-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p',
    '-r','30','-fps_mode','cfr','-frames:v',String(plan.outputFrames),
    '-c:a','aac','-b:a','192k','-ar','48000',
    '-movflags','+faststart',temp);
  try{
    await execute(ffmpeg,args);
    const probe=await execute(ffprobe,['-v','error','-count_frames','-show_streams',
      '-show_format','-of','json',temp]);
    const result=JSON.parse(probe.output);
    const vs=result.streams.filter(s=>s.codec_type==='video');
    const as=result.streams.filter(s=>s.codec_type==='audio');
    if(vs.length!==1||as.length!==1||vs[0].codec_name!=='h264'
      ||as[0].codec_name!=='aac'||vs[0].width!==1920||vs[0].height!==1080
      ||vs[0].r_frame_rate!=='30/1'
      ||Number(vs[0].nb_read_frames)!==plan.outputFrames
      ||Math.abs(Number(result.format.duration)-plan.outputSeconds)>0.10)
      block('The real edited master failed exact output frame, stream or runtime QA.');
    await fs.link(temp,output);
    return {status:'DIRECTOR_REVIEW_REQUIRED',outputFile:output,
      frames:plan.outputFrames,durationSeconds:plan.outputSeconds,
      breathingBoundaries:plan.boundaryCount,silentFramesPerBoundary:60};
  }finally{
    await fs.unlink(temp).catch(()=>{});
  }
}
