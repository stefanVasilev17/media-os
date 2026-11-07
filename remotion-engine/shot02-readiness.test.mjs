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
const pressurePhone=readFileSync(path.join(base,'Shot02PressurePhone.tsx'),'utf8');
const pressure=readFileSync(path.join(base,'Shot02PressureVisuals.ts'),'utf8');

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
  assert.match(shot02,/terms\[1\]\.startFrame<beats\[2\]\.startFrame/);
  assert.match(shot02,/terms\[4\]\.startFrame<beats\[3\]\.startFrame/);
  assert.match(shot02,/terms\[6\]\.startFrame<beats\[4\]\.startFrame/);
  assert.match(shot02,/requireShot02SpokenTerms\(duration, verified, props\.termCues\)/);
  assert.match(shot02,/activeSpokenTerm\(frame,terms\)/);
});

test('SHOT02 retains SHOT01 spatial geography and exact approved family of objects',()=>{
  for(const s of ['gateway:{x:650,y:410','balancer:{x:927,y:410','auth:{x:1326,y:315'])
    assert.ok(layout.includes(s),'missing node coordinate '+s);
  assert.match(shot01,/title="API Gateway" x=\{934\} y=\{420\}/);
  assert.match(shot01,/title="Load Balancer" x=\{1161\} y=\{420\}/);
  assert.match(shot01,/title="Auth Service" x=\{1510\} y=\{298\}/);
  assert.match(shot02,/import \{Shot02PressurePhone\}/);
  assert.match(shot02,/<Shot02PressurePhone/);
  assert.match(pressurePhone,/Shot02PressurePhoneProps/);
  assert.match(phone,/Logging in \.\.\./);
  for(const component of [
    'ATBackground','ATBackendNode','ATCameraRig','ATControlledRealismLayer','AT_FONT'
  ])assert.ok(shot02.includes(component));
});

test('Narrated terms get legible enlarged architecture focus without decorative HUD',()=>{
  assert.match(shot02,/const FocusedNodeInterior/);
  assert.match(shot02,/const SpokenRequestMarker/);
  assert.match(shot02,/const SemanticNodeHalo/);
  assert.match(shot02,/const AuthReplicaCluster/);
  assert.match(shot02,/const PressureDatabaseNode/);
  assert.match(shot02,/<SemanticNodeHalo cue=\{active\} frame=\{frame\}/);
  assert.match(shot02,/<FocusedNodeInterior node="gateway"/);
  assert.match(shot02,/<FocusedNodeInterior node="balancer"/);
  assert.match(shot02,/<AuthReplicaCluster activity=\{authActivity\}/);
  assert.match(shot02,/<PressureDatabaseNode reveal=\{dbReveal\}/);
  assert.doesNotMatch(shot02,/const ReplicaRail/);
  assert.match(shot02,/shot02TermHold\(frame,terms\[1\]/);
  assert.match(shot02,/shot02FocusCamera\(baseCamera,focusWeights\)/);
  assert.doesNotMatch(shot02,/SemanticTermHud|NOW IN FOCUS|term\.headline|term\.detail/);
});

test('Three fixed text lanes stay outside the animated camera and upper-right clutter is gone',()=>{
  assert.match(shot02,/SHOT02_TEXT_LANES\.time/);
  assert.match(shot02,/SHOT02_TEXT_LANES\.metric/);
  assert.doesNotMatch(layout,/term:\{left:/);
  assert.doesNotMatch(shot02,/SHOT02_TEXT_LANES\.term/);
  assert.match(shot02,/assertShot02TextLanes\(\{x:cameraX,y:cameraY,scale:cameraScale\}\)/);
  const afterCamera=shot02.slice(shot02.indexOf('</ATCameraRig>'));
  assert.match(afterCamera,/<ContextLabel reveal=\{context\}/);
  assert.match(afterCamera,/<ArrivalCounter reveal=\{arrival\}/);
  assert.doesNotMatch(shot02,/SHARED DEPENDENCY · PRESSURE BEGINS/);
});

test('Three independent Auth replica objects share one database and own lookup paths',()=>{
  for(const word of ['Auth Service','User Database','SHARED ACCOUNT LOOKUP'])
    assert.ok(shot02.includes(word),'missing architecture '+word);
  assert.match(shot02,/<AuthReplicaCluster activity=\{authActivity\}/);
  assert.doesNotMatch(shot02,/THREE INDEPENDENT REPLICAS/);
  assert.match(pressure,/AUTH 01/);
  assert.match(pressure,/AUTH 02/);
  assert.match(pressure,/AUTH 03/);
  assert.match(shot02,/SHOT02_AUTH_REPLICA_PORTS\.map\(\(replica,i\)=>/);
  assert.match(shot02,/const branch=/);
  assert.match(shot02,/const lookup=/);
  assert.match(shot02,/shot02CubicPoint\(p,c,db1,db2,db\)/);
  assert.match(shot02,/shot02SharedDbPressure\(lookup,database,flowBoost\)/);
  assert.doesNotMatch(shot02,/DATABASE OFFLINE|Please try again|CONNECTION LOST/);
});

test('Director V2 makes the request journey visible without invented voice timings',()=>{
  for(const item of [
    '09:00','TICKETS ON SALE','ArrivalWave','API Gateway',
    'Load Balancer','ARRIVAL RATE · LOGIN REQUESTS / SECOND',
    'User Database','LOGIN REQUEST','FocusedNodeInterior','SpokenRequestMarker'
  ])assert.ok(shot02.includes(item),'missing semantic visual '+item);
  assert.match(shot02,/press=\{repeatedTap\}/);
  assert.match(shot02,/shot02TapPulse\(frame,starts\[0\]\+15/);
  assert.match(shot02,/shot02TapPulse\(frame,starts\[2\]/);
  assert.match(shot02,/shot02FlowClock\(frame,terms\[4\]\.startFrame\)/);
  assert.match(shot02,/Math\.round\(\(100\+250\*flowBoost\)\/10\)\*10/);
  assert.match(shot02,/clock=\{flowClock\}/);
  assert.match(shot02,/const dots=Array\.from\(\{length:8\}/);
  assert.doesNotMatch(shot02,/ILLUSTRATIVE|NOT LIVE TELEMETRY|NOW IN FOCUS/);
  assert.doesNotMatch(shot02,/OPENAI_API_KEY|ELEVENLABS_API_KEY|fetch\(/);
});
