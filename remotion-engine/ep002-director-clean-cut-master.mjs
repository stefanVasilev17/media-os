import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';

export const EP002_V4_MODE='DIRECTOR_V4_CLEAN_CUT_NO_BRIDGE';
export const EP002_V4_TRANSITION='ZERO_ADDED_FRAMES_DIRECT_CUT';
export const EP002_V4_SHOT10='96e427d2-b518-47c0-a287-59ea42cfab52';
export const EP002_V4_SOURCE_FRAMES=23446;
export const EP002_V4_SOURCE_COUNT=11;

function block(message){throw Error('EP002_V4_CLEAN_CUT_BLOCKED: '+message);}

export function planEp002V4CleanCutMaster(frames){
  if(!Array.isArray(frames)||frames.length!==EP002_V4_SOURCE_COUNT||
      frames.some(n=>!Number.isInteger(n)||n<150))
    block('Exactly eleven complete approved SHOT frame counts required.');
  const total=frames.reduce((sum,n)=>sum+n,0);
  if(total!==EP002_V4_SOURCE_FRAMES)
    block('Exact approved source frame total changed: '+total);
  const seams=[];
  let elapsed=0;
  for(let i=0;i<10;i++){
    elapsed+=frames[i];
    seams.push(Object.freeze({
      from:'SHOT'+String(i+1).padStart(2,'0'),
      to:'SHOT'+String(i+2).padStart(2,'0'),
      frame:elapsed,
      timeSeconds:elapsed/30,
      addedFrames:0,
      transition:'DIRECT_HARD_CUT',
    }));
  }
  return Object.freeze({
    sourceCount:11,frames:total,durationSeconds:total/30,
    addedFrames:0,sourceFramesRetimed:0,sourceFramesDropped:0,
    audioFramesInserted:0,seamCount:10,seams:Object.freeze(seams),
  });
}

async function run(binary,args){
  return new Promise((resolve,reject)=>{
    const child=spawn(binary,args,{stdio:['ignore','pipe','pipe']});
    let stdout='',stderr='';
    child.stdout.on('data',data=>{
      stdout+=data.toString();
      if(stdout.length>1024*1024)child.kill('SIGKILL');
    });
    child.stderr.on('data',data=>{stderr=(stderr+data.toString()).slice(-3000);});
    child.once('error',reject);
    child.once('close',(code,signal)=>code===0
      ?resolve(stdout)
      :reject(Error(binary+' exit='+code+' signal='+signal+' '+stderr)));
  });
}

async function probe(file,ffprobe){
  const stdout=await run(ffprobe,['-v','error','-count_frames',
    '-show_streams','-show_format','-of','json',file]);
  const info=JSON.parse(stdout);
  const video=info.streams.filter(s=>s.codec_type==='video');
  const audio=info.streams.filter(s=>s.codec_type==='audio');
  if(video.length!==1||audio.length!==1)
    block('Output must have exactly one video and one audio stream.');
  const v=video[0],a=audio[0];
  return {frames:Number(v.nb_read_frames),width:v.width,height:v.height,
    fps:v.r_frame_rate,videoCodec:v.codec_name,audioCodec:a.codec_name,
    duration:Number(info.format?.duration),size:Number(info.format?.size)};
}
function escapeConcatFile(file){
  if(/[\r\n]/.test(file))block('Invalid input path');
  return "file '"+file.replaceAll("'","'\\''")+"'";
}

export async function renderEp002V4CleanCutMaster({
  inputs,outputFile,confirmDirectorPaidRender=false,
  ffmpeg='ffmpeg',ffprobe='ffprobe',onProgress=async()=>{},
}={}){
  if(confirmDirectorPaidRender!==true)
    block('Separate Director approval required for one new CPU master.');
  if(!Array.isArray(inputs)||inputs.length!==11||inputs.some(s=>
      !s||typeof s.file!=='string'||!path.isAbsolute(s.file)||
      !s.file.endsWith('.mp4')||!Number.isInteger(s.frames)))
    block('Exactly eleven absolute pinned source MP4 paths required.');
  const plan=planEp002V4CleanCutMaster(inputs.map(s=>s.frames));
  const files=inputs.map(s=>path.resolve(s.file));
  if(new Set(files).size!==11)block('Duplicate source MP4 not permitted.');
  if(!outputFile||!path.isAbsolute(outputFile)||!outputFile.endsWith('.mp4')||
      files.includes(path.resolve(outputFile)))
    block('Output must be a new distinct absolute MP4 path.');
  if(await fs.stat(outputFile).then(()=>true).catch(()=>false))
    block('Never overwrite existing master MP4.');
  for(const file of files){
    const s=await fs.stat(file).catch(()=>null);
    if(!s?.isFile()||s.size<1024)block('Missing or empty source MP4: '+file);
  }
  await fs.mkdir(path.dirname(outputFile),{recursive:true});
  const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'ep002-v4-clean-cut-'));
  const list=path.join(tmp,'approved.ffconcat');
  const combined=path.join(tmp,'clean-cut-master.mp4');
  try{
    await fs.writeFile(list,'ffconcat version 1.0\n'+
      files.map(escapeConcatFile).join('\n')+'\n',{flag:'wx'});
    await onProgress(35);
    await run(ffmpeg,['-hide_banner','-loglevel','error','-nostdin',
      '-threads','2','-fflags','+genpts','-f','concat','-safe','0',
      '-i',list,'-map','0:v:0','-map','0:a:0',
      '-c:v','copy','-c:a','aac','-b:a','192k','-ar','48000',
      '-af','aresample=async=1:first_pts=0',
      '-avoid_negative_ts','make_zero','-movflags','+faststart',combined]);
    await onProgress(80);
    const quality=await probe(combined,ffprobe);
    if(quality.width!==1920||quality.height!==1080||
        quality.fps!=='30/1'||quality.videoCodec!=='h264'||
        quality.audioCodec!=='aac'||quality.frames!==plan.frames||
        !Number.isFinite(quality.duration)||
        Math.abs(quality.duration-plan.durationSeconds)>.4||
        quality.size<1024)
      block('Finished MP4 failed exact frame, duration, Full HD, H264/AAC QA: '+
        JSON.stringify(quality));
    await fs.link(combined,outputFile);
    await onProgress(95);
    return {
      status:'CREATIVE_REVIEW_REQUIRED',outputFile,frames:plan.frames,
      durationSeconds:plan.durationSeconds,measuredSeconds:quality.duration,
      sourceCount:plan.sourceCount,seamCount:10,addedFrames:0,
      sourceFramesRetimed:0,sourceFramesDropped:0,
      preservedVideoBitstream:true,videoCodec:quality.videoCodec,
      audioCodec:quality.audioCodec,seams:plan.seams,
    };
  }finally{
    await fs.rm(tmp,{recursive:true,force:true}).catch(()=>{});
  }
}
