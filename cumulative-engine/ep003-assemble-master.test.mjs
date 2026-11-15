import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateLockedSequence,episodeSegments} from './ep003-assemble-master.mjs';

const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const manifest=JSON.parse(read('../remotion-engine/ep003-director-locked-visual-sequence.json'));
const worker=read('./ep003-assemble-master.mjs');
const clone=v=>JSON.parse(JSON.stringify(v));

test('Director explicitly LOCKED exactly the first SEVEN real EP003 shots in order',()=>{
 assert.equal(validateLockedSequence(manifest),22956);
 assert.deepEqual(manifest.shots.map(s=>s.shotKey),['SHOT01','SHOT02','SHOT03','SHOT04','SHOT05','SHOT06','SHOT07']);
 assert.ok(manifest.shots.every(s=>s.directorLocked===true));
 assert.deepEqual(manifest.shots.map(s=>s.version),['V2','V4','V4','V1','V1','V1','V3']);
 assert.deepEqual(manifest.shots.map(s=>s.frames),[2514,3443,3080,3841,3001,3601,3476]);
 assert.equal(22956/30,765.2);
});
test('SHA-pinned exact approved source bytes and original voice takes never mutate',()=>{
 const [one,two,three,four,five,six,seven]=manifest.shots;
 assert.equal(one.renderId,'b6fd7f30-7c78-414b-a88c-387c0ee8c43a');
 assert.equal(one.sha256,'da6d3cbc77dc3a0dc5374aec4a7ba8beb97739d4c5facffdf36d1585e7587c08');
 assert.equal(two.renderId,'78db6f85-ba05-4714-ba4f-fc70d64def88');
 assert.equal(two.sha256,'5eceeb39954b9a5b6d755d136b3dd29fe04b5fc9e30992fcc65464f40bc2914e');
 assert.equal(two.voiceTakeId,'c4131401-2b42-4bac-873f-05de50040c99');
 assert.equal(three.renderId,'fc26ca7b-60f2-4c35-b248-6b373736ce99');
 assert.equal(three.sha256,'1c4fbe3133775b514e82a2e2aec583859615d8fa86b349732dd7ba1bf2391709');
 assert.equal(three.compositionId,'EP003-SHOT03-WORDING-V4-DIRECTOR-CANDIDATE');
 assert.equal(three.renderKey,'EP003_SHOT03_WORDING_V4');
 assert.equal(three.voiceTakeId,'63a94494-f134-411a-8e7d-2389ce83a6b4');
 assert.equal(three.voiceLeadInFrames,60);
 assert.equal(four.renderId,'4079729b-c1b3-405c-9a83-1ace0ef25641');
 assert.equal(four.sha256,'61fd35dc6662b259818b6d29379b39948a7239fa6588f7c23a010b97a7a5a5f3');
 assert.equal(four.renderKey,'EP003_SHOT04_READ_WRITE_SPLITTING_V1');
 assert.equal(four.compositionId,'EP003-SHOT04-READ-WRITE-SPLITTING-V1-DIRECTOR-CANDIDATE');
 assert.equal(four.frames,3841);
 assert.equal(four.voiceTakeId,'59daccf6-009e-4bed-baa8-951a4bae3aa1');
 assert.equal(four.voiceLeadInFrames,60);
 assert.equal(five.renderId,'04b9f55a-7705-4f23-b9f7-a0103e8c955b');
 assert.equal(five.sha256,'9520b347778413b3a4e9cbeed8eda513102c9f03eecf423638a4406d88841d62');
 assert.equal(five.compositionId,'EP003-SHOT05-STALE-READ-V1-DIRECTOR-CANDIDATE');
 assert.equal(five.renderKey,'EP003_SHOT05_STALE_READ_V1');
 assert.equal(five.frames,3001);
 assert.equal(five.voiceTakeId,'da70458f-6728-4437-953c-58113c8aae8d');
 assert.equal(five.voiceLeadInFrames,60);
 assert.equal(six.renderId,'0007bd16-edbf-4ecc-927a-4a5781d0b921');
 assert.equal(six.sha256,'4d38c8a5777b2eeab1952bd8960a925feae0672d142b70b12b2a2df2392d4a3f');
 assert.equal(six.renderKey,'EP003_SHOT06_CORRECTNESS_V1');
 assert.equal(six.compositionId,'EP003-SHOT06-CORRECTNESS-V1-DIRECTOR-CANDIDATE');
 assert.equal(six.frames,3601);
 assert.equal(six.voiceTakeId,'ff8ed53c-f405-43d5-82d9-33cac97cd811');
 assert.equal(six.voiceLeadInFrames,60);
 assert.equal(two.voiceLeadInFrames,60);
 assert.equal(seven.renderId,'09457c3c-32d9-432c-aa92-67f0e7b13f60');
 assert.equal(seven.sha256,'7f7429a6a4117c49b4338dec256eae72fbe5e269728729dfdb23ab63e6ba27f8');
 assert.equal(seven.voiceTakeId,'63164f77-e4cb-4f34-952e-817b671f0a59');
 assert.equal(seven.frames,3476);
 assert.equal(seven.renderKey,'EP003_SHOT07_BOTTLENECK_V3');
 assert.equal(seven.compositionId,'EP003-SHOT07-BOTTLENECK-V3-DIRECTOR-CANDIDATE');
 assert.equal(seven.voiceLeadInFrames,60);
 assert.match(worker,/sha256\(row\.video_data\)===s\.sha256/);
});
test('Source sequence is frame contiguous with six actual seam positions',()=>{
 const s=episodeSegments(manifest.shots);
 assert.deepEqual(s.map(x=>[x.startFrame,x.endFrame,x.directorLocked]),[
  [0,2513,true],[2514,5956,true],[5957,9036,true],[9037,12877,true],[12878,15878,true],[15879,19479,true],[19480,22955,true]]);
 assert.equal(s[1].startFrame/30,83.8);
 assert.equal(s[2].startFrame/30,198.56666666666666);
 assert.equal(s[1].voiceLeadInFrames,60);
 assert.equal(s[2].voiceLeadInFrames,60);
 assert.equal(s[3].startFrame/30,301.23333333333335);
 assert.equal(s[3].voiceLeadInFrames,60);
 assert.equal(s[4].startFrame/30,429.26666666666665);
 assert.equal(s[4].voiceLeadInFrames,60);
 assert.equal(s[5].startFrame/30,529.3);
 assert.equal(s[5].voiceLeadInFrames,60);
 assert.equal(s[6].startFrame,19480);
 assert.equal(s[6].endFrame,22955);
 assert.match(worker,/'-c','copy'/);
 assert.doesNotMatch(worker,/adelay=|apad=|afade=|textToSpeech|elevenlabs|generateSpeech/);
});
test('Fail closed on any accidental unlocking, changed hash, wrong version, missing source or gap',()=>{
 for(const patch of [
  m=>{m.shots[0].directorLocked=false;},
  m=>{m.shots[1].directorLocked=false;},
  m=>{m.shots[2].directorLocked=false;},
  m=>{m.shots[3].directorLocked=false;},
  m=>{m.shots[4].directorLocked=false;},
  m=>{m.shots[5].directorLocked=false;},
  m=>{m.shots[6].directorLocked=false;},
  m=>{m.shots[5].renderId=m.shots[4].renderId;},
  m=>{m.shots[4].renderId=m.shots[3].renderId;},
  m=>{m.shots[3].renderId=m.shots[2].renderId;},
  m=>{m.shots[2].shotKey='SHOT04';},
  m=>{m.shots[2].renderId=m.shots[1].renderId;},
  m=>{m.shots[1].sha256='0'.repeat(64);},
  m=>{m.shots.splice(1,1);},
  m=>{m.episodeKey='EP002';},
 ]){
  const m=clone(manifest);patch(m);assert.throws(()=>validateLockedSequence(m));
 }
});
test('Next SHOT08 requires a new unique Director-LOCKED entry, never silent promotion',()=>{
 const m=clone(manifest);
 m.shots.push({shotKey:'SHOT08',version:'V1',directorLocked:true,
   renderId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   compositionId:'EP003-SHOT08-DIRECTOR-CANDIDATE',renderKey:'EP003_SHOT08_V1',
   sha256:'a'.repeat(64),frames:2400,fps:30,width:1920,height:1080,
   voiceTakeId:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'});
 assert.equal(validateLockedSequence(m),25356);
 assert.equal(episodeSegments(m.shots)[7].startFrame,22956);
 m.shots[7].directorLocked=false;
 assert.throws(()=>validateLockedSequence(m));
});
test('FFmpeg H264/AAC stream-copy verifies all six actual decoded seams and unchanged pixels',()=>{
 for(const required of [
  "video?.codec_name==='h264'",
  "audio?.codec_name==='aac'",
  "video.width===1920",
  "video.height===1080",
  "Number(video.nb_frames)===expectedFrames",
  "Math.abs(Number(video.duration)-expectedFrames/FPS)<0.11",
  "checkSeams(tmp,sources,master,segments)",
  "qa.length===segments.length-1",
  "leftSourceMatch>=50&&rightSourceMatch>=50",
  "seamScore>=27",
  "sourceRenderIds:segments.map(s=>s.renderId)"
 ])assert.ok(worker.includes(required),required);
 assert.match(worker,/select=eq\(n/);
});
test('New cumulative master has a locked 07 render key, old masters remain stored',()=>{
 for(const required of [
  'EP003_CUMULATIVE_MASTER_ASSEMBLY_APPROVED',
  'EP003_CUMULATIVE_DIRECTOR_RENDER_AUTHORIZATION_REQUIRED',
  'EP003_CUMULATIVE_IDENTICAL_MASTER_ALREADY_PRESENT',
  'EP003_CUMULATIVE_REAL_DIRECTOR_LOCKED_SOURCES_VERIFIED',
  'EP003_CUMULATIVE_REAL_ENCODED_SEAMS_VERIFIED',
  'EP003_CUMULATIVE_DIRECTOR_FULL_VIDEO_SAVED',
  'EP003-CUMULATIVE-DIRECTOR-MASTER',
  'EP003_CUMULATIVE_LOCKED_SHOTS_01_TO_',
  'EP003_CUMULATIVE_PRIOR_SAME_LOCK_MANIFEST_NOT_SUCCEEDED__NO_AUTO_RETRY'
 ])assert.ok(worker.includes(required),required);
 assert.ok(worker.includes("path.basename(p)"));
 assert.doesNotMatch(worker,/update episode_package_voice_take|\baws\b|\bgenerate_tts\b/);
});
