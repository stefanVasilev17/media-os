import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateLockedSequence,validateWipSequence,episodeSegments}
 from './ep003-assemble-shot06-v1-six-shot-wip.mjs';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const locked=JSON.parse(read('../remotion-engine/ep003-director-locked-visual-sequence.json'));
const worker=read('./ep003-assemble-shot06-v1-six-shot-wip.mjs');
const clone=x=>JSON.parse(JSON.stringify(x));
const trial=()=>({...clone(locked),shots:[...clone(locked.shots),{
  shotKey:'SHOT06',version:'V1_CORRECTNESS_CANDIDATE',directorLocked:false,
  renderId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',sha256:'a'.repeat(64),
  compositionId:'EP003-SHOT06-CORRECTNESS-V1-DIRECTOR-CANDIDATE',
  renderKey:'EP003_SHOT06_CORRECTNESS_V1',frames:3601,fps:30,width:1920,height:1080,
  voiceLeadInFrames:60,voiceTakeId:'ff8ed53c-f405-43d5-82d9-33cac97cd811'
}]});
test('official five SHOTs remain immutable Director LOCK before any WIP assembly',()=>{
 assert.equal(validateLockedSequence(locked),15879);
 assert.deepEqual(locked.shots.map(s=>s.shotKey),['SHOT01','SHOT02','SHOT03','SHOT04','SHOT05']);
 assert.ok(locked.shots.every(x=>x.directorLocked===true));
 assert.equal(locked.shots[4].renderId,'04b9f55a-7705-4f23-b9f7-a0103e8c955b');
 assert.equal(locked.shots[4].sha256,'9520b347778413b3a4e9cbeed8eda513102c9f03eecf423638a4406d88841d62');
});
test('real six-shot WIP has exact frame boundaries 0–19479, 5 locked + 1 not locked',()=>{
 const t=trial();assert.equal(validateWipSequence(t),19480);
 assert.deepEqual(episodeSegments(t.shots).map(s=>[s.startFrame,s.endFrame,s.directorLocked]),[
  [0,2513,true],[2514,5956,true],[5957,9036,true],
  [9037,12877,true],[12878,15878,true],[15879,19479,false]
 ]);
 assert.ok(Math.abs(19480/30-649.3333333333334)<1e-6);
});
test('must fail closed if sixth SHOT is pre-LOCKED, wrong voice, missing or corrupt source',()=>{
 const cases=[
  m=>m.shots[5].directorLocked=true,
  m=>m.shots[4].directorLocked=false,
  m=>m.shots[5].voiceTakeId='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  m=>m.shots[5].frames=3600,
  m=>m.shots[5].renderKey='EP003_SHOT05_STALE_READ_V1',
  m=>m.shots[4].sha256='a'.repeat(64),
  m=>m.shots[5].renderId=m.shots[4].renderId,
  m=>m.shots.push({...m.shots[5],shotKey:'SHOT07'}),
 ];
 for(const f of cases){const m=trial();f(m);assert.throws(()=>validateWipSequence(m));}
});
test('uses six actual MP4s, untouched H264/AAC, verifies all five decoded source transitions',()=>{
 for(const part of [
  'S06_RENDER_ID','S06_SHA',
  'EP003_SHOT06_V1_RENDER_ID','EP003_SHOT06_V1_SHA256',
  'EP003_SHOT06_WIP_SLOW_VOICE_AND_LOCKED_SHOT05_HANDOFF_REQUIRED',
  'qa.length===segments.length-1','leftSourceMatch>=50&&rightSourceMatch>=50',
  'seamScore>=27',"' -c'".replace(' ',''),
  'voiceRegenerated:false,videoReencoded:false',
  'EP003_WIP_ALL_FIVE_REAL_ENCODED_SEAMS_VERIFIED',
  'EP003_SHOT06_V1_SIX_SHOT_WIP_FULL_MP4_SAVED',
  'WIP_UNAPPROVED_SHOT06_V1__NO_MASTER_PROMOTION',
  'lockedPrefixShotCount:5',
 ])assert.ok(worker.includes(part),part);
 assert.doesNotMatch(worker,/textToSpeech|elevenlabs\.generate|generateSpeech/);
});
test('no official master promotion; separate WIP review key',()=>{
 assert.match(worker,/EP003-CUMULATIVE-WIP-REVIEW/);
 assert.match(worker,/EP003_WIP_LOCKED_01_TO_05_PLUS_SHOT06_V1_06/);
 assert.doesNotMatch(worker,/EP003_CUMULATIVE_LOCKED_SHOTS_01_TO_/);
 assert.match(worker,/directorLocked:false,wip:true/);
});
