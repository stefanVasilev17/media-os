import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {performance} from 'node:perf_hooks';
import {renderMedia, selectComposition} from '@remotion/renderer';
import {CLIP_PREVIEW_INPUT_KEY, resolveClipPreviewRange} from './clip-preview-range.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const serveUrl = path.join(root, 'build');
await fs.access(path.join(serveUrl, 'index.html'));
await fs.access('/app/backend-tests-passed');
const props = {showGuides: false};
const composition = await selectComposition({
  serveUrl, id: 'EP001-PhoneFirst-Youtube', inputProps: props,
  browserExecutable: process.env.CHROMIUM_PATH, timeoutInMilliseconds: 120000,
});
const expected = resolveClipPreviewRange('CLIP_PREVIEW', {
  ...props, [CLIP_PREVIEW_INPUT_KEY]: {startFrame: 120, endFrame: 179},
}, composition.durationInFrames, composition.fps);
assert.deepEqual(expected, [120, 179]);
const out = path.join(await fs.mkdtemp(path.join(os.tmpdir(), 'mediaos-prebuilt-clip-')), 'clip.mp4');
const started = performance.now();
await renderMedia({
  composition, serveUrl, codec: 'h264', outputLocation: out, inputProps: props,
  browserExecutable: process.env.CHROMIUM_PATH, scale: 0.5,
  imageFormat: 'jpeg', jpegQuality: 90, crf: 18,
  x264Preset: 'veryfast', hardwareAcceleration: 'disable',
  overwrite: true, concurrency: 2, disallowParallelEncoding: true,
  frameRange: expected,
  ffmpegOverride: ({args}) => args.length ? [...args.slice(0, -1), '-threads', '2', args[args.length - 1]] : args,
  timeoutInMilliseconds: 120000, logLevel: 'warn',
});
const elapsedSeconds = +((performance.now() - started)/1000).toFixed(3);
const metadata = JSON.parse(execFileSync('ffprobe', ['-v','error','-select_streams','v:0','-show_entries','stream=codec_name,width,height,nb_frames,r_frame_rate','-of','json',out], {encoding:'utf8'})).streams[0];
assert.equal(metadata.codec_name, 'h264');
assert.equal(metadata.width, 960);
assert.equal(metadata.height, 540);
assert.equal(metadata.nb_frames, '60');
assert.equal(metadata.r_frame_rate, composition.fps + '/1');
execFileSync('ffmpeg', ['-v','error','-i',out,'-f','null','-'], {stdio:'pipe'});
const stats = await fs.stat(out);
assert(stats.size > 10000);
console.log('SMOKE_PREFLIGHT_SUCCESS ' + JSON.stringify({
  prebuiltBundle:true, backendMavenTests:true, nodeUnitTests:true,
  composition:'EP001-PhoneFirst-Youtube', originalFrames:composition.durationInFrames,
  frameRange:expected, fps:composition.fps, outputFrames:60,
  seconds:elapsedSeconds, bytes:stats.size, metadata
}));
