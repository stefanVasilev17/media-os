import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import os from 'node:os';

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
        'fps=30,'+
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
    visualPolicy:'LAST_60_MOVING_SOURCE_FRAMES_PACED_TO_120_LOW_MEMORY',
  });
}

async function execute(bin,args){
  return new Promise((resolve,reject)=>{
    const child=spawn(bin,args,{stdio:['ignore','pipe','pipe']});
    let output='',errors='';
    child.stdout.on('data',chunk=>{output+=chunk.toString();});
    child.stderr.on('data',chunk=>{errors+=chunk.toString();});
    child.on('error',reject);
    child.on('close',(code,signal)=>code===0?resolve({output,errors}):
      reject(new Error(bin+' exited '+code+' signal='+signal+': '+errors.slice(-1800))));
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
  const finalDir=path.dirname(output);
  await fs.mkdir(finalDir,{recursive:true});
  const work=await fs.mkdtemp(path.join(finalDir,'.ep002-v2-low-memory-'));
  const argsBase=['-hide_banner','-loglevel','error','-xerror','-nostdin',
    '-threads','2','-filter_threads','2','-filter_complex_threads','2'];
  const rendered=[];
  const workFile=path.join(work,'joined.mp4');
  try{
    for(let i=0;i<inputs.length;i++){
      const frames=inputs[i].frames;
      const last=i===10;
      const totalFrames=frames+(last?0:60);
      const file=path.join(work,'shot'+String(i).padStart(2,'0')+'.mp4');
      let vf;
      if(last){
        vf='[0:v]trim=end_frame='+frames+',setpts=PTS-STARTPTS[vout]';
      }else{
        const pivot=frames-60;
        vf='[0:v]split=2[frontsrc][tailsrc];'+
          '[frontsrc]trim=end_frame='+pivot+',setpts=PTS-STARTPTS[front];'+
          '[tailsrc]trim=start_frame='+pivot+
          ',setpts=2*(PTS-STARTPTS),fps=30,tpad=stop_mode=clone:stop=1,'+
          'trim=end_frame=120,setpts=PTS-STARTPTS[tail];'+
          '[front][tail]concat=n=2:v=1:a=0[vout]';
      }
      const af='[0:a]aresample=48000,atrim=end='+(frames/30).toFixed(9)+
        ',apad,atrim=end='+(totalFrames/30).toFixed(9)+
        ',asetpts=PTS-STARTPTS[aout]';
      await execute(ffmpeg,[...argsBase,'-i',files[i],'-filter_complex',vf+';'+af,
        '-map','[vout]','-map','[aout]',
        '-c:v','libx264','-preset','veryfast','-crf','19',
        '-threads:v','2','-pix_fmt','yuv420p','-r','30',
        '-fps_mode','cfr','-frames:v',String(totalFrames),
        '-c:a','aac','-b:a','192k','-ar','48000',
        '-movflags','+faststart',file]);
      const probe=JSON.parse((await execute(ffprobe,['-v','error','-count_frames',
        '-show_streams','-show_format','-of','json',file])).output);
      const video=probe.streams.find(s=>s.codec_type==='video');
      const audio=probe.streams.find(s=>s.codec_type==='audio');
      if(video?.width!==1920||video?.height!==1080||video?.codec_name!=='h264'
          ||video?.r_frame_rate!=='30/1'||Number(video?.nb_read_frames)!==totalFrames
          ||audio?.codec_name!=='aac'
          ||Math.abs(Number(probe.format?.duration)-totalFrames/30)>0.1)
        block('SHOT'+(i+1)+' low-memory render failed MP4 duration/frame/audio QA');
      rendered.push(file);
    }
    const list=path.join(work,'clips.ffconcat');
    const quoted=file=>"'"+file.replaceAll("'","'\\''")+"'";
    await fs.writeFile(list,'ffconcat version 1.0\n'+
      rendered.map(f=>'file '+quoted(f)).join('\n')+'\n',{flag:'wx'});
    await execute(ffmpeg,[...argsBase,'-f','concat','-safe','0',
      '-i',list,'-map','0:v:0','-map','0:a:0','-c','copy',
      '-movflags','+faststart',workFile]);
    const probe=JSON.parse((await execute(ffprobe,['-v','error','-count_frames',
      '-show_streams','-show_format','-of','json',workFile])).output);
    const vs=probe.streams.filter(s=>s.codec_type==='video');
    const as=probe.streams.filter(s=>s.codec_type==='audio');
    if(vs.length!==1||as.length!==1||vs[0].codec_name!=='h264'
      ||as[0].codec_name!=='aac'||vs[0].width!==1920||vs[0].height!==1080
      ||vs[0].r_frame_rate!=='30/1'
      ||Number(vs[0].nb_read_frames)!==plan.outputFrames
      ||Math.abs(Number(probe.format.duration)-plan.outputSeconds)>0.4)
      block('The separately rendered low-memory master failed exact Full HD, frame, or duration QA.');
    await fs.link(workFile,output);
    return {status:'DIRECTOR_REVIEW_REQUIRED',outputFile:output,
      frames:plan.outputFrames,durationSeconds:plan.outputSeconds,
      breathingBoundaries:plan.boundaryCount,silentFramesPerBoundary:60};
  } finally {
    await fs.rm(work,{recursive:true,force:true}).catch(()=>{});
  }
}
