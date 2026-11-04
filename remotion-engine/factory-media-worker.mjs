import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';

const MAX_SOURCE_BYTES=2*1024*1024*1024;
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;

export function validateFactoryAssembly(job) {
  if(!job || !['AT-FACTORY-MASTER','AT-FACTORY-SHORT'].includes(job.compositionId))
    throw Error('FACTORY_ASSEMBLY_COMPOSITION_NOT_ALLOWED');
  const input=job.inputProps;
  if(!input || !Array.isArray(input.sourceRenderIds)
      || input.sourceRenderIds.length<1 || input.sourceRenderIds.length>40
      || new Set(input.sourceRenderIds).size!==input.sourceRenderIds.length
      || input.sourceRenderIds.some(id=>typeof id!=='string'||!UUID.test(id)))
    throw Error('FACTORY_MP4_SOURCE_IDS_INVALID');
  if(!UUID.test(String(job.renderId||'')) || !UUID.test(String(input.runId||''))
      || !/^EP[0-9]{3,}$/.test(String(input.episodeKey||''))
      || ['EP001','EP002'].includes(input.episodeKey)
      || !/^[a-f0-9]{40}$/.test(String(input.expectedSourceCommit||''))
      || !/^[a-f0-9]{64}$/.test(String(input.sourceDigest||'')))
    throw Error('FACTORY_ASSEMBLY_SOURCE_NOT_PINNED');
  const total=Number(input.durationInFrames);
  const start=Number(input.startFrame);
  const end=Number(input.endFrame);
  if(!Number.isInteger(total)||total<=0||total>150000
      ||!Number.isInteger(start)||!Number.isInteger(end)
      ||start<0||end>total||end<=start)
    throw Error('FACTORY_ASSEMBLY_FRAME_RANGE_INVALID');
  if(job.compositionId==='AT-FACTORY-SHORT'
      && (!Number.isInteger(input.shortOrdinal)
          ||input.shortOrdinal<1||input.shortOrdinal>3
          ||end-start>45*30 ||end-start<20*30
          ||Number(job.width)!==1080 ||Number(job.height)!==1920))
    throw Error('FACTORY_SHORT_VERTICAL_CONTRACT_INVALID');
  if(job.compositionId==='AT-FACTORY-MASTER'
      && (start!==0||end!==total
          ||Number(job.width)!==1920||Number(job.height)!==1080))
    throw Error('FACTORY_MASTER_CONTRACT_INVALID');
  if(Number(job.fps)!==30||Number(job.durationInFrames)!==end-start)
    throw Error('FACTORY_ASSEMBLY_FPS_OR_DURATION_MISMATCH');
  return {input,total,start,end,ids:input.sourceRenderIds};
}

async function command(bin,args,collectStdout=false) {
  return await new Promise((resolve,reject)=>{
    const child=spawn(bin,args,{stdio:['ignore','pipe','pipe']});
    let stdout='',stderr='';
    child.stdout.on('data',chunk=>{if(collectStdout&&stdout.length<50000)stdout+=String(chunk);});
    child.stderr.on('data',chunk=>{stderr=(stderr+String(chunk)).slice(-12000);});
    child.on('error',reject);
    child.on('close',code=>code===0?resolve(stdout):
      reject(Error(bin+' failed code='+code+' '+stderr.slice(-5000))));
  });
}

export async function probeFactoryMedia(filename) {
  const raw=await command('ffprobe',['-v','error','-show_entries',
    'format=duration:stream=index,codec_type,codec_name,width,height,r_frame_rate,duration',
    '-of','json',filename],true);
  const parsed=JSON.parse(raw);
  const video=parsed.streams?.find(s=>s.codec_type==='video');
  const audio=parsed.streams?.find(s=>s.codec_type==='audio');
  if(!video ||!audio||video.codec_name!=='h264'
      ||audio.codec_name!=='aac'||video.r_frame_rate!=='30/1')
    throw Error('FACTORY_MP4_MISSING_30FPS_H264_AAC');
  const duration=Number(parsed.format?.duration);
  if(!Number.isFinite(duration)||duration<0.2)
    throw Error('FACTORY_MP4_INVALID_DURATION');
  return {duration,width:video.width,height:video.height};
}

async function downloadSource(targetId,sourceId,backendUrl,authHeaders,targetPath,request) {
  const url=`${backendUrl}/api/v1/remotion/renders/worker/${targetId}/factory-source/${sourceId}`;
  const res=await request(url,{method:'GET',headers:authHeaders()});
  if(!res.ok)throw Error('FACTORY_APPROVED_MP4_UNAVAILABLE '+res.status);
  const length=Number(res.headers.get('content-length')||0);
  if(length>MAX_SOURCE_BYTES)throw Error('FACTORY_MP4_SOURCE_EXCEEDS_WORKER_LIMIT');
  const body=Buffer.from(await res.arrayBuffer());
  if(body.length<1000||body.length>MAX_SOURCE_BYTES)
    throw Error('FACTORY_SOURCE_MP4_EMPTY_OR_OVERSIZED');
  await fs.writeFile(targetPath,body);
  return body.length;
}

export async function buildFactoryMedia(job,outputPath,tools){
  const {input,start,end,ids}=validateFactoryAssembly(job);
  const {backendUrl,authHeaders,request,onProgress}=tools;
  const temp=await fs.mkdtemp(path.join(os.tmpdir(),'mediaos-factory-'));
  let totalBytes=0;
  try {
    const clips=[];
    for(let i=0;i<ids.length;i++){
      const target=path.join(temp,`source-${String(i).padStart(3,'0')}.mp4`);
      totalBytes+=await downloadSource(job.renderId,ids[i],
        backendUrl,authHeaders,target,request);
      if(totalBytes>MAX_SOURCE_BYTES)
        throw Error('FACTORY_STAGED_SOURCE_BYTES_EXCEED_2GB');
      const info=await probeFactoryMedia(target);
      if(info.width!==1920||info.height!==1080)
        throw Error('FACTORY_SHOT_SOURCE_NOT_1920X1080');
      clips.push(target);
      await onProgress(Math.min(65,5+Math.floor((i+1)*60/ids.length)));
    }

    const manifest=path.join(temp,'list.txt');
    await fs.writeFile(manifest,clips.map(c=>`file '${c}'`).join('\n')+'\n');
    const stitched=path.join(temp,'stitched.mp4');
    await command('ffmpeg',['-hide_banner','-loglevel','error','-nostdin',
      '-f','concat','-safe','0','-i',manifest,'-map','0:v:0','-map','0:a:0',
      '-c','copy','-movflags','+faststart','-y',stitched]);
    await onProgress(75);

    const args=job.compositionId==='AT-FACTORY-SHORT'
      ?['-hide_banner','-loglevel','error','-nostdin',
          '-ss',String(start/30),'-i',stitched,'-t',String((end-start)/30),
          '-filter_complex',
          '[0:v]split=2[fg][bg];[bg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=32:1[background];[fg]scale=1080:1920:force_original_aspect_ratio=decrease[foreground];[background][foreground]overlay=(W-w)/2:(H-h)/2,format=yuv420p[v]',
          '-map','[v]','-map','0:a:0',
          '-c:v','libx264','-preset','veryfast','-crf','21','-r','30',
          '-c:a','aac','-b:a','160k','-ar','48000',
          '-pix_fmt','yuv420p','-movflags','+faststart','-y',outputPath]
      :['-hide_banner','-loglevel','error','-nostdin','-i',stitched,
          '-map','0:v:0','-map','0:a:0','-c:v','libx264','-preset','veryfast',
          '-crf','22','-r','30','-c:a','aac','-b:a','160k','-ar','48000',
          '-pix_fmt','yuv420p','-movflags','+faststart','-y',outputPath];
    await command('ffmpeg',args);
    await onProgress(95);
    const final=await probeFactoryMedia(outputPath);
    if(final.width!==Number(job.width)||final.height!==Number(job.height)
        ||Math.abs(final.duration-(end-start)/30)>0.75)
      throw Error('FACTORY_ASSEMBLED_MP4_FAILED_DIMENSION_OR_DURATION_QA');
    return {bytes:(await fs.stat(outputPath)).size,duration:final.duration};
  }finally {
    await fs.rm(temp,{recursive:true,force:true}).catch(()=>undefined);
  }
}
