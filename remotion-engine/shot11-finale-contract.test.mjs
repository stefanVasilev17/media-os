import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {preflightTierPlusPlusRender} from './tier-plus-plus-render-quality.mjs';
import {shot10TextWidth,shot10ContentCardSize,shot10CaptionSize,
  shot10TweenSize} from './shot10-content-fit-layout.mjs';

const read=p=>fs.readFileSync(p,'utf8');
const scene=read('src/episodes/ep002/Shot11DirectorVisualV1.tsx');
const contract=read('src/episodes/ep002/Shot11VisualContract.ts');
const root=read('src/Root.tsx');
const prior=read('src/episodes/ep002/Shot10DirectorVisualV1.tsx');
const api=read('../backend/src/main/java/com/architecturalthinking/mediaos/workflow/Ep002Shot11PreviewController.java');
const voice=read('../backend/src/main/java/com/architecturalthinking/mediaos/workflow/Ep002DirectorVoiceCueService.java');
const worker=read('cpu-worker.mjs');
const ids=[
  'FULL_JOURNEY','PHONE_GATEWAY_BALANCER','THREE_AUTH','ONE_DATABASE',
  'NO_NEW_SERVERS','NO_FASTER_DB','LIMIT_RETRIES','CONCURRENT_LOOKUPS',
  'REJECT_EXCESS','QUEUE_SHRINK','ON_TIME_LOGINS','FAST_FAILURE',
  'TRADEOFF','STOP_AMPLIFICATION','LESSON','HEALTHY_NOT_AVAILABLE',
  'WHOLE_JOURNEY','ONE_DB_QUESTION','NEXT_STORY'];
const beats=Array.from({length:5},(_,i)=>({
  beatNumber:i+1,spokenAnchor:'genuine spoken '+String(i+1),
  startFrame:i===0?9:i*600,endFrame:(i+1)*600}));
const terms=ids.map((id,i)=>({
  id,spokenAnchor:'genuine spoken '+id,startFrame:14+i*137,
  endFrame:31+i*137}));
const handoff={
  renderId:'2034d8c6-99b2-46a5-9469-bf3df325d6c0',
  sourceCommit:'a4d9fe5d1dcec033f36ce68a190160fd8077faea',
  durationInFrames:2360,lastFrame:2359,
  shot09WorldLastFrame:8048,worldLastFrame:10407,
  criticalPulseStartFrame:1712,cascadeStartFrame:1991};
const props={
  shotKey:'EP002_SHOT11',durationInFrames:3000,
  voiceTakeId:'11111111-1111-4111-8111-111111111111',
  scriptRevision:3,inputFingerprint:'b'.repeat(64),
  visualSourceSha:'c'.repeat(40),expectedSourceCommit:'a'.repeat(40),
  timingMode:'ELEVENLABS_CHARACTER_TIMESTAMPS',
  postVoiceHoldFrames:0,verifiedCues:beats,termCues:terms,
  lockedShot10Handoff:handoff};
const job={
  compositionId:'EP002-SHOT11-CANDIDATE',
  renderId:'22222222-2222-4222-8222-222222222222',
  width:1920,height:1080,fps:30,durationInFrames:3000,
  inputProps:props};

test('SHOT11 continues the exact SHOT10 frame and preserves one original database',()=>{
  assert.match(scene,/worldFrame=h.worldLastFrame\+frame/);
  assert.match(scene,/frame=\{worldFrame\}/);
  assert.match(prior,/const worldFrame=handoff.worldLastFrame\+frame/);
  assert.match(contract,/worldLastFrame:10407/);
  assert.match(scene,/LockedShot10LastFrame opacity=\{1-first\}/);
  assert.match(scene,/translate3d\(-7px,0,0\) scale\(1\.007\)/);
  assert.match(scene,/replicaGrowth=\{0\}/);
  assert.match(scene,/recoveryLevel=\{1\}/);
  assert.match(scene,/showPhone=\{1\} showPools=\{\.25\}/);
  assert.match(scene,/dbStress=\{\.33-\.10\*recovery\}/);
  assert.match(scene,/flowRetryLevel=\{\.16-\.08\*loop\}/);
  assert.match(scene,/admissionLevel=\{\.5\}/);
  assert.match(scene,/HEALTHY SERVERS/);
  assert.match(scene,/RELIABILITY/);
  assert.match(scene,/ONE DATABASE/);
  assert.match(scene,/ONE USER/);
  assert.match(api,/r\.id=:id and r\.composition_id='EP002-SHOT10-CANDIDATE'/);
  assert.match(api,/r\.status='SUCCEEDED'/);
  assert.match(api,/r\.input_props->'lockedShot09Handoff'/);
  assert.match(api,/SHOT10_LOCKED_FRAMES=2360/);
  assert.match(api,/a4d9fe5d1dcec033f36ce68a190160fd8077faea/);
  assert.match(api,/2034d8c6-99b2-46a5-9469-bf3df325d6c0/);
  assert.match(api,/lockedShot10Boundary\(\)/);
  assert.match(root,/id="EP002-SHOT11-CANDIDATE"/);
});

test('SHOT11 callouts are readable, content-fitted, dynamic, and do not repeat SHOT10 redundant queue',()=>{
  const live=scene.slice(scene.indexOf('type PanelState='),
    scene.indexOf('export const Shot11DirectorVisualV1:'));
  const cards=[...live.matchAll(/heading:'([^']+)',\s*primary:'([^']+)'/g)]
    .map(([,heading,primary])=>({heading,primary}));
  const caps=[...live.matchAll(/main:'([^']+)',\s*detail:'([^']+)'/g)]
    .map(([,main,detail])=>({main,detail}));
  assert.equal(cards.length,9);
  assert.equal(caps.length,8);
  const sizes=cards.map(s=>shot10ContentCardSize(s));
  const captionSizes=caps.map(s=>shot10CaptionSize(s));
  assert.ok(new Set(sizes.map(s=>s.width)).size>=6);
  assert.ok(new Set(captionSizes.map(s=>s.width)).size>=6);
  for(let i=0;i<cards.length;i++){
    const card=cards[i],size=sizes[i];
    assert.ok(size.width>=244&&size.width<=445&&size.height===89);
    assert.ok(shot10TextWidth(card.heading,18)+45<=size.width);
    assert.ok(shot10TextWidth(card.primary,20)+45<=size.width);
    assert.ok(1090+size.width<1573,'Overlaps database readout');
  }
  for(let i=0;i<caps.length;i++){
    const c=caps[i],size=captionSizes[i];
    assert.ok(size.height===56&&size.width<=1060);
    assert.ok(shot10TextWidth(c.main,22)+shot10TextWidth(c.detail,19)+65<=size.width);
  }
  assert.deepEqual(shot10TweenSize(sizes[0],sizes[1],0),sizes[0]);
  assert.deepEqual(shot10TweenSize(sizes[0],sizes[1],1),sizes[1]);
  assert.match(live,/shot10TweenSize\(previous,target,shot11Ease\(frame,state\.at,29\)\)/);
  assert.match(live,/shot10TweenSize\(previous,target,shot11Ease\(frame,state\.at,28\)\)/);
  assert.match(live,/width:size\.width,height:size\.height/);
  assert.doesNotMatch(live,/width:448,height:148|width:445,height:148|width:256,height:143/);
  assert.doesNotMatch(live,/fontSize:(?:10|11|12|13|14|15|16|17)\b/);
  assert.doesNotMatch(live,/heading:'DATABASE QUEUE'/);
  assert.doesNotMatch(live,/REQUEST-LEVEL EVIDENCE|QUEUE SHRINKS ONLY IF/);
  assert.match(scene,/OneDatabaseFocus frame=\{frame\} cue=\{cue\}/);
  assert.match(scene,/left:n.x-n.width\/2-11,top:n.y-11/);
});

test('SHOT11 real aligned five beat, nineteen term, original source gate rejects invented data',()=>{
  const pass=preflightTierPlusPlusRender(job,'a'.repeat(40));
  assert.equal(pass.status,'TECHNICAL_PRECHECK_PASS');
  assert.ok(pass.checks.includes('FIVE_REAL_AUDIO_ALIGNED_BEATS'));
  assert.ok(pass.checks.includes('NINETEEN_REAL_CONCLUSION_TERMS'));
  assert.ok(pass.checks.includes('EXACT_LOCKED_SHOT10_10407_FINAL_WORLD_FRAME'));
  const invalid=[
    t=>{t.inputProps.verifiedCues[0].startFrame=-1;},
    t=>{t.inputProps.verifiedCues[3].startFrame+=4;},
    t=>{t.inputProps.verifiedCues[4].endFrame=2999;},
    t=>{t.inputProps.termCues[14].id='UNSPOKEN';},
    t=>{t.inputProps.termCues[15].startFrame=1;},
    t=>{t.inputProps.lockedShot10Handoff.lastFrame=2360;},
    t=>{t.inputProps.lockedShot10Handoff.worldLastFrame=10408;},
    t=>{t.inputProps.lockedShot10Handoff.renderId='00000000-0000-4000-8000-000000000001';},
    t=>{t.inputProps.lockedShot10Handoff.sourceCommit='f'.repeat(40);},
    t=>{t.inputProps.timingMode='GUESS';},
    t=>{t.inputProps.expectedSourceCommit='f'.repeat(40);},
  ];
  for(const mut of invalid){
    const bad=structuredClone(job);
    mut(bad);
    assert.throws(()=>preflightTierPlusPlusRender(bad,'a'.repeat(40)),
      /AT_TIER_PLUS_PLUS_PRECHECK_FAILED_/);
  }
  assert.match(voice,/currentShot11AudioReadiness/);
  assert.match(voice,/anchors,5/);
  assert.match(voice,/Ep002Shot11TermResolver.resolve/);
  assert.match(api,/ready\.verifiedCues\(\)\.size\(\)!=5/);
  assert.match(api,/ready\.termCues\(\)\.size\(\)!=19/);
});

test('SHOT11 media remains Director-only, selected-Take-only and explicitly paid',()=>{
  assert.match(worker,/EP002-SHOT11-CANDIDATE/);
  assert.match(api,/Boolean\.TRUE\.equals\(request\.confirmPaidCpuRender\(\)\)/);
  assert.match(api,/MEDIA_OS_CREATION_PREFLIGHT/);
  assert.match(api,/Ep002RecoverySource.RECOVERY_VISUAL_BLOB_SHA/);
  assert.match(api,/shotKey","EP002_SHOT11"/);
});
