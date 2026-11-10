import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=file=>readFileSync(new URL('./src/episodes/ep002/'+file,import.meta.url),'utf8');
const world=read('Shot07CleanArchitectureWorld.tsx');
const flow=read('Shot07RequestFlows.tsx');
const s07=read('Shot07DirectorVisualV1.tsx');
const s08=read('Shot08DirectorVisualV1.tsx');

test('SHOT07 and SHOT08 actually reuse the same animated world, not static placeholder lines',()=>{
  assert.match(s07,/<Shot07CleanArchitectureWorld/);
  assert.match(s08,/<Shot07CleanArchitectureWorld/);
  assert.match(world,/<Shot07RequestFlows frame=\{frame\}/);
  assert.doesNotMatch(world,/M485 535 H521 M779 535 H804/);
});

test('request animation matches the original SHOT02→04 three Auth ports and one DB',()=>{
  for(const token of [
    'SHOT02_PHONE_PIPE','SHOT02_GATEWAY_ENTRY','SHOT02_GATEWAY_EXIT',
    'SHOT02_BALANCER_ENTRY','SHOT02_BALANCER_EXIT',
    'SHOT02_AUTH_REPLICA_PORTS','SHOT02_AUTH_CARD_LEFT','SHOT02_AUTH_CARD_RIGHT',
    'SHOT02_DATABASE_ENTRY','shot02CubicPoint','shot04ReplicaPhase',
  ])assert.ok(flow.includes(token),token);
  assert.match(flow,/SHOT02_AUTH_REPLICA_PORTS\.map/);
  assert.match(world,/SHOT02_AUTH_REPLICA_PORTS\[row\]\.y/);
  assert.doesNotMatch(flow,/DATABASE_EXIT|DB_EGRESS|AUTH 04|AUTH 05|AUTH 06/);
});

test('normal inbound requests stay moving while duplicate DB lookup retries fade on budget exhaustion',()=>{
  assert.match(flow,/retryLevel=1,jitterLevel=0/);
  assert.match(flow,/opacity=\{edge\(t\)\*retry\*\.9\}/);
  assert.match(flow,/fill=\{MINT\} opacity=\{edge\(t\)\*\.88\}/);
  assert.match(s08,/boundedRetries=1-\.84\*shot08Ease\(frame,cue\.BUDGET_EXHAUSTED,120\)/);
  assert.match(s08,/staggered=shot08Ease\(frame,cue\.JITTER,75\)/);
  assert.match(s08,/flowRetryLevel=\{boundedRetries\}/);
  assert.match(s08,/flowJitterLevel=\{staggered\}/);
});

test('SHOT08 uses five audio-anchored readable chapter captions not sixteen flashing strings',()=>{
  assert.equal((s08.match(/\{at:cue\./g)||[]).length,5);
  for(const t of ['THE RETRY STORM','CHECK THE LOGIN DEADLINE',
    'ONE SHARED RETRY BUDGET','BACKOFF + JITTER',
    'FEWER DUPLICATE DATABASE LOOKUPS'])assert.ok(s08.includes(t),t);
  assert.match(s08,/shot08Ease\(frame,event\.at,27\)/);
  assert.doesNotMatch(s08,/DUPLICATE LOOKUPS ADD WORK|NEW LOGIN ARRIVALS STILL NEED CONTROL/);
});

test('SHOT08 starts from exact locked SHOT07 last world frame, not a reset particle clock',()=>{
  assert.match(s08,/const worldFrame=handoff.lastFrame\+frame/);
  assert.match(s08,/frame=\{worldFrame\}/);
  assert.match(s08,/cascadeStartFrame=\{handoff.cascadeStartFrame\}/);
  assert.match(s08,/criticalPulseStartFrame=\{handoff.criticalPulseStartFrame\}/);
  assert.match(s08,/showLoginBadge=\{showBadge\}/);
  assert.match(s08,/recoveryLevel=\{stressReduction\}/);
  assert.match(world,/recoveryLevel=0/);
  assert.match(world,/\*\(1-\.72\*recovery\)/);
  assert.match(s08,/Math.max\(36,cue.CONTROL_FIRST-24\)/);
  assert.match(s07,/marginTop:15,width:690,height:2/);
  assert.match(s08,/marginTop:15,width:690,height:2/);
});
