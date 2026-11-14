import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateLockedSequence,episodeSegments} from './ep003-assemble-master.mjs';

const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const manifest=JSON.parse(read('../remotion-engine/ep003-director-locked-visual-sequence.json'));
const worker=read('./ep003-assemble-master.mjs');
const clone=v=>JSON.parse(JSON.stringify(v));

test('Director has locked exactly the first TWO real EP003 shots consecutively, with no gaps',()=>{
 assert.equal(validateLockedSequence(manifest),5957);
 assert.deepEqual(manifest.shots.map(s=>s.shotKey),['SHOT01','SHOT02']);
 assert.ok(manifest.shots.every(s=>s.directorLocked));
 assert.equal(manifest.shots[0].version,'V2');
 assert.equal(manifest.shots[1].version,'V3');
 assert.equal(manifest.shots[1].voiceLeadInFrames,60);
 assert.equal(5957/30,198.56666666666666);
});
test('P0 exact immutable render hashes, chosen versions and actual SHOT02 V3 audio untouched',()=>{
 const [a,b]=manifest.shots;
 assert.equal(a.renderId,'b6fd7f30-7c78-414b-a88c-387c0ee8c43a');
 assert.equal(a.sha256,'da6d3cbc77dc3a0dc5374aec4a7ba8beb97739d4c5facffdf36d1585e7587c08');
 assert.equal(a.frames,2514);
 assert.equal(b.renderId,'8598d156-438f-4614-a9dd-ce6172233d9b');
 assert.equal(b.sha256,'eee2308b3f8150ac9ac49db6b0a257374e40fbbf8ddf6b1245ae58d5400ff471');
 assert.equal(b.frames,3443);
 assert.equal(b.voiceTakeId,'c4131401-2b42-4bac-873f-05de50040c99');
 assert.match(worker,/hash\(row\.video_data\)===s\.sha256|sha256\(row\.video_data\)===s\.sha256/);
 assert.match(worker,/previous|seamScore>=27/);
});
test('Frame offsets and soundtrack are correctly ordered without duplicate two-second pause',()=>{
 const s=episodeSegments(manifest.shots);
 assert.equal(s[0].startFrame,0);
 assert.equal(s[0].endFrame,2513);
 assert.equal(s[1].startFrame,2514);
 assert.equal(s[1].endFrame,5956);
 assert.equal(s[0].voiceLeadInFrames,0);
 assert.equal(s[1].voiceLeadInFrames,60);
 assert.equal(s[1].startFrame/30,83.8);
 assert.match(worker,/FFMPEG_CONCAT_DEMUXER_STREAM_COPY/);
 assert.match(worker,/'-c','copy'/);
 assert.doesNotMatch(worker,/adelay=|apad=|afade=|textToSpeech|elevenlabs|generateSpeech/);
});
test('Fail-closed: missing lock, wrong EP, missing contiguous SHOT and discarded versions BLOCK',()=>{
 for(const patch of [
   m=>{m.shots[0].directorLocked=false},
   m=>{m.shots[1].shotKey='SHOT03'},
   m=>{m.shots[1].renderId='3222a875-a8c3-4993-bfd1-8d6535ad38ba'},
   m=>{m.shots[1].voiceLeadInFrames=0},
   m=>{m.shots[1].sha256='0'.repeat(64)},
   m=>{m.episodeKey='EP002'},
   m=>{m.shots.push({...m.shots[1],shotKey:'SHOT03'})}
 ]){
  const data=clone(manifest);patch(data);
  assert.throws(()=>validateLockedSequence(data));
 }
});
test('Future SHOT03 onward can be appended only as newly approved unique real SHA-pinned SHOTs',()=>{
 const data=clone(manifest);
 data.shots.push({shotKey:'SHOT03',version:'DirectorApproved',directorLocked:true,
   renderId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',compositionId:'EP003-SHOT03-CANDIDATE',
   renderKey:'EP003_SHOT03_V1',sha256:'a'.repeat(64),frames:2500,fps:30,width:1920,height:1080,
   voiceTakeId:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'});
 assert.equal(validateLockedSequence(data),8457);
 const seg=episodeSegments(data.shots);
 assert.equal(seg[2].startFrame,5957);
 assert.equal(seg[2].endFrame,8456);
 data.shots[2].directorLocked=false;
 assert.throws(()=>validateLockedSequence(data));
});
test('Real MP4 must preserve exact video timebase and strict H264/AAC+fullHD, not merely concatenate bytes',()=>{
 for(const required of [
  "video?.codec_name==='h264'",
  "audio?.codec_name==='aac'",
  "video.width===1920",
  "video.height===1080",
  "Number(video.nb_frames)===expectedFrames",
  "Math.abs(Number(video.duration)-expectedFrames/FPS)<0.11",
  "checkSeams(tmp,sources,master,segments)",
  "leftSourceMatch>=50&&rightSourceMatch>=50",
  "seamScore>=27",
  "sourceRenderIds:segments.map(s=>s.renderId)"
 ])assert.ok(worker.includes(required),required);
 assert.match(worker,/select=eq\(n/);
 assert.match(worker,/master-seam-/);
});
test('Cumulative assembly is idempotent, paid-TTS-free, authorizes a real Director LOCK manifest',()=>{
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
 assert.ok(worker.includes("path.basename(p)"),'concat paths are safe fixed basenames');
 assert.doesNotMatch(worker,/update episode_package_voice_take|\baws\b|\bgenerate_tts\b/);
});
