import test from 'node:test';
import assert from 'node:assert/strict';
import {
  planEp002V4CleanCutMaster,renderEp002V4CleanCutMaster,
  EP002_V4_MODE,EP002_V4_TRANSITION,EP002_V4_SHOT10,
} from './ep002-director-clean-cut-master.mjs';

const frames=[1172,2100,2200,1800,2000,1900,2674,2314,3063,2360,1572];
frames[5]+=23446-frames.reduce((a,b)=>a+b,0);

test('V4 exact 11-source plan has no added visual or audio frames',()=>{
  const plan=planEp002V4CleanCutMaster(frames);
  assert.equal(EP002_V4_MODE,'DIRECTOR_V4_CLEAN_CUT_NO_BRIDGE');
  assert.equal(EP002_V4_TRANSITION,'ZERO_ADDED_FRAMES_DIRECT_CUT');
  assert.equal(EP002_V4_SHOT10,'96e427d2-b518-47c0-a287-59ea42cfab52');
  assert.equal(plan.frames,23446);
  assert.equal(plan.durationSeconds,23446/30);
  assert.equal(plan.addedFrames,0);
  assert.equal(plan.audioFramesInserted,0);
  assert.equal(plan.sourceFramesDropped,0);
  assert.equal(plan.sourceFramesRetimed,0);
  assert.equal(plan.seamCount,10);
  assert.equal(plan.seams[0].frame,frames[0]);
  assert.equal(plan.seams.at(-1).frame,23446-frames[10]);
  assert.ok(plan.seams.every(s=>s.addedFrames===0&&s.transition==='DIRECT_HARD_CUT'));
});
test('V4 blocks missing, extra, changed, or invalid source frames',()=>{
  assert.throws(()=>planEp002V4CleanCutMaster(frames.slice(0,10)));
  assert.throws(()=>planEp002V4CleanCutMaster([...frames,200]));
  assert.throws(()=>planEp002V4CleanCutMaster(frames.map((n,i)=>i===3?n+1:n)));
  assert.throws(()=>planEp002V4CleanCutMaster(frames.map((n,i)=>i===0?0:n)));
});
test('V4 refuses rendering without separate Director paid CPU confirmation',async()=>{
  await assert.rejects(renderEp002V4CleanCutMaster({
    inputs:[],outputFile:'/tmp/ep002-v4-unapproved.mp4',
  }),/Director approval required/);
});
