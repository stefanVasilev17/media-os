import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {planEp002V3SeamMaster,rgbMeanAbsoluteDifference,
  renderEp002DirectorContinuityMaster,
  EP002_V3_PROFILES,EP002_V3_MODE,EP002_V3_TRANSITION} from './ep002-director-continuity-master.mjs';

test('all ten transitions are individually named, ordered and full two-second visual bridges',()=>{
  const frames=[1172,1522,1796,2010,2024,2371,2674,2314,3063,2360,1572];
  const result=planEp002V3SeamMaster(frames);
  assert.equal(result.sourceFrames,frames.reduce((a,b)=>a+b,0));
  assert.equal(result.addedFrames,600);
  assert.equal(result.outputFrames,result.sourceFrames+600);
  assert.equal(result.seamCount,10);
  assert.equal(result.sourceFramesRetimed,0);
  assert.equal(result.sourceFramesDropped,0);
  assert.equal(result.spokenNarrationFramesMoved,0);
  assert.equal(EP002_V3_PROFILES.length,10);
  for(let i=0;i<10;i++){
    assert.equal(EP002_V3_PROFILES[i].from,'SHOT'+String(i+1).padStart(2,'0'));
    assert.equal(EP002_V3_PROFILES[i].to,'SHOT'+String(i+2).padStart(2,'0'));
    assert.ok(EP002_V3_PROFILES[i].zoom>0&&EP002_V3_PROFILES[i].zoom<.02);
  }
  assert.equal(EP002_V3_MODE,'DIRECTOR_V3_EXACT_FRAME_MATCHED_SEAMS');
  assert.equal(EP002_V3_TRANSITION,'TEN_ANCHORED_MOVING_CAMERA_BRIDGES');
});
test('no duplicate, partial or malformed source lengths can authorize a master',()=>{
  for(const frames of [[],Array(10).fill(500),Array(12).fill(500),
    Array(11).fill(90),Array(11).fill(12.5),Array(11).fill(NaN)]){
    assert.throws(()=>planEp002V3SeamMaster(frames),
      /EP002_V3_CONTINUITY_BLOCKED/);
  }
});
test('the QA computes real decoded RGB pixel jump, not a frame-count estimate',()=>{
  assert.equal(rgbMeanAbsoluteDifference(Buffer.from([20,40,100]),Buffer.from([20,40,100])),0);
  assert.equal(rgbMeanAbsoluteDifference(Buffer.from([0,0,0]),Buffer.from([30,30,30])),30);
  assert.throws(()=>rgbMeanAbsoluteDifference(Buffer.from([1]),Buffer.from([1,1])),
    /EP002_V3_CONTINUITY_BLOCKED/);
});
test('paid render and source-provenance guards fail closed before ffmpeg',async()=>{
  await assert.rejects(()=>renderEp002DirectorContinuityMaster({
    inputs:[],outputFile:'/tmp/never-create-ep002-v3.mp4',
    confirmDirectorPaidRender:false,
  }),/Director must explicitly approve/);
  await assert.rejects(()=>renderEp002DirectorContinuityMaster({
    inputs:[],outputFile:'/tmp/never-create-ep002-v3.mp4',
    confirmDirectorPaidRender:true,
  }),/Exact eleven approved/);
});
test('the bridge uses original full-speed source frames once and matches both exact endpoints',()=>{
  const source=readFileSync(new URL('./ep002-director-continuity-master.mjs',import.meta.url),'utf8');
  assert.match(source,/sourceFramesRetimed:0,sourceFramesDropped:0/);
  assert.match(source,/trim=end_frame/);
  assert.match(source,/zoompan=/);
  assert.match(source,/blend=all_expr=/);
  assert.match(source,/min\(1,N\/59\)/);
  assert.match(source,/rgbMeanAbsoluteDifference\(prev,before\)/);
  assert.match(source,/rgbMeanAbsoluteDifference\(next,after\)/);
  assert.match(source,/leftError>9\|\|rightError>9/);
  assert.match(source,/'-c:v','copy'/);
  assert.match(source,/'-c:a','aac'/);
  assert.doesNotMatch(source,/setpts=2\*\(PTS-STARTPTS\)/);
  assert.doesNotMatch(source,/tpad=stop_mode=clone/);
});
