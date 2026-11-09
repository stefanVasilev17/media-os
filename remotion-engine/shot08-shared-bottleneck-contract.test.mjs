import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';
import {preflightTierPlusPlusRender} from './tier-plus-plus-render-quality.mjs';

const root=path.dirname(fileURLToPath(import.meta.url));
const read=p=>readFileSync(path.join(root,p),'utf8');
const src=n=>read('src/episodes/ep002/'+n);
const scene=src('Shot08DirectorVisualV1.tsx');
const clean=src('Shot07CleanArchitectureWorld.tsx');
const layout=src('Shot02PremiumLayout.ts');
const contract=src('Shot08VisualContract.ts')
  .replace(/^import\s+\{SHOT02_NODES,shot02Intersects,type Rect\}\s+from\s+'\.\/Shot02PremiumLayout';\s*/m,'');
const transpile=s=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(s,{
  compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022},
}).outputText).toString('base64');
const c=await import(transpile(layout+'\n'+contract));
const durationInFrames=2700;
const frames=[20,140,300,399,520,630,720,855,985,1119,1270,1450,1670,1970,2350];
const termCues=c.SHOT08_TERM_ORDER.map((id,i)=>({
  id,spokenAnchor:id,startFrame:frames[i],endFrame:frames[i]+20,
}));
const beats=[0,475,1020,1550,2100].map((startFrame,i)=>({
  beatNumber:i+1,spokenAnchor:'heard verified phrase '+(i+1),
  startFrame,endFrame:i===4?durationInFrames:[475,1020,1550,2100][i],
}));
const props={durationInFrames,voiceTakeId:'de409d13-5667-4161-85d9-5ae57d0d30a3',
  timingMode:'ELEVENLABS_CHARACTER_TIMESTAMPS',verifiedCues:beats,termCues};

test('SHOT08 refuses fake audio timing, incomplete beats and re-ordered scaling terms',()=>{
  assert.doesNotThrow(()=>c.validateShot08Source(props));
  assert.throws(()=>c.validateShot08Source({...props,voiceTakeId:''}),
    /SHOT08_REQUIRES_CURRENT_DIRECTOR_APPROVED_REAL_VOICE/);
  assert.throws(()=>c.validateShot08Source({...props,termCues:termCues.slice(1)}),
    /SHOT08_REQUIRES_CURRENT_DIRECTOR_APPROVED_REAL_VOICE/);
  assert.throws(()=>c.validateShot08Source({...props,termCues:[...termCues].reverse()}),
    /SHOT08_REAL_SPOKEN_TERM_ORDER_INVALID/);
  assert.throws(()=>c.validateShot08Source({...props,verifiedCues:beats.map((b,i)=>
    i===1?{...b,startFrame:b.startFrame+2}:b)}),
    /SHOT08_FIVE_DIRECTOR_BEATS_INVALID/);
});

test('SHOT08 opens in the exact same clean architecture world as SHOT07',()=>{
  const previous=src('Shot07DirectorVisualV1.tsx');
  assert.match(previous,/Shot07CleanArchitectureWorld/);
  assert.match(scene,/Shot07CleanArchitectureWorld/);
  assert.match(scene,/WHEN RETRYING CREATES MORE FAILURE/);
  assert.match(scene,/MORE SERVERS, SAME BOTTLENECK/);
  assert.match(scene,/1-shot08Ease\(frame,22,63\)/);
  assert.match(scene,/shot08Ease\(frame,cue.THREE_TO_SIX,135\)/);
  assert.match(scene,/replicaGrowth=\{replicaGrowth\}/);
  assert.doesNotThrow(()=>c.assertShot08SafeLayout());
});

test('SHOT08 uses six Auth replica cards and a single saturated DB with no flying requests',()=>{
  assert.match(clean,/SHOT02_NODES/);
  assert.match(clean,/Shot02PressurePhone/);
  assert.match(clean,/AUTH 06/);
  assert.match(clean,/User Database/);
  assert.match(clean,/replicaGrowth/);
  assert.match(clean,/POOL · UP TO 8 DB CONN/);
  assert.doesNotMatch(clean,/shot02CubicPoint|SHOT02_LOGIN_PARTICLE|strokeDasharray|NewAttemptPath/);
  assert.doesNotMatch(clean,/M1823 509 L1856|M1823 509 L/);
  assert.match(scene,/SIX AUTH INSTANCES · ONE USER DATABASE/);
  assert.match(scene,/WE SCALED AUTH · NOT THE BOTTLENECK/);
  assert.doesNotMatch(scene,/ACCOUNT LOOKUP ATTEMPTS|NEW LOGIN ARRIVALS/);
});

test('SHOT08 never starts paid rendering with invented voice/timing/source SHA',()=>{
  const rootCode=read('src/Root.tsx');
  assert.match(rootCode,/id="EP002-SHOT08-CANDIDATE"/);
  assert.match(rootCode,/component=\{Shot08DirectorVisualV1\}/);
  const sha='d'.repeat(40);
  const job={compositionId:'EP002-SHOT08-CANDIDATE',width:1920,
    height:1080,fps:30,durationInFrames,inputProps:{
      ...props,shotKey:'EP002_SHOT08',scriptRevision:1,
      inputFingerprint:'a'.repeat(64),expectedSourceCommit:sha,
  }};
  const pass=preflightTierPlusPlusRender(job,sha);
  assert.equal(pass.status,'TECHNICAL_PRECHECK_PASS');
  assert.ok(pass.checks.includes('FIFTEEN_REAL_SCALING_BOTTLENECK_TERMS'));
  assert.throws(()=>preflightTierPlusPlusRender(job,'f'.repeat(40)),
    /WORKER_SHA_NOT_PINNED/);
  assert.throws(()=>preflightTierPlusPlusRender({...job,fps:24},sha),
    /REQUIRES_1920X1080_30FPS/);
  assert.throws(()=>preflightTierPlusPlusRender({...job,inputProps:{
    ...job.inputProps,verifiedCues:[]}},sha),
    /SHOT08_SELECTED_REAL_VOICE_CUE_CONTRACT/);
});
