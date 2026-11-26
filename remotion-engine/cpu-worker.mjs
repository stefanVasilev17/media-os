import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import {createWorkerTokenTransport} from './worker-token-rotation.mjs';
import {createCpuWorkerLeaseClient} from './cpu-worker-lease.mjs';
import {shouldClaimRenderWork,requireSupportedTargetComposition} from './worker-claim-authorization.mjs';
import {buildFactoryMedia,probeFactoryMedia} from './factory-media-worker.mjs';
import {inspectLockedMaster,assembleLockedMaster,verifyManifest} from './ep002-locked-master-assembly.mjs';
import {renderEp002DirectorBreathMaster} from './ep002-director-breathing-master.mjs';
import {renderEp002DirectorContinuityMaster,EP002_V3_MODE,EP002_V3_TRANSITION} from './ep002-director-continuity-master.mjs';
import {renderEp002V4CleanCutMaster,EP002_V4_MODE,EP002_V4_TRANSITION,EP002_V4_SHOT10} from './ep002-director-clean-cut-master.mjs';
import {validateShot02EditorialPlan,buildShot02EditorialAudioFilter} from './shot02-editorial-audio.mjs';
import {preflightTierPlusPlusRender,verifyTierPlusPlusMedia,tierPlusPlusReceipt} from './tier-plus-plus-render-quality.mjs';
import {EP004_SHOT05_COMPOSITION} from './src/components/architectural-thinking/EP004Shot05ProductionWorld.mjs';
import {EP004_SHOT06_COMPOSITION,validateEp004Shot06Production,verifyEp004Shot06ActualMotion} from './src/components/architectural-thinking/EP004Shot06ProductionWorld.mjs';
import {EP004_SHOT07_COMPOSITION,validateEp004Shot07Production,verifyEp004Shot07ActualMotion} from './src/components/architectural-thinking/EP004Shot07ProductionWorld.mjs';
import {EP004_SHOT08_COMPOSITION,validateEp004Shot08Production,verifyEp004Shot08ActualMotion} from './src/components/architectural-thinking/EP004Shot08ProductionWorld.mjs';
import {EP004_SHOT09_COMPOSITION,validateEp004Shot09Production,verifyEp004Shot09ActualMotion} from './src/components/architectural-thinking/EP004Shot09ProductionWorld.mjs';
import {EP004_SHOT10_COMPOSITION,validateEp004Shot10Production,verifyEp004Shot10ActualMotion} from './src/components/architectural-thinking/EP004Shot10ProductionWorld.mjs';
import {EP004_SHOT11_COMPOSITION,validateEp004Shot11Production,verifyEp004Shot11ActualMotion} from './src/components/architectural-thinking/EP004Shot11ProductionWorld.mjs';
import {EP004_SHOT12_COMPOSITION,validateEp004Shot12Production,verifyEp004Shot12ActualMotion} from './src/components/architectural-thinking/EP004Shot12ProductionWorld.mjs';
import {EP004_SHOT13_COMPOSITION,validateEp004Shot13Production,verifyEp004Shot13ActualMotion} from './src/components/architectural-thinking/EP004Shot13ProductionWorld.mjs';
import {EP004_SHOT14_COMPOSITION,validateEp004Shot14Production,verifyEp004Shot14ActualMotion} from './src/components/architectural-thinking/EP004Shot14ProductionWorld.mjs';
import {EP004_SHOT15_COMPOSITION,validateEp004Shot15Production,verifyEp004Shot15ActualMotion} from './src/components/architectural-thinking/EP004Shot15ProductionWorld.mjs';
import {ep004Shot05VerifyReroute} from './src/components/architectural-thinking/EP004Shot05ClarityWorld.mjs';

const BACKEND_URL = (process.env.MEDIA_OS_BACKEND_URL || 'https://media-os-backend-production.up.railway.app').replace(/\/$/, '');
const WORKER_KEY = String(process.env.MEDIA_OS_RENDER_WORKER_KEY || '').trim();
const WORKER_SERVICE_NAME = String(process.env.RAILWAY_SERVICE_NAME || 'media-os-remotion-cpu-worker').trim();
const WORKER_REPLICA_ID = String(process.env.RAILWAY_REPLICA_ID || os.hostname()).trim();
const WORKER_ID = String(process.env.MEDIA_OS_REMOTION_WORKER_ID || `${WORKER_SERVICE_NAME}:${WORKER_REPLICA_ID}`).trim().slice(0, 160);
if (!/^[A-Za-z0-9._:-]{1,160}$/.test(WORKER_ID)) {
  throw new Error('Remotion worker ID must contain 1-160 characters from A-Z, a-z, 0-9, dot, underscore, colon or hyphen.');
}
const configuredConcurrency = Number(process.env.MEDIA_OS_REMOTION_RENDER_CONCURRENCY || 2);
if (!Number.isInteger(configuredConcurrency) || configuredConcurrency < 1 || configuredConcurrency > 4) {
  throw new Error('MEDIA_OS_REMOTION_RENDER_CONCURRENCY must be an integer from 1 to 4.');
}
const RENDER_CONCURRENCY = configuredConcurrency;
const POLL_MS = Math.max(500, Number(process.env.MEDIA_OS_RENDER_POLL_MS || 1500));
const CHROMIUM_PATH = process.env.CHROMIUM_PATH || '/usr/bin/chromium';
const WORKER_VERSION = 'REMOTION_CPU_WORKER_V1_5';
const NEXT_TOKEN_FILE = String(process.env.MEDIA_OS_REMOTION_CPU_WORKLOAD_TOKEN_NEXT_FILE || '').trim();
if (NEXT_TOKEN_FILE && !path.isAbsolute(NEXT_TOKEN_FILE)) {
  throw new Error('MEDIA_OS_REMOTION_CPU_WORKLOAD_TOKEN_NEXT_FILE must be an absolute path.');
}
const AUTO_LEASE = process.env.MEDIA_OS_REMOTION_CPU_AUTO_LEASE === 'true';
const CLAIMS_ENABLED = shouldClaimRenderWork(process.env.MEDIA_OS_REMOTION_CLAIMS_ENABLED);
const TARGET_COMPOSITION = String(process.env.MEDIA_OS_REMOTION_TARGET_COMPOSITION || '').trim();
requireSupportedTargetComposition(TARGET_COMPOSITION);

let leaseClient;
const workloadTokens = createWorkerTokenTransport(
  process.env.MEDIA_OS_REMOTION_CPU_WORKLOAD_TOKEN,
  process.env.MEDIA_OS_REMOTION_CPU_WORKLOAD_TOKEN_NEXT,
  AUTO_LEASE
    ? async () => leaseClient.refresh(true)
    : NEXT_TOKEN_FILE
      ? async () => (await fs.readFile(NEXT_TOKEN_FILE, 'utf8')).trim()
      : null,
);
leaseClient = createCpuWorkerLeaseClient({
  backendUrl: BACKEND_URL,
  workerId: WORKER_ID,
  workerKey: String(process.env.MEDIA_OS_CPU_WORKER_BOOTSTRAP_SECRET || '').trim(),
  transport: workloadTokens,
  enabled: AUTO_LEASE,
});
const ENGINE_ROOT = '/app/remotion-engine';
const ENTRY_POINT = path.join(ENGINE_ROOT, 'src/index.ts');
const FACTORY_SOURCE_SHA = String(process.env.RAILWAY_GIT_COMMIT_SHA || '').trim();
const FACTORY_BUILD_PATH = path.join(ENGINE_ROOT, 'build-factory');

if (!WORKER_KEY) {
  throw new Error('MEDIA_OS_RENDER_WORKER_KEY is required.');
}

let serveUrlPromise = null;
let factoryServeUrlPromise = null;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function headers(extra = {}) {
  return {
    'X-Media-OS-Worker-Key': WORKER_KEY,
    'X-Media-OS-Worker': WORKER_ID,
    'X-Media-OS-Worker-Source-Sha': FACTORY_SOURCE_SHA,
    ...(Object.keys(workloadTokens.scopedHeaders()).length > 0
      ? {'X-Worker-Id': WORKER_ID, ...workloadTokens.scopedHeaders()}
      : {}),
    ...extra,
  };
}

async function requestJson(url, options = {}) {
  const response = await workloadTokens.request(url, options);
  if (response.status === 204) return null;
  const text = await response.text();
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${text.slice(0, 1600)}`);
  return text ? JSON.parse(text) : null;
}

async function claim() {
  await leaseClient.refresh();
  return requestJson(`${BACKEND_URL}/api/v1/remotion/renders/worker/claim`, {
    method: 'POST',
    headers: headers(TARGET_COMPOSITION
      ? {'X-Media-OS-Target-Composition': TARGET_COMPOSITION} : {}),
  });
}

let factoryCapabilityLast = 0;
async function publishFactoryCapability() {
  if (!/^[a-f0-9]{40}$/.test(FACTORY_SOURCE_SHA))return;
  const now=Date.now();
  if (now-factoryCapabilityLast<45_000)return;
  factoryCapabilityLast=now;
  const keys=JSON.parse(await fs.readFile(path.join(ENGINE_ROOT,'factory-scenes.json'),'utf8'));
  if (!Array.isArray(keys.sceneKeys))throw Error('FACTORY_BUILD_SCENE_INVENTORY_MISSING');
  await leaseClient.refresh();
  const receipt=await requestJson(`${BACKEND_URL}/api/v1/remotion/renders/worker/factory-capability`,{
    method:'POST',
    headers:headers({'Content-Type':'application/json'}),
    body:JSON.stringify({sourceCommit:FACTORY_SOURCE_SHA,sceneKeys:keys.sceneKeys,buildChecked:true}),
  });
  if (receipt?.state !== 'FACTORY_BUNDLE_REPORTED' || receipt.sourceCommit !== FACTORY_SOURCE_SHA) {
    throw new Error('FACTORY_CAPABILITY_RECEIPT_INVALID');
  }
  console.log(`Factory capability confirmed source=${FACTORY_SOURCE_SHA} scenes=${keys.sceneKeys.length}`);
}

async function progress(renderId, value) {
  try {
    await leaseClient.refresh();
    await requestJson(`${BACKEND_URL}/api/v1/remotion/renders/worker/${renderId}/progress`, {
      method: 'POST',
      headers: headers({'Content-Type': 'application/json'}),
      body: JSON.stringify({progress: value}),
    });
  } catch (error) {
    console.warn(`Could not report progress for ${renderId}: ${error.message}`);
  }
}

async function fail(renderId, error) {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  try {
    await leaseClient.refresh();
    await requestJson(`${BACKEND_URL}/api/v1/remotion/renders/worker/${renderId}/fail`, {
      method: 'POST',
      headers: headers({'Content-Type': 'application/json'}),
      body: JSON.stringify({error: message.slice(0, 1800)}),
    });
  } catch (cause) {
    console.error(`Could not report failure for ${renderId}:`, cause);
  }
}

async function complete(renderId, outputPath) {
  await leaseClient.refresh();
  const bytes = await fs.readFile(outputPath);
  const response = await workloadTokens.request(`${BACKEND_URL}/api/v1/remotion/renders/worker/${renderId}/complete`, {
    method: 'PUT',
    headers: headers({
      'Content-Type': 'video/mp4',
      'Content-Length': String(bytes.length),
    }),
    body: bytes,
  });
  if (!response.ok) {
    const detail = await response.text();
    if (response.status === 507) {
      throw new Error('STORAGE_GUARD: database has insufficient write headroom to save the MP4. The render finished but upload was blocked safely. Free storage or restore capacity, then retry. ' + detail.slice(0, 400));
    }
    throw new Error(`MP4 upload failed: ${response.status} ${detail.slice(0, 1600)}`);
  }
  return bytes.length;
}

async function runProcess(command, args) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {stdio: ['ignore', 'ignore', 'pipe']});
    let stderr = '';
    child.stderr.on('data', chunk => {
      stderr += String(chunk);
      if (stderr.length > 12000) stderr = stderr.slice(-12000);
    });
    child.on('error', reject);
    child.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code ${code}: ${stderr.slice(-6000)}`));
    });
  });
}

async function captureNative(command,args){
  return new Promise((resolve,reject)=>{
    const child=spawn(command,args,{stdio:['ignore','pipe','pipe']});
    let stdout='',stderr='';
    child.stdout.on('data',buf=>{stdout+=buf.toString();if(stdout.length>500000)stdout=stdout.slice(-500000);});
    child.stderr.on('data',buf=>{stderr+=buf.toString();if(stderr.length>500000)stderr=stderr.slice(-500000);});
    child.on('error',reject);
    child.on('close',code=>code===0?resolve({stdout,stderr}):
      reject(Error(command+' native QA exit='+code+' '+stderr.slice(-1600))));
  });
}

async function downloadFile(url, destination) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not download preview segment: ${response.status} ${response.statusText}`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(destination, bytes);
  return bytes.length;
}

async function renderCumulativePreview(job, outputPath, inputProps) {
  const segments = Array.isArray(inputProps.segments)
    ? inputProps.segments.filter(segment => segment && typeof segment.videoUrl === 'string' && segment.videoUrl.trim())
    : [];
  if (segments.length === 0) throw new Error('Cumulative preview requires at least one rendered shot segment.');

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), `media-os-preview-${job.renderId}-`));
  try {
    const files = [];
    for (let index = 0; index < segments.length; index++) {
      const segment = segments[index];
      const target = path.join(tmpDir, `segment-${String(index).padStart(3, '0')}.mp4`);
      await downloadFile(segments[index].videoUrl, target);
      if (segment.normalizeVideoTo === '1920x1080') {
        const normalized = path.join(tmpDir, `normalized-${String(index).padStart(3, '0')}.mp4`);
        console.log(`Normalizing cumulative preview segment ${index + 1}/${segments.length} to 1920x1080 (original source preserved)`);
        await runProcess('ffmpeg', [
          '-hide_banner', '-loglevel', 'error', '-i', target,
          '-map', '0:v:0', '-map', '0:a:0?', '-vf', 'scale=1920:1080:flags=lanczos,format=yuv420p',
          '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-r', '30',
          '-c:a', 'copy', '-movflags', '+faststart', '-y', normalized,
        ]);
        files.push(normalized);
      } else {
        files.push(target);
      }
      if (segment.shotKey === 'SHOT04_FINAL_POLISH' && segment.holdAfterFrames === 60) {
        const still = path.join(tmpDir, 'shot04-final-hold-last-frame.png');
        const hold = path.join(tmpDir, 'shot04-final-hold-2seconds.mp4');
        const source = files[files.length - 1];
        console.log('Adding Director-requested exact 2-second silent visual hold before API Gateway');
        await runProcess('ffmpeg', ['-hide_banner','-loglevel','error',
          '-sseof','-1','-i',source,'-map','0:v:0',
          '-frames:v','30','-update','1','-y',still]);
        const stillStat = await fs.stat(still).catch(() => null);
        if (!stillStat || stillStat.size < 1000) {
          throw new Error('Director 2s hold: source last-frame PNG was not generated');
        }
        await runProcess('ffmpeg', ['-hide_banner','-loglevel','error',
          '-loop','1','-framerate','30','-i',still,
          '-f','lavfi','-i','anullsrc=channel_layout=stereo:sample_rate=48000',
          '-frames:v','60','-r','30','-c:v','libx264','-preset','veryfast','-crf','18',
          '-pix_fmt','yuv420p','-c:a','aac','-b:a','160k',
          '-shortest','-movflags','+faststart','-y',hold]);
        files.push(hold);
      }
      const percent = Math.max(5, Math.min(70, Math.round(((index + 1) / segments.length) * 60) + 5));
      await progress(job.renderId, percent);
    }

    if (inputProps.soundDesign === 'EP001_SOUND_DESIGN_V1') {
      const lockedAudioMasterUrl = BACKEND_URL + '/api/v1/remotion/renders/96699a27-7615-4ce1-a092-53cdf1e9d1af/video';
      if (inputProps.audioMastering === true || inputProps.retimeVideoTo30fps === true
          || segments.length !== 1 || files.length !== 1
          || segments[0].videoUrl !== lockedAudioMasterUrl
          || job.fps !== 30 || job.width !== 1920 || job.height !== 1080
          || job.durationInFrames !== 37703 || segments[0].normalizeVideoTo
          || segments[0].durationInFrames !== 37703) {
        throw new Error('EP001 Sound Design V1 may only be derived from the exact Director-LOCKED audio master, with unchanged 37703-frame video.');
      }
      const sampleRate = 48000;
      const cues = [
        {at: 175.0, hz: 320, duration: .56, gain: .020, tag: 'request-assembly-dispatch'},
        {at: 218.4, hz: 570, duration: .50, gain: .016, tag: 'dns-resolution-found'},
        {at: 286.2, hz: 410, duration: .48, gain: .018, tag: 'gateway-receives-request'},
        {at: 546.0, hz: 285, duration: .72, gain: .022, tag: 'load-balancer-choice'},
        {at: 698.0, hz: 340, duration: .65, gain: .018, tag: 'database-account-lookup'},
        {at: 996.0, hz: 660, duration: .76, gain: .022, tag: 'credentials-verified'},
        {at: 1067.0, hz: 465, duration: .68, gain: .018, tag: 'authentication-state-created'},
        {at: 1146.0, hz: 540, duration: .52, gain: .014, tag: 'protected-route-authorization'},
        {at: 1237.0, hz: 620, duration: .93, gain: .020, tag: 'dashboard-private-data-reveal'},
      ];
      const textureCues = [
        {at:175.0, duration:.38, gain:.004},
        {at:286.2, duration:.36, gain:.004},
        {at:546.0, duration:.40, gain:.004},
        {at:698.0, duration:.43, gain:.004},
      ];
      const sfxWav = path.join(tmpDir, 'ep001-original-sfx-v1.wav');
      const nSamples = Math.round(job.durationInFrames * sampleRate / job.fps);
      const wavDataBytes = nSamples * 2;
      const header = Buffer.alloc(44);
      header.write('RIFF', 0, 4, 'ascii');
      header.writeUInt32LE(wavDataBytes + 36, 4);
      header.write('WAVE', 8, 4, 'ascii');
      header.write('fmt ', 12, 4, 'ascii');
      header.writeUInt32LE(16, 16);
      header.writeUInt16LE(1, 20);
      header.writeUInt16LE(1, 22);
      header.writeUInt32LE(sampleRate, 24);
      header.writeUInt32LE(sampleRate * 2, 28);
      header.writeUInt16LE(2, 32);
      header.writeUInt16LE(16, 34);
      header.write('data', 36, 4, 'ascii');
      header.writeUInt32LE(wavDataBytes, 40);
      const wav = await fs.open(sfxWav, 'w+');
      try {
        await wav.write(header, 0, header.length, 0);
        await wav.truncate(44 + wavDataBytes);
        const writeCue = async (cue, noise = false) => {
          const start = Math.round(cue.at * sampleRate);
          const count = Math.round(cue.duration * sampleRate);
          if (start < 0 || start + count >= nSamples) throw new Error('Sound cue out of bounds: '+JSON.stringify(cue));
          const samples = Buffer.alloc(count * 2);
          let seed = 32749;
          let filtered = 0;
          for (let i = 0; i < count; i++) {
            const t = i / sampleRate;
            const attack = Math.min(1, t / .035);
            const release = Math.min(1, (cue.duration - t) / (noise ? .16 : .28));
            const envelope = Math.pow(Math.max(0, Math.min(attack, release)), 1.4);
            let wave;
            if (noise) {
              seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
              const raw = (seed >>> 0) / 2147483648 - 1;
              filtered = filtered * .91 + raw * .09;
              wave = raw * .23 + filtered * .77;
            } else {
              const pitch = cue.hz * (1 + .07 * Math.exp(-t * 9));
              const phase = 2 * Math.PI * (cue.hz * t + cue.hz * .07 * (1-Math.exp(-9*t)) / 9);
              wave = Math.sin(phase) * .78 + Math.sin(phase*1.5) * .22;
            }
            samples.writeInt16LE(Math.max(-32767,Math.min(32767,
              Math.round(wave * envelope * cue.gain * 32767))), i * 2);
          }
          await wav.write(samples, 0, samples.length, 44 + start * 2);
        };
        for (const cue of cues) await writeCue(cue);
        for (const cue of textureCues) {
          // Texture and main tone begin together; additive mix is generated in the same sparse PCM interval.
          // Reconstruct existing sample values and sum only this local event window.
          const begin = Math.round(cue.at * sampleRate),count = Math.round(cue.duration * sampleRate);
          const scratch = Buffer.alloc(count * 2);
          await wav.read(scratch,0,scratch.length,44+begin*2);
          let seed=90091,filtered=0;
          for(let i=0;i<count;i++){
            seed=(Math.imul(seed,1664525)+1013904223)|0;
            const raw=(seed>>>0)/2147483648-1;
            filtered=.88*filtered+.12*raw;
            const t=i/sampleRate;
            const env=Math.max(0,Math.min(1,t/.05,(cue.duration-t)/.18));
            const added=(.21*raw+.79*filtered)*env*cue.gain;
            const current=scratch.readInt16LE(i*2)/32767;
            scratch.writeInt16LE(Math.round(Math.max(-1,Math.min(1,current+added))*32767),i*2);
          }
          await wav.write(scratch,0,scratch.length,44+begin*2);
        }
      } finally {
        await wav.close();
      }
      console.log('EP001_SOUND_DESIGN_V1_CUES '+JSON.stringify(cues));
      console.log('EP001 SFX sparse mono PCM track: '+nSamples+' samples, '+cues.length+
        ' tonal accents, '+textureCues.length+' quiet air textures, no bed or music.');
      await progress(job.renderId, 75);
      await runProcess('ffmpeg', [
        '-hide_banner', '-loglevel', 'error',
        '-i', files[0], '-i', sfxWav,
        '-filter_complex',
        '[0:a]aformat=sample_rates=48000:channel_layouts=stereo[voice];'+
        '[1:a]aformat=sample_rates=48000:channel_layouts=stereo[sfx];'+
        '[voice][sfx]amix=inputs=2:duration=first:normalize=0,'+
        'alimiter=limit=0.80:level=false[episode_sound]',
        '-map','0:v:0', '-map','[episode_sound]',
        '-c:v','copy', '-c:a','aac', '-b:a','192k', '-ar','48000',
        '-t',String(job.durationInFrames/job.fps),
        '-movflags','+faststart', '-y', outputPath,
      ]);
      await progress(job.renderId, 95);
      return;
    }

    if (inputProps.audioMastering === true) {
      if (inputProps.retimeVideoTo30fps === true
          || segments.length !== 1 || files.length !== 1
          || job.fps !== 30 || job.width !== 1920 || job.height !== 1080
          || segments[0].normalizeVideoTo || job.durationInFrames !== 37703) {
        throw new Error('Audio mastering accepts one existing validated EP001 1920x1080 30fps, 37703-frame derived composite only.');
      }
      const audioTargetTruePeak = inputProps.audioMasteringTruePeak === -2 ? -2 : -1.5;
      console.log(`EP001 optional audio mastering: stream-copy video with approved narration, normalize to -16 LUFS, pre-encode true peak target ${audioTargetTruePeak} dBTP.`);
      await progress(job.renderId, 75);
      await runProcess('ffmpeg', [
        '-hide_banner', '-loglevel', 'error', '-i', files[0],
        '-map', '0:v:0', '-map', '0:a:0',
        '-c:v', 'copy',
        '-af', `loudnorm=I=-16:TP=${audioTargetTruePeak}:LRA=11`,
        '-c:a', 'aac', '-ar', '48000', '-b:a', '192k',
        '-movflags', '+faststart', '-y', outputPath,
      ]);
      await progress(job.renderId, 95);
      return;
    }

    if (inputProps.retimeVideoTo30fps === true) {
      if (segments.length !== 1 || files.length !== 1 || job.fps !== 30
          || job.width !== 1920 || job.height !== 1080
          || segments[0].normalizeVideoTo) {
        throw new Error('Safe episode retime accepts one existing 1920x1080 composite at 30fps, with no scene changes.');
      }
      console.log('Repairing approved episode MP4 timestamps: decode every original frame, reset video PTS to frame_index/30, copy original audio without voice regeneration');
      await progress(job.renderId, 75);
      await runProcess('ffmpeg', [
        '-hide_banner', '-loglevel', 'error', '-i', files[0],
        '-map', '0:v:0', '-map', '0:a:0?',
        '-vf', 'setpts=N/(30*TB)', '-fps_mode:v', 'cfr',
        '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18',
        '-pix_fmt', 'yuv420p', '-r', '30',
        ...(inputProps.strictFrameCap === true ? ['-frames:v', String(job.durationInFrames)] : []),
        '-c:a', 'copy', '-movflags', '+faststart', '-y', outputPath,
      ]);
      await progress(job.renderId, 95);
      return;
    }

    const concatFile = path.join(tmpDir, 'concat.txt');
    const manifest = files.map(file => `file '${file.replaceAll("'", "'\\''")}'`).join('\n') + '\n';
    await fs.writeFile(concatFile, manifest, 'utf8');
    await progress(job.renderId, 75);

    await runProcess('ffmpeg', [
      '-hide_banner',
      '-loglevel', 'error',
      '-f', 'concat',
      '-safe', '0',
      '-i', concatFile,
      '-c', 'copy',
      '-movflags', '+faststart',
      '-y',
      outputPath,
    ]);

    await progress(job.renderId, 95);
  } finally {
    await fs.rm(tmpDir, {recursive: true, force: true}).catch(() => undefined);
  }
}

function getServeUrl() {
  if (!serveUrlPromise) {
    serveUrlPromise = (async () => {
      const prebuiltPath = path.join(ENGINE_ROOT, 'build');
      try {
        await fs.access(path.join(prebuiltPath, 'index.html'));
        console.log('Using prebuilt Remotion bundle from image: ' + prebuiltPath);
        return prebuiltPath;
      } catch {
        console.log('Prebuilt Remotion bundle unavailable; bundling source.');
        return bundle({
          entryPoint: ENTRY_POINT,
          rootDir: ENGINE_ROOT,
          publicDir: null,
          enableCaching: true,
          onProgress: value => {
            if (value === 100 || value % 20 < 1) console.log(`Remotion bundle progress=${Math.round(value)}%`);
          },
        });
      }
    })().catch(error => {
      serveUrlPromise = null;
      throw error;
    });
  }
  return serveUrlPromise;
}

async function getFactoryServeUrl() {
  if(!factoryServeUrlPromise){
    factoryServeUrlPromise=(async()=>{
      await fs.access(path.join(FACTORY_BUILD_PATH,'index.html'));
      return FACTORY_BUILD_PATH;
    })().catch(error=>{factoryServeUrlPromise=null;throw error;});
  }
  return factoryServeUrlPromise;
}

async function addShot10V6SoundDesign(job, outputPath, inputProps) {
  if (job.compositionId !== 'EP001-Shot10-SessionCreationShortV6'
    || inputProps.soundDesign !== 'SHOT10_V6_PREMIUM_SFX'
    || Number(job.durationInFrames) !== 2160
    || Number(job.fps) !== 30) {
    throw new Error('Only the standalone 72-second SHOT10 V6 may receive this soundtrack.');
  }
  if (Array.isArray(inputProps.audioClips) && inputProps.audioClips.length) {
    throw new Error('SHOT10 V6 sound pass is SFX-only; approved narration clips may not be replaced.');
  }
  const cues = [
    {s:1.6,f:240,d:.56,g:.32},
    {s:8.45,f:190,d:.75,g:.52},
    {s:10.1,f:760,d:.2,g:.67},
    {s:13.0,f:900,d:.18,g:.63},
    {s:17.2,f:1140,d:.27,g:.72},
    {s:20.8,f:470,d:.45,g:.36},
    {s:26.5,f:190,d:.9,g:.56},
    {s:29.2,f:735,d:.23,g:.72},
    {s:33.1,f:880,d:.23,g:.7},
    {s:37.8,f:1090,d:.25,g:.72},
    {s:42.0,f:520,d:.56,g:.48},
    {s:47.2,f:250,d:.72,g:.48},
    {s:51.5,f:820,d:.22,g:.65},
    {s:54.7,f:980,d:.22,g:.71},
    {s:57.7,f:1250,d:.4,g:.75},
    {s:61.4,f:230,d:.74,g:.52},
    {s:64.4,f:580,d:.3,g:.65},
    {s:68.9,f:980,d:.44,g:.76},
    {s:71.2,f:540,d:.46,g:.37},
  ];
  const newAudioFile = outputPath.replace(/\.mp4$/, '-audio.mp4');
  const args = ['-hide_banner','-loglevel','error','-i',outputPath,
    '-f','lavfi','-i','anoisesrc=color=pink:amplitude=0.08:sample_rate=24000:duration=72'];
  for (const cue of cues) {
    args.push('-f','lavfi','-i','sine=frequency='+cue.f+':sample_rate=24000:duration='+cue.d);
  }
  const chain = [
    '[1:a]lowpass=f=480,volume=0.095,afade=t=in:st=0:d=2,afade=t=out:st=70:d=2[bed]',
  ];
  cues.forEach((cue, i) => {
    const fadeOutStart = Math.max(.05, cue.d-.16);
    const fadeDuration = Math.min(.14, cue.d-.05);
    chain.push('['+(i+2)+':a]volume='+cue.g+',afade=t=in:st=0:d=0.025,afade=t=out:st='+fadeOutStart+':d='+fadeDuration+',adelay='+Math.round(cue.s*1000)+':all=1[c'+i+']');
  });
  const labels = ['[bed]', ...cues.map((_, i) => '[c'+i+']')].join('');
  chain.push(labels+'amix=inputs='+(cues.length+1)+':duration=first:normalize=0,alimiter=limit=0.88:level=false[sound]');
  args.push('-filter_complex',chain.join(';'),'-map','0:v:0','-map','[sound]',
    '-c:v','copy','-c:a','aac','-b:a','144k','-ar','48000',
    '-t','72','-movflags','+faststart','-y',newAudioFile);
  try {
    console.log('Mixing SHOT10 V6 original cinematic sound design with '+cues.length+' cues.');
    await runProcess('ffmpeg',args);
    const stat = await fs.stat(newAudioFile);
    if (stat.size <= 1000000) throw new Error('Sound design output unexpectedly small');
    await fs.rename(newAudioFile,outputPath);
    console.log('SHOT10 V6 soundtrack mux complete: '+stat.size+' bytes');
  } finally {
    await fs.rm(newAudioFile,{force:true}).catch(()=>undefined);
  }
}

async function readEp002SelectedVoice(job, inputProps) {
  if(job.compositionId==='EP002-SHOT01-DRAFT'){
    const beats=inputProps.beatStartFrames;
    const duration=Number(job.durationInFrames);
    if(job.profile!=='REVIEW'||Number(job.width)!==1920||Number(job.height)!==1080
       ||Number(job.fps)!==30
       ||inputProps.visualStylePass!=='SHOT01_SHOT02_UNIFIED_V2'
       ||inputProps.timingMode!=='ELEVENLABS_CHARACTER_TIMESTAMPS'
       ||!Array.isArray(beats)||beats.length!==5
       ||beats.some((n,i)=>!Number.isInteger(n)||n<0||n>=duration
           ||i>0&&n<=beats[i-1])
       ||duration-beats[4]<15
       ||!/^[a-f0-9]{40}$/.test(FACTORY_SOURCE_SHA)
       ||inputProps.expectedSourceCommit!==FACTORY_SOURCE_SHA)
      throw Error('SHOT01_UNIFIED_REAL_TAKE_FIVE_CUES_1080P_SOURCE_MISMATCH');
  }
  if (!['EP002-SHOT01-DRAFT','EP002-SHOT02-CANDIDATE',
         'EP002-SHOT03-CANDIDATE','EP002-SHOT04-CANDIDATE','EP002-SHOT05-CANDIDATE','EP002-SHOT06-CANDIDATE','EP002-SHOT07-CANDIDATE','EP002-SHOT08-CANDIDATE','EP002-SHOT09-CANDIDATE','EP002-SHOT10-CANDIDATE','EP002-SHOT11-CANDIDATE'].includes(job.compositionId)) return null;
  if (['EP002-SHOT02-CANDIDATE','EP002-SHOT03-CANDIDATE','EP002-SHOT04-CANDIDATE','EP002-SHOT05-CANDIDATE','EP002-SHOT06-CANDIDATE','EP002-SHOT07-CANDIDATE','EP002-SHOT08-CANDIDATE','EP002-SHOT09-CANDIDATE','EP002-SHOT10-CANDIDATE','EP002-SHOT11-CANDIDATE'].includes(job.compositionId)
      && (!/^[a-f0-9]{40}$/.test(FACTORY_SOURCE_SHA)
        || inputProps.expectedSourceCommit !== FACTORY_SOURCE_SHA)) {
    throw new Error(job.compositionId === 'EP002-SHOT02-CANDIDATE'
      ?'SHOT02_WORKER_SOURCE_COMMIT_MISMATCH'
      :job.compositionId === 'EP002-SHOT03-CANDIDATE'
        ?'SHOT03_WORKER_SOURCE_COMMIT_MISMATCH'
        :job.compositionId === 'EP002-SHOT04-CANDIDATE'
          ?'SHOT04_WORKER_SOURCE_COMMIT_MISMATCH'
          :job.compositionId === 'EP002-SHOT05-CANDIDATE'
            ?'SHOT05_WORKER_SOURCE_COMMIT_MISMATCH'
            :job.compositionId === 'EP002-SHOT06-CANDIDATE'
              ?'SHOT06_WORKER_SOURCE_COMMIT_MISMATCH'
              :job.compositionId === 'EP002-SHOT07-CANDIDATE'
                ?'SHOT07_WORKER_SOURCE_COMMIT_MISMATCH'
                :job.compositionId === 'EP002-SHOT08-CANDIDATE'
                   ?'SHOT08_WORKER_SOURCE_COMMIT_MISMATCH'
                   :job.compositionId==='EP002-SHOT09-CANDIDATE'
                     ?'SHOT09_WORKER_SOURCE_COMMIT_MISMATCH'
                     :job.compositionId==='EP002-SHOT10-CANDIDATE'
                       ?'SHOT10_WORKER_SOURCE_COMMIT_MISMATCH'
                       :'SHOT11_WORKER_SOURCE_COMMIT_MISMATCH');
  }
  const takeId = String(inputProps.voiceTakeId || '');
  const revision = Number(inputProps.scriptRevision);
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/.test(takeId)
      || !Number.isInteger(revision) || revision < 1
      || Number(job.fps) !== 30) {
    throw new Error('EP002 render does not have a valid saved voice take and script revision.');
  }
  await leaseClient.refresh();
  const voice = await workloadTokens.request(
    `${BACKEND_URL}/api/v1/remotion/renders/worker/${job.renderId}/ep002-selected-voice`, {
      method: 'GET', headers: headers(),
    },
  );
  if (!voice.ok) {
    const details = await voice.text();
    throw new Error('Worker-owned EP002 selected voice is unavailable: '
      +voice.status+' '+details.slice(0,400));
  }
  const audioBytes = Buffer.from(await voice.arrayBuffer());
  if(audioBytes.length < 512 || audioBytes.length > 24*1024*1024)
    throw new Error('EP002 selected voice is empty or larger than 24 MB.');
  return audioBytes;
}

async function muxEp002SelectedVoice(job, videoPath, inputProps) {
  if (!['EP002-SHOT01-DRAFT','EP002-SHOT02-CANDIDATE',
         'EP002-SHOT03-CANDIDATE','EP002-SHOT04-CANDIDATE','EP002-SHOT05-CANDIDATE','EP002-SHOT06-CANDIDATE','EP002-SHOT07-CANDIDATE','EP002-SHOT08-CANDIDATE','EP002-SHOT09-CANDIDATE','EP002-SHOT10-CANDIDATE','EP002-SHOT11-CANDIDATE'].includes(job.compositionId)) return;
  const editorialPlan=validateShot02EditorialPlan(job,inputProps);
  const audioBytes = await readEp002SelectedVoice(job, inputProps);
  const audioPath = path.join(os.tmpdir(),`media-os-ep002-${job.renderId}.mp3`);
  const muxPath = path.join(os.tmpdir(),`media-os-ep002-${job.renderId}-mux.mp4`);
  try {
    await fs.writeFile(audioPath,audioBytes);
    const args=['-hide_banner','-loglevel','error','-xerror','-nostdin',
      '-i',videoPath,'-i',audioPath];
    if(editorialPlan){
      args.push('-filter_complex',buildShot02EditorialAudioFilter(editorialPlan),
        '-map','0:v:0','-map','[editorial]');
      console.log(`SHOT02_EDITORIAL_VOICE_PAUSES sourceFrames=${editorialPlan.sourceFrames} addedFrames=${editorialPlan.addedFrames} outputFrames=${editorialPlan.outputFrames} noTts=true`);
    }else if(job.compositionId==='EP002-SHOT02-CANDIDATE'
      && inputProps.postVoiceHoldFrames===60){
      const source=Number(inputProps.sourceDurationInFrames);
      if(!Number.isInteger(source)||source<6
        ||Number(job.durationInFrames)!==source+60
        ||inputProps.timingMode!=='ELEVENLABS_CHARACTER_TIMESTAMPS')
        throw Error('SHOT02_60_FRAME_VISUAL_HOLD_INVALID');
      args.push('-filter_complex',
        '[1:a]aresample=48000,apad=whole_dur='+String(job.durationInFrames/job.fps)+'[voicehold]',
        '-map','0:v:0','-map','[voicehold]');
      console.log('SHOT02_POST_VOICE_VISUAL_HOLD frames=60 existingTake=true noTts=true');
    }else{
      args.push('-map','0:v:0','-map','1:a:0');
    }
    args.push('-c:v','copy','-c:a','aac','-b:a','192k','-ar','48000',
      '-t',String(job.durationInFrames/job.fps),
      '-movflags','+faststart','-y',muxPath);
    await runProcess('ffmpeg',args);
    await fs.rename(muxPath,videoPath);
  } finally {
    await fs.rm(audioPath,{force:true}).catch(()=>undefined);
    await fs.rm(muxPath,{force:true}).catch(()=>undefined);
  }
}

async function muxEp004Shot01ApprovedVoice(job,videoPath,inputProps){
  if(job.compositionId!=='EP004-SHOT01-ORDINARY-WORKDAY-V1-VISUAL')return;
  if(!/^[a-f0-9]{40}$/.test(FACTORY_SOURCE_SHA)
      ||inputProps.expectedSourceCommit!==FACTORY_SOURCE_SHA
      ||inputProps.previewOnly!==false
      ||inputProps.directorCpuApproved!==true
      ||Number(job.fps)!==30
      ||Number(job.width)!==1920||Number(job.height)!==1080
      ||Object.keys(inputProps.cueFrames??{}).length!==8)
    throw Error('EP004_APPROVED_CUE_SOURCE_OR_WORKER_MISMATCH');
  const response=await workloadTokens.request(
    `${BACKEND_URL}/api/v1/remotion/renders/worker/${job.renderId}/ep004-shot01-selected-voice`,
    {method:'GET',headers:headers({'X-Media-OS-Worker-Source-Sha':FACTORY_SOURCE_SHA})});
  if(!response.ok){
    const failure=await response.text();
    throw Error('EP004_SELECTED_TAKE_NOT_AVAILABLE '+response.status+' '+failure.slice(0,280));
  }
  const bytes=Buffer.from(await response.arrayBuffer());
  if(bytes.length<512||bytes.length>24*1024*1024)
    throw Error('EP004_SELECTED_TAKE_SIZE_INVALID');
  const audioFile=path.join(os.tmpdir(),`ep004-shot01-${job.renderId}-take`);
  const output=path.join(os.tmpdir(),`ep004-shot01-${job.renderId}-mux.mp4`);
  try{
    await fs.writeFile(audioFile,bytes);
    const duration=Number(job.durationInFrames)/30;
    await runProcess('ffmpeg',['-hide_banner','-loglevel','error','-xerror',
      '-nostdin','-i',videoPath,'-i',audioFile,
      '-filter_complex',
      '[1:a]aresample=48000,adelay=2000:all=1,apad=whole_dur='+duration+'[approved]',
      '-map','0:v:0','-map','[approved]',
      '-c:v','copy','-c:a','aac','-b:a','192k','-ar','48000',
      '-t',String(duration),'-movflags','+faststart','-y',output]);
    const qa=await probeFactoryMedia(output);
    if(qa.width!==1920||qa.height!==1080
        ||Math.abs(qa.duration-duration)>0.55)
      throw Error('EP004_SHOT01_FINAL_MP4_DIMENSION_OR_DURATION_QA_FAILED');
    await fs.rename(output,videoPath);
    console.log('EP004_SHOT01_REAL_APPROVED_TAKE_MUX_QA_PASS renderId='+job.renderId+
      ' duration='+duration+' source='+FACTORY_SOURCE_SHA);
  }finally{
    await fs.rm(audioFile,{force:true}).catch(()=>undefined);
    await fs.rm(output,{force:true}).catch(()=>undefined);
  }
}

async function fetchEp004Shot02ApprovedVoice(job,inputProps){
  if(job.compositionId!=='EP004-SHOT02-TWO-GATEWAYS-V1-VISUAL')throw Error('EP004_SHOT02_COMPOSITION_NOT_AUTHORIZED');
  if(!/^[a-f0-9]{40}$/.test(FACTORY_SOURCE_SHA)
      ||inputProps.expectedSourceCommit!==FACTORY_SOURCE_SHA
      ||inputProps.previewOnly!==false
      ||inputProps.directorCpuApproved!==true
      ||Number(job.fps)!==30
      ||Number(job.width)!==1920||Number(job.height)!==1080
      ||!Array.isArray(inputProps.verifiedCues)
      ||inputProps.verifiedCues.length<2||inputProps.verifiedCues.length>40
      ||inputProps.shotKey!=='SHOT02')
    throw Error('EP004_APPROVED_CUE_SOURCE_OR_WORKER_MISMATCH');
  await leaseClient.refresh();
  const response=await workloadTokens.request(
    `${BACKEND_URL}/api/v1/remotion/renders/worker/${job.renderId}/ep004-shot02-selected-voice`,
    {method:'GET',headers:headers({'X-Media-OS-Worker-Source-Sha':FACTORY_SOURCE_SHA})});
  if(!response.ok){
    const failure=await response.text();
    throw Error('EP004_SELECTED_TAKE_NOT_AVAILABLE '+response.status+' '+failure.slice(0,280));
  }
  const bytes=Buffer.from(await response.arrayBuffer());
  if(bytes.length<512||bytes.length>24*1024*1024)
    throw Error('EP004_SELECTED_TAKE_SIZE_INVALID');
  return bytes;
}

async function muxEp004Shot02ApprovedVoice(job,videoPath,inputProps){
  if(job.compositionId!=='EP004-SHOT02-TWO-GATEWAYS-V1-VISUAL')return;
  const bytes=await fetchEp004Shot02ApprovedVoice(job,inputProps);
  const audioFile=path.join(os.tmpdir(),`ep004-shot02-${job.renderId}-take`);
  const output=path.join(os.tmpdir(),`ep004-shot02-${job.renderId}-mux.mp4`);
  try{
    await fs.writeFile(audioFile,bytes);
    const duration=Number(job.durationInFrames)/30;
    await runProcess('ffmpeg',['-hide_banner','-loglevel','error','-xerror',
      '-nostdin','-i',videoPath,'-i',audioFile,
      '-filter_complex',
      '[1:a]aresample=48000,adelay=2000:all=1,apad=whole_dur='+duration+'[approved]',
      '-map','0:v:0','-map','[approved]',
      '-c:v','copy','-c:a','aac','-b:a','192k','-ar','48000',
      '-t',String(duration),'-movflags','+faststart','-y',output]);
    const qa=await probeFactoryMedia(output);
    if(qa.width!==1920||qa.height!==1080
        ||Math.abs(qa.duration-duration)>0.55)
      throw Error('EP004_SHOT02_FINAL_MP4_DIMENSION_OR_DURATION_QA_FAILED');
    await fs.rename(output,videoPath);
    console.log('EP004_SHOT02_REAL_APPROVED_TAKE_MUX_QA_PASS renderId='+job.renderId+
      ' duration='+duration+' source='+FACTORY_SOURCE_SHA);
  }finally{
    await fs.rm(audioFile,{force:true}).catch(()=>undefined);
    await fs.rm(output,{force:true}).catch(()=>undefined);
  }
}


const EP004_SHOT03_REAL='EP004-SHOT03-LIVING-GATEWAYS-V1-VISUAL';

async function fetchEp004Shot03ApprovedVoice(job,inputProps){
  if(job.compositionId!==EP004_SHOT03_REAL)throw Error('EP004_SHOT03_COMPOSITION_NOT_AUTHORIZED');
  if(!/^[a-f0-9]{40}$/.test(FACTORY_SOURCE_SHA)
     ||inputProps.expectedSourceCommit!==FACTORY_SOURCE_SHA
     ||inputProps.previewOnly!==false||inputProps.directorCpuApproved!==true
     ||inputProps.shotKey!=='SHOT03'||inputProps.episodeKey!=='EP004'
     ||Number(job.fps)!==30||Number(job.width)!==1920||Number(job.height)!==1080
     ||!Array.isArray(inputProps.verifiedCues)
     ||inputProps.verifiedCues.length<2||inputProps.verifiedCues.length>40
     ||!Number.isInteger(inputProps.novemberFrame)
     ||!Number.isInteger(inputProps.backwardFrame)
     ||inputProps.previousRenderId!=='20758da0-46f9-4973-9ef8-ec93eb437a5a'
     ||inputProps.previousSourceCommit!=='714d7c31affb84793780eee42bc5062387b069a7'
     ||inputProps.previousFrameCount!==2124
     ||inputProps.previousLastEncodedFrame!==2123
     ||inputProps.worldStartFrame!==4123
     ||!/^[a-f0-9]{64}$/.test(inputProps.previousVideoSha256||''))
    throw Error('EP004_SHOT03_CURRENT_APPROVED_TAKE_60F_SOURCE_GUARD_FAILED');
  await leaseClient.refresh();
  const res=await workloadTokens.request(
    BACKEND_URL+'/api/v1/remotion/renders/worker/'+job.renderId+'/ep004-shot03-selected-voice',
    {method:'GET',headers:headers({'X-Media-OS-Worker-Source-Sha':FACTORY_SOURCE_SHA})});
  if(!res.ok)throw Error('EP004_SHOT03_SELECTED_TAKE_NOT_AVAILABLE_'+res.status+' '+(await res.text()).slice(0,200));
  const bytes=Buffer.from(await res.arrayBuffer());
  if(bytes.length<512||bytes.length>24*1024*1024)
    throw Error('EP004_SHOT03_APPROVED_VOICE_BYTES_OUTSIDE_BOUND');
  return bytes;
}

async function preflightEp004Shot03PreviousVideo(job,inputProps,directory){
  if(job.compositionId!==EP004_SHOT03_REAL)throw Error('NOT_SHOT03');
  await leaseClient.refresh();
  const response=await workloadTokens.request(
    BACKEND_URL+'/api/v1/remotion/renders/worker/'+job.renderId+
      '/ep004-shot03-previous-video',
    {method:'GET',headers:headers({'X-Media-OS-Worker-Source-Sha':FACTORY_SOURCE_SHA})});
  if(!response.ok)throw Error('SHOT03_PREDECESSOR_SOURCE_UNAVAILABLE_'+response.status+' '+(await response.text()).slice(0,220));
  const announced=Number(response.headers.get('content-length')||0);
  if(announced>33554432)throw Error('SHOT03_PREDECESSOR_EXCEEDS_SOURCE_BYTES_LIMIT');
  const bytes=Buffer.from(await response.arrayBuffer());
  if(bytes.length<1024||bytes.length>33554432)
    throw Error('SHOT03_PREDECESSOR_MP4_BYTES_UNSAFE');
  const sha=createHash('sha256').update(bytes).digest('hex');
  if(sha!==inputProps.previousVideoSha256)
    throw Error('SHOT03_PREDECESSOR_ACTUAL_SOURCE_SHA256_NOT_MATCHED');
  const source=path.join(directory,'verified-shot02-2124-frames.mp4');
  const last=path.join(directory,'source-last-real-encoded-frame-2123.png');
  await fs.writeFile(source,bytes,{flag:'wx'});
  const checked=await captureNative('ffprobe',[
    '-v','error','-select_streams','v:0','-count_frames',
    '-show_entries','stream=nb_read_frames,width,height,r_frame_rate',
    '-of','json',source]);
  const tracks=JSON.parse(checked.stdout).streams;
  const stream=tracks?.[0];
  if(!stream||stream.width!==1920||stream.height!==1080
     ||stream.r_frame_rate!=='30/1'||Number(stream.nb_read_frames)!==2124)
    throw Error('SHOT03_PREDECESSOR_ACTUAL_2124_DECODED_FRAMES_OR_FORMAT_CHANGED');
  await runProcess('ffmpeg',['-hide_banner','-loglevel','error','-xerror','-nostdin',
    '-i',source,'-vf','select=eq(n\\,2123)','-frames:v','1','-vsync','0','-y',last]);
  const png=await fs.readFile(last);
  if(png.length<10000||png.length>9000000)
    throw Error('SHOT03_PREDECESSOR_REAL_LAST_FRAME_PNG_INVALID');
  inputProps.previousLastFrameDataUri='data:image/png;base64,'+png.toString('base64');
  console.log('EP004_SHOT03_REAL_SHOT02_FRAME2123_PRECPU_SHA_PASS renderId='+job.renderId+
    ' sourceBytes='+bytes.length+' lastFrameBytes='+png.length);
  return {last,source};
}

async function verifyEp004Shot03SeamAndMotion(job,outputPath,sourcePNG,directory){
  if(job.compositionId!==EP004_SHOT03_REAL)return;
  const first=path.join(directory,'shot03-first-encoded-frame0.png');
  await runProcess('ffmpeg',['-hide_banner','-loglevel','error','-xerror','-nostdin',
    '-i',outputPath,'-vf','select=eq(n\\,0)','-frames:v','1',
    '-vsync','0','-y',first]);
  const actual=await captureNative('ffmpeg',['-hide_banner','-i',sourcePNG,
    '-i',first,'-filter_complex','[0:v][1:v]psnr',
    '-f','null','-']);
  const m=actual.stderr.match(/average:([0-9.]+)/);
  const psnr=m?Number(m[1]):NaN;
  if(!Number.isFinite(psnr)||psnr<34)
    throw Error('EP004_SHOT03_FRAME0_ACTUAL_ENCODED_SEAM_PSNR_FAILED');
  const frames=await captureNative('ffmpeg',['-hide_banner','-loglevel','error',
    '-i',outputPath,'-map','0:v:0','-an','-frames:v','30',
    '-f','framemd5','-']);
  const hashes=frames.stdout.split('\n').filter(v=>v&&!v.startsWith('#'))
    .map(v=>v.split(',').at(-1)?.trim()).filter(Boolean);
  if(hashes.length!==30||new Set(hashes).size<5)
    throw Error('EP004_SHOT03_FRAME1_TO30_STATIC_PREDECESSOR_COVER_PROHIBITED');
  console.log('EP004_SHOT03_ACTUAL_SEAM_PSNR='+psnr.toFixed(2)+
    ' animatedUniqueFrames='+new Set(hashes).size+' renderId='+job.renderId);
}

async function muxEp004Shot03ApprovedVoice(job,videoPath,inputProps){
  if(job.compositionId!==EP004_SHOT03_REAL)return;
  const bytes=await fetchEp004Shot03ApprovedVoice(job,inputProps);
  const audioFile=path.join(os.tmpdir(),'ep004-shot03-'+job.renderId+'-take');
  const mux=path.join(os.tmpdir(),'ep004-shot03-'+job.renderId+'-mux.mp4');
  try{
    await fs.writeFile(audioFile,bytes,{flag:'wx'});
    const duration=Number(job.durationInFrames)/30;
    await runProcess('ffmpeg',['-hide_banner','-loglevel','error','-xerror',
      '-nostdin','-i',videoPath,'-i',audioFile,
      '-filter_complex',
      '[1:a]aresample=48000,adelay=2000:all=1,apad=whole_dur='+duration+'[approved]',
      '-map','0:v:0','-map','[approved]','-c:v','copy',
      '-c:a','aac','-b:a','192k','-ar','48000','-t',String(duration),
      '-movflags','+faststart','-y',mux]);
    const qa=await probeFactoryMedia(mux);
    if(qa.width!==1920||qa.height!==1080
      ||Math.abs(qa.duration-duration)>.55)
      throw Error('EP004_SHOT03_APPROVED_TAKE_AUDIO_DELAY_MP4_QA_FAILED');
    await fs.rename(mux,videoPath);
    console.log('EP004_SHOT03_REAL_APPROVED_TAKE_60F_SILENCE_MUX_QA_PASS renderId='+
      job.renderId+' duration='+duration+' source='+FACTORY_SOURCE_SHA);
  }finally{
    await fs.rm(audioFile,{force:true}).catch(()=>undefined);
    await fs.rm(mux,{force:true}).catch(()=>undefined);
  }
}

const EP004_SHOT04_REAL='EP004-SHOT04-CONTINUOUS-GATEWAYS-V1-VISUAL';

async function fetchEp004Shot04ApprovedVoice(job,inputProps){
  if(job.compositionId!==EP004_SHOT04_REAL)
    throw Error('EP004_SHOT04_UNAUTHORIZED_COMPOSITION');
  if(!/^[a-f0-9]{40}$/.test(FACTORY_SOURCE_SHA)
    ||inputProps.expectedSourceCommit!==FACTORY_SOURCE_SHA
    ||inputProps.episodeKey!=='EP004'||inputProps.shotKey!=='SHOT04'
    ||inputProps.previewOnly!==false||inputProps.directorCpuApproved!==true
    ||inputProps.breathFrames!==72
    ||Number(job.fps)!==30||Number(job.width)!==1920||Number(job.height)!==1080
    ||!Array.isArray(inputProps.verifiedCues)||inputProps.verifiedCues.length<2
    ||inputProps.verifiedCues.length>40
    ||!Number.isInteger(inputProps.previousFrameCount)
    ||inputProps.previousFrameCount<600||inputProps.previousFrameCount>9000
    ||inputProps.previousLastEncodedFrame!==inputProps.previousFrameCount-1
    ||inputProps.worldStartFrame!==4123+inputProps.previousLastEncodedFrame
    ||!/^[a-f0-9]{64}$/.test(inputProps.previousVideoSha256||''))
    throw Error('EP004_SHOT04_AUTHENTIC_LOCKED_SOURCE_AND_APPROVED_TAKE_REQUIRED');
  await leaseClient.refresh();
  const res=await workloadTokens.request(
    BACKEND_URL+'/api/v1/remotion/renders/worker/'+job.renderId+
      '/ep004-shot04-selected-voice',
    {method:'GET',headers:headers({'X-Media-OS-Worker-Source-Sha':FACTORY_SOURCE_SHA})});
  if(!res.ok)throw Error('EP004_SHOT04_APPROVED_CURRENT_TAKE_UNAVAILABLE_'+res.status+
    ' '+(await res.text()).slice(0,180));
  const bytes=Buffer.from(await res.arrayBuffer());
  if(bytes.length<512||bytes.length>24*1024*1024)
    throw Error('EP004_SHOT04_APPROVED_AUDIO_BYTES_OUTSIDE_BOUND');
  return bytes;
}

async function preflightEp004Shot04PreviousVideo(job,inputProps,directory){
  if(job.compositionId!==EP004_SHOT04_REAL)throw Error('SHOT04_WRONG_COMPOSITION');
  await leaseClient.refresh();
  const res=await workloadTokens.request(
    BACKEND_URL+'/api/v1/remotion/renders/worker/'+job.renderId+
       '/ep004-shot04-previous-video',
    {method:'GET',headers:headers({'X-Media-OS-Worker-Source-Sha':FACTORY_SOURCE_SHA})});
  if(!res.ok)throw Error('SHOT04_LOCKED_SHOT03_MP4_UNAVAILABLE_'+res.status+
      ' '+(await res.text()).slice(0,210));
  const length=Number(res.headers.get('content-length')||0);
  if(length>134217728)throw Error('SHOT04_PREDECESSOR_SIZE_CAP_EXCEEDED');
  const bytes=Buffer.from(await res.arrayBuffer());
  if(bytes.length<1024||bytes.length>134217728)
    throw Error('SHOT04_PREVIOUS_MP4_BYTES_INVALID');
  const hash=createHash('sha256').update(bytes).digest('hex');
  if(hash!==inputProps.previousVideoSha256)
    throw Error('SHOT04_LOCKED_PREDECESSOR_SHA256_CHANGED');
  const source=path.join(directory,'locked-shot03.mp4');
  const last=path.join(directory,'locked-shot03-encoded-last.png');
  await fs.writeFile(source,bytes,{flag:'wx'});
  const checked=await captureNative('ffprobe',[
    '-v','error','-select_streams','v:0','-count_frames',
    '-show_entries','stream=nb_read_frames,width,height,r_frame_rate',
    '-of','json',source]);
  const stream=JSON.parse(checked.stdout).streams?.[0];
  if(!stream||stream.width!==1920||stream.height!==1080
    ||stream.r_frame_rate!=='30/1'
    ||Number(stream.nb_read_frames)!==inputProps.previousFrameCount)
    throw Error('SHOT04_PREDECESSOR_1080P30_AND_EXACT_FRAMES_CHANGED');
  await runProcess('ffmpeg',['-hide_banner','-loglevel','error','-xerror','-nostdin',
    '-i',source,'-vf','select=eq(n\\,'+inputProps.previousLastEncodedFrame+')',
    '-frames:v','1','-vsync','0','-y',last]);
  const png=await fs.readFile(last);
  if(png.length<10000||png.length>9000000)
    throw Error('SHOT04_AUTHENTIC_PREDECESSOR_FRAME_PNG_UNAVAILABLE');
  inputProps.previousLastFrameDataUri='data:image/png;base64,'+png.toString('base64');
  console.log('EP004_SHOT04_PREVIOUS_LOCKED_SHOT03_SHA256_LAST_FRAME_QA_PASS renderId='+
      job.renderId+' previousFrames='+stream.nb_read_frames);
  return {source,last};
}

async function muxEp004Shot04ApprovedVoice(job,videoPath,inputProps){
  if(job.compositionId!==EP004_SHOT04_REAL)return;
  const bytes=await fetchEp004Shot04ApprovedVoice(job,inputProps);
  const audio=path.join(os.tmpdir(),'ep004-shot04-'+job.renderId+'-approved-take');
  const muxed=path.join(os.tmpdir(),'ep004-shot04-'+job.renderId+'-mux.mp4');
  try{
    await fs.writeFile(audio,bytes,{flag:'wx'});
    const duration=Number(job.durationInFrames)/30;
    await runProcess('ffmpeg',['-hide_banner','-loglevel','error','-xerror',
      '-nostdin','-i',videoPath,'-i',audio,
      '-filter_complex',
      '[1:a]aresample=48000,adelay=2400:all=1,apad=whole_dur='+duration+'[approved]',
      '-map','0:v:0','-map','[approved]','-c:v','copy',
      '-c:a','aac','-b:a','192k','-ar','48000',
      '-t',String(duration),'-movflags','+faststart','-y',muxed]);
    const qa=await probeFactoryMedia(muxed);
    if(qa.width!==1920||qa.height!==1080||
       Math.abs(qa.duration-duration)>.55)
      throw Error('SHOT04_FINAL_AAC_H264_DIMENSIONS_OR_DURATION_INVALID');
    const silence=await captureNative('ffmpeg',[
      '-hide_banner','-nostdin','-i',muxed,'-t','1.8','-vn',
      '-af','volumedetect','-f','null','-']);
    const peak=silence.stderr.match(/max_volume:\s*(-?[0-9.]+) dB/);
    if(peak&&Number(peak[1])>-55)
      throw Error('SHOT04_FIRST_1_8_SECONDS_MUST_REMAIN_VOICE_SILENT');
    await fs.rename(muxed,videoPath);
    console.log('EP004_SHOT04_REAL_APPROVED_TAKE_72F_AUDIO_DELAY_QA_PASS renderId='+
      job.renderId+' duration='+duration);
  }finally{
    await fs.rm(audio,{force:true}).catch(()=>undefined);
    await fs.rm(muxed,{force:true}).catch(()=>undefined);
  }
}

async function verifyEp004Shot04SeamAndMotion(job,outputPath,lastPNG,directory){
  if(job.compositionId!==EP004_SHOT04_REAL)return;
  const first=path.join(directory,'shot04-first-real-frame.png');
  await runProcess('ffmpeg',['-hide_banner','-loglevel','error','-xerror','-nostdin',
      '-i',outputPath,'-vf','select=eq(n\\,0)',
      '-frames:v','1','-vsync','0','-y',first]);
  const compared=await captureNative('ffmpeg',[
      '-hide_banner','-i',lastPNG,'-i',first,
      '-filter_complex','[0:v][1:v]psnr','-f','null','-']);
  const matched=compared.stderr.match(/average:([0-9.]+)/);
  const psnr=matched?Number(matched[1]):NaN;
  if(!Number.isFinite(psnr)||psnr<34)
    throw Error('SHOT04_PREVIOUS_LAST_FRAME_TO_NEW_FIRST_FRAME_SEAM_FAILED');
  const frames=await captureNative('ffmpeg',[
      '-hide_banner','-loglevel','error','-i',outputPath,
      '-map','0:v:0','-an','-frames:v','30','-f','framemd5','-']);
  const hashes=frames.stdout.split('\n').filter(v=>v&&!v.startsWith('#'))
      .map(v=>v.split(',').at(-1)?.trim()).filter(Boolean);
  if(hashes.length!==30||new Set(hashes).size<5)
    throw Error('SHOT04_LIVING_ARCHITECTURE_FIRST_30_FRAMES_MUST_MOVE');
  console.log('EP004_SHOT04_SEAM_PSNR='+psnr.toFixed(2)+
      ' animatedFrames='+new Set(hashes).size+' renderId='+job.renderId);
}

const EP004_SHOT05_REAL=EP004_SHOT05_COMPOSITION;

async function fetchEp004Shot05ApprovedVoice(job,inputProps){
  if(job.compositionId!==EP004_SHOT05_REAL)
    throw Error('EP004_SHOT05_UNAUTHORIZED_COMPOSITION');
  if(!/^[a-f0-9]{40}$/.test(FACTORY_SOURCE_SHA)
    ||inputProps.expectedSourceCommit!==FACTORY_SOURCE_SHA
    ||inputProps.episodeKey!=='EP004'||inputProps.shotKey!=='SHOT05'
    ||inputProps.previewOnly!==false||inputProps.directorCpuApproved!==true
    ||inputProps.breathFrames!==72
    ||Number(job.fps)!==30||Number(job.width)!==1920||Number(job.height)!==1080
    ||!Array.isArray(inputProps.verifiedCues)||inputProps.verifiedCues.length<2
    ||inputProps.verifiedCues.length>40
    ||!Number.isInteger(inputProps.previousFrameCount)
    ||inputProps.previousFrameCount<600||inputProps.previousFrameCount>9000
    ||inputProps.previousLastEncodedFrame!==inputProps.previousFrameCount-1
    ||inputProps.worldStartFrame!==inputProps.previousWorldStartFrame+inputProps.previousLastEncodedFrame
    ||!inputProps.previousShot04Props
    ||inputProps.previousShot04Props.expectedSourceCommit!==inputProps.previousSourceCommit
    ||inputProps.previousShot04Props.worldStartFrame!==inputProps.previousWorldStartFrame
    ||inputProps.previousShot04Props.durationInFrames!==inputProps.previousFrameCount
    ||!/^[a-f0-9]{64}$/.test(inputProps.previousVideoSha256||''))
    throw Error('EP004_SHOT05_AUTHENTIC_LOCKED_SOURCE_AND_APPROVED_TAKE_REQUIRED');
  await leaseClient.refresh();
  const res=await workloadTokens.request(
    BACKEND_URL+'/api/v1/remotion/renders/worker/'+job.renderId+
      '/ep004-shot05-selected-voice',
    {method:'GET',headers:headers({'X-Media-OS-Worker-Source-Sha':FACTORY_SOURCE_SHA})});
  if(!res.ok)throw Error('EP004_SHOT05_APPROVED_CURRENT_TAKE_UNAVAILABLE_'+res.status+
    ' '+(await res.text()).slice(0,180));
  const bytes=Buffer.from(await res.arrayBuffer());
  if(bytes.length<512||bytes.length>24*1024*1024)
    throw Error('EP004_SHOT05_APPROVED_AUDIO_BYTES_OUTSIDE_BOUND');
  return bytes;
}

async function preflightEp004Shot05PreviousVideo(job,inputProps,directory){
  if(job.compositionId!==EP004_SHOT05_REAL)throw Error('SHOT05_WRONG_COMPOSITION');
  await leaseClient.refresh();
  const res=await workloadTokens.request(
    BACKEND_URL+'/api/v1/remotion/renders/worker/'+job.renderId+
       '/ep004-shot05-previous-video',
    {method:'GET',headers:headers({'X-Media-OS-Worker-Source-Sha':FACTORY_SOURCE_SHA})});
  if(!res.ok)throw Error('SHOT05_LOCKED_SHOT04_MP4_UNAVAILABLE_'+res.status+
      ' '+(await res.text()).slice(0,210));
  const length=Number(res.headers.get('content-length')||0);
  if(length>134217728)throw Error('SHOT05_PREDECESSOR_SIZE_CAP_EXCEEDED');
  const bytes=Buffer.from(await res.arrayBuffer());
  if(bytes.length<1024||bytes.length>134217728)
    throw Error('SHOT05_PREVIOUS_MP4_BYTES_INVALID');
  const hash=createHash('sha256').update(bytes).digest('hex');
  if(hash!==inputProps.previousVideoSha256)
    throw Error('SHOT05_LOCKED_PREDECESSOR_SHA256_CHANGED');
  const source=path.join(directory,'locked-shot04.mp4');
  const last=path.join(directory,'locked-shot04-encoded-last.png');
  await fs.writeFile(source,bytes,{flag:'wx'});
  const checked=await captureNative('ffprobe',[
    '-v','error','-select_streams','v:0','-count_frames',
    '-show_entries','stream=nb_read_frames,width,height,r_frame_rate',
    '-of','json',source]);
  const stream=JSON.parse(checked.stdout).streams?.[0];
  if(!stream||stream.width!==1920||stream.height!==1080
    ||stream.r_frame_rate!=='30/1'
    ||Number(stream.nb_read_frames)!==inputProps.previousFrameCount)
    throw Error('SHOT05_PREDECESSOR_1080P30_AND_EXACT_FRAMES_CHANGED');
  await runProcess('ffmpeg',['-hide_banner','-loglevel','error','-xerror','-nostdin',
    '-i',source,'-vf','select=eq(n\\,'+inputProps.previousLastEncodedFrame+')',
    '-frames:v','1','-vsync','0','-y',last]);
  const png=await fs.readFile(last);
  if(png.length<10000||png.length>9000000)
    throw Error('SHOT05_AUTHENTIC_PREDECESSOR_FRAME_PNG_UNAVAILABLE');
  inputProps.previousLastFrameDataUri='data:image/png;base64,'+png.toString('base64');
  console.log('EP004_SHOT05_PREVIOUS_LOCKED_SHOT04_SHA256_LAST_FRAME_QA_PASS renderId='+
      job.renderId+' previousFrames='+stream.nb_read_frames);
  return {source,last};
}

async function muxEp004Shot05ApprovedVoice(job,videoPath,inputProps){
  if(job.compositionId!==EP004_SHOT05_REAL)return;
  const bytes=await fetchEp004Shot05ApprovedVoice(job,inputProps);
  const audio=path.join(os.tmpdir(),'ep004-shot05-'+job.renderId+'-approved-take');
  const muxed=path.join(os.tmpdir(),'ep004-shot05-'+job.renderId+'-mux.mp4');
  try{
    await fs.writeFile(audio,bytes,{flag:'wx'});
    const duration=Number(job.durationInFrames)/30;
    await runProcess('ffmpeg',['-hide_banner','-loglevel','error','-xerror',
      '-nostdin','-i',videoPath,'-i',audio,
      '-filter_complex',
      '[1:a]aresample=48000,adelay=2400:all=1,apad=whole_dur='+duration+'[approved]',
      '-map','0:v:0','-map','[approved]','-c:v','copy',
      '-c:a','aac','-b:a','192k','-ar','48000',
      '-t',String(duration),'-movflags','+faststart','-y',muxed]);
    const qa=await probeFactoryMedia(muxed);
    if(qa.width!==1920||qa.height!==1080||
       Math.abs(qa.duration-duration)>.55)
      throw Error('SHOT05_FINAL_AAC_H264_DIMENSIONS_OR_DURATION_INVALID');
    const silence=await captureNative('ffmpeg',[
      '-hide_banner','-nostdin','-i',muxed,'-t','1.8','-vn',
      '-af','volumedetect','-f','null','-']);
    const peak=silence.stderr.match(/max_volume:\s*(-?[0-9.]+) dB/);
    if(peak&&Number(peak[1])>-55)
      throw Error('SHOT05_FIRST_1_8_SECONDS_MUST_REMAIN_VOICE_SILENT');
    await fs.rename(muxed,videoPath);
    console.log('EP004_SHOT05_REAL_APPROVED_TAKE_72F_AUDIO_DELAY_QA_PASS renderId='+
      job.renderId+' duration='+duration);
  }finally{
    await fs.rm(audio,{force:true}).catch(()=>undefined);
    await fs.rm(muxed,{force:true}).catch(()=>undefined);
  }
}

async function verifyEp004Shot05SeamAndMotion(job,outputPath,lastPNG,directory){
  if(job.compositionId!==EP004_SHOT05_REAL)return;
  const first=path.join(directory,'shot05-first-real-frame.png');
  await runProcess('ffmpeg',['-hide_banner','-loglevel','error','-xerror','-nostdin',
      '-i',outputPath,'-vf','select=eq(n\\,0)',
      '-frames:v','1','-vsync','0','-y',first]);
  const compared=await captureNative('ffmpeg',[
      '-hide_banner','-i',lastPNG,'-i',first,
      '-filter_complex','[0:v][1:v]psnr','-f','null','-']);
  const matched=compared.stderr.match(/average:([0-9.]+)/);
  const psnr=matched?Number(matched[1]):NaN;
  if(!Number.isFinite(psnr)||psnr<34)
    throw Error('SHOT05_PREVIOUS_LAST_FRAME_TO_NEW_FIRST_FRAME_SEAM_FAILED');
  const frames=await captureNative('ffmpeg',[
      '-hide_banner','-loglevel','error','-i',outputPath,
      '-map','0:v:0','-an','-frames:v','30','-f','framemd5','-']);
  const hashes=frames.stdout.split('\n').filter(v=>v&&!v.startsWith('#'))
      .map(v=>v.split(',').at(-1)?.trim()).filter(Boolean);
  if(hashes.length!==30||new Set(hashes).size<5)
    throw Error('SHOT05_LIVING_ARCHITECTURE_FIRST_30_FRAMES_MUST_MOVE');
  console.log('EP004_SHOT05_SEAM_PSNR='+psnr.toFixed(2)+
      ' animatedFrames='+new Set(hashes).size+' renderId='+job.renderId);
}

const EP004_SHOT06_REAL=EP004_SHOT06_COMPOSITION;

async function fetchEp004Shot06ApprovedVoice(job,inputProps){
  if(job.compositionId!==EP004_SHOT06_REAL)
    throw Error('EP004_SHOT06_UNAUTHORIZED_COMPOSITION');
  validateEp004Shot06Production(inputProps);
  if(!/^[a-f0-9]{40}$/.test(FACTORY_SOURCE_SHA)
    ||inputProps.expectedSourceCommit!==FACTORY_SOURCE_SHA
    ||inputProps.episodeKey!=='EP004'||inputProps.shotKey!=='SHOT06'
    ||inputProps.previewOnly!==false||inputProps.directorCpuApproved!==true
    ||inputProps.breathFrames!==72
    ||Number(job.fps)!==30||Number(job.width)!==1920||Number(job.height)!==1080
    ||!Array.isArray(inputProps.verifiedCues)||inputProps.verifiedCues.length<2
    ||inputProps.verifiedCues.length>40
    ||!Number.isInteger(inputProps.previousFrameCount)
    ||inputProps.previousFrameCount<600||inputProps.previousFrameCount>9000
    ||inputProps.previousLastEncodedFrame!==inputProps.previousFrameCount-1
    ||inputProps.worldStartFrame!==inputProps.previousWorldStartFrame+inputProps.previousLastEncodedFrame
    ||!inputProps.previousShot05Props
    ||inputProps.previousShot05Props.expectedSourceCommit!==inputProps.previousSourceCommit
    ||inputProps.previousShot05Props.worldStartFrame!==inputProps.previousWorldStartFrame
    ||inputProps.previousShot05Props.durationInFrames!==inputProps.previousFrameCount
    ||!/^[a-f0-9]{64}$/.test(inputProps.previousVideoSha256||''))
    throw Error('EP004_SHOT06_AUTHENTIC_LOCKED_SOURCE_AND_APPROVED_TAKE_REQUIRED');
  await leaseClient.refresh();
  const res=await workloadTokens.request(
    BACKEND_URL+'/api/v1/remotion/renders/worker/'+job.renderId+
      '/ep004-shot06-selected-voice',
    {method:'GET',headers:headers({'X-Media-OS-Worker-Source-Sha':FACTORY_SOURCE_SHA})});
  if(!res.ok)throw Error('EP004_SHOT06_APPROVED_CURRENT_TAKE_UNAVAILABLE_'+res.status+
    ' '+(await res.text()).slice(0,180));
  const bytes=Buffer.from(await res.arrayBuffer());
  if(bytes.length<512||bytes.length>24*1024*1024)
    throw Error('EP004_SHOT06_APPROVED_AUDIO_BYTES_OUTSIDE_BOUND');
  if(bytes.length!==inputProps.voiceAudioBytes||createHash('sha256').update(bytes).digest('hex')!==inputProps.voiceAudioSha256)
    throw Error('SHOT06_SELECTED_VOICE_SHA256_CHANGED');
  return bytes;
}

async function preflightEp004Shot06PreviousVideo(job,inputProps,directory){
  if(job.compositionId!==EP004_SHOT06_REAL)throw Error('SHOT06_WRONG_COMPOSITION');
  await leaseClient.refresh();
  const res=await workloadTokens.request(
    BACKEND_URL+'/api/v1/remotion/renders/worker/'+job.renderId+
       '/ep004-shot06-previous-video',
    {method:'GET',headers:headers({'X-Media-OS-Worker-Source-Sha':FACTORY_SOURCE_SHA})});
  if(!res.ok)throw Error('SHOT06_LOCKED_SHOT05_MP4_UNAVAILABLE_'+res.status+
      ' '+(await res.text()).slice(0,210));
  const length=Number(res.headers.get('content-length')||0);
  if(length>134217728)throw Error('SHOT06_PREDECESSOR_SIZE_CAP_EXCEEDED');
  const bytes=Buffer.from(await res.arrayBuffer());
  if(bytes.length<1024||bytes.length>134217728)
    throw Error('SHOT06_PREVIOUS_MP4_BYTES_INVALID');
  const hash=createHash('sha256').update(bytes).digest('hex');
  if(hash!==inputProps.previousVideoSha256)
    throw Error('SHOT06_LOCKED_PREDECESSOR_SHA256_CHANGED');
  const source=path.join(directory,'locked-shot05.mp4');
  const last=path.join(directory,'locked-shot05-encoded-last.png');
  await fs.writeFile(source,bytes,{flag:'wx'});
  const checked=await captureNative('ffprobe',[
    '-v','error','-select_streams','v:0','-count_frames',
    '-show_entries','stream=nb_read_frames,width,height,r_frame_rate',
    '-of','json',source]);
  const stream=JSON.parse(checked.stdout).streams?.[0];
  if(!stream||stream.width!==1920||stream.height!==1080
    ||stream.r_frame_rate!=='30/1'
    ||Number(stream.nb_read_frames)!==inputProps.previousFrameCount)
    throw Error('SHOT06_PREDECESSOR_1080P30_AND_EXACT_FRAMES_CHANGED');
  await runProcess('ffmpeg',['-hide_banner','-loglevel','error','-xerror','-nostdin',
    '-i',source,'-vf','select=eq(n\\,'+inputProps.previousLastEncodedFrame+')',
    '-frames:v','1','-vsync','0','-y',last]);
  const png=await fs.readFile(last);
  if(png.length<10000||png.length>9000000)
    throw Error('SHOT06_AUTHENTIC_PREDECESSOR_FRAME_PNG_UNAVAILABLE');
  inputProps.previousLastFrameDataUri='data:image/png;base64,'+png.toString('base64');
  console.log('EP004_SHOT06_PREVIOUS_LOCKED_SHOT05_SHA256_LAST_FRAME_QA_PASS renderId='+
      job.renderId+' previousFrames='+stream.nb_read_frames);
  const bridge=await prepareEp004Shot06MovingBridge(source,last,directory,inputProps.previousLastEncodedFrame);
  return {source,last,bridge};
}

// The locked SHOT05 V10 final packet cycle is 18f and its capacity pulse
// is 48f. Their shared 144f period permits an actual, forward-moving
// decoded tail to continue at the same phase without touching SHOT05.
async function prepareEp004Shot06MovingBridge(source,last,directory,lastFrame){
  if(lastFrame!==2572)throw Error('SHOT06_MOVING_BRIDGE_EXACT_V10_REQUIRED');
  const phaseFrame=lastFrame-144;
  const phasePNG=path.join(directory,'locked-shot05-phase-equivalent.png');
  const bridge=path.join(directory,'locked-shot05-moving-bridge.mkv');
  await runProcess('ffmpeg',['-hide_banner','-loglevel','error','-xerror','-nostdin',
    '-i',source,'-vf','select=eq(n\\,'+phaseFrame+')','-frames:v','1','-vsync','0','-y',phasePNG]);
  const comparison=await captureNative('ffmpeg',['-hide_banner','-i',last,'-i',phasePNG,
    '-filter_complex','[0:v][1:v]psnr','-f','null','-']);
  const match=comparison.stderr.match(/average:(inf|[0-9.]+)/i);
  const psnr=match?(match[1].toLowerCase()==='inf'?Infinity:Number(match[1])):NaN;
  if(!(psnr>=30))throw Error('SHOT06_MOVING_BRIDGE_PHASE_NOT_CONTINUOUS');
  const graph='[0:v]split=2[a][b];[a]trim=start_frame='+lastFrame+':end_frame='+(lastFrame+1)+
    ',setpts=PTS-STARTPTS[first];[b]trim=start_frame='+(phaseFrame+1)+':end_frame='+(phaseFrame+72)+
    ',setpts=PTS-STARTPTS[tail];[first][tail]concat=n=2:v=1:a=0,setpts=N/(30*TB)[v]';
  await runProcess('ffmpeg',['-hide_banner','-loglevel','error','-xerror','-nostdin','-i',source,
    '-filter_complex_threads','1','-filter_complex',graph,'-map','[v]','-an',
    '-r','30','-frames:v','72','-c:v','ffv1','-pix_fmt','yuv420p','-y',bridge]);
  const actual=await captureNative('ffmpeg',['-hide_banner','-loglevel','error',
    '-i',bridge,'-map','0:v:0','-an','-f','framemd5','-']);
  const hashes=actual.stdout.split('\n').filter(v=>v&&!v.startsWith('#'))
    .map(v=>v.split(',').at(-1)?.trim()).filter(Boolean);
  if(hashes.length!==72||new Set(hashes.slice(0,30)).size<20)
    throw Error('SHOT06_REAL_PREDECESSOR_TAIL_MUST_MOVE');
  console.log('EP004_SHOT06_MOVING_PREDECESSOR_PRECPU_PASS phasePSNR='+psnr+
    ' first='+lastFrame+' tail='+(phaseFrame+1)+'..'+(phaseFrame+71)+' movingFrames='+new Set(hashes).size);
  return bridge;
}

async function compositeEp004Shot06MovingBridge(job,outputPath,bridge,directory){
  if(job.compositionId!==EP004_SHOT06_REAL)throw Error('SHOT06_WRONG_COMPOSITION');
  const merged=path.join(directory,'shot06-moving-seam.mp4');
  // Real previous traffic moves immediately. Reveal the new, already moving
  // fleet between frames 12 and 60, entirely inside the existing 72f breath.
  const graph='[1:v]format=yuva420p,fade=t=out:s=12:n=48:alpha=1[old];'+
    '[0:v][old]overlay=eof_action=pass:repeatlast=0:format=yuv420[v]';
  await runProcess('ffmpeg',['-hide_banner','-loglevel','error','-xerror','-nostdin',
    '-i',outputPath,'-i',bridge,'-filter_complex_threads','1','-filter_complex',graph,
    '-map','[v]','-an','-frames:v',String(job.durationInFrames),
    '-c:v','libx264','-crf','16','-preset','veryfast','-threads','2',
    '-movflags','+faststart','-y',merged]);
  const checked=await captureNative('ffprobe',['-v','error','-select_streams','v:0','-count_frames',
    '-show_entries','stream=nb_read_frames,width,height,r_frame_rate','-of','json',merged]);
  const stream=JSON.parse(checked.stdout).streams?.[0];
  if(!stream||stream.width!==1920||stream.height!==1080||stream.r_frame_rate!=='30/1'||
    Number(stream.nb_read_frames)!==Number(job.durationInFrames))
    throw Error('SHOT06_MOVING_BRIDGE_CHANGED_VIDEO_CONTRACT');
  await fs.rename(merged,outputPath);
  console.log('EP004_SHOT06_MOVING_PREDECESSOR_COMPOSITE_PASS renderId='+job.renderId);
}

async function muxEp004Shot06ApprovedVoice(job,videoPath,inputProps){
  if(job.compositionId!==EP004_SHOT06_REAL)return;
  const bytes=await fetchEp004Shot06ApprovedVoice(job,inputProps);
  const audio=path.join(os.tmpdir(),'ep004-shot06-'+job.renderId+'-approved-take');
  const muxed=path.join(os.tmpdir(),'ep004-shot06-'+job.renderId+'-mux.mp4');
  try{
    await fs.writeFile(audio,bytes,{flag:'wx'});
    const duration=Number(job.durationInFrames)/30;
    await runProcess('ffmpeg',['-hide_banner','-loglevel','error','-xerror',
      '-nostdin','-i',videoPath,'-i',audio,
      '-filter_complex',
      '[1:a]aresample=48000,adelay=2400:all=1,apad=whole_dur='+duration+'[approved]',
      '-map','0:v:0','-map','[approved]','-c:v','copy',
      '-c:a','aac','-b:a','192k','-ar','48000',
      '-t',String(duration),'-movflags','+faststart','-y',muxed]);
    const qa=await probeFactoryMedia(muxed);
    if(qa.width!==1920||qa.height!==1080||
       Math.abs(qa.duration-duration)>.55)
      throw Error('SHOT06_FINAL_AAC_H264_DIMENSIONS_OR_DURATION_INVALID');
    const silence=await captureNative('ffmpeg',[
      '-hide_banner','-nostdin','-i',muxed,'-t','1.8','-vn',
      '-af','volumedetect','-f','null','-']);
    const peak=silence.stderr.match(/max_volume:\s*(-?[0-9.]+) dB/);
    if(peak&&Number(peak[1])>-55)
      throw Error('SHOT06_FIRST_1_8_SECONDS_MUST_REMAIN_VOICE_SILENT');
    await fs.rename(muxed,videoPath);
    console.log('EP004_SHOT06_REAL_APPROVED_TAKE_72F_AUDIO_DELAY_QA_PASS renderId='+
      job.renderId+' duration='+duration);
  }finally{
    await fs.rm(audio,{force:true}).catch(()=>undefined);
    await fs.rm(muxed,{force:true}).catch(()=>undefined);
  }
}

async function verifyEp004Shot06SeamAndMotion(job,outputPath,lastPNG,directory){
  if(job.compositionId!==EP004_SHOT06_REAL)return;
  const first=path.join(directory,'shot06-first-real-frame.png');
  await runProcess('ffmpeg',['-hide_banner','-loglevel','error','-xerror','-nostdin',
      '-i',outputPath,'-vf','select=eq(n\\,0)',
      '-frames:v','1','-vsync','0','-y',first]);
  const compared=await captureNative('ffmpeg',[
      '-hide_banner','-i',lastPNG,'-i',first,
      '-filter_complex','[0:v][1:v]psnr','-f','null','-']);
  const matched=compared.stderr.match(/average:([0-9.]+)/);
  const psnr=matched?Number(matched[1]):NaN;
  if(!Number.isFinite(psnr)||psnr<34)
    throw Error('SHOT06_PREVIOUS_LAST_FRAME_TO_NEW_FIRST_FRAME_SEAM_FAILED');
  const frames=await captureNative('ffmpeg',[
      '-hide_banner','-loglevel','error','-i',outputPath,
      '-map','0:v:0','-an','-frames:v','30','-f','framemd5','-']);
  const hashes=frames.stdout.split('\n').filter(v=>v&&!v.startsWith('#'))
      .map(v=>v.split(',').at(-1)?.trim()).filter(Boolean);
  if(hashes.length!==30||new Set(hashes).size<5)
    throw Error('SHOT06_LIVING_ARCHITECTURE_FIRST_30_FRAMES_MUST_MOVE');
  console.log('EP004_SHOT06_SEAM_PSNR='+psnr.toFixed(2)+
      ' animatedFrames='+new Set(hashes).size+' renderId='+job.renderId);
}

const EP004_SHOT07_REAL=EP004_SHOT07_COMPOSITION;

async function fetchEp004Shot07ApprovedVoice(job,inputProps){
  if(job.compositionId!==EP004_SHOT07_REAL)
    throw Error('EP004_SHOT07_UNAUTHORIZED_COMPOSITION');
  validateEp004Shot07Production(inputProps);
  if(!/^[a-f0-9]{40}$/.test(FACTORY_SOURCE_SHA)
    ||inputProps.expectedSourceCommit!==FACTORY_SOURCE_SHA
    ||inputProps.episodeKey!=='EP004'||inputProps.shotKey!=='SHOT07'
    ||inputProps.previewOnly!==false||inputProps.directorCpuApproved!==true
    ||inputProps.breathFrames!==72
    ||Number(job.fps)!==30||Number(job.width)!==1920||Number(job.height)!==1080
    ||!Array.isArray(inputProps.verifiedCues)||inputProps.verifiedCues.length<2
    ||inputProps.verifiedCues.length>40
    ||!Number.isInteger(inputProps.previousFrameCount)
    ||inputProps.previousFrameCount<600||inputProps.previousFrameCount>9000
    ||inputProps.previousLastEncodedFrame!==inputProps.previousFrameCount-1
    ||inputProps.worldStartFrame!==inputProps.previousWorldStartFrame+inputProps.previousLastEncodedFrame
    ||!inputProps.previousShot06Props
    ||inputProps.previousShot06Props.expectedSourceCommit!==inputProps.previousSourceCommit
    ||inputProps.previousShot06Props.worldStartFrame!==inputProps.previousWorldStartFrame
    ||inputProps.previousShot06Props.durationInFrames!==inputProps.previousFrameCount
    ||!/^[a-f0-9]{64}$/.test(inputProps.previousVideoSha256||''))
    throw Error('EP004_SHOT07_AUTHENTIC_LOCKED_SOURCE_AND_APPROVED_TAKE_REQUIRED');
  await leaseClient.refresh();
  const res=await workloadTokens.request(
    BACKEND_URL+'/api/v1/remotion/renders/worker/'+job.renderId+
      '/ep004-shot07-selected-voice',
    {method:'GET',headers:headers({'X-Media-OS-Worker-Source-Sha':FACTORY_SOURCE_SHA})});
  if(!res.ok)throw Error('EP004_SHOT07_APPROVED_CURRENT_TAKE_UNAVAILABLE_'+res.status+
    ' '+(await res.text()).slice(0,180));
  const bytes=Buffer.from(await res.arrayBuffer());
  if(bytes.length<512||bytes.length>24*1024*1024)
    throw Error('EP004_SHOT07_APPROVED_AUDIO_BYTES_OUTSIDE_BOUND');
  if(bytes.length!==inputProps.voiceAudioBytes||createHash('sha256').update(bytes).digest('hex')!==inputProps.voiceAudioSha256)
    throw Error('SHOT07_SELECTED_VOICE_SHA256_CHANGED');
  return bytes;
}

async function preflightEp004Shot07PreviousVideo(job,inputProps,directory){
  if(job.compositionId!==EP004_SHOT07_REAL)throw Error('SHOT07_WRONG_COMPOSITION');
  await leaseClient.refresh();
  const res=await workloadTokens.request(
    BACKEND_URL+'/api/v1/remotion/renders/worker/'+job.renderId+
       '/ep004-shot07-previous-video',
    {method:'GET',headers:headers({'X-Media-OS-Worker-Source-Sha':FACTORY_SOURCE_SHA})});
  if(!res.ok)throw Error('SHOT07_LOCKED_SHOT06_MP4_UNAVAILABLE_'+res.status+
      ' '+(await res.text()).slice(0,210));
  const length=Number(res.headers.get('content-length')||0);
  if(length>134217728)throw Error('SHOT07_PREDECESSOR_SIZE_CAP_EXCEEDED');
  const bytes=Buffer.from(await res.arrayBuffer());
  if(bytes.length<1024||bytes.length>134217728)
    throw Error('SHOT07_PREVIOUS_MP4_BYTES_INVALID');
  const hash=createHash('sha256').update(bytes).digest('hex');
  if(hash!==inputProps.previousVideoSha256)
    throw Error('SHOT07_LOCKED_PREDECESSOR_SHA256_CHANGED');
  const source=path.join(directory,'locked-shot06.mp4');
  const last=path.join(directory,'locked-shot06-encoded-last.png');
  await fs.writeFile(source,bytes,{flag:'wx'});
  const checked=await captureNative('ffprobe',[
    '-v','error','-select_streams','v:0','-count_frames',
    '-show_entries','stream=nb_read_frames,width,height,r_frame_rate',
    '-of','json',source]);
  const stream=JSON.parse(checked.stdout).streams?.[0];
  if(!stream||stream.width!==1920||stream.height!==1080
    ||stream.r_frame_rate!=='30/1'
    ||Number(stream.nb_read_frames)!==inputProps.previousFrameCount)
    throw Error('SHOT07_PREDECESSOR_1080P30_AND_EXACT_FRAMES_CHANGED');
  await runProcess('ffmpeg',['-hide_banner','-loglevel','error','-xerror','-nostdin',
    '-i',source,'-vf','select=eq(n\\,'+inputProps.previousLastEncodedFrame+')',
    '-frames:v','1','-vsync','0','-y',last]);
  const png=await fs.readFile(last);
  if(png.length<10000||png.length>9000000)
    throw Error('SHOT07_AUTHENTIC_PREDECESSOR_FRAME_PNG_UNAVAILABLE');
  inputProps.previousLastFrameDataUri='data:image/png;base64,'+png.toString('base64');
  console.log('EP004_SHOT07_PREVIOUS_LOCKED_SHOT06_SHA256_LAST_FRAME_QA_PASS renderId='+
      job.renderId+' previousFrames='+stream.nb_read_frames);
  return {source,last};
}

async function muxEp004Shot07ApprovedVoice(job,videoPath,inputProps){
  if(job.compositionId!==EP004_SHOT07_REAL)return;
  const bytes=await fetchEp004Shot07ApprovedVoice(job,inputProps);
  const audio=path.join(os.tmpdir(),'ep004-shot07-'+job.renderId+'-approved-take');
  const muxed=path.join(os.tmpdir(),'ep004-shot07-'+job.renderId+'-mux.mp4');
  try{
    await fs.writeFile(audio,bytes,{flag:'wx'});
    const duration=Number(job.durationInFrames)/30;
    await runProcess('ffmpeg',['-hide_banner','-loglevel','error','-xerror',
      '-nostdin','-i',videoPath,'-i',audio,
      '-filter_complex',
      '[1:a]aresample=48000,adelay=2400:all=1,apad=whole_dur='+duration+'[approved]',
      '-map','0:v:0','-map','[approved]','-c:v','copy',
      '-c:a','aac','-b:a','192k','-ar','48000',
      '-t',String(duration),'-movflags','+faststart','-y',muxed]);
    const qa=await probeFactoryMedia(muxed);
    if(qa.width!==1920||qa.height!==1080||
       Math.abs(qa.duration-duration)>.55)
      throw Error('SHOT07_FINAL_AAC_H264_DIMENSIONS_OR_DURATION_INVALID');
    const silence=await captureNative('ffmpeg',[
      '-hide_banner','-nostdin','-i',muxed,'-t','1.8','-vn',
      '-af','volumedetect','-f','null','-']);
    const peak=silence.stderr.match(/max_volume:\s*(-?[0-9.]+) dB/);
    if(peak&&Number(peak[1])>-55)
      throw Error('SHOT07_FIRST_1_8_SECONDS_MUST_REMAIN_VOICE_SILENT');
    await fs.rename(muxed,videoPath);
    console.log('EP004_SHOT07_REAL_APPROVED_TAKE_72F_AUDIO_DELAY_QA_PASS renderId='+
      job.renderId+' duration='+duration);
  }finally{
    await fs.rm(audio,{force:true}).catch(()=>undefined);
    await fs.rm(muxed,{force:true}).catch(()=>undefined);
  }
}

async function verifyEp004Shot07SeamAndMotion(job,outputPath,lastPNG,directory){
  if(job.compositionId!==EP004_SHOT07_REAL)return;
  const first=path.join(directory,'shot07-first-real-frame.png');
  await runProcess('ffmpeg',['-hide_banner','-loglevel','error','-xerror','-nostdin',
      '-i',outputPath,'-vf','select=eq(n\\,0)',
      '-frames:v','1','-vsync','0','-y',first]);
  const compared=await captureNative('ffmpeg',[
      '-hide_banner','-i',lastPNG,'-i',first,
      '-filter_complex','[0:v][1:v]psnr','-f','null','-']);
  const matched=compared.stderr.match(/average:([0-9.]+)/);
  const psnr=matched?Number(matched[1]):NaN;
  if(!Number.isFinite(psnr)||psnr<34)
    throw Error('SHOT07_PREVIOUS_LAST_FRAME_TO_NEW_FIRST_FRAME_SEAM_FAILED');
  const frames=await captureNative('ffmpeg',[
      '-hide_banner','-loglevel','error','-i',outputPath,
      '-map','0:v:0','-an','-frames:v','30','-f','framemd5','-']);
  const hashes=frames.stdout.split('\n').filter(v=>v&&!v.startsWith('#'))
      .map(v=>v.split(',').at(-1)?.trim()).filter(Boolean);
  if(hashes.length!==30||new Set(hashes).size<5)
    throw Error('SHOT07_LIVING_ARCHITECTURE_FIRST_30_FRAMES_MUST_MOVE');
  console.log('EP004_SHOT07_SEAM_PSNR='+psnr.toFixed(2)+
      ' animatedFrames='+new Set(hashes).size+' renderId='+job.renderId);
}

const EP004_SHOT08_REAL=EP004_SHOT08_COMPOSITION;

async function fetchEp004Shot08ApprovedVoice(job,inputProps){
  if(job.compositionId!==EP004_SHOT08_REAL)
    throw Error('EP004_SHOT08_UNAUTHORIZED_COMPOSITION');
  validateEp004Shot08Production(inputProps);
  if(!/^[a-f0-9]{40}$/.test(FACTORY_SOURCE_SHA)
    ||inputProps.expectedSourceCommit!==FACTORY_SOURCE_SHA
    ||inputProps.episodeKey!=='EP004'||inputProps.shotKey!=='SHOT08'
    ||inputProps.previewOnly!==false||inputProps.directorCpuApproved!==true
    ||inputProps.breathFrames!==72
    ||Number(job.fps)!==30||Number(job.width)!==1920||Number(job.height)!==1080
    ||!Array.isArray(inputProps.verifiedCues)||inputProps.verifiedCues.length<2
    ||inputProps.verifiedCues.length>40
    ||!Number.isInteger(inputProps.previousFrameCount)
    ||inputProps.previousFrameCount<600||inputProps.previousFrameCount>9000
    ||inputProps.previousLastEncodedFrame!==inputProps.previousFrameCount-1
    ||inputProps.worldStartFrame!==inputProps.previousWorldStartFrame+inputProps.previousLastEncodedFrame
    ||!inputProps.previousShot07Props
    ||inputProps.previousShot07Props.expectedSourceCommit!==inputProps.previousSourceCommit
    ||inputProps.previousShot07Props.worldStartFrame!==inputProps.previousWorldStartFrame
    ||inputProps.previousShot07Props.durationInFrames!==inputProps.previousFrameCount
    ||!/^[a-f0-9]{64}$/.test(inputProps.previousVideoSha256||''))
    throw Error('EP004_SHOT08_AUTHENTIC_LOCKED_SOURCE_AND_APPROVED_TAKE_REQUIRED');
  await leaseClient.refresh();
  const res=await workloadTokens.request(
    BACKEND_URL+'/api/v1/remotion/renders/worker/'+job.renderId+
      '/ep004-shot08-selected-voice',
    {method:'GET',headers:headers({'X-Media-OS-Worker-Source-Sha':FACTORY_SOURCE_SHA})});
  if(!res.ok)throw Error('EP004_SHOT08_APPROVED_CURRENT_TAKE_UNAVAILABLE_'+res.status+
    ' '+(await res.text()).slice(0,180));
  const bytes=Buffer.from(await res.arrayBuffer());
  if(bytes.length<512||bytes.length>24*1024*1024)
    throw Error('EP004_SHOT08_APPROVED_AUDIO_BYTES_OUTSIDE_BOUND');
  if(bytes.length!==inputProps.voiceAudioBytes||createHash('sha256').update(bytes).digest('hex')!==inputProps.voiceAudioSha256)
    throw Error('SHOT08_SELECTED_VOICE_SHA256_CHANGED');
  return bytes;
}

async function preflightEp004Shot08PreviousVideo(job,inputProps,directory){
  if(job.compositionId!==EP004_SHOT08_REAL)throw Error('SHOT08_WRONG_COMPOSITION');
  await leaseClient.refresh();
  const res=await workloadTokens.request(
    BACKEND_URL+'/api/v1/remotion/renders/worker/'+job.renderId+
       '/ep004-shot08-previous-video',
    {method:'GET',headers:headers({'X-Media-OS-Worker-Source-Sha':FACTORY_SOURCE_SHA})});
  if(!res.ok)throw Error('SHOT08_LOCKED_SHOT07_MP4_UNAVAILABLE_'+res.status+
      ' '+(await res.text()).slice(0,210));
  const length=Number(res.headers.get('content-length')||0);
  if(length>134217728)throw Error('SHOT08_PREDECESSOR_SIZE_CAP_EXCEEDED');
  const bytes=Buffer.from(await res.arrayBuffer());
  if(bytes.length<1024||bytes.length>134217728)
    throw Error('SHOT08_PREVIOUS_MP4_BYTES_INVALID');
  const hash=createHash('sha256').update(bytes).digest('hex');
  if(hash!==inputProps.previousVideoSha256)
    throw Error('SHOT08_LOCKED_PREDECESSOR_SHA256_CHANGED');
  const source=path.join(directory,'locked-shot07.mp4');
  const last=path.join(directory,'locked-shot07-encoded-last.png');
  await fs.writeFile(source,bytes,{flag:'wx'});
  const checked=await captureNative('ffprobe',[
    '-v','error','-select_streams','v:0','-count_frames',
    '-show_entries','stream=nb_read_frames,width,height,r_frame_rate',
    '-of','json',source]);
  const stream=JSON.parse(checked.stdout).streams?.[0];
  if(!stream||stream.width!==1920||stream.height!==1080
    ||stream.r_frame_rate!=='30/1'
    ||Number(stream.nb_read_frames)!==inputProps.previousFrameCount)
    throw Error('SHOT08_PREDECESSOR_1080P30_AND_EXACT_FRAMES_CHANGED');
  await runProcess('ffmpeg',['-hide_banner','-loglevel','error','-xerror','-nostdin',
    '-i',source,'-vf','select=eq(n\\,'+inputProps.previousLastEncodedFrame+')',
    '-frames:v','1','-vsync','0','-y',last]);
  const png=await fs.readFile(last);
  if(png.length<10000||png.length>9000000)
    throw Error('SHOT08_AUTHENTIC_PREDECESSOR_FRAME_PNG_UNAVAILABLE');
  inputProps.previousLastFrameDataUri='data:image/png;base64,'+png.toString('base64');
  console.log('EP004_SHOT08_PREVIOUS_LOCKED_SHOT07_SHA256_LAST_FRAME_QA_PASS renderId='+
      job.renderId+' previousFrames='+stream.nb_read_frames);
  return {source,last};
}

async function muxEp004Shot08ApprovedVoice(job,videoPath,inputProps){
  if(job.compositionId!==EP004_SHOT08_REAL)return;
  const bytes=await fetchEp004Shot08ApprovedVoice(job,inputProps);
  const audio=path.join(os.tmpdir(),'ep004-shot08-'+job.renderId+'-approved-take');
  const muxed=path.join(os.tmpdir(),'ep004-shot08-'+job.renderId+'-mux.mp4');
  try{
    await fs.writeFile(audio,bytes,{flag:'wx'});
    const duration=Number(job.durationInFrames)/30;
    await runProcess('ffmpeg',['-hide_banner','-loglevel','error','-xerror',
      '-nostdin','-i',videoPath,'-i',audio,
      '-filter_complex',
      '[1:a]aresample=48000,adelay=2400:all=1,apad=whole_dur='+duration+'[approved]',
      '-map','0:v:0','-map','[approved]','-c:v','copy',
      '-c:a','aac','-b:a','192k','-ar','48000',
      '-t',String(duration),'-movflags','+faststart','-y',muxed]);
    const qa=await probeFactoryMedia(muxed);
    if(qa.width!==1920||qa.height!==1080||
       Math.abs(qa.duration-duration)>.55)
      throw Error('SHOT08_FINAL_AAC_H264_DIMENSIONS_OR_DURATION_INVALID');
    const silence=await captureNative('ffmpeg',[
      '-hide_banner','-nostdin','-i',muxed,'-t','1.8','-vn',
      '-af','volumedetect','-f','null','-']);
    const peak=silence.stderr.match(/max_volume:\s*(-?[0-9.]+) dB/);
    if(peak&&Number(peak[1])>-55)
      throw Error('SHOT08_FIRST_1_8_SECONDS_MUST_REMAIN_VOICE_SILENT');
    await fs.rename(muxed,videoPath);
    console.log('EP004_SHOT08_REAL_APPROVED_TAKE_72F_AUDIO_DELAY_QA_PASS renderId='+
      job.renderId+' duration='+duration);
  }finally{
    await fs.rm(audio,{force:true}).catch(()=>undefined);
    await fs.rm(muxed,{force:true}).catch(()=>undefined);
  }
}

async function verifyEp004Shot08SeamAndMotion(job,outputPath,lastPNG,directory){
  if(job.compositionId!==EP004_SHOT08_REAL)return;
  const first=path.join(directory,'shot08-first-real-frame.png');
  await runProcess('ffmpeg',['-hide_banner','-loglevel','error','-xerror','-nostdin',
      '-i',outputPath,'-vf','select=eq(n\\,0)',
      '-frames:v','1','-vsync','0','-y',first]);
  const compared=await captureNative('ffmpeg',[
      '-hide_banner','-i',lastPNG,'-i',first,
      '-filter_complex','[0:v][1:v]psnr','-f','null','-']);
  const matched=compared.stderr.match(/average:([0-9.]+)/);
  const psnr=matched?Number(matched[1]):NaN;
  if(!Number.isFinite(psnr)||psnr<34)
    throw Error('SHOT08_PREVIOUS_LAST_FRAME_TO_NEW_FIRST_FRAME_SEAM_FAILED');
  const frames=await captureNative('ffmpeg',[
      '-hide_banner','-loglevel','error','-i',outputPath,
      '-map','0:v:0','-an','-frames:v','30','-f','framemd5','-']);
  const hashes=frames.stdout.split('\n').filter(v=>v&&!v.startsWith('#'))
      .map(v=>v.split(',').at(-1)?.trim()).filter(Boolean);
  if(hashes.length!==30||new Set(hashes).size<5)
    throw Error('SHOT08_LIVING_ARCHITECTURE_FIRST_30_FRAMES_MUST_MOVE');
  console.log('EP004_SHOT08_SEAM_PSNR='+psnr.toFixed(2)+
      ' animatedFrames='+new Set(hashes).size+' renderId='+job.renderId);
}

const EP004_SHOT09_REAL=EP004_SHOT09_COMPOSITION;

async function fetchEp004Shot09ApprovedVoice(job,inputProps){
  if(job.compositionId!==EP004_SHOT09_REAL)
    throw Error('EP004_SHOT09_UNAUTHORIZED_COMPOSITION');
  validateEp004Shot09Production(inputProps);
  if(!/^[a-f0-9]{40}$/.test(FACTORY_SOURCE_SHA)
    ||inputProps.expectedSourceCommit!==FACTORY_SOURCE_SHA
    ||inputProps.episodeKey!=='EP004'||inputProps.shotKey!=='SHOT09'
    ||inputProps.previewOnly!==false||inputProps.directorCpuApproved!==true
    ||inputProps.breathFrames!==72
    ||Number(job.fps)!==30||Number(job.width)!==1920||Number(job.height)!==1080
    ||!Array.isArray(inputProps.verifiedCues)||inputProps.verifiedCues.length<2
    ||inputProps.verifiedCues.length>40
    ||!Number.isInteger(inputProps.previousFrameCount)
    ||inputProps.previousFrameCount<600||inputProps.previousFrameCount>9000
    ||inputProps.previousLastEncodedFrame!==inputProps.previousFrameCount-1
    ||inputProps.worldStartFrame!==inputProps.previousWorldStartFrame+inputProps.previousLastEncodedFrame
    ||!inputProps.previousShot08Props
    ||inputProps.previousShot08Props.expectedSourceCommit!==inputProps.previousSourceCommit
    ||inputProps.previousShot08Props.worldStartFrame!==inputProps.previousWorldStartFrame
    ||inputProps.previousShot08Props.durationInFrames!==inputProps.previousFrameCount
    ||!/^[a-f0-9]{64}$/.test(inputProps.previousVideoSha256||''))
    throw Error('EP004_SHOT09_AUTHENTIC_LOCKED_SOURCE_AND_APPROVED_TAKE_REQUIRED');
  await leaseClient.refresh();
  const res=await workloadTokens.request(
    BACKEND_URL+'/api/v1/remotion/renders/worker/'+job.renderId+
      '/ep004-shot09-selected-voice',
    {method:'GET',headers:headers({'X-Media-OS-Worker-Source-Sha':FACTORY_SOURCE_SHA})});
  if(!res.ok)throw Error('EP004_SHOT09_APPROVED_CURRENT_TAKE_UNAVAILABLE_'+res.status+
    ' '+(await res.text()).slice(0,180));
  const bytes=Buffer.from(await res.arrayBuffer());
  if(bytes.length<512||bytes.length>24*1024*1024)
    throw Error('EP004_SHOT09_APPROVED_AUDIO_BYTES_OUTSIDE_BOUND');
  if(bytes.length!==inputProps.voiceAudioBytes||createHash('sha256').update(bytes).digest('hex')!==inputProps.voiceAudioSha256)
    throw Error('SHOT09_SELECTED_VOICE_SHA256_CHANGED');
  return bytes;
}

async function preflightEp004Shot09PreviousVideo(job,inputProps,directory){
  if(job.compositionId!==EP004_SHOT09_REAL)throw Error('SHOT09_WRONG_COMPOSITION');
  await leaseClient.refresh();
  const res=await workloadTokens.request(
    BACKEND_URL+'/api/v1/remotion/renders/worker/'+job.renderId+
       '/ep004-shot09-previous-video',
    {method:'GET',headers:headers({'X-Media-OS-Worker-Source-Sha':FACTORY_SOURCE_SHA})});
  if(!res.ok)throw Error('SHOT09_LOCKED_SHOT08_MP4_UNAVAILABLE_'+res.status+
      ' '+(await res.text()).slice(0,210));
  const length=Number(res.headers.get('content-length')||0);
  if(length>134217728)throw Error('SHOT09_PREDECESSOR_SIZE_CAP_EXCEEDED');
  const bytes=Buffer.from(await res.arrayBuffer());
  if(bytes.length<1024||bytes.length>134217728)
    throw Error('SHOT09_PREVIOUS_MP4_BYTES_INVALID');
  const hash=createHash('sha256').update(bytes).digest('hex');
  if(hash!==inputProps.previousVideoSha256)
    throw Error('SHOT09_LOCKED_PREDECESSOR_SHA256_CHANGED');
  const source=path.join(directory,'locked-shot08.mp4');
  const last=path.join(directory,'locked-shot08-encoded-last.png');
  await fs.writeFile(source,bytes,{flag:'wx'});
  const checked=await captureNative('ffprobe',[
    '-v','error','-select_streams','v:0','-count_frames',
    '-show_entries','stream=nb_read_frames,width,height,r_frame_rate',
    '-of','json',source]);
  const stream=JSON.parse(checked.stdout).streams?.[0];
  if(!stream||stream.width!==1920||stream.height!==1080
    ||stream.r_frame_rate!=='30/1'
    ||Number(stream.nb_read_frames)!==inputProps.previousFrameCount)
    throw Error('SHOT09_PREDECESSOR_1080P30_AND_EXACT_FRAMES_CHANGED');
  await runProcess('ffmpeg',['-hide_banner','-loglevel','error','-xerror','-nostdin',
    '-i',source,'-vf','select=eq(n\\,'+inputProps.previousLastEncodedFrame+')',
    '-frames:v','1','-vsync','0','-y',last]);
  const png=await fs.readFile(last);
  if(png.length<10000||png.length>9000000)
    throw Error('SHOT09_AUTHENTIC_PREDECESSOR_FRAME_PNG_UNAVAILABLE');
  inputProps.previousLastFrameDataUri='data:image/png;base64,'+png.toString('base64');
  console.log('EP004_SHOT09_PREVIOUS_LOCKED_SHOT08_SHA256_LAST_FRAME_QA_PASS renderId='+
      job.renderId+' previousFrames='+stream.nb_read_frames);
  return {source,last};
}

async function muxEp004Shot09ApprovedVoice(job,videoPath,inputProps){
  if(job.compositionId!==EP004_SHOT09_REAL)return;
  const bytes=await fetchEp004Shot09ApprovedVoice(job,inputProps);
  const audio=path.join(os.tmpdir(),'ep004-shot09-'+job.renderId+'-approved-take');
  const muxed=path.join(os.tmpdir(),'ep004-shot09-'+job.renderId+'-mux.mp4');
  try{
    await fs.writeFile(audio,bytes,{flag:'wx'});
    const duration=Number(job.durationInFrames)/30;
    await runProcess('ffmpeg',['-hide_banner','-loglevel','error','-xerror',
      '-nostdin','-i',videoPath,'-i',audio,
      '-filter_complex',
      '[1:a]aresample=48000,adelay=2400:all=1,apad=whole_dur='+duration+'[approved]',
      '-map','0:v:0','-map','[approved]','-c:v','copy',
      '-c:a','aac','-b:a','192k','-ar','48000',
      '-t',String(duration),'-movflags','+faststart','-y',muxed]);
    const qa=await probeFactoryMedia(muxed);
    if(qa.width!==1920||qa.height!==1080||
       Math.abs(qa.duration-duration)>.55)
      throw Error('SHOT09_FINAL_AAC_H264_DIMENSIONS_OR_DURATION_INVALID');
    const silence=await captureNative('ffmpeg',[
      '-hide_banner','-nostdin','-i',muxed,'-t','1.8','-vn',
      '-af','volumedetect','-f','null','-']);
    const peak=silence.stderr.match(/max_volume:\s*(-?[0-9.]+) dB/);
    if(peak&&Number(peak[1])>-55)
      throw Error('SHOT09_FIRST_1_8_SECONDS_MUST_REMAIN_VOICE_SILENT');
    await fs.rename(muxed,videoPath);
    console.log('EP004_SHOT09_REAL_APPROVED_TAKE_72F_AUDIO_DELAY_QA_PASS renderId='+
      job.renderId+' duration='+duration);
  }finally{
    await fs.rm(audio,{force:true}).catch(()=>undefined);
    await fs.rm(muxed,{force:true}).catch(()=>undefined);
  }
}

async function verifyEp004Shot09SeamAndMotion(job,outputPath,lastPNG,directory){
  if(job.compositionId!==EP004_SHOT09_REAL)return;
  const first=path.join(directory,'shot09-first-real-frame.png');
  await runProcess('ffmpeg',['-hide_banner','-loglevel','error','-xerror','-nostdin',
      '-i',outputPath,'-vf','select=eq(n\\,0)',
      '-frames:v','1','-vsync','0','-y',first]);
  const compared=await captureNative('ffmpeg',[
      '-hide_banner','-i',lastPNG,'-i',first,
      '-filter_complex','[0:v][1:v]psnr','-f','null','-']);
  const matched=compared.stderr.match(/average:([0-9.]+)/);
  const psnr=matched?Number(matched[1]):NaN;
  if(!Number.isFinite(psnr)||psnr<34)
    throw Error('SHOT09_PREVIOUS_LAST_FRAME_TO_NEW_FIRST_FRAME_SEAM_FAILED');
  const frames=await captureNative('ffmpeg',[
      '-hide_banner','-loglevel','error','-i',outputPath,
      '-map','0:v:0','-an','-frames:v','30','-f','framemd5','-']);
  const hashes=frames.stdout.split('\n').filter(v=>v&&!v.startsWith('#'))
      .map(v=>v.split(',').at(-1)?.trim()).filter(Boolean);
  if(hashes.length!==30||new Set(hashes).size<5)
    throw Error('SHOT09_LIVING_ARCHITECTURE_FIRST_30_FRAMES_MUST_MOVE');
  console.log('EP004_SHOT09_SEAM_PSNR='+psnr.toFixed(2)+
      ' animatedFrames='+new Set(hashes).size+' renderId='+job.renderId);
}

const EP004_SHOT10_REAL=EP004_SHOT10_COMPOSITION;

async function fetchEp004Shot10ApprovedVoice(job,inputProps){
  if(job.compositionId!==EP004_SHOT10_REAL)
    throw Error('EP004_SHOT10_UNAUTHORIZED_COMPOSITION');
  validateEp004Shot10Production(inputProps);
  if(!/^[a-f0-9]{40}$/.test(FACTORY_SOURCE_SHA)
    ||inputProps.expectedSourceCommit!==FACTORY_SOURCE_SHA
    ||inputProps.episodeKey!=='EP004'||inputProps.shotKey!=='SHOT10'
    ||inputProps.previewOnly!==false||inputProps.directorCpuApproved!==true
    ||inputProps.breathFrames!==72
    ||Number(job.fps)!==30||Number(job.width)!==1920||Number(job.height)!==1080
    ||!Array.isArray(inputProps.verifiedCues)||inputProps.verifiedCues.length<2
    ||inputProps.verifiedCues.length>40
    ||!Number.isInteger(inputProps.previousFrameCount)
    ||inputProps.previousFrameCount<600||inputProps.previousFrameCount>9000
    ||inputProps.previousLastEncodedFrame!==inputProps.previousFrameCount-1
    ||inputProps.worldStartFrame!==inputProps.previousWorldStartFrame+inputProps.previousLastEncodedFrame
    ||!inputProps.previousShot09Props
    ||inputProps.previousShot09Props.expectedSourceCommit!==inputProps.previousSourceCommit
    ||inputProps.previousShot09Props.worldStartFrame!==inputProps.previousWorldStartFrame
    ||inputProps.previousShot09Props.durationInFrames!==inputProps.previousFrameCount
    ||!/^[a-f0-9]{64}$/.test(inputProps.previousVideoSha256||''))
    throw Error('EP004_SHOT10_AUTHENTIC_LOCKED_SOURCE_AND_APPROVED_TAKE_REQUIRED');
  await leaseClient.refresh();
  const res=await workloadTokens.request(
    BACKEND_URL+'/api/v1/remotion/renders/worker/'+job.renderId+
      '/ep004-shot10-selected-voice',
    {method:'GET',headers:headers({'X-Media-OS-Worker-Source-Sha':FACTORY_SOURCE_SHA})});
  if(!res.ok)throw Error('EP004_SHOT10_APPROVED_CURRENT_TAKE_UNAVAILABLE_'+res.status+
    ' '+(await res.text()).slice(0,180));
  const bytes=Buffer.from(await res.arrayBuffer());
  if(bytes.length<512||bytes.length>24*1024*1024)
    throw Error('EP004_SHOT10_APPROVED_AUDIO_BYTES_OUTSIDE_BOUND');
  if(bytes.length!==inputProps.voiceAudioBytes||createHash('sha256').update(bytes).digest('hex')!==inputProps.voiceAudioSha256)
    throw Error('SHOT10_SELECTED_VOICE_SHA256_CHANGED');
  return bytes;
}

async function preflightEp004Shot10PreviousVideo(job,inputProps,directory){
  if(job.compositionId!==EP004_SHOT10_REAL)throw Error('SHOT10_WRONG_COMPOSITION');
  await leaseClient.refresh();
  const res=await workloadTokens.request(
    BACKEND_URL+'/api/v1/remotion/renders/worker/'+job.renderId+
       '/ep004-shot10-previous-video',
    {method:'GET',headers:headers({'X-Media-OS-Worker-Source-Sha':FACTORY_SOURCE_SHA})});
  if(!res.ok)throw Error('SHOT10_LOCKED_SHOT09_MP4_UNAVAILABLE_'+res.status+
      ' '+(await res.text()).slice(0,210));
  const length=Number(res.headers.get('content-length')||0);
  if(length>134217728)throw Error('SHOT10_PREDECESSOR_SIZE_CAP_EXCEEDED');
  const bytes=Buffer.from(await res.arrayBuffer());
  if(bytes.length<1024||bytes.length>134217728)
    throw Error('SHOT10_PREVIOUS_MP4_BYTES_INVALID');
  const hash=createHash('sha256').update(bytes).digest('hex');
  if(hash!==inputProps.previousVideoSha256)
    throw Error('SHOT10_LOCKED_PREDECESSOR_SHA256_CHANGED');
  const source=path.join(directory,'locked-shot09.mp4');
  const last=path.join(directory,'locked-shot09-encoded-last.png');
  await fs.writeFile(source,bytes,{flag:'wx'});
  const checked=await captureNative('ffprobe',[
    '-v','error','-select_streams','v:0','-count_frames',
    '-show_entries','stream=nb_read_frames,width,height,r_frame_rate',
    '-of','json',source]);
  const stream=JSON.parse(checked.stdout).streams?.[0];
  if(!stream||stream.width!==1920||stream.height!==1080
    ||stream.r_frame_rate!=='30/1'
    ||Number(stream.nb_read_frames)!==inputProps.previousFrameCount)
    throw Error('SHOT10_PREDECESSOR_1080P30_AND_EXACT_FRAMES_CHANGED');
  await runProcess('ffmpeg',['-hide_banner','-loglevel','error','-xerror','-nostdin',
    '-i',source,'-vf','select=eq(n\\,'+inputProps.previousLastEncodedFrame+')',
    '-frames:v','1','-vsync','0','-y',last]);
  const png=await fs.readFile(last);
  if(png.length<10000||png.length>9000000)
    throw Error('SHOT10_AUTHENTIC_PREDECESSOR_FRAME_PNG_UNAVAILABLE');
  inputProps.previousLastFrameDataUri='data:image/png;base64,'+png.toString('base64');
  console.log('EP004_SHOT10_PREVIOUS_LOCKED_SHOT09_SHA256_LAST_FRAME_QA_PASS renderId='+
      job.renderId+' previousFrames='+stream.nb_read_frames);
  return {source,last};
}

async function muxEp004Shot10ApprovedVoice(job,videoPath,inputProps){
  if(job.compositionId!==EP004_SHOT10_REAL)return;
  const bytes=await fetchEp004Shot10ApprovedVoice(job,inputProps);
  const audio=path.join(os.tmpdir(),'ep004-shot10-'+job.renderId+'-approved-take');
  const muxed=path.join(os.tmpdir(),'ep004-shot10-'+job.renderId+'-mux.mp4');
  try{
    await fs.writeFile(audio,bytes,{flag:'wx'});
    const duration=Number(job.durationInFrames)/30;
    await runProcess('ffmpeg',['-hide_banner','-loglevel','error','-xerror',
      '-nostdin','-i',videoPath,'-i',audio,
      '-filter_complex',
      '[1:a]aresample=48000,adelay=2400:all=1,apad=whole_dur='+duration+'[approved]',
      '-map','0:v:0','-map','[approved]','-c:v','copy',
      '-c:a','aac','-b:a','192k','-ar','48000',
      '-t',String(duration),'-movflags','+faststart','-y',muxed]);
    const qa=await probeFactoryMedia(muxed);
    if(qa.width!==1920||qa.height!==1080||
       Math.abs(qa.duration-duration)>.55)
      throw Error('SHOT10_FINAL_AAC_H264_DIMENSIONS_OR_DURATION_INVALID');
    const silence=await captureNative('ffmpeg',[
      '-hide_banner','-nostdin','-i',muxed,'-t','1.8','-vn',
      '-af','volumedetect','-f','null','-']);
    const peak=silence.stderr.match(/max_volume:\s*(-?[0-9.]+) dB/);
    if(peak&&Number(peak[1])>-55)
      throw Error('SHOT10_FIRST_1_8_SECONDS_MUST_REMAIN_VOICE_SILENT');
    await fs.rename(muxed,videoPath);
    console.log('EP004_SHOT10_REAL_APPROVED_TAKE_72F_AUDIO_DELAY_QA_PASS renderId='+
      job.renderId+' duration='+duration);
  }finally{
    await fs.rm(audio,{force:true}).catch(()=>undefined);
    await fs.rm(muxed,{force:true}).catch(()=>undefined);
  }
}

async function verifyEp004Shot10SeamAndMotion(job,outputPath,lastPNG,directory){
  if(job.compositionId!==EP004_SHOT10_REAL)return;
  const first=path.join(directory,'shot10-first-real-frame.png');
  await runProcess('ffmpeg',['-hide_banner','-loglevel','error','-xerror','-nostdin',
      '-i',outputPath,'-vf','select=eq(n\\,0)',
      '-frames:v','1','-vsync','0','-y',first]);
  const compared=await captureNative('ffmpeg',[
      '-hide_banner','-i',lastPNG,'-i',first,
      '-filter_complex','[0:v][1:v]psnr','-f','null','-']);
  const matched=compared.stderr.match(/average:([0-9.]+)/);
  const psnr=matched?Number(matched[1]):NaN;
  if(!Number.isFinite(psnr)||psnr<34)
    throw Error('SHOT10_PREVIOUS_LAST_FRAME_TO_NEW_FIRST_FRAME_SEAM_FAILED');
  const frames=await captureNative('ffmpeg',[
      '-hide_banner','-loglevel','error','-i',outputPath,
      '-map','0:v:0','-an','-frames:v','30','-f','framemd5','-']);
  const hashes=frames.stdout.split('\n').filter(v=>v&&!v.startsWith('#'))
      .map(v=>v.split(',').at(-1)?.trim()).filter(Boolean);
  if(hashes.length!==30||new Set(hashes).size<5)
    throw Error('SHOT10_LIVING_ARCHITECTURE_FIRST_30_FRAMES_MUST_MOVE');
  console.log('EP004_SHOT10_SEAM_PSNR='+psnr.toFixed(2)+
      ' animatedFrames='+new Set(hashes).size+' renderId='+job.renderId);
}

const EP004_SHOT11_REAL=EP004_SHOT11_COMPOSITION;

async function fetchEp004Shot11ApprovedVoice(job,inputProps){
  if(job.compositionId!==EP004_SHOT11_REAL)
    throw Error('EP004_SHOT11_UNAUTHORIZED_COMPOSITION');
  validateEp004Shot11Production(inputProps);
  if(!/^[a-f0-9]{40}$/.test(FACTORY_SOURCE_SHA)
    ||inputProps.expectedSourceCommit!==FACTORY_SOURCE_SHA
    ||inputProps.episodeKey!=='EP004'||inputProps.shotKey!=='SHOT11'
    ||inputProps.previewOnly!==false||inputProps.directorCpuApproved!==true
    ||inputProps.breathFrames!==72
    ||Number(job.fps)!==30||Number(job.width)!==1920||Number(job.height)!==1080
    ||!Array.isArray(inputProps.verifiedCues)||inputProps.verifiedCues.length<2
    ||inputProps.verifiedCues.length>40
    ||!Number.isInteger(inputProps.previousFrameCount)
    ||inputProps.previousFrameCount<600||inputProps.previousFrameCount>9000
    ||inputProps.previousLastEncodedFrame!==inputProps.previousFrameCount-1
    ||inputProps.worldStartFrame!==inputProps.previousWorldStartFrame+inputProps.previousLastEncodedFrame
    ||!inputProps.previousShot10Props
    ||inputProps.previousShot10Props.expectedSourceCommit!==inputProps.previousSourceCommit
    ||inputProps.previousShot10Props.worldStartFrame!==inputProps.previousWorldStartFrame
    ||inputProps.previousShot10Props.durationInFrames!==inputProps.previousFrameCount
    ||!/^[a-f0-9]{64}$/.test(inputProps.previousVideoSha256||''))
    throw Error('EP004_SHOT11_AUTHENTIC_LOCKED_SOURCE_AND_APPROVED_TAKE_REQUIRED');
  await leaseClient.refresh();
  const res=await workloadTokens.request(
    BACKEND_URL+'/api/v1/remotion/renders/worker/'+job.renderId+
      '/ep004-shot11-selected-voice',
    {method:'GET',headers:headers({'X-Media-OS-Worker-Source-Sha':FACTORY_SOURCE_SHA})});
  if(!res.ok)throw Error('EP004_SHOT11_APPROVED_CURRENT_TAKE_UNAVAILABLE_'+res.status+
    ' '+(await res.text()).slice(0,180));
  const bytes=Buffer.from(await res.arrayBuffer());
  if(bytes.length<512||bytes.length>24*1024*1024)
    throw Error('EP004_SHOT11_APPROVED_AUDIO_BYTES_OUTSIDE_BOUND');
  if(bytes.length!==inputProps.voiceAudioBytes||createHash('sha256').update(bytes).digest('hex')!==inputProps.voiceAudioSha256)
    throw Error('SHOT11_SELECTED_VOICE_SHA256_CHANGED');
  return bytes;
}

async function preflightEp004Shot11PreviousVideo(job,inputProps,directory){
  if(job.compositionId!==EP004_SHOT11_REAL)throw Error('SHOT11_WRONG_COMPOSITION');
  await leaseClient.refresh();
  const res=await workloadTokens.request(
    BACKEND_URL+'/api/v1/remotion/renders/worker/'+job.renderId+
       '/ep004-shot11-previous-video',
    {method:'GET',headers:headers({'X-Media-OS-Worker-Source-Sha':FACTORY_SOURCE_SHA})});
  if(!res.ok)throw Error('SHOT11_LOCKED_SHOT10_MP4_UNAVAILABLE_'+res.status+
      ' '+(await res.text()).slice(0,210));
  const length=Number(res.headers.get('content-length')||0);
  if(length>134217728)throw Error('SHOT11_PREDECESSOR_SIZE_CAP_EXCEEDED');
  const bytes=Buffer.from(await res.arrayBuffer());
  if(bytes.length<1024||bytes.length>134217728)
    throw Error('SHOT11_PREVIOUS_MP4_BYTES_INVALID');
  const hash=createHash('sha256').update(bytes).digest('hex');
  if(hash!==inputProps.previousVideoSha256)
    throw Error('SHOT11_LOCKED_PREDECESSOR_SHA256_CHANGED');
  const source=path.join(directory,'locked-shot10.mp4');
  const last=path.join(directory,'locked-shot10-encoded-last.png');
  await fs.writeFile(source,bytes,{flag:'wx'});
  const checked=await captureNative('ffprobe',[
    '-v','error','-select_streams','v:0','-count_frames',
    '-show_entries','stream=nb_read_frames,width,height,r_frame_rate',
    '-of','json',source]);
  const stream=JSON.parse(checked.stdout).streams?.[0];
  if(!stream||stream.width!==1920||stream.height!==1080
    ||stream.r_frame_rate!=='30/1'
    ||Number(stream.nb_read_frames)!==inputProps.previousFrameCount)
    throw Error('SHOT11_PREDECESSOR_1080P30_AND_EXACT_FRAMES_CHANGED');
  await runProcess('ffmpeg',['-hide_banner','-loglevel','error','-xerror','-nostdin',
    '-i',source,'-vf','select=eq(n\\,'+inputProps.previousLastEncodedFrame+')',
    '-frames:v','1','-vsync','0','-y',last]);
  const png=await fs.readFile(last);
  if(png.length<10000||png.length>9000000)
    throw Error('SHOT11_AUTHENTIC_PREDECESSOR_FRAME_PNG_UNAVAILABLE');
  inputProps.previousLastFrameDataUri='data:image/png;base64,'+png.toString('base64');
  console.log('EP004_SHOT11_PREVIOUS_LOCKED_SHOT10_SHA256_LAST_FRAME_QA_PASS renderId='+
      job.renderId+' previousFrames='+stream.nb_read_frames);
  return {source,last};
}

async function muxEp004Shot11ApprovedVoice(job,videoPath,inputProps){
  if(job.compositionId!==EP004_SHOT11_REAL)return;
  const bytes=await fetchEp004Shot11ApprovedVoice(job,inputProps);
  const audio=path.join(os.tmpdir(),'ep004-shot11-'+job.renderId+'-approved-take');
  const muxed=path.join(os.tmpdir(),'ep004-shot11-'+job.renderId+'-mux.mp4');
  try{
    await fs.writeFile(audio,bytes,{flag:'wx'});
    const duration=Number(job.durationInFrames)/30;
    await runProcess('ffmpeg',['-hide_banner','-loglevel','error','-xerror',
      '-nostdin','-i',videoPath,'-i',audio,
      '-filter_complex',
      '[1:a]aresample=48000,adelay=2400:all=1,apad=whole_dur='+duration+'[approved]',
      '-map','0:v:0','-map','[approved]','-c:v','copy',
      '-c:a','aac','-b:a','192k','-ar','48000',
      '-t',String(duration),'-movflags','+faststart','-y',muxed]);
    const qa=await probeFactoryMedia(muxed);
    if(qa.width!==1920||qa.height!==1080||
       Math.abs(qa.duration-duration)>.55)
      throw Error('SHOT11_FINAL_AAC_H264_DIMENSIONS_OR_DURATION_INVALID');
    const silence=await captureNative('ffmpeg',[
      '-hide_banner','-nostdin','-i',muxed,'-t','1.8','-vn',
      '-af','volumedetect','-f','null','-']);
    const peak=silence.stderr.match(/max_volume:\s*(-?[0-9.]+) dB/);
    if(peak&&Number(peak[1])>-55)
      throw Error('SHOT11_FIRST_1_8_SECONDS_MUST_REMAIN_VOICE_SILENT');
    await fs.rename(muxed,videoPath);
    console.log('EP004_SHOT11_REAL_APPROVED_TAKE_72F_AUDIO_DELAY_QA_PASS renderId='+
      job.renderId+' duration='+duration);
  }finally{
    await fs.rm(audio,{force:true}).catch(()=>undefined);
    await fs.rm(muxed,{force:true}).catch(()=>undefined);
  }
}

async function verifyEp004Shot11SeamAndMotion(job,outputPath,lastPNG,directory){
  if(job.compositionId!==EP004_SHOT11_REAL)return;
  const first=path.join(directory,'shot11-first-real-frame.png');
  await runProcess('ffmpeg',['-hide_banner','-loglevel','error','-xerror','-nostdin',
      '-i',outputPath,'-vf','select=eq(n\\,0)',
      '-frames:v','1','-vsync','0','-y',first]);
  const compared=await captureNative('ffmpeg',[
      '-hide_banner','-i',lastPNG,'-i',first,
      '-filter_complex','[0:v][1:v]psnr','-f','null','-']);
  const matched=compared.stderr.match(/average:([0-9.]+)/);
  const psnr=matched?Number(matched[1]):NaN;
  if(!Number.isFinite(psnr)||psnr<34)
    throw Error('SHOT11_PREVIOUS_LAST_FRAME_TO_NEW_FIRST_FRAME_SEAM_FAILED');
  const frames=await captureNative('ffmpeg',[
      '-hide_banner','-loglevel','error','-i',outputPath,
      '-map','0:v:0','-an','-frames:v','30','-f','framemd5','-']);
  const hashes=frames.stdout.split('\n').filter(v=>v&&!v.startsWith('#'))
      .map(v=>v.split(',').at(-1)?.trim()).filter(Boolean);
  if(hashes.length!==30||new Set(hashes).size<5)
    throw Error('SHOT11_LIVING_ARCHITECTURE_FIRST_30_FRAMES_MUST_MOVE');
  console.log('EP004_SHOT11_SEAM_PSNR='+psnr.toFixed(2)+
      ' animatedFrames='+new Set(hashes).size+' renderId='+job.renderId);
}
const EP004_SHOT12_REAL=EP004_SHOT12_COMPOSITION;

async function fetchEp004Shot12ApprovedVoice(job,inputProps){
  if(job.compositionId!==EP004_SHOT12_REAL)
    throw Error('EP004_SHOT12_UNAUTHORIZED_COMPOSITION');
  validateEp004Shot12Production(inputProps);
  if(!/^[a-f0-9]{40}$/.test(FACTORY_SOURCE_SHA)
    ||inputProps.expectedSourceCommit!==FACTORY_SOURCE_SHA
    ||inputProps.episodeKey!=='EP004'||inputProps.shotKey!=='SHOT12'
    ||inputProps.previewOnly!==false||inputProps.directorCpuApproved!==true
    ||inputProps.breathFrames!==72
    ||Number(job.fps)!==30||Number(job.width)!==1920||Number(job.height)!==1080
    ||!Array.isArray(inputProps.verifiedCues)||inputProps.verifiedCues.length<2
    ||inputProps.verifiedCues.length>40
    ||!Number.isInteger(inputProps.previousFrameCount)
    ||inputProps.previousFrameCount<600||inputProps.previousFrameCount>9000
    ||inputProps.previousLastEncodedFrame!==inputProps.previousFrameCount-1
    ||inputProps.worldStartFrame!==inputProps.previousWorldStartFrame+inputProps.previousLastEncodedFrame
    ||!inputProps.previousShot11Props
    ||inputProps.previousShot11Props.expectedSourceCommit!==inputProps.previousSourceCommit
    ||inputProps.previousShot11Props.worldStartFrame!==inputProps.previousWorldStartFrame
    ||inputProps.previousShot11Props.durationInFrames!==inputProps.previousFrameCount
    ||!/^[a-f0-9]{64}$/.test(inputProps.previousVideoSha256||''))
    throw Error('EP004_SHOT12_AUTHENTIC_LOCKED_SOURCE_AND_APPROVED_TAKE_REQUIRED');
  await leaseClient.refresh();
  const res=await workloadTokens.request(
    BACKEND_URL+'/api/v1/remotion/renders/worker/'+job.renderId+
      '/ep004-shot12-selected-voice',
    {method:'GET',headers:headers({'X-Media-OS-Worker-Source-Sha':FACTORY_SOURCE_SHA})});
  if(!res.ok)throw Error('EP004_SHOT12_APPROVED_CURRENT_TAKE_UNAVAILABLE_'+res.status+
    ' '+(await res.text()).slice(0,180));
  const bytes=Buffer.from(await res.arrayBuffer());
  if(bytes.length<512||bytes.length>24*1024*1024)
    throw Error('EP004_SHOT12_APPROVED_AUDIO_BYTES_OUTSIDE_BOUND');
  if(bytes.length!==inputProps.voiceAudioBytes||createHash('sha256').update(bytes).digest('hex')!==inputProps.voiceAudioSha256)
    throw Error('SHOT12_SELECTED_VOICE_SHA256_CHANGED');
  return bytes;
}

async function preflightEp004Shot12PreviousVideo(job,inputProps,directory){
  if(job.compositionId!==EP004_SHOT12_REAL)throw Error('SHOT12_WRONG_COMPOSITION');
  await leaseClient.refresh();
  const res=await workloadTokens.request(
    BACKEND_URL+'/api/v1/remotion/renders/worker/'+job.renderId+
       '/ep004-shot12-previous-video',
    {method:'GET',headers:headers({'X-Media-OS-Worker-Source-Sha':FACTORY_SOURCE_SHA})});
  if(!res.ok)throw Error('SHOT12_LOCKED_SHOT11_MP4_UNAVAILABLE_'+res.status+
      ' '+(await res.text()).slice(0,210));
  const length=Number(res.headers.get('content-length')||0);
  if(length>134217728)throw Error('SHOT12_PREDECESSOR_SIZE_CAP_EXCEEDED');
  const bytes=Buffer.from(await res.arrayBuffer());
  if(bytes.length<1024||bytes.length>134217728)
    throw Error('SHOT12_PREVIOUS_MP4_BYTES_INVALID');
  const hash=createHash('sha256').update(bytes).digest('hex');
  if(hash!==inputProps.previousVideoSha256)
    throw Error('SHOT12_LOCKED_PREDECESSOR_SHA256_CHANGED');
  const source=path.join(directory,'locked-shot11.mp4');
  const last=path.join(directory,'locked-shot11-encoded-last.png');
  await fs.writeFile(source,bytes,{flag:'wx'});
  const checked=await captureNative('ffprobe',[
    '-v','error','-select_streams','v:0','-count_frames',
    '-show_entries','stream=nb_read_frames,width,height,r_frame_rate',
    '-of','json',source]);
  const stream=JSON.parse(checked.stdout).streams?.[0];
  if(!stream||stream.width!==1920||stream.height!==1080
    ||stream.r_frame_rate!=='30/1'
    ||Number(stream.nb_read_frames)!==inputProps.previousFrameCount)
    throw Error('SHOT12_PREDECESSOR_1080P30_AND_EXACT_FRAMES_CHANGED');
  await runProcess('ffmpeg',['-hide_banner','-loglevel','error','-xerror','-nostdin',
    '-i',source,'-vf','select=eq(n\\,'+inputProps.previousLastEncodedFrame+')',
    '-frames:v','1','-vsync','0','-y',last]);
  const png=await fs.readFile(last);
  if(png.length<10000||png.length>9000000)
    throw Error('SHOT12_AUTHENTIC_PREDECESSOR_FRAME_PNG_UNAVAILABLE');
  inputProps.previousLastFrameDataUri='data:image/png;base64,'+png.toString('base64');
  console.log('EP004_SHOT12_PREVIOUS_LOCKED_SHOT11_SHA256_LAST_FRAME_QA_PASS renderId='+
      job.renderId+' previousFrames='+stream.nb_read_frames);
  return {source,last};
}

async function muxEp004Shot12ApprovedVoice(job,videoPath,inputProps){
  if(job.compositionId!==EP004_SHOT12_REAL)return;
  const bytes=await fetchEp004Shot12ApprovedVoice(job,inputProps);
  const audio=path.join(os.tmpdir(),'ep004-shot12-'+job.renderId+'-approved-take');
  const muxed=path.join(os.tmpdir(),'ep004-shot12-'+job.renderId+'-mux.mp4');
  try{
    await fs.writeFile(audio,bytes,{flag:'wx'});
    const duration=Number(job.durationInFrames)/30;
    await runProcess('ffmpeg',['-hide_banner','-loglevel','error','-xerror',
      '-nostdin','-i',videoPath,'-i',audio,
      '-filter_complex',
      '[1:a]aresample=48000,adelay=2400:all=1,apad=whole_dur='+duration+'[approved]',
      '-map','0:v:0','-map','[approved]','-c:v','copy',
      '-c:a','aac','-b:a','192k','-ar','48000',
      '-t',String(duration),'-movflags','+faststart','-y',muxed]);
    const qa=await probeFactoryMedia(muxed);
    if(qa.width!==1920||qa.height!==1080||
       Math.abs(qa.duration-duration)>.55)
      throw Error('SHOT12_FINAL_AAC_H264_DIMENSIONS_OR_DURATION_INVALID');
    const silence=await captureNative('ffmpeg',[
      '-hide_banner','-nostdin','-i',muxed,'-t','1.8','-vn',
      '-af','volumedetect','-f','null','-']);
    const peak=silence.stderr.match(/max_volume:\s*(-?[0-9.]+) dB/);
    if(peak&&Number(peak[1])>-55)
      throw Error('SHOT12_FIRST_1_8_SECONDS_MUST_REMAIN_VOICE_SILENT');
    await fs.rename(muxed,videoPath);
    console.log('EP004_SHOT12_REAL_APPROVED_TAKE_72F_AUDIO_DELAY_QA_PASS renderId='+
      job.renderId+' duration='+duration);
  }finally{
    await fs.rm(audio,{force:true}).catch(()=>undefined);
    await fs.rm(muxed,{force:true}).catch(()=>undefined);
  }
}

async function verifyEp004Shot12SeamAndMotion(job,outputPath,lastPNG,directory){
  if(job.compositionId!==EP004_SHOT12_REAL)return;
  const first=path.join(directory,'shot12-first-real-frame.png');
  await runProcess('ffmpeg',['-hide_banner','-loglevel','error','-xerror','-nostdin',
      '-i',outputPath,'-vf','select=eq(n\\,0)',
      '-frames:v','1','-vsync','0','-y',first]);
  const compared=await captureNative('ffmpeg',[
      '-hide_banner','-i',lastPNG,'-i',first,
      '-filter_complex','[0:v][1:v]psnr','-f','null','-']);
  const matched=compared.stderr.match(/average:([0-9.]+)/);
  const psnr=matched?Number(matched[1]):NaN;
  if(!Number.isFinite(psnr)||psnr<34)
    throw Error('SHOT12_PREVIOUS_LAST_FRAME_TO_NEW_FIRST_FRAME_SEAM_FAILED');
  const frames=await captureNative('ffmpeg',[
      '-hide_banner','-loglevel','error','-i',outputPath,
      '-map','0:v:0','-an','-frames:v','30','-f','framemd5','-']);
  const hashes=frames.stdout.split('\n').filter(v=>v&&!v.startsWith('#'))
      .map(v=>v.split(',').at(-1)?.trim()).filter(Boolean);
  if(hashes.length!==30||new Set(hashes).size<5)
    throw Error('SHOT12_LIVING_ARCHITECTURE_FIRST_30_FRAMES_MUST_MOVE');
  console.log('EP004_SHOT12_SEAM_PSNR='+psnr.toFixed(2)+
      ' animatedFrames='+new Set(hashes).size+' renderId='+job.renderId);
}
const EP004_SHOT13_REAL=EP004_SHOT13_COMPOSITION;

async function fetchEp004Shot13ApprovedVoice(job,inputProps){
  if(job.compositionId!==EP004_SHOT13_REAL)
    throw Error('EP004_SHOT13_UNAUTHORIZED_COMPOSITION');
  validateEp004Shot13Production(inputProps);
  if(!/^[a-f0-9]{40}$/.test(FACTORY_SOURCE_SHA)
    ||inputProps.expectedSourceCommit!==FACTORY_SOURCE_SHA
    ||inputProps.episodeKey!=='EP004'||inputProps.shotKey!=='SHOT13'
    ||inputProps.previewOnly!==false||inputProps.directorCpuApproved!==true
    ||inputProps.breathFrames!==72
    ||Number(job.fps)!==30||Number(job.width)!==1920||Number(job.height)!==1080
    ||!Array.isArray(inputProps.verifiedCues)||inputProps.verifiedCues.length<2
    ||inputProps.verifiedCues.length>40
    ||!Number.isInteger(inputProps.previousFrameCount)
    ||inputProps.previousFrameCount<600||inputProps.previousFrameCount>9000
    ||inputProps.previousLastEncodedFrame!==inputProps.previousFrameCount-1
    ||inputProps.worldStartFrame!==inputProps.previousWorldStartFrame+inputProps.previousLastEncodedFrame
    ||!inputProps.previousShot12Props
    ||inputProps.previousShot12Props.expectedSourceCommit!==inputProps.previousSourceCommit
    ||inputProps.previousShot12Props.worldStartFrame!==inputProps.previousWorldStartFrame
    ||inputProps.previousShot12Props.durationInFrames!==inputProps.previousFrameCount
    ||!/^[a-f0-9]{64}$/.test(inputProps.previousVideoSha256||''))
    throw Error('EP004_SHOT13_AUTHENTIC_LOCKED_SOURCE_AND_APPROVED_TAKE_REQUIRED');
  await leaseClient.refresh();
  const res=await workloadTokens.request(
    BACKEND_URL+'/api/v1/remotion/renders/worker/'+job.renderId+
      '/ep004-shot13-selected-voice',
    {method:'GET',headers:headers({'X-Media-OS-Worker-Source-Sha':FACTORY_SOURCE_SHA})});
  if(!res.ok)throw Error('EP004_SHOT13_APPROVED_CURRENT_TAKE_UNAVAILABLE_'+res.status+
    ' '+(await res.text()).slice(0,180));
  const bytes=Buffer.from(await res.arrayBuffer());
  if(bytes.length<512||bytes.length>24*1024*1024)
    throw Error('EP004_SHOT13_APPROVED_AUDIO_BYTES_OUTSIDE_BOUND');
  if(bytes.length!==inputProps.voiceAudioBytes||createHash('sha256').update(bytes).digest('hex')!==inputProps.voiceAudioSha256)
    throw Error('SHOT13_SELECTED_VOICE_SHA256_CHANGED');
  return bytes;
}

async function preflightEp004Shot13PreviousVideo(job,inputProps,directory){
  if(job.compositionId!==EP004_SHOT13_REAL)throw Error('SHOT13_WRONG_COMPOSITION');
  await leaseClient.refresh();
  const res=await workloadTokens.request(
    BACKEND_URL+'/api/v1/remotion/renders/worker/'+job.renderId+
       '/ep004-shot13-previous-video',
    {method:'GET',headers:headers({'X-Media-OS-Worker-Source-Sha':FACTORY_SOURCE_SHA})});
  if(!res.ok)throw Error('SHOT13_LOCKED_SHOT12_MP4_UNAVAILABLE_'+res.status+
      ' '+(await res.text()).slice(0,210));
  const length=Number(res.headers.get('content-length')||0);
  if(length>134217728)throw Error('SHOT13_PREDECESSOR_SIZE_CAP_EXCEEDED');
  const bytes=Buffer.from(await res.arrayBuffer());
  if(bytes.length<1024||bytes.length>134217728)
    throw Error('SHOT13_PREVIOUS_MP4_BYTES_INVALID');
  const hash=createHash('sha256').update(bytes).digest('hex');
  if(hash!==inputProps.previousVideoSha256)
    throw Error('SHOT13_LOCKED_PREDECESSOR_SHA256_CHANGED');
  const source=path.join(directory,'locked-shot12.mp4');
  const last=path.join(directory,'locked-shot12-encoded-last.png');
  await fs.writeFile(source,bytes,{flag:'wx'});
  const checked=await captureNative('ffprobe',[
    '-v','error','-select_streams','v:0','-count_frames',
    '-show_entries','stream=nb_read_frames,width,height,r_frame_rate',
    '-of','json',source]);
  const stream=JSON.parse(checked.stdout).streams?.[0];
  if(!stream||stream.width!==1920||stream.height!==1080
    ||stream.r_frame_rate!=='30/1'
    ||Number(stream.nb_read_frames)!==inputProps.previousFrameCount)
    throw Error('SHOT13_PREDECESSOR_1080P30_AND_EXACT_FRAMES_CHANGED');
  await runProcess('ffmpeg',['-hide_banner','-loglevel','error','-xerror','-nostdin',
    '-i',source,'-vf','select=eq(n\\,'+inputProps.previousLastEncodedFrame+')',
    '-frames:v','1','-vsync','0','-y',last]);
  const png=await fs.readFile(last);
  if(png.length<10000||png.length>9000000)
    throw Error('SHOT13_AUTHENTIC_PREDECESSOR_FRAME_PNG_UNAVAILABLE');
  inputProps.previousLastFrameDataUri='data:image/png;base64,'+png.toString('base64');
  console.log('EP004_SHOT13_PREVIOUS_LOCKED_SHOT12_SHA256_LAST_FRAME_QA_PASS renderId='+
      job.renderId+' previousFrames='+stream.nb_read_frames);
  return {source,last};
}

async function muxEp004Shot13ApprovedVoice(job,videoPath,inputProps){
  if(job.compositionId!==EP004_SHOT13_REAL)return;
  const bytes=await fetchEp004Shot13ApprovedVoice(job,inputProps);
  const audio=path.join(os.tmpdir(),'ep004-shot13-'+job.renderId+'-approved-take');
  const muxed=path.join(os.tmpdir(),'ep004-shot13-'+job.renderId+'-mux.mp4');
  try{
    await fs.writeFile(audio,bytes,{flag:'wx'});
    const duration=Number(job.durationInFrames)/30;
    await runProcess('ffmpeg',['-hide_banner','-loglevel','error','-xerror',
      '-nostdin','-i',videoPath,'-i',audio,
      '-filter_complex',
      '[1:a]aresample=48000,adelay=2400:all=1,apad=whole_dur='+duration+'[approved]',
      '-map','0:v:0','-map','[approved]','-c:v','copy',
      '-c:a','aac','-b:a','192k','-ar','48000',
      '-t',String(duration),'-movflags','+faststart','-y',muxed]);
    const qa=await probeFactoryMedia(muxed);
    if(qa.width!==1920||qa.height!==1080||
       Math.abs(qa.duration-duration)>.55)
      throw Error('SHOT13_FINAL_AAC_H264_DIMENSIONS_OR_DURATION_INVALID');
    const silence=await captureNative('ffmpeg',[
      '-hide_banner','-nostdin','-i',muxed,'-t','1.8','-vn',
      '-af','volumedetect','-f','null','-']);
    const peak=silence.stderr.match(/max_volume:\s*(-?[0-9.]+) dB/);
    if(peak&&Number(peak[1])>-55)
      throw Error('SHOT13_FIRST_1_8_SECONDS_MUST_REMAIN_VOICE_SILENT');
    await fs.rename(muxed,videoPath);
    console.log('EP004_SHOT13_REAL_APPROVED_TAKE_72F_AUDIO_DELAY_QA_PASS renderId='+
      job.renderId+' duration='+duration);
  }finally{
    await fs.rm(audio,{force:true}).catch(()=>undefined);
    await fs.rm(muxed,{force:true}).catch(()=>undefined);
  }
}

async function verifyEp004Shot13SeamAndMotion(job,outputPath,lastPNG,directory){
  if(job.compositionId!==EP004_SHOT13_REAL)return;
  const first=path.join(directory,'shot13-first-real-frame.png');
  await runProcess('ffmpeg',['-hide_banner','-loglevel','error','-xerror','-nostdin',
      '-i',outputPath,'-vf','select=eq(n\\,0)',
      '-frames:v','1','-vsync','0','-y',first]);
  const compared=await captureNative('ffmpeg',[
      '-hide_banner','-i',lastPNG,'-i',first,
      '-filter_complex','[0:v][1:v]psnr','-f','null','-']);
  const matched=compared.stderr.match(/average:([0-9.]+)/);
  const psnr=matched?Number(matched[1]):NaN;
  if(!Number.isFinite(psnr)||psnr<34)
    throw Error('SHOT13_PREVIOUS_LAST_FRAME_TO_NEW_FIRST_FRAME_SEAM_FAILED');
  const frames=await captureNative('ffmpeg',[
      '-hide_banner','-loglevel','error','-i',outputPath,
      '-map','0:v:0','-an','-frames:v','30','-f','framemd5','-']);
  const hashes=frames.stdout.split('\n').filter(v=>v&&!v.startsWith('#'))
      .map(v=>v.split(',').at(-1)?.trim()).filter(Boolean);
  if(hashes.length!==30||new Set(hashes).size<5)
    throw Error('SHOT13_LIVING_ARCHITECTURE_FIRST_30_FRAMES_MUST_MOVE');
  console.log('EP004_SHOT13_SEAM_PSNR='+psnr.toFixed(2)+
      ' animatedFrames='+new Set(hashes).size+' renderId='+job.renderId);
}
const EP004_SHOT14_REAL=EP004_SHOT14_COMPOSITION;

async function fetchEp004Shot14ApprovedVoice(job,inputProps){
  if(job.compositionId!==EP004_SHOT14_REAL)
    throw Error('EP004_SHOT14_UNAUTHORIZED_COMPOSITION');
  validateEp004Shot14Production(inputProps);
  if(!/^[a-f0-9]{40}$/.test(FACTORY_SOURCE_SHA)
    ||inputProps.expectedSourceCommit!==FACTORY_SOURCE_SHA
    ||inputProps.episodeKey!=='EP004'||inputProps.shotKey!=='SHOT14'
    ||inputProps.previewOnly!==false||inputProps.directorCpuApproved!==true
    ||inputProps.breathFrames!==72
    ||Number(job.fps)!==30||Number(job.width)!==1920||Number(job.height)!==1080
    ||!Array.isArray(inputProps.verifiedCues)||inputProps.verifiedCues.length<2
    ||inputProps.verifiedCues.length>40
    ||!Number.isInteger(inputProps.previousFrameCount)
    ||inputProps.previousFrameCount<600||inputProps.previousFrameCount>9000
    ||inputProps.previousLastEncodedFrame!==inputProps.previousFrameCount-1
    ||inputProps.worldStartFrame!==inputProps.previousWorldStartFrame+inputProps.previousLastEncodedFrame
    ||!inputProps.previousShot13Props
    ||inputProps.previousShot13Props.expectedSourceCommit!==inputProps.previousSourceCommit
    ||inputProps.previousShot13Props.worldStartFrame!==inputProps.previousWorldStartFrame
    ||inputProps.previousShot13Props.durationInFrames!==inputProps.previousFrameCount
    ||!/^[a-f0-9]{64}$/.test(inputProps.previousVideoSha256||''))
    throw Error('EP004_SHOT14_AUTHENTIC_LOCKED_SOURCE_AND_APPROVED_TAKE_REQUIRED');
  await leaseClient.refresh();
  const res=await workloadTokens.request(
    BACKEND_URL+'/api/v1/remotion/renders/worker/'+job.renderId+
      '/ep004-shot14-selected-voice',
    {method:'GET',headers:headers({'X-Media-OS-Worker-Source-Sha':FACTORY_SOURCE_SHA})});
  if(!res.ok)throw Error('EP004_SHOT14_APPROVED_CURRENT_TAKE_UNAVAILABLE_'+res.status+
    ' '+(await res.text()).slice(0,180));
  const bytes=Buffer.from(await res.arrayBuffer());
  if(bytes.length<512||bytes.length>24*1024*1024)
    throw Error('EP004_SHOT14_APPROVED_AUDIO_BYTES_OUTSIDE_BOUND');
  if(bytes.length!==inputProps.voiceAudioBytes||createHash('sha256').update(bytes).digest('hex')!==inputProps.voiceAudioSha256)
    throw Error('SHOT14_SELECTED_VOICE_SHA256_CHANGED');
  return bytes;
}

async function preflightEp004Shot14PreviousVideo(job,inputProps,directory){
  if(job.compositionId!==EP004_SHOT14_REAL)throw Error('SHOT14_WRONG_COMPOSITION');
  await leaseClient.refresh();
  const res=await workloadTokens.request(
    BACKEND_URL+'/api/v1/remotion/renders/worker/'+job.renderId+
       '/ep004-shot14-previous-video',
    {method:'GET',headers:headers({'X-Media-OS-Worker-Source-Sha':FACTORY_SOURCE_SHA})});
  if(!res.ok)throw Error('SHOT14_LOCKED_SHOT13_MP4_UNAVAILABLE_'+res.status+
      ' '+(await res.text()).slice(0,210));
  const length=Number(res.headers.get('content-length')||0);
  if(length>134217728)throw Error('SHOT14_PREDECESSOR_SIZE_CAP_EXCEEDED');
  const bytes=Buffer.from(await res.arrayBuffer());
  if(bytes.length<1024||bytes.length>134217728)
    throw Error('SHOT14_PREVIOUS_MP4_BYTES_INVALID');
  const hash=createHash('sha256').update(bytes).digest('hex');
  if(hash!==inputProps.previousVideoSha256)
    throw Error('SHOT14_LOCKED_PREDECESSOR_SHA256_CHANGED');
  const source=path.join(directory,'locked-shot13.mp4');
  const last=path.join(directory,'locked-shot13-encoded-last.png');
  await fs.writeFile(source,bytes,{flag:'wx'});
  const checked=await captureNative('ffprobe',[
    '-v','error','-select_streams','v:0','-count_frames',
    '-show_entries','stream=nb_read_frames,width,height,r_frame_rate',
    '-of','json',source]);
  const stream=JSON.parse(checked.stdout).streams?.[0];
  if(!stream||stream.width!==1920||stream.height!==1080
    ||stream.r_frame_rate!=='30/1'
    ||Number(stream.nb_read_frames)!==inputProps.previousFrameCount)
    throw Error('SHOT14_PREDECESSOR_1080P30_AND_EXACT_FRAMES_CHANGED');
  await runProcess('ffmpeg',['-hide_banner','-loglevel','error','-xerror','-nostdin',
    '-i',source,'-vf','select=eq(n\\,'+inputProps.previousLastEncodedFrame+')',
    '-frames:v','1','-vsync','0','-y',last]);
  const png=await fs.readFile(last);
  if(png.length<10000||png.length>9000000)
    throw Error('SHOT14_AUTHENTIC_PREDECESSOR_FRAME_PNG_UNAVAILABLE');
  inputProps.previousLastFrameDataUri='data:image/png;base64,'+png.toString('base64');
  console.log('EP004_SHOT14_PREVIOUS_LOCKED_SHOT13_SHA256_LAST_FRAME_QA_PASS renderId='+
      job.renderId+' previousFrames='+stream.nb_read_frames);
  return {source,last};
}

async function muxEp004Shot14ApprovedVoice(job,videoPath,inputProps){
  if(job.compositionId!==EP004_SHOT14_REAL)return;
  const bytes=await fetchEp004Shot14ApprovedVoice(job,inputProps);
  const audio=path.join(os.tmpdir(),'ep004-shot14-'+job.renderId+'-approved-take');
  const muxed=path.join(os.tmpdir(),'ep004-shot14-'+job.renderId+'-mux.mp4');
  try{
    await fs.writeFile(audio,bytes,{flag:'wx'});
    const duration=Number(job.durationInFrames)/30;
    await runProcess('ffmpeg',['-hide_banner','-loglevel','error','-xerror',
      '-nostdin','-i',videoPath,'-i',audio,
      '-filter_complex',
      '[1:a]aresample=48000,adelay=2400:all=1,apad=whole_dur='+duration+'[approved]',
      '-map','0:v:0','-map','[approved]','-c:v','copy',
      '-c:a','aac','-b:a','192k','-ar','48000',
      '-t',String(duration),'-movflags','+faststart','-y',muxed]);
    const qa=await probeFactoryMedia(muxed);
    if(qa.width!==1920||qa.height!==1080||
       Math.abs(qa.duration-duration)>.55)
      throw Error('SHOT14_FINAL_AAC_H264_DIMENSIONS_OR_DURATION_INVALID');
    const silence=await captureNative('ffmpeg',[
      '-hide_banner','-nostdin','-i',muxed,'-t','1.8','-vn',
      '-af','volumedetect','-f','null','-']);
    const peak=silence.stderr.match(/max_volume:\s*(-?[0-9.]+) dB/);
    if(peak&&Number(peak[1])>-55)
      throw Error('SHOT14_FIRST_1_8_SECONDS_MUST_REMAIN_VOICE_SILENT');
    await fs.rename(muxed,videoPath);
    console.log('EP004_SHOT14_REAL_APPROVED_TAKE_72F_AUDIO_DELAY_QA_PASS renderId='+
      job.renderId+' duration='+duration);
  }finally{
    await fs.rm(audio,{force:true}).catch(()=>undefined);
    await fs.rm(muxed,{force:true}).catch(()=>undefined);
  }
}

async function verifyEp004Shot14SeamAndMotion(job,outputPath,lastPNG,directory){
  if(job.compositionId!==EP004_SHOT14_REAL)return;
  const first=path.join(directory,'shot14-first-real-frame.png');
  await runProcess('ffmpeg',['-hide_banner','-loglevel','error','-xerror','-nostdin',
      '-i',outputPath,'-vf','select=eq(n\\,0)',
      '-frames:v','1','-vsync','0','-y',first]);
  const compared=await captureNative('ffmpeg',[
      '-hide_banner','-i',lastPNG,'-i',first,
      '-filter_complex','[0:v][1:v]psnr','-f','null','-']);
  const matched=compared.stderr.match(/average:([0-9.]+)/);
  const psnr=matched?Number(matched[1]):NaN;
  if(!Number.isFinite(psnr)||psnr<34)
    throw Error('SHOT14_PREVIOUS_LAST_FRAME_TO_NEW_FIRST_FRAME_SEAM_FAILED');
  const frames=await captureNative('ffmpeg',[
      '-hide_banner','-loglevel','error','-i',outputPath,
      '-map','0:v:0','-an','-frames:v','30','-f','framemd5','-']);
  const hashes=frames.stdout.split('\n').filter(v=>v&&!v.startsWith('#'))
      .map(v=>v.split(',').at(-1)?.trim()).filter(Boolean);
  if(hashes.length!==30||new Set(hashes).size<5)
    throw Error('SHOT14_LIVING_ARCHITECTURE_FIRST_30_FRAMES_MUST_MOVE');
  console.log('EP004_SHOT14_SEAM_PSNR='+psnr.toFixed(2)+
      ' animatedFrames='+new Set(hashes).size+' renderId='+job.renderId);
}
const EP004_SHOT15_REAL=EP004_SHOT15_COMPOSITION;

async function fetchEp004Shot15ApprovedVoice(job,inputProps){
  if(job.compositionId!==EP004_SHOT15_REAL)
    throw Error('EP004_SHOT15_UNAUTHORIZED_COMPOSITION');
  validateEp004Shot15Production(inputProps);
  if(!/^[a-f0-9]{40}$/.test(FACTORY_SOURCE_SHA)
    ||inputProps.expectedSourceCommit!==FACTORY_SOURCE_SHA
    ||inputProps.episodeKey!=='EP004'||inputProps.shotKey!=='SHOT15'
    ||inputProps.previewOnly!==false||inputProps.directorCpuApproved!==true
    ||inputProps.breathFrames!==72
    ||Number(job.fps)!==30||Number(job.width)!==1920||Number(job.height)!==1080
    ||!Array.isArray(inputProps.verifiedCues)||inputProps.verifiedCues.length<2
    ||inputProps.verifiedCues.length>40
    ||!Number.isInteger(inputProps.previousFrameCount)
    ||inputProps.previousFrameCount<600||inputProps.previousFrameCount>9000
    ||inputProps.previousLastEncodedFrame!==inputProps.previousFrameCount-1
    ||inputProps.worldStartFrame!==inputProps.previousWorldStartFrame+inputProps.previousLastEncodedFrame
    ||!inputProps.previousShot14Props
    ||inputProps.previousShot14Props.expectedSourceCommit!==inputProps.previousSourceCommit
    ||inputProps.previousShot14Props.worldStartFrame!==inputProps.previousWorldStartFrame
    ||inputProps.previousShot14Props.durationInFrames!==inputProps.previousFrameCount
    ||!/^[a-f0-9]{64}$/.test(inputProps.previousVideoSha256||''))
    throw Error('EP004_SHOT15_AUTHENTIC_LOCKED_SOURCE_AND_APPROVED_TAKE_REQUIRED');
  await leaseClient.refresh();
  const res=await workloadTokens.request(
    BACKEND_URL+'/api/v1/remotion/renders/worker/'+job.renderId+
      '/ep004-shot15-selected-voice',
    {method:'GET',headers:headers({'X-Media-OS-Worker-Source-Sha':FACTORY_SOURCE_SHA})});
  if(!res.ok)throw Error('EP004_SHOT15_APPROVED_CURRENT_TAKE_UNAVAILABLE_'+res.status+
    ' '+(await res.text()).slice(0,180));
  const bytes=Buffer.from(await res.arrayBuffer());
  if(bytes.length<512||bytes.length>24*1024*1024)
    throw Error('EP004_SHOT15_APPROVED_AUDIO_BYTES_OUTSIDE_BOUND');
  if(bytes.length!==inputProps.voiceAudioBytes||createHash('sha256').update(bytes).digest('hex')!==inputProps.voiceAudioSha256)
    throw Error('SHOT15_SELECTED_VOICE_SHA256_CHANGED');
  return bytes;
}

async function preflightEp004Shot15PreviousVideo(job,inputProps,directory){
  if(job.compositionId!==EP004_SHOT15_REAL)throw Error('SHOT15_WRONG_COMPOSITION');
  await leaseClient.refresh();
  const res=await workloadTokens.request(
    BACKEND_URL+'/api/v1/remotion/renders/worker/'+job.renderId+
       '/ep004-shot15-previous-video',
    {method:'GET',headers:headers({'X-Media-OS-Worker-Source-Sha':FACTORY_SOURCE_SHA})});
  if(!res.ok)throw Error('SHOT15_LOCKED_SHOT14_MP4_UNAVAILABLE_'+res.status+
      ' '+(await res.text()).slice(0,210));
  const length=Number(res.headers.get('content-length')||0);
  if(length>134217728)throw Error('SHOT15_PREDECESSOR_SIZE_CAP_EXCEEDED');
  const bytes=Buffer.from(await res.arrayBuffer());
  if(bytes.length<1024||bytes.length>134217728)
    throw Error('SHOT15_PREVIOUS_MP4_BYTES_INVALID');
  const hash=createHash('sha256').update(bytes).digest('hex');
  if(hash!==inputProps.previousVideoSha256)
    throw Error('SHOT15_LOCKED_PREDECESSOR_SHA256_CHANGED');
  const source=path.join(directory,'locked-shot14.mp4');
  const last=path.join(directory,'locked-shot14-encoded-last.png');
  await fs.writeFile(source,bytes,{flag:'wx'});
  const checked=await captureNative('ffprobe',[
    '-v','error','-select_streams','v:0','-count_frames',
    '-show_entries','stream=nb_read_frames,width,height,r_frame_rate',
    '-of','json',source]);
  const stream=JSON.parse(checked.stdout).streams?.[0];
  if(!stream||stream.width!==1920||stream.height!==1080
    ||stream.r_frame_rate!=='30/1'
    ||Number(stream.nb_read_frames)!==inputProps.previousFrameCount)
    throw Error('SHOT15_PREDECESSOR_1080P30_AND_EXACT_FRAMES_CHANGED');
  await runProcess('ffmpeg',['-hide_banner','-loglevel','error','-xerror','-nostdin',
    '-i',source,'-vf','select=eq(n\\,'+inputProps.previousLastEncodedFrame+')',
    '-frames:v','1','-vsync','0','-y',last]);
  const png=await fs.readFile(last);
  if(png.length<10000||png.length>9000000)
    throw Error('SHOT15_AUTHENTIC_PREDECESSOR_FRAME_PNG_UNAVAILABLE');
  inputProps.previousLastFrameDataUri='data:image/png;base64,'+png.toString('base64');
  console.log('EP004_SHOT15_PREVIOUS_LOCKED_SHOT14_SHA256_LAST_FRAME_QA_PASS renderId='+
      job.renderId+' previousFrames='+stream.nb_read_frames);
  return {source,last};
}

async function muxEp004Shot15ApprovedVoice(job,videoPath,inputProps){
  if(job.compositionId!==EP004_SHOT15_REAL)return;
  const bytes=await fetchEp004Shot15ApprovedVoice(job,inputProps);
  const audio=path.join(os.tmpdir(),'ep004-shot15-'+job.renderId+'-approved-take');
  const muxed=path.join(os.tmpdir(),'ep004-shot15-'+job.renderId+'-mux.mp4');
  try{
    await fs.writeFile(audio,bytes,{flag:'wx'});
    const duration=Number(job.durationInFrames)/30;
    await runProcess('ffmpeg',['-hide_banner','-loglevel','error','-xerror',
      '-nostdin','-i',videoPath,'-i',audio,
      '-filter_complex',
      '[1:a]aresample=48000,adelay=2400:all=1,apad=whole_dur='+duration+'[approved]',
      '-map','0:v:0','-map','[approved]','-c:v','copy',
      '-c:a','aac','-b:a','192k','-ar','48000',
      '-t',String(duration),'-movflags','+faststart','-y',muxed]);
    const qa=await probeFactoryMedia(muxed);
    if(qa.width!==1920||qa.height!==1080||
       Math.abs(qa.duration-duration)>.55)
      throw Error('SHOT15_FINAL_AAC_H264_DIMENSIONS_OR_DURATION_INVALID');
    const silence=await captureNative('ffmpeg',[
      '-hide_banner','-nostdin','-i',muxed,'-t','1.8','-vn',
      '-af','volumedetect','-f','null','-']);
    const peak=silence.stderr.match(/max_volume:\s*(-?[0-9.]+) dB/);
    if(peak&&Number(peak[1])>-55)
      throw Error('SHOT15_FIRST_1_8_SECONDS_MUST_REMAIN_VOICE_SILENT');
    await fs.rename(muxed,videoPath);
    console.log('EP004_SHOT15_REAL_APPROVED_TAKE_72F_AUDIO_DELAY_QA_PASS renderId='+
      job.renderId+' duration='+duration);
  }finally{
    await fs.rm(audio,{force:true}).catch(()=>undefined);
    await fs.rm(muxed,{force:true}).catch(()=>undefined);
  }
}

async function verifyEp004Shot15SeamAndMotion(job,outputPath,lastPNG,directory){
  if(job.compositionId!==EP004_SHOT15_REAL)return;
  const first=path.join(directory,'shot15-first-real-frame.png');
  await runProcess('ffmpeg',['-hide_banner','-loglevel','error','-xerror','-nostdin',
      '-i',outputPath,'-vf','select=eq(n\\,0)',
      '-frames:v','1','-vsync','0','-y',first]);
  const compared=await captureNative('ffmpeg',[
      '-hide_banner','-i',lastPNG,'-i',first,
      '-filter_complex','[0:v][1:v]psnr','-f','null','-']);
  const matched=compared.stderr.match(/average:([0-9.]+)/);
  const psnr=matched?Number(matched[1]):NaN;
  if(!Number.isFinite(psnr)||psnr<34)
    throw Error('SHOT15_PREVIOUS_LAST_FRAME_TO_NEW_FIRST_FRAME_SEAM_FAILED');
  const frames=await captureNative('ffmpeg',[
      '-hide_banner','-loglevel','error','-i',outputPath,
      '-map','0:v:0','-an','-frames:v','30','-f','framemd5','-']);
  const hashes=frames.stdout.split('\n').filter(v=>v&&!v.startsWith('#'))
      .map(v=>v.split(',').at(-1)?.trim()).filter(Boolean);
  if(hashes.length!==30||new Set(hashes).size<5)
    throw Error('SHOT15_LIVING_ARCHITECTURE_FIRST_30_FRAMES_MUST_MOVE');
  console.log('EP004_SHOT15_SEAM_PSNR='+psnr.toFixed(2)+
      ' animatedFrames='+new Set(hashes).size+' renderId='+job.renderId);
}

async function muxFactorySelectedVoice(job,videoPath,inputProps) {
  if(job.compositionId!=='AT-FACTORY-SHOT')return;
  if(!/^[a-f0-9]{40}$/.test(FACTORY_SOURCE_SHA)
      ||inputProps.expectedSourceCommit!==FACTORY_SOURCE_SHA)
    throw Error('FACTORY_WORKER_SOURCE_COMMIT_MISMATCH');
  const requested=await workloadTokens.request(
    `${BACKEND_URL}/api/v1/remotion/renders/worker/${job.renderId}/factory-selected-voice`,
    {method:'GET',headers:headers()});
  if(!requested.ok)throw Error('FACTORY_APPROVED_VOICE_NOT_AVAILABLE: '+requested.status);
  const audio=Buffer.from(await requested.arrayBuffer());
  if(audio.length<100)throw Error('FACTORY_APPROVED_AUDIO_EMPTY');
  const audioPath=path.join(os.tmpdir(),`factory-${job.renderId}-voice`);
  const muxed=path.join(os.tmpdir(),`factory-${job.renderId}-mux.mp4`);
  try {
    await fs.writeFile(audioPath,audio);
    await runProcess('ffmpeg',['-hide_banner','-loglevel','error','-nostdin',
      '-i',videoPath,'-i',audioPath,'-map','0:v:0','-map','1:a:0',
      '-c:v','copy','-c:a','aac','-b:a','160k','-ar','48000',
      '-t',String(Number(job.durationInFrames)/30),
      '-movflags','+faststart','-y',muxed]);
    const check=await probeFactoryMedia(muxed);
    if(check.width!==Number(job.width)||check.height!==Number(job.height)
        ||Math.abs(check.duration-Number(job.durationInFrames)/30)>0.75)
      throw Error('FACTORY_VOICE_MUX_FAILED_AUDIO_VIDEO_SYNC_QA');
    await fs.rename(muxed,videoPath);
  } finally {
    await fs.rm(audioPath,{force:true}).catch(()=>undefined);
    await fs.rm(muxed,{force:true}).catch(()=>undefined);
  }
}

async function renderEp002DirectorV4Master(job,outputPath,inputProps,onProgress){
  const manifest=verifyManifest(JSON.parse(await fs.readFile(
    path.join(ENGINE_ROOT,'ep002-approved-master-manifest.json'),'utf8')));
  const originalIds=manifest.shots.map(s=>s.renderId);
  const ids=inputProps.sourceRenderIds;
  if(inputProps.directorPaidCpuConfirmed!==true
      ||inputProps.masterMode!==EP002_V4_MODE
      ||inputProps.transitionProfile!==EP002_V4_TRANSITION
      ||inputProps.breathingFramesPerSeam!==0
      ||inputProps.breathingSeams!==0
      ||inputProps.retimeSourceFrames!==false
      ||!Array.isArray(ids)||ids.length!==11
      ||ids.some((id,i)=>i!==9&&id!==originalIds[i])
      ||ids[9]!==EP002_V4_SHOT10
      ||ids[9]!==inputProps.shot10RenderId
      ||ids[9]===originalIds[9]
      ||!/^[a-f0-9]{64}$/.test(String(inputProps.sourceDigest||''))
      ||inputProps.expectedSourceCommit!==FACTORY_SOURCE_SHA
      ||!/^[a-f0-9]{40}$/.test(FACTORY_SOURCE_SHA)
      ||job.width!==1920||job.height!==1080||job.fps!==30
      ||job.profile!=='REVIEW'||Number(job.durationInFrames)!==23446)
    throw Error('EP002_V4_EXACT_CLEAN_SHOT10_NO_BRIDGE_PINS_OR_QUALITY_GUARD_FAILED');
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'mediaos-ep002-v4-master-'));
  try{
    let totalBytes=0;
    for(let i=0;i<11;i++){
      const response=await workloadTokens.request(BACKEND_URL+
        '/api/v1/remotion/renders/worker/'+job.renderId+
        '/ep002-master-source/'+ids[i],{method:'GET',headers:headers()});
      if(!response.ok)throw Error('EP002_V4_SOURCE_UNAVAILABLE_SHOT'+
        String(i+1).padStart(2,'0')+'_HTTP_'+response.status);
      const bytes=Buffer.from(await response.arrayBuffer());
      if(bytes.length<1024||bytes.length>256*1024*1024)
        throw Error('EP002_V4_SOURCE_BYTES_INVALID_SHOT'+(i+1));
      totalBytes+=bytes.length;
      if(totalBytes>2*1024*1024*1024)
        throw Error('EP002_V4_STAGED_BYTES_LIMIT_EXCEEDED');
      await fs.writeFile(path.join(dir,ids[i]+'.mp4'),bytes,{flag:'wx'});
      await onProgress(Math.min(29,5+Math.floor((i+1)*24/11)));
    }
    const pins=structuredClone(manifest);
    pins.shots[9].renderId=EP002_V4_SHOT10;
    pins.shots[9].expectedFrames=2360;
    const manifestPath=path.join(dir,'v4-exact-11-source-pins.json');
    await fs.writeFile(manifestPath,JSON.stringify(pins),{flag:'wx'});
    const inspected=await inspectLockedMaster({inputDir:dir,manifestPath});
    if(inspected.frames!==23446||
        inspected.inputRenderIds.some((id,i)=>id!==ids[i])||
        inspected.inputs[9].frames!==2360)
      throw Error('EP002_V4_SOURCE_LINEAGE_OR_TOTAL_CHANGED');
    await onProgress(32);
    const result=await renderEp002V4CleanCutMaster({
      inputs:inspected.inputs,outputFile:outputPath,confirmDirectorPaidRender:true,
      onProgress:async percentage=>onProgress(Math.max(32,Math.min(93,percentage))),
    });
    if(result.frames!==23446||result.seamCount!==10||
       result.addedFrames!==0||result.sourceFramesRetimed!==0||
       result.sourceFramesDropped!==0)
      throw Error('EP002_V4_NO_BRIDGE_OUTPUT_RECEIPT_INVALID');
    const final=await probeFactoryMedia(outputPath);
    if(final.width!==1920||final.height!==1080||
        Math.abs(final.duration-23446/30)>.4)
      throw Error('EP002_V4_FINAL_AV_FORMAT_OR_DURATION_INVALID');
    await onProgress(95);
    console.log('EP002_V4_CLEAN_CUT_MASTER_REVIEW_READY '+JSON.stringify({
      renderId:job.renderId,sourceCount:11,shot10RenderId:ids[9],
      frames:23446,durationSeconds:23446/30,addedFrames:0,
      bridgeCount:0,sourceFramesRetimed:0,
      narration:'EXISTING_SOURCE_TRACKS',status:'CREATIVE_REVIEW_REQUIRED',
    }));
  }finally{
    await fs.rm(dir,{recursive:true,force:true}).catch(()=>undefined);
  }
}

async function renderEp002DirectorV3Master(job,outputPath,inputProps,onProgress){
  const manifest=verifyManifest(JSON.parse(await fs.readFile(
    path.join(ENGINE_ROOT,'ep002-approved-master-manifest.json'),'utf8')));
  const baselineIds=manifest.shots.map(s=>s.renderId);
  const ids=inputProps.sourceRenderIds;
  if(inputProps.directorPaidCpuConfirmed!==true
      ||inputProps.masterMode!==EP002_V3_MODE
      ||inputProps.transitionProfile!==EP002_V3_TRANSITION
      ||inputProps.breathingFramesPerSeam!==60
      ||inputProps.breathingSeams!==10
      ||inputProps.retimeSourceFrames!==false
      ||!Array.isArray(ids)||ids.length!==11
      ||ids.some((id,i)=>i!==9&&id!==baselineIds[i])
      ||ids[9]!==inputProps.shot10RenderId
      ||ids[9]===baselineIds[9]
      ||!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(ids[9])
      ||!/^[a-f0-9]{64}$/.test(String(inputProps.sourceDigest||''))
      ||inputProps.expectedSourceCommit!==FACTORY_SOURCE_SHA
      ||!/^[a-f0-9]{40}$/.test(FACTORY_SOURCE_SHA)
      ||job.width!==1920||job.height!==1080||job.fps!==30
      ||job.profile!=='REVIEW'||Number(job.durationInFrames)!==24046)
    throw Error('EP002_V3_EXACT_DIRECTOR_SOURCE_PINS_OR_QUALITY_GUARD_FAILED');
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'mediaos-ep002-v3-master-'));
  try{
    let staged=0;
    for(let i=0;i<ids.length;i++){
      const response=await workloadTokens.request(BACKEND_URL+
        '/api/v1/remotion/renders/worker/'+job.renderId+
        '/ep002-master-source/'+ids[i],{method:'GET',headers:headers()});
      if(!response.ok)throw Error('EP002_V3_SOURCE_UNAVAILABLE_SHOT'+
        String(i+1).padStart(2,'0')+'_HTTP_'+response.status);
      const bytes=Buffer.from(await response.arrayBuffer());
      if(bytes.length<1024||bytes.length>256*1024*1024)
        throw Error('EP002_V3_EXACT_SOURCE_BYTES_INVALID_SHOT'+(i+1));
      staged+=bytes.length;
      if(staged>2*1024*1024*1024)
        throw Error('EP002_V3_STAGED_SOURCE_BYTES_LIMIT_EXCEEDED');
      await fs.writeFile(path.join(dir,ids[i]+'.mp4'),bytes,{flag:'wx'});
      await onProgress(Math.min(26,5+Math.floor((i+1)*21/11)));
    }
    const pinned=structuredClone(manifest);
    pinned.shots[9].renderId=ids[9];
    pinned.shots[9].expectedFrames=2360;
    const pathToManifest=path.join(dir,'v3-exact-pins.json');
    await fs.writeFile(pathToManifest,JSON.stringify(pinned),{flag:'wx'});
    const inspected=await inspectLockedMaster({inputDir:dir,
      manifestPath:pathToManifest});
    if(inspected.frames!==23446
      ||inspected.inputRenderIds.some((id,i)=>id!==ids[i]))
      throw Error('EP002_V3_SOURCE_MP4_LINEAGE_CHANGED');
    await onProgress(29);
    const result=await renderEp002DirectorContinuityMaster({
      inputs:inspected.inputs,
      outputFile:outputPath,
      confirmDirectorPaidRender:true,
      onProgress:async percent=>onProgress(Math.min(93,29+Math.floor(percent*.68))),
    });
    if(result.frames!==24046||result.seamCount!==10
      ||result.sourceFramesRetimed!==0||result.sourceFramesDropped!==0
      ||result.continuityAudit.length!==10)
      throw Error('EP002_V3_SEAM_CONTINUITY_RECEIPT_INVALID');
    const final=await probeFactoryMedia(outputPath);
    if(final.width!==1920||final.height!==1080
      ||Math.abs(final.duration-24046/30)>.4)
      throw Error('EP002_V3_COMPLETE_REAL_MP4_AV_QA_FAILED');
    console.log('EP002_V3_ALL_TEN_SEAMS_QA '+JSON.stringify({
      renderId:job.renderId,seams:result.continuityAudit,
      finalDurationSeconds:final.duration,finalFrames:result.frames,
    }));
    await onProgress(95);
    console.log('EP002_V3_FRAME_MATCHED_MASTER_REVIEW_READY '+JSON.stringify({
      renderId:job.renderId,sourceCount:11,
      cleanShot10:ids[9],frames:24046,breathingFramesPerSeam:60,
      transitionCount:10,retimedSourceFrames:0,
      status:'CREATIVE_REVIEW_REQUIRED',
    }));
  }finally{
    await fs.rm(dir,{recursive:true,force:true}).catch(()=>undefined);
  }
}

async function renderEp002DirectorV2Master(job,outputPath,inputProps,onProgress){
  const manifest=verifyManifest(JSON.parse(await fs.readFile(
    path.join(ENGINE_ROOT,'ep002-approved-master-manifest.json'),'utf8')));
  const baselineIds=manifest.shots.map(shot=>shot.renderId);
  const ids=inputProps.sourceRenderIds;
  if(inputProps.directorPaidCpuConfirmed!==true
      ||inputProps.masterMode!=='DIRECTOR_V2_60_FRAME_BREATHS'
      ||inputProps.breathingFramesPerSeam!==60
      ||inputProps.breathingSeams!==10
      ||!Array.isArray(ids)||ids.length!==11
      ||ids.some((id,i)=>i!==9&&id!==baselineIds[i])
      ||ids[9]===baselineIds[9]
      ||ids[9]!==inputProps.shot10RenderId
      ||!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(ids[9])
      ||!/^[a-f0-9]{64}$/.test(String(inputProps.sourceDigest||''))
      ||inputProps.expectedSourceCommit!==FACTORY_SOURCE_SHA
      ||!/^[a-f0-9]{40}$/.test(FACTORY_SOURCE_SHA)
      ||job.width!==1920||job.height!==1080||job.fps!==30
      ||job.profile!=='REVIEW'||Number(job.durationInFrames)!==24046)
    throw Error('EP002_V2_EXACT_DIRECTOR_SHOT10_BREATH_SOURCE_PIN_MISMATCH');
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'mediaos-ep002-v2-master-'));
  try{
    let totalBytes=0;
    for(let i=0;i<ids.length;i++){
      const response=await workloadTokens.request(BACKEND_URL+
        '/api/v1/remotion/renders/worker/'+job.renderId+
        '/ep002-master-source/'+ids[i],{method:'GET',headers:headers()});
      if(!response.ok)throw Error('EP002_V2_SOURCE_UNAVAILABLE_SHOT'+(i+1)+
        '_HTTP_'+response.status);
      const bytes=Buffer.from(await response.arrayBuffer());
      if(bytes.length<1024||bytes.length>256*1024*1024)
        throw Error('EP002_V2_APPROVED_SOURCE_BYTES_INVALID_SHOT'+(i+1));
      totalBytes+=bytes.length;
      if(totalBytes>2*1024*1024*1024)
        throw Error('EP002_V2_TOTAL_STAGED_SOURCE_TOO_LARGE');
      await fs.writeFile(path.join(dir,ids[i]+'.mp4'),bytes,{flag:'wx'});
      await onProgress(Math.min(26,5+Math.floor((i+1)*21/11)));
    }
    const derived=structuredClone(manifest);
    derived.shots[9].renderId=ids[9];
    derived.shots[9].expectedFrames=2360;
    const manifestPath=path.join(dir,'v2-source-pins.json');
    await fs.writeFile(manifestPath,JSON.stringify(derived),{flag:'wx'});
    const preflight=await inspectLockedMaster({inputDir:dir,manifestPath});
    if(preflight.frames!==23446
        ||preflight.inputs[9].renderId!==inputProps.shot10RenderId
        ||preflight.inputRenderIds.some((id,i)=>ids[i]!==id))
      throw Error('EP002_V2_SHOT10_INPUTS_CHANGED_AFTER_PIN');
    await onProgress(29);
    const result=await renderEp002DirectorBreathMaster({
      inputs:preflight.inputs,outputFile:outputPath,confirmDirectorPaidRender:true,
    });
    if(result.frames!==24046||result.breathingBoundaries!==10)
      throw Error('EP002_V2_TEN_BREATHS_OUTPUT_FRAMES_INVALID');
    const final=await probeFactoryMedia(outputPath);
    const expectedSeconds=24046/30;
    const durationDelta=Math.abs(final.duration-expectedSeconds);
    console.log('EP002_V2_FINAL_REAL_AV_QA '+JSON.stringify({
      renderId:job.renderId,width:final.width,height:final.height,
      actualSeconds:final.duration,expectedSeconds,durationDelta,
      maxDurationDeltaSeconds:0.4,exactFrames:result.frames,
    }));
    if(final.width!==1920||final.height!==1080||
        !Number.isFinite(durationDelta)||durationDelta>0.4)
      throw Error('EP002_V2_FINAL_REAL_AV_FORMAT_QA_FAILED');
    await onProgress(95);
    console.log('EP002_DIRECTOR_V2_BREATH_MASTER_REVIEW_READY '+JSON.stringify({
      renderId:job.renderId,shot10RenderId:ids[9],sourceCount:11,
      frames:24046,breathingSeams:10,breathingFramesPerSeam:60,
      status:'CREATIVE_REVIEW_REQUIRED',
    }));
  }finally{
    await fs.rm(dir,{recursive:true,force:true}).catch(()=>undefined);
  }
}

async function renderEp002DirectorMaster(job,outputPath,inputProps,onProgress){
  if(inputProps.masterMode===EP002_V4_MODE)
    return renderEp002DirectorV4Master(job,outputPath,inputProps,onProgress);
  if(inputProps.masterMode===EP002_V3_MODE)
    return renderEp002DirectorV3Master(job,outputPath,inputProps,onProgress);
  if(inputProps.masterMode==='DIRECTOR_V2_60_FRAME_BREATHS')
    return renderEp002DirectorV2Master(job,outputPath,inputProps,onProgress);

  const manifestPath=path.join(ENGINE_ROOT,'ep002-approved-master-manifest.json');
  const manifest=verifyManifest(JSON.parse(await fs.readFile(manifestPath,'utf8')));
  const ids=manifest.shots.map(s=>s.renderId);
  if(inputProps.directorPaidCpuConfirmed!==true
      ||inputProps.masterMode!=='EXACT_DIRECTOR_APPROVED_STREAM_COPY'
      ||!Array.isArray(inputProps.sourceRenderIds)
      ||inputProps.sourceRenderIds.length!==11
      ||inputProps.sourceRenderIds.some((id,i)=>id!==ids[i])
      ||!/^[a-f0-9]{64}$/.test(String(inputProps.sourceDigest||''))
      ||inputProps.expectedSourceCommit!==FACTORY_SOURCE_SHA
      ||!/^[a-f0-9]{40}$/.test(FACTORY_SOURCE_SHA)
      ||job.width!==1920||job.height!==1080||job.fps!==30
      ||job.profile!=='REVIEW'){
    throw Error('EP002_MASTER_DIRECTOR_APPROVAL_OR_EXACT_SOURCE_SHA_INVALID');
  }
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'mediaos-ep002-master-'));
  let cumulativeBytes=0;
  try{
    for(let index=0;index<ids.length;index++){
      const id=ids[index];
      const url=BACKEND_URL+'/api/v1/remotion/renders/worker/'+
        job.renderId+'/ep002-master-source/'+id;
      const response=await workloadTokens.request(url,{
        method:'GET',headers:headers()});
      if(!response.ok)
        throw Error('EP002_MASTER_EXACT_SOURCE_UNAVAILABLE '+manifest.shots[index].shotKey+
          ' HTTP '+response.status);
      const declaredSize=Number(response.headers.get('content-length')||0);
      if(declaredSize>256*1024*1024)
        throw Error('EP002_MASTER_SOURCE_TOO_LARGE '+id);
      const bytes=Buffer.from(await response.arrayBuffer());
      if(bytes.length<1000||bytes.length>256*1024*1024)
        throw Error('EP002_MASTER_SOURCE_BYTES_INVALID '+id);
      cumulativeBytes+=bytes.length;
      if(cumulativeBytes>2*1024*1024*1024)
        throw Error('EP002_MASTER_STAGED_SOURCE_BYTES_LIMIT_EXCEEDED');
      await fs.writeFile(path.join(dir,id+'.mp4'),bytes,{flag:'wx'});
      await onProgress(Math.min(70,5+Math.floor((index+1)*60/ids.length)));
    }
    const preflight=await inspectLockedMaster({inputDir:dir,manifestPath});
    if(preflight.frames!==Number(job.durationInFrames))
      throw Error('EP002_MASTER_SOURCE_FRAMES_CHANGED_BEFORE_ASSEMBLY');
    await onProgress(75);
    const result=await assembleLockedMaster({inputDir:dir,
      outputFile:outputPath,manifestPath,confirmDirectorPaidRender:true});
    if(result.frames!==Number(job.durationInFrames))
      throw Error('EP002_MASTER_OUTPUT_FRAMES_NOT_EQUAL_TO_PINNED_TOTAL');
    const probe=await probeFactoryMedia(outputPath);
    if(probe.width!==1920||probe.height!==1080||
        Math.abs(probe.duration-preflight.seconds)>0.8)
      throw Error('EP002_MASTER_FINAL_VIDEO_AUDIO_QA_FAILED');
    await onProgress(95);
    console.log('EP002_DIRECTOR_MASTER_REVIEW_READY '+JSON.stringify({
      renderId:job.renderId,
      sourceCount:11,
      totalFrames:result.frames,
      sourceDigest:inputProps.sourceDigest,
      status:'CREATIVE_REVIEW_REQUIRED',
    }));
  }finally{
    await fs.rm(dir,{recursive:true,force:true}).catch(()=>undefined);
  }
}

async function render(job) {
  const outputPath = path.join(os.tmpdir(), `media-os-remotion-${job.renderId}.mp4`);
  const inputProps = job.inputProps && typeof job.inputProps === 'object' ? job.inputProps : {};
  const tierPlusPlusPreflight=preflightTierPlusPlusRender(job,FACTORY_SOURCE_SHA);
  if(tierPlusPlusPreflight)
    console.log(tierPlusPlusReceipt('AT_TIER_PLUS_PLUS_RENDER_START',
      tierPlusPlusPreflight));

  console.log(
    `Rendering ${job.compositionId} renderId=${job.renderId} ${job.width}x${job.height}@${job.fps} frames=${job.durationInFrames}`,
  );

  const renderStartedAt = Date.now();
  let heartbeatProgress = 5;
  let shot03SourceScratch = null;
  let shot03SourceFrame = null;
  let shot04SourceScratch = null;
  let shot04SourceFrame = null;
  let shot05SourceScratch = null;
  let shot05SourceFrame = null;
  let shot06SourceScratch = null;
  let shot06SourceFrame = null;
  let shot07SourceScratch = null;
  let shot07SourceFrame = null;
  let shot08SourceScratch = null;
  let shot08SourceFrame = null;
  let shot09SourceScratch = null;
  let shot09SourceFrame = null;
  let shot10SourceScratch = null;
  let shot10SourceFrame = null;
  let shot11SourceScratch = null;
  let shot11SourceFrame = null;
  let shot12SourceScratch = null;
  let shot12SourceFrame = null;
  let shot13SourceScratch = null;
  let shot13SourceFrame = null;
  let shot14SourceScratch = null;
  let shot14SourceFrame = null;
  let shot15SourceScratch = null;
  let shot15SourceFrame = null;
  const heartbeat = setInterval(() => {
    void progress(job.renderId, heartbeatProgress);
  }, 15_000);

  try {
    if (job.compositionId === 'EP002-DIRECTOR-MASTER') {
      await renderEp002DirectorMaster(job,outputPath,inputProps,async value=>{
        heartbeatProgress=value;
        await progress(job.renderId,value);
      });
      heartbeatProgress=97;
      await progress(job.renderId,97);
      const bytes=await complete(job.renderId,outputPath);
      console.log('EP002 full eleven-SHOT Director review MP4 stored: '+
        job.renderId+' bytes='+bytes);
      return;
    }

    if (['AT-FACTORY-MASTER','AT-FACTORY-SHORT'].includes(job.compositionId)) {
      if(!/^[a-f0-9]{40}$/.test(FACTORY_SOURCE_SHA)
          ||inputProps.expectedSourceCommit!==FACTORY_SOURCE_SHA)
        throw Error('FACTORY_ASSEMBLY_WORKER_SOURCE_COMMIT_MISMATCH');
      await buildFactoryMedia(job,outputPath,{
        backendUrl:BACKEND_URL,
        authHeaders:headers,
        request:(url,options)=>workloadTokens.request(url,options),
        onProgress:async value=>{
          heartbeatProgress=value;
          await progress(job.renderId,value);
        },
      });
      heartbeatProgress=97;
      await progress(job.renderId,97);
      const bytes=await complete(job.renderId,outputPath);
      console.log(`Factory ${job.compositionId} completed ${job.renderId}: ${bytes} bytes`);
      return;
    }

    if (job.compositionId === 'EP001-Voice-CurrentPreview') {
      console.log(`Concatenating cumulative preview from ${Array.isArray(inputProps.segments) ? inputProps.segments.length : 0} rendered shot segment(s)`);
      await renderCumulativePreview(job, outputPath, inputProps);
      heartbeatProgress = 97;
      await progress(job.renderId, 97);
      const sizeBytes = await complete(job.renderId, outputPath);
      console.log(`Completed cumulative preview ${job.renderId}: ${sizeBytes} bytes`);
      return;
    }

    if (['EP002-SHOT01-DRAFT','EP002-SHOT02-CANDIDATE',
          'EP002-SHOT03-CANDIDATE','EP002-SHOT04-CANDIDATE','EP002-SHOT05-CANDIDATE','EP002-SHOT06-CANDIDATE','EP002-SHOT07-CANDIDATE','EP002-SHOT08-CANDIDATE','EP002-SHOT09-CANDIDATE','EP002-SHOT10-CANDIDATE','EP002-SHOT11-CANDIDATE'].includes(job.compositionId)) {
      await readEp002SelectedVoice(job, inputProps);
    }

    if (job.compositionId === 'EP004-SHOT02-TWO-GATEWAYS-V1-VISUAL') {
      await fetchEp004Shot02ApprovedVoice(job,inputProps);
      console.log('EP004_SHOT02_APPROVED_TAKE_CPU_PREFLIGHT_PASS renderId='+job.renderId);
    }
    if(job.compositionId===EP004_SHOT03_REAL){
      await fetchEp004Shot03ApprovedVoice(job,inputProps);
      shot03SourceScratch=await fs.mkdtemp(path.join(os.tmpdir(),
        'media-os-shot03-real-seam-'+job.renderId+'-'));
      shot03SourceFrame=await preflightEp004Shot03PreviousVideo(
        job,inputProps,shot03SourceScratch);
      console.log('EP004_SHOT03_APPROVED_VOICE_AND_ACTUAL_SOURCE_PRECPU_PASS renderId='+job.renderId);
    }

    if(job.compositionId===EP004_SHOT04_REAL){
      await fetchEp004Shot04ApprovedVoice(job,inputProps);
      shot04SourceScratch=await fs.mkdtemp(path.join(os.tmpdir(),
          'media-os-shot04-continuity-'+job.renderId+'-'));
      shot04SourceFrame=await preflightEp004Shot04PreviousVideo(
        job,inputProps,shot04SourceScratch);
      console.log('EP004_SHOT04_APPROVED_VOICE_AND_VERIFIED_SHOT03_PRECPU_PASS renderId='+
          job.renderId);
    }

    if(job.compositionId===EP004_SHOT05_REAL){
      const routeAudit=ep004Shot05VerifyReroute(inputProps.verifiedCues,inputProps.visualBeats,inputProps.durationInFrames);
      console.log('EP004_SHOT05_V9_ACTUAL_JOB_ROUTE_PRECPU_PASS '+JSON.stringify({renderId:job.renderId,...routeAudit}));
      await fetchEp004Shot05ApprovedVoice(job,inputProps);
      shot05SourceScratch=await fs.mkdtemp(path.join(os.tmpdir(),
          'media-os-shot05-continuity-'+job.renderId+'-'));
      shot05SourceFrame=await preflightEp004Shot05PreviousVideo(
        job,inputProps,shot05SourceScratch);
      console.log('EP004_SHOT05_APPROVED_VOICE_AND_VERIFIED_SHOT04_PRECPU_PASS renderId='+
          job.renderId);
    }

    if(job.compositionId===EP004_SHOT06_REAL){
      const motionAudit=verifyEp004Shot06ActualMotion(inputProps);
      console.log('EP004_SHOT06_ACTUAL_JOB_MOTION_PRECPU_PASS '+JSON.stringify({renderId:job.renderId,...motionAudit}));
      await fetchEp004Shot06ApprovedVoice(job,inputProps);
      shot06SourceScratch=await fs.mkdtemp(path.join(os.tmpdir(),'media-os-shot06-continuity-'+job.renderId+'-'));
      shot06SourceFrame=await preflightEp004Shot06PreviousVideo(job,inputProps,shot06SourceScratch);
      validateEp004Shot06Production(inputProps,true);
      console.log('EP004_SHOT06_APPROVED_VOICE_AND_VERIFIED_SHOT05_PRECPU_PASS renderId='+job.renderId);
    }
    if(job.compositionId===EP004_SHOT07_REAL){
      const motionAudit=verifyEp004Shot07ActualMotion(inputProps);
      console.log('EP004_SHOT07_ACTUAL_JOB_MOTION_PRECPU_PASS '+JSON.stringify({renderId:job.renderId,...motionAudit}));
      await fetchEp004Shot07ApprovedVoice(job,inputProps);
      shot07SourceScratch=await fs.mkdtemp(path.join(os.tmpdir(),'media-os-shot07-continuity-'+job.renderId+'-'));
      shot07SourceFrame=await preflightEp004Shot07PreviousVideo(job,inputProps,shot07SourceScratch);
      validateEp004Shot07Production(inputProps,true);
      console.log('EP004_SHOT07_APPROVED_VOICE_AND_VERIFIED_SHOT06_PRECPU_PASS renderId='+job.renderId);
    }
    if(job.compositionId===EP004_SHOT08_REAL){
      const motionAudit=verifyEp004Shot08ActualMotion(inputProps);
      console.log('EP004_SHOT08_ACTUAL_JOB_MOTION_PRECPU_PASS '+JSON.stringify({renderId:job.renderId,...motionAudit}));
      await fetchEp004Shot08ApprovedVoice(job,inputProps);
      shot08SourceScratch=await fs.mkdtemp(path.join(os.tmpdir(),'media-os-shot08-continuity-'+job.renderId+'-'));
      shot08SourceFrame=await preflightEp004Shot08PreviousVideo(job,inputProps,shot08SourceScratch);
      validateEp004Shot08Production(inputProps,true);
      console.log('EP004_SHOT08_APPROVED_VOICE_AND_VERIFIED_SHOT07_PRECPU_PASS renderId='+job.renderId);
    }

    if(job.compositionId===EP004_SHOT09_REAL){
      const motionAudit=verifyEp004Shot09ActualMotion(inputProps);
      console.log('EP004_SHOT09_ACTUAL_JOB_MOTION_PRECPU_PASS '+JSON.stringify({renderId:job.renderId,...motionAudit}));
      await fetchEp004Shot09ApprovedVoice(job,inputProps);
      shot09SourceScratch=await fs.mkdtemp(path.join(os.tmpdir(),'media-os-shot09-continuity-'+job.renderId+'-'));
      shot09SourceFrame=await preflightEp004Shot09PreviousVideo(job,inputProps,shot09SourceScratch);
      validateEp004Shot09Production(inputProps,true);
      console.log('EP004_SHOT09_APPROVED_VOICE_AND_VERIFIED_SHOT08_PRECPU_PASS renderId='+job.renderId);
    }

    if(job.compositionId===EP004_SHOT10_REAL){
      const motionAudit=verifyEp004Shot10ActualMotion(inputProps);
      console.log('EP004_SHOT10_ACTUAL_JOB_MOTION_PRECPU_PASS '+JSON.stringify({renderId:job.renderId,...motionAudit}));
      await fetchEp004Shot10ApprovedVoice(job,inputProps);
      shot10SourceScratch=await fs.mkdtemp(path.join(os.tmpdir(),'media-os-shot10-continuity-'+job.renderId+'-'));
      shot10SourceFrame=await preflightEp004Shot10PreviousVideo(job,inputProps,shot10SourceScratch);
      validateEp004Shot10Production(inputProps,true);
      console.log('EP004_SHOT10_APPROVED_VOICE_AND_VERIFIED_SHOT09_PRECPU_PASS renderId='+job.renderId);
    }
    if(job.compositionId===EP004_SHOT11_REAL){
      const motionAudit=verifyEp004Shot11ActualMotion(inputProps);
      console.log('EP004_SHOT11_ACTUAL_JOB_MOTION_PRECPU_PASS '+JSON.stringify({renderId:job.renderId,...motionAudit}));
      await fetchEp004Shot11ApprovedVoice(job,inputProps);
      shot11SourceScratch=await fs.mkdtemp(path.join(os.tmpdir(),'media-os-shot11-continuity-'+job.renderId+'-'));
      shot11SourceFrame=await preflightEp004Shot11PreviousVideo(job,inputProps,shot11SourceScratch);
      validateEp004Shot11Production(inputProps,true);
      console.log('EP004_SHOT11_APPROVED_VOICE_AND_VERIFIED_SHOT10_PRECPU_PASS renderId='+job.renderId);
    }
    if(job.compositionId===EP004_SHOT12_REAL){
      const motionAudit=verifyEp004Shot12ActualMotion(inputProps);
      console.log('EP004_SHOT12_ACTUAL_JOB_MOTION_PRECPU_PASS '+JSON.stringify({renderId:job.renderId,...motionAudit}));
      await fetchEp004Shot12ApprovedVoice(job,inputProps);
      shot12SourceScratch=await fs.mkdtemp(path.join(os.tmpdir(),'media-os-shot12-continuity-'+job.renderId+'-'));
      shot12SourceFrame=await preflightEp004Shot12PreviousVideo(job,inputProps,shot12SourceScratch);
      validateEp004Shot12Production(inputProps,true);
      console.log('EP004_SHOT12_APPROVED_VOICE_AND_VERIFIED_SHOT11_PRECPU_PASS renderId='+job.renderId);
    }
    if(job.compositionId===EP004_SHOT13_REAL){
      const motionAudit=verifyEp004Shot13ActualMotion(inputProps);
      console.log('EP004_SHOT13_ACTUAL_JOB_MOTION_PRECPU_PASS '+JSON.stringify({renderId:job.renderId,...motionAudit}));
      await fetchEp004Shot13ApprovedVoice(job,inputProps);
      shot13SourceScratch=await fs.mkdtemp(path.join(os.tmpdir(),'media-os-shot13-continuity-'+job.renderId+'-'));
      shot13SourceFrame=await preflightEp004Shot13PreviousVideo(job,inputProps,shot13SourceScratch);
      validateEp004Shot13Production(inputProps,true);
      console.log('EP004_SHOT13_APPROVED_VOICE_AND_VERIFIED_SHOT12_PRECPU_PASS renderId='+job.renderId);
    }
    if(job.compositionId===EP004_SHOT14_REAL){
      const motionAudit=verifyEp004Shot14ActualMotion(inputProps);
      console.log('EP004_SHOT14_ACTUAL_JOB_MOTION_PRECPU_PASS '+JSON.stringify({renderId:job.renderId,...motionAudit}));
      await fetchEp004Shot14ApprovedVoice(job,inputProps);
      shot14SourceScratch=await fs.mkdtemp(path.join(os.tmpdir(),'media-os-shot14-continuity-'+job.renderId+'-'));
      shot14SourceFrame=await preflightEp004Shot14PreviousVideo(job,inputProps,shot14SourceScratch);
      validateEp004Shot14Production(inputProps,true);
      console.log('EP004_SHOT14_APPROVED_VOICE_AND_VERIFIED_SHOT13_PRECPU_PASS renderId='+job.renderId);
    }
    if(job.compositionId===EP004_SHOT15_REAL){
      const motionAudit=verifyEp004Shot15ActualMotion(inputProps);
      console.log('EP004_SHOT15_ACTUAL_JOB_MOTION_PRECPU_PASS '+JSON.stringify({renderId:job.renderId,...motionAudit}));
      await fetchEp004Shot15ApprovedVoice(job,inputProps);
      shot15SourceScratch=await fs.mkdtemp(path.join(os.tmpdir(),'media-os-shot15-continuity-'+job.renderId+'-'));
      shot15SourceFrame=await preflightEp004Shot15PreviousVideo(job,inputProps,shot15SourceScratch);
      validateEp004Shot15Production(inputProps,true);
      console.log('EP004_SHOT15_APPROVED_VOICE_AND_VERIFIED_SHOT14_PRECPU_PASS renderId='+job.renderId);
    }

    const serveUrl = job.compositionId === 'AT-FACTORY-SHOT'
      ? await getFactoryServeUrl() : await getServeUrl();
    const composition = await selectComposition({
      serveUrl,
      id: job.compositionId,
      inputProps,
      browserExecutable: CHROMIUM_PATH,
      timeoutInMilliseconds: 120_000,
      logLevel: 'warn',
    });

    if (composition.fps !== Number(job.fps)) {
      throw new Error(`Composition fps mismatch expected=${job.fps} actual=${composition.fps}`);
    }
    if (composition.durationInFrames !== Number(job.durationInFrames)) {
      throw new Error(
        `Composition duration mismatch expected=${job.durationInFrames} actual=${composition.durationInFrames}`,
      );
    }

    const widthScale = Number(job.width) / composition.width;
    const heightScale = Number(job.height) / composition.height;
    if (Math.abs(widthScale - heightScale) > 0.0001) {
      throw new Error(`Output aspect ratio mismatch target=${job.width}x${job.height} composition=${composition.width}x${composition.height}`);
    }

    let lastBucket = -1;
    await renderMedia({
      composition,
      serveUrl,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps,
      browserExecutable: CHROMIUM_PATH,
      scale: widthScale,
      imageFormat: 'jpeg',
      jpegQuality: 90,
      crf: 18,
      x264Preset: 'veryfast',
      hardwareAcceleration: 'disable',
      overwrite: true,
      concurrency: RENDER_CONCURRENCY,
      disallowParallelEncoding: true,
      ffmpegOverride: ({args}) => {
        if (args.length === 0) return args;
        const output = args[args.length - 1];
        return [...args.slice(0, -1), '-threads', '2', output];
      },
      timeoutInMilliseconds: 120_000,
      logLevel: 'warn',
      onProgress: ({progress: ratio}) => {
        const percent = Math.max(5, Math.min(99, Math.round(ratio * 100)));
        heartbeatProgress = percent;
        const bucket = Math.floor(percent / 10);
        if (bucket !== lastBucket) {
          lastBucket = bucket;
          void progress(job.renderId, percent);
          console.log(`Render ${job.renderId} progress=${percent}%`);
        }
      },
    });

    if (job.compositionId === 'EP001-Shot10-SessionCreationShortV6') {
      await addShot10V6SoundDesign(job, outputPath, inputProps);
    }
    if (['EP002-SHOT01-DRAFT','EP002-SHOT02-CANDIDATE',
          'EP002-SHOT03-CANDIDATE','EP002-SHOT04-CANDIDATE','EP002-SHOT05-CANDIDATE','EP002-SHOT06-CANDIDATE','EP002-SHOT07-CANDIDATE','EP002-SHOT08-CANDIDATE','EP002-SHOT09-CANDIDATE','EP002-SHOT10-CANDIDATE','EP002-SHOT11-CANDIDATE'].includes(job.compositionId)) {
      await muxEp002SelectedVoice(job, outputPath, inputProps);
    }
    if (job.compositionId === 'AT-FACTORY-SHOT') {
      await muxFactorySelectedVoice(job,outputPath,inputProps);
    }
    if (job.compositionId === 'EP004-SHOT01-ORDINARY-WORKDAY-V1-VISUAL') {
      await muxEp004Shot01ApprovedVoice(job,outputPath,inputProps);
    }
    if (job.compositionId === 'EP004-SHOT02-TWO-GATEWAYS-V1-VISUAL') {
      await muxEp004Shot02ApprovedVoice(job,outputPath,inputProps);
    }
    if(job.compositionId===EP004_SHOT03_REAL){
      await muxEp004Shot03ApprovedVoice(job,outputPath,inputProps);
      await verifyEp004Shot03SeamAndMotion(job,outputPath,
        shot03SourceFrame.last,shot03SourceScratch);
    }
    if(job.compositionId===EP004_SHOT04_REAL){
      await muxEp004Shot04ApprovedVoice(job,outputPath,inputProps);
      await verifyEp004Shot04SeamAndMotion(job,outputPath,
        shot04SourceFrame.last,shot04SourceScratch);
    }
    if(job.compositionId===EP004_SHOT05_REAL){
      await muxEp004Shot05ApprovedVoice(job,outputPath,inputProps);
      await verifyEp004Shot05SeamAndMotion(job,outputPath,
        shot05SourceFrame.last,shot05SourceScratch);
    }
    if(job.compositionId===EP004_SHOT06_REAL){
      await compositeEp004Shot06MovingBridge(job,outputPath,shot06SourceFrame.bridge,shot06SourceScratch);
      await muxEp004Shot06ApprovedVoice(job,outputPath,inputProps);
      await verifyEp004Shot06SeamAndMotion(job,outputPath,
        shot06SourceFrame.last,shot06SourceScratch);
    }
    if(job.compositionId===EP004_SHOT07_REAL){
      await muxEp004Shot07ApprovedVoice(job,outputPath,inputProps);
      await verifyEp004Shot07SeamAndMotion(job,outputPath,
        shot07SourceFrame.last,shot07SourceScratch);
    }
    if(job.compositionId===EP004_SHOT08_REAL){
      await muxEp004Shot08ApprovedVoice(job,outputPath,inputProps);
      await verifyEp004Shot08SeamAndMotion(job,outputPath,
        shot08SourceFrame.last,shot08SourceScratch);
    }
    if(job.compositionId===EP004_SHOT09_REAL){
      await muxEp004Shot09ApprovedVoice(job,outputPath,inputProps);
      await verifyEp004Shot09SeamAndMotion(job,outputPath,
        shot09SourceFrame.last,shot09SourceScratch);
    }
    if(job.compositionId===EP004_SHOT10_REAL){
      await muxEp004Shot10ApprovedVoice(job,outputPath,inputProps);
      await verifyEp004Shot10SeamAndMotion(job,outputPath,
        shot10SourceFrame.last,shot10SourceScratch);
    }
    if(job.compositionId===EP004_SHOT11_REAL){
      await muxEp004Shot11ApprovedVoice(job,outputPath,inputProps);
      await verifyEp004Shot11SeamAndMotion(job,outputPath,
        shot11SourceFrame.last,shot11SourceScratch);
    }
    if(job.compositionId===EP004_SHOT12_REAL){
      await muxEp004Shot12ApprovedVoice(job,outputPath,inputProps);
      await verifyEp004Shot12SeamAndMotion(job,outputPath,
        shot12SourceFrame.last,shot12SourceScratch);
    }
    if(job.compositionId===EP004_SHOT13_REAL){
      await muxEp004Shot13ApprovedVoice(job,outputPath,inputProps);
      await verifyEp004Shot13SeamAndMotion(job,outputPath,
        shot13SourceFrame.last,shot13SourceScratch);
    }
    if(job.compositionId===EP004_SHOT14_REAL){
      await muxEp004Shot14ApprovedVoice(job,outputPath,inputProps);
      await verifyEp004Shot14SeamAndMotion(job,outputPath,
        shot14SourceFrame.last,shot14SourceScratch);
    }
    if(job.compositionId===EP004_SHOT15_REAL){
      await muxEp004Shot15ApprovedVoice(job,outputPath,inputProps);
      await verifyEp004Shot15SeamAndMotion(job,outputPath,
        shot15SourceFrame.last,shot15SourceScratch);
    }
    if(tierPlusPlusPreflight){
      // ffprobe independently checks H.264/AAC, 30 fps and a real output file.
      const probed=await probeFactoryMedia(outputPath);
      const mediaReceipt=verifyTierPlusPlusMedia(job,probed);
      console.log(tierPlusPlusReceipt('AT_TIER_PLUS_PLUS_MP4_QA',mediaReceipt));
    }
    heartbeatProgress = 97;
    await progress(job.renderId, 97);
    const sizeBytes = await complete(job.renderId, outputPath);
    console.log(`Completed ${job.renderId}: ${sizeBytes} bytes`);
    if(tierPlusPlusPreflight)
      console.log(tierPlusPlusReceipt('AT_TIER_PLUS_PLUS_DIRECTOR_REVIEW_PENDING',
        {renderId:job.renderId,status:'VISUAL_DIRECTOR_REVIEW_REQUIRED'}));
  } finally {
    if(shot03SourceScratch)await fs.rm(shot03SourceScratch,
      {recursive:true,force:true}).catch(()=>undefined);
    if(shot04SourceScratch)await fs.rm(shot04SourceScratch,
      {recursive:true,force:true}).catch(()=>undefined);
    if(shot05SourceScratch)await fs.rm(shot05SourceScratch,
      {recursive:true,force:true}).catch(()=>undefined);
    if(shot06SourceScratch)await fs.rm(shot06SourceScratch,
      {recursive:true,force:true}).catch(()=>undefined);
    if(shot07SourceScratch)await fs.rm(shot07SourceScratch,
      {recursive:true,force:true}).catch(()=>undefined);
    if(shot08SourceScratch)await fs.rm(shot08SourceScratch,
      {recursive:true,force:true}).catch(()=>undefined);
    if(shot09SourceScratch)await fs.rm(shot09SourceScratch,
      {recursive:true,force:true}).catch(()=>undefined);
    if(shot10SourceScratch)await fs.rm(shot10SourceScratch,
      {recursive:true,force:true}).catch(()=>undefined);
    if(shot11SourceScratch)await fs.rm(shot11SourceScratch,
      {recursive:true,force:true}).catch(()=>undefined);
    if(shot12SourceScratch)await fs.rm(shot12SourceScratch,
      {recursive:true,force:true}).catch(()=>undefined);
    if(shot13SourceScratch)await fs.rm(shot13SourceScratch,
      {recursive:true,force:true}).catch(()=>undefined);
    if(shot14SourceScratch)await fs.rm(shot14SourceScratch,
      {recursive:true,force:true}).catch(()=>undefined);
    if(shot15SourceScratch)await fs.rm(shot15SourceScratch,
      {recursive:true,force:true}).catch(()=>undefined);
    clearInterval(heartbeat);
    console.log(`REMOTION_RENDER_ELAPSED_SECONDS renderId=${job.renderId} elapsed=${((Date.now() - renderStartedAt) / 1000).toFixed(2)} concurrency=${RENDER_CONCURRENCY}`);
    await fs.rm(outputPath, {force: true}).catch(() => undefined);
  }
}

async function main() {
  console.log(`MediaOS Remotion CPU worker online: ${WORKER_ID} version=${WORKER_VERSION} renderConcurrency=${RENDER_CONCURRENCY} claimsEnabled=${CLAIMS_ENABLED}`);
  console.log(`Backend: ${BACKEND_URL}`);
  console.log(`Chromium: ${CHROMIUM_PATH}`);
  if (!/^[a-f0-9]{40}$/.test(FACTORY_SOURCE_SHA)) {
    console.error('Factory source SHA unavailable: capability registration disabled; CPU claims remain independently gated.');
  }

  while (true) {
    let job = null;
    try {await publishFactoryCapability();}
    catch(error){console.warn('Factory capability heartbeat unavailable:',error.message);}
    if (!CLAIMS_ENABLED) {
      await sleep(POLL_MS);
      continue;
    }
    try {
      job = await claim();
      if (!job) {
        await sleep(POLL_MS);
        continue;
      }
      console.log(`Claimed Remotion render ${job.renderId}`);
      const capabilityTimer=setInterval(()=>{void publishFactoryCapability().catch(error=>console.warn('Factory capability heartbeat during render unavailable:',error.message));},30000);
      try {await render(job);} finally {clearInterval(capabilityTimer);}
    } catch (error) {
      console.error('Remotion CPU worker error:', error);
      if (job?.renderId) await fail(job.renderId, error);
      await sleep(Math.max(POLL_MS, 2500));
    }
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
