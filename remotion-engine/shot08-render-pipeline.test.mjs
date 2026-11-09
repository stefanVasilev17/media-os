import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(path.join(root,p),'utf8');
const base='backend/src/main/java/com/architecturalthinking/mediaos/';
const workflow=p=>read(base+'workflow/'+p);
const worker=p=>read(base+'remotion/'+p);
const system=p=>read(base+'system/'+p);

test('SHOT08 is standalone Director-paid rendering; all three read-only GETs exist',()=>{
  const ctrl=workflow('Ep002Shot08PreviewController.java');
  assert.match(ctrl,/@RequestMapping\("\/api\/v1\/creative\/episodes\/EP002\/shots\/SHOT08\/render-preview"\)/);
  assert.match(ctrl,/DirectorIdentity\.requireDirector\(\)/);
  assert.match(ctrl,/confirmPaidCpuRender\(\)/);
  assert.match(ctrl,/MEDIA_OS_CREATION_PREFLIGHT/);
  assert.match(ctrl,/shot08RenderReadiness\(\)/);
  assert.match(ctrl,/MEDIAOS_SHOT08_RELEASE_WORKER_SHA/);
  assert.match(ctrl,/@GetMapping\("\/capability"\)/);
  assert.match(ctrl,/@GetMapping\s+@Transactional\(readOnly=true/);
  const cues=workflow('Ep002DirectorVoiceCueController.java');
  assert.match(cues,/@GetMapping\("\/SHOT08\/render-readiness"\)/);
  assert.match(cues,/Shot08RenderReadiness shot08RenderReadiness/);
  assert.match(system('EpisodeFactoryDirectorRoutes.java'),/SHOT08\/render-preview/);
  const audit=system('GlobalCreationPreflightFilter.java');
  assert.match(audit,/SHOT08\/render-preview/);
  assert.match(audit,/lineage\.shot_key='SHOT08'/);
});

test('SHOT08 Worker rejects stale selected Take on claim and on final audio mux',()=>{
  const workerSrc=worker('RemotionCpuWorkerController.java');
  assert.match(workerSrc,/SHOT08_SOURCE_VOICE_OR_CUES_STALE_BEFORE_CPU_CLAIM/);
  assert.match(workerSrc,/matchesCurrentShot08Render/);
  assert.match(workerSrc,/EP002-SHOT08-CANDIDATE/);
  assert.match(workerSrc,/EP002_SHOT08/);
  const voice=workflow('Ep002DirectorVoiceCueService.java');
  assert.match(voice,/Shot08RenderReadiness/);
  assert.match(voice,/Ep002Shot08TermResolver\.resolve/);
  assert.match(voice,/review\.alignment_sha256=:alignment/);
  const cpu=read('remotion-engine/cpu-worker.mjs');
  assert.match(cpu,/SHOT08_WORKER_SOURCE_COMMIT_MISMATCH/);
  assert.match(cpu,/muxEp002SelectedVoice/);
});

test('SHOT08 UI requires explicit paid confirmation and never generates voice',()=>{
  const panel=read('frontend/src/components/Ep002Shot08RenderPanel.tsx');
  assert.match(panel,/confirmPaidCpuRender:true/);
  assert.match(panel,/window\.confirm\(/);
  assert.match(panel,/15 REAL TERMS VERIFIED/);
  assert.match(panel,/voice-cue-review\/SHOT08\/render-readiness/);
  assert.match(panel,/shots\/SHOT08\/render-preview/);
  assert.match(read('frontend/src/components/Ep002ProductionFactoryConsole.tsx'),
    /<Ep002Shot08RenderPanel\/>/);
  assert.doesNotMatch(panel,/\/generate-slow|\/align-existing-take/);
  const resolver=workflow('Ep002Shot08TermResolver.java');
  assert.match(resolver,/HORIZONTAL_SCALING/);
  assert.match(resolver,/SCALED_NOT_BOTTLENECK/);
  assert.match(resolver,/normalize\(spec\.phrase\(\)\)/);
});
