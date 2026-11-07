import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

const remotionRoot=path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot=path.resolve(remotionRoot,'..');
const read=(name)=>readFileSync(path.join(repositoryRoot,name),'utf8');

const root=read('remotion-engine/src/Root.tsx');
const scene=read('remotion-engine/src/episodes/ep002/Shot02GeneratedScene.tsx');
const controller=read('backend/src/main/java/com/architecturalthinking/mediaos/workflow/Ep002DirectorVoiceCueController.java');
const service=read('backend/src/main/java/com/architecturalthinking/mediaos/workflow/Ep002DirectorVoiceCueService.java');
const resolver=read('backend/src/main/java/com/architecturalthinking/mediaos/workflow/Ep002Shot02TermResolver.java');
const preview=read('backend/src/main/java/com/architecturalthinking/mediaos/workflow/Ep002Shot02PreviewController.java');
const renderApi=read('backend/src/main/java/com/architecturalthinking/mediaos/remotion/RemotionRenderController.java');
const workerApi=read('backend/src/main/java/com/architecturalthinking/mediaos/remotion/RemotionCpuWorkerController.java');
const preflight=read('backend/src/main/java/com/architecturalthinking/mediaos/system/GlobalCreationPreflightFilter.java');
const worker=read('remotion-engine/cpu-worker.mjs');
const workerDocker=read('Dockerfile.remotion-worker');
const ui=read('frontend/src/components/Ep002Shot02RenderPanel.tsx');


test('SHOT02 candidate is registered but requires genuine render input',()=>{
  assert.match(root,/id="EP002-SHOT02-CANDIDATE"/);
  assert.match(root,/component=\{Shot02DirectorVisualV5\}/);
  assert.match(root,/durationInFrames=\{dynamicDuration \?\? 6\}/);
  assert.match(root,/voiceTakeId: ''/);
  assert.match(root,/verifiedCues: \[\]/);
  assert.match(root,/termCues: \[\]/);
  assert.match(scene,/requireShot02VerifiedCues/);
  assert.match(scene,/requireShot02SpokenTerms/);
  assert.doesNotMatch(root,/id="EP002-SHOT02-CANDIDATE"[\s\S]{0,370}1205/);
});

test('read-only Director endpoint rejects stale fingerprint or unapproved voice',()=>{
  assert.match(controller,/@GetMapping\("\/SHOT02\/render-readiness"\)/);
  assert.match(controller,/DirectorIdentity\.requireDirector\(\)/);
  assert.match(service,/!shot\.currentVoiceApproved\(\)/);
  assert.match(service,/!shot\.hearSeeTimingVerified\(\)/);
  assert.match(service,/!review\.inputFingerprint\(\)\.equals\(current\.inputFingerprint\(\)\)/);
  assert.match(service,/fingerprint\.equals\(rs\.getString\("original_fingerprint"\)\)/);
  assert.match(service,/Ep002Shot02TermResolver\.resolve/);
  assert.match(service,/List\.of\(\),List\.of\(\),false/);
  assert.doesNotMatch(controller,/ElevenLabsClient|generateSpeech|renderMp4/);
});

test('seven term cues are resolved from character timestamps and enforce ordered repeats',()=>{
  const required=['LOGIN_REQUEST','API_GATEWAY','LOAD_BALANCER',
    'AUTH_SERVERS','ARRIVAL_RATE','AUTH_SERVERS_REPRISE','USER_DATABASE'];
  for(const term of required)assert.ok(resolver.includes('"' + term + '"'));
  assert.match(resolver,/normalized_alignment/);
  assert.match(resolver,/character_start_times_seconds/);
  assert.match(resolver,/character_end_times_seconds/);
  assert.match(resolver,/cursor = found \+ phrase\.length\(\)/);
  assert.match(resolver,/SHOT02_TERMS_DISAGREE_WITH_DIRECTOR_BEATS/);
  assert.match(resolver,/SHOT02_TERM_NOT_SPOKEN_IN_EXPECTED_ORDER/);
  assert.doesNotMatch(resolver,/request.*ElevenLabs|send.*voice|Math\.random\(/i);
});

test('SHOT02 render is Director-only, disabled by default and source-SHA-pinned',()=>{
  assert.match(preview,/DirectorIdentity\.requireDirector\(\)/);
  assert.match(preview,/mediaos\.ep002\.shot02-preview-enabled:false/);
  assert.match(preview,/mediaos\.ep002\.shot02-worker-source-sha:/);
  assert.match(preview,/MEDIA_OS_CREATION_PREFLIGHT/);
  assert.match(preview,/!snapshot\.inputFingerprint\(\)\.equals\(request\.expectedEpisodeFingerprint\(\)\)/);
  assert.match(preview,/!verified\.ready\(\)/);
  assert.match(preview,/verified\.verifiedCues\(\)\.size\(\)!=5/);
  assert.match(preview,/verified\.termCues\(\)\.size\(\)!=7/);
  assert.match(preview,/props\.put\("expectedSourceCommit",pinnedWorkerSha\)/);
  assert.match(preview,/renders\.ensureVerifiedEp002Shot02Preview\(props\)/);
  assert.match(renderApi,/id="EP002-SHOT02-CANDIDATE"|EP002-SHOT02-CANDIDATE/);
  assert.match(renderApi,/\|\| "EP002-SHOT02-CANDIDATE"\.equals\(compositionId\)/);
  assert.match(renderApi,/new RenderRequest\("REVIEW",verifiedProps\)/);
});

test('Worker refuses unpinned SHOT02 jobs and only muxes reviewed selected audio',()=>{
  assert.match(workerApi,/composition_id<>'EP002-SHOT02-CANDIDATE'/);
  assert.match(workerApi,/input_props->>'expectedSourceCommit'=:sourceSha/);
  assert.match(workerApi,/review\.selected_take_id=t\.id/);
  assert.match(workerApi,/review\.episode_fingerprint=r\.input_props->>'inputFingerprint'/);
  assert.match(worker,/SHOT02_WORKER_SOURCE_COMMIT_MISMATCH/);
  assert.match(worker,/muxEp002SelectedVoice\(job, outputPath, inputProps\)/);
  assert.match(worker,/EP002-SHOT02-CANDIDATE/);
  assert.match(workerDocker,/shot02-premium-layout\.test\.mjs/);
  assert.match(workerDocker,/shot02-readiness\.test\.mjs/);
  assert.doesNotMatch(worker,/CLAIMS_ENABLED\s*=\s*true/);
});

test('Director UI only offers explicit consent and safe release gates',()=>{
  assert.match(preflight,/EP002\/shots\/SHOT02\/render-preview/);
  assert.match(preflight,/lineage\.shot_key='SHOT02'/);
  assert.match(preflight,/r\.input_props->>'expectedSourceCommit'=lineage\.remotion_commit_sha/);
  assert.match(ui,/window\.confirm\(/);
  assert.match(ui,/cloud rendering costs/);
  assert.match(ui,/disabled=\{busy\|\|!ready\|\|active\}/);
  assert.match(ui,/window\.crypto\.randomUUID\(\)/);
  assert.match(ui,/voice-cue-review\/SHOT02\/render-readiness/);
});
