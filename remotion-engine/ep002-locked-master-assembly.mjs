import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const HERE=path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_MANIFEST=path.resolve(HERE,
  '../docs/engineering/EP002_DIRECTOR_LOCKED_MASTER_INPUTS_20261111.json');

function fail(message) {
  throw new Error('EP002_MASTER_ASSEMBLY_BLOCKED: '+message);
}

async function run(command,args) {
  return new Promise((resolve,reject)=>{
    const child=spawn(command,args,{stdio:['ignore','pipe','pipe']});
    let stdout='',stderr='';
    child.stdout.on('data',d=>{stdout+=d.toString();});
    child.stderr.on('data',d=>{stderr+=d.toString();});
    child.on('error',reject);
    child.on('close',code=>code===0?resolve({stdout,stderr}):
      reject(new Error(command+' exited '+code+': '+stderr.slice(-1600))));
  });
}

function isUuid(v) {
  return typeof v==='string'&&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

export function verifyManifest(manifest) {
  if(manifest?.schemaVersion!=='EP002_DIRECTOR_LOCKED_MASTER_INPUTS_V1'
    ||manifest.episodeId!=='EP002'||manifest.target?.width!==1920
    ||manifest.target?.height!==1080||manifest.target?.fps!==30
    ||manifest.target?.masterStatus!=='NOT_ASSEMBLED'
    ||!Array.isArray(manifest.shots)||manifest.shots.length!==11) {
    fail('Manifest must contain exactly 11 Director-pinned Full HD SHOTs.');
  }
  if(manifest.assemblyPolicy?.requireExactPinnedRenderIds!==true
    ||manifest.assemblyPolicy?.noLatestSuccessfulFallback!==true
    ||manifest.assemblyPolicy?.doNotRenderWithoutDirectorPaidConfirmation!==true) {
    fail('Missing source provenance or Director paid-action guard.');
  }
  const ids=new Set();
  for(let i=0;i<11;i++){
    const shot=manifest.shots[i],key='SHOT'+String(i+1).padStart(2,'0');
    if(shot?.shotKey!==key||!isUuid(shot.renderId)
      ||shot.compositionId!==(i===0?'EP002-SHOT01-DRAFT': 'EP002-'+key+'-CANDIDATE')
      ||ids.has(shot.renderId)
      ||(shot.expectedFrames!==null
          &&(!Number.isInteger(shot.expectedFrames)||shot.expectedFrames<150))) {
      fail('Invalid locked input, order, duplicate ID or frame expectation at '+key);
    }
    ids.add(shot.renderId);
  }
  if(manifest.shots[0].renderId!=='8f46fafd-9613-4375-bce2-ea98854e8b20'
    ||manifest.shots[0].expectedFrames!==1172
    ||manifest.directorApproval?.originalShot01ArchivedRenderId!=='447f2846-3d1d-4d6c-924c-ea3918520625') {
    fail('Director-approved SHOT01 V2 and archived original must remain distinct.');
  }
  return manifest;
}

async function probeMp4(file,ffprobe='ffprobe') {
  const {stdout}=await run(ffprobe,['-v','error','-count_frames','-show_streams',
    '-show_format','-of','json',file]);
  let data;
  try {data=JSON.parse(stdout);}catch {fail('ffprobe did not return valid JSON.');}
  const video=data.streams?.filter(s=>s.codec_type==='video')??[];
  const audio=data.streams?.filter(s=>s.codec_type==='audio')??[];
  if(video.length!==1||audio.length!==1)
    fail('Every locked SHOT must contain exactly one video and one audio track.');
  const v=video[0],a=audio[0];
  const frames=Number(v.nb_read_frames??v.nb_frames);
  if(v.codec_name!=='h264'||a.codec_name!=='aac'||v.width!==1920||v.height!==1080
    ||v.r_frame_rate!=='30/1'||v.avg_frame_rate!=='30/1'
    ||!Number.isInteger(frames)||frames<150||!Number.isFinite(Number(data.format?.duration))) {
    fail('One SHOT is not verified 1920x1080/30fps H.264/AAC with real frames: '+path.basename(file));
  }
  const streamSignature=[
    v.codec_name,v.profile,v.level,v.pix_fmt,v.time_base,
    a.codec_name,a.profile,a.sample_rate,a.channels,a.channel_layout,a.time_base,
  ].join('|');
  return {frames,seconds:frames/30,streamSignature,
    durationSeconds:Number(data.format.duration)};
}

export async function inspectLockedMaster({manifestPath=DEFAULT_MANIFEST,inputDir,
  ffprobe='ffprobe'}={}) {
  if(typeof inputDir!=='string'||!inputDir||/[\r\n]/.test(inputDir))
    fail('A local directory containing the exact 11 approved MP4 files is required.');
  const manifest=verifyManifest(JSON.parse(await fs.readFile(manifestPath,'utf8')));
  const inputs=[];
  for(const shot of manifest.shots){
    const file=path.join(path.resolve(inputDir),shot.renderId+'.mp4');
    const stat=await fs.stat(file).catch(()=>null);
    if(!stat?.isFile()||stat.size<1024)
      fail('Approved stored MP4 is missing: '+shot.shotKey+' '+shot.renderId);
    const metadata=await probeMp4(file,ffprobe);
    if(shot.expectedFrames!==null&&metadata.frames!==shot.expectedFrames)
      fail('Locked MP4 frame count mismatch: '+shot.shotKey);
    inputs.push({...shot,file,bytes:stat.size,...metadata});
  }
  const signature=inputs[0].streamSignature;
  if(inputs.some(s=>s.streamSignature!==signature))
    fail('Incompatible stream parameters; stream-copy concat is unsafe. No silent re-encode.');
  return {
    status:'PREFLIGHT_VERIFIED',
    episodeId:'EP002',
    shotCount:11,
    frames:inputs.reduce((n,s)=>n+s.frames,0),
    seconds:inputs.reduce((n,s)=>n+s.seconds,0),
    inputRenderIds:inputs.map(s=>s.renderId),
    inputs,
  };
}

function concatEscape(file) {
  if(/[\r\n]/.test(file))fail('File path contains a line break.');
  return "file '"+file.replaceAll("'", "'\\''")+"'";
}

export async function assembleLockedMaster({manifestPath=DEFAULT_MANIFEST,inputDir,
  outputFile,confirmDirectorPaidRender=false,ffmpeg='ffmpeg',ffprobe='ffprobe'}={}) {
  if(confirmDirectorPaidRender!==true)
    fail('Explicit Director paid render confirmation is required before assembly.');
  if(typeof outputFile!=='string'||!outputFile.endsWith('.mp4')||/[\r\n]/.test(outputFile))
    fail('Specify a valid MP4 output path.');
  const preflight=await inspectLockedMaster({manifestPath,inputDir,ffprobe});
  const output=path.resolve(outputFile);
  if(preflight.inputs.some(s=>s.file===output))
    fail('Cannot overwrite a LOCKED source clip.');
  if(await fs.stat(output).then(()=>true).catch(()=>false))
    fail('The output file already exists; never overwrite a previous master.');
  await fs.mkdir(path.dirname(output),{recursive:true});
  const token=process.pid+'-'+Date.now();
  const list=path.join(path.dirname(output),'.ep002-master-'+token+'.ffconcat');
  const temp=path.join(path.dirname(output),'.ep002-master-'+token+'.mp4');
  try {
    await fs.writeFile(list,'ffconcat version 1.0\n'+
      preflight.inputs.map(s=>concatEscape(s.file)).join('\n')+'\n',
      {flag:'wx'});
    await run(ffmpeg,['-hide_banner','-loglevel','error','-f','concat','-safe','0',
      '-i',list,'-map','0:v:0','-map','0:a:0','-c','copy',
      '-movflags','+faststart','-avoid_negative_ts','make_zero',temp]);
    const master=await probeMp4(temp,ffprobe);
    if(master.frames!==preflight.frames||
      Math.abs(master.durationSeconds-preflight.seconds)>0.8)
      fail('Output video frame count or duration differs from all 11 actual inputs.');
    await fs.link(temp,output);
    return {status:'REVIEW_MASTER_ASSEMBLED_NOT_DIRECTOR_APPROVED',
      outputFile:output,frames:master.frames,seconds:master.durationSeconds,
      sourceRenderIds:preflight.inputRenderIds};
  } finally {
    await fs.unlink(list).catch(()=>{});
    await fs.unlink(temp).catch(()=>{});
  }
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const [action,inputDir,outputFile,consent]=process.argv.slice(2);
  try {
    if(action==='preflight') {
      const result=await inspectLockedMaster({inputDir});
      process.stdout.write(JSON.stringify({status:result.status,
        shotCount:result.shotCount,frames:result.frames,
        seconds:result.seconds,inputRenderIds:result.inputRenderIds},null,2)+'\n');
    }else if(action==='assemble'){
      const result=await assembleLockedMaster({inputDir,outputFile,
        confirmDirectorPaidRender:consent==='--director-confirmed-render'});
      process.stdout.write(JSON.stringify(result,null,2)+'\n');
    }else{
      fail('Use preflight <local-mp4-dir> or assemble <local-mp4-dir> <out.mp4> --director-confirmed-render.');
    }
  } catch(error){
    process.stderr.write(String(error instanceof Error?error.message:error)+'\n');
    process.exitCode=1;
  }
}
