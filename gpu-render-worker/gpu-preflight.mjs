import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import puppeteer from 'puppeteer-core';

const DISPLAY = process.env.DISPLAY || ':99';
const CHROMIUM_PATH = process.env.CHROMIUM_PATH || '/usr/bin/chromium';

function commandVersion(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(`${command} failed: ${(result.stderr || result.stdout || '').trim()}`);
  }
  return (result.stdout || result.stderr || '').trim().split('\n')[0];
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

async function inspectWebGl(page) {
  return page.evaluate(() => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return { available: false, vendor: 'none', renderer: 'none', version: 'none' };
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    return {
      available: true,
      vendor: ext ? String(gl.getParameter(ext.UNMASKED_VENDOR_WEBGL)) : String(gl.getParameter(gl.VENDOR)),
      renderer: ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : String(gl.getParameter(gl.RENDERER)),
      version: String(gl.getParameter(gl.VERSION))
    };
  });
}

async function launchAttempt(label, gpuFlags) {
  let browser = null;
  try {
    browser = await puppeteer.launch({
      executablePath: CHROMIUM_PATH,
      headless: false,
      dumpio: false,
      defaultViewport: { width: 640, height: 360, deviceScaleFactor: 1 },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--ignore-gpu-blocklist',
        '--enable-gpu-rasterization',
        '--enable-zero-copy',
        '--disable-software-rasterizer',
        '--disable-gpu-sandbox',
        '--ozone-platform=x11',
        '--window-size=640,360',
        '--force-device-scale-factor=1',
        ...gpuFlags
      ],
      env: chromiumEnvironment()
    });
    const pages = await browser.pages();
    const page = pages[0] ?? await browser.newPage();
    const gpuInfo = await inspectWebGl(page);
    const identity = `${gpuInfo.vendor} ${gpuInfo.renderer}`.toLowerCase();
    const software = identity.includes('swiftshader') || identity.includes('llvmpipe') || identity.includes('software rasterizer');
    if (!gpuInfo.available || software || !identity.includes('nvidia')) {
      throw new Error(`Hardware WebGL validation failed: vendor=${gpuInfo.vendor} renderer=${gpuInfo.renderer}`);
    }
    return { label, gpuFlags, gpuInfo };
  } finally {
    if (browser) await browser.close().catch(() => undefined);
  }
}

async function main() {
  await fs.mkdir('/tmp/chromium-home', { recursive: true });
  await fs.mkdir('/tmp/chromium-runtime', { recursive: true, mode: 0o700 });

  const attempts = [
    { label: 'chromium-default-gl', gpuFlags: [] },
    { label: 'angle-default', gpuFlags: ['--use-gl=angle', '--use-angle=default'] }
  ];

  let selected = null;
  const failures = [];
  for (const attempt of attempts) {
    try {
      selected = await launchAttempt(attempt.label, attempt.gpuFlags);
      break;
    } catch (error) {
      failures.push({ label: attempt.label, error: error instanceof Error ? error.message : String(error) });
    }
  }
  if (!selected) {
    throw new Error(`No hardware WebGL launch mode succeeded: ${JSON.stringify(failures)}`);
  }

  const nvencProbe = spawnSync('ffmpeg', ['-hide_banner', '-encoders'], { encoding: 'utf8' });
  const encoders = `${nvencProbe.stdout || ''}\n${nvencProbe.stderr || ''}`;
  const result = {
    status: 'GPU_PREFLIGHT_OK',
    chromium: commandVersion(CHROMIUM_PATH, ['--version']),
    ffmpeg: commandVersion('ffmpeg', ['-version']),
    nvenc: nvencProbe.status === 0 && encoders.includes('h264_nvenc'),
    display: DISPLAY,
    mode: selected.label,
    gpuFlags: selected.gpuFlags,
    webgl: selected.gpuInfo,
    failures
  };
  console.log(`MEDIA_OS_GPU_PREFLIGHT=${JSON.stringify(result)}`);
}

main().catch(error => {
  console.error(`MEDIA_OS_GPU_PREFLIGHT_FAILED=${error instanceof Error ? error.stack || error.message : String(error)}`);
  process.exitCode = 1;
});
