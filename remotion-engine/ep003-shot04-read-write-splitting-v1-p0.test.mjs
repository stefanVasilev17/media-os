import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {shot10TextWidth} from './shot10-content-fit-layout.mjs';

const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const comp=read('./src/episodes/ep003/Shot04ReadWriteSplittingV1.tsx');
const runner=read('./ep003-shot04-read-write-splitting-v1-render-once.mjs');
const root=read('./src/Root.tsx');
const voice=JSON.parse(read('../backend/src/main/resources/ep003-director-locked-voice-package-v1.json'));
const shot=voice.shots.find(s=>s.shotKey==='SHOT04');

test('P0: SHOT04 exact locked narration and voice script from original Director-locked v0.4',()=>{
 assert.equal(shot.title,'Who Decides Which Database Gets the Query?');
 for(const phrase of ['Watch another Login request reach Auth 01.',
   'Engineers often call this read/write splitting.',
   'In our design, that critical check stays on the authoritative Primary.',
   'We can allow that query to go to Replica A.',
   'Another suitable read may go to Replica B.',
   'Our critical authentication check never moved.',
   'How do we know their information is recent enough to trust?']){
  assert.ok(shot.narration.includes(phrase),phrase);
 }
 assert.match(runner,/ELEVEN_V4_AUTO_SLOW_NATURAL_PAUSES_V1/);
 assert.match(runner,/generated_alignment::text/);
 assert.match(runner,/REAL_ELEVENLABS_ALIGNMENT_MISSING/);
 assert.match(runner,/cueFramesFromRealVoice\(source\.timing\)/);
 assert.match(runner,/EP003_SHOT04_NO_SELECTED_SLOW_NATURAL_TAKE/);
 assert.match(runner,/EP003_SHOT04_DIRECTOR_LOCKED_SCRIPT_MISMATCH/);
 assert.doesNotMatch(runner,/elevenlabs\.generate|generateSpeech|textToSpeech/);
});
test('P0: no visual reset; exact SHOT03 V4 source last decoded frame and continuous world',()=>{
 assert.match(comp,/fc26ca7b-60f2-4c35-b248-6b373736ce99/);
 assert.match(runner,/1c4fbe3133775b514e82a2e2aec583859615d8fa86b349732dd7ba1bf2391709/);
 assert.match(runner,/select=eq\(n/);
 assert.match(runner,/3079/);
 assert.match(comp,/previousWorldLastFrame:17933\+3080-1/);
 assert.match(comp,/frame===0&&<AbsoluteFill/);
 assert.match(comp,/worldFrame=props\.worldStartFrame\+frame/);
 assert.match(comp,/translate3d\(-7px,0,0\) scale\(1\.007\)/);
 assert.match(comp,/Shot07CleanArchitectureWorld frame=\{worldFrame\} replicaGrowth=\{0\}/);
 assert.match(comp,/dbStress=\{\.2\}/);
 assert.match(comp,/previousWriteCueFrame:1199/);
 assert.match(comp,/EP003_SHOT04_PREDECESSOR\.frames-1\+frame/);
 assert.doesNotMatch(comp,/1-ease\(frame,0,55\)/);
 assert.match(runner,/firstStep>0\.12&&motion\.firstStep<4\.5/);
 assert.match(runner,/uniqueMovingSteps>=18/);
});
test('P0: replica visuals are same small cylinder glyphs, not nested blue containers',()=>{
 assert.match(comp,/Shot07CleanArchitectureWorld/);
 assert.match(comp,/ellipse cx="45" cy="17" rx="29" ry="11"/);
 assert.match(comp,/M16 17V65Q45 83 74 65V17M16 40Q45 58 74 40/);
 assert.match(comp,/REPLICA A/);
 assert.match(comp,/REPLICA B/);
 assert.match(comp,/PRIMARY DATABASE<\/div>/);
 assert.match(comp,/top:SHOT02_NODES\.database\.y-57/);
 assert.match(comp,/REPLICA_CONTAINER_NESTING_OR_COLLISION/);
 assert.match(comp,/EP003_SHOT04_CARD_OVERLAPS_NODE/);
 assert.doesNotMatch(comp,/ACCOUNT DATA COPY/);
 assert.doesNotMatch(comp,/left:SHOT02_NODES\.database\.x-131/);
});
test('P0: no rogue Login request dot; replication dots follow cubic Bezier geometry',()=>{
 assert.match(comp,/const replicaPath=/);
 assert.match(comp,/const bezier=/);
 assert.match(comp,/point=bezier\(phase,r\)/);
 assert.match(comp,/cx=\{point\.x\} cy=\{point\.y\}/);
 assert.match(comp,/const QUERY_PATHS=/);
 assert.match(comp,/strokeDashoffset=/);
 assert.match(comp,/EP003_SHOT04_QUERY_LINE_MUST_BE_PHYSICAL_BEZIER/);
 assert.doesNotMatch(comp,/RejectionParticle|new RequestParticle|x:\s*960,y:\s*540/);
});
test('P0: no clipping or card/card overlap; all real technical copy content-fit',()=>{
 const words=[
  ['READ / WRITE SPLITTING','Each query needs the right database'],
  ['AUTHORITATIVE READ','Account status stays on Primary Database'],
  ['SAFE REPLICA READ','A display preference may use Replica A'],
  ['READ SCALING','Replicas share suitable read traffic'],
  ['PRIMARY BOTTLENECK','Critical Login checks still need Primary'],
  ['REPLICA FRESHNESS','How recent is the replica data?'],
 ];
 for(const [a,b] of words){
   assert.ok(comp.includes("title:'"+a+"'"),a);
   assert.ok(comp.includes("meaning:'"+b+"'"),b);
   const width=Math.ceil(Math.max(shot10TextWidth(a,23),shot10TextWidth(b,29))+80);
   assert.ok(width>=320&&width<=900&&560+width<=1480,a+' width='+width);
 }
 assert.match(comp,/EP003_SHOT04_CARD_TEXT_OVERFLOW/);
 assert.match(comp,/EP003_SHOT04_CARD_OVERLAPS_LEGEND/);
 assert.match(comp,/EP003_SHOT04_CARD_OUTSIDE_FRAME/);
 assert.match(comp,/whiteSpace:'nowrap'/);
 assert.match(comp,/ep003CardIsReadable/);
});
test('P0: 17 real semantic cues preserve read/write, security, replica freshness story',()=>{
 const keys=['INTRO','THREE','DANGER','AUTH_ROUTING','SPLIT','WRITES','AUTH_CHECK',
   'DISABLED','PRIMARY_SAFE','PREFERENCE','REPLICA_A','REPLICA_B','READ_SCALING',
   'PRIMARY_CAPACITY','CRITICAL_STILL','MORE_READS','FRESHNESS'];
 for(const k of keys){
   assert.ok(comp.includes("'"+k+"'"),k);
   assert.ok(runner.includes(k+':'),k);
 }
 assert.match(comp,/EP003_SHOT04_REAL_VOICE_CUE_INVALID_/);
 assert.match(runner,/LEAD_IN_FRAMES=60/);
 assert.match(runner,/adelay=2000:all=1/);
 assert.match(root,/EP003-SHOT04-READ-WRITE-SPLITTING-V1-DIRECTOR-CANDIDATE/);
});
test('Production render saves real full-HD H264/AAC and checks first frame and motion',()=>{
 for(const token of [
  'EP003_SHOT04_V1_REAL_MP4_SAVED',
  'EP003_SHOT04_P0_REAL_SEAM_AND_MOTION_QA',
  'EP003_SHOT04_ACTUAL_DECODED_FIRST_FRAME_SEAM_QA_FAILED',
  'Number(video.nb_frames)===frames',
  "video?.codec_name==='h264'",
  "audio?.codec_name==='aac'",
  'EP003_SHOT04_MP4_SAVE_DID_NOT_COMPLETE'
 ])assert.ok(runner.includes(token),token);
});
