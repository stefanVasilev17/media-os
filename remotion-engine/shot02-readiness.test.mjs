import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

const root=path.dirname(fileURLToPath(import.meta.url));
const base=path.join(root,'src/episodes/ep002');
const shot02=readFileSync(path.join(base,'Shot02GeneratedScene.tsx'),'utf8');
const layout=readFileSync(path.join(base,'Shot02PremiumLayout.ts'),'utf8');
const shot01=readFileSync(path.join(base,'Shot01LoginWaiting.tsx'),'utf8');
const phone=readFileSync(path.join(base,'Shot01ReadablePhone.tsx'),'utf8');

test('SHOT02 never invents final voice frames or editorial fallback timing',()=>{
  assert.match(shot02,/requireShot02VerifiedCues/);
  assert.match(shot02,/timingMode !== 'ELEVENLABS_CHARACTER_TIMESTAMPS'/);
  assert.match(shot02,/verifiedCues\.length !== 5/);
  assert.match(shot02,/cue\.startFrame !== verifiedCues\[i - 1\]\.endFrame/);
  assert.match(shot02,/verifiedCues\[4\]\.endFrame !== durationInFrames/);
  assert.match(shot02,/verified\.map\(cue => cue\.startFrame\)/);
  assert.match(shot02,/SHOT02_REQUIRES_30FPS_EXACT_VOICE_DURATION/);
  assert.doesNotMatch(shot02,/PROVISIONAL_STORYBOARD|duration \* \[|duration \* \.0[1-9]|1205\s*;/);
});

test('Seven technical terms use true phrase-level frames instead of arbitrary stagger delays',()=>{
  for(const id of [
    'LOGIN_REQUEST','API_GATEWAY','LOAD_BALANCER','AUTH_SERVERS',
    'ARRIVAL_RATE','AUTH_SERVERS_REPRISE','USER_DATABASE'
  ])assert.match(shot02,new RegExp("id:'"+id+"'"));
  assert.match(shot02,/terms\.length!==SPOKEN_TERMS\.length/);
  assert.match(shot02,/normalizeTerm\(term\.spokenAnchor\)!==normalizeTerm\(expected\.anchor\)/);
  assert.match(shot02,/terms\[1\]\.startFrame!==beats\[2\]\.startFrame/);
  assert.match(shot02,/terms\[4\]\.startFrame!==beats\[3\]\.startFrame/);
  assert.match(shot02,/terms\[6\]\.startFrame<beats\[4\]\.startFrame/);
  assert.match(shot02,/requireShot02SpokenTerms\(duration, verified, props\.termCues\)/);
  assert.match(shot02,/activeSpokenTerm\(frame,terms\)/);
});

test('SHOT02 retains SHOT01 spatial geography and exact approved family of objects',()=>{
  for(const s of ['gateway:{x:934,y:420','balancer:{x:1161,y:420','auth:{x:1510,y:298'])
    assert.ok(layout.includes(s),'missing node coordinate '+s);
  assert.match(shot01,/title="API Gateway" x=\{934\} y=\{420\}/);
  assert.match(shot01,/title="Load Balancer" x=\{1161\} y=\{420\}/);
  assert.match(shot01,/title="Auth Service" x=\{1510\} y=\{298\}/);
  assert.match(shot02,/import \{Shot01ReadablePhone\}/);
  assert.match(shot02,/<Shot01ReadablePhone/);
  assert.match(phone,/Logging in \.\.\./);
  for(const component of [
    'ATBackground','ATBackendNode','ATCameraRig','ATControlledRealismLayer','AT_FONT'
  ])assert.ok(shot02.includes(component));
});

test('Semantic term HUD and animated node halo guide the viewer to the spoken subject',()=>{
  assert.match(shot02,/const SemanticTermHud/);
  assert.match(shot02,/const SemanticNodeHalo/);
  assert.match(shot02,/const ReplicaRail/);
  assert.match(shot02,/<SemanticNodeHalo cue=\{active\} frame=\{frame\}/);
  assert.match(shot02,/<SemanticTermHud frame=\{frame\} cue=\{active\}/);
  assert.match(shot02,/NOW IN FOCUS/);
  assert.match(shot02,/term\.headline/);
  assert.match(shot02,/term\.detail/);
});

test('All large editorial text sits outside moving camera in fixed safe zones',()=>{
  assert.match(shot02,/SHOT02_TEXT_LANES\.time/);
  assert.match(shot02,/SHOT02_TEXT_LANES\.term/);
  assert.match(shot02,/SHOT02_TEXT_LANES\.metric/);
  assert.match(shot02,/assertShot02TextLanes\(\{x:cameraX,y:cameraY,scale:cameraScale\}\)/);
  const afterCamera=shot02.slice(shot02.indexOf('</ATCameraRig>'));
  assert.match(afterCamera,/<ContextLabel reveal=\{context\}/);
  assert.match(afterCamera,/<ArrivalCounter reveal=\{arrival\}/);
  assert.match(afterCamera,/<SemanticTermHud frame=\{frame\} cue=\{active\}/);
  assert.doesNotMatch(shot02,/SHARED DEPENDENCY · PRESSURE BEGINS/);
});

test('Three Auth replicas converge toward one intact User Database',()=>{
  for(const name of ['Auth01','Auth02','Auth03','AUTH 01','AUTH 02','AUTH 03','User Database'])
    assert.ok(shot02.includes(name),'missing architecture '+name);
  assert.match(shot02,/THREE AUTH REPLICAS/);
  assert.match(shot02,/SHARED ACCOUNT LOOKUP/);
  assert.match(shot02,/const dbPath =/);
  assert.match(shot02,/cx=\{dbX\} cy=\{dbY\}/);
  assert.doesNotMatch(shot02,/DATABASE OFFLINE|Please try again|CONNECTION LOST/);
});

test('All five approved visual beats stay causally synced and avoid made-up telemetry',()=>{
  for(const item of [
    '09:00','TICKETS ON SALE','ArrivalWave','API Gateway',
    'Load Balancer','NEW LOGIN ARRIVALS / SECOND','User Database','ILLUSTRATIVE'
  ])assert.ok(shot02.includes(item),'missing semantic visual '+item);
  assert.match(shot02,/Math\.round\(\(100\+250\*countTransition\)\/10\)\*10/);
  assert.match(shot02,/NOT LIVE TELEMETRY/);
  assert.doesNotMatch(shot02,/OPENAI_API_KEY|ELEVENLABS_API_KEY|fetch\(/);
});
