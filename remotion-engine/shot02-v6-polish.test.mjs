import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'src/episodes/ep002');
const read=(name)=>readFileSync(path.join(root,name),'utf8');
const visual=read('Shot02DirectorVisualV5.tsx');
const phone=read('Shot02PressurePhone.tsx');
const canon=read('Shot01ReadablePhone.tsx');
const pressure=await import('data:text/javascript;charset=utf-8,'+
  encodeURIComponent(stripTypeScriptTypes(read('Shot02PressureVisuals.ts'),{mode:'strip'})));

test('Premium 09 : 00 has individually readable tabular digits with restrained glow',()=>{
  assert.match(visual,/aria-label="09 : 00"/);
  assert.match(visual,/fontVariantNumeric:'tabular-nums'/);
  assert.match(visual,/letterSpacing:'\.008em'/);
  assert.match(visual,/>09<\/span>/);
  assert.match(visual,/>:<\/span>/);
  assert.match(visual,/>00<\/span>/);
  assert.doesNotMatch(visual,/letterSpacing:'-\.065em'.*09:00/);
});

test('Arrival counter rises smoothly above the orange closing banner without colliding',()=>{
  assert.equal(pressure.shot02CounterLift(1400,1462),0);
  let prev=-1;
  for(let frame=1450;frame<=1500;frame++){
    const lift=pressure.shot02CounterLift(frame,1462);
    assert.ok(lift>=prev,'counter moves only upward');
    assert.ok(lift>=0&&lift<=110,'counter stays in safe lane');
    prev=lift;
  }
  assert.equal(pressure.shot02CounterLift(1500,1462),110);
  assert.match(visual,/transform:`translateY\(-\$\{counterLift\}px\) scale\(/);
  assert.match(visual,/ONE DATABASE\. THREE AUTH INSTANCES\. RISING PRESSURE/);
  assert.match(visual,/translateY\(\$\{\(1-visualHold\)\*15\}px\)/);
  assert.doesNotMatch(visual,/ONE DATABASE\. THREE AUTH REPLICAS\. RISING PRESSURE/);
});

test('Green request dots start on the first true login press and flow continuously',()=>{
  const firstTap=125;
  assert.equal(pressure.shot02RequestStreamActivation(firstTap-1,firstTap),0);
  assert.equal(pressure.shot02RequestStreamActivation(firstTap,firstTap),0);
  assert.ok(pressure.shot02RequestStreamActivation(firstTap+5,firstTap)>0);
  assert.equal(pressure.shot02RequestStreamActivation(firstTap+9,firstTap),1);
  assert.equal(pressure.shot02RequestStreamActivation(firstTap+120,firstTap),1);
  assert.match(visual,/const firstTapFrame=start\[0\]\+15/);
  assert.match(visual,/shot02FlowClock\(frame,firstTapFrame\)/);
  assert.match(visual,/Math\.max\(\.72\*firstTapActive,/);
  assert.match(visual,/firstTapFrame=\{firstTapFrame\} firstTapActive=\{firstTapActive\}/);
  assert.match(visual,/fill="#73FFD0"/);
  assert.match(visual,/fill="#77FFD4"/);
  assert.match(visual,/frame>=firstTapFrame&&<g>/);
});

test('Login button repeats meaningful press-bounce-ring-shine while color ramp progresses',()=>{
  const start=100;
  assert.equal(pressure.shot02PressCycle(99,start).active,0);
  let maxCompression=0,maxRebound=0,maxRipple=0,maxShine=0;
  for(let frame=100;frame<300;frame++){
    const m=pressure.shot02PressCycle(frame,start);
    assert.equal(m.active,1);
    maxCompression=Math.max(maxCompression,m.compression);
    maxRebound=Math.max(maxRebound,m.rebound);
    maxRipple=Math.max(maxRipple,m.ripple);
    maxShine=Math.max(maxShine,m.shine);
    if(frame<260){
      assert.deepEqual(m,pressure.shot02PressCycle(frame+40,start));
    }
  }
  assert.ok(maxCompression>.95&&maxRebound>.95);
  assert.ok(maxRipple>.95&&maxShine>.9);
  assert.match(phone,/const motion=shot02PressCycle\(frame,pressStartFrame\)/);
  assert.match(phone,/translateY\(\$\{impact\*7-bounce\*2\}px\)/);
  assert.match(phone,/scale\(\$\{1-impact\*\.052\+bounce\*\.022\}\)/);
  assert.match(phone,/motion\.shine\*560/);
  assert.match(phone,/motion\.ripple/);
  assert.match(phone,/shot02ButtonColors\(pressure\)/);
  assert.match(visual,/pressStartFrame=\{firstTapFrame\}/);
  assert.match(canon,/export const Shot01ReadablePhone/);
  assert.doesNotMatch(canon,/shot02PressCycle/);
});

test('V6 does not change audio source, the +60 tail, or Director video verification gates',()=>{
  assert.match(visual,/const spokenFrames=total-hold/);
  assert.match(visual,/requireShot02VerifiedCues\(spokenFrames/);
  assert.match(visual,/requireShot02SpokenTerms\(spokenFrames/);
  assert.match(visual,/SHOT02_HOLD_MUST_BE_EXACTLY_60_FRAMES/);
  assert.match(visual,/ONE DATABASE\. THREE AUTH INSTANCES\. RISING PRESSURE/);
  assert.doesNotMatch(visual,/fetch\(|generateSpeech|Math\.random\(|setTimeout/);
});
