import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {performance} from 'node:perf_hooks';
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';

const root = path.dirname(fileURLToPath(import.meta.url));
const compositionId = process.env.MEDIA_OS_BENCH_COMPOSITION || 'EP001-PhoneFirst-Youtube';
const framesRequested = Number(process.env.MEDIA_OS_BENCH_FRAMES || 300);
const scale = Number(process.env.MEDIA_OS_BENCH_SCALE || (2 / 3));
const props = JSON.parse(process.env.MEDIA_OS_BENCH_PROPS_JSON || '{"showGuides":false}');
const browserExecutable = process.env.CHROMIUM_PATH || undefined;

assert(Number.isInteger(framesRequested) && framesRequested >= 30 && framesRequested <= 1800);
assert(Number.isFinite(scale) && scale > 0 && scale <= 1);
assert(props && typeof props === 'object' && !Array.isArray(props));

const serveUrl = await bundle({
  entryPoint: path.join(root, 'src/index.ts'),
  rootDir: root,
  publicDir: null,
  enableCaching: true,
});

const composition = await selectComposition({
  serveUrl,
  id: compositionId,
  inputProps: props,
  browserExecutable,
  timeoutInMilliseconds: 120_000,
});

const frames = Math.min(framesRequested, composition.durationInFrames);
const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mediaos-render-benchmark-'));
const results = [];

for (const concurrency of [1, 2]) {
  const outputLocation = path.join(outputDir, 'concurrency-' + concurrency + '.mp4');
  const startedAt = performance.now();
  await renderMedia({
    composition,
    serveUrl,
    codec: 'h264',
    outputLocation,
    inputProps: props,
    browserExecutable,
    scale,
    frameRange: [0, frames - 1],
    imageFormat: 'jpeg',
    jpegQuality: 90,
    crf: 18,
    x264Preset: 'veryfast',
    hardwareAcceleration: 'disable',
    overwrite: true,
    concurrency,
    disallowParallelEncoding: true,
    ffmpegOverride: ({args}) => {
      if (!args.length) return args;
      return [...args.slice(0, -1), '-threads', '2', args[args.length - 1]];
    },
    timeoutInMilliseconds: 120_000,
    logLevel: 'warn',
  });
  const elapsedSeconds = (performance.now() - startedAt) / 1000;
  const file = await fs.stat(outputLocation);
  const stream = JSON.parse(execFileSync('ffprobe', [
    '-v', 'error',
    '-select_streams', 'v:0',
    '-show_entries', 'stream=codec_name,width,height,nb_frames,r_frame_rate',
    '-of', 'json',
    outputLocation,
  ], {encoding: 'utf8'})).streams?.[0];
  assert(stream?.codec_name === 'h264');
  assert(file.size > 0);
  results.push({concurrency, elapsedSeconds, bytes: file.size, stream, outputLocation});
  console.log(JSON.stringify({stage: 'completed', ...results[results.length - 1]}));
}

assert(results[0].stream.width === results[1].stream.width);
assert(results[0].stream.height === results[1].stream.height);
const summary = {
  compositionId,
  testedFrames: frames,
  scale,
  fps: composition.fps,
  speedup: Number((results[0].elapsedSeconds / results[1].elapsedSeconds).toFixed(3)),
  results,
};
await fs.writeFile(path.join(outputDir, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify({stage: 'summary', ...summary}));
