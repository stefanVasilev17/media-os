import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const engine=path.dirname(fileURLToPath(import.meta.url));
const repo=path.resolve(engine,'..');
const read=p=>readFileSync(path.join(repo,p),'utf8');
const backend='backend/src/main/java/com/architecturalthinking/mediaos/';
const workflow=p=>read(backend+'workflow/'+p);
const remotion=p=>read(backend+'remotion/'+p);
const sys=p=>read(backend+'system/'+p);
const ui=p=>read('frontend/src/components/'+p);

test('SHOT04 is a separate Director-only paid CPU render, default disabled',()=>{
  const controller=workflow('Ep002Shot04PreviewController.java');
  assert.match(controller,/@RequestMapping\("\/api\/v1\/creative\/episodes\/EP002\/shots\/SHOT04\/render-preview"\)/);
  assert.match(controller,/DirectorIdentity\.requireDirector\(\)/);
  assert.match(controller,/confirmPaidCpuRender\(\)/);
  assert.match(controller,/MEDIA_OS_CREATION_PREFLIGHT/);
  assert.match(controller,/shot04RenderReadiness\(\)/);
  assert.match(controller,/shot\.currentVoiceApproved\(\)/);
  assert.match(controller,/shot\.hearSeeTimingVerified\(\)/);
  assert.match(controller,/size\(\)!=9/);
  assert.match(controller,/shot04-preview-enabled:false/);
  assert.match(controller,/MEDIAOS_SHOT04_RELEASE_WORKER_SHA/);
  const routes=sys('EpisodeFactoryDirectorRoutes.java');
  assert.match(routes,/SHOT04\/render-preview/);
  const audit=sys('GlobalCreationPreflightFilter.java');
  assert.match(audit,/SHOT04\/render-preview/);
  assert.match(audit,/lineage\.shot_key='SHOT04'/);
  assert.match(audit,/expectedSourceCommit'.*=lineage\.remotion_commit_sha/);
  assert.match(remotion('RemotionRenderController.java'),/ensureVerifiedEp002Shot04Preview/);
});

test('SHOT04 selected Take is revalidated before CPU claim and voice mux',()=>{
  const worker=remotion('RemotionCpuWorkerController.java');
  assert.match(worker,/SHOT04_SOURCE_VOICE_OR_CUES_STALE_BEFORE_CPU_CLAIM/);
  assert.match(worker,/matchesCurrentShot04Render/);
  assert.match(worker,/EP002-DIRECTOR-SHOT02-SHOT03-SHOT04/);
  assert.match(worker,/r\.input_props->>'shotKey'=case/);
  assert.match(worker,/then 'EP002_SHOT04'/);
  assert.match(worker,/then 'SHOT04' when r\.composition_id='EP002-SHOT05-CANDIDATE'/);
  assert.match(worker,/SHOT04 selected Take or Director voice cues changed during render/);
  const service=workflow('Ep002DirectorVoiceCueService.java');
  assert.match(service,/shot04RenderReadiness\(\)/);
  assert.match(service,/Ep002Shot04TermResolver\.resolve\(/);
  assert.match(service,/ep002_director_voice_cue_review/);
  assert.match(service,/review\.alignment_sha256=:alignment/);
});

test('No unapproved TTS or arbitrary direct EP002-SHOT04 Remotion API',()=>{
  const controller=remotion('RemotionRenderController.java');
  assert.match(controller,/"EP002-SHOT04-CANDIDATE"\.equals\(compositionId\)/);
  assert.match(controller,/new CompositionProfile\("EP002_SHOT04_CANDIDATE"/);
  const uiCode=ui('Ep002Shot04RenderPanel.tsx');
  assert.match(uiCode,/confirmPaidCpuRender:true/);
  assert.match(uiCode,/window\.confirm\(/);
  assert.match(uiCode,/9 REAL TERMS VERIFIED/);
  assert.match(ui('Ep002ProductionFactoryConsole.tsx'),/<Ep002Shot04RenderPanel\/>/);
  const workerJs=read('remotion-engine/cpu-worker.mjs');
  assert.match(workerJs,/SHOT04_WORKER_SOURCE_COMMIT_MISMATCH/);
  assert.match(workerJs,/EP002-SHOT04-CANDIDATE/);
  assert.match(workerJs,/muxEp002SelectedVoice\(job, outputPath, inputProps\)/);
  assert.doesNotMatch(uiCode,/\/generate-slow|\/align-existing-take/);
});
