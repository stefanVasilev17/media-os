import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {shot10TextWidth} from './shot10-content-fit-layout.mjs';
import {ep003CardIsReadable,ep003CardOpacity,
  ep003MinReadableCardFrames} from './ep003-readable-card-policy.mjs';

const scene=fs.readFileSync(new URL(
  './src/episodes/ep003/Shot02DirectorReviewV1.tsx',import.meta.url),'utf8');
const runner=fs.readFileSync(new URL(
  './ep003-shot02-render-once.mjs',import.meta.url),'utf8');
const pkg=JSON.parse(fs.readFileSync(new URL(
  '../backend/src/main/resources/ep003-director-locked-voice-package-v1.json',
  import.meta.url),'utf8'));
const cards=[
  ['ONE ARCHITECTURE','THREE AUTH SERVERS. ONE USER DATABASE.'],
  ['INCOMING DEMAND','900 NEW LOGIN REQUESTS / SECOND'],
  ['MEASURED DATABASE CAPACITY','ABOUT 500 ACCOUNT LOOKUPS / SECOND'],
  ['WHEN DEMAND EXCEEDS CAPACITY','MORE WAITING. LONGER QUEUES.'],
  ['TWO DIFFERENT MEASUREMENTS','HOW MUCH FINISHES VS HOW LONG IT TAKES'],
  ['THE REAL BOTTLENECK','ALL THREE AUTH SERVERS SHARE THE LIMIT'],
  ['MORE AUTH SERVERS?','MORE SERVERS. SAME DATABASE.'],
  ['ADMISSION CONTROL','450 LOOKUPS / SECOND PROTECTS THE DATABASE'],
  ['THE ARCHITECTURAL QUESTION','WHICH DATABASE WORK NEEDS MORE CAPACITY?'],
];
const rectangles={
  gateway:{left:650-129,top:410,width:258,height:250},
  balancer:{left:927-123,top:410,width:246,height:250},
  auth:{left:1326-175,top:315,width:350,height:348},
  database:{left:1697-126,top:368,width:252,height:280},
  phone:{left:55,top:160,width:445,height:800},
};
const overlaps=(a,b,margin=0)=>a.left<b.left+b.width+margin
  &&a.left+a.width+margin>b.left&&a.top<b.top+b.height+margin
  &&a.top+a.height+margin>b.top;

test('EP003 SHOT02 must narrate exact Director-locked v0.4 script without TTS re-generation',()=>{
  assert.equal(pkg.episode.episodeKey,'EP003');
  const shot=pkg.shots.find(x=>x.shotKey==='SHOT02');
  assert.ok(shot.narration.startsWith("Let's look at our architecture again."));
  assert.ok(shot.narration.includes('nine hundred new Login requests'));
  assert.ok(shot.narration.includes('five hundred account lookups per second'));
  assert.ok(shot.narration.includes('four hundred and fifty lookups per second'));
  assert.equal(pkg.sourceApproval.script,'DIRECTOR_APPROVED');
  assert.match(runner,/EP003_SHOT02_NO_DIRECTOR_APPROVED_TAKE__BLOCK_RENDER/);
  assert.match(runner,/SELECTED_AUDIO_NOT_VERIFIED_SLOW_NATURAL__NO_AUDIO_REGEN/);
  assert.match(runner,/REAL_ELEVENLABS_ALIGNMENT_MISSING__DO_NOT_USE_GUESSED_CUES_OR_REGENERATE/);
  assert.doesNotMatch(runner,/elevenlabs\.generate|textToSpeech|triggerActions/);
});

test('P0 actual V2 rendered predecessor is mandatory, including MP4 checksum and actual last frame 2513',()=>{
  assert.match(scene,/b6fd7f30-7c78-414b-a88c-387c0ee8c43a/);
  assert.match(scene,/da6d3cbc77dc3a0dc5374aec4a7ba8beb97739d4c5facffdf36d1585e7587c08/);
  assert.match(scene,/realLastFrame:2513/);
  assert.match(scene,/worldLastFrame:11978\+2513/);
  assert.match(scene,/props\.worldStartFrame\+frame/);
  assert.match(runner,/const EXPECTED_FRAMES=2514/);
  assert.match(runner,/LOCKED_PREVIOUS_SHA/);
  assert.match(runner,/hash\(previous\.video_data\)===LOCKED_PREVIOUS_SHA/);
  assert.match(runner,/previous\.render_key==='EP003_SHOT01_V2'/);
  assert.match(runner,/select=eq\(n/);
  assert.ok(runner.includes('2513'));
  assert.match(runner,/worldStartFrame:14491/);
  assert.match(runner,/EP003_SHOT02_FIRST_RENDERED_FRAME_NOT_CONTINUOUS_WITH_REAL_EP002_LAST_FRAME|EP003_SHOT02_FIRST_RENDERED_FRAME_NOT_CONTINUOUS_WITH_REAL_EP003_SHOT01_V2_LAST_FRAME/);
  assert.match(scene,/previousLastFrameDataUri/);
});

test('same real Living Architecture World and drawn request paths, no invented dots or redesign',()=>{
  assert.match(scene,/Shot07CleanArchitectureWorld/);
  assert.match(scene,/frame=\{worldFrame\}/);
  assert.match(scene,/replicaGrowth=\{0\}/);
  assert.match(scene,/showPhone=\{1\}/);
  assert.match(scene,/flowRetryLevel=\{\.08\}/);
  assert.match(scene,/flowJitterLevel=\{\.76\}/);
  assert.match(scene,/translate3d\(-7px,0,0\) scale\(1\.007\)/);
  assert.doesNotMatch(scene,/RejectionParticle|<circle|position:\s*'absolute'.*packet|new RequestParticle/);
  assert.match(scene,/THE SYSTEM IS STABLE\. BUT LOGIN CAN STILL FAIL\./);
});

test('all nine EP003 SHOT02 caption panel rectangles fit, use legible type and avoid active nodes',()=>{
  const left=560,top=742,pad=34;
  for(const [eyebrow,line] of cards){
    const width=Math.ceil(Math.max(shot10TextWidth(eyebrow,23),
      shot10TextWidth(line,29))+pad*2+12);
    assert.ok(width>=320&&width<=950,eyebrow+' width '+width);
    const rect={left,top,width,height:131};
    assert.ok(left+width<=1794);
    assert.ok(top+131<=1020);
    for(const [name,layout] of Object.entries(rectangles))
      assert.equal(overlaps(rect,layout,20),false,eyebrow+' collides '+name);
  }
  assert.match(scene,/fontSize:23/);
  assert.match(scene,/fontSize:29/);
  assert.match(scene,/const i=EP003_SHOT02_CARDS\.reduce/);
});

test('ALL new SHOT02 labels remain fully opaque through the middle or are entirely OMITTED',()=>{
  for(const [eyebrow,line] of cards){
    const start=120,end=420;
    const minimum=ep003MinReadableCardFrames(eyebrow,line,30);
    assert.ok(minimum>=165,eyebrow);
    assert.equal(ep003CardIsReadable(eyebrow,line,start,end,30),true);
    assert.equal(ep003CardOpacity(start+18,start,end),1,eyebrow);
    assert.equal(ep003CardOpacity((start+end)/2,start,end),1,eyebrow);
    assert.equal(ep003CardOpacity(end-20,start,end),1,eyebrow);
    assert.equal(ep003CardOpacity(start,start,end),0,eyebrow);
    assert.equal(ep003CardOpacity(end,start,end),0,eyebrow);
    assert.equal(ep003CardIsReadable(eyebrow,line,start,start+65,30),false,
      eyebrow+' MUST omit unreadable text');
  }
  assert.match(scene,/if\(!ep003CardIsReadable\(card\.eyebrow,card\.line,from,to,30\)\)return null/);
  assert.match(scene,/ep003CardOpacity\(frame,from,to\)/);
});

test('P0 gates paid isolated render and saves separate SHOT02 output, preserving SHOT01 V2',()=>{
  assert.match(runner,/EP003_DIRECTOR_SHOT02_RENDER_APPROVED/);
  assert.match(runner,/RENDER_NOT_AUTHORIZED_BY_DIRECTOR_ENV_GATE/);
  assert.match(runner,/EP003_SHOT02_DIRECTOR_V1_LOCKED_V2/);
  assert.match(runner,/EP003_SHOT02_V1/);
  assert.match(runner,/EP003_SHOT02_REAL_MP4_SAVED/);
  assert.match(runner,/EP003_SHOT02_P0_ACTUAL_PIXEL_QA/);
  assert.match(runner,/EP003_SHOT02_EXISTING_RENDER/);
  assert.doesNotMatch(runner,/update\s+episode_package_voice_take/i);
  assert.doesNotMatch(runner,/update\s+episode_package_import/i);
});
