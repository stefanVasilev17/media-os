import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {shot10TextWidth} from './shot10-content-fit-layout.mjs';
import {ep003CardIsReadable,ep003CardOpacity,ep003MinReadableCardFrames} from './ep003-readable-card-policy.mjs';

const read=(p)=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const v2=read('./src/episodes/ep003/Shot02TechnicalTermsV2.tsx');
const v3=read('./src/episodes/ep003/Shot02TechnicalTermsV3.tsx');
const originalV1=read('./src/episodes/ep003/Shot02DirectorReviewV1.tsx');
const render=read('./ep003-shot02-terms-v3-render-once.mjs');
const root=read('./src/Root.tsx');
const pkg=JSON.parse(read('../backend/src/main/resources/ep003-director-locked-voice-package-v1.json'));
const terms=[
 ['THROUGHPUT','Work completed in a given period'],
 ['LATENCY','Time one operation takes to complete'],
 ['BOTTLENECK','The component limiting total Login capacity'],
 ['ADMISSION BUDGET','Caps DB lookups, including retry work']
];

test('V3 displays only spoken engineering terms and precise educational definitions',()=>{
  assert.equal((v3.match(/eyebrow:'/g)||[]).length,4,'only four unique glossary definitions');
  for(const [term,definition] of terms){
    assert.ok(v3.includes("eyebrow:'"+term+"'"),term+' term absent');
    assert.ok(v3.includes("line:'"+definition+"'"),term+' definition absent');
    assert.ok(pkg.shots[1].narration.toLowerCase().includes(term.toLowerCase().split(' ')[0]));
  }
  for(const x of ['ONE ARCHITECTURE','MEASURED DATABASE CAPACITY','INCOMING DEMAND',
    'MORE AUTH SERVERS?','THE ARCHITECTURAL QUESTION'])
    assert.equal(v3.includes(x),false);
});

test('Throughput appears at FIRST spoken definition AND repeats BELOW Latency while narrator compares them',()=>{
  assert.match(v3,/firstThroughputFrom=termCueFrames\.THROUGHPUT_TERM/);
  assert.match(v3,/firstThroughputTo=Math\.min\(pairFrom,firstThroughputFrom\+EP003_TERM_CARD_MAX_HOLD_FRAMES\)/);
  assert.match(v3,/const pairFrom=termCueFrames\.LATENCY_TERM/);
  assert.match(v3,/const pairTo=Math\.min\(durationInFrames,termCueFrames\.BOTTLENECK_TERM\)/);
  assert.match(v3,/EP003_SHOT02_V3_PAIR_TOP=704/);
  assert.match(v3,/EP003_SHOT02_V3_PAIR_GAP=16/);
  assert.match(v3,/cardAt\(latency,pairFrom,pairTo,EP003_SHOT02_V3_PAIR_TOP,'latency-stacked-above'\)/);
  assert.match(v3,/cardAt\(throughput,pairFrom,pairTo,[\s\S]*'throughput-stacked-below'\)/);
  assert.match(v3,/p\.termCueFrames\.LATENCY_TERM < p\.cueFrames\.THROUGHPUT/);
  assert.match(v3,/p\.cueFrames\.THROUGHPUT < p\.termCueFrames\.BOTTLENECK_TERM/);
  // The actual previously verified word-level timestamps, BEFORE the exact 60-frame offset
  const actual={throughputFirst:1008,latencyFirst:1657,throughputSecond:1896,
    bottleneck:2137,admissionBudget:2755};
  const lead=60;
  const first=actual.throughputFirst+lead;
  const latency=actual.latencyFirst+lead;
  const second=actual.throughputSecond+lead;
  const bottleneck=actual.bottleneck+lead;
  assert.equal(first,1068);
  assert.equal(latency,1717);
  assert.ok(first+270<latency);
  assert.ok(latency<second&&second<bottleneck,
    'both glossary cards must remain on-screen across second comparison');
  assert.equal(bottleneck-latency,480,'paired glossary should hold for 16 seconds');
  assert.ok(ep003CardIsReadable(...terms[0],latency,bottleneck,30));
  assert.ok(ep003CardIsReadable(...terms[1],latency,bottleneck,30));
  assert.equal(ep003CardOpacity(second,latency,bottleneck),1);
  assert.equal(ep003CardOpacity(second,latency,bottleneck),1);
  assert.equal(ep003CardOpacity(latency+18,latency,bottleneck),1);
  assert.equal(ep003CardOpacity(bottleneck-20,latency,bottleneck),1);
});

test('P0 double card layout: Latency above Throughput, 16px gap, no overlap or off-screen cards',()=>{
  const fixtures={
    gateway:{left:521,top:410,width:258,height:250},
    balancer:{left:804,top:410,width:246,height:250},
    auth:{left:1151,top:315,width:350,height:348},
    database:{left:1571,top:368,width:252,height:280},
    phone:{left:55,top:160,width:445,height:800}
  };
  const intersects=(a,c,m=20)=>a.left<c.left+c.width+m&&a.left+a.width+m>c.left&&
    a.top<c.top+c.height+m&&a.top+a.height+m>c.top;
  const cards=[
    {label:terms[1],top:704},
    {label:terms[0],top:851},
  ];
  assert.equal(cards[0].top+131+16,cards[1].top);
  for(const c of cards){
    const [term,definition]=c.label;
    const width=Math.ceil(Math.max(shot10TextWidth(term,23),shot10TextWidth(definition,29))+80);
    const rect={left:560,top:c.top,width,height:131};
    assert.ok(width<=950&&width>=320,term+' overflows');
    assert.ok(rect.left+width<=1794&&rect.top+rect.height<=1020);
    for(const [name,node] of Object.entries(fixtures))
      assert.equal(intersects(rect,node,20),false,term+' overlaps '+name);
  }
  assert.match(v3,/EP003_SHOT02_V3_STACK_OVERLAP_OR_OVERFLOW/);
});

test('exact two-second silent prelude without rewriting locked original Slow Natural take',()=>{
  assert.match(v3,/EP003_SHOT02_V3_AUDIO_LEAD_FRAMES=60/);
  assert.match(v3,/worldFrame=props\.worldStartFrame\+frame/);
  assert.match(render,/const LEAD_IN_FRAMES=60;/);
  assert.match(render,/const LEAD_IN_SECONDS=LEAD_IN_FRAMES\/FPS/);
  assert.match(render,/Math\.ceil\(audioSeconds\*FPS\)\+15\+LEAD_IN_FRAMES/);
  assert.match(render,/frame\+LEAD_IN_FRAMES/);
  assert.match(render,/'-af','adelay=2000:all=1'/);
  assert.match(render,/narrationStartsAtSeconds:LEAD_IN_SECONDS/);
  assert.match(render,/EP003_SHOT02_V3_NARRATION_CUES_MUST_BEGIN_AFTER_TWO_SECONDS/);
  assert.doesNotMatch(render,/elevenlabs\.generate|textToSpeech|generateSpeech/);
  assert.match(render,/SELECTED_AUDIO_NOT_VERIFIED_SLOW_NATURAL__NO_AUDIO_REGEN/);
  assert.match(render,/originalAudio/);
});

test('locked predecessor real last frame stays identical and world camera still moves immediately at frame zero',()=>{
  for(const s of ['b6fd7f30-7c78-414b-a88c-387c0ee8c43a',
    'da6d3cbc77dc3a0dc5374aec4a7ba8beb97739d4c5facffdf36d1585e7587c08',
    'realLastFrame:2513','worldLastFrame:11978+2513',
    "translate3d(-7px,0,0) scale(1.007)","frame={worldFrame} replicaGrowth={0}",
    'flowRetryLevel={.08} flowJitterLevel={.76}',
    'admissionLevel={.5} breakerLevel={.11} probeLevel={1}']){
    assert.ok(v3.includes(s),'critical invariant changed '+s);
  }
  assert.match(render,/hash\(previous\.video_data\)===LOCKED_PREVIOUS_SHA/);
  assert.match(render,/previous\.render_key==='EP003_SHOT01_V2'/);
  assert.match(render,/select=eq\(n/);
  assert.match(render,/2513/);
  assert.match(render,/worldStartFrame:14491/);
  assert.match(v3,/previousLastFrameDataUri/);
  assert.doesNotMatch(v3,/RejectionParticle|new RequestParticle|<circle/);
  for(const slice of ['const pressure=ease(frame,cues.DEMAND,100);',
    'const deeperPressure=ease(frame,cues.QUEUES,100);']){
    assert.ok(v2.includes(slice)&&v3.includes(slice));
  }
});

test('new V3 composition/revision independent of V1, V2, no inherited old renderer and no auto lock',()=>{
  assert.match(root,/EP003-SHOT02-TERMS-V3-DIRECTOR-CANDIDATE/);
  assert.match(root,/Ep003Shot02TechnicalTermsV3/);
  assert.match(root,/EP003-SHOT02-TERMS-V2-DIRECTOR-CANDIDATE/);
  assert.match(render,/EP003_DIRECTOR_SHOT02_V3_RENDER_APPROVED/);
  assert.match(render,/EP003_SHOT02_TERMS_V3/);
  assert.match(render,/EP003_SHOT02_V3_REAL_MP4_SAVED/);
  assert.match(render,/EP003_SHOT02_V3_P0_ACTUAL_PIXEL_QA/);
  assert.match(render,/RENDER_NOT_AUTHORIZED_BY_DIRECTOR_ENV_GATE/);
  assert.doesNotMatch(render,/update\s+episode_package_voice_take/i);
  assert.doesNotMatch(render,/update\s+episode_package_import/i);
  assert.ok(originalV1.includes("EP003_SHOT02_CARDS"));
});

test('readable TERM + definition rather than generic overlays and no premature disappearance',()=>{
  for(const [term,definition] of terms){
    const frames=Math.ceil(Math.max(5.5,1.8+(term+' '+definition).split(/\s+/).length/2.6)*30);
    assert.ok(frames<=270,term+' not readable with nine-second display');
    assert.equal(ep003CardIsReadable(term,definition,100,370),true);
  }
  assert.match(v3,/ep003CardIsReadable\(card\.eyebrow,card\.line,from,to,30\)/);
  assert.match(v3,/ep003CardOpacity\(frame,from,to\)/);
});
