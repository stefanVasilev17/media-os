import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {preflightTierPlusPlusRender} from './tier-plus-plus-render-quality.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>readFileSync(path.join(root,file),'utf8');
const sha='a'.repeat(40);
const ids=['USER_DATABASE','FIVE_HUNDRED','THROUGHPUT','SIX_FIFTY',
  'NINE_HUNDRED','ARRIVAL_RATE','UNFINISHED_WORK','BOTTLENECK',
  'SATURATION','LATENCY','STILL_WORKING'];
const starts=[30,250,480,650,725,920,1300,1670,1830,1990,2180];
const bs=[0,400,900,1250,1600,2300];
const job={
  compositionId:'EP002-SHOT03-CANDIDATE',renderId:'render-1',
  width:1920,height:1080,fps:30,durationInFrames:2300,
  inputProps:{
    expectedSourceCommit:sha,shotKey:'EP002_SHOT03',
    timingMode:'ELEVENLABS_CHARACTER_TIMESTAMPS',
    voiceTakeId:'32e02d0c-acff-4dbb-8bde-81dd41901474',
    inputFingerprint:'b'.repeat(64),scriptRevision:1,
    durationInFrames:2300,
    verifiedCues:bs.slice(0,5).map((startFrame,i)=>({
      beatNumber:i+1,spokenAnchor:'spoken anchor '+i,
      startFrame,endFrame:bs[i+1],
    })),
    termCues:ids.map((id,i)=>({
      id,spokenAnchor:'real spoken '+id,
      startFrame:starts[i],endFrame:starts[i]+10,
    })),
  },
};

test('preflight accepts current aligned SHOT03 at exactly 1920x1080 30fps',()=>{
  const result=preflightTierPlusPlusRender(job,sha);
  assert.equal(result.status,'TECHNICAL_PRECHECK_PASS');
  assert.ok(result.checks.includes('ELEVEN_REAL_TECHNICAL_TERMS'));
  assert.equal(result.visualStatus,'VISUAL_DIRECTOR_REVIEW_REQUIRED');
});

test('selected voice, source SHA and sequence are hard render gates',()=>{
  assert.throws(()=>preflightTierPlusPlusRender(job,'c'.repeat(40)),/WORKER_SHA/);
  assert.throws(()=>preflightTierPlusPlusRender({...job,width:1280},sha),/REQUIRES_1920/);
  assert.throws(()=>preflightTierPlusPlusRender({...job,inputProps:{
    ...job.inputProps,voiceTakeId:''}},sha),/SHOT03_SELECTED/);
  assert.throws(()=>preflightTierPlusPlusRender({...job,inputProps:{
    ...job.inputProps,termCues:job.inputProps.termCues.slice(1)}},sha),/SHOT03_SELECTED/);
  assert.throws(()=>preflightTierPlusPlusRender({...job,inputProps:{
    ...job.inputProps,postVoiceHoldFrames:60}},sha),/SHOT03_SELECTED/);
  assert.throws(()=>preflightTierPlusPlusRender({...job,inputProps:{
    ...job.inputProps,termCues:[...job.inputProps.termCues].reverse()}},sha),
    /SHOT03_REAL_TERM_SEQUENCE/);
});

test('Director authorization and historic SHOT02 protection are explicit',()=>{
  const renderer=read('backend/src/main/java/com/architecturalthinking/mediaos/remotion/RemotionRenderController.java');
  const controller=read('backend/src/main/java/com/architecturalthinking/mediaos/workflow/Ep002Shot03PreviewController.java');
  const security=read('backend/src/main/java/com/architecturalthinking/mediaos/system/EpisodeFactoryDirectorRoutes.java');
  const preflight=read('backend/src/main/java/com/architecturalthinking/mediaos/system/GlobalCreationPreflightFilter.java');
  const worker=read('backend/src/main/java/com/architecturalthinking/mediaos/remotion/RemotionCpuWorkerController.java');
  const workerJS=read('remotion-engine/cpu-worker.mjs');
  for(const needle of ['SHOT03/render-preview','DirectorIdentity.requireDirector()',
    'confirmPaidCpuRender','pinnedWorkerSha','shot03RenderReadiness()'])
    assert.ok(controller.includes(needle),'missing '+needle);
  assert.match(renderer,/ensureVerifiedEp002Shot03Preview/);
  assert.match(renderer,/EP002-SHOT03-CANDIDATE/);
  assert.match(security,/SHOT03\/render-preview/);
  assert.match(preflight,/SHOT03\/render-preview/);
  assert.match(worker,/matchesCurrentShot03Render/);
  assert.match(worker,/SHOT03_SOURCE_VOICE_OR_CUES_STALE_BEFORE_CPU_CLAIM/);
  assert.match(worker,/composition_id<>'EP002-SHOT03-CANDIDATE'/);
  assert.match(workerJS,/SHOT03_WORKER_SOURCE_COMMIT_MISMATCH/);
  assert.match(workerJS,/SHOT02_WORKER_SOURCE_COMMIT_MISMATCH/);
  assert.match(workerJS,/muxEp002SelectedVoice/);
  assert.match(workerJS,/TARGET_COMPOSITION/);
  assert.match(controller,/renderEnabled/);
  assert.doesNotMatch(controller,/generateSpeech|elevenLabs\.generate/);
});

test('new Director UI requires explicit paid confirmation and retains MP4 visual review',()=>{
  const ui=read('frontend/src/components/Ep002Shot03RenderPanel.tsx');
  const parent=read('frontend/src/components/Ep002ProductionFactoryConsole.tsx');
  assert.match(ui,/window\.confirm\(/);
  assert.match(ui,/confirmPaidCpuRender:true/);
  assert.match(ui,/Director visual review/);
  assert.match(ui,/1920×1080/);
  assert.match(parent,/Ep002Shot03RenderPanel/);
});
