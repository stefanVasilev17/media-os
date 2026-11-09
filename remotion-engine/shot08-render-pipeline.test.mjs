import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(path.join(root,p),'utf8');
const java='backend/src/main/java/com/architecturalthinking/mediaos/';
const workflow=p=>read(java+'workflow/'+p);
const worker=p=>read(java+'remotion/'+p);
const system=p=>read(java+'system/'+p);
const remotion=p=>read('remotion-engine/'+p);

test('SHOT08 recovery is one Director-controlled paid render with current approved Take',()=>{
  const ctrl=workflow('Ep002Shot08PreviewController.java');
  assert.match(ctrl,/@RequestMapping\("\/api\/v1\/creative\/episodes\/EP002\/shots\/SHOT08\/render-preview"\)/);
  assert.match(ctrl,/DirectorIdentity\.requireDirector\(\)/);
  assert.match(ctrl,/confirmPaidCpuRender\(\)/);
  assert.match(ctrl,/MEDIA_OS_CREATION_PREFLIGHT/);
  assert.match(ctrl,/shot08RenderReadiness\(\)/);
  assert.match(ctrl,/MEDIAOS_SHOT08_RELEASE_WORKER_SHA/);
  assert.match(ctrl,/Ep002RecoverySource\.RECOVERY_VISUAL_BLOB_SHA/);
  const service=workflow('Ep002DirectorVoiceCueService.java');
  assert.match(service,/CURRENT_APPROVED_SLOW_NATURAL_TAKE_REAL_6_BEATS_21_TERMS_AUTO_ALIGNED/);
  assert.match(service,/Ep002VoiceBeatResolver\.resolve/);
  assert.match(service,/Ep002Shot08TermResolver\.resolve/);
  const resolver=workflow('Ep002Shot08TermResolver.java');
  assert.match(resolver,/SHARED_BUDGET/);
  assert.match(resolver,/CAPACITY_UNCHANGED/);
  assert.doesNotMatch(resolver,/THREE_TO_SIX|HORIZONTAL_SCALING/);
  assert.match(system('EpisodeFactoryDirectorRoutes.java'),/SHOT08\/render-preview/);
  assert.match(system('GlobalCreationPreflightFilter.java'),/SHOT08\/render-preview/);
});

test('SHOT08 actual selected Take is checked by backend before claim and audio mux',()=>{
  const workerSrc=worker('RemotionCpuWorkerController.java');
  assert.match(workerSrc,/SHOT08_SOURCE_VOICE_OR_CUES_STALE_BEFORE_CPU_CLAIM/);
  assert.match(workerSrc,/matchesCurrentShot08Render/);
  assert.match(workerSrc,/EP002_SHOT08/);
  const cpu=remotion('cpu-worker.mjs');
  assert.match(cpu,/SHOT08_WORKER_SOURCE_COMMIT_MISMATCH/);
  assert.match(cpu,/muxEp002SelectedVoice/);
  assert.match(cpu,/preflightTierPlusPlusRender/);
});

test('SHOT08 render UI includes cost consent and recorded video link',()=>{
  const panel=read('frontend/src/components/Ep002Shot08RenderPanel.tsx');
  assert.match(panel,/confirmPaidCpuRender:true/);
  assert.match(panel,/window\.confirm\(/);
  assert.match(panel,/voice-cue-review\/SHOT08\/render-readiness/);
  assert.match(panel,/Watch SHOT08 MP4/);
  assert.doesNotMatch(panel,/\/generate-slow|\/align-existing-take/);
});
