import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=p=>readFileSync(path.join(root,p),'utf8');
const v5=source('remotion-engine/src/episodes/ep002/Shot02DirectorVisualV5.tsx');
const rootTsx=source('remotion-engine/src/Root.tsx');
const layoutSource=source('remotion-engine/src/episodes/ep002/Shot02PremiumLayout.ts');
const pressureSource=source('remotion-engine/src/episodes/ep002/Shot02PressureVisuals.ts');
const controller=source('backend/src/main/java/com/architecturalthinking/mediaos/workflow/Ep002Shot02PreviewController.java');
const guard=source('backend/src/main/java/com/architecturalthinking/mediaos/workflow/Ep002Shot02EditorialPausePlan.java');
const worker=source('remotion-engine/cpu-worker.mjs');
const tsModule=async s=>await import('data:text/javascript;charset=utf-8,'+
  encodeURIComponent(stripTypeScriptTypes(s,{mode:'strip'})));
const layout=await tsModule(layoutSource);
const pressure=await tsModule(pressureSource);

test('V5 is the actual 1080p Remotion composition; old double cards are absent',()=>{
  assert.match(rootTsx,/import \{Shot02DirectorVisualV5\}/);
  assert.match(rootTsx,/component=\{Shot02DirectorVisualV5\}/);
  assert.match(v5,/const GatewayCard:/);
  assert.match(v5,/const BalancerCard:/);
  assert.match(v5,/<GatewayCard activity=\{gateway\}/);
  assert.match(v5,/<BalancerCard activity=\{balancer\}/);
  assert.doesNotMatch(v5,/ATBackendNode|FocusedNodeInterior|sections=\{/);
  assert.match(v5,/REQUEST ENTRY/);
  assert.match(v5,/Accepting login traffic/);
  assert.match(v5,/3 Auth replicas/);
  assert.match(v5,/Traffic distribution/);
});

test('V5 hero, phone and database are completely inside frame',()=>{
  assert.match(v5,/TICKETS ON SALE/);
  assert.match(v5,/fontSize:68/);
  assert.match(v5,/position:'absolute',\.\.\.SHOT02_TEXT_LANES.time/);
  assert.match(v5,/translate3d\(-680px,-150px,0\) scale\(1.11\)/);
  assert.match(v5,/SHOT02_PHONE_PIPE/);
  assert.deepEqual(layout.SHOT02_PHONE_VISUAL_SAFE_BOUNDS,
    {left:55,top:160,width:445,height:800});
  assert.doesNotThrow(()=>layout.assertShot02TextLanes({x:0,y:0,scale:1}));
  for(const n of Object.values(layout.SHOT02_NODES)){
    assert.ok(n.x-n.width/2>=500);
    assert.ok(n.x+n.width/2<1870);
    assert.ok(n.y+n.height<900);
  }
  assert.match(v5,/User Database/);
  assert.match(v5,/PRESSURE RISING/);
  assert.match(v5,/opacity:\.50\+\.50\*reveal/);
});

test('Each Load Balancer arrow reaches the left edge of its own Auth replica',()=>{
  assert.deepEqual(pressure.SHOT02_AUTH_REPLICA_PORTS.map(x=>x.id),
    ['AUTH 01','AUTH 02','AUTH 03']);
  assert.equal(new Set(pressure.SHOT02_AUTH_REPLICA_PORTS.map(x=>x.y)).size,3);
  const r=layout.SHOT02_NODES.auth;
  for(const card of pressure.SHOT02_AUTH_REPLICA_PORTS){
    const left=pressure.SHOT02_AUTH_CARD_LEFT;
    const right=pressure.SHOT02_AUTH_CARD_RIGHT;
    const entry={x:left+6,y:card.y};
    const arrived=pressure.shot02CubicPoint(1,pressure.SHOT02_BALANCER_EXIT,
      {x:1090,y:535},{x:1137,y:card.y},entry);
    assert.deepEqual(arrived,entry);
    assert.ok(left>=r.x-r.width/2&&right<=r.x+r.width/2);
    assert.ok(card.y>r.y+50&&card.y<r.y+r.height-35);
    const db={x:pressure.SHOT02_DATABASE_ENTRY.x+5,y:pressure.SHOT02_DATABASE_ENTRY.y};
    assert.deepEqual(pressure.shot02CubicPoint(1,{x:right,y:card.y},
      {x:1505,y:card.y},{x:1540,y:db.y},db),db);
  }
  assert.match(v5,/markerEnd="url\(#s02v5-arrow-cyan\)"/);
  assert.match(v5,/markerEnd="url\(#s02v5-arrow-amber\)"/);
});

test('All request particles and node text get deliberate contrast',()=>{
  assert.match(v5,/r=\{7\+2\*arrival\}/);
  assert.match(v5,/fontSize:27,fontWeight:820/);
  assert.match(v5,/border:'2\.5px solid #64DFFF'/);
  assert.match(v5,/border:'2\.5px solid #63DEFF'/);
  assert.match(v5,/border:'2\.5px solid #9184FF'/);
  assert.doesNotMatch(v5,/Math\.random\(|OUTDATED|DATABASE OFFLINE|CONNECTION LOST/);
});

test('Exact +60 frame tail is only after voice; old Take/cues remain pristine',()=>{
  assert.match(controller,/int endHoldFrames=naturalSlow\?60:0/);
  assert.match(controller,/props\.put\("postVoiceHoldFrames",60\)/);
  assert.match(controller,/props\.put\("sourceDurationInFrames",verified\.durationInFrames\(\)\)/);
  assert.match(guard,/hold\.intValue\(\)!=60/);
  assert.match(worker,/SHOT02_POST_VOICE_VISUAL_HOLD frames=60/);
  assert.match(worker,/apad=whole_dur=/);
  assert.match(v5,/const spokenFrames=total-hold/);
  assert.match(v5,/requireShot02VerifiedCues\(spokenFrames/);
  assert.match(v5,/requireShot02SpokenTerms\(spokenFrames/);
  assert.match(v5,/ONE DATABASE\. THREE AUTH REPLICAS\. RISING PRESSURE/);
  assert.match(v5,/shot02UserRequestPressure/);
  assert.match(v5,/shot02SharedDbPressure/);
  assert.doesNotMatch(v5,/generateSpeech|fetch\(|<Audio|setTimeout/);
  assert.equal(pressure.shot02SharedDbPressure(0,0,1),0);
});

test('Worker source SHA remains pinned and Director must explicitly queue a new preview',()=>{
  assert.match(controller,/DirectorIdentity\.requireDirector\(\)/);
  assert.match(controller,/MEDIA_OS_CREATION_PREFLIGHT/);
  assert.match(controller,/props\.put\("expectedSourceCommit",pinnedWorkerSha\)/);
  assert.match(worker,/SHOT02_WORKER_SOURCE_COMMIT_MISMATCH/);
});
