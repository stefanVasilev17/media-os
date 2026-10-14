import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';

const BACKEND_URL = (process.env.MEDIA_OS_BACKEND_URL || 'https://media-os-backend-production.up.railway.app').replace(/\/$/, '');
const WORKER_KEY = String(process.env.MEDIA_OS_RENDER_WORKER_KEY || '').trim();
const WORKER_ID = String(process.env.RAILWAY_SERVICE_NAME || 'media-os-remotion-cpu-worker').trim();
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
      const target = path.join(tmpDir, `segment-${String(index).padStart(3, '0')}.mp4`);
      await downloadFile(segments[index].videoUrl, target);
      files.push(target);
      const percent = Math.max(5, Math.min(70, Math.round(((index + 1) / segments.length) * 60) + 5));
      await progress(job.renderId, percent);
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
    serveUrlPromise = bundle({
      entryPoint: ENTRY_POINT,
      rootDir: ENGINE_ROOT,
      publicDir: null,
      enableCaching: true,
      onProgress: value => {
        if (value === 100 || value % 20 < 1) console.log(`Remotion bundle progress=${Math.round(value)}%`);
      },
    }).catch(error => {
      serveUrlPromise = null;
      throw error;
    });
  }
  return serveUrlPromise;
}

async function render(job) {
  const outputPath = path.join(os.tmpdir(), `media-os-remotion-${job.renderId}.mp4`);
  const inputProps = job.inputProps && typeof job.inputProps === 'object' ? job.inputProps : {};

  console.log(
    `Rendering ${job.compositionId} renderId=${job.renderId} ${job.width}x${job.height}@${job.fps} frames=${job.durationInFrames}`,
  );

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
      concurrency: 1,
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

    heartbeatProgress = 97;
    await progress(job.renderId, 97);
    const sizeBytes = await complete(job.renderId, outputPath);
    console.log(`Completed ${job.renderId}: ${sizeBytes} bytes`);
  } finally {
    clearInterval(heartbeat);
    await fs.rm(outputPath, {force: true}).catch(() => undefined);
  }
}

async function main() {
  console.log(`MediaOS Remotion CPU worker online: ${WORKER_ID} version=${WORKER_VERSION}`);
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
