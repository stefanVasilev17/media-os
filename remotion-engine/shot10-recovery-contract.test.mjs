import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {preflightTierPlusPlusRender} from './tier-plus-plus-render-quality.mjs';
import {shot10TextWidth,shot10ContentCardSize,shot10CaptionSize,
  shot10DbMeterSize,shot10TweenSize} from './shot10-content-fit-layout.mjs';
const src=name=>fs.readFileSync(path.join('src/episodes/ep002',name),'utf8');
const scene=src('Shot10DirectorVisualV1.tsx');
const contract=src('Shot10VisualContract.ts');
const previous=src('Shot09DirectorVisualV1.tsx');
const root=fs.readFileSync('src/Root.tsx','utf8');
const java=fs.readFileSync('../backend/src/main/java/com/architecturalthinking/mediaos/workflow/Ep002Shot10PreviewController.java','utf8');
const audioGate=fs.readFileSync('../backend/src/main/java/com/architecturalthinking/mediaos/remotion/RemotionCpuWorkerController.java','utf8');
const worker=fs.readFileSync('cpu-worker.mjs','utf8');
const ids=[
  'LOOK_DATABASE','RETRIES_LIMITED','QUEUE_SHRINK',
  'DB_COMPLETIONS','SHARED_BUDGET','DRAIN_BACKLOG',
  'CONNECTIONS_RETURN','LATENCY_IMPROVES','PRESSURE_AMBER','MEASUREMENT',
  'OLD_TIMEOUT','OLD_OVER','NEW_LOGIN','EVIDENCE','VALID_SUCCESS',
  'SYSTEM_ERRORS','WRONG_PASSWORD','P95_P99','TRACING','REJECTIONS','RECOVERY'];
const beats=Array.from({length:6},(_,i)=>({
  beatNumber:i+1,spokenAnchor:'verified real quote '+(i+1),
  startFrame:i===0?9:i*600,endFrame:(i+1)*600}));
const terms=ids.map((id,i)=>({id,spokenAnchor:'real spoken '+id,
  startFrame:14+i*150,endFrame:30+i*150}));
const handoff={
  renderId:'d4b6c8ff-10c5-4181-aa59-fcd16a4470ba',
  sourceCommit:'b33f00ee81f89301115a4fd79874802c712f2724',
  lastFrame:3062,durationInFrames:3063,
  shot08WorldLastFrame:4986,worldLastFrame:8048,
  criticalPulseStartFrame:1712,cascadeStartFrame:1991,
};
const props={
  shotKey:'EP002_SHOT10',durationInFrames:3600,
  voiceTakeId:'11111111-1111-4111-8111-111111111111',
  scriptRevision:3,inputFingerprint:'b'.repeat(64),visualSourceSha:'c'.repeat(40),
  expectedSourceCommit:'a'.repeat(40),
  timingMode:'ELEVENLABS_CHARACTER_TIMESTAMPS',
  postVoiceHoldFrames:0,verifiedCues:beats,termCues:terms,
  lockedShot09Handoff:handoff,
};
const job={
  compositionId:'EP002-SHOT10-CANDIDATE',
  renderId:'22222222-2222-4222-8222-222222222222',
  width:1920,height:1080,fps:30,durationInFrames:3600,inputProps:props,
};

test('SHOT10 shares exact LOCKED SHOT09 last world frame and original living map',()=>{
  assert.match(scene,/const worldFrame=handoff\.worldLastFrame\+frame/);
  assert.match(scene,/frame=\{worldFrame\}/);
  assert.match(contract,/worldLastFrame:8048/);
  assert.match(scene,/transform:'translate3d\(-7px,0,0\) scale\(1\.007\)'/);
  assert.match(scene,/replicaGrowth=\{0\} dbStress=/);
  assert.match(scene,/recoveryLevel=\{1\}/);
  assert.match(scene,/showPhone=\{1\}/);
  assert.match(scene,/admissionLevel=\{\.5\}/);
  assert.match(scene,/PROTECT THE SHARED DATABASE/);
  assert.match(scene,/CAPACITY DID NOT INCREASE/);
  assert.match(scene,/PROBE ONLY/);
  assert.match(scene,/SOME LOGINS FAIL FAST · ACCEPTED WORK MUST FIT THE SAME DATABASE LIMIT/);
  assert.match(java,/d4b6c8ff-10c5-4181-aa59-fcd16a4470ba/);
  assert.match(java,/b33f00ee81f89301115a4fd79874802c712f2724/);
  assert.match(java,/SHOT09_LOCKED_FRAMES=3063/);
  assert.match(java,/r\.status='SUCCEEDED'/);
  assert.match(java,/r\.input_props->'lockedShot08Handoff'/);
  assert.match(java,/lockedShot09Boundary\(\)/);
  assert.match(root,/id="EP002-SHOT10-CANDIDATE"/);
  assert.match(previous,/const worldFrame=handoff\.worldLastFrame\+frame/);
});

test('SHOT10 recovery is factual; OLD login never revives and DB capacity does not increase',()=>{
  for(const text of ['COMPLETIONS > ADMISSIONS',
    'EXAMPLE · SHARED DB BUDGET','450/s IN · ~500/s OUT',
    'RED → AMBER · IF MEASURED',
    'OLD LOGIN · A','TIMED OUT · ENDED',
    'NEW LOGIN · B','NEW REQUEST · ACCEPTED','P95 / P99',
    'SUCCESS ≠ SYSTEM ERROR',
    'POOL WAIT → DB WORK','REJECTIONS ARE FAILURES',
    'USER DATABASE'])
      assert.ok(scene.includes(text),'Missing essential recovery story '+text);
  assert.match(scene,/\.82-\.49\*recovery\*measured/);
  assert.match(scene,/cue\.MEASUREMENT/);
  assert.match(scene,/cue\.NEW_LOGIN/);
  assert.match(scene,/cue\.TRACING/);
  assert.match(scene,/cue\.REJECTIONS/);
  assert.doesNotMatch(scene,/DATABASE QUEUE · DRAINING/);
  assert.doesNotMatch(scene,/QUEUE SHRINKS ONLY IF COMPLETIONS WIN/);
  assert.doesNotMatch(scene,/REQUEST-LEVEL EVIDENCE/);
  assert.doesNotMatch(scene,/BACKLOG · DECREASING/);
});

test('SHOT10 live callouts fit real copy, animate size and remove all microscopic explanations',()=>{
  const live=scene.slice(scene.indexOf('type CardCopy='),
    scene.indexOf('export const Shot10DirectorVisualV1:'));
  const cards=[...live.matchAll(/heading:'([^']+)',\s*primary:'([^']+)'/g)]
    .map(([,heading,primary])=>({heading,primary}));
  const captions=[...live.matchAll(/main:'([^']+)',\s*detail:'([^']+)'/g)]
    .map(([,main,detail])=>({main,detail}));
  assert.equal(cards.length,12);
  assert.equal(captions.length,8);
  const sizes=cards.map(value=>shot10ContentCardSize(value));
  const captionSizes=captions.map(value=>shot10CaptionSize(value));
  assert.ok(new Set(sizes.map(v=>v.width)).size>=8);
  assert.ok(new Set(captionSizes.map(v=>v.width)).size>=6);
  for(let i=0;i<cards.length;i++){
    const {heading,primary}=cards[i],size=sizes[i];
    assert.ok(size.width>=244&&size.width<=445,'Card too wide or narrow '+heading);
    assert.equal(size.height,89);
    assert.ok(shot10TextWidth(heading,18)+45<=size.width,'Heading clipped '+heading);
    assert.ok(shot10TextWidth(primary,20)+45<=size.width,'Primary clipped '+primary);
    assert.ok(1090+size.width<1573,'Card overlaps DB '+heading);
  }
  for(let i=0;i<captions.length;i++){
    const {main,detail}=captions[i],size=captionSizes[i];
    assert.ok(size.width<=1060&&size.height===56);
    assert.ok(shot10TextWidth(main,22)+shot10TextWidth(detail,19)+65<=size.width);
  }
  const meter=shot10DbMeterSize();
  assert.ok(meter.width<256&&meter.width>190);
  assert.ok(meter.height<89);
  assert.ok(1573+meter.width<1880);
  assert.deepEqual(shot10TweenSize(sizes[0],sizes[2],0),sizes[0]);
  assert.deepEqual(shot10TweenSize(sizes[0],sizes[2],1),sizes[2]);
  const half=shot10TweenSize(sizes[0],sizes[2],.5);
  assert.ok(half.width>sizes[0].width&&half.width<sizes[2].width);
  assert.ok(shot10TweenSize(captionSizes[1],captionSizes[2],.5).width
    >captionSizes[1].width);
  assert.match(live,/shot10ContentCardSize\(current\)/);
  assert.match(live,/shot10TweenSize\(previous,target,shot10Ease\(frame,current\.at,28\)\)/);
  assert.match(live,/shot10TweenSize\(previous,target,shot10Ease\(frame,entry\.at,26\)\)/);
  assert.match(live,/width:size\.width,height:size\.height/);
  assert.match(live,/width:dbSize\.width,height:dbSize\.height/);
  assert.doesNotMatch(live,/width:448,height:148|width:445,height:148|width:256,height:143/);
  assert.doesNotMatch(live,/fontSize:(?:10|11|12|13|14|15|16)\b/);
  assert.ok(live.includes("fontSize:18"));
  assert.ok(live.includes("fontSize:20"));
  assert.ok(live.includes("fontSize:19"));
  assert.match(scene,/smallCopyFade=1-shot10Ease\(frame,0,12\)/);
  assert.match(scene,/<DirectorLockedShot09Closing opacity=\{1-takeover\} frame=\{frame\}\/>/);
  assert.ok(!live.includes('QUEUE SHRINKS ONLY IF'));
});

test('SHOT10 supports six measured voice beats and every one of 21 spoken term cues',()=>{
  const pass=preflightTierPlusPlusRender(job,'a'.repeat(40));
  assert.equal(pass.status,'TECHNICAL_PRECHECK_PASS');
  assert.ok(pass.checks.includes('SIX_REAL_AUDIO_ALIGNED_BEATS'));
  assert.ok(pass.checks.includes('TWENTY_ONE_REAL_RECOVERY_TERMS'));
  assert.ok(pass.checks.includes('EXACT_LOCKED_SHOT09_8048_FINAL_WORLD_FRAME'));
  const invalid=[
    x=>{x.inputProps.verifiedCues[0].startFrame=-1;},
    x=>{x.inputProps.verifiedCues[3].startFrame+=3;},
    x=>{x.inputProps.verifiedCues[5].endFrame=3599;},
    x=>{x.inputProps.termCues[13].id='SYNTHETIC';},
    x=>{x.inputProps.termCues[14].startFrame=0;},
    x=>{x.inputProps.lockedShot09Handoff.worldLastFrame=8049;},
    x=>{x.inputProps.lockedShot09Handoff.renderId='00000000-0000-4000-8000-000000000001';},
    x=>{x.inputProps.lockedShot09Handoff.sourceCommit='f'.repeat(40);},
    x=>{x.inputProps.timingMode='FAKE';},
    x=>{x.inputProps.expectedSourceCommit='f'.repeat(40);},
  ];
  for(const change of invalid) {
    const copy=structuredClone(job);
    change(copy);
    assert.throws(()=>preflightTierPlusPlusRender(copy,'a'.repeat(40)),
      /AT_TIER_PLUS_PLUS_PRECHECK_FAILED_/);
  }
  assert.match(contract,/lockedShot09Handoff/);
  assert.match(contract,/SHOT10_TWENTY_ONE_REAL_TERMS_INVALID/);
  assert.match(java,/ready\.verifiedCues\(\)\.size\(\)!=6/);
  assert.match(java,/ready\.termCues\(\)\.size\(\)!=21/);
});

test('SHOT10 CPU render is pinned to current Take and cannot silently substitute audio',()=>{
  assert.match(worker,/EP002-SHOT10-CANDIDATE/);
  assert.match(audioGate,/matchesCurrentShot10Render/);
  assert.match(audioGate,/EP002_SHOT10/);
  assert.match(java,/Boolean\.TRUE\.equals\(request\.confirmPaidCpuRender\(\)\)/);
  assert.match(java,/MEDIA_OS_CREATION_PREFLIGHT/);
  assert.match(java,/Ep002RecoverySource\.RECOVERY_VISUAL_BLOB_SHA/);
});
