import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {shot10TextWidth} from './shot10-content-fit-layout.mjs';
import {ep003CardIsReadable,ep003CardOpacity,ep003MinReadableCardFrames}
  from './ep003-readable-card-policy.mjs';

const read=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
const v1=read('./src/episodes/ep003/Shot02DirectorReviewV1.tsx');
const v2=read('./src/episodes/ep003/Shot02TechnicalTermsV2.tsx');
const runner=read('./ep003-shot02-terms-v2-render-once.mjs');
const packageSource=JSON.parse(read('../backend/src/main/resources/ep003-director-locked-voice-package-v1.json'));
const terms=[
  ['THROUGHPUT','Work completed in a given period'],
  ['LATENCY','Time one operation takes to complete'],
  ['BOTTLENECK','The component limiting total Login capacity'],
  ['ADMISSION BUDGET','Caps DB lookups, including retry work'],
];

test('only four meaningful technical term + definition overlays, no generic or repetitive cards',()=>{
  for(const [term,definition] of terms){
    assert.ok(v2.includes("eyebrow:'"+term+"'"),term+' term omitted');
    assert.ok(v2.includes("line:'"+definition+"'"),term+' definition missing');
    assert.ok(packageSource.shots[1].narration.toLowerCase().includes(term.toLowerCase().split(' ')[0]),
      term+' not supported by locked narrator script');
  }
  assert.equal((v2.match(/eyebrow:'/g)||[]).length,4);
  for(const forbidden of ['INCOMING DEMAND','MEASURED DATABASE CAPACITY','MORE AUTH SERVERS?',
    'THE ARCHITECTURAL QUESTION','WHEN DEMAND EXCEEDS CAPACITY','ONE ARCHITECTURE'])
    assert.equal(v2.includes(forbidden),false,'low-value overlay must be absent: '+forbidden);
  assert.match(v2,/EP003_TERM_CARD_MAX_HOLD_FRAMES=270/);
  assert.match(v2,/if\(frame>=to\|\|!ep003CardIsReadable/);
  assert.match(v2,/ep003CardOpacity\(frame,from,to\)/);
});

test('four glossary entries align to the actual saved ElevenLabs SHOT02 script, no guessed times',()=>{
  assert.match(runner,/THROUGHPUT_TERM:'This is its measured throughput'/);
  assert.match(runner,/LATENCY_TERM:'That waiting time is part of latency'/);
  assert.match(runner,/BOTTLENECK_TERM:'Our User Database is now the bottleneck:'/);
  assert.match(runner,/ADMISSION_BUDGET_TERM:'shared admission budget of about'/);
  assert.match(runner,/cueFramesFromRealVoice\(source\.timing,termVoiceCues\)/);
  assert.match(runner,/REAL_ELEVENLABS_ALIGNMENT_MISSING__DO_NOT_USE_GUESSED_CUES_OR_REGENERATE/);
  assert.match(runner,/TERM_DEFINITION_CUE_ORDER_NOT_SUPPORTED_BY_REAL_VOICE/);
  assert.doesNotMatch(runner,/elevenlabs\.generate|textToSpeech|voice\.generate/);
  assert.equal(packageSource.sourceApproval.script,'DIRECTOR_APPROVED');
});

test('V2 keeps exact V1 diagrams, animation, moving particles, world camera and title',()=>{
  for(const fragment of [
    'Shot07CleanArchitectureWorld',
    'frame={worldFrame} replicaGrowth={0}',
    'frame={frame}',
    'flowRetryLevel={.08} flowJitterLevel={.76}',
    'admissionLevel={.5} breakerLevel={.11} probeLevel={1}',
    'translate3d(-7px,0,0) scale(1.007)',
    'THE SYSTEM IS STABLE. BUT LOGIN CAN STILL FAIL.',
    'FIND THE REAL BOTTLENECK.',
    'worldLastFrame:11978+2513'
  ]){
    assert.ok(v1.includes(fragment),fragment+' missing in V1');
    assert.ok(v2.includes(fragment),fragment+' changed in V2');
  }
  const slice=(src)=>src.slice(src.indexOf('  const priorVisual='),src.indexOf('  return <ATBackground>'));
  assert.equal(slice(v1),slice(v2),'V2 MUST preserve V1 camera/pressure motion calculations');
  assert.doesNotMatch(v2,/RejectionParticle|<circle|new RequestParticle/);
});

test('exact actual Director-LOCKED SHOT01 V2 last encoded frame 2513 and immutable take reused',()=>{
  assert.match(v2,/b6fd7f30-7c78-414b-a88c-387c0ee8c43a/);
  assert.match(v2,/da6d3cbc77dc3a0dc5374aec4a7ba8beb97739d4c5facffdf36d1585e7587c08/);
  assert.match(v2,/realLastFrame:2513/);
  assert.match(runner,/hash\(previous\.video_data\)===LOCKED_PREVIOUS_SHA/);
  assert.match(runner,/previous\.render_key==='EP003_SHOT01_V2'/);
  assert.match(runner,/select=eq\(n/);
  assert.match(runner,/2513/);
  assert.match(runner,/worldStartFrame:14491/);
  assert.match(v2,/previousLastFrameDataUri/);
  assert.match(runner,/SELECTED_AUDIO_NOT_VERIFIED_SLOW_NATURAL__NO_AUDIO_REGEN/);
});

test('all four glossary cards are fitted, readable and do not cover existing architecture',()=>{
  const fixtures={
    gateway:{left:521,top:410,width:258,height:250},
    balancer:{left:804,top:410,width:246,height:250},
    auth:{left:1151,top:315,width:350,height:348},
    database:{left:1571,top:368,width:252,height:280},
    phone:{left:55,top:160,width:445,height:800}
  };
  const collide=(a,c,m=20)=>a.left<c.left+c.width+m&&a.left+a.width+m>c.left&&
    a.top<c.top+c.height+m&&a.top+a.height+m>c.top;
  for(const [term,definition] of terms){
    const width=Math.ceil(Math.max(shot10TextWidth(term,23),shot10TextWidth(definition,29))+80);
    const box={left:560,top:742,width,height:131};
    assert.ok(width>=320&&width<=950,term+' has invalid content fit width '+width);
    assert.ok(box.left+width<=1794);
    assert.ok(box.top+box.height<=1020);
    for(const [node,p] of Object.entries(fixtures))
      assert.equal(collide(box,p),false,term+' overlaps '+node);
  }
  assert.match(v2,/fontSize:23/);
  assert.match(v2,/fontSize:29/);
});

test('every glossary card holds long enough or is fully OMITTED, no instant flashing',()=>{
  for(const [term,definition] of terms){
    const hold=270,minimum=ep003MinReadableCardFrames(term,definition,30);
    assert.ok(minimum<=hold,term+' requires more than capped nine-second definition hold');
    assert.equal(ep003CardIsReadable(term,definition,100,100+hold,30),true);
    assert.equal(ep003CardOpacity(100+18,100,100+hold),1);
    assert.equal(ep003CardOpacity(200,100,100+hold),1);
    assert.equal(ep003CardOpacity(100+hold-20,100,100+hold),1);
    assert.equal(ep003CardIsReadable(term,definition,100,100+100,30),false);
  }
});

test('V2 uses separate paid render authorization and MP4 key, old V1 stays untouched',()=>{
  assert.match(runner,/EP003_DIRECTOR_SHOT02_V2_RENDER_APPROVED/);
  assert.match(runner,/RENDER_NOT_AUTHORIZED_BY_DIRECTOR_ENV_GATE/);
  assert.match(runner,/EP003_SHOT02_TERMS_V2_FROM_LOCKED_SHOT01/);
  assert.match(runner,/EP003_SHOT02_TERMS_V2/);
  assert.match(runner,/EP003_SHOT02_V2_REAL_MP4_SAVED/);
  assert.match(runner,/EP003_SHOT02_V2_P0_ACTUAL_PIXEL_QA/);
  assert.doesNotMatch(runner,/update\s+episode_package_voice_take/i);
  assert.doesNotMatch(runner,/update\s+episode_package_import/i);
});
