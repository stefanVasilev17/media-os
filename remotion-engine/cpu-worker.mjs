import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';

const BACKEND_URL = (process.env.MEDIA_OS_BACKEND_URL || 'https://media-os-backend-production.up.railway.app').replace(/\/$/, '');
const WORKER_KEY = String(process.env.MEDIA_OS_RENDER_WORKER_KEY || '').trim();
const WORKER_ID = String(process.env.RAILWAY_SERVICE_NAME || 'media-os-remotion-cpu-worker').trim();
const POLL_MS = Math.max(500, Number(process.env.MEDIA_OS_RENDER_POLL_MS || 1500));
const CHROMIUM_PATH = process.env.CHROMIUM_PATH || '/usr/bin/chromium';
const WORKER_VERSION = 'REMOTION_CPU_WORKER_V1';
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
    throw new Error(`MP4 upload failed: ${response.status} ${detail.slice(0, 1600)}`);
  }
  return bytes.length;
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
  const serveUrl = await getServeUrl();

  console.log(
    `Rendering ${job.compositionId} renderId=${job.renderId} ${job.width}x${job.height}@${job.fps} frames=${job.durationInFrames}`,
  );

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
  try {
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
      timeoutInMilliseconds: 120_000,
      logLevel: 'warn',
      onProgress: ({progress: ratio}) => {
        const percent = Math.max(5, Math.min(99, Math.round(ratio * 100)));
        const bucket = Math.floor(percent / 10);
        if (bucket !== lastBucket) {
          lastBucket = bucket;
          void progress(job.renderId, percent);
          console.log(`Render ${job.renderId} progress=${percent}%`);
        }
      },
    });

    const sizeBytes = await complete(job.renderId, outputPath);
    console.log(`Completed ${job.renderId}: ${sizeBytes} bytes`);
  } finally {
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
