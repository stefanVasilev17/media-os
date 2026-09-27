import fs from 'node:fs/promises';
import { spawn, spawnSync } from 'node:child_process';
import puppeteer from 'puppeteer-core';

const DISPLAY = process.env.DISPLAY || ':99';
const CHROMIUM_PATH = process.env.CHROMIUM_PATH || '/usr/bin/chromium';

function parseInput() {
  const raw = process.argv[2] || '';
  if (!raw) throw new Error('Missing GPU render work payload.');
  const work = JSON.parse(raw);
  const backendUrl = String(work.backendUrl || '').replace(/\/$/, '');
  const renderPagePath = String(work.renderPagePath || '');
  const outputPath = String(work.outputPath || '');
  const width = Number(work.width || 1920);
  const height = Number(work.height || 1080);
  const fps = Number(work.fps || 60);
  const durationMs = Number(work.durationMs || 8000);
  if (!backendUrl || !renderPagePath || !outputPath) throw new Error('GPU render work payload is incomplete.');
  return { backendUrl, renderPagePath, outputPath, width, height, fps, durationMs };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function runProcess(command, args, label) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, DISPLAY }
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', chunk => { stdout += chunk.toString(); });
    child.stderr.on('data', chunk => {
      stderr += chunk.toString();
      if (stderr.length > 30000) stderr = stderr.slice(-30000);
    });
    child.on('error', reject);
    child.on('close', (code, signal) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      reject(new Error(`${label} exited code=${code ?? 'null'} signal=${signal ?? 'none'}: ${stderr.slice(-8000)}`));
    });
  });
}

function hasNvenc() {
  const result = spawnSync('ffmpeg', ['-hide_banner', '-encoders'], { encoding: 'utf8' });
  return result.status === 0 && `${result.stdout}\n${result.stderr}`.includes('h264_nvenc');
}

function chromiumEnvironment() {
  const env = {
    ...process.env,
    DISPLAY,
    HOME: process.env.HOME || '/tmp/chromium-home',
    XDG_RUNTIME_DIR: '/tmp/chromium-runtime',
    NO_AT_BRIDGE: '1',
    NVIDIA_VISIBLE_DEVICES: process.env.NVIDIA_VISIBLE_DEVICES || 'all',
    NVIDIA_DRIVER_CAPABILITIES: process.env.NVIDIA_DRIVER_CAPABILITIES || 'all'
  };
  delete env.DBUS_SESSION_BUS_ADDRESS;
  delete env.DBUS_SYSTEM_BUS_ADDRESS;
  return env;
}

async function launchHardwareBrowser(width, height) {
  await fs.mkdir('/tmp/chromium-home', { recursive: true });
  await fs.mkdir('/tmp/chromium-runtime', { recursive: true, mode: 0o700 });

  const launchAttempts = [
    { label: 'chromium-default-gl', gpuFlags: [] },
    { label: 'angle-default', gpuFlags: ['--use-gl=angle', '--use-angle=default'] }
  ];

  let lastError = null;
  for (const attempt of launchAttempts) {
    let browser = null;
    try {
      console.log(`Launching Chromium GPU mode=${attempt.label} flags=${attempt.gpuFlags.join(' ') || '(default)'}`);
      browser = await puppeteer.launch({
        executablePath: CHROMIUM_PATH,
        headless: false,
        dumpio: false,
        ignoreDefaultArgs: ['--enable-automation'],
        defaultViewport: { width, height, deviceScaleFactor: 1 },
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-features=CalculateNativeWinOcclusion',
          '--ignore-gpu-blocklist',
          '--enable-gpu-rasterization',
          '--enable-zero-copy',
          '--disable-software-rasterizer',
          '--disable-gpu-sandbox',
          '--ozone-platform=x11',
          '--test-type',
          '--disable-infobars',
          '--window-position=0,0',
          `--window-size=${width},${height}`,
          '--force-device-scale-factor=1',
          '--kiosk',
          '--hide-scrollbars',
          '--autoplay-policy=no-user-gesture-required',
          ...attempt.gpuFlags
        ],
        env: chromiumEnvironment()
      });

      const pages = await browser.pages();
      const page = pages[0] ?? await browser.newPage();
      await page.setViewport({ width, height, deviceScaleFactor: 1 });
      await page.bringToFront();

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

      const identity = `${gpuInfo.vendor} ${gpuInfo.renderer}`.toLowerCase();
      const software = identity.includes('swiftshader')
        || identity.includes('llvmpipe')
        || identity.includes('software rasterizer');
      if (!gpuInfo.available || software || !identity.includes('nvidia')) {
        throw new Error(`Hardware WebGL validation failed: vendor=${gpuInfo.vendor} renderer=${gpuInfo.renderer}`);
      }

      console.log(`Hardware WebGL ready mode=${attempt.label}: vendor=${gpuInfo.vendor} renderer=${gpuInfo.renderer}`);
      return { browser, page };
    } catch (error) {
      lastError = error;
      if (browser) await browser.close().catch(() => undefined);
      console.error(`GPU browser launch attempt failed mode=${attempt.label}: ${error instanceof Error ? error.message : String(error)}`);
      await sleep(250);
    }
  }

  throw lastError ?? new Error('Could not launch Chromium with hardware WebGL.');
}

async function captureDisplay(outputPath, width, height, fps, durationMs) {
  const seconds = Math.max(0.1, durationMs / 1000);
  const useNvenc = hasNvenc();
  const args = [
    '-hide_banner', '-loglevel', 'warning', '-y',
    '-f', 'x11grab',
    '-draw_mouse', '0',
    '-framerate', String(fps),
    '-video_size', `${width}x${height}`,
    '-i', `${DISPLAY}.0+0,0`,
    '-t', seconds.toFixed(3),
    '-an'
  ];

  if (useNvenc) {
    args.push(
      '-c:v', 'h264_nvenc',
      '-preset', 'p4',
      '-tune', 'hq',
      '-rc', 'vbr',
      '-cq', '18',
      '-b:v', '0'
    );
  } else {
    args.push(
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-crf', '18',
      '-threads', '4'
    );
  }

  args.push(
    '-pix_fmt', 'yuv420p',
    '-r', String(fps),
    '-fps_mode', 'cfr',
    '-movflags', '+faststart',
    outputPath
  );

  console.log(`Recording ${width}x${height} at ${fps}fps with ${useNvenc ? 'h264_nvenc' : 'libx264 fallback'}.`);
  const startedAt = Date.now();
  await runProcess('ffmpeg', args, 'GPU capture ffmpeg');
  const wallMs = Date.now() - startedAt;
  const stat = await fs.stat(outputPath);
  if (stat.size < 50_000) throw new Error(`GPU capture is too small (${stat.size} bytes).`);
  if (wallMs > durationMs * 1.12 + 1200) {
    throw new Error(`GPU capture could not sustain real time: requested=${durationMs}ms wall=${wallMs}ms.`);
  }
  console.log(`GPU capture complete: ${stat.size} bytes in ${wallMs}ms.`);
}

async function main() {
  const work = parseInput();
  const url = `${work.backendUrl}${work.renderPagePath}`;
  let browser = null;

  try {
    const launched = await launchHardwareBrowser(work.width, work.height);
    browser = launched.browser;
    const page = launched.page;
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

    await page.waitForFunction(() => {
      const canvas = document.querySelector('.shot-preview-canvas');
      if (!(canvas instanceof HTMLCanvasElement)) return false;
      const style = getComputedStyle(canvas);
      const state = document.documentElement.dataset.mediaOsRenderState || '';
      return state !== 'error'
        && style.visibility !== 'hidden'
        && canvas.width >= 1280
        && canvas.height >= 720;
    }, { timeout: 90_000, polling: 8 });

    const stateBeforeCapture = await page.evaluate(() => ({
      state: document.documentElement.dataset.mediaOsRenderState || '',
      error: document.documentElement.dataset.mediaOsRenderError || ''
    }));
    if (stateBeforeCapture.state === 'error') {
      throw new Error(`Spline runtime failed before capture: ${stateBeforeCapture.error || 'unknown error'}`);
    }
    if (pageCrashError || page.isClosed()) {
      throw new Error(pageCrashError || 'Chromium page closed before capture.');
    }

    await page.bringToFront();
    await captureDisplay(work.outputPath, work.width, work.height, work.fps, work.durationMs);

    if (pageCrashError || page.isClosed()) {
      throw new Error(pageCrashError || 'Chromium page closed during capture.');
    }
    const finalState = await page.evaluate(() => ({
      state: document.documentElement.dataset.mediaOsRenderState || '',
      error: document.documentElement.dataset.mediaOsRenderError || ''
    }));
    if (finalState.state === 'error') {
      throw new Error(`Spline runtime failed during capture: ${finalState.error || 'unknown error'}`);
    }
  } finally {
    if (browser) await browser.close().catch(() => undefined);
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exitCode = 1;
});
