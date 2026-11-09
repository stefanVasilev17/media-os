import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';
import {preflightTierPlusPlusRender} from './tier-plus-plus-render-quality.mjs';

const root=path.dirname(fileURLToPath(import.meta.url));
const source=path.join(root,'src/episodes/ep002');
const read=name=>readFileSync(path.join(source,name),'utf8');
const layout=read('Shot02PremiumLayout.ts');
const scene=read('Shot06DirectorVisualV1.tsx');
const snapshot=read('Shot06Shot05LockedEnd.tsx');
const approved=read('Shot05DirectorVisualV1.tsx');
const rootScene=readFileSync(path.join(root,'src/Root.tsx'),'utf8');
const contractSrc=read('Shot06VisualContract.ts').replace(
  /^import\s+\{SHOT02_NODES,shot02Intersects,type Rect\}\s+from\s+'\.\/Shot02PremiumLayout';\s*/m,'');
const transpile=s=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(s,{
  compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022},
}).outputText).toString('base64');
const spec=await import(transpile(layout+'\n'+contractSrc));
const times=[18,170,255,361,520,610,695,800,980,1090,1210,1420,1600,1730,1880];
const termCues=spec.SHOT06_TERM_ORDER.map((id,i)=>({
  id,spokenAnchor:'spoken '+id,startFrame:times[i],endFrame:times[i]+17,
}));
const starts=[0,475,940,1490,1900];
const verifiedCues=starts.map((startFrame,i)=>({
  beatNumber:i+1,spokenAnchor:'reviewed voice '+i,
  startFrame,endFrame:i===4?2250:starts[i+1],
}));
const props={durationInFrames:2250,
  voiceTakeId:'d5397997-bb26-464c-9032-2808e706cdf2',
  timingMode:'ELEVENLABS_CHARACTER_TIMESTAMPS',
  verifiedCues,termCues};
const cue=Object.fromEntries(termCues.map(c=>[c.id,c.startFrame]));

test('SHOT06 requires exact approved Take and five human voice beats plus fifteen real terms',()=>{
  assert.doesNotThrow(()=>spec.validateShot06Source(props));
  assert.throws(()=>spec.validateShot06Source({...props,voiceTakeId:''}),
    /SHOT06_REQUIRES_DIRECTOR_APPROVED_REAL_TIMED_VOICE/);
  assert.throws(()=>spec.validateShot06Source({...props,termCues:termCues.slice(1)}),
    /SHOT06_REQUIRES_DIRECTOR_APPROVED_REAL_TIMED_VOICE/);
  assert.throws(()=>spec.validateShot06Source({...props,termCues:[...termCues].reverse()}),
    /SHOT06_FIFTEEN_ACTUAL_SPOKEN_TERMS_INVALID/);
  assert.throws(()=>spec.validateShot06Source({...props,
    verifiedCues:verifiedCues.map((b,i)=>i===1?{...b,startFrame:b.startFrame+1}:b)}),
    /SHOT06_FIVE_REAL_DIRECTOR_BEATS_INVALID/);
});

test('SHOT06 reuses exact immutable SHOT05 final components, camera and original 80px shifted Phone',()=>{
  const prefix=approved.slice(0,approved.indexOf('export const Shot05DirectorVisualV1:'));
  assert.ok(snapshot.startsWith(prefix),
    'SHOT06 must preserve the exact approved SHOT05 slot/queue/health visual definitions');
  assert.match(snapshot,/const endFrame=2779/);
  assert.match(snapshot,/SH\-?OT05_FINAL_VISUAL_MARKERS/);
  assert.match(snapshot,/translate3d\(1320px,590px,0\) scale\(\.35\)/);
  assert.match(snapshot,/<Shot02PressurePhone/);
  assert.match(snapshot,/<Connections frame=\{endFrame\}/);
  assert.match(scene,/<Shot06Shot05LockedEnd frame=\{frame\} fade=\{reveal\}/);
  assert.match(scene,/shot06Ease\(frame,18,82\)/);
  assert.match(scene,/shot06Ease\(frame,40,112\)/);
  assert.doesNotMatch(scene,/Math\.random\(|setTimeout\(|fetch\(|<Audio/);
  assert.doesNotThrow(()=>spec.assertShot06SafeLayout());
});

test('Request A times out without starting DB lookup and first Phone error is in SHOT06',()=>{
  assert.equal(spec.shot06DeadlineRemaining(cue.REQUEST_DEADLINE-1,cue),1);
  assert.ok(spec.shot06DeadlineRemaining(cue.TIME_RUNS_OUT-35,cue)>.01);
  assert.equal(spec.shot06DeadlineRemaining(cue.TIME_RUNS_OUT,cue),0);
  assert.equal(spec.shot06CallerTimedOut(cue.TIME_RUNS_OUT-1,cue),false);
  assert.equal(spec.shot06CallerTimedOut(cue.TIME_RUNS_OUT,cue),true);
  assert.match(scene,/DB LOOKUP NOT STARTED/);
  assert.match(scene,/NO DB LOOKUP STARTED/);
  assert.match(scene,/REQUEST A · TIMED OUT/);
  assert.match(scene,/Please try again\./);
  assert.match(scene,/waiting=\{1-error\} spinner=\{1-error\}/);
  assert.doesNotMatch(approved,/Please try again/);
});

test('Request B can stay in flight after caller timeout; cancellation never guaranteed',()=>{
  assert.equal(spec.shot06LookupBMayStillRun(cue.LOOKUP_RUNNING-1,cue),false);
  assert.equal(spec.shot06LookupBMayStillRun(cue.LOOKUP_RUNNING,cue),true);
  assert.equal(spec.shot06CancellationIsConditional(cue.STOP_IF_POSSIBLE-1,cue),false);
  assert.equal(spec.shot06CancellationIsConditional(cue.STOP_IF_POSSIBLE,cue),true);
  assert.match(scene,/REQUEST B · DB LOOKUP MAY STILL RUN/);
  assert.match(scene,/IF CANCELLATION HONORED → SLOT FREED SOONER/);
  assert.match(scene,/OTHERWISE → LOOKUP MAY CONTINUE/);
  assert.match(scene,/IF STOPPED → RESOURCES AVAILABLE SOONER/);
  assert.doesNotMatch(scene,/DATABASE OFFLINE|CANCELLATION SUCCEEDED|HTTP 504/);
  assert.doesNotThrow(()=>spec.assertShot06SafeLayout());
});

test('SHOT06 requires 1080p30 real audio preflight, valid identity and immutable source',()=>{
  assert.match(rootScene,/id="EP002-SHOT06-CANDIDATE"/);
  assert.match(rootScene,/component=\{Shot06DirectorVisualV1\}/);
  const sha='a'.repeat(40);
  const job={compositionId:'EP002-SHOT06-CANDIDATE',renderId:'shot06-qa',
    width:1920,height:1080,fps:30,durationInFrames:props.durationInFrames,
    inputProps:{...props,shotKey:'EP002_SHOT06',
      scriptRevision:1,inputFingerprint:'b'.repeat(64),
      expectedSourceCommit:sha}};
  const pass=preflightTierPlusPlusRender(job,sha);
  assert.equal(pass.status,'TECHNICAL_PRECHECK_PASS');
  assert.ok(pass.checks.includes('FIFTEEN_REAL_DEADLINE_CANCELLATION_TERMS'));
  assert.throws(()=>preflightTierPlusPlusRender(job,'c'.repeat(40)),
    /WORKER_SHA_NOT_PINNED/);
  assert.throws(()=>preflightTierPlusPlusRender({...job,fps:24},sha),
    /REQUIRES_1920X1080_30FPS/);
  assert.throws(()=>preflightTierPlusPlusRender({...job,inputProps:{
    ...job.inputProps,voiceTakeId:''}},sha),
    /SHOT06_SELECTED_REAL_VOICE_CUE_CONTRACT/);
});
