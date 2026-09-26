import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import puppeteer from 'puppeteer-core';

const BACKEND_URL = (process.env.MEDIA_OS_BACKEND_URL || 'https://media-os-backend-production.up.railway.app').replace(/\/$/, '');
const WORKER_ID = process.env.RAILWAY_SERVICE_NAME || 'media-os-render-worker';
const CHROMIUM_PATH = process.env.CHROMIUM_PATH || [
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
  '/usr/bin/google-chrome'
].find(existsSync) || '/usr/bin/chromium';
const POLL_MS = Number(process.env.MEDIA_OS_RENDER_POLL_MS || 1500);
const QUALITY = Number(process.env.MEDIA_OS_RENDER_JPEG_QUALITY || 92);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  if (response.status === 204) return null;
  const text = await response.text();
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${text.slice(0, 1200)}`);
  return text ? JSON.parse(text) : null;
}

async function claim() {
  return requestJson(`${BACKEND_URL}/api/v1/spline/renders/worker/claim`, {
    method: 'POST',
    headers: { 'X-Media-OS-Worker': WORKER_ID }
  });
}

async function fail(renderId, error) {
  const message = error instanceof Error ? error.message : String(error);
  try {
    await requestJson(`${BACKEND_URL}/api/v1/spline/renders/worker/${renderId}/fail`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Media-OS-Worker': WORKER_ID
      },
      body: JSON.stringify({ error: message.slice(0, 1800) })
    });
  } catch (cause) {
    console.error('Could not report render failure:', cause);
  }
}

async function upload(renderId, filePath) {
  const bytes = await fs.readFile(filePath);
  const response = await fetch(`${BACKEND_URL}/api/v1/spline/renders/worker/${renderId}/complete`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Length': String(bytes.length),
      'X-Media-OS-Worker': WORKER_ID
    },
    body: bytes
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`MP4 upload failed: ${response.status} ${detail.slice(0, 1200)}`);
  }
}

function runProcess(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'], ...options });
    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', chunk => { stdout += chunk.toString(); });
    child.stderr?.on('data', chunk => { stderr += chunk.toString(); });
    child.on('error', reject);
    child.on('close', code => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`${command} exited ${code}: ${stderr.slice(-3000)}`));
    });
  });
}

function selectFrames(frames, fps, durationMs) {
  if (frames.length === 0) throw new Error('Chromium produced no video frames.');
  const count = Math.max(1, Math.round(durationMs / 1000 * fps));
  const firstTimestamp = Number.isFinite(frames[0].timestamp) ? frames[0].timestamp : 0;
  let cursor = 0;
  const result = [];

  for (let index = 0; index < count; index += 1) {
    const target = firstTimestamp + index / fps;
    while (
      cursor + 1 < frames.length &&
      Number.isFinite(frames[cursor + 1].timestamp) &&
      frames[cursor + 1].timestamp <= target
    ) {
      cursor += 1;
    }
    result.push(frames[cursor].buffer);
  }
  return result;
}

async function encodeFrames(frames, workDir, fps) {
  const frameDir = path.join(workDir, 'frames');
  await fs.mkdir(frameDir, { recursive: true });

  const writes = frames.map((buffer, index) => {
    const file = path.join(frameDir, `frame-${String(index + 1).padStart(6, '0')}.jpg`);
    return fs.writeFile(file, buffer);
  });
  await Promise.all(writes);

  const output = path.join(workDir, 'preview.mp4');
  await runProcess('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-framerate', String(fps),
    '-i', path.join(frameDir, 'frame-%06d.jpg'),
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-crf', '18',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    '-an',
    output
  ]);
  return output;
}

async function render(job) {
  const width = Number(job.width || 1920);
  const height = Number(job.height || 1080);
  const fps = Number(job.fps || 30);
  const durationMs = Number(job.durationMs || 8000);
  const url = `${BACKEND_URL}${job.renderPagePath}`;
  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), `media-os-${job.renderId}-`));
  let browser;

  try {
    browser = await puppeteer.launch({
      executablePath: CHROMIUM_PATH,
      headless: true,
      defaultViewport: { width, height, deviceScaleFactor: 1 },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--enable-webgl',
        '--enable-unsafe-swiftshader',
        '--ignore-gpu-blocklist',
        '--use-gl=swiftshader',
        '--window-size=' + width + ',' + height,
        '--autoplay-policy=no-user-gesture-required'
      ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 90_000 });

    await page.addStyleTag({ content: `
      .shot-preview-topbar,
      .shot-preview-center-status,
      .shot-preview-error,
      .shot-preview-progress { display: none !important; }
      .shot-preview-overlay,
      .shot-preview-stage { width: 100vw !important; height: 100vh !important; inset: 0 !important; padding: 0 !important; margin: 0 !important; background: #050913 !important; }
      .shot-preview-canvas { width: 100vw !important; height: 100vh !important; max-width: none !important; max-height: none !important; }
    ` });

    await page.waitForFunction(() => {
      const canvas = document.querySelector('.shot-preview-canvas');
      if (!canvas) return false;
      const style = getComputedStyle(canvas);
      return style.visibility !== 'hidden' && canvas.width > 100 && canvas.height > 100;
    }, { timeout: 90_000 });

    const client = await page.target().createCDPSession();
    const frames = [];
    let captureStopped = false;
    client.on('Page.screencastFrame', async event => {
      if (captureStopped) return;
      frames.push({
        timestamp: Number(event.metadata?.timestamp),
        buffer: Buffer.from(event.data, 'base64')
      });
      try {
        await client.send('Page.screencastFrameAck', { sessionId: event.sessionId });
      } catch {
      }
    });

    await client.send('Page.startScreencast', {
      format: 'jpeg',
      quality: Math.max(60, Math.min(100, QUALITY)),
      maxWidth: width,
      maxHeight: height,
      everyNthFrame: 1
    });

    await sleep(durationMs + 450);
    captureStopped = true;
    await client.send('Page.stopScreencast').catch(() => undefined);
    await sleep(150);

    const selected = selectFrames(frames, fps, durationMs);
    const mp4 = await encodeFrames(selected, workDir, fps);
    await upload(job.renderId, mp4);
    console.log(`Rendered ${job.shotKey} r${job.revision}: ${selected.length} frames -> ${job.renderId}`);
  } finally {
    if (browser) await browser.close().catch(() => undefined);
    await fs.rm(workDir, { recursive: true, force: true }).catch(() => undefined);
  }
}

async function main() {
  console.log(`Media OS render worker online: ${WORKER_ID}`);
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
      console.log(`Claimed render ${job.renderId} for ${job.shotKey} r${job.revision}`);
      await render(job);
    } catch (error) {
      console.error('Render worker error:', error);
      if (job?.renderId) await fail(job.renderId, error);
      await sleep(Math.max(POLL_MS, 2500));
    }
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
