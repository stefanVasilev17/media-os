import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {selectComposition, renderMedia} from '@remotion/renderer';

const output = '/tmp/qa-episode-shot-smoke.mp4';
const frames = 150;
const fps = 30;
const inputProps = {
  episodeId: 'qa-synthetic-isolated-no-episode-write',
  shotKey: 'SHOT 01',
  shotTitle: 'QA only — synthetic request lifecycle',
  shotRevision: 1,
  scriptRevision: 1,
  visualDirection: 'A synthetic request enters a service and receives a response. Technical renderer smoke only.',
  durationInFrames: frames,
  qaOnly: true,
};
const serveUrl = '/app/remotion-engine/build';
const browserExecutable = '/app/chromium-software-webgl.sh';
try {
  await fs.access(serveUrl + '/index.html');
  const composition = await selectComposition({
    serveUrl,
    id: 'AT-EpisodeShot-QA',
    inputProps,
    browserExecutable,
    timeoutInMilliseconds: 120000,
    logLevel: 'error',
  });
  if (composition.fps !== fps || composition.durationInFrames !== frames
      || composition.width !== 1920 || composition.height !== 1080) {
    throw new Error('Composition metadata mismatch.');
  }
  console.log('QA_RENDER_SMOKE_COMPOSITION=PASS');
  await renderMedia({
    composition,
    serveUrl,
    inputProps,
    codec: 'h264',
    outputLocation: output,
    browserExecutable,
    scale: 2 / 3,
    imageFormat: 'jpeg',
    jpegQuality: 85,
    crf: 25,
    x264Preset: 'veryfast',
    hardwareAcceleration: 'disable',
    concurrency: 1,
    disallowParallelEncoding: true,
    overwrite: true,
    timeoutInMilliseconds: 120000,
    logLevel: 'error',
  });
  const stat = await fs.stat(output);
  if (stat.size < 9000) throw new Error('Rendered MP4 is unexpectedly small.');
  const raw = execFileSync('ffprobe',[
    '-v','error','-count_frames','-select_streams','v:0',
    '-show_entries','stream=codec_name,width,height,r_frame_rate,nb_read_frames:format=duration',
    '-of','json',output,
  ],{encoding:'utf8'});
  const media=JSON.parse(raw),stream=media.streams?.[0];
  if(stream?.codec_name!=='h264'||stream?.width!==1280||stream?.height!==720||
     stream?.r_frame_rate!=='30/1'||Number(stream?.nb_read_frames)!==frames||
     Math.abs(Number(media.format?.duration)-5)>0.10){
    throw new Error('MP4 validation failed: '+JSON.stringify(media));
  }
  console.log('QA_RENDER_SMOKE_MP4=PASS');
  console.log('QA_RENDER_SMOKE_CODEC=h264');
  console.log('QA_RENDER_SMOKE_RESOLUTION=1280x720');
  console.log('QA_RENDER_SMOKE_FRAMES=150');
  console.log('QA_RENDER_SMOKE_FPS=30');
  console.log('QA_RENDER_SMOKE_DURATION_SECONDS='+Number(media.format.duration));
  console.log('QA_RENDER_SMOKE_VIDEO_BYTES='+stat.size);
  console.log('QA_RENDER_SMOKE_COMPLETE=PASS');
} catch(error){
  console.error('QA_RENDER_SMOKE_COMPLETE=FAIL');
  console.error('QA_RENDER_SMOKE_ERROR='+String(error).slice(0,400));
  process.exitCode=1;
} finally {
  await fs.rm(output,{force:true}).catch(()=>{});
}
