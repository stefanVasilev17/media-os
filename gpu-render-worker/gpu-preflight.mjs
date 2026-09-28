import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
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

function probe(command, args, maxLength = 1200) {
  const result = spawnSync(command, args, { encoding: 'utf8', timeout: 20_000 });
  const text = `${result.stdout || ''}\n${result.stderr || ''}`.trim();
  return {
    status: result.status,
    output: text.length > maxLength ? text.slice(-maxLength) : text
  };
}

function chromiumEnvironment(useDisplay) {
  const env = {
    ...process.env,
    HOME: process.env.HOME || '/tmp/chromium-home',
    XDG_RUNTIME_DIR: '/tmp/chromium-runtime',
    NO_AT_BRIDGE: '1',
    NVIDIA_VISIBLE_DEVICES: process.env.NVIDIA_VISIBLE_DEVICES || 'all',
    NVIDIA_DRIVER_CAPABILITIES: process.env.NVIDIA_DRIVER_CAPABILITIES || 'compute,utility,graphics,video,display',
    __GLX_VENDOR_LIBRARY_NAME: 'nvidia'
  };

  if (useDisplay) env.DISPLAY = DISPLAY;
  else delete env.DISPLAY;

  if (existsSync('/usr/share/glvnd/egl_vendor.d/10_nvidia.json')) {
    env.__EGL_VENDOR_LIBRARY_FILENAMES = '/usr/share/glvnd/egl_vendor.d/10_nvidia.json';
  }
  if (existsSync('/usr/share/vulkan/icd.d/nvidia_icd.json')) {
    env.VK_ICD_FILENAMES = '/usr/share/vulkan/icd.d/nvidia_icd.json';
  }

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

async function launchAttempt(attempt) {
  let browser = null;
  try {
    browser = await puppeteer.launch({
      executablePath: CHROMIUM_PATH,
      headless: attempt.headless,
      dumpio: false,
      defaultViewport: { width: 640, height: 360, deviceScaleFactor: 1 },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--ignore-gpu-blocklist',
        '--enable-gpu',
        '--enable-gpu-rasterization',
        '--enable-zero-copy',
        '--disable-software-rasterizer',
        '--disable-gpu-sandbox',
        '--window-size=640,360',
        '--force-device-scale-factor=1',
        ...attempt.gpuFlags
      ],
      env: chromiumEnvironment(attempt.useDisplay)
    });
    const pages = await browser.pages();
    const page = pages[0] ?? await browser.newPage();
    const gpuInfo = await inspectWebGl(page);
    const identity = `${gpuInfo.vendor} ${gpuInfo.renderer}`.toLowerCase();
    const software = identity.includes('swiftshader') || identity.includes('llvmpipe') || identity.includes('software rasterizer');
    if (!gpuInfo.available || software || !identity.includes('nvidia')) {
      throw new Error(`Hardware WebGL validation failed: vendor=${gpuInfo.vendor} renderer=${gpuInfo.renderer}`);
    }
    return {
      label: attempt.label,
      headless: attempt.headless,
      useDisplay: attempt.useDisplay,
      gpuFlags: attempt.gpuFlags,
      gpuInfo
    };
  } finally {
    if (browser) await browser.close().catch(() => undefined);
  }
}

function runtimeDiagnostics() {
  const vulkan = probe('vulkaninfo', ['--summary'], 900);
  const egl = probe('sh', ['-lc', 'ls -1 /usr/share/glvnd/egl_vendor.d 2>/dev/null || true'], 300);
  const vulkanIcd = probe('sh', ['-lc', 'ls -1 /usr/share/vulkan/icd.d 2>/dev/null || true'], 400);
  const devices = probe('sh', ['-lc', 'ls -l /dev/nvidia* /dev/dri/* 2>/dev/null || true'], 500);
  return { vulkan, eglVendors: egl, vulkanIcd, devices };
}

async function main() {
  await fs.mkdir('/tmp/chromium-home', { recursive: true });
  await fs.mkdir('/tmp/chromium-runtime', { recursive: true, mode: 0o700 });

  const diagnostics = runtimeDiagnostics();
  const attempts = [
    {
      label: 'x11-vulkan-nvidia',
      headless: false,
      useDisplay: true,
      gpuFlags: [
        '--ozone-platform=x11',
        '--use-angle=vulkan',
        '--enable-features=Vulkan',
        '--enable-unsafe-webgpu'
      ]
    },
    {
      label: 'headless-vulkan-nvidia',
      headless: true,
      useDisplay: false,
      gpuFlags: [
        '--use-angle=vulkan',
        '--enable-features=Vulkan',
        '--disable-vulkan-surface',
        '--enable-unsafe-webgpu'
      ]
    },
    {
      label: 'x11-angle-default',
      headless: false,
      useDisplay: true,
      gpuFlags: ['--ozone-platform=x11', '--use-gl=angle', '--use-angle=default']
    }
  ];

  let selected = null;
  const failures = [];
  for (const attempt of attempts) {
    try {
      selected = await launchAttempt(attempt);
      break;
    } catch (error) {
      failures.push({ label: attempt.label, error: error instanceof Error ? error.message : String(error) });
    }
  }
  if (!selected) {
    const compact = {
      failures,
      vulkanStatus: diagnostics.vulkan.status,
      vulkan: diagnostics.vulkan.output,
      eglVendors: diagnostics.eglVendors.output,
      vulkanIcd: diagnostics.vulkanIcd.output,
      devices: diagnostics.devices.output
    };
    throw new Error(`No NVIDIA hardware WebGL launch mode succeeded: ${JSON.stringify(compact)}`);
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
    headless: selected.headless,
    gpuFlags: selected.gpuFlags,
    webgl: selected.gpuInfo,
    diagnostics
  };
  console.log(`MEDIA_OS_GPU_PREFLIGHT=${JSON.stringify(result)}`);
}

main().catch(error => {
  console.error(`MEDIA_OS_GPU_PREFLIGHT_FAILED=${error instanceof Error ? error.stack || error.message : String(error)}`);
  process.exitCode = 1;
});
