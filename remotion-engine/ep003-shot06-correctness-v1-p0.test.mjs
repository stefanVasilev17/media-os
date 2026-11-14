import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {shot10TextWidth} from './shot10-content-fit-layout.mjs';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const scene=read('./src/episodes/ep003/Shot06CorrectnessBeforeSpeedV1.tsx');
const render=read('./ep003-shot06-correctness-v1-render-once.mjs');
const root=read('./src/Root.tsx');
const voice=JSON.parse(read('../backend/src/main/resources/ep003-director-locked-voice-package-v1.json'));
const shot=voice.shots.find(s=>s.shotKey==='SHOT06');

test('P0: original locked SHOT06 correctness script and real selected Slow Natural voice only',()=>{
 assert.equal(shot.title,'Correctness Before Speed');
 for(const s of [
  'We now face a choice.',
  'This is a question of data consistency.',
  'Another system could use version information to verify that a replica has applied a particular change',
  'That last approach is called fail closed.',
  'And using the Primary is not a magical guarantee by itself.',
  'Now we are ready to measure what our replicas actually achieved.'
 ])assert.ok(shot.narration.includes(s),s);
 for(const s of [
  "EP003_SHOT06_NO_SELECTED_SLOW_NATURAL_TAKE",
  "ELEVEN_V4_AUTO_SLOW_NATURAL_PAUSES_V1",
  "REAL_ELEVENLABS_ALIGNMENT_MISSING",
  "cueFramesFromRealVoice(source.timing)",
  "EP003_SHOT06_DIRECTOR_LOCKED_SCRIPT_MISMATCH",
  "LEAD_IN_FRAMES=60","adelay=2000:all=1",
 ])assert.ok(render.includes(s),s);
 assert.doesNotMatch(render,/elevenlabs\.generate|generateSpeech|textToSpeech/);
});
test('P0: SHA-pinned SHOT05 last frame, world continuity and inherited original paths',()=>{
 for(const s of [
  "renderId:'04b9f55a-7705-4f23-b9f7-a0103e8c955b'",
  "sha256:'9520b347778413b3a4e9cbeed8eda513102c9f03eecf423638a4406d88841d62'",
  "previousWorldLastFrame:24852+3001-1",
  "frame===0&&<AbsoluteFill",
  "translate3d(-7px,0,0) scale(1.007)",
  "Shot07CleanArchitectureWorld frame={worldFrame} replicaGrowth={0}",
  "dbStress={.2}",
  "const age=3080-1+3841-1+EP003_SHOT06_PREDECESSOR.frames-1+frame",
  "const dashOffset=-(3080+3841-1+EP003_SHOT06_PREDECESSOR.frames-1+frame)*.74",
  "THE REPLICA GIVES A WRONG ANSWER",
  "CORRECTNESS BEFORE SPEED",
  "const heading=ease(frame,props.cueFrames.FASTEST,75)"
 ])assert.ok(scene.includes(s),s);
 for(const s of [
  "PIN='04b9f55a-7705-4f23-b9f7-a0103e8c955b'",
  "PIN_SHA='9520b347778413b3a4e9cbeed8eda513102c9f03eecf423638a4406d88841d62'",
  "worldStartFrame:27852","select=eq","3000",
  "previous.render_key==='EP003_SHOT05_STALE_READ_V1'",
 ])assert.ok(render.includes(s),s);
 assert.doesNotMatch(scene,/1-ease\(frame,0,55\)/);
});
test('P0: original physical database replica cylinders, no double containers or unrelated request dot',()=>{
 for(const s of [
   'Shot07CleanArchitectureWorld',
   'ellipse cx="45" cy="17" rx="29" ry="11"',
   'M16 17V65Q45 83 74 65V17M16 40Q45 58 74 40',
   'REPLICA A','REPLICA B','PRIMARY DATABASE</div>',
   'const replicaPath=','const bezier=','point=bezier(phase,r)',
   'cx={point.x} cy={point.y}','const QUERY_PATHS=',
   'QUERY_LINE_MUST_BE_PHYSICAL_BEZIER',
   'REPLICA_CONTAINER_NESTING_OR_COLLISION',
   'CARD_OVERLAPS_NODE','CARD_OVERLAPS_LEGEND'
 ])assert.ok(scene.includes(s),s);
 assert.doesNotMatch(scene,/new RequestParticle|RejectionParticle|Math\.random\(|ACCOUNT DATA COPY/);
});
test('P0: all onscreen cards are width-measured, non-clipping, no overlap with architecture',()=>{
 const cards=[
  ['CONSISTENCY GUARANTEE','Which version can this operation trust?'],
  ['SECURITY CHECK','Use verified account status'],
  ['NONCRITICAL READ','Display language can allow some delay'],
  ['REPLICA VERSION CHECK','Trust a replica only after it catches up'],
  ['FAIL CLOSED','Reject when account state is not verified'],
  ['SAFETY HAS A COST','Latency, Primary load or availability'],
  ['PRIMARY IS NOT MAGIC','Transactions and leadership still matter'],
  ['MEASURE THE REAL GAIN','Did replicas improve safe Login capacity?']
 ];
 for(const [title,text] of cards){
   assert.ok(scene.includes("title:'"+title+"'"),title);
   assert.ok(scene.includes("meaning:'"+text+"'"),text);
   const width=Math.ceil(Math.max(shot10TextWidth(title,23),shot10TextWidth(text,29))+80);
   assert.ok(width>=320&&width<=900&&560+width<=1480,title+' actualWidth='+width);
 }
 for(const s of ['EP003_SHOT06_CARD_TEXT_OVERFLOW','EP003_SHOT06_CARD_OVERLAPS_NODE',
  'EP003_SHOT06_CARD_OUTSIDE_FRAME','ep003CardIsReadable','whiteSpace:\'nowrap\''])
  assert.ok(scene.includes(s),s);
 for(const s of ['PRIMARY STATUS: LOCKED','FALLBACK → PRIMARY','READ → PRIMARY','SECURITY: FAIL CLOSED',
   'REPLICA A: MAY CATCH UP','REPLICA A: VERSION MISSING']){
   const max=s.startsWith('REPLICA')?445:325;
   assert.ok(shot10TextWidth(s,21)<max,s+' exceeds '+max);
 }
});
test('P0: no arbitrary decision shortcut; path-based semantics explain consistency and tradeoffs',()=>{
 for(const s of [
  'replicaNeedsVersion','cues.VERSION_CHECK','cues.MISSING_VERSION',
  'cues.PRIMARY_FALLBACK','cues.REJECT','failClosed',
  'cues.ACCOUNT_SECURITY','CONSISTENCY GUARANTEE',
  'FAIL CLOSED','PRIMARY IS NOT MAGIC','MEASURE THE REAL GAIN'
 ])assert.ok(scene.includes(s),s);
});
test('P0: 22 semantic cues must use original word level alignment and keep ordered story beats',()=>{
 const expected=['INTRO','FASTEST','GUARANTEES','CONSISTENCY','VERSION',
  'ACCOUNT_SECURITY','PRIMARY_AUTH','PREFERENCE','VERSION_CHECK','MISSING_VERSION',
  'WAIT','PRIMARY_FALLBACK','REJECT','FAIL_CLOSED','WHEN_UNSAFE','COST',
  'TRADEOFFS','BALANCE','NOT_MAGIC','REAL_QUESTION','MORE_USERS','MEASURE'];
 for(const cue of expected){
  assert.ok(scene.includes("'"+cue+"'"),'missing scene cue '+cue);
  assert.ok(render.includes(cue+':'),'missing voice cue '+cue);
 }
 assert.ok(scene.includes('EP003_SHOT06_REAL_VOICE_CUE_INVALID_'));
 assert.ok(render.includes("voiceTakeId:source.take_id"));
});
test('P0: actual MP4 codec/frame and first-seam dynamic motion, no early static cover, no automatic LOCK',()=>{
 for(const s of [
  'EP003_SHOT06_V1_REAL_MP4_SAVED',
  'EP003_SHOT06_P0_REAL_SEAM_AND_MOTION_QA',
  'EP003_SHOT06_ACTUAL_DECODED_FIRST_FRAME_SEAM_QA_FAILED',
  "video?.codec_name==='h264'", "audio?.codec_name==='aac'",
  "Number(video.nb_frames)===frames","motion.uniqueMovingSteps>=18",
  'motion.firstStep>0.12&&motion.firstStep<4.5',
  'EP003_SHOT06_MP4_SAVE_DID_NOT_COMPLETE',
  'EP003-SHOT06-CORRECTNESS-V1-DIRECTOR-CANDIDATE'
 ])assert.ok((render+root).includes(s),s);
 assert.ok(root.includes('component={Ep003Shot06CorrectnessBeforeSpeedV1}'));
 assert.doesNotMatch(render,/directorLocked:true|update director_lock/);
});
