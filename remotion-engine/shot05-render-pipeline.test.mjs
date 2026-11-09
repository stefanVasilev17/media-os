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
const front=p=>read('frontend/src/components/'+p);

test('SHOT05 is registered as a distinct Director-only explicitly paid CPU route',()=>{
  const ctl=workflow('Ep002Shot05PreviewController.java');
  assert.match(ctl,/@RequestMapping\("\/api\/v1\/creative\/episodes\/EP002\/shots\/SHOT05\/render-preview"\)/);
  assert.match(ctl,/DirectorIdentity\.requireDirector\(\)/);
  assert.match(ctl,/MEDIA_OS_CREATION_PREFLIGHT/);
  assert.match(ctl,/confirmPaidCpuRender\(\)/);
  assert.match(ctl,/shot05RenderReadiness\(\)/);
  assert.match(ctl,/size\(\)!=15/);
  assert.match(ctl,/shot05-preview-enabled:false/);
  assert.match(ctl,/MEDIAOS_SHOT05_RELEASE_WORKER_SHA/);
  assert.match(system('EpisodeFactoryDirectorRoutes.java'),/SHOT05\/render-preview/);
  const audit=system('GlobalCreationPreflightFilter.java');
  assert.match(audit,/SHOT05\/render-preview/);
  assert.match(audit,/lineage\.shot_key='SHOT05'/);
  assert.match(audit,/r\.input_props->>'expectedSourceCommit'=lineage\.remotion_commit_sha/);
  assert.match(worker('RemotionRenderController.java'),/ensureVerifiedEp002Shot05Preview/);
});

test('Worker refuses wrong SHA, Take, Director cues or unauthorized target scope',()=>{
  const ctl=worker('RemotionCpuWorkerController.java');
  assert.match(ctl,/SHOT05_SOURCE_VOICE_OR_CUES_STALE_BEFORE_CPU_CLAIM/);
  assert.match(ctl,/matchesCurrentShot05Render/);
  assert.match(ctl,/EP002-DIRECTOR-SHOT02-SHOT03-SHOT04-SHOT05/);
  assert.match(ctl,/EP002-SHOT05-CANDIDATE/);
  assert.match(ctl,/then 'EP002_SHOT05'/);
  assert.match(ctl,/then 'SHOT05' when r\.composition_id='EP002-SHOT06-CANDIDATE'/);
  assert.match(ctl,/SHOT05 selected Take or Director voice cues changed during render/);
  const service=workflow('Ep002DirectorVoiceCueService.java');
  assert.match(service,/shot05RenderReadiness\(\)/);
  assert.match(service,/Ep002Shot05TermResolver\.resolve/);
  assert.match(service,/review\.alignment_sha256=:alignment/);
  const cpu=read('remotion-engine/cpu-worker.mjs');
  assert.match(cpu,/SHOT05_WORKER_SOURCE_COMMIT_MISMATCH/);
  assert.match(cpu,/muxEp002SelectedVoice\(job, outputPath, inputProps\)/);
});

test('SHOT05 Director controls are read-only until verified and explicitly confirmed',()=>{
  const render=worker('RemotionRenderController.java');
  assert.match(render,/"EP002-SHOT05-CANDIDATE"\.equals\(compositionId\)/);
  assert.match(render,/new CompositionProfile\("EP002_SHOT05_CANDIDATE"/);
  const ui=front('Ep002Shot05RenderPanel.tsx');
  assert.match(ui,/confirmPaidCpuRender:true/);
  assert.match(ui,/window\.confirm\(/);
  assert.match(ui,/15 REAL TERMS VERIFIED/);
  assert.match(front('Ep002ProductionFactoryConsole.tsx'),/<Ep002Shot05RenderPanel\/>/);
  assert.doesNotMatch(ui,/\/generate-slow|\/align-existing-take/);
  const terms=workflow('Ep002Shot05TermResolver.java');
  assert.match(terms,/CONNECTION_POOL/);
  assert.match(terms,/TIME_RUNNING_OUT/);
  assert.match(terms,/normalize\(spec\.phrase\(\)\)/);
});
