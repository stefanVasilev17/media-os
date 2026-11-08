import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';
import {preflightTierPlusPlusRender} from './tier-plus-plus-render-quality.mjs';

const root=path.dirname(fileURLToPath(import.meta.url));
const ep002=path.join(root,'src/episodes/ep002');
const read=name=>readFileSync(path.join(ep002,name),'utf8');
const transpile=source=>'data:text/javascript;base64,'
  +Buffer.from(ts.transpileModule(source,{
    compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022},
  }).outputText).toString('base64');
const layout=read('Shot02PremiumLayout.ts');
const source=read('Shot04VisualContract.ts').replace(
  /^import\s+\{SHOT02_NODES,shot02Intersects,type Rect\}\s+from\s+'\.\/Shot02PremiumLayout';\s*/m,'');
const contract=await import(transpile(layout+'\n'+source));
const scene=read('Shot04DirectorVisualV1.tsx');
const rootSource=readFileSync(path.join(root,'src/Root.tsx'),'utf8');

const starts=[55,170,340,435,650,925,1125,1510,1780];
const terms=contract.SHOT04_TERM_ORDER.map((id,i)=>({
  id,spokenAnchor:'real '+id,startFrame:starts[i],endFrame:starts[i]+12,
}));
const beatStarts=[0,420,820,1230,1600];
const beats=beatStarts.map((startFrame,i)=>({
  beatNumber:i+1,spokenAnchor:'approved source beat '+i,
  startFrame,endFrame:i===4?2000:beatStarts[i+1],
}));
const props={durationInFrames:2000,
  voiceTakeId:'0ba17c38-3302-4b20-8da5-2b76e108c153',
  timingMode:'ELEVENLABS_CHARACTER_TIMESTAMPS',
  verifiedCues:beats,termCues:terms,
};

test('SHOT04 requires genuine current approved voice and nine ordered term cues',()=>{
  assert.doesNotThrow(()=>contract.validateShot04Source(props));
  assert.throws(()=>contract.validateShot04Source({...props,voiceTakeId:''}),
    /SHOT04_REQUIRES_CURRENT/);
  assert.throws(()=>contract.validateShot04Source({...props,verifiedCues:[]}),
    /SHOT04_REQUIRES_CURRENT/);
  assert.throws(()=>contract.validateShot04Source({...props,termCues:[]}),
    /SHOT04_REQUIRES_CURRENT/);
  assert.throws(()=>contract.validateShot04Source({...props,
    termCues:[...terms].reverse()}),/SHOT04_REAL_SPOKEN_TERM_ORDER_INVALID/);
  assert.throws(()=>contract.validateShot04Source({...props,
    verifiedCues:beats.map((b,i)=>i===2?{...b,startFrame:b.startFrame+1}:b)}),
    /SHOT04_VERIFIED_BEAT_ORDER_INVALID/);
  assert.throws(()=>contract.validateShot04Source({...props,durationInFrames:1999}),
    /SHOT04_VERIFIED_BEAT_ORDER_INVALID|SHOT04_BEATS_DO_NOT_COVER_MEASURED_AUDIO/);
});

test('SHOT04 inherits exact SHOT02/03 architecture and same phone',()=>{
  assert.doesNotThrow(()=>contract.assertShot04SafeLayout());
  for(const item of ['SHOT02_NODES','SHOT02_AUTH_REPLICA_PORTS',
    'SHOT02_DATABASE_ENTRY','SHOT02_LOGIN_PARTICLE','Shot02PressurePhone'])
    assert.ok(scene.includes(item),'missing '+item);
  assert.match(scene,/translate3d\(-680px,-150px,0\) scale\(1\.11\)/);
  assert.doesNotMatch(scene,/Math.random\(|setTimeout\(|fetch\(|<Audio/);
});

test('Liveness/readiness remain green while login journey is incomplete',()=>{
  for(const word of ['LIVENESS PASS','READINESS PASS',
    'Illustrative shallow probes · Database not checked',
    'USER LOOKUP WAITING','LOGIN JOURNEY','NOT COMPLETED',
    'SATURATED · RUNNING','STILL COMPLETING'])
    assert.ok(scene.includes(word),'missing '+word);
  assert.doesNotMatch(scene,/DATABASE OFFLINE|CRASHED|Try Again|Please try again/);
});

test('every teaching reveal depends on actual selected voice cues',()=>{
  for(const key of ['HEALTH_CHECKS','LIVENESS_PROBE','READINESS_PROBE',
    'REAL_LOGIN','SERVICE_AVAILABILITY','END_TO_END_CHECK',
    'SPINNER','ALIVE_NOT_AVAILABLE'])
    assert.match(scene,new RegExp('cues\\.'+key));
  assert.match(scene,/validateShot04Source\(props\)/);
  assert.match(scene,/assertShot04SafeLayout\(\)/);
  assert.match(scene,/video\.fps!==30/);
  assert.equal(contract.shot04Ease(0,8,20),0);
  assert.equal(contract.shot04Ease(29,8,20),1);
});

test('SHOT04 voice-gated Remotion candidate is registered and fail-closed',()=>{
  assert.match(rootSource,/id="EP002-SHOT04-CANDIDATE"/);
  assert.match(rootSource,/component=\{Shot04DirectorVisualV1\}/);
  assert.match(rootSource,/voiceTakeId:''/);
  assert.match(rootSource,/verifiedCues:\[\]/);
  assert.match(rootSource,/termCues:\[\]/);
});

test('Director final insight remains exactly the approved philosophical payoff',()=>{
  assert.match(scene,/Being alive is not the same as being available\./);
  assert.equal(contract.SHOT04_TERM_ORDER.at(-1),'ALIVE_NOT_AVAILABLE');
});

test('Tier++ render preflight refuses stale or fabricated SHOT04 voice',()=>{
  const sourceSha='a'.repeat(40);
  const job={compositionId:'EP002-SHOT04-CANDIDATE',
    renderId:'audit-shot04-1',width:1920,height:1080,fps:30,
    durationInFrames:props.durationInFrames,
    inputProps:{...props,expectedSourceCommit:sourceSha,
      shotKey:'EP002_SHOT04',scriptRevision:1,
      inputFingerprint:'b'.repeat(64)}};
  const valid=preflightTierPlusPlusRender(job,sourceSha);
  assert.equal(valid.status,'TECHNICAL_PRECHECK_PASS');
  assert.ok(valid.checks.includes('NINE_REAL_TECHNICAL_TERMS'));
  assert.throws(()=>preflightTierPlusPlusRender({...job,
    inputProps:{...job.inputProps,voiceTakeId:''}},sourceSha),
    /SHOT04_SELECTED_REAL_VOICE_CUE_CONTRACT/);
  assert.throws(()=>preflightTierPlusPlusRender({...job,
    inputProps:{...job.inputProps,verifiedCues:[]}},sourceSha),
    /SHOT04_SELECTED_REAL_VOICE_CUE_CONTRACT/);
  assert.throws(()=>preflightTierPlusPlusRender({...job,
    inputProps:{...job.inputProps,termCues:[...terms].reverse()}},sourceSha),
    /SHOT04_REAL_SPOKEN_TERMS_INVALID/);
  assert.throws(()=>preflightTierPlusPlusRender({...job,width:1280},sourceSha),
    /REQUIRES_1920X1080_30FPS/);
  assert.throws(()=>preflightTierPlusPlusRender(job,'c'.repeat(40)),
    /WORKER_SHA_NOT_PINNED/);
});
