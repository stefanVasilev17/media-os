import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import puppeteer from 'puppeteer-core';

const BACKEND_URL = (process.env.MEDIA_OS_BACKEND_URL || 'https://media-os-backend-production.up.railway.app').replace(/\/$/, '');
const WORKER_ID = process.env.RAILWAY_SERVICE_NAME || 'media-os-render-worker';
const POLL_MS = Number(process.env.MEDIA_OS_RENDER_POLL_MS || 1500);
const DISPLAY = process.env.DISPLAY || ':99';
const INTERNAL_MAX_WIDTH = Number(process.env.MEDIA_OS_RENDER_INTERNAL_WIDTH || 1600);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function even(value) {
  const rounded = Math.max(2, Math.round(value));
  return rounded % 2 === 0 ? rounded : rounded - 1;
}

function internalSize(outputWidth, outputHeight) {
  const width = even(Math.min(outputWidth, INTERNAL_MAX_WIDTH));
  const height = even(width * outputHeight / outputWidth);
  return { width, height };
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

async function recordDisplay(output, fps, durationMs, captureWidth, captureHeight, outputWidth, outputHeight) {
  const durationSeconds = Math.max(0.1, durationMs / 1000);
  const input = `${DISPLAY}.0+0,0`;
  const args = [
    '-hide_banner', '-loglevel', 'warning', '-y',
    '-f', 'x11grab',
    '-draw_mouse', '0',
    '-framerate', String(fps),
    '-video_size', `${captureWidth}x${captureHeight}`,
    '-i', input,
    '-t', durationSeconds.toFixed(3),
    '-an'
  ];

  if (captureWidth !== outputWidth || captureHeight !== outputHeight) {
    args.push('-vf', `scale=${outputWidth}:${outputHeight}:flags=bicubic`);
  }

  args.push(
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-crf', '18',
    '-pix_fmt', 'yuv420p',
    '-threads', '1',
    '-filter_threads', '1',
    '-movflags', '+faststart',
    output
  );

  const child = spawn('ffmpeg', args, {
    stdio: ['ignore', 'ignore', 'pipe'],
    env: { ...process.env, DISPLAY }
  });

  let stderr = '';
  child.stderr.on('data', chunk => {
    stderr += chunk.toString();
    if (stderr.length > 16000) stderr = stderr.slice(-16000);
  });

  await new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('close', (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`x11grab ffmpeg exited code=${code ?? 'null'} signal=${signal ?? 'none'}: ${stderr.slice(-6000)}`));
    });
  });

  const stat = await fs.stat(output);
  if (stat.size < 200000) {
    throw new Error(`Rendered MP4 appears visually empty (${stat.size} bytes for ${durationMs}ms at ${outputWidth}x${outputHeight}).`);
  }
  return stat.size;
}

async function render(job, chromiumPath) {
  const width = Number(job.width || 1920);
  const height = Number(job.height || 1080);
  const fps = Number(job.fps || 30);
  const durationMs = Number(job.durationMs || 8000);
  const capture = internalSize(width, height);
  const url = `${BACKEND_URL}${job.renderPagePath}`;
  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), `media-os-${job.renderId}-`));
  let browser;

  try {
    browser = await puppeteer.launch({
      executablePath: chromiumPath,
      headless: false,
      dumpio: true,
      ignoreDefaultArgs: ['--enable-automation'],
      defaultViewport: { width: capture.width, height: capture.height, deviceScaleFactor: 1 },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=CalculateNativeWinOcclusion,Vulkan,DefaultANGLEVulkan,VulkanFromANGLE',
        '--enable-webgl',
        '--disable-gpu-compositing',
        '--disable-gpu-sandbox',
        '--ignore-gpu-blocklist',
        '--use-gl=angle',
        '--use-angle=gl',
        '--ozone-platform=x11',
        '--test-type',
        '--disable-infobars',
        '--window-position=0,0',
        `--window-size=${capture.width},${capture.height}`,
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
    let pageCrashError = '';
    page.on('error', error => {
      pageCrashError = error?.message || 'Chromium page crashed.';
      console.error(`Browser page crashed: ${pageCrashError}`);
    });
    page.on('pageerror', error => console.error(`Browser page error: ${error.message}`));
    page.on('console', message => {
      if (message.type() === 'error' || message.type() === 'warning') {
        console.error(`Browser console ${message.type()}: ${message.text()}`);
      }
    });

    await page.setViewport({ width: capture.width, height: capture.height, deviceScaleFactor: 1 });
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

    const renderState = await page.evaluate(() => ({
      state: document.documentElement.dataset.mediaOsRenderState || '',
      error: document.documentElement.dataset.mediaOsRenderError || ''
    }));
    if (renderState.state === 'error') {
      throw new Error(`Spline runtime preview failed before capture: ${renderState.error || 'unknown preview error'}`);
    }

    const screenshotProbe = await page.screenshot({ type: 'jpeg', quality: 90, fullPage: false });
    const screenshotBytes = Buffer.from(screenshotProbe).length;
    console.log(`Chromium screenshot probe: ${screenshotBytes} JPEG bytes; renderState=${renderState.state || 'unknown'}`);
    if (screenshotBytes < 20000) {
      throw new Error(`Chromium compositor is still visually empty (${screenshotBytes} JPEG bytes).`);
    }

    if (pageCrashError || page.isClosed()) {
      throw new Error(pageCrashError || 'Chromium page closed before capture.');
    }

    const output = path.join(workDir, 'preview.mp4');
    console.log(`Recording Xvfb ${capture.width}x${capture.height} -> ${width}x${height} at ${fps}fps for ${durationMs}ms`);
    const outputBytes = await recordDisplay(output, fps, durationMs, capture.width, capture.height, width, height);

    if (pageCrashError || page.isClosed()) {
      throw new Error(pageCrashError || 'Chromium page closed during capture.');
    }

    const finalState = await page.evaluate(() => ({
      state: document.documentElement.dataset.mediaOsRenderState || '',
      error: document.documentElement.dataset.mediaOsRenderError || ''
    })).catch(error => {
      throw new Error(`Could not validate Chromium after capture: ${error.message}`);
    });
    if (finalState.state === 'error') {
      throw new Error(`Spline runtime preview failed during capture: ${finalState.error || 'unknown preview error'}`);
    }

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
  console.log(`Internal render width: ${INTERNAL_MAX_WIDTH}`);

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
