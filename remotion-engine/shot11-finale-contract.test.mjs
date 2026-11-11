import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {preflightTierPlusPlusRender} from './tier-plus-plus-render-quality.mjs';
import {shot10TextWidth,shot10TweenSize} from './shot10-content-fit-layout.mjs';
import {SHOT11_LARGE_AMBER_STORY,shot11LargeAmberSize,shot11LargeAmberIndex}
  from './shot11-large-amber-story.mjs';

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
  assert.match(scene,/LockedShot10LastFrame/);
  assert.match(scene,/LargeAmberStory/);
  assert.match(scene,/OneDatabaseFocus/);
  assert.match(scene,/frame=\{worldFrame\}/);
  assert.match(contract,/orangeStory:\{left:560,top:742,width:1240,height:176\}/);
  assert.match(api,/r\.id=:id and r\.composition_id='EP002-SHOT10-CANDIDATE'/);
  assert.match(api,/r\.status='SUCCEEDED'/);
  assert.match(api,/r\.input_props->'lockedShot09Handoff'/);
  assert.match(api,/SHOT10_LOCKED_FRAMES=2360/);
  assert.match(api,/a4d9fe5d1dcec033f36ce68a190160fd8077faea/);
  assert.match(api,/2034d8c6-99b2-46a5-9469-bf3df325d6c0/);
  assert.match(api,/lockedShot10Boundary\(\)/);
  assert.match(root,/id="EP002-SHOT11-CANDIDATE"/);
});

test('SHOT11 shows only five meaningful LARGE orange panels, all copy-fitted and readable',()=>{
  const live=scene.slice(scene.indexOf('const LargeAmberStory:'),
    scene.indexOf('export const Shot11DirectorVisualV1:'));
  assert.equal(SHOT11_LARGE_AMBER_STORY.length,5);
  assert.deepEqual(SHOT11_LARGE_AMBER_STORY.map(s=>s.cue),[
    'ONE_DATABASE','REJECT_EXCESS','FAST_FAILURE',
    'HEALTHY_NOT_AVAILABLE','ONE_DB_QUESTION']);
  const sizes=SHOT11_LARGE_AMBER_STORY.map(shot11LargeAmberSize);
  assert.ok(new Set(sizes.map(x=>x.width)).size>=4,
    'Different real texts must produce different panel widths');
  for(let i=0;i<SHOT11_LARGE_AMBER_STORY.length;i++){
    const {eyebrow,headline,featured}=SHOT11_LARGE_AMBER_STORY[i];
    const size=sizes[i];
    assert.ok(size.width<=1240&&size.width>=530);
    assert.ok(size.height===166||size.height===176);
    assert.ok(shot10TextWidth(eyebrow,size.headingFont)+94<=size.width,
      'Eyebrow clipped: '+eyebrow);
    assert.ok(shot10TextWidth(headline,size.headlineFont)+94<=size.width,
      'Headline clipped: '+headline);
    assert.ok(size.headingFont>=30&&size.headlineFont>=42);
    assert.ok(560+size.width<=1800,'Panel overlaps horizontal safe margin');
    assert.ok(742+size.height<983,'Panel overlaps previous footer lane');
    assert.equal(featured,i===SHOT11_LARGE_AMBER_STORY.length-1);
  }
  assert.match(live,/width:size.width,height:size.height/);
  assert.match(live,/shot10TweenSize\(previous,target,shot11Ease\(frame,start,34\)\)/);
  assert.match(live,/border:'3px solid '\+AMBER/);
  assert.match(live,/background:'linear-gradient\(112deg,rgba\(78,42,22,.97\)/);
  assert.doesNotMatch(live,/ResponsiveCard|ResponsiveCaption|PanelState|CaptionState/);
  assert.doesNotMatch(live,/width:448,height:148|width:445,height:148/);
  assert.doesNotMatch(live,/fontSize:(?:10|11|12|13|14|15|16|17|18|19|20|21|22)\b/);
  assert.doesNotMatch(live,/REQUEST-LEVEL EVIDENCE|QUEUE SHRINKS ONLY IF/);
  assert.doesNotMatch(live,/heading:'DATABASE QUEUE'/);
  assert.match(scene,/OneDatabaseFocus frame=\{frame\} cue=\{cue\}/);
  assert.match(scene,/left:n.x-n.width\/2-11,top:n.y-11/);
  assert.match(scene,/LockedShot10LastFrame opacity=\{1-first\}/);
  assert.deepEqual(shot10TweenSize(sizes[0],sizes[1],0),{
    width:sizes[0].width,height:sizes[0].height
  });
  assert.deepEqual(shot10TweenSize(sizes[0],sizes[1],1),{
    width:sizes[1].width,height:sizes[1].height
  });
});

test('SHOT11 final orange promise clearly announces MULTIPLE DATABASE INSTANCES and STAYS through frame end',()=>{
  const positions=Object.fromEntries(ids.map((id,i)=>[id,terms[i].startFrame]));
  const last=SHOT11_LARGE_AMBER_STORY.at(-1);
  assert.equal(last?.cue,'ONE_DB_QUESTION');
  assert.equal(last?.eyebrow,'ONE DATABASE IS NOT ENOUGH?');
  assert.equal(last?.headline,'NEXT: MULTIPLE DATABASE INSTANCES.');
  assert.equal(last?.featured,true);
  assert.equal(shot11LargeAmberIndex(positions.ONE_DATABASE-1,positions),-1);
  assert.equal(shot11LargeAmberIndex(positions.ONE_DATABASE,positions),0);
  assert.equal(shot11LargeAmberIndex(positions.ONE_DB_QUESTION-1,positions),3);
  assert.equal(shot11LargeAmberIndex(positions.ONE_DB_QUESTION,positions),4);
  assert.equal(shot11LargeAmberIndex(positions.NEXT_STORY,positions),4);
  assert.equal(shot11LargeAmberIndex(props.durationInFrames-1,positions),4);
  assert.ok(props.durationInFrames-positions.ONE_DB_QUESTION>=120,
    'The verified final story requires several seconds of clear exposure');
  const live=scene.slice(scene.indexOf('const LargeAmberStory:'),
    scene.indexOf('const OneDatabaseFocus:'));
  assert.match(live,/story\.featured\?shot11Ease\(frame,cue\.NEXT_STORY,30\):0/);
  assert.match(live,/shot11LargeAmberIndex\(frame,cue\)/);
  assert.doesNotMatch(live,/fadeOut|fadeOutStart|disappear|duration-frame|lastFrameFade/);
  assert.match(scene,/replicaGrowth=\{0\}/);
  assert.match(scene,/dbStress=\{\.33-\.10\*recovery\}/);
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
