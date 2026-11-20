import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {
  EP004_SHOT01_LOCKED_SOURCE_SHA256,
  EP004_MAIL_ROUTE,EP004_HANDOFF_ROUTE,EP004_STANDBY_ROUTE,EP004_SPILLOVER_ROUTE,
  EP004_DEGRADED_ROUTE,
  ep004Shot01Exit,ep004RoutePosition,ep004BezierPosition
} from './src/components/architectural-thinking/EP004Shot01World.mjs';
import {
  EP004_SHOT01_V8_LOCKED_RENDER_ID,EP004_SHOT01_V8_SOURCE_COMMIT,
  EP004_SHOT01_V8_TOTAL_FRAMES,EP004_SHOT01_V8_LAST_FRAME,
  EP004_SHOT02_SILENT_PRELUDE_FRAMES,ep004Shot02Validate,ep004Shot02World
} from './src/components/architectural-thinking/EP004Shot02ContinuityWorld.mjs';

const props={
  previousRenderId:EP004_SHOT01_V8_LOCKED_RENDER_ID,
  previousSourceCommit:EP004_SHOT01_V8_SOURCE_COMMIT,
  previousSourceSha256:EP004_SHOT01_LOCKED_SOURCE_SHA256,
  worldStartFrame:EP004_SHOT01_V8_LAST_FRAME,
  durationInFrames:270,
  previewOnly:true
};
const end=()=>ep004Shot01Exit({
  sourceSha256:EP004_SHOT01_LOCKED_SOURCE_SHA256,
  worldStartFrame:0,
  durationInFrames:EP004_SHOT01_V8_TOTAL_FRAMES,
  previewOnly:true
});
test('continuity PREVIEW pins Director-locked V8 identity and rejects all production attempts',()=>{
  assert.equal(EP004_SHOT01_V8_TOTAL_FRAMES,2001);
  assert.equal(EP004_SHOT01_V8_LAST_FRAME,2000);
  assert.equal(EP004_SHOT02_SILENT_PRELUDE_FRAMES,60);
  assert.equal(ep004Shot02Validate(props),true);
  for(const changed of [
    {previousRenderId:'00000000-0000-4000-8000-000000000000'},
    {previousSourceCommit:'0'.repeat(40)},
    {previousSourceSha256:'0'.repeat(64)},
    {worldStartFrame:2001},
    {durationInFrames:0}
  ]){
    assert.throws(()=>ep004Shot02Validate({...props,...changed}),/EXACT_LOCKED_V8/);
  }
  assert.throws(()=>ep004Shot02Validate({...props,previewOnly:false}),
    /SCRIPT_VOICE_AND_REAL_CUES_NOT_YET_VERIFIED/);
});

test('SHOT02 frame zero is exactly the modeled SHOT01 last-world snapshot, not a reset',()=>{
  const terminal=end();
  const start=ep004Shot02World(0,props);
  assert.deepEqual(start,terminal);
  assert.equal(start.worldFrame,2000);
  assert.equal(start.requestStatus,'WAITING');
  assert.ok(start.failover>.99&&start.spillover>.99);
  assert.equal(start.cameraX,terminal.cameraX);
  assert.equal(start.cameraScale,terminal.cameraScale);
  assert.deepEqual(start.traffic,terminal.traffic);
  assert.deepEqual(start.diagnostics,terminal.diagnostics);
});

test('first 60 frames stay alive with exact continuous positions and no static photo cover',()=>{
  const f0=ep004Shot02World(0,props);
  let distinct=0;
  let sample=f0;
  for(let frame=1;frame<=EP004_SHOT02_SILENT_PRELUDE_FRAMES;frame++){
    const now=ep004Shot02World(frame,props);
    assert.equal(now.worldFrame,2000+frame);
    assert.equal(now.cameraX,f0.cameraX);
    assert.equal(now.cameraScale,f0.cameraScale);
    assert.deepEqual(now.request,f0.request);
    if(JSON.stringify(now.traffic)!==JSON.stringify(sample.traffic))distinct++;
    sample=now;
  }
  assert.ok(distinct>=50,'Living Architecture must move during narrator-free opening');
});

test('continuous 270-frame storyboard routes never leave their visible geometry',()=>{
  const previous=new Map();
  const routes={MAIL:EP004_MAIL_ROUTE,HANDOFF:EP004_HANDOFF_ROUTE,
    STANDBY:EP004_STANDBY_ROUTE,SPILLOVER:EP004_SPILLOVER_ROUTE};
  let transitions=0;
  for(let frame=0;frame<props.durationInFrames;frame++){
    const state=ep004Shot02World(frame,props);
    assert.equal(state.worldFrame,2000+frame);
    assert.ok(state.cameraScale>.90&&state.cameraScale<1.10);
    for(const token of state.traffic){
      const onRoute=token.lane==='MAIL'||token.lane==='HANDOFF'?
        ep004RoutePosition(routes[token.lane],token.progress):
        ep004BezierPosition(routes[token.lane],token.progress);
      assert.ok(Math.hypot(token.x-onRoute.x,token.y-onRoute.y)<1e-7,
        'request left visible route '+token.id+' on frame '+frame);
      const old=previous.get(token.id);
      if(old&&old.frame===frame-1&&old.opacity>.20&&token.opacity>.20){
        assert.ok(Math.hypot(token.x-old.x,token.y-old.y)<3,
          'visible request teleported '+token.id+' on frame '+frame);
        transitions++;
      }
      previous.set(token.id,{...token,frame});
    }
    for(const signal of state.diagnostics){
      const onRoute=ep004BezierPosition(EP004_DEGRADED_ROUTE,signal.progress);
      assert.ok(Math.hypot(signal.x-onRoute.x,signal.y-onRoute.y)<1e-7);
      assert.equal(signal.direction,'TO_LOAD_BALANCER');
    }
  }
  assert.ok(transitions>500,'real request animation should remain visible');
  const last=ep004Shot02World(props.durationInFrames-1,props);
  assert.ok(last.cameraX<f0Camera());
  function f0Camera(){return ep004Shot02World(0,props).cameraX;}
});

test('SHOT01 TSX and factory production entrypoints stay untouched by SHOT02 preview',async()=>{
  const shot01=await readFile(new URL('./src/episodes/ep004/Shot01OrdinaryWorkday.tsx',import.meta.url),'utf8');
  const shot02=await readFile(new URL('./src/episodes/ep004/Shot02ContinuityV1.tsx',import.meta.url),'utf8');
  const root=await readFile(new URL('./src/Root.tsx',import.meta.url),'utf8');
  const factory=await readFile(new URL('./src/factory/generated-scene-registry.ts',import.meta.url),'utf8');
  assert.match(root,/EP004-SHOT02-CONTINUITY-V1-STORYBOARD/);
  assert.match(shot02,/ep004Shot02World\(frame,props\)/);
  assert.match(shot02,/CONTINUITY MOCK · NOT DIRECTOR LOCKED/);
  assert.equal(shot01.includes('ep004Shot02World'),false);
  assert.equal(factory.includes('EP004-SHOT02'),false,
    'No production scene until authentic SHOT02 script/voice/timestamps are verified');
  const body=(text)=>text.slice(text.indexOf('  const camera='),text.indexOf('    {props.previewOnly&&'));
  assert.equal(body(shot02),body(shot01),
    'SHOT02 must duplicate the identical V8 approved Living Architecture JSX baseline');
});
