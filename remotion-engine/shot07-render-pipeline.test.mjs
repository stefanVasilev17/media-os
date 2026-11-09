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

test('SHOT07 has independent Director-only paid render endpoint and source SHA preflight',()=>{
  const ctrl=workflow('Ep002Shot07PreviewController.java');
  assert.match(ctrl,/@RequestMapping\("\/api\/v1\/creative\/episodes\/EP002\/shots\/SHOT07\/render-preview"\)/);
  assert.match(ctrl,/DirectorIdentity\.requireDirector\(\)/);
  assert.match(ctrl,/confirmPaidCpuRender\(\)/);
  assert.match(ctrl,/MEDIA_OS_CREATION_PREFLIGHT/);
  assert.match(ctrl,/shot07RenderReadiness\(\)/);
  assert.match(ctrl,/MEDIAOS_SHOT07_RELEASE_WORKER_SHA/);
  assert.match(system('EpisodeFactoryDirectorRoutes.java'),/SHOT07\/render-preview/);
  assert.match(system('GlobalCreationPreflightFilter.java'),/SHOT07\/render-preview/);
  assert.match(system('GlobalCreationPreflightFilter.java'),/lineage\.shot_key='SHOT07'/);
});

test('SHOT07 selected Take checked twice before and during CPU; source SHA is pinned',()=>{
  const ctrl=worker('RemotionCpuWorkerController.java');
  assert.match(ctrl,/SHOT07_SOURCE_VOICE_OR_CUES_STALE_BEFORE_CPU_CLAIM/);
  assert.match(ctrl,/matchesCurrentShot07Render/);
  assert.match(ctrl,/EP002-SHOT07-CANDIDATE/);
  assert.match(ctrl,/EP002_SHOT07/);
  const voice=workflow('Ep002DirectorVoiceCueService.java');
  assert.match(voice,/Shot07RenderReadiness/);
  assert.match(voice,/Ep002Shot07TermResolver\.resolve/);
  assert.match(voice,/review\.alignment_sha256=:alignment/);
  const cpu=read('remotion-engine/cpu-worker.mjs');
  assert.match(cpu,/SHOT07_WORKER_SOURCE_COMMIT_MISMATCH/);
  assert.match(cpu,/muxEp002SelectedVoice/);
});

test('SHOT07 Director UI uses explicit paid CPU confirm and no paid voice calls',()=>{
  const panel=read('frontend/src/components/Ep002Shot07RenderPanel.tsx');
  assert.match(panel,/confirmPaidCpuRender:true/);
  assert.match(panel,/window\.confirm\(/);
  assert.match(panel,/15 REAL TERMS VERIFIED/);
  assert.match(read('frontend/src/components/Ep002ProductionFactoryConsole.tsx'),
    /<Ep002Shot07RenderPanel\/>/);
  assert.doesNotMatch(panel,/\/generate-slow|\/align-existing-take/);
  const terms=workflow('Ep002Shot07TermResolver.java');
  assert.match(terms,/RETRY_AMPLIFICATION/);
  assert.match(terms,/READ_ONLY_LOOKUP/);
  assert.match(terms,/normalize\(spec\.phrase\(\)\)/);
});
