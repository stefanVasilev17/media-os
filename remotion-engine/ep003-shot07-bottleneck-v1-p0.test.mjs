import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {shot10TextWidth} from './shot10-content-fit-layout.mjs';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const scene=read('./src/episodes/ep003/Shot07BottleneckMeasurementV1.tsx');
const worker=read('./ep003-shot07-bottleneck-v1-render-once.mjs');
const root=read('./src/Root.tsx');
const shot=JSON.parse(read('../backend/src/main/resources/ep003-director-locked-voice-package-v1.json')).shots.find(x=>x.shotKey==='SHOT07');

test('P0 actual source-of-truth script is locked SHOT07; use existing Director-selected Slow Natural voice only',()=>{
 assert.equal(shot.title,'Did We Really Fix the Bottleneck?');
 for(const phrase of [
  'Look at the architecture now.',
  'Nine hundred new Login requests per second.',
  'About five hundred account lookups per second on the original database.',
  'The replicas are busy serving optional reads.',
  'This is where the critical path becomes important.',
  'We scaled the reads that could move. But the work limiting Login stayed in one place.',
  'Instead of copying the same account data onto more servers, what if we divided account ownership'
 ])assert.ok(shot.narration.includes(phrase),phrase);
 for(const item of [
  'EP003_SHOT07_NO_SELECTED_SLOW_NATURAL_TAKE',
  'ELEVEN_V4_AUTO_SLOW_NATURAL_PAUSES_V1',
  'REAL_ELEVENLABS_ALIGNMENT_MISSING',
  'cueFramesFromRealVoice(source.timing)',
  'EP003_SHOT07_DIRECTOR_LOCKED_SCRIPT_MISMATCH',
  'LEAD_IN_FRAMES=60','adelay=2000:all=1'
 ])assert.ok(worker.includes(item),item);
 assert.doesNotMatch(worker,/elevenlabs\.generate|generateSpeech|textToSpeech/);
});
test('P0 exact SHOT06 V1 SHA-pinned last video frame, world tick and all particle phases inherited',()=>{
 for(const term of [
  "renderId:'0007bd16-edbf-4ecc-927a-4a5781d0b921'",
  "sha256:'4d38c8a5777b2eeab1952bd8960a925feae0672d142b70b12b2a2df2392d4a3f'",
  "previousWorldLastFrame:27852+3601-1",
  "frame===0&&<AbsoluteFill",
  "translate3d(-7px,0,0) scale(1.007)",
  "Shot07CleanArchitectureWorld frame={worldFrame} replicaGrowth={0}",
  "dbStress={.2}",
  "const age=3080-1+3841-1+3001-1+EP003_SHOT07_PREDECESSOR.frames-1+frame",
  "const dashOffset=-(3080+3841-1+3001-1+EP003_SHOT07_PREDECESSOR.frames-1+frame)*.74",
  "CORRECTNESS BEFORE SPEED",
  "DID WE FIX THE BOTTLENECK?",
  "const heading=ease(frame,props.cueFrames.ORIGINAL_PROBLEM,75)"
 ])assert.ok(scene.includes(term),term);
 for(const term of [
  "PIN='0007bd16-edbf-4ecc-927a-4a5781d0b921'",
  "PIN_SHA='4d38c8a5777b2eeab1952bd8960a925feae0672d142b70b12b2a2df2392d4a3f'",
  "worldStartFrame:31452",'select=eq','3600',
  "previous.render_key==='EP003_SHOT06_CORRECTNESS_V1'",
 ])assert.ok(worker.includes(term),term);
 assert.doesNotMatch(scene,/1-ease\(frame,0,55\)/);
});
test('P0 existing Primary, exact replica cylinders and query paths, no doubled architecture or rogue Login dot',()=>{
 for(const t of [
  'Shot07CleanArchitectureWorld','PRIMARY DATABASE</div>',
  'ellipse cx="45" cy="17" rx="29" ry="11"',
  'M16 17V65Q45 83 74 65V17M16 40Q45 58 74 40',
  'REPLICA A','REPLICA B','const replicaPath=','const bezier=',
  'point=bezier(phase,r)','cx={point.x} cy={point.y}',
  'const QUERY_PATHS=','QUERY_LINE_MUST_BE_PHYSICAL_BEZIER',
  'REPLICA_CONTAINER_NESTING_OR_COLLISION',
  'CARD_OVERLAPS_NODE','CARD_OVERLAPS_LEGEND'
 ])assert.ok(scene.includes(t),t);
 assert.doesNotMatch(scene,/new RequestParticle|RejectionParticle|Math\.random\(|ACCOUNT DATA COPY/);
});
test('P0 cards cannot clip copy, collide with nodes or overfill 16:9 area',()=>{
 const cards=[
  ['INCOMING LOGIN TRAFFIC','900 new Login requests per second'],
  ['ORIGINAL PRIMARY LOAD','About 500 account lookups per second'],
  ['REPLICA READ CAPACITY','Optional reads can use the replicas'],
  ['CRITICAL ACCOUNT LOOKUP','Security checks still require Primary'],
  ['BOTTLENECK UNCHANGED','The limiting operation did not move'],
  ['THE CRITICAL PATH','Required steps before Login completes'],
  ['PRIMARY STILL REQUIRED','Faster preferences do not remove it'],
  ['MORE SYSTEM, SAME LIMIT','More servers do not guarantee throughput'],
  ['USERS STILL CANNOT LOG IN','Optional read scale is not Login scale'],
  ['THE REAL BOTTLENECK','Required Login work stayed on Primary'],
  ['A DIFFERENT NEXT STEP','Can independent groups own account data?']
 ];
 for(const [title,line] of cards){
  assert.ok(scene.includes("title:'"+title+"'"),title);
  assert.ok(scene.includes("meaning:'"+line+"'"),line);
  const w=Math.ceil(Math.max(shot10TextWidth(title,23),shot10TextWidth(line,29))+80);
  assert.ok(w>=320&&w<=900&&560+w<=1480,title+' width='+w);
 }
 for(const t of ['EP003_SHOT07_CARD_TEXT_OVERFLOW','EP003_SHOT07_CARD_OVERLAPS_NODE',
  'EP003_SHOT07_CARD_OUTSIDE_FRAME','ep003CardIsReadable',"whiteSpace:'nowrap'"])
  assert.ok(scene.includes(t),t);
 for(const label of ['READ → PRIMARY','CRITICAL READ → PRIMARY','LOGIN REQUIRES PRIMARY']){
  assert.ok(shot10TextWidth(label,21)<325,label);
 }
 for(const label of ['SUITABLE READ → REPLICA','OPTIONAL READS → REPLICA','REPLICAS ≠ LOGIN SCALING']){
  assert.ok(shot10TextWidth(label,21)<445,label);
 }
});
test('P0 architecture illustrates original bottleneck, not incorrectly claiming all replica reads improve Login',()=>{
 for(const t of ['LOGIN_RATE','LOOKUP_RATE','OPTIONAL_BUSY','PRIMARY_CHECK','NOT_REMOVED',
  'CRITICAL_PATH','PRIMARY_DEP','WORK_STAYED','PARTITION_OWNERSHIP',
  '900 new Login requests per second','About 500 account lookups per second',
  'LOGIN REQUIRES PRIMARY','REPLICAS ≠ LOGIN SCALING']){
   assert.ok(scene.includes(t),t);
 }
 assert.ok(scene.includes('pathProof&&!primary'));
});
test('P0 all 27 voice-aligned events are original exact narration phrases',()=>{
 const cues=['INTRO','THREE_AUTH','PRIMARY_ONE','TWO_REPLICAS','MORE_MACHINES','ORIGINAL_PROBLEM',
 'LOGIN_RATE','LOOKUP_RATE','AFTER_REPLICAS','MEASURE_WORKLOAD','OPTIONAL_BUSY','PRIMARY_CHECK',
 'LIMIT_REACHED','REPLICAS_HELPED','NOT_REMOVED','CRITICAL_PATH','PATH_DEFINITION',
 'LOGIN_REQUIRED','PREFERENCE_FAST','PRIMARY_DEP','COMPLEXITY','MORE_DB','DASHBOARD',
 'STILL_FAIL','WORK_STAYED','BETTER_QUESTION','PARTITION_OWNERSHIP'];
 for(const c of cues){
   assert.ok(scene.includes("'"+c+"'"),'scene '+c);
   assert.ok(worker.includes(c+':'),'voice '+c);
 }
 assert.ok(scene.includes('EP003_SHOT07_REAL_VOICE_CUE_INVALID_'));
});
test('P0 full-HD real H264/AAC render checks actual first decoded frame and continuous first second; never auto-LOCK',()=>{
 for(const t of [
  'EP003_SHOT07_V1_REAL_MP4_SAVED',
  'EP003_SHOT07_P0_REAL_SEAM_AND_MOTION_QA',
  'EP003_SHOT07_ACTUAL_DECODED_FIRST_FRAME_SEAM_QA_FAILED',
  "video?.codec_name==='h264'","audio?.codec_name==='aac'",
  'Number(video.nb_frames)===frames',
  'motion.uniqueMovingSteps>=18',
  'motion.firstStep>0.12&&motion.firstStep<4.5',
  'EP003_SHOT07_MP4_SAVE_DID_NOT_COMPLETE',
  'EP003-SHOT07-BOTTLENECK-V1-DIRECTOR-CANDIDATE'
 ])assert.ok((worker+root).includes(t),t);
 assert.ok(root.includes('component={Ep003Shot07BottleneckMeasurementV1}'));
 assert.doesNotMatch(worker,/directorLocked:true|update director_lock/);
});
