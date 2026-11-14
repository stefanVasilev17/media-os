import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {shot10TextWidth} from './shot10-content-fit-layout.mjs';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const scene=read('./src/episodes/ep003/Shot05StaleReadV1.tsx');
const runner=read('./ep003-shot05-stale-read-v1-render-once.mjs');
const root=read('./src/Root.tsx');
const pkg=JSON.parse(read('../backend/src/main/resources/ep003-director-locked-voice-package-v1.json'));
const shot=pkg.shots.find(s=>s.shotKey==='SHOT05');

test('P0: source is the EXACT Director-LOCKED SHOT05 script and original voice alignment',()=>{
 assert.equal(shot.title,'The Replica That Gives the Wrong Answer');
 for(const phrase of [
   "Let's follow one account change.",
   'The Primary records the new status.',
   'But Replica A has not applied that change yet.',
   'This delay is called replication lag.',
   'This is called a stale read.',
   'This is a consequence of eventual consistency.',
   'A healthy database can return a fast answer that is still unsafe to use.'
 ])assert.ok(shot.narration.includes(phrase),phrase);
 for(const required of [
  "EP003_SHOT05_NO_SELECTED_SLOW_NATURAL_TAKE",
  "ELEVEN_V4_AUTO_SLOW_NATURAL_PAUSES_V1",
  "REAL_ELEVENLABS_ALIGNMENT_MISSING",
  "cueFramesFromRealVoice(source.timing)",
  "LEAD_IN_FRAMES=60",
  "adelay=2000:all=1",
  "EP003_SHOT05_DIRECTOR_LOCKED_SCRIPT_MISMATCH",
 ])assert.ok(runner.includes(required),required);
 assert.doesNotMatch(runner,/elevenlabs\.generate|generateSpeech|textToSpeech/);
});
test('P0: SHOT04 real last frame and world motion persist with NO 55-frame static cover',()=>{
 for(const required of [
  "renderId:'4079729b-c1b3-405c-9a83-1ace0ef25641'",
  "sha256:'61fd35dc6662b259818b6d29379b39948a7239fa6588f7c23a010b97a7a5a5f3'",
  "previousWorldLastFrame:21012+3841-1",
  "frame===0&&<AbsoluteFill",
  "Shot07CleanArchitectureWorld frame={worldFrame} replicaGrowth={0}",
  "dbStress={.2}",
  "translate3d(-7px,0,0) scale(1.007)",
  "const age=3080-1+EP003_SHOT05_PREDECESSOR.frames-1+frame",
  "const dashOffset=-(3080+EP003_SHOT05_PREDECESSOR.frames-1+frame)*.74",
 ])assert.ok(scene.includes(required),required);
 assert.ok(runner.includes("worldStartFrame:24852"));
 assert.ok(runner.includes('select=eq'));
 assert.ok(runner.includes('3840'));
 assert.ok(runner.includes("previous.render_key==='EP003_SHOT04_READ_WRITE_SPLITTING_V1'"));
 assert.doesNotMatch(scene,/1-ease\(frame,0,55\)/);
 assert.match(runner,/uniqueMovingSteps>=18/);
 assert.match(runner,/firstStep>0\.12&&motion\.firstStep<4\.5/);
});
test('P0: Original tiny cylinder replicas and Primary Database — no nested container',()=>{
 for(const marker of [
  'M16 17V65Q45 83 74 65V17M16 40Q45 58 74 40',
  'ellipse cx="45" cy="17" rx="29" ry="11"',
  'PRIMARY DATABASE</div>',
  'REPLICA A',
  'REPLICA B',
  'REPLICA_CONTAINER_NESTING_OR_COLLISION',
  'CARD_OVERLAPS_NODE',
  'CARD_OVERLAPS_LEGEND',
 ])assert.ok(scene.includes(marker),marker);
 assert.doesNotMatch(scene,/ACCOUNT DATA COPY|left:SHOT02_NODES\.database\.x-131/);
});
test('P0: no arbitrary Login request dot; physical curved query paths and copied replica particles only',()=>{
 for(const marker of [
  'const QUERY_PATHS=',
  'const bezier=',
  'const replicaPath=',
  'point=bezier(phase,r)',
  'cx={point.x} cy={point.y}',
  'strokeDashoffset={dashOffset}',
  'QUERY_LINE_MUST_BE_PHYSICAL_BEZIER',
  'Shot07CleanArchitectureWorld',
 ])assert.ok(scene.includes(marker),marker);
 assert.doesNotMatch(scene,/new RequestParticle|RejectionParticle|Math\.random\(/);
});
test('P0: no subtitle/callout text escapes its own measured card',()=>{
 const c=[
  ['ACCOUNT STATUS CHANGE','Primary records the account lock'],
  ['REPLICATION LAG','Replica A still has the older status'],
  ['STALE READ','An outdated account status is not safe'],
  ['EVENTUAL CONSISTENCY','Replica copies may temporarily disagree'],
  ['SECURITY FIRST','Critical Login checks need current data'],
  ['FAST DOES NOT MEAN CORRECT','A fast answer can still be unsafe']
 ];
 for(const [title,meaning] of c){
  assert.ok(scene.includes("title:'"+title+"'"),title);
  assert.ok(scene.includes("meaning:'"+meaning+"'"),meaning);
  const width=Math.ceil(Math.max(shot10TextWidth(title,23),shot10TextWidth(meaning,29))+80);
  assert.ok(width>=320&&width<=900&&560+width<=1480,title+' '+width);
 }
 assert.ok(shot10TextWidth('THE REPLICA GIVES A WRONG ANSWER',38)+560<1880);
 for(const marker of ['whiteSpace:\'nowrap\'','EP003_SHOT05_CARD_TEXT_OVERFLOW',
   'EP003_SHOT05_CARD_OVERLAPS_NODE','ep003CardIsReadable'])assert.ok(scene.includes(marker),marker);
});
test('P0: semantic story distinguishes locked Primary, temporarily stale Replica A and hypothetical unsafe check',()=>{
 for(const marker of [
  'PRIMARY STATUS: LOCKED','REPLICA A: OLDER STATUS',
  'REPLICA A: MAY CATCH UP','frame>=cues.HYPOTHETICAL',
  'cues.EVENTUAL','cues.CATCH_UP',
  'HYPOTHETICAL','STALE_ACTIVE','STALE_READ','SAFE_PRIMARY',
  'FAST_UNSAFE','CONCLUSION'
 ])assert.ok(scene.includes(marker),marker);
 assert.ok(scene.includes('frame<cues.CATCH_UP'));
});
test('P0: true H264/AAC and first decoded frame continuity QA, never auto-lock',()=>{
 for(const marker of [
  'EP003_SHOT05_V1_REAL_MP4_SAVED',
  'EP003_SHOT05_P0_REAL_SEAM_AND_MOTION_QA',
  'EP003_SHOT05_ACTUAL_DECODED_FIRST_FRAME_SEAM_QA_FAILED',
  'Number(video.nb_frames)===frames',
  "video?.codec_name==='h264'",
  "audio?.codec_name==='aac'",
  'EP003_SHOT05_MP4_SAVE_DID_NOT_COMPLETE',
  'EP003-SHOT05-STALE-READ-V1-DIRECTOR-CANDIDATE'
 ])assert.ok((runner+root).includes(marker),marker);
 assert.doesNotMatch(runner,/directorLocked:true|update director_lock/);
});
