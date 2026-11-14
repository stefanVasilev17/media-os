import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const component=read('./src/episodes/ep003/Shot03DatabaseReplicasV2.tsx');
const runner=read('./ep003-shot03-database-replicas-v2-render-once.mjs');
const root=read('./src/Root.tsx');
const pkg=JSON.parse(read('../backend/src/main/resources/ep003-director-locked-voice-package-v1.json'));
test('Script v0.4 stays verbatim and shot title is One Primary. Two Replicas',()=>{
  const shot=pkg.shots.find(x=>x.shotKey==='SHOT03');
  assert.equal(shot.title,'One Primary. Two Replicas.');
  for(const phrase of ['The existing database becomes the Primary.',
    'Replica A. And Replica B.','asynchronous replication',
    'That is one form of horizontal scaling.']){
    assert.ok(shot.narration.includes(phrase));
  }
});
test('exact predecessor V4 SHA, frame 3442 and world frame 17933, no V3 fallback',()=>{
  for(const val of [
    '78db6f85-ba05-4714-ba4f-fc70d64def88',
    '5eceeb39954b9a5b6d755d136b3dd29fe04b5fc9e30992fcc65464f40bc2914e',
    '14491+3443-1',
    'worldStartFrame:17933','select=eq(n', '3442',
    "previous.render_key==='EP003_SHOT02_MOTION_V4'"]){
    assert.ok((component+runner).includes(val),val);
  }
});
test('source frame visible only at frame zero; living architecture continues after frame0',()=>{
  assert.match(component,/frame===0&&<AbsoluteFill/);
  assert.doesNotMatch(component,/1-ease\(frame,0,55\)/);
  assert.match(component,/frame=\{worldFrame\}/);
  assert.match(component,/translate3d\(-7px,0,0\) scale\(1\.007\)/);
  assert.match(component,/replicaGrowth=\{0\}/);
  assert.match(runner,/uniqueMovingSteps>=18/);
  assert.match(runner,/firstStep>0\.12&&motion\.firstStep<4\.5/);
});
test('no improvised login particle and no container-in-container; data nodes live next to original DB',()=>{
  assert.match(component,/Shot07CleanArchitectureWorld/);
  assert.match(component,/Shot02_NODES|SHOT02_NODES/);
  assert.doesNotMatch(component,/RejectionParticle|new RequestParticle/);
  assert.match(component,/shot02Intersects\(card,r,20\)/);
  assert.match(component,/EP003_SHOT03_GLOSSARY_OVERLAPS_ARCHITECTURE/);
  assert.match(component,/EP003_SHOT03_REPLICA_NESTING_OR_OVERLAP/);
  assert.match(component,/M16 17V65Q45 83 74 65V17M16 40Q45 58 74 40/);
  assert.match(component,/ellipse cx="45" cy="17" rx="29" ry="11"/);
  assert.doesNotMatch(component,/ACCOUNT DATA COPY/);
  assert.doesNotMatch(component,/borderRadius:19,padding:'17px 18px'/);
  assert.match(component,/const bezier=/);
  assert.match(component,/const replicaPath=/);
});
test('only narrator-explained glossary with content-fitting and no wrapped microcopy',()=>{
  const shot=pkg.shots.find(x=>x.shotKey==='SHOT03');
  for(const word of ['PRIMARY','REPLICA','ASYNCHRONOUS REPLICATION','HORIZONTAL SCALING']){
    assert.ok(shot.narration.toLowerCase().includes(word.toLowerCase().split(' ')[0]),word);
    assert.ok(component.includes("title:'"+word+"'"),word);
  }
  assert.match(component,/shot10TextWidth\(meaning,29\)/);
  assert.match(component,/width>900/);
  assert.match(component,/whiteSpace:'nowrap'/);
});
test('no automatic paid TTS, no video change to predecessor, uses original selected voice alignment',()=>{
  assert.match(runner,/EP003_SHOT03_NO_SELECTED_SLOW_NATURAL_TAKE/);
  assert.match(runner,/ELEVEN_V4_AUTO_SLOW_NATURAL_PAUSES_V1/);
  assert.match(runner,/REAL_ELEVENLABS_ALIGNMENT_MISSING/);
  assert.match(runner,/cueFramesFromRealVoice\(source\.timing\)/);
  assert.match(runner,/LEAD_IN_FRAMES=60/);
  assert.match(runner,/adelay=2000:all=1/);
  assert.doesNotMatch(runner,/elevenlabs\.generate|generateSpeech|textToSpeech/);
  assert.match(runner,/EP003_SHOT03_V2_REAL_MP4_SAVED/);
  assert.match(root,/EP003-SHOT03-DATABASE-REPLICAS-V2-DIRECTOR-CANDIDATE/);
});
