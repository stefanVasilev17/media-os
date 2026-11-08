import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {
  AT_TIER_PLUS_PLUS_STANDARD_ID,isTierPlusPlusShot,
  preflightTierPlusPlusRender,verifyTierPlusPlusMedia,tierPlusPlusReceipt,
} from './tier-plus-plus-render-quality.mjs';

const sha='a'.repeat(40);
const cues=[
  {beatNumber:1,spokenAnchor:'Log in',startFrame:0,endFrame:120},
  {beatNumber:2,spokenAnchor:'API Gateway',startFrame:120,endFrame:250},
  {beatNumber:3,spokenAnchor:'Load Balancer',startFrame:250,endFrame:410},
  {beatNumber:4,spokenAnchor:'arrival rate',startFrame:410,endFrame:700},
  {beatNumber:5,spokenAnchor:'User Database',startFrame:700,endFrame:1462},
];
const ids=['LOGIN_REQUEST','API_GATEWAY','LOAD_BALANCER','AUTH_SERVERS',
  'ARRIVAL_RATE','AUTH_SERVERS_REPRISE','USER_DATABASE'];
const terms=ids.map((id,i)=>({id,spokenAnchor:id,
  startFrame:20+i*160,endFrame:30+i*160}));

const shot=()=>({
  renderId:'00000000-0000-4000-8000-000000000001',
  compositionId:'EP002-SHOT02-CANDIDATE',
  fps:30,width:1920,height:1080,durationInFrames:1522,
  inputProps:{
    expectedSourceCommit:sha,
    durationInFrames:1522,
    sourceDurationInFrames:1462,
    postVoiceHoldFrames:60,
    voiceTakeId:'00000000-0000-4000-8000-000000000002',
    timingMode:'ELEVENLABS_CHARACTER_TIMESTAMPS',
    verifiedCues:cues.map(x=>({...x})),
    termCues:terms.map(x=>({...x})),
  },
});
const engineRoot=path.dirname(fileURLToPath(import.meta.url));
const worker=readFileSync(path.join(engineRoot,'cpu-worker.mjs'),'utf8');

test('every current and future architecture shot is recognized, never locked EP001',()=>{
  assert.equal(isTierPlusPlusShot('EP002-SHOT02-CANDIDATE'),true);
  assert.equal(isTierPlusPlusShot('AT-FACTORY-SHOT'),true);
  assert.equal(isTierPlusPlusShot('EP003-SHOT01-CANDIDATE'),true);
  assert.equal(isTierPlusPlusShot('EP999-SHOT88'),true);
  assert.equal(isTierPlusPlusShot('EP002-SHOT01-DRAFT'),false);
  assert.equal(isTierPlusPlusShot('EP001-Shot10-SessionCreationShortV6'),false);
});

test('approved SHOT02 has exact Tier++ worker provenance, 5 beats, 7 terms and 60-frame ending',()=>{
  const result=preflightTierPlusPlusRender(shot(),sha);
  assert.equal(result.standardId,AT_TIER_PLUS_PLUS_STANDARD_ID);
  assert.equal(result.durationInFrames,1522);
  assert.equal(result.visualStatus,'VISUAL_DIRECTOR_REVIEW_REQUIRED');
  assert.ok(result.checks.includes('FIVE_VERIFIED_BEATS'));
  assert.ok(result.checks.includes('SEVEN_REAL_TERM_CUES'));
  assert.ok(result.checks.includes('EXACTLY_60_POST_VOICE_FRAMES'));
  assert.match(tierPlusPlusReceipt('AT_TIER_PLUS_PLUS_RENDER_START',result),
    /TECHNICAL_PRECHECK_PASS/);
});

test('reject wrong worker SHA, unapproved TTS timing, wrong geometry and frame count before rendering',()=>{
  const cases=[
    x=>{x.inputProps.expectedSourceCommit='b'.repeat(40);},
    x=>{x.width=1080;},
    x=>{x.fps=29;},
    x=>{x.durationInFrames=1523;},
    x=>{x.inputProps.postVoiceHoldFrames=0;},
    x=>{x.inputProps.voiceTakeId='';},
    x=>{x.inputProps.timingMode='MADE_UP';},
    x=>{x.inputProps.verifiedCues.pop();},
    x=>{x.inputProps.verifiedCues[1].startFrame=123;},
    x=>{x.inputProps.verifiedCues[4].endFrame=1450;},
    x=>{x.inputProps.termCues.pop();},
    x=>{x.inputProps.termCues[0].startFrame=-5;},
    x=>{x.inputProps.termCues[3].id='SERVER_FOO';},
  ];
  for(const mutate of cases){
    const job=shot();mutate(job);
    assert.throws(()=>preflightTierPlusPlusRender(job,sha),
      /AT_TIER_PLUS_PLUS_PRECHECK_FAILED_/);
  }
});

test('future Factory SHOTs must carry pinned source identity and full-HD/30fps metadata',()=>{
  const factory=shot();
  factory.compositionId='AT-FACTORY-SHOT';
  delete factory.inputProps.verifiedCues;
  delete factory.inputProps.termCues;
  assert.equal(preflightTierPlusPlusRender(factory,sha).status,'TECHNICAL_PRECHECK_PASS');
  factory.inputProps.expectedSourceCommit='invalid';
  assert.throws(()=>preflightTierPlusPlusRender(factory,sha),/WORKER_SHA_NOT_PINNED/);
});

test('real output H264/AAC 30fps independently probed; incomplete/mismatched files rejected',()=>{
  const job=shot(),actual={width:1920,height:1080,duration:50.734};
  const receipt=verifyTierPlusPlusMedia(job,actual);
  assert.equal(receipt.status,'ACTUAL_MP4_TECHNICAL_QA_PASS');
  assert.equal(receipt.visualStatus,'VISUAL_DIRECTOR_REVIEW_REQUIRED');
  for(const bad of [
    {width:1919,height:1080,duration:50.734},
    {width:1920,height:1080,duration:48.5},
    {width:1920,height:1080,duration:NaN},
    null,
  ])assert.throws(()=>verifyTierPlusPlusMedia(job,bad),
    /AT_TIER_PLUS_PLUS_MP4_MEDIA_MISMATCH/);
});

test('actual CPU Worker integrates gate before renderer and ffprobe after voice mux',()=>{
  const begin=worker.indexOf('const tierPlusPlusPreflight=preflightTierPlusPlusRender');
  const engine=worker.indexOf('await renderMedia({');
  const mux=worker.indexOf('await muxEp002SelectedVoice(job, outputPath, inputProps)');
  const verify=worker.indexOf('const mediaReceipt=verifyTierPlusPlusMedia');
  const complete=worker.indexOf('const sizeBytes = await complete(job.renderId, outputPath)',verify);
  assert.ok(begin>0&&begin<engine);
  assert.ok(engine<mux&&mux<verify&&verify<complete);
  assert.match(worker,/AT_TIER_PLUS_PLUS_RENDER_START/);
  assert.match(worker,/AT_TIER_PLUS_PLUS_MP4_QA/);
  assert.match(worker,/AT_TIER_PLUS_PLUS_DIRECTOR_REVIEW_PENDING/);
  assert.match(worker,/const probed=await probeFactoryMedia\(outputPath\)/);
});

test('existing protected scenes are exempt, but do not get fake Tier++ receipts',()=>{
  const old=shot();old.compositionId='EP002-SHOT01-DRAFT';
  assert.equal(preflightTierPlusPlusRender(old,sha),null);
  assert.equal(verifyTierPlusPlusMedia(old,{width:1,height:1,duration:0}),null);
});
