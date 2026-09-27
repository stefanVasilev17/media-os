import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import puppeteer from 'puppeteer-core';

const BACKEND_URL = (process.env.MEDIA_OS_BACKEND_URL || 'https://media-os-backend-production.up.railway.app').replace(/\/$/, '');
const WORKER_ID = process.env.RAILWAY_SERVICE_NAME || 'media-os-render-worker';
const POLL_MS = Number(process.env.MEDIA_OS_RENDER_POLL_MS || 1500);
const QUALITY = Number(process.env.MEDIA_OS_RENDER_JPEG_QUALITY || 94);
const DISPLAY = process.env.DISPLAY || ':99';

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

function selectFramesByIndex(frames, count) {
  if (count === 1) return [frames[0].buffer];
  const result = [];
  const maxSourceIndex = frames.length - 1;
  const maxOutputIndex = count - 1;
  for (let index = 0; index < count; index += 1) {
    const sourceIndex = Math.min(maxSourceIndex, Math.round(index * maxSourceIndex / maxOutputIndex));
    result.push(frames[sourceIndex].buffer);
  }
  return result;
}

function selectFrames(frames, fps, durationMs) {
  if (frames.length === 0) throw new Error('Chromium produced no screencast frames.');
  const count = Math.max(1, Math.round(durationMs / 1000 * fps));
  if (frames.length === 1) return Array.from({ length: count }, () => frames[0].buffer);

  const timestamps = frames.map(frame => Number(frame.timestamp));
  const timestampsValid = timestamps.every(Number.isFinite);
  if (!timestampsValid) return selectFramesByIndex(frames, count);

  const firstTimestamp = timestamps[0];
  const lastTimestamp = timestamps[timestamps.length - 1];
  const capturedSpanSeconds = lastTimestamp - firstTimestamp;
  if (!(capturedSpanSeconds > 0.05)) return selectFramesByIndex(frames, count);

  const result = [];
  let sourceIndex = 0;
  for (let index = 0; index < count; index += 1) {
    const targetSeconds = index / fps;
    while (
      sourceIndex + 1 < frames.length &&
      timestamps[sourceIndex + 1] - firstTimestamp <= targetSeconds
    ) {
      sourceIndex += 1;
    }
    result.push(frames[sourceIndex].buffer);
  }
  return result;
}

async function encodeFrames(frames, output, fps) {
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
    if (stderr.length > 16000) stderr = stderr.slice(-16000);
  });

  const completion = new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('close', (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`ffmpeg exited code=${code ?? 'null'} signal=${signal ?? 'none'}: ${stderr.slice(-6000)}`));
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
  if (stat.size < 50000) {
    throw new Error(`Rendered MP4 appears visually empty (${stat.size} bytes).`);
  }
  return stat.size;
}

async function startCompositorPulse(page) {
  return page.evaluate(() => {
    const existing = document.querySelector('[data-media-os-render-pulse="true"]');
    if (existing) existing.remove();

    const pulse = document.createElement('div');
    pulse.setAttribute('data-media-os-render-pulse', 'true');
    pulse.style.position = 'fixed';
    pulse.style.right = '0';
    pulse.style.bottom = '0';
    pulse.style.width = '2px';
    pulse.style.height = '2px';
    pulse.style.background = '#050913';
    pulse.style.opacity = '0.01';
    pulse.style.pointerEvents = 'none';
    pulse.style.willChange = 'transform';
    pulse.style.zIndex = '2147483647';
    document.body.appendChild(pulse);

    let frames = 0;
    let running = true;
    const startedAt = performance.now();
    const tick = () => {
      if (!running) return;
      frames += 1;
      pulse.style.transform = frames % 2 === 0 ? 'translateX(0px)' : 'translateX(-1px)';
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    window.__mediaOsStopRenderPulse = () => {
      running = false;
      pulse.remove();
      return { frames, elapsedMs: performance.now() - startedAt };
    };

    return { visibility: document.visibilityState };
  });
}

async function stopCompositorPulse(page) {
  return page.evaluate(() => {
    if (typeof window.__mediaOsStopRenderPulse !== 'function') return null;
    return window.__mediaOsStopRenderPulse();
  }).catch(() => null);
}

async function captureScreencast(page, fps, durationMs, width, height) {
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
    quality: Math.max(70, Math.min(100, QUALITY)),
    maxWidth: width,
    maxHeight: height,
    everyNthFrame: 1
  });

  await sleep(durationMs + 350);
  captureStopped = true;
  await client.send('Page.stopScreencast').catch(() => undefined);
  await sleep(120);
  await client.detach().catch(() => undefined);

  const selected = selectFrames(frames, fps, durationMs);
  const totalBytes = frames.reduce((sum, frame) => sum + frame.buffer.length, 0);
  const sourceFps = frames.length / Math.max(0.001, durationMs / 1000);
  return { frames, selected, totalBytes, sourceFps };
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
      headless: false,
      dumpio: true,
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
        '--enable-gpu-rasterization',
        '--disable-gpu-sandbox',
        '--ignore-gpu-blocklist',
        '--disable-gpu-driver-bug-workarounds',
        '--use-gl=angle',
        '--use-angle=gl',
        '--use-cmd-decoder=passthrough',
        '--window-position=0,0',
        `--window-size=${width},${height}`,
        '--force-device-scale-factor=1',
        '--kiosk',
        '--hide-scrollbars',
        '--autoplay-policy=no-user-gesture-required'
      ],
      env: {
        ...process.env,
        DISPLAY,
        LIBGL_ALWAYS_SOFTWARE: '1',
        GALLIUM_DRIVER: 'llvmpipe',
        MESA_LOADER_DRIVER_OVERRIDE: 'llvmpipe'
      }
    });

    const pages = await browser.pages();
    const page = pages[0] ?? await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    await page.bringToFront();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 90_000 });

    await page.addStyleTag({ content: `
      html, body, #root { width: 100vw !important; height: 100vh !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; background: #050913 !important; }
      .shot-preview-topbar,
      .shot-preview-center-status,
      .shot-preview-error,
      .shot-preview-progress { display: none !important; }
      .shot-preview-overlay,
      .shot-preview-stage { width: 100vw !important; height: 100vh !important; inset: 0 !important; padding: 0 !important; margin: 0 !important; background: #050913 !important; }
      .shot-preview-canvas { width: 100vw !important; height: 100vh !important; max-width: none !important; max-height: none !important; }
    ` });

    const gpuInfo = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) return { available: false, renderer: 'none', vendor: 'none' };
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      return {
        available: true,
        renderer: ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : String(gl.getParameter(gl.RENDERER)),
        vendor: ext ? String(gl.getParameter(ext.UNMASKED_VENDOR_WEBGL)) : String(gl.getParameter(gl.VENDOR))
      };
    });
    console.log(`WebGL available=${gpuInfo.available} vendor=${gpuInfo.vendor} renderer=${gpuInfo.renderer}`);

    if (!gpuInfo.available) {
      throw new Error('WebGL is unavailable in the render worker.');
    }

    await page.waitForFunction(() => {
      const canvas = document.querySelector('.shot-preview-canvas');
      if (!(canvas instanceof HTMLCanvasElement)) return false;
      const style = getComputedStyle(canvas);
      return style.visibility !== 'hidden' && canvas.width > 100 && canvas.height > 100;
    }, { timeout: 90_000, polling: 16 });

    await page.bringToFront();
    await sleep(80);

    const screenshotProbe = await page.screenshot({ type: 'jpeg', quality: 90, fullPage: false });
    const screenshotBytes = Buffer.from(screenshotProbe).length;
    console.log(`Chromium screenshot probe: ${screenshotBytes} JPEG bytes`);
    if (screenshotBytes < 5000) {
      throw new Error(`Chromium screenshot probe appears empty (${screenshotBytes} bytes).`);
    }

    const pulseProbe = await startCompositorPulse(page);
    console.log(`Compositor pulse started, visibility=${pulseProbe.visibility}`);

    const capture = await captureScreencast(page, fps, durationMs, width, height);
    const pulseResult = await stopCompositorPulse(page);
    console.log(`Screencast capture: ${capture.frames.length} source frames, ${capture.selected.length} selected, ${capture.totalBytes} JPEG bytes, sourceFps=${capture.sourceFps.toFixed(2)}, pulseFrames=${pulseResult?.frames ?? 'unknown'}`);

    if (capture.frames.length < 2) {
      throw new Error(`Screencast produced only ${capture.frames.length} source frame(s) for ${durationMs}ms.`);
    }
    if (capture.totalBytes < 50000) {
      throw new Error(`Screencast appears visually empty (${capture.totalBytes} JPEG bytes across ${capture.frames.length} frames).`);
    }
    if (capture.sourceFps < 5) {
      console.warn(`Low Chromium compositor cadence (${capture.sourceFps.toFixed(2)} source fps). Rendering will continue by timing and duplicating the latest valid frame instead of failing the job.`);
    }

    const output = path.join(workDir, 'preview.mp4');
    const outputBytes = await encodeFrames(capture.selected, output, fps);
    await upload(job.renderId, output);
    console.log(`Rendered ${job.shotKey} r${job.revision}: ${outputBytes} byte MP4 -> ${job.renderId}`);
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
  console.log(`Display: ${DISPLAY}`);

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
