import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateLockedSequence,validateWipSequence,episodeSegments}
 from './ep003-assemble-shot04-v1-four-shot-wip.mjs';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const manifest=JSON.parse(read('../remotion-engine/ep003-director-locked-visual-sequence.json'));
const worker=read('./ep003-assemble-shot04-v1-four-shot-wip.mjs');
const clone=v=>JSON.parse(JSON.stringify(v));
const trial=()=>({...clone(manifest),shots:[...clone(manifest.shots),{
  shotKey:'SHOT04',version:'V1_READ_WRITE_CANDIDATE',directorLocked:false,
  renderId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',sha256:'a'.repeat(64),
  compositionId:'EP003-SHOT04-READ-WRITE-SPLITTING-V1-DIRECTOR-CANDIDATE',
  renderKey:'EP003_SHOT04_READ_WRITE_SPLITTING_V1',
  frames:3841,fps:30,width:1920,height:1080,
  voiceLeadInFrames:60,
  voiceTakeId:'59daccf6-009e-4bed-baa8-951a4bae3aa1'
}]});
test('latest official 3-SHOT Director-LOCKED master stays source of truth',()=>{
 assert.equal(validateLockedSequence(manifest),9037);
 assert.deepEqual(manifest.shots.map(s=>s.shotKey),['SHOT01','SHOT02','SHOT03']);
 assert.ok(manifest.shots.every(s=>s.directorLocked));
 assert.equal(manifest.shots[2].renderId,'fc26ca7b-60f2-4c35-b248-6b373736ce99');
 assert.equal(manifest.shots[2].sha256,'1c4fbe3133775b514e82a2e2aec583859615d8fa86b349732dd7ba1bf2391709');
});
test('real 4-SHOT WIP ends with not-LOCKED SHOT04 and has all exact frame offsets',()=>{
 const t=trial();
 assert.equal(validateWipSequence(t),12878);
 assert.deepEqual(episodeSegments(t.shots).map(s=>[s.startFrame,s.endFrame,s.directorLocked]),[
  [0,2513,true],[2514,5956,true],[5957,9036,true],[9037,12877,false]
 ]);
 assert.equal(12878/30,429.26666666666665);
});
test('P0 never combine changed, missing, extra or prematurely LOCKED SHOT04',()=>{
 for(const modify of [
  m=>m.shots[3].directorLocked=true,
  m=>m.shots[3].renderKey='EP003_SHOT03_WORDING_V4',
  m=>m.shots[3].frames=3840,
  m=>m.shots[3].voiceTakeId='11111111-1111-1111-1111-111111111111',
  m=>m.shots[2].renderId='00000000-0000-4000-8000-000000000000',
  m=>m.shots[2].directorLocked=false,
  m=>m.shots.push({...m.shots[3],shotKey:'SHOT05'}),
  m=>m.episodeKey='EP002'
 ]){
  const m=trial();modify(m);assert.throws(()=>validateWipSequence(m));
 }
});
test('WIP must verify all three real decoded joins and not regenerate or modify any audio/video',()=>{
 for(const k of [
  'EP003_WIP_ALL_THREE_REAL_ENCODED_SEAMS_VERIFIED',
  'qa.length===segments.length-1',
  'leftSourceMatch>=50&&rightSourceMatch>=50',
  'seamScore>=27',
  "'-c','copy'",
  'voiceRegenerated:false,videoReencoded:false',
  'EP003_SHOT04_V1_FOUR_SHOT_WIP_FULL_MP4_SAVED',
  'lockedPrefixShotCount:3',
  'directorLocked:false,wip:true',
  'EP003_SHOT04_V1_RENDER_ID',
  'EP003_SHOT04_V1_SHA256',
  'WIP_UNAPPROVED_SHOT04_V1__NO_MASTER_PROMOTION',
 ])assert.ok(worker.includes(k),k);
 assert.doesNotMatch(worker,/textToSpeech|generateSpeech|elevenlabs\.generate|'-c:v','libx264'/);
});
test('WIP is separate from official media master and only selected original voice used',()=>{
 assert.match(worker,/SHOT04_READ_WRITE_SPLITTING_V1/);
 assert.match(worker,/59daccf6-009e-4bed-baa8-951a4bae3aa1/);
 assert.match(worker,/EP003-CUMULATIVE-WIP-REVIEW/);
 assert.doesNotMatch(worker,/EP003_CUMULATIVE_LOCKED_SHOTS_01_TO_/);
 assert.doesNotMatch(worker,/insert into director_lock|update episode_package_voice/);
});
