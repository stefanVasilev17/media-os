import puppeteer from 'puppeteer-core';

const DISPLAY = process.env.DISPLAY || ':99';
const CHROMIUM_PATH = process.env.CHROMIUM_PATH || '/usr/bin/chromium';

const env = { ...process.env, DISPLAY, HOME: '/tmp/chromium-ci-home', XDG_RUNTIME_DIR: '/tmp/chromium-ci-runtime', NO_AT_BRIDGE: '1' };
delete env.DBUS_SESSION_BUS_ADDRESS;
delete env.DBUS_SYSTEM_BUS_ADDRESS;

let browser;
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
      '--disable-gpu',
      '--ozone-platform=x11',
      '--window-size=640,360'
    ],
    env
  });
  const pages = await browser.pages();
  const page = pages[0] ?? await browser.newPage();
  await page.setContent('<!doctype html><html><body><canvas id="c" width="32" height="32"></canvas></body></html>');
  const result = await page.evaluate(() => {
    const canvas = document.getElementById('c');
    const ctx = canvas.getContext('2d');
    ctx.fillRect(0, 0, 10, 10);
    return {
      userAgent: navigator.userAgent,
      canvas2d: Boolean(ctx),
      width: window.innerWidth,
      height: window.innerHeight
    };
  });
  if (!result.canvas2d) throw new Error('Chromium canvas smoke test failed.');
  console.log(`CHROMIUM_CI_SMOKE_OK=${JSON.stringify(result)}`);
} finally {
  if (browser) await browser.close().catch(() => undefined);
}
