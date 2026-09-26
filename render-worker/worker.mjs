import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import puppeteer from 'puppeteer-core';

const BACKEND_URL = (process.env.MEDIA_OS_BACKEND_URL || 'https://media-os-backend-production.up.railway.app').replace(/\/$/, '');
const WORKER_ID = process.env.RAILWAY_SERVICE_NAME || 'media-os-render-worker';
const POLL_MS = Number(process.env.MEDIA_OS_RENDER_POLL_MS || 1500);
const QUALITY = Number(process.env.MEDIA_OS_RENDER_JPEG_QUALITY || 92);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function resolveChromiumPath() {
  if (process.env.CHROMIUM_PATH?.trim()) return process.env.CHROMIUM_PATH.trim();
  for (const candidate of ['/usr/bin/chromium-browser', '/usr/bin/chromium']) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
    }
  }
  return '/usr/bin/chromium-browser';
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
  const output = path.join(workDir, 'preview.mp4');
  const args = [
    '-hide_banner', '-loglevel', 'warning', '-y',
    '-f', 'image2pipe',
    '-framerate', String(fps),
    '-vcodec', 'mjpeg',
    '-i', 'pipe:0',
    '-an',
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-crf', '18',
    '-pix_fmt', 'yuv420p',
    '-threads', '1',
    '-filter_threads', '1',
    '-movflags', '+faststart',
    output
  ];

  const child = spawn('ffmpeg', args, { stdio: ['pipe', 'ignore', 'pipe'] });
  let stderr = '';
  child.stderr.on('data', chunk => {
    stderr += chunk.toString();
    if (stderr.length > 12000) stderr = stderr.slice(-12000);
  });

  const completion = new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('close', (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`ffmpeg exited code=${code ?? 'null'} signal=${signal ?? 'none'}: ${stderr.slice(-5000)}`));
    });
  });

  try {
    for (const frame of frames) {
      if (!child.stdin.write(frame)) await once(child.stdin, 'drain');
    }
    child.stdin.end();
    await completion;
  } catch (error) {
    if (!child.killed) child.kill('SIGKILL');
    throw error;
  }

  const stat = await fs.stat(output);
  if (stat.size < 1024) throw new Error(`ffmpeg created an invalid MP4 (${stat.size} bytes).`);
  return output;
}

async function render(job, chromiumPath) {
  const width = Number(job.width || 1920);
  const height = Number(job.height || 1080);
  const fps = Number(job.fps || 30);
  const durationMs = Number(job.durationMs || 8000);
  const url = `${BACKEND_URL}${job.renderPagePath}`;
  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), `media-os-${job.renderId}-`));
  let browser;

  try {
    browser = await puppeteer.launch({
      executablePath: chromiumPath,
      headless: true,
      defaultViewport: { width, height, deviceScaleFactor: 1 },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--enable-webgl',
        '--ignore-gpu-blocklist',
        '--use-gl=swiftshader',
        '--use-angle=swiftshader',
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
    console.log(`Captured ${frames.length} source frames; encoding ${selected.length} frames for ${job.renderId}`);
    const mp4 = await encodeFrames(selected, workDir, fps);
    await upload(job.renderId, mp4);
    console.log(`Rendered ${job.shotKey} r${job.revision}: ${selected.length} frames -> ${job.renderId}`);
  } finally {
    if (browser) await browser.close().catch(() => undefined);
    await fs.rm(workDir, { recursive: true, force: true }).catch(() => undefined);
  }
}

async function main() {
  const chromiumPath = await resolveChromiumPath();
  console.log(`Media OS render worker online: ${WORKER_ID}`);
  console.log(`Backend: ${BACKEND_URL}`);
  console.log(`Chromium: ${chromiumPath}`);

  while (true) {
    let job = null;
    try {
      job = await claim();
      if (!job) {
        await sleep(POLL_MS);
        continue;
      }
      console.log(`Claimed render ${job.renderId} for ${job.shotKey} r${job.revision}`);
      await render(job, chromiumPath);
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
