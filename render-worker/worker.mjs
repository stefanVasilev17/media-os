import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import puppeteer from 'puppeteer-core';

const BACKEND_URL = (process.env.MEDIA_OS_BACKEND_URL || 'https://media-os-backend-production.up.railway.app').replace(/\/$/, '');
const WORKER_ID = process.env.RAILWAY_SERVICE_NAME || 'media-os-render-worker';
const POLL_MS = Number(process.env.MEDIA_OS_RENDER_POLL_MS || 1500);

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

async function transcodeWebm(input, output, fps) {
  const args = [
    '-hide_banner', '-loglevel', 'warning', '-y',
    '-i', input,
    '-an',
    '-vf', `fps=${fps}`,
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-crf', '18',
    '-pix_fmt', 'yuv420p',
    '-threads', '1',
    '-filter_threads', '1',
    '-movflags', '+faststart',
    output
  ];

  const child = spawn('ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] });
  let stderr = '';
  child.stderr.on('data', chunk => {
    stderr += chunk.toString();
    if (stderr.length > 12000) stderr = stderr.slice(-12000);
  });

  await new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('close', (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`ffmpeg exited code=${code ?? 'null'} signal=${signal ?? 'none'}: ${stderr.slice(-5000)}`));
    });
  });

  const stat = await fs.stat(output);
  if (stat.size < 1024) throw new Error(`ffmpeg created an invalid MP4 (${stat.size} bytes).`);
}

async function recordCanvas(page, workDir, fps, durationMs) {
  const input = path.join(workDir, 'capture.webm');
  await fs.writeFile(input, Buffer.alloc(0));

  await page.exposeFunction('__mediaOsAppendVideoChunk', async base64 => {
    if (typeof base64 !== 'string' || !base64) return;
    await fs.appendFile(input, Buffer.from(base64, 'base64'));
  });

  const recording = await page.evaluate(async ({ fps, durationMs }) => {
    const source = document.querySelector('.shot-preview-canvas');
    if (!(source instanceof HTMLCanvasElement)) throw new Error('Spline preview canvas is not available.');
    if (typeof MediaRecorder !== 'function') throw new Error('MediaRecorder is not supported by Chromium.');

    const proxy = document.createElement('canvas');
    proxy.width = source.width;
    proxy.height = source.height;
    proxy.style.position = 'fixed';
    proxy.style.left = '-10000px';
    proxy.style.top = '0';
    proxy.style.width = `${source.width}px`;
    proxy.style.height = `${source.height}px`;
    proxy.style.pointerEvents = 'none';
    document.body.appendChild(proxy);

    const context = proxy.getContext('2d', { alpha: false, desynchronized: false });
    if (!context) throw new Error('2D proxy canvas is not available.');

    context.fillStyle = '#050913';
    context.fillRect(0, 0, proxy.width, proxy.height);
    context.drawImage(source, 0, 0, proxy.width, proxy.height);

    const manualStream = typeof proxy.captureStream === 'function' ? proxy.captureStream(0) : null;
    const timedStream = typeof proxy.captureStream === 'function' ? proxy.captureStream(fps) : null;
    const manualTrack = manualStream?.getVideoTracks?.()[0] || null;
    const canRequestFrame = Boolean(manualTrack && typeof manualTrack.requestFrame === 'function');
    const stream = canRequestFrame ? manualStream : timedStream;
    if (!stream) throw new Error('2D canvas captureStream is not supported by Chromium.');

    const mimeCandidates = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm'
    ];
    const mimeType = mimeCandidates.find(value => MediaRecorder.isTypeSupported(value)) || '';
    const recorder = new MediaRecorder(stream, mimeType
      ? { mimeType, videoBitsPerSecond: 12_000_000 }
      : { videoBitsPerSecond: 12_000_000 });

    const blobToBase64 = blob => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error || new Error('Could not read MediaRecorder chunk.'));
      reader.onload = () => {
        const value = String(reader.result || '');
        resolve(value.includes(',') ? value.slice(value.indexOf(',') + 1) : value);
      };
      reader.readAsDataURL(blob);
    });

    let chain = Promise.resolve();
    let chunks = 0;
    let bytes = 0;
    let copiedFrames = 0;
    let running = true;

    const pump = () => {
      if (!running) return;
      context.drawImage(source, 0, 0, proxy.width, proxy.height);
      copiedFrames += 1;
      if (canRequestFrame) manualTrack.requestFrame();
      requestAnimationFrame(pump);
    };

    const done = new Promise((resolve, reject) => {
      recorder.onerror = event => reject(event.error || new Error('MediaRecorder failed.'));
      recorder.ondataavailable = event => {
        if (!event.data || event.data.size === 0) return;
        chunks += 1;
        bytes += event.data.size;
        chain = chain
          .then(() => blobToBase64(event.data))
          .then(base64 => window.__mediaOsAppendVideoChunk(base64));
      };
      recorder.onstop = async () => {
        running = false;
        try {
          await chain;
          proxy.remove();
          stream.getTracks().forEach(track => track.stop());
          resolve({ mimeType: recorder.mimeType, chunks, bytes, copiedFrames, canRequestFrame });
        } catch (error) {
          reject(error);
        }
      };
    });

    recorder.start(500);
    requestAnimationFrame(pump);
    window.setTimeout(() => {
      if (recorder.state !== 'inactive') recorder.stop();
    }, durationMs + 220);

    return done;
  }, { fps, durationMs });

  const stat = await fs.stat(input);
  if (stat.size < 1024) throw new Error(`Proxy canvas recording is empty (${stat.size} bytes).`);
  return { input, recording, size: stat.size };
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
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=CalculateNativeWinOcclusion',
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
    await page.bringToFront();
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
      if (!(canvas instanceof HTMLCanvasElement)) return false;
      const style = getComputedStyle(canvas);
      return style.visibility !== 'hidden' && canvas.width > 100 && canvas.height > 100;
    }, { timeout: 90_000 });

    const diagnostics = await page.evaluate(async () => {
      let frames = 0;
      const startedAt = performance.now();
      await new Promise(resolve => {
        const tick = now => {
          frames += 1;
          if (now - startedAt >= 500) resolve();
          else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
      return { frames, visibility: document.visibilityState };
    });
    console.log(`Browser animation probe: ${diagnostics.frames} rAF frames / 500ms, visibility=${diagnostics.visibility}`);

    const { input, recording, size } = await recordCanvas(page, workDir, fps, durationMs);
    console.log(`Proxy canvas capture: ${recording.copiedFrames} copied frames, ${recording.chunks} chunks, browserBytes=${recording.bytes}, fileBytes=${size}, requestFrame=${recording.canRequestFrame}, mime=${recording.mimeType}`);

    const output = path.join(workDir, 'preview.mp4');
    await transcodeWebm(input, output, fps);
    await upload(job.renderId, output);
    const outputStat = await fs.stat(output);
    console.log(`Rendered ${job.shotKey} r${job.revision}: ${outputStat.size} byte MP4 -> ${job.renderId}`);
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
