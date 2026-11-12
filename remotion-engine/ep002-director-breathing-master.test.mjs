import test from 'node:test';
import assert from 'node:assert/strict';
import {planEp002DirectorBreaths,renderEp002DirectorBreathMaster,
  EP002_BREATH_FRAMES,EP002_BREATH_SHOTS} from './ep002-director-breathing-master.mjs';

const originals=[1172,1522,1796,2010,2024,2371,2674,2314,3063,2360,1572];

test('Eleven unchanged original MP4 tracks produce ten real 2-second breath boundaries',()=>{
  const plan=planEp002DirectorBreaths(originals);
  assert.equal(plan.boundaryCount,10);
  assert.equal(EP002_BREATH_SHOTS,11);
  assert.equal(EP002_BREATH_FRAMES,60);
  assert.equal(plan.sourceFrames,originals.reduce((a,b)=>a+b,0));
  assert.equal(plan.addedFrames,600);
  assert.equal(plan.outputFrames,plan.sourceFrames+600);
  assert.equal(plan.outputSeconds,plan.outputFrames/30);
  assert.match(plan.audioPolicy,/ORIGINAL_APPROVED_VOICE/);
  assert.match(plan.visualPolicy,/LOW_MEMORY/);
});

test('Every seam visibly moves while narrator rests, but there is no added pause after SHOT11',()=>{
  const frames=Array(11).fill(150);
  const filter=planEp002DirectorBreaths(frames).filterComplex;
  assert.equal((filter.match(/minterpolate=/g)||[]).length,0);
  assert.equal((filter.match(/,fps=30,/g)||[]).length,10);
  assert.equal((filter.match(/,apad,/g)||[]).length,11);
  assert.equal((filter.match(/trim=end_frame=120/g)||[]).length,10);
  assert.match(filter,/\[10:v\]trim=end_frame=150,setpts=PTS-STARTPTS\[v10\]/);
  assert.match(filter,/concat=n=11:v=1:a=1\[vout\]\[aout\]/);
  assert.doesNotMatch(filter,/aloop|amix|atempo|adelay|rubberband|silencedetect/);
});

test('Fail closed on missing or invalid source duration',()=>{
  for(const invalid of [[],[300],Array(12).fill(300),Array(11).fill(90),
    Array(11).fill(180.5),Array(11).fill(null)]){
    assert.throws(()=>planEp002DirectorBreaths(invalid),
      /EP002_DIRECTOR_BREATH_MASTER_BLOCKED/);
  }
});

test('Never render or charge CPU without fresh explicit Director confirmation',async()=>{
  await assert.rejects(()=>renderEp002DirectorBreathMaster({
    inputs:[],outputFile:'/tmp/ep002-unauthorized.mp4',
    confirmDirectorPaidRender:false,
  }),/new explicitly approved CPU render/);
});
