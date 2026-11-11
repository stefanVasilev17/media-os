import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {
  SHOT01_UNIFIED_PASS,requireShot01RealCues,shot01UnifiedState,
} from './shot01-unified-visual-contract.mjs';

const dir=path.dirname(fileURLToPath(import.meta.url));
const repo=path.join(dir,'..');
const src=p=>readFileSync(path.join(repo,p),'utf8');
const shot=src('remotion-engine/src/episodes/ep002/Shot01UnifiedVisualV2.tsx');
const old=src('remotion-engine/src/episodes/ep002/Shot01LoginWaiting.tsx');
const v5=src('remotion-engine/src/episodes/ep002/Shot02DirectorVisualV5.tsx');
const root=src('remotion-engine/src/Root.tsx');
const backend=src('backend/src/main/java/com/architecturalthinking/mediaos/workflow/Ep002Shot01PreviewController.java');
const renderer=src('backend/src/main/java/com/architecturalthinking/mediaos/remotion/RemotionRenderController.java');
const workerService=src('backend/src/main/java/com/architecturalthinking/mediaos/remotion/RemotionCpuWorkerController.java');
const worker=src('remotion-engine/cpu-worker.mjs');
const approved=[8,146,386,620,937];
const duration=980;

test('SHOT01 V2 accepts only exact real five approved ElevenLabs cue frames and is fail closed',()=>{
  assert.equal(SHOT01_UNIFIED_PASS,'SHOT01_SHOT02_UNIFIED_V2');
  assert.deepEqual(requireShot01RealCues(duration,approved,'ELEVENLABS_CHARACTER_TIMESTAMPS'),approved);
  for(const input of [undefined,[],[8,146,386,620],[8,146,146,620,937],[8,146,386,620,980],[8,146,386,620,969]]){
    assert.throws(()=>requireShot01RealCues(duration,input,'ELEVENLABS_CHARACTER_TIMESTAMPS'),
      /SHOT01_UNIFIED/);
  }
  assert.throws(()=>requireShot01RealCues(duration,approved,'PROVISIONAL_STORYBOARD'),
    /SHOT01_UNIFIED_REQUIRES_FIVE_REAL_VOICE_CUES/);
  assert.doesNotMatch(shot,/\.map\(\(value\) =>\s*Math.min\(duration - 1/);
  assert.match(shot,/requireShot01RealCues\(durationInFrames,beatStartFrames,timingMode\)/);
});

test('SHOT01 V2 replicates SHOT02 exact reusable production assets, not duplicate invented systems',()=>{
  for(const tag of ['GatewayCard','BalancerCard','AuthCluster','DatabaseCard','PathSystem']){
    assert.match(v5,new RegExp('(?:const|export const) '+tag+'[:=]'));
    assert.match(v5,new RegExp('export \\{GatewayCard,BalancerCard,AuthCluster,DatabaseCard,PathSystem\\}'));
    assert.match(shot,new RegExp('<'+tag+'\\b'));
  }
  assert.match(shot,/import \{Shot02PressurePhone\}/);
  assert.match(shot,/SHOT02_AUTH_REPLICA_PORTS\[0\]/);
  assert.match(shot,/SHOT02_DATABASE_ENTRY/);
  assert.match(shot,/Shot02PressurePhone frame=\{v\.canonicalFrame\}/);
  assert.match(shot,/translate3d\(-680px,-150px,0\) scale\(1\.11\)/);
  assert.match(shot,/ATControlledRealismLayer frame=\{v\.canonicalFrame\}/);
  assert.doesNotMatch(shot,/ATBackendNode|Shot01ReadablePhone|6 Auth replicas|AUTH 04|replicaGrowth|DATABASE QUEUE/);
  assert.match(shot,/SingleLoginRequest progress=\{v\.packetProgress\}/);
  assert.match(shot,/const first=SHOT02_AUTH_REPLICA_PORTS\[0\]/);
  assert.match(shot,/HealthProbeFacts opacity=\{v\.health\}/);
  assert.match(shot,/Liveness: PASS/);
  assert.match(shot,/Readiness: PASS/);
  assert.match(shot,/TIME PASSES · NO RESPONSE/);
  assert.ok(old.includes('ATBackendNode'),'Archive original shot design untouched');
});

test('SHOT01 V2 returns to the exact opening Shot02 layout on its final frame',()=>{
  const start=shot01UnifiedState(0,duration,approved);
  const final=shot01UnifiedState(duration-1,duration,approved);
  assert.equal(start.cameraScale,1);
  assert.equal(final.closing,1);
  assert.equal(final.cameraScale,1);
  assert.equal(final.cameraX,0);
  assert.equal(final.cameraY,0);
  assert.equal(final.canonicalFrame,0);
  assert.equal(final.press,0);
  assert.equal(final.waiting,0);
  assert.equal(final.health,0);
  assert.equal(final.focus,0);
  assert.equal(final.rail,0);
  assert.equal(final.packetVisible,false);
  assert.match(shot,/GatewayCard activity=\{0\}/);
  assert.match(shot,/BalancerCard activity=\{0\}/);
  assert.match(shot,/DatabaseCard pressure=\{0\} reveal=\{0\}/);
  assert.match(shot,/PathSystem clock=\{0\} load=\{0\} arrival=\{0\} lookup=\{0\} stress=\{0\}/);
  assert.match(shot,/pressStartFrame=\{Number\.POSITIVE_INFINITY\}/);
  assert.match(shot,/ATControlledRealismLayer frame=\{v\.canonicalFrame\}[\s\S]*?realism=\{\.96\} architectureReveal=\{\.3\}/);
  assert.match(v5,/ATControlledRealismLayer frame=\{frame\} realism=\{\.96\}/);
  assert.match(v5,/architectureReveal=\{\.3\+\.4\*context\+\.25\*database\}/);
  assert.match(v5,/const context=ease\(frame,start\[0\],start\[0\]\+35\)/);
  assert.match(v5,/const firstTapFrame=start\[0\]\+15/);
  assert.match(v5,/PathSystem clock=\{flowClock\}/);
  assert.match(shot,/width:440,height:82/);
});

test('SHOT01 V2 keeps key voiced facts readable for multiple seconds',()=>{
  const before=shot01UnifiedState(approved[1]-1,duration,approved);
  const during=shot01UnifiedState(approved[2]+60,duration,approved);
  const still=shot01UnifiedState(approved[3]+15,duration,approved);
  assert.equal(before.rail,0);
  assert.equal(during.health,1);
  assert.equal(during.rail,1);
  assert.equal(still.health,1);
  assert.equal(still.waiting,1);
  assert.equal(shot01UnifiedState(approved[0]+10,duration,approved).press>0,true);
  assert.match(shot,/fontSize:24,fontWeight:825/);
  assert.match(shot,/fontSize:24,fontWeight:790/);
  assert.doesNotMatch(shot,/ILLUSTRATIVE|SHALLOW HEALTH DOES NOT GUARANTEE LOGIN COMPLETION/);
  assert.doesNotMatch(shot,/fontSize:(?:9|10|11|12|13|14)\b/);
});

test('SHOT01 V2 is real-source-pinned manual 1080p REVIEW only; original locked MP4 not edited',()=>{
  assert.match(root,/id="EP002-SHOT01-DRAFT"[\s\S]*?component=\{Shot01UnifiedVisualV2\}/);
  assert.match(root,/id="EP002-SHOT01-DRAFT"[\s\S]*?width=\{1920\}[\s\S]*?height=\{1080\}/);
  assert.match(renderer,/ensureVerifiedEp002Preview[\s\S]*?new RenderRequest\("REVIEW",verifiedProps\)/);
  assert.match(backend,/MEDIAOS_SHOT01_UNIFIED_RELEASE_SHA/);
  assert.match(backend,/SHOT01_SHOT02_UNIFIED_V2/);
  assert.match(backend,/if\(!voiceAligned\)/);
  assert.match(backend,/props\.put\("provisionalCueTiming",false\)/);
  assert.match(backend,/props\.put\("expectedSourceCommit",sourceSha\)/);
  assert.match(backend,/r\.profile='REVIEW' and r\.width=1920 and r\.height=1080/);
  assert.match(worker,/SHOT01_UNIFIED_REAL_TAKE_FIVE_CUES_1080P_SOURCE_MISMATCH/);
  assert.match(worker,/inputProps\.expectedSourceCommit!==FACTORY_SOURCE_SHA/);
  assert.match(workerService,/r\.input_props->>'visualStylePass'='SHOT01_SHOT02_UNIFIED_V2'/);
  assert.match(workerService,/r\.profile='REVIEW'/);
  assert.match(workerService,/!"EP002-SHOT01-DRAFT"\.equals\(scope\)/);
  assert.doesNotMatch(shot,/visualSourceGitBlobSha\s*=/);
});