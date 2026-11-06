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

test('SHOT02 candidate is registered but requires genuine render input',()=>{
  assert.match(root,/id="EP002-SHOT02-CANDIDATE"/);
  assert.match(root,/component=\{Shot02GeneratedScene\}/);
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
