import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';

export const EP002_V3_MODE='DIRECTOR_V3_EXACT_FRAME_MATCHED_SEAMS';
export const EP002_V3_TRANSITION='TEN_ANCHORED_MOVING_CAMERA_BRIDGES';
export const EP002_V3_SEAM_FRAMES=60;
export const EP002_V3_FPS=30;
export const EP002_V3_SHOTS=11;
export const EP002_V3_PROFILES=Object.freeze([
  Object.freeze({from:'SHOT01',to:'SHOT02',style:'PHONE_TO_PRESSURE_FOCUS',zoom:.012}),
  Object.freeze({from:'SHOT02',to:'SHOT03',style:'NETWORK_CAPACITY_HANDOFF',zoom:.005}),
  Object.freeze({from:'SHOT03',to:'SHOT04',style:'CAPACITY_HEALTH_HANDOFF',zoom:.005}),
  Object.freeze({from:'SHOT04',to:'SHOT05',style:'NETWORK_TO_QUEUE_DOLLY',zoom:.014}),
  Object.freeze({from:'SHOT05',to:'SHOT06',style:'QUEUE_TIMEOUT_HANDOFF',zoom:.005}),
  Object.freeze({from:'SHOT06',to:'SHOT07',style:'QUEUE_TO_RETRY_MAP_PULLBACK',zoom:.014}),
  Object.freeze({from:'SHOT07',to:'SHOT08',style:'SHARED_WORLD_MITIGATION',zoom:.003}),
  Object.freeze({from:'SHOT08',to:'SHOT09',style:'SHARED_WORLD_ADMISSION',zoom:.003}),
  Object.freeze({from:'SHOT09',to:'SHOT10',style:'SHARED_WORLD_RECOVERY',zoom:.003}),
  Object.freeze({from:'SHOT10',to:'SHOT11',style:'SHARED_WORLD_CONCLUSION',zoom:.003}),
]);

function blocked(reason){throw Error('EP002_V3_CONTINUITY_BLOCKED: '+reason);}
function validateFrames(frames){
  if(!Array.isArray(frames)||frames.length!==EP002_V3_SHOTS||
      frames.some(x=>!Number.isInteger(x)||x<150))
    blocked('Exactly eleven valid Director-approved frame counts are required.');
}
export function planEp002V3SeamMaster(frames){
  validateFrames(frames);
  const sourceFrames=frames.reduce((a,b)=>a+b,0);
  return Object.freeze({
    sourceFrames,addedFrames:EP002_V3_SEAM_FRAMES*10,
    outputFrames:sourceFrames+600,
    seconds:(sourceFrames+600)/30,
    seamCount:10,transition:EP002_V3_TRANSITION,
    profiles:EP002_V3_PROFILES,
    sourceFramesRetimed:0,sourceFramesDropped:0,
    spokenNarrationFramesMoved:0,
  });
}
async function exec(bin,args,{binary=false}={}){
  return new Promise((resolve,reject)=>{
    const child=spawn(bin,args,{stdio:['ignore','pipe','pipe']});
    const stdout=[];
    let bytes=0,stderr='';
    child.stdout.on('data',d=>{
      bytes+=d.length;
      if(bytes>8*1024*1024){
        child.kill('SIGKILL');
        return;
      }
      stdout.push(d);
    });
    child.stderr.on('data',d=>{stderr=(stderr+d.toString()).slice(-2200);});
    child.on('error',reject);
    child.on('close',(code,signal)=>code===0
      ?resolve(binary?Buffer.concat(stdout):{stdout:Buffer.concat(stdout).toString(),stderr})
      :reject(Error(bin+' exit='+code+' signal='+signal+' '+stderr)));
  });
}
const ffBase=['-hide_banner','-loglevel','error','-nostdin','-threads','2',
  '-filter_threads','2','-filter_complex_threads','2'];
const videoEncode=['-c:v','libx264','-preset','veryfast','-crf','18',
  '-threads:v','2','-pix_fmt','yuv420p','-r','30',
  '-fps_mode','cfr'];
const audioEncode=['-c:a','aac','-b:a','192k','-ar','48000','-ac','2'];
function ffNumber(n){return Number(n.toFixed(9)).toString();}
async function probe(file,ffprobe){
  const {stdout}=await exec(ffprobe,['-v','error','-count_frames','-show_streams',
    '-show_format','-of','json',file]);
  const p=JSON.parse(stdout);
  const video=p.streams?.filter(s=>s.codec_type==='video')||[];
  const audio=p.streams?.filter(s=>s.codec_type==='audio')||[];
  return {frames:Number(video[0]?.nb_read_frames),width:video[0]?.width,
    height:video[0]?.height,fps:video[0]?.r_frame_rate,
    videoCodec:video[0]?.codec_name,audioCodec:audio[0]?.codec_name,
    duration:Number(p.format?.duration),videoCount:video.length,audioCount:audio.length};
}
function assertMedia(q,frames,expectedSeconds,who){
  if(q.videoCount!==1||q.audioCount!==1||q.videoCodec!=='h264'||
      q.audioCodec!=='aac'||q.fps!=='30/1'||q.width!==1920||
      q.height!==1080||q.frames!==frames||!Number.isFinite(q.duration)||
      Math.abs(q.duration-expectedSeconds)>.4)
    blocked('Full HD frame-exact H264/AAC QA failed: '+who+
      ' '+JSON.stringify(q));
}
async function thumb(file,seconds,ffmpeg){
  const raw=await exec(ffmpeg,['-hide_banner','-loglevel','error','-nostdin',
    '-ss',ffNumber(seconds),'-i',file,'-frames:v','1','-vf','scale=160:90',
    '-pix_fmt','rgb24','-f','rawvideo','pipe:1'],{binary:true});
  if(raw.length!==160*90*3)blocked('Missing decoded seam frame: '+path.basename(file));
  return raw;
}
export function rgbMeanAbsoluteDifference(left,right){
  if(!Buffer.isBuffer(left)||!Buffer.isBuffer(right)||
      left.length!==right.length||left.length===0)
    blocked('Unverified decoded boundary comparison');
  let sum=0;
  for(let i=0;i<left.length;i++)sum+=Math.abs(left[i]-right[i]);
  return Number((sum/left.length).toFixed(3));
}
function joinPath(file){
  if(/[\r\n]/.test(file))blocked('Line break in staging path');
  return "file '"+file.replaceAll("'","'\\''")+"'";
}
async function createBody(input,filename,ffmpeg){
  const seconds=input.frames/30;
  const af='[0:a]aresample=48000,atrim=end='+ffNumber(seconds)+
    ',apad,atrim=end='+ffNumber(seconds)+',asetpts=PTS-STARTPTS[aout]';
  const vf='[0:v]trim=end_frame='+input.frames+',setpts=PTS-STARTPTS[vout]';
  await exec(ffmpeg,[...ffBase,'-i',input.file,
    '-filter_complex',vf+';'+af,'-map','[vout]','-map','[aout]',
    ...videoEncode,'-frames:v',String(input.frames),
    ...audioEncode,'-movflags','+faststart',filename]);
}
async function extractAnchor(file,seconds,target,ffmpeg){
  await exec(ffmpeg,['-hide_banner','-loglevel','error','-nostdin',
    '-ss',ffNumber(seconds),'-i',file,'-frames:v','1','-update','1',target]);
  if((await fs.stat(target).catch(()=>null))?.size<1000)
    blocked('Missing anchor PNG: '+path.basename(target));
}
function continuityFilter(zoom){
  const t='min(1,N/59)';
  const fade='('+t+'*'+t+'*(3-2*'+t+'))';
  const centerX='iw/2-(iw/zoom/2)';
  const centerY='ih/2-(ih/zoom/2)';
  const outgoing="[0:v]zoompan=z='1+"+zoom+"*on/59':x='"+centerX+
    "':y='"+centerY+"':d=1:s=1920x1080:fps=30,"+
    'trim=end_frame=60,setpts=PTS-STARTPTS[a]';
  const incoming="[1:v]zoompan=z='1+"+zoom+"*(1-on/59)':x='"+centerX+
    "':y='"+centerY+"':d=1:s=1920x1080:fps=30,"+
    'trim=end_frame=60,setpts=PTS-STARTPTS[b]';
  return outgoing+';'+incoming+
    ";[a][b]blend=all_expr='A*(1-"+fade+")+B*"+fade+
    "',format=yuv420p[v];[2:a]atrim=duration=2,asetpts=PTS-STARTPTS[aout]";
}
async function createBridge(previous,last,target,profile,file,ffmpeg){
  await exec(ffmpeg,[...ffBase,
    '-loop','1','-framerate','30','-i',previous,
    '-loop','1','-framerate','30','-i',last,
    '-f','lavfi','-i','anullsrc=channel_layout=stereo:sample_rate=48000',
    '-filter_complex',continuityFilter(profile.zoom),
    '-map','[v]','-map','[aout]',
    ...videoEncode,'-frames:v','60',...audioEncode,
    '-movflags','+faststart',file]);
}
export async function renderEp002DirectorContinuityMaster({
  inputs,outputFile,confirmDirectorPaidRender=false,
  ffmpeg='ffmpeg',ffprobe='ffprobe',onProgress=async()=>{},
}={}){
  if(confirmDirectorPaidRender!==true)
    blocked('The Director must explicitly approve a separate V3 master.');
  if(!Array.isArray(inputs)||inputs.length!==11||inputs.some(s=>
      !s||!Number.isInteger(s.frames)||s.frames<150||
      typeof s.file!=='string'||!path.isAbsolute(s.file)||!s.file.endsWith('.mp4')))
    blocked('Exact eleven approved Full HD shot inputs required.');
  const plan=planEp002V3SeamMaster(inputs.map(s=>s.frames));
  if(plan.sourceFrames!==23446||plan.outputFrames!==24046)
    blocked('Production source frame totals changed.');
  const inputFiles=inputs.map(s=>path.resolve(s.file));
  if(new Set(inputFiles).size!==11)blocked('Duplicated source MP4');
  const output=path.resolve(outputFile||'');
  if(!outputFile||!output.endsWith('.mp4')||inputFiles.includes(output))
    blocked('Distinct V3 master MP4 path required.');
  if((await fs.stat(output).catch(()=>null))!==null)
    blocked('Never overwrite a previously completed master.');
  for(const file of inputFiles)
    if(!(await fs.stat(file).catch(()=>null))?.isFile())
      blocked('Missing approved MP4: '+file);
  await fs.mkdir(path.dirname(output),{recursive:true});
  const dir=await fs.mkdtemp(path.join(path.dirname(output),'.ep002-v3-continuity-'));
  const ordered=[];
  const body=[];
  const audit=[];
  const joined=path.join(dir,'master.mp4');
  try{
    for(let i=0;i<11;i++){
      const file=path.join(dir,'body'+String(i).padStart(2,'0')+'.mp4');
      await createBody(inputs[i],file,ffmpeg);
      assertMedia(await probe(file,ffprobe),inputs[i].frames,inputs[i].frames/30,
        'body SHOT'+(i+1));
      body.push(file);
      await onProgress(Math.min(56,5+Math.floor(51*(i+1)/11)));
    }
    for(let i=0;i<10;i++){
      ordered.push(body[i]);
      const last=path.join(dir,'last'+i+'.png');
      const first=path.join(dir,'first'+i+'.png');
      await extractAnchor(body[i],(inputs[i].frames-1)/30,last,ffmpeg);
      await extractAnchor(body[i+1],0,first,ffmpeg);
      const bridge=path.join(dir,'bridge'+String(i).padStart(2,'0')+'.mp4');
      await createBridge(last,first,EP002_V3_PROFILES[i],bridge,ffmpeg);
      assertMedia(await probe(bridge,ffprobe),60,2,'bridge SHOT'+(i+1));
      const prev=await thumb(last,0,ffmpeg);
      const next=await thumb(first,0,ffmpeg);
      const before=await thumb(bridge,0,ffmpeg);
      const after=await thumb(bridge,59/30,ffmpeg);
      const midway=await thumb(bridge,30/30,ffmpeg);
      const leftError=rgbMeanAbsoluteDifference(prev,before);
      const rightError=rgbMeanAbsoluteDifference(next,after);
      if(leftError>9||rightError>9)
        blocked('Visible end/start frame jump at SHOT'+(i+1)+
          ' to SHOT'+(i+2)+' '+leftError+'/'+rightError);
      audit.push({
        from:EP002_V3_PROFILES[i].from,
        to:EP002_V3_PROFILES[i].to,
        style:EP002_V3_PROFILES[i].style,
        originalHardCutRgbMae:rgbMeanAbsoluteDifference(prev,next),
        transitionStartRgbMae:leftError,
        transitionEndRgbMae:rightError,
        transitionMotionRgbMae:rgbMeanAbsoluteDifference(before,midway),
        exactAddedFrames:60,sourceFramesRetimed:0,
      });
      ordered.push(bridge);
      await onProgress(Math.min(82,56+Math.floor(26*(i+1)/10)));
    }
    ordered.push(body[10]);
    const manifest=path.join(dir,'verified.ffconcat');
    await fs.writeFile(manifest,'ffconcat version 1.0\n'+
      ordered.map(joinPath).join('\n')+'\n',{flag:'wx'});
    await exec(ffmpeg,['-hide_banner','-loglevel','error','-nostdin',
      '-threads','2','-fflags','+genpts','-f','concat','-safe','0','-i',manifest,
      '-map','0:v:0','-map','0:a:0','-c:v','copy',
      '-c:a','aac','-b:a','192k','-ar','48000',
      '-af','aresample=async=1:first_pts=0',
      '-avoid_negative_ts','make_zero','-movflags','+faststart',joined]);
    const final=await probe(joined,ffprobe);
    assertMedia(final,24046,24046/30,'full continuity master');
    await fs.link(joined,output);
    await onProgress(95);
    return {status:'CREATIVE_REVIEW_REQUIRED',
      frames:24046,durationSeconds:24046/30,
      measuredContainerSeconds:final.duration,
      outputFile:output,sourceCount:11,seamCount:10,
      addedSilentFrames:600,
      continuityAudit:audit,
      sourceFramesRetimed:0,sourceFramesDropped:0};
  }finally{
    await fs.rm(dir,{recursive:true,force:true}).catch(()=>{});
  }
}
