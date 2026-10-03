import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';

const CHROMIUM_PATH = process.env.CHROMIUM_PATH || '/usr/bin/chromium';
const ENGINE_ROOT = '/app/remotion-engine';
const ENTRY_POINT = path.join(ENGINE_ROOT, 'src/index.ts');

function parseInput() {
  const raw = process.argv[2] || '';
  if (!raw) throw new Error('Missing Remotion render work payload.');
  const work = JSON.parse(raw);
  const compositionId = String(work.compositionId || '').trim();
  const outputPath = String(work.outputPath || '').trim();
  const width = Number(work.width || 0);
  const height = Number(work.height || 0);
  const fps = Number(work.fps || 0);
  const durationInFrames = Number(work.durationInFrames || 0);
  const inputProps = work.inputProps && typeof work.inputProps === 'object' ? work.inputProps : {};
  const engineVersion = String(work.engineVersion || '').trim();

  if (!compositionId) throw new Error('Remotion work is missing compositionId.');
  if (!outputPath) throw new Error('Remotion work is missing outputPath.');
  if (!Number.isFinite(width) || width <= 0) throw new Error('Remotion work width is invalid.');
  if (!Number.isFinite(height) || height <= 0) throw new Error('Remotion work height is invalid.');
  if (!Number.isFinite(fps) || fps <= 0) throw new Error('Remotion work fps is invalid.');
  if (!Number.isFinite(durationInFrames) || durationInFrames <= 0) {
    throw new Error('Remotion work durationInFrames is invalid.');
  }

  return {
    compositionId,
    outputPath,
    width,
    height,
    fps,
    durationInFrames,
    inputProps,
    engineVersion,
  };
}

async function main() {
  const work = parseInput();
  console.log(
    `Remotion render starting composition=${work.compositionId} engine=${work.engineVersion || 'unknown'} target=${work.width}x${work.height}@${work.fps} frames=${work.durationInFrames}`,
  );

  const serveUrl = await bundle({
    entryPoint: ENTRY_POINT,
    rootDir: ENGINE_ROOT,
    publicDir: null,
    enableCaching: true,
    onProgress: (progress) => {
      if (progress === 100 || progress % 20 < 1) {
        console.log(`Remotion bundle progress=${Math.round(progress)}%`);
      }
    },
  });

  const composition = await selectComposition({
    serveUrl,
    id: work.compositionId,
    inputProps: work.inputProps,
    browserExecutable: CHROMIUM_PATH,
    timeoutInMilliseconds: 120_000,
    logLevel: 'info',
  });

  if (composition.fps !== work.fps) {
    throw new Error(`Composition fps mismatch: expected=${work.fps} actual=${composition.fps}.`);
  }
  if (composition.durationInFrames !== work.durationInFrames) {
    throw new Error(
      `Composition duration mismatch: expected=${work.durationInFrames} actual=${composition.durationInFrames}.`,
    );
  }

  const widthScale = work.width / composition.width;
  const heightScale = work.height / composition.height;
  if (Math.abs(widthScale - heightScale) > 0.0001) {
    throw new Error(
      `Requested output ${work.width}x${work.height} changes composition aspect ratio ${composition.width}x${composition.height}.`,
    );
  }

  let lastBucket = -1;
  await renderMedia({
    composition,
    serveUrl,
    codec: 'h264',
    outputLocation: work.outputPath,
    inputProps: work.inputProps,
    browserExecutable: CHROMIUM_PATH,
    scale: widthScale,
    imageFormat: 'jpeg',
    jpegQuality: 92,
    crf: 18,
    x264Preset: 'veryfast',
    hardwareAcceleration: 'disable',
    overwrite: true,
    concurrency: '50%',
    timeoutInMilliseconds: 120_000,
    logLevel: 'info',
    onProgress: ({progress}) => {
      const bucket = Math.floor(progress * 10);
      if (bucket !== lastBucket || progress === 1) {
        lastBucket = bucket;
        console.log(`REMOTION_PROGRESS=${Math.round(progress * 100)}`);
      }
    },
  });

  console.log(`Remotion render complete output=${work.outputPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exitCode = 1;
});
