import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EDITORIAL_TIMING_MODE,
  validateShot02EditorialPlan,
  buildShot02EditorialAudioFilter,
} from './shot02-editorial-audio.mjs';

const ANCHORS=[
  'before the seats are gone',
  'the number of people arriving has',
  'the platform s entry point',
  'across several Auth servers',
  'at first answers return quickly',
  'entering the system each second',
  'the Auth servers share the traffic',
  'the same User Database',
  'where the pressure starts',
];
const HOLDS=[60,48,66,81,30,81,33,90,48];
const CUTS=[90,160,300,450,510,660,745,980,1160];
const OUTPUT=1205+HOLDS.reduce((a,b)=>a+b,0);
const props=()=>({
  timingMode:EDITORIAL_TIMING_MODE,
  sourceDurationInFrames:1205,
  editorialAddedFrames:537,
  editorialSilencePlan:ANCHORS.map((afterPhrase,i)=>({
    afterPhrase,atFrame:CUTS[i],holdFrames:HOLDS[i],
  })),
  verifiedCues:Array.from({length:5},()=>({})),
  termCues:Array.from({length:7},()=>({})),
});
const job={compositionId:'EP002-SHOT02-CANDIDATE',fps:30,durationInFrames:OUTPUT};

test('exact fixed editorial plan adds 17.9 seconds and retains one 30fps output',()=>{
  const plan=validateShot02EditorialPlan(job,props());
  assert.equal(plan.sourceFrames,1205);
  assert.equal(plan.addedFrames,537);
  assert.equal(plan.outputFrames,1742);
  assert.equal(plan.outputFrames/30,58.06666666666667);
  assert.equal(plan.pauses.length,9);
});

test('ffmpeg audio uses original Take once, cuts at 1600 samples per frame and concatenates nine genuine silences',()=>{
  const plan=validateShot02EditorialPlan(job,props());
  const graph=buildShot02EditorialAudioFilter(plan);
  assert.match(graph,/\[1:a\]aresample=48000,aformat=/);
  assert.match(graph,/asplit=10/);
  assert.match(graph,/atrim=start_sample=0:end_sample=144000/);
  assert.match(graph,/atrim=end_sample=96000/);
  assert.match(graph,/concat=n=19:v=0:a=1,apad=whole_dur=/);
  assert.match(graph,/\[editorial\]$/);
  assert.equal(graph.match(/anullsrc=/g)?.length,9);
  assert.doesNotMatch(graph,/atempo|rubberband|volume=|amix|music|tts/i);
});

test('tampered word anchors, reordered pauses, changed output duration and unwanted compositions fail closed',()=>{
  const bad=props();bad.editorialSilencePlan[0].afterPhrase='mid sentence';
  assert.throws(()=>validateShot02EditorialPlan(job,bad),/NOT_APPROVED_OR_ORDERED/);
  const reordered=props();reordered.editorialSilencePlan[2].atFrame=110;
  assert.throws(()=>validateShot02EditorialPlan(job,reordered),/NOT_APPROVED_OR_ORDERED/);
  const less=props();less.editorialAddedFrames--;
  assert.throws(()=>validateShot02EditorialPlan(job,less),/DURATION_OR_CUES/);
  assert.throws(()=>validateShot02EditorialPlan({...job,durationInFrames:1205},props()),/DURATION_OR_CUES/);
  assert.equal(validateShot02EditorialPlan({...job,compositionId:'EP002-SHOT01-DRAFT'},props()),null);
  assert.equal(validateShot02EditorialPlan(job,{timingMode:'ELEVENLABS_CHARACTER_TIMESTAMPS'}),null);
});

test('audio editor never writes over existing voice source, regenerates voice or changes user narration',()=>{
  const source=buildShot02EditorialAudioFilter(validateShot02EditorialPlan(job,props()));
  assert.doesNotMatch(source,/fetch|POST|elevenlabs|voice_id|renderId|sourceTakeId/);
  assert.equal(OUTPUT-1205,537);
});
