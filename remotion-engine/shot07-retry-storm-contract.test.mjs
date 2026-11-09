import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';
import {preflightTierPlusPlusRender} from './tier-plus-plus-render-quality.mjs';

const root=path.dirname(fileURLToPath(import.meta.url));
const src=name=>readFileSync(path.join(root,'src/episodes/ep002',name),'utf8');
const scene=src('Shot07DirectorVisualV1.tsx');
const contract=src('Shot07VisualContract.ts').replace(
  /^import\s+\{shot02Intersects,type Rect,SHOT02_NODES\}\s+from\s+'\.\/Shot02PremiumLayout';\s*/m,'');
const layout=src('Shot02PremiumLayout.ts');
const transpile=s=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(s,{
  compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022},
}).outputText).toString('base64');
const c=await import(transpile(layout+'\n'+contract));
const durationInFrames=2600;
const t=[18,110,220,333,442,600,731,835,950,1108,1210,1315,1551,1885,2380];
const termCues=c.SHOT07_TERM_ORDER.map((id,i)=>({
  id,spokenAnchor:id,startFrame:t[i],endFrame:t[i]+22,
}));
const beatStart=[0,480,980,1500,1980];
const verifiedCues=beatStart.map((n,i)=>({
  beatNumber:i+1,spokenAnchor:'reviewed beat '+(i+1),
  startFrame:n,endFrame:i===4?durationInFrames:beatStart[i+1],
}));
const props={durationInFrames,voiceTakeId:'3105980d-8a47-4a34-821e-53ae67605eb0',
  timingMode:'ELEVENLABS_CHARACTER_TIMESTAMPS',verifiedCues,termCues};

test('SHOT07 visual contract needs current real selected Take and fifteen ordered terms',()=>{
  assert.doesNotThrow(()=>c.validateShot07Source(props));
  assert.throws(()=>c.validateShot07Source({...props,voiceTakeId:''}),
    /SHOT07_REQUIRES_CURRENT_APPROVED_REAL_TIMED_VOICE/);
  assert.throws(()=>c.validateShot07Source({...props,termCues:termCues.slice(1)}),
    /SHOT07_REQUIRES_CURRENT_APPROVED_REAL_TIMED_VOICE/);
  assert.throws(()=>c.validateShot07Source({...props,termCues:[...termCues].reverse()}),
    /SHOT07_REAL_SPOKEN_TERM_ORDER_INVALID/);
  assert.throws(()=>c.validateShot07Source({...props,
    verifiedCues:verifiedCues.map((b,i)=>i===3?{...b,startFrame:b.startFrame+1}:b)}),
    /SHOT07_FIVE_DIRECTOR_BEATS_INVALID/);
});

test('SHOT07 opens with protected SHOT06 final state and transitions to original architecture map',()=>{
  assert.match(scene,/const FrozenShot06End/);
  assert.match(scene,/<FrozenShot06End frame=\{frame\} fade=\{transition\}/);
  assert.match(scene,/Shot06LockedSlot/);
  assert.match(scene,/Shot05Shot04WorldV2/);
  assert.match(scene,/shot07Ease\(frame,36,102\)/);
  assert.match(scene,/THE DEADLINE EXPIRES/);
  assert.match(scene,/Please try again\./);
  assert.doesNotMatch(scene,/IF STOPPED → RESOURCES AVAILABLE SOONER/);
  assert.doesNotThrow(()=>c.assertShot07SafeLayout());
});

test('SHOT07 visually separates same-login retry from new arrivals and does not promise cancellation',()=>{
  assert.match(scene,/SAME ACTIVE LOGIN/);
  assert.match(scene,/ATTEMPT 1/);
  assert.match(scene,/ATTEMPT 2/);
  assert.match(scene,/NEW LOGIN ARRIVALS/);
  assert.match(scene,/ACCOUNT LOOKUP ATTEMPTS/);
  assert.match(scene,/STABLE/);
  assert.match(scene,/RISING/);
  assert.match(scene,/first lookup may still run/i);
  assert.match(scene,/READ-ONLY LOOKUP RETRY ONLY · ACTIVE LOGIN/);
  assert.doesNotMatch(scene,/Retry the full Login|CANCELLATION SUCCEEDED|DATABASE OFFLINE/);
});

test('SHOT07 must use actual audio timing and 1080p30 source pinned media QA',()=>{
  const rootScene=readFileSync(path.join(root,'src/Root.tsx'),'utf8');
  assert.match(rootScene,/id="EP002-SHOT07-CANDIDATE"/);
  assert.match(rootScene,/component=\{Shot07DirectorVisualV1\}/);
  const sha='e'.repeat(40);
  const job={compositionId:'EP002-SHOT07-CANDIDATE',width:1920,height:1080,fps:30,
    durationInFrames,inputProps:{...props,shotKey:'EP002_SHOT07',
      scriptRevision:1,inputFingerprint:'a'.repeat(64),expectedSourceCommit:sha}};
  const okay=preflightTierPlusPlusRender(job,sha);
  assert.equal(okay.status,'TECHNICAL_PRECHECK_PASS');
  assert.ok(okay.checks.includes('FIFTEEN_REAL_RETRY_STORM_TERMS'));
  assert.throws(()=>preflightTierPlusPlusRender(job,'f'.repeat(40)),
    /WORKER_SHA_NOT_PINNED/);
  assert.throws(()=>preflightTierPlusPlusRender({...job, fps:24},sha),
    /REQUIRES_1920X1080_30FPS/);
  assert.throws(()=>preflightTierPlusPlusRender({...job,inputProps:{
    ...job.inputProps,voiceTakeId:''}},sha),/SHOT07_SELECTED_REAL_VOICE_CUE_CONTRACT/);
});
