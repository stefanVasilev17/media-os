import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';
import {preflightTierPlusPlusRender} from './tier-plus-plus-render-quality.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
const src=path.join(root,'src/episodes/ep002');
const read=p=>readFileSync(path.join(src,p),'utf8');
const layout=read('Shot02PremiumLayout.ts');
const contractSource=read('Shot05VisualContract.ts').replace(
  /^import\s+\{SHOT02_NODES,shot02Intersects,type Rect\}\s+from\s+'\.\/Shot02PremiumLayout';\s*/m,'');
const transpile=s=>'data:text/javascript;base64,'+
  Buffer.from(ts.transpileModule(s,{compilerOptions:{
    module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,
  }}).outputText).toString('base64');
const contract=await import(transpile(layout+'\n'+contractSource));
const scene=read('Shot05DirectorVisualV1.tsx');
const rootScene=readFileSync(path.join(root,'src/Root.tsx'),'utf8');
const start=[22,100,190,310,440,590,690,750,800,990,1085,1200,1410,1600,1740];
const terms=contract.SHOT05_TERM_ORDER.map((id,i)=>({id,
  spokenAnchor:'actually spoken '+id,startFrame:start[i],endFrame:start[i]+13}));
const starts=[0,390,800,1190,1570];
const beats=starts.map((x,i)=>({beatNumber:i+1,spokenAnchor:'real director-reviewed beat '+i,
  startFrame:x,endFrame:i===4?1900:starts[i+1]}));
const props={durationInFrames:1900,
  voiceTakeId:'78961ce3-3ae5-43fe-a897-3a69532459b9',
  timingMode:'ELEVENLABS_CHARACTER_TIMESTAMPS',verifiedCues:beats,termCues:terms};
const cues=Object.fromEntries(terms.map(x=>[x.id,x.startFrame]));

test('SHOT05 requires current Director five beats and fifteen genuine ordered term positions',()=>{
  assert.doesNotThrow(()=>contract.validateShot05Source(props));
  assert.throws(()=>contract.validateShot05Source({...props,voiceTakeId:''}),
    /SHOT05_REQUIRES_DIRECTOR_APPROVED_REAL_TIMED_VOICE/);
  assert.throws(()=>contract.validateShot05Source({...props,verifiedCues:[]}),
    /SHOT05_REQUIRES_DIRECTOR_APPROVED_REAL_TIMED_VOICE/);
  assert.throws(()=>contract.validateShot05Source({...props,termCues:[...terms].reverse()}),
    /SHOT05_FIFTEEN_REAL_TERMS_INVALID/);
  assert.throws(()=>contract.validateShot05Source({...props,
    verifiedCues:beats.map((x,i)=>i===2?{...x,startFrame:x.startFrame+2}:x)}),
    /SHOT05_FIVE_VERIFIED_HEAR_SEE_BEATS_INVALID/);
});

test('SHOT05 opens on the exact Director-locked SHOT04 world components, then clears Phone before zoom',()=>{
  assert.doesNotThrow(()=>contract.assertShot05SafeLayout());
  const locked=read('Shot04DirectorVisualV1.tsx');
  const inherited=read('Shot05Shot04WorldV2.tsx');
  const prefix=locked.slice(0,locked.indexOf('export const Shot04DirectorVisualV1:'));
  assert.ok(inherited.startsWith(prefix),
    'SHOT04 frozen premium Gateway, Auth, DB, paths and semantic overlay components must be identical');
  for(const name of ['SHOT02_AUTH_REPLICA_PORTS','SHOT02_BALANCER_EXIT',
    'SHOT02_DATABASE_ENTRY','Shot02PressurePhone','shot03CongestionColor(1)',
    'SATURATED · RUNNING','Auth Service','HealthSemantics','Paths frame=',
    'Gateway active=','Balancer','Database frame='])
    assert.ok(inherited.includes(name),'missing locked component: '+name);
  assert.match(scene,/<Shot05Shot04WorldV2 frame=\{frame\}/);
  assert.match(scene,/const phoneFade=shot05Ease\(frame,12,38\)/);
  assert.match(scene,/const push=shot05Ease\(frame,61,99\)/);
  assert.match(scene,/const mapExit=shot05Ease\(frame,167,36\)/);
  assert.ok(12+38<61,'Phone must disappear before architectural zoom');
  assert.match(inherited,/opacity:1-phoneFade/);
  assert.match(inherited,/transform:cameraTransform/);
  assert.doesNotMatch(scene,/MiniWorld|WorldBreadcrumb|INSIDE AUTH 01|AUTH 01 \/ INTERNAL VIEW/);
  assert.doesNotMatch(scene,/Math.random\(|fetch\(|setTimeout\(|<Audio/);
  assert.doesNotMatch(scene,/Please try again|DATABASE OFFLINE|CONNECTION POOL CRASHED/);
});

test('Director scene retains eight slots and voice-timed historical replay without occupancy jumps',()=>{
  assert.match(scene,/gridTemplateColumns:'repeat\(4,minmax\(0,1fr\)\)'/);
  assert.match(scene,/Array.from\(\{length:8\}/);
  assert.match(scene,/REPLAY · EARLIER MOMENTS/);
  assert.match(scene,/shot05SlotFill\(frame,index,terms\)/);
  assert.doesNotMatch(scene,/busy\?'IN USE':'AVAILABLE'/);
  assert.doesNotMatch(scene,/BORROW → LOOKUP → RETURN|DATABASE LOOKUP IS SLOW/);
  assert.match(scene,/opacity:1-occupied/);
  assert.match(scene,/opacity:occupied/);
  assert.equal(contract.shot05ReplayBusy(0,cues),0);
  assert.equal(contract.shot05ReplayBusy(cues.ONE_BUSY,cues),1);
  assert.equal(contract.shot05ReplayBusy(cues.FIVE_BUSY,cues),5);
  assert.equal(contract.shot05ReplayBusy(cues.SEVEN_BUSY,cues),7);
  assert.equal(contract.shot05ReplayBusy(cues.EIGHT_BUSY,cues),8);
  assert.ok(contract.shot05SlotFill(cues.BORROWS_ONE+25,0,cues)>.95);
  assert.equal(contract.shot05SlotFill(cues.REPLAY-1,0,cues),0);
  assert.equal(contract.shot05SlotFill(cues.ONE_BUSY,0,cues),0);
  assert.ok(contract.shot05SlotFill(cues.ONE_BUSY+20,0,cues)>.95);
  assert.equal(contract.shot05SlotFill(cues.FIVE_BUSY,2,cues),0);
  assert.ok(contract.shot05SlotFill(cues.FIVE_BUSY+30,2,cues)>.99);
  assert.equal(contract.shot05SlotFill(cues.EIGHT_BUSY,7,cues),0);
  assert.ok(contract.shot05SlotFill(cues.EIGHT_BUSY+20,7,cues)>.99);
  assert.throws(()=>contract.shot05SlotFill(100,8,cues),
    /SHOT05_POOL_INDEX_OUT_OF_BOUNDS/);
  assert.throws(()=>contract.shot05ReplayBusy(100,{...cues,REPLAY:800}),
    /SHOT05_REAL_SPOKEN_REPLAY_ORDER_INVALID/);
});

test('SHOT05 teaches spoken queueing and in-flight meanings without extra dashboard text',()=>{
  assert.match(scene,/WAITING FOR CONNECTION/);
  assert.match(scene,/REQUEST A/);
  assert.match(scene,/TIME RUNNING OUT/);
  assert.match(scene,/REQUEST QUEUEING/);
  assert.match(scene,/Requests lining up until a connection becomes available/);
  assert.match(scene,/IN-FLIGHT REQUESTS/);
  assert.match(scene,/Requests that have started but haven't finished/);
  assert.match(scene,/start:terms\.REQUEST_QUEUEING/);
  assert.match(scene,/start:terms\.IN_FLIGHT/);
  assert.equal(contract.shot05QueueDepth(cues.ANOTHER_LOGIN-1,cues),0);
  assert.equal(contract.shot05QueueDepth(cues.ANOTHER_LOGIN,cues),1);
  assert.ok(contract.shot05QueueDepth(cues.IN_FLIGHT,cues)>=2);
  assert.equal(contract.shot05WaitingForConnection(cues.WAIT_FOR_CONNECTION,cues),true);
  assert.ok(!('footer' in contract.SHOT05_TEXT_AREAS));
  assert.equal(contract.SHOT05_TEXT_AREAS.explainers.top,903);
});

test('SHOT05 root registers measured 1080p30 source with no fabricated cues',()=>{
  assert.match(rootScene,/id="EP002-SHOT05-CANDIDATE"/);
  assert.match(rootScene,/component=\{Shot05DirectorVisualV1\}/);
  assert.match(rootScene,/verifiedCues:\[\]/);
  assert.match(rootScene,/termCues:\[\]/);
  assert.match(scene,/validateShot05Source\(props\)/);
  assert.match(scene,/video\.fps!==30/);
});

test('Tier++ source preflight refuses fake audio/timing and requires fifteen spoken pool terms',()=>{
  const source='a'.repeat(40);
  const job={compositionId:'EP002-SHOT05-CANDIDATE',renderId:'shot05-qa',
    width:1920,height:1080,fps:30,durationInFrames:props.durationInFrames,
    inputProps:{...props,expectedSourceCommit:source,shotKey:'EP002_SHOT05',
      scriptRevision:1,inputFingerprint:'b'.repeat(64)}};
  const good=preflightTierPlusPlusRender(job,source);
  assert.equal(good.status,'TECHNICAL_PRECHECK_PASS');
  assert.ok(good.checks.includes('FIFTEEN_REAL_CONNECTION_POOL_TERMS'));
  assert.throws(()=>preflightTierPlusPlusRender(job,'c'.repeat(40)),/WORKER_SHA_NOT_PINNED/);
  assert.throws(()=>preflightTierPlusPlusRender({...job,width:1280},source),
    /REQUIRES_1920X1080_30FPS/);
  assert.throws(()=>preflightTierPlusPlusRender({...job,inputProps:{
    ...job.inputProps,voiceTakeId:''}},source),
    /SHOT05_SELECTED_REAL_VOICE_CUE_CONTRACT/);
  assert.throws(()=>preflightTierPlusPlusRender({...job,inputProps:{
    ...job.inputProps,termCues:terms.slice(1)}},source),
    /SHOT05_SELECTED_REAL_VOICE_CUE_CONTRACT/);
});
