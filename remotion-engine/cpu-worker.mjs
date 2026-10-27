import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';

const BACKEND_URL = (process.env.MEDIA_OS_BACKEND_URL || 'https://media-os-backend-production.up.railway.app').replace(/\/$/, '');
const WORKER_KEY = String(process.env.MEDIA_OS_RENDER_WORKER_KEY || '').trim();
const WORKER_SERVICE_NAME = String(process.env.RAILWAY_SERVICE_NAME || 'media-os-remotion-cpu-worker').trim();
const WORKER_REPLICA_ID = String(process.env.RAILWAY_REPLICA_ID || os.hostname()).trim();
const WORKER_ID = `${WORKER_SERVICE_NAME}:${WORKER_REPLICA_ID}`.slice(0, 160);
const configuredConcurrency = Number(process.env.MEDIA_OS_REMOTION_RENDER_CONCURRENCY || 2);
if (!Number.isInteger(configuredConcurrency) || configuredConcurrency < 1 || configuredConcurrency > 4) {
  throw new Error('MEDIA_OS_REMOTION_RENDER_CONCURRENCY must be an integer from 1 to 4.');
}
const RENDER_CONCURRENCY = configuredConcurrency;
const POLL_MS = Math.max(500, Number(process.env.MEDIA_OS_RENDER_POLL_MS || 1500));
const CHROMIUM_PATH = process.env.CHROMIUM_PATH || '/usr/bin/chromium';
const WORKER_VERSION = 'REMOTION_CPU_WORKER_V1_5';
const ENGINE_ROOT = '/app/remotion-engine';
const ENTRY_POINT = path.join(ENGINE_ROOT, 'src/index.ts');

if (!WORKER_KEY) {
  throw new Error('MEDIA_OS_RENDER_WORKER_KEY is required.');
}

let serveUrlPromise = null;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function headers(extra = {}) {
  return {
    'X-Media-OS-Worker-Key': WORKER_KEY,
    'X-Media-OS-Worker': WORKER_ID,
    ...extra,
  };
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  if (response.status === 204) return null;
  const text = await response.text();
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${text.slice(0, 1600)}`);
  return text ? JSON.parse(text) : null;
}

async function claim() {
  return requestJson(`${BACKEND_URL}/api/v1/remotion/renders/worker/claim`, {
    method: 'POST',
    headers: headers(),
  });
}

async function progress(renderId, value) {
  try {
    await requestJson(`${BACKEND_URL}/api/v1/remotion/renders/worker/${renderId}/progress`, {
      method: 'POST',
      headers: headers({'Content-Type': 'application/json'}),
      body: JSON.stringify({progress: value}),
    });
  } catch (error) {
    console.warn(`Could not report progress for ${renderId}: ${error.message}`);
  }
}

async function fail(renderId, error) {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  try {
    await requestJson(`${BACKEND_URL}/api/v1/remotion/renders/worker/${renderId}/fail`, {
      method: 'POST',
      headers: headers({'Content-Type': 'application/json'}),
      body: JSON.stringify({error: message.slice(0, 1800)}),
    });
  } catch (cause) {
    console.error(`Could not report failure for ${renderId}:`, cause);
  }
}

async function complete(renderId, outputPath) {
  const bytes = await fs.readFile(outputPath);
  const response = await fetch(`${BACKEND_URL}/api/v1/remotion/renders/worker/${renderId}/complete`, {
    method: 'PUT',
    headers: headers({
      'Content-Type': 'video/mp4',
      'Content-Length': String(bytes.length),
    }),
    body: bytes,
  });
  if (!response.ok) {
    const detail = await response.text();
    if (response.status === 507) {
      throw new Error('STORAGE_GUARD: database has insufficient write headroom to save the MP4. The render finished but upload was blocked safely. Free storage or restore capacity, then retry. ' + detail.slice(0, 400));
    }
    throw new Error(`MP4 upload failed: ${response.status} ${detail.slice(0, 1600)}`);
  }
  return bytes.length;
}

async function runProcess(command, args) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {stdio: ['ignore', 'ignore', 'pipe']});
    let stderr = '';
    child.stderr.on('data', chunk => {
      stderr += String(chunk);
      if (stderr.length > 12000) stderr = stderr.slice(-12000);
    });
    child.on('error', reject);
    child.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code ${code}: ${stderr.slice(-6000)}`));
    });
  });
}

async function downloadFile(url, destination) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not download preview segment: ${response.status} ${response.statusText}`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(destination, bytes);
  return bytes.length;
}

async function renderCumulativePreview(job, outputPath, inputProps) {
  const segments = Array.isArray(inputProps.segments)
    ? inputProps.segments.filter(segment => segment && typeof segment.videoUrl === 'string' && segment.videoUrl.trim())
    : [];
  if (segments.length === 0) throw new Error('Cumulative preview requires at least one rendered shot segment.');

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), `media-os-preview-${job.renderId}-`));
  try {
    const files = [];
    for (let index = 0; index < segments.length; index++) {
      const segment = segments[index];
      const target = path.join(tmpDir, `segment-${String(index).padStart(3, '0')}.mp4`);
      await downloadFile(segments[index].videoUrl, target);
      if (segment.normalizeVideoTo === '1920x1080') {
        const normalized = path.join(tmpDir, `normalized-${String(index).padStart(3, '0')}.mp4`);
        console.log(`Normalizing cumulative preview segment ${index + 1}/${segments.length} to 1920x1080 (original source preserved)`);
        await runProcess('ffmpeg', [
          '-hide_banner', '-loglevel', 'error', '-i', target,
          '-map', '0:v:0', '-map', '0:a:0?', '-vf', 'scale=1920:1080:flags=lanczos,format=yuv420p',
          '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-r', '30',
          '-c:a', 'copy', '-movflags', '+faststart', '-y', normalized,
        ]);
        files.push(normalized);
      } else {
        files.push(target);
      }
      if (segment.shotKey === 'SHOT04_FINAL_POLISH' && segment.holdAfterFrames === 60) {
        const still = path.join(tmpDir, 'shot04-final-hold-last-frame.png');
        const hold = path.join(tmpDir, 'shot04-final-hold-2seconds.mp4');
        const source = files[files.length - 1];
        console.log('Adding Director-requested exact 2-second silent visual hold before API Gateway');
        await runProcess('ffmpeg', ['-hide_banner','-loglevel','error',
          '-sseof','-0.033333333','-i',source,'-frames:v','1','-y',still]);
        await runProcess('ffmpeg', ['-hide_banner','-loglevel','error',
          '-loop','1','-framerate','30','-i',still,
          '-f','lavfi','-i','anullsrc=channel_layout=stereo:sample_rate=48000',
          '-frames:v','60','-r','30','-c:v','libx264','-preset','veryfast','-crf','18',
          '-pix_fmt','yuv420p','-c:a','aac','-b:a','160k',
          '-shortest','-movflags','+faststart','-y',hold]);
        files.push(hold);
      }
      const percent = Math.max(5, Math.min(70, Math.round(((index + 1) / segments.length) * 60) + 5));
      await progress(job.renderId, percent);
    }

    if (inputProps.retimeVideoTo30fps === true) {
      if (segments.length !== 1 || files.length !== 1 || job.fps !== 30
          || job.width !== 1920 || job.height !== 1080
          || segments[0].normalizeVideoTo) {
        throw new Error('Safe episode retime accepts one existing 1920x1080 composite at 30fps, with no scene changes.');
      }
      console.log('Repairing approved episode MP4 timestamps: decode every original frame, reset video PTS to frame_index/30, copy original audio without voice regeneration');
      await progress(job.renderId, 75);
      await runProcess('ffmpeg', [
        '-hide_banner', '-loglevel', 'error', '-i', files[0],
        '-map', '0:v:0', '-map', '0:a:0?',
        '-vf', 'setpts=N/(30*TB)', '-fps_mode:v', 'cfr',
        '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18',
        '-pix_fmt', 'yuv420p', '-r', '30',
        ...(inputProps.strictFrameCap === true ? ['-frames:v', String(job.durationInFrames)] : []),
        '-c:a', 'copy', '-movflags', '+faststart', '-y', outputPath,
      ]);
      await progress(job.renderId, 95);
      return;
    }

    const concatFile = path.join(tmpDir, 'concat.txt');
    const manifest = files.map(file => `file '${file.replaceAll("'", "'\\''")}'`).join('\n') + '\n';
    await fs.writeFile(concatFile, manifest, 'utf8');
    await progress(job.renderId, 75);

    await runProcess('ffmpeg', [
      '-hide_banner',
      '-loglevel', 'error',
      '-f', 'concat',
      '-safe', '0',
      '-i', concatFile,
      '-c', 'copy',
      '-movflags', '+faststart',
      '-y',
      outputPath,
    ]);

    await progress(job.renderId, 95);
  } finally {
    await fs.rm(tmpDir, {recursive: true, force: true}).catch(() => undefined);
  }
}

function getServeUrl() {
  if (!serveUrlPromise) {
    serveUrlPromise = (async () => {
      const prebuiltPath = path.join(ENGINE_ROOT, 'build');
      try {
        await fs.access(path.join(prebuiltPath, 'index.html'));
        console.log('Using prebuilt Remotion bundle from image: ' + prebuiltPath);
        return prebuiltPath;
      } catch {
        console.log('Prebuilt Remotion bundle unavailable; bundling source.');
        return bundle({
          entryPoint: ENTRY_POINT,
          rootDir: ENGINE_ROOT,
          publicDir: null,
          enableCaching: true,
          onProgress: value => {
            if (value === 100 || value % 20 < 1) console.log(`Remotion bundle progress=${Math.round(value)}%`);
          },
        });
      }
    })().catch(error => {
      serveUrlPromise = null;
      throw error;
    });
  }
  return serveUrlPromise;
}

async function addShot10V6SoundDesign(job, outputPath, inputProps) {
  if (job.compositionId !== 'EP001-Shot10-SessionCreationShortV6'
    || inputProps.soundDesign !== 'SHOT10_V6_PREMIUM_SFX'
    || Number(job.durationInFrames) !== 2160
    || Number(job.fps) !== 30) {
    throw new Error('Only the standalone 72-second SHOT10 V6 may receive this soundtrack.');
  }
  if (Array.isArray(inputProps.audioClips) && inputProps.audioClips.length) {
    throw new Error('SHOT10 V6 sound pass is SFX-only; approved narration clips may not be replaced.');
  }
  const cues = [
    {s:1.6,f:240,d:.56,g:.32},
    {s:8.45,f:190,d:.75,g:.52},
    {s:10.1,f:760,d:.2,g:.67},
    {s:13.0,f:900,d:.18,g:.63},
    {s:17.2,f:1140,d:.27,g:.72},
    {s:20.8,f:470,d:.45,g:.36},
    {s:26.5,f:190,d:.9,g:.56},
    {s:29.2,f:735,d:.23,g:.72},
    {s:33.1,f:880,d:.23,g:.7},
    {s:37.8,f:1090,d:.25,g:.72},
    {s:42.0,f:520,d:.56,g:.48},
    {s:47.2,f:250,d:.72,g:.48},
    {s:51.5,f:820,d:.22,g:.65},
    {s:54.7,f:980,d:.22,g:.71},
    {s:57.7,f:1250,d:.4,g:.75},
    {s:61.4,f:230,d:.74,g:.52},
    {s:64.4,f:580,d:.3,g:.65},
    {s:68.9,f:980,d:.44,g:.76},
    {s:71.2,f:540,d:.46,g:.37},
  ];
  const newAudioFile = outputPath.replace(/\.mp4$/, '-audio.mp4');
  const args = ['-hide_banner','-loglevel','error','-i',outputPath,
    '-f','lavfi','-i','anoisesrc=color=pink:amplitude=0.08:sample_rate=24000:duration=72'];
  for (const cue of cues) {
    args.push('-f','lavfi','-i','sine=frequency='+cue.f+':sample_rate=24000:duration='+cue.d);
  }
  const chain = [
    '[1:a]lowpass=f=480,volume=0.095,afade=t=in:st=0:d=2,afade=t=out:st=70:d=2[bed]',
  ];
  cues.forEach((cue, i) => {
    const fadeOutStart = Math.max(.05, cue.d-.16);
    const fadeDuration = Math.min(.14, cue.d-.05);
    chain.push('['+(i+2)+':a]volume='+cue.g+',afade=t=in:st=0:d=0.025,afade=t=out:st='+fadeOutStart+':d='+fadeDuration+',adelay='+Math.round(cue.s*1000)+':all=1[c'+i+']');
  });
  const labels = ['[bed]', ...cues.map((_, i) => '[c'+i+']')].join('');
  chain.push(labels+'amix=inputs='+(cues.length+1)+':duration=first:normalize=0,alimiter=limit=0.88:level=false[sound]');
  args.push('-filter_complex',chain.join(';'),'-map','0:v:0','-map','[sound]',
    '-c:v','copy','-c:a','aac','-b:a','144k','-ar','48000',
    '-t','72','-movflags','+faststart','-y',newAudioFile);
  try {
    console.log('Mixing SHOT10 V6 original cinematic sound design with '+cues.length+' cues.');
    await runProcess('ffmpeg',args);
    const stat = await fs.stat(newAudioFile);
    if (stat.size <= 1000000) throw new Error('Sound design output unexpectedly small');
    await fs.rename(newAudioFile,outputPath);
    console.log('SHOT10 V6 soundtrack mux complete: '+stat.size+' bytes');
  } finally {
    await fs.rm(newAudioFile,{force:true}).catch(()=>undefined);
  }
}

async function render(job) {
  const outputPath = path.join(os.tmpdir(), `media-os-remotion-${job.renderId}.mp4`);
  const inputProps = job.inputProps && typeof job.inputProps === 'object' ? job.inputProps : {};

  console.log(
    `Rendering ${job.compositionId} renderId=${job.renderId} ${job.width}x${job.height}@${job.fps} frames=${job.durationInFrames}`,
  );

  const renderStartedAt = Date.now();
  let heartbeatProgress = 5;
  const heartbeat = setInterval(() => {
    void progress(job.renderId, heartbeatProgress);
  }, 15_000);

  try {
    if (job.compositionId === 'EP001-Voice-CurrentPreview') {
      console.log(`Concatenating cumulative preview from ${Array.isArray(inputProps.segments) ? inputProps.segments.length : 0} rendered shot segment(s)`);
      await renderCumulativePreview(job, outputPath, inputProps);
      heartbeatProgress = 97;
      await progress(job.renderId, 97);
      const sizeBytes = await complete(job.renderId, outputPath);
      console.log(`Completed cumulative preview ${job.renderId}: ${sizeBytes} bytes`);
      return;
    }

    const serveUrl = await getServeUrl();
    const composition = await selectComposition({
      serveUrl,
      id: job.compositionId,
      inputProps,
      browserExecutable: CHROMIUM_PATH,
      timeoutInMilliseconds: 120_000,
      logLevel: 'warn',
    });

    if (composition.fps !== Number(job.fps)) {
      throw new Error(`Composition fps mismatch expected=${job.fps} actual=${composition.fps}`);
    }
    if (composition.durationInFrames !== Number(job.durationInFrames)) {
      throw new Error(
        `Composition duration mismatch expected=${job.durationInFrames} actual=${composition.durationInFrames}`,
      );
    }

    const widthScale = Number(job.width) / composition.width;
    const heightScale = Number(job.height) / composition.height;
    if (Math.abs(widthScale - heightScale) > 0.0001) {
      throw new Error(`Output aspect ratio mismatch target=${job.width}x${job.height} composition=${composition.width}x${composition.height}`);
    }

    let lastBucket = -1;
    await renderMedia({
      composition,
      serveUrl,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps,
      browserExecutable: CHROMIUM_PATH,
      scale: widthScale,
      imageFormat: 'jpeg',
      jpegQuality: 90,
      crf: 18,
      x264Preset: 'veryfast',
      hardwareAcceleration: 'disable',
      overwrite: true,
      concurrency: RENDER_CONCURRENCY,
      disallowParallelEncoding: true,
      ffmpegOverride: ({args}) => {
        if (args.length === 0) return args;
        const output = args[args.length - 1];
        return [...args.slice(0, -1), '-threads', '2', output];
      },
      timeoutInMilliseconds: 120_000,
      logLevel: 'warn',
      onProgress: ({progress: ratio}) => {
        const percent = Math.max(5, Math.min(99, Math.round(ratio * 100)));
        heartbeatProgress = percent;
        const bucket = Math.floor(percent / 10);
        if (bucket !== lastBucket) {
          lastBucket = bucket;
          void progress(job.renderId, percent);
          console.log(`Render ${job.renderId} progress=${percent}%`);
        }
      },
    });

    if (job.compositionId === 'EP001-Shot10-SessionCreationShortV6') {
      await addShot10V6SoundDesign(job, outputPath, inputProps);
    }
    heartbeatProgress = 97;
    await progress(job.renderId, 97);
    const sizeBytes = await complete(job.renderId, outputPath);
    console.log(`Completed ${job.renderId}: ${sizeBytes} bytes`);
  } finally {
    clearInterval(heartbeat);
    console.log(`REMOTION_RENDER_ELAPSED_SECONDS renderId=${job.renderId} elapsed=${((Date.now() - renderStartedAt) / 1000).toFixed(2)} concurrency=${RENDER_CONCURRENCY}`);
    await fs.rm(outputPath, {force: true}).catch(() => undefined);
  }
}

async function main() {
  console.log(`MediaOS Remotion CPU worker online: ${WORKER_ID} version=${WORKER_VERSION} renderConcurrency=${RENDER_CONCURRENCY}`);
  console.log(`Backend: ${BACKEND_URL}`);
  console.log(`Chromium: ${CHROMIUM_PATH}`);

  while (true) {
    let job = null;
    try {
      job = await claim();
      if (!job) {
        await sleep(POLL_MS);
        continue;
      }
      console.log(`Claimed Remotion render ${job.renderId}`);
      await render(job);
    } catch (error) {
      console.error('Remotion CPU worker error:', error);
      if (job?.renderId) await fail(job.renderId, error);
      await sleep(Math.max(POLL_MS, 2500));
    }
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
