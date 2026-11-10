import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';
import {preflightTierPlusPlusRender} from './tier-plus-plus-render-quality.mjs';

const root=path.dirname(fileURLToPath(import.meta.url));
const src=n=>readFileSync(path.join(root,'src/episodes/ep002',n),'utf8');
const layout=src('Shot02PremiumLayout.ts');
const contract=src('Shot08VisualContract.ts')
  .replace(/^import\s+\{SHOT02_NODES,shot02Intersects,type Rect\}\s+from\s+'\.\/Shot02PremiumLayout';\s*/m,'');
const js=ts.transpileModule(layout+'\n'+contract,{
  compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022},
}).outputText;
const c=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const scene=src('Shot08DirectorVisualV1.tsx');
const world=src('Shot07CleanArchitectureWorld.tsx');
const frames=2700;
const starts=[22,110,210,305,415,505,615,705,790,900,980,1075,
  1145,1245,1380,1490,1605,1740,1860,2020,2380];
const terms=c.SHOT08_TERM_ORDER.map((id,i)=>({
  id,spokenAnchor:'source voice '+id,startFrame:starts[i],endFrame:starts[i]+18,
}));
const beats=[0,475,890,1310,1750,2200].map((startFrame,i)=>({
  beatNumber:i+1,spokenAnchor:'approved real audio phrase '+i,startFrame,
  endFrame:i===5?frames:[475,890,1310,1750,2200][i],
}));
const props={durationInFrames:frames,voiceTakeId:'de409d13-5667-4161-85d9-5ae57d0d30a3',
  timingMode:'ELEVENLABS_CHARACTER_TIMESTAMPS',verifiedCues:beats,termCues:terms,
  lockedShot07Handoff:{
    renderId:'b2a335dd-cb71-48f2-bf47-0f8bdcdd969d',
    sourceCommit:'d4fd0701f7298903dad2167e38bb7931edeae6bb',
    lastFrame:2673,criticalPulseStartFrame:1750,cascadeStartFrame:2020,
  }};

test('SHOT08 requires six continuous real voice beats and twenty-one source-spoken events',()=>{
  assert.doesNotThrow(()=>c.validateShot08Source(props));
  assert.throws(()=>c.validateShot08Source({...props,voiceTakeId:''}),
    /SHOT08_RECOVERY_REQUIRES_CURRENT_REAL_SELECTED_VOICE_AND_SIX_BEATS/);
  assert.throws(()=>c.validateShot08Source({...props,termCues:terms.slice(1)}),
    /SHOT08_RECOVERY_REQUIRES_CURRENT_REAL_SELECTED_VOICE_AND_SIX_BEATS/);
  assert.throws(()=>c.validateShot08Source({...props,termCues:[...terms].reverse()}),
    /SHOT08_RECOVERY_SPOKEN_TERM_ORDER_INVALID/);
  assert.throws(()=>c.validateShot08Source({...props,verifiedCues:beats.map((b,i)=>
    i===1?{...b,startFrame:b.startFrame+2}:b)}),
    /SHOT08_SIX_AUDIO_ALIGNED_BEATS_INVALID/);
});

test('SHOT07→08 keeps original phone and 3 Auth / 1 DB diagram with cinematic title dissolve',()=>{
  assert.match(src('Shot07DirectorVisualV1.tsx'),/Shot07CleanArchitectureWorld/);
  assert.match(scene,/Shot07CleanArchitectureWorld/);
  assert.match(scene,/WHEN RETRYING CREATES MORE FAILURE/);
  assert.match(scene,/STOP THE RETRY STORM/);
  assert.match(scene,/replicaGrowth=\{0\}/);
  assert.match(scene,/showPhone=\{1\}/);
  assert.match(scene,/initialPressure/);
  assert.match(scene,/showLoginBadge=\{showBadge\}/);
  assert.match(scene,/shot08Ease\(frame,Math.max\(36,cue.CONTROL_FIRST-24\),65\)/);
  assert.match(scene,/const worldFrame=handoff.lastFrame\+frame/);
  assert.match(scene,/frame=\{worldFrame\}/);
  assert.match(scene,/cascadeStartFrame=\{handoff.cascadeStartFrame\}/);
  assert.match(scene,/criticalPulseStartFrame=\{handoff.criticalPulseStartFrame\}/);
  assert.match(scene,/recoveryLevel=\{stressReduction\}/);
  assert.match(scene,/left:560,top:78/);
  assert.match(scene,/marginTop:15,width:690,height:2/);
  assert.match(world,/Shot02PressurePhone/);
  assert.match(world,/User Database/);
  assert.doesNotMatch(scene,/SIX AUTH|THREE AUTH INSTANCES → SIX|horizontal scaling/i);
  assert.doesNotThrow(()=>c.assertShot08SafeLayout());
});

test('SHOT08 visualizes deadline, shared budget, backoff, jitter and honest DB result locally',()=>{
  for(const token of ['BudgetMeter','BackoffMeter','DBReadout','AuthFocus',
    'DEADLINE CHECK','SHARED RETRY BUDGET','BACKOFF','JITTER',
    'CAPACITY · UNCHANGED','FEWER DUPLICATE DATABASE LOOKUPS'])
    assert.ok(scene.includes(token),token);
  assert.doesNotMatch(scene,/NewAttemptPath|NEW LOGIN ARRIVALS CARD|More Servers, Same Bottleneck/);
  assert.match(scene,/flowRetryLevel=\{boundedRetries\}/);
  assert.match(scene,/flowJitterLevel=\{staggered\}/);
  assert.match(world,/Shot07RequestFlows/);
  assert.match(scene,/at:cue\.JITTER,label:'BACKOFF \+ JITTER'/);
  assert.match(scene,/width:'max-content',maxWidth:1060,height:69/);
  assert.match(scene,/border:'2px solid rgba\(245,165,90,.92\)'/);
  assert.match(scene,/color:'#F5F8ED'/);
  assert.match(world,/recoveryLevel=0/);
  assert.equal((scene.match(/\{at:cue\./g)||[]).length,5);
});

test('worker preflight accepts source-pinned honest real voice and refuses mismatches',()=>{
  const sha='d'.repeat(40);
  const job={compositionId:'EP002-SHOT08-CANDIDATE',width:1920,
    height:1080,fps:30,durationInFrames:frames,inputProps:{
      ...props,shotKey:'EP002_SHOT08',scriptRevision:8,
      inputFingerprint:'a'.repeat(64),expectedSourceCommit:sha,
      visualSourceSha:'b'.repeat(40),
  }};
  const pass=preflightTierPlusPlusRender(job,sha);
  assert.equal(pass.status,'TECHNICAL_PRECHECK_PASS');
  assert.ok(pass.checks.includes('TWENTY_ONE_REAL_RECOVERY_TERMS'));
  assert.ok(pass.checks.includes('SIX_REAL_AUDIO_ALIGNED_BEATS'));
  assert.ok(pass.checks.includes('LOCKED_SHOT07_V3_EXACT_FINAL_FRAME'));
  assert.throws(()=>c.validateShot08Source({...props,lockedShot07Handoff:null}),
    /SHOT08_REQUIRES_IMMUTABLE_SHOT07_V3_ACTUAL_FINAL_FRAME/);
  assert.throws(()=>c.validateShot08Source({...props,lockedShot07Handoff:{
    ...props.lockedShot07Handoff,lastFrame:2669}}),
    /SHOT08_REQUIRES_IMMUTABLE_SHOT07_V3_ACTUAL_FINAL_FRAME/);
  assert.throws(()=>preflightTierPlusPlusRender({...job,inputProps:{
    ...job.inputProps,lockedShot07Handoff:{...props.lockedShot07Handoff,
      sourceCommit:'f'.repeat(40)}}},sha),
    /SHOT08_LOCKED_SHOT07_V3_FRAME_AND_SPEECH_BOUNDARY_REQUIRED/);
  assert.throws(()=>preflightTierPlusPlusRender(job,'f'.repeat(40)),
    /WORKER_SHA_NOT_PINNED/);
  assert.throws(()=>preflightTierPlusPlusRender({...job,fps:24},sha),
    /REQUIRES_1920X1080_30FPS/);
  assert.throws(()=>preflightTierPlusPlusRender({...job,inputProps:{
    ...job.inputProps,verifiedCues:[]}},sha),
    /SHOT08_SELECTED_REAL_VOICE_CUE_CONTRACT/);
});
