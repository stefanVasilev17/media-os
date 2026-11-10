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
  assert.match(ctrl,/SHOT07_LOCKED_RENDER=UUID\.fromString/);
  assert.match(ctrl,/b2a335dd-cb71-48f2-bf47-0f8bdcdd969d/);
  assert.match(ctrl,/d4fd0701f7298903dad2167e38bb7931edeae6bb/);
  assert.match(ctrl,/r\.status='SUCCEEDED'/);
  assert.match(ctrl,/r\.input_props->>'criticalPulseStartFrame'/);
  assert.match(ctrl,/jsonb_array_elements\(r\.input_props->'termCues'\)/);
  assert.match(ctrl,/lockedShot07Boundary\(\)/);
  assert.match(ctrl,/props\.put\("lockedShot07Handoff",lockedBoundary\)/);
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

test('SHOT08 worker voice read accepts source-verified automatic cues, never bypasses Take ownership',()=>{
  const cpuController=worker('RemotionCpuWorkerController.java');
  assert.match(cpuController,/and r\.status='RUNNING' and r\.worker_id=:worker/);
  assert.match(cpuController,/and t\.revision=\(/);
  assert.match(cpuController,/and \(r\.composition_id in \('EP002-SHOT08-CANDIDATE',\s*'EP002-SHOT09-CANDIDATE'\)\s+or exists\(/);
  assert.match(cpuController,/review\.selected_take_id=t\.id/);
  assert.match(cpuController,/ep002Cues\.matchesCurrentShot08Render\(/);
  assert.match(cpuController,/r\.input_props->>'expectedSourceCommit'=:sourceSha/);
  const once=workflow('Ep002Shot08UserRequestedRenderLaunch.java');
  assert.match(once,/CHAT_RETRY_LIMIT_REACHED_FOR_APPROVED_TAKE/);
  assert.match(once,/SHOT08_CHAT_REQUEST_ALREADY_PRESENT/);
  assert.match(once,/USER_EXPLICIT_CHAT_REQUEST_2026_11_09_SHOT08_RECOVERY_RENDER/);
});
