import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {preflightTierPlusPlusRender} from './tier-plus-plus-render-quality.mjs';
import {shot09PolicyPanelSize,shot09TweenPanelSize,
  shot09AdmissionStatusSize} from './shot09-adaptive-panel-layout.mjs';
const src=name=>fs.readFileSync(path.join('src/episodes/ep002',name),'utf8');
const scene=src('Shot09DirectorVisualV1.tsx');
const contract=src('Shot09VisualContract.ts');
const flow=src('Shot07RequestFlows.tsx');
const world=src('Shot07CleanArchitectureWorld.tsx');
const root=fs.readFileSync('src/Root.tsx','utf8');
const controller=fs.readFileSync('../backend/src/main/java/com/architecturalthinking/mediaos/workflow/Ep002Shot09PreviewController.java','utf8');
const worker=fs.readFileSync('cpu-worker.mjs','utf8');
const api=fs.readFileSync('../backend/src/main/java/com/architecturalthinking/mediaos/remotion/RemotionCpuWorkerController.java','utf8');
const terms=['STOP_RETRIES','NINE_HUNDRED','FIVE_HUNDRED','QUEUE_GROWS',
  'ADMISSION_CONTROL','GATEWAY_POLICY','THREE_AUTH','SHARED_BUDGET','FOUR_FIFTY',
  'ILLUSTRATION','SHEDDING','FAIL_FAST','NO_SIGN_IN','CONCURRENCY','THREE_POOLS',
  'BULKHEAD','BREAKER_OPEN','TEST_PROBES','TRADEOFF','SOME_FAIL','ADMITTED_WORK'];
const beats=Array.from({length:7},(_,i)=>({beatNumber:i+1,
  spokenAnchor:'genuine selected phrase '+i,startFrame:i===0?9:i*600,endFrame:(i+1)*600}));
const termCues=terms.map((id,i)=>({id,spokenAnchor:'genuine spoken '+id,
  startFrame:10+i*180,endFrame:35+i*180}));
const lockedShot08Handoff={
  renderId:'3415073a-5906-489d-bb69-6af7446c2c9b',
  sourceCommit:'a0dbdc8927cb2d47d5a1a3e691c6405bf0c28390',
  lastFrame:2313,shot07LastFrame:2673,worldLastFrame:4986,
  criticalPulseStartFrame:1712,cascadeStartFrame:1991,
};
const props={shotKey:'EP002_SHOT09',durationInFrames:4200,
  voiceTakeId:'11111111-1111-4111-8111-111111111111',
  timingMode:'ELEVENLABS_CHARACTER_TIMESTAMPS',
  scriptRevision:2,inputFingerprint:'b'.repeat(64),visualSourceSha:'c'.repeat(40),
  postVoiceHoldFrames:0,verifiedCues:beats,termCues,lockedShot08Handoff,
  expectedSourceCommit:'a'.repeat(40)};
const job={compositionId:'EP002-SHOT09-CANDIDATE',renderId:'11111111-1111-4111-8111-111111111111',
  width:1920,height:1080,fps:30,durationInFrames:4200,inputProps:props};

test('SHOT09 exact last-frame transition from Director LOCKED SHOT08, no particle reset',()=>{
  assert.match(scene,/const worldFrame=handoff.worldLastFrame\+frame/);
  assert.match(scene,/frame=\{worldFrame\}/);
  assert.match(scene,/cascadeStartFrame=\{handoff.cascadeStartFrame\}/);
  assert.match(scene,/criticalPulseStartFrame=\{handoff.criticalPulseStartFrame\}/);
  assert.match(scene,/transform:'translate3d\(-7px,0,0\) scale\(1.007\)'/);
  assert.match(scene,/dbStress=\{\.82\}/);
  assert.match(scene,/recoveryLevel=\{1\}/);
  assert.match(scene,/flowRetryLevel=\{\.16\} flowJitterLevel=\{1\}/);
  assert.match(scene,/showPhone=\{1\} showPools=\{0\}/);
  assert.match(scene,/STOP THE RETRY STORM/);
  assert.match(scene,/left:560,top:78/);
  assert.match(scene,/marginTop:15,width:690,height:2/);
  assert.match(scene,/RETRIES ARE BOUNDED · THE SHARED DATABASE STILL HAS FINITE CAPACITY/);
  assert.match(scene,/PreviousDbReadout fade=\{oldDbPanel\}/);
  assert.match(scene,/CAPACITY · UNCHANGED/);
  assert.match(contract,/worldLastFrame:4986/);
  assert.match(controller,/LOCKED_SHOT08_RENDER=UUID.fromString/);
  assert.match(controller,/3415073a-5906-489d-bb69-6af7446c2c9b/);
  assert.match(controller,/lockedShot08Boundary\(\)/);
  assert.match(controller,/props.put\("lockedShot08Handoff",lockedBoundary\)/);
  assert.match(root,/id="EP002-SHOT09-CANDIDATE"/);
});

test('SHOT09 must be one shared DB and three original Auths, safe real terms and unmisleading states',()=>{
  assert.match(scene,/ONE BUDGET · THREE AUTH/);
  assert.match(scene,/450 TOTAL DB ATTEMPTS\/S · EXAMPLE/);
  assert.match(scene,/900\/s/);
  assert.match(scene,/~500\/s/);
  assert.match(scene,/NOT LIVE METRICS/);
  assert.match(scene,/NO SESSION CREATED/);
  assert.match(scene,/NEW DB CALLS FAIL FAST TEMPORARILY/);
  assert.match(scene,/ONLY LIMITED PROBES · DO NOT REOPEN YET/);
  assert.match(scene,/SOME LOGINS FAIL FAST/);
  assert.match(scene,/THE REAL TRADE-OFF/);
  assert.match(scene,/width:'max-content',maxWidth:1060,height:69/);
  assert.match(scene,/color:'#F5F8ED'/);
  assert.match(scene,/cue\.ADMISSION_CONTROL/);
  assert.match(scene,/cue\.SHARED_BUDGET/);
  assert.match(scene,/cue\.SHEDDING/);
  assert.match(scene,/cue\.BULKHEAD/);
  assert.match(scene,/cue\.BREAKER_OPEN/);
  assert.match(scene,/cue\.TRADEOFF/);
  assert.match(scene,/admissionLevel=\{admission\} breakerLevel=\{breaker\}/);
  assert.match(scene,/probeLevel=\{probe\}/);
  assert.match(flow,/admissionLevel=1,breakerLevel=0,probeLevel=0/);
  assert.match(world,/admissionLevel=1,breakerLevel=0,probeLevel=0/);
  assert.match(flow,/const allowed=clamp\(admissionLevel\)/);
  assert.match(flow,/opacity=\{edge\(t\)\*\.88\*allowed\}/);
  assert.match(flow,/opacity=\{edge\(t\)\*retry\*\.9\*allowed\}/);
});

test('paid Worker refuses any stale voice, SHOT08 identity/frame, or guessed onset',()=>{
  const okay=preflightTierPlusPlusRender(job,'a'.repeat(40));
  assert.equal(okay.status,'TECHNICAL_PRECHECK_PASS');
  assert.ok(okay.checks.includes('SEVEN_REAL_AUDIO_ALIGNED_BEATS'));
  assert.ok(okay.checks.includes('TWENTY_ONE_REAL_ADMISSION_TERMS'));
  assert.ok(okay.checks.includes('EXACT_LOCKED_SHOT08_4986_FINAL_WORLD_FRAME'));
  assert.throws(()=>preflightTierPlusPlusRender({...job,inputProps:{
    ...props,lockedShot08Handoff:{...lockedShot08Handoff,lastFrame:2312}}},'a'.repeat(40)),
    /SHOT09_EXACT_DIRECTOR_LOCKED_SHOT08_WORLD_HANDOFF_REQUIRED/);
  assert.throws(()=>preflightTierPlusPlusRender({...job,inputProps:{
    ...props,lockedShot08Handoff:{...lockedShot08Handoff,
      sourceCommit:'d'.repeat(40)}}},'a'.repeat(40)),
    /SHOT09_EXACT_DIRECTOR_LOCKED_SHOT08_WORLD_HANDOFF_REQUIRED/);
  assert.throws(()=>preflightTierPlusPlusRender({...job,inputProps:{
    ...props,termCues:termCues.slice(1)}},'a'.repeat(40)),
    /SHOT09_REAL_SELECTED_TAKE_CONTRACT_REQUIRED/);
  assert.throws(()=>preflightTierPlusPlusRender({...job,inputProps:{
    ...props,verifiedCues:beats.map((b,i)=>i===0?{...b,startFrame:-1}:b)}},'a'.repeat(40)),
    /SHOT09_SEVEN_REAL_SPOKEN_BEATS_INVALID/);
  assert.throws(()=>preflightTierPlusPlusRender({...job,inputProps:{
    ...props,verifiedCues:beats.map((b,i)=>i===4?{...b,startFrame:b.startFrame+20}:b)}},'a'.repeat(40)),
    /SHOT09_SEVEN_REAL_SPOKEN_BEATS_INVALID/);
  assert.throws(()=>preflightTierPlusPlusRender({...job,inputProps:{
    ...props,expectedSourceCommit:'f'.repeat(40)}},'a'.repeat(40)),
    /WORKER_SHA_NOT_PINNED/);
  assert.match(worker,/EP002-SHOT09-CANDIDATE/);
  assert.match(api,/matchesCurrentShot09Render/);
  assert.match(api,/EP002_SHOT09/);
});

test('SHOT09 policy panel fits eight spoken states without excess fixed-space and animates deterministically',()=>{
  const states=[
    ['ADMISSION CONTROL','POLICY ON THE EXISTING LOGIN PATH',false],
    ['ONE BUDGET · THREE AUTH','450 TOTAL DB ATTEMPTS/S · EXAMPLE',false],
    ['EARLY LOAD SHEDDING','REJECTED LOGIN · NO SESSION CREATED',false],
    ['LIMIT ACTIVE DB LOOKUPS','ONE GLOBAL LIMIT ACROSS 3 AUTH POOLS',false],
    ['RETRY BULKHEAD','RESERVE ROOM FOR NEW LOGIN LOOKUPS',true],
    ['CIRCUIT BREAKER · OPEN','NEW DB CALLS FAIL FAST TEMPORARILY',false],
    ['HALF-OPEN · SMALL TEST','ONLY LIMITED PROBES · DO NOT REOPEN YET',false],
    ['CAPACITY DID NOT INCREASE','SOME REJECTED · ACCEPTED WORK HAS A CHANCE',false],
  ];
  const sizes=states.map(([heading,line,hasChips])=>
    shot09PolicyPanelSize({heading,line,hasChips}));
  assert.equal(sizes.length,8);
  for(const size of sizes){
    assert.ok(size.width>=310&&size.width<=445);
    assert.ok(size.height>=100&&size.height<=127);
    assert.ok(1090+size.width<=1535);
    assert.ok(695+size.height<843);
  }
  assert.ok(sizes.some(x=>x.width<365));
  assert.ok(new Set(sizes.map(x=>x.width)).size>=4);
  assert.equal(sizes[4].height,127);
  assert.ok(sizes[7].width>sizes[0].width);
  assert.deepEqual(shot09TweenPanelSize(sizes[0],sizes[7],0),sizes[0]);
  assert.deepEqual(shot09TweenPanelSize(sizes[0],sizes[7],1),sizes[7]);
  const half=shot09TweenPanelSize(sizes[0],sizes[7],.5);
  assert.ok(half.width>=sizes[0].width&&half.width<=sizes[7].width);
  assert.ok(half.height>=100&&half.height<=127);
  assert.deepEqual(shot09TweenPanelSize(sizes[0],sizes[7],-1),sizes[0]);
  assert.deepEqual(shot09TweenPanelSize(sizes[0],sizes[7],2),sizes[7]);
  assert.match(scene,/const target=shot09PolicyPanelSize/);
  assert.match(scene,/const size=shot09TweenPanelSize/);
  assert.match(scene,/width:size\.width,height:size\.height/);
  assert.match(scene,/shot09Ease\(frame,entry\.at,24\)/);
  assert.match(scene,/const copyReveal=shot09Ease\(frame,entry\.at\+7,16\)/);
  assert.doesNotMatch(scene,/left:1090,top:695,width:445/);
});

test('SHOT09 PROBE ONLY badge gets readable padding, smooth expansion and stays clear of policy panel',()=>{
  const idle=shot09AdmissionStatusSize(0);
  const probe=shot09AdmissionStatusSize(1);
  assert.deepEqual(idle,{width:94,height:27});
  assert.deepEqual(probe,{width:122,height:32});
  assert.ok(probe.width>idle.width&&probe.height>idle.height);
  assert.ok(1101+probe.width/2<1180);
  assert.ok(674+probe.height/2<695);
  const middle=shot09AdmissionStatusSize(.5);
  assert.ok(middle.width>idle.width&&middle.width<probe.width);
  assert.match(scene,/shot09AdmissionStatusSize/);
  assert.match(scene,/left:1101-statusSize\.width\/2,top:674-statusSize\.height\/2/);
  assert.match(scene,/width:statusSize\.width,height:statusSize\.height/);
  assert.match(scene,/padding:'0 9px',boxSizing:'border-box',whiteSpace:'nowrap'/);
  assert.match(scene,/probe>\.5\?'PROBE ONLY':'OPEN'/);
  assert.doesNotMatch(scene,/left:1060,top:662,width:82,height:23/);
});
