import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

const base=path.join(path.dirname(fileURLToPath(import.meta.url)),
  'src/episodes/ep002');
const ts=(name)=>readFileSync(path.join(base,name),'utf8');
const moduleFor=async name=>await import(
  'data:text/javascript;charset=utf-8,'+
    encodeURIComponent(stripTypeScriptTypes(ts(name),{mode:'strip'})));
const pacing=await moduleFor('Shot02DirectorPacing.ts');
const layout=await moduleFor('Shot02PremiumLayout.ts');
const scene=ts('Shot02GeneratedScene.tsx');

test('real repeated Login presses have 4-9 visible distinct peaks and a final reading hold',()=>{
  let starts=0,wasPressed=false,max=0;
  for(let frame=12;frame<160;frame++){
    const press=pacing.shot02TapPulse(frame,12,160);
    assert.ok(press>=0&&press<=1,'press must remain a safe 0-1 value');
    const pressed=press>.45;
    if(pressed&&!wasPressed)starts++;
    wasPressed=pressed;
    max=Math.max(max,press);
  }
  assert.ok(starts>=4&&starts<=9,'must visibly press repeatedly, not once');
  assert.ok(max>.8,'button visibly depresses on at least one click');
  assert.equal(pacing.shot02TapPulse(11,12,160),0);
  for(let f=150;f<=175;f++)
    assert.equal(pacing.shot02TapPulse(f,12,160),0,
      'last frames must hold the result long enough to understand');
});

test('technical-term hold respects exact word onset and ends before next spoken subject',()=>{
  const cue={startFrame:70,endFrame:105};
  assert.equal(pacing.shot02TermHold(69,cue,160,300),0);
  assert.equal(pacing.shot02TermHold(70,cue,160,300),0);
  assert.ok(pacing.shot02TermHold(86,cue,160,300)>.7);
  assert.ok(pacing.shot02TermHold(117,cue,160,300)>0,
    'focused node must remain readable after phrase ends');
  assert.equal(pacing.shot02TermHold(159,cue,160,300),0);
  assert.equal(pacing.shot02TermHold(170,cue,160,300),0);
});

test('request-packet clock accelerates smoothly only after the genuine arrival-rate cue',()=>{
  const start=440;
  assert.equal(pacing.shot02FlowIntensity(start-1,start,520),0);
  assert.equal(pacing.shot02FlowIntensity(start,start,520),0);
  assert.ok(pacing.shot02FlowIntensity(480,start,520)>.8);
  const before=pacing.shot02FlowClock(start,start)-
    pacing.shot02FlowClock(start-1,start);
  const justAfter=pacing.shot02FlowClock(start+1,start)-
    pacing.shot02FlowClock(start,start);
  const late=pacing.shot02FlowClock(start+130,start)-
    pacing.shot02FlowClock(start+129,start);
  assert.ok(Math.abs(justAfter-before)<.001,'no packet teleport at cue onset');
  assert.ok(late>before*3,'flow visibly accelerates with request counter');
  for(let i=1;i<=250;i++)
    assert.ok(pacing.shot02FlowClock(start+i,start)>
      pacing.shot02FlowClock(start+i-1,start));
});

test('Director focus stays within legal camera scale and 1080p text lanes',()=>{
  let verified=0;
  const steps=Array.from({length:21},(_,i)=>i/20);
  const phases=[
    {key:'gateway',configs:steps.map(g=>[1,g,0])},
    {key:'balancer',configs:[[1,1,0]]},
    {key:'auth',configs:[[1,1,0]]},
    {key:'database',configs:steps.map(d=>[1,1,d])},
  ];
  for(const {key,configs} of phases){
    for(const [context,gateway,database] of configs){
      const baseCamera={
        x:-55*context-215*gateway-280*database,
        y:-8*gateway-12*database,
        scale:1.018-.045*context+.04*gateway+.028*database,
      };
      for(const weight of steps){
        const focus={gateway:0,balancer:0,auth:0,database:0};
        focus[key]=weight;
        const pose=pacing.shot02FocusCamera(baseCamera,focus);
        assert.ok(pose.scale>=.7&&pose.scale<=1.25,
          'focus zoom must stay below the Director maximum');
        assert.doesNotThrow(()=>layout.assertShot02TextLanes(pose),
          'Director V2 camera overlap at '+JSON.stringify({key,weight,pose}));
        verified++;
      }
    }
  }
  assert.equal(verified,(21+1+1+21)*21);
});

test('V2 is deterministic and never creates audio timings, fake voice or decorative labels',()=>{
  assert.match(scene,/shot02TapPulse\(frame,starts\[0\]\+15/);
  assert.match(scene,/shot02TapPulse\(frame,starts\[2\]/);
  assert.match(scene,/press=\{repeatedTap\}/);
  assert.match(scene,/shot02FlowIntensity\(frame,terms\[4\]\.startFrame/);
  assert.match(scene,/clock=\{flowClock\}/);
  assert.match(scene,/<SpokenRequestMarker frame=\{frame\}/);
  assert.match(scene,/<FocusedNodeInterior node="gateway"/);
  assert.match(scene,/<FocusedNodeInterior node="balancer"/);
  assert.match(scene,/<FocusedNodeInterior node="auth"/);
  assert.match(scene,/<FocusedNodeInterior node="database"/);
  assert.doesNotMatch(scene,/SemanticTermHud|NOW IN FOCUS|ILLUSTRATIVE/);
  assert.doesNotMatch(scene,/\<Audio|\/generateSpeech|setTimeout|Math\.random\(/);
});
