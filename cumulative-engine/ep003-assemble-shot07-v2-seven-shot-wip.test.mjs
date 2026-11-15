import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateLockedSequence,validateWipSequence,episodeSegments}
 from './ep003-assemble-shot07-v2-seven-shot-wip.mjs';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const locked=JSON.parse(read('../remotion-engine/ep003-director-locked-visual-sequence.json'));
const worker=read('./ep003-assemble-shot07-v2-seven-shot-wip.mjs');
const clone=x=>JSON.parse(JSON.stringify(x));
const candidate=()=>({...clone(locked),shots:[...clone(locked.shots),{
 shotKey:'SHOT07',version:'V2_BOTTLENECK_CANDIDATE',directorLocked:false,
 renderId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',sha256:'a'.repeat(64),
 compositionId:'EP003-SHOT07-BOTTLENECK-V1-DIRECTOR-CANDIDATE',
 renderKey:'EP003_SHOT07_BOTTLENECK_V2',frames:3300,fps:30,width:1920,height:1080,
 voiceLeadInFrames:60,voiceTakeId:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
}]});
test('exact official six-SHOT immutable Director LOCK prefix, SHOT06 MP4 is unchanged',()=>{
 assert.equal(validateLockedSequence(locked),19480);
 assert.deepEqual(locked.shots.map(s=>s.shotKey),[
 'SHOT01','SHOT02','SHOT03','SHOT04','SHOT05','SHOT06']);
 assert.ok(locked.shots.every(x=>x.directorLocked===true));
 assert.equal(locked.shots[5].renderId,'0007bd16-edbf-4ecc-927a-4a5781d0b921');
 assert.equal(locked.shots[5].sha256,'4d38c8a5777b2eeab1952bd8960a925feae0672d142b70b12b2a2df2392d4a3f');
});
test('7-SHOT WIP has same six immutable frame segments, dynamic real voiced SHOT07 duration',()=>{
 const t=candidate();assert.equal(validateWipSequence(t),19480+3300);
 assert.deepEqual(episodeSegments(t.shots).map(s=>[s.startFrame,s.endFrame,s.directorLocked]),[
  [0,2513,true],[2514,5956,true],[5957,9036,true],[9037,12877,true],
  [12878,15878,true],[15879,19479,true],[19480,22779,false]
 ]);
 t.shots[6].frames=3999;
 assert.equal(validateWipSequence(t),19480+3999);
 assert.equal(episodeSegments(t.shots)[6].endFrame,23478);
});
test('fail-close if SHOT07 is prelocked, voice is absent, source changes or wrong shot',()=>{
 const transforms=[
  m=>m.shots[6].directorLocked=true,
  m=>m.shots[5].directorLocked=false,
  m=>m.shots[6].voiceTakeId='NOT_SELECTED',
  m=>m.shots[6].frames=1499,
  m=>m.shots[6].frames=7201,
  m=>m.shots[6].renderKey='EP003_SHOT06_CORRECTNESS_V1',
  m=>m.shots[5].sha256='a'.repeat(64),
  m=>m.shots[6].renderId=m.shots[5].renderId,
  m=>m.shots.push({...m.shots[6],shotKey:'SHOT08'})
 ];
 for(const f of transforms){const m=candidate();f(m);
  assert.throws(()=>validateWipSequence(m));}
});
test('six actual full quality decoded seams with unchanged source pixel identity and no TTS',()=>{
 for(const marker of [
  'EP003_SHOT07_V2_RENDER_ID','EP003_SHOT07_V2_SHA256',
  'S07_RENDER_ID','S07_SHA',
  'EP003_SHOT07_WIP_CURRENT_DIRECTOR_SELECTED_SLOW_VOICE_AND_SHOT06_HANDOFF_REQUIRED',
  'qa.length===segments.length-1','leftSourceMatch>=50&&rightSourceMatch>=50',
  'seamScore>=27','voiceRegenerated:false,videoReencoded:false',
  'EP003_WIP_ALL_SIX_REAL_ENCODED_SEAMS_VERIFIED',
  'EP003_SHOT07_V2_SEVEN_SHOT_WIP_FULL_MP4_SAVED',
  'lockedPrefixShotCount:6',
  'WIP_UNAPPROVED_SHOT07_V2__NO_MASTER_PROMOTION',
  "String(selected.take_id)===candidate.input_props?.voiceTakeId",
  "Number(candidate.input_props?.worldStartFrame)===31452",
 ])assert.ok(worker.includes(marker),marker);
 assert.doesNotMatch(worker,/textToSpeech|elevenlabs\.generate|generateSpeech/);
});
test('preserve only one official 6-SHOT master, 7-SHOT review remains separately keyed WIP',()=>{
 assert.match(worker,/EP003-CUMULATIVE-WIP-REVIEW/);
 assert.match(worker,/EP003_WIP_LOCKED_01_TO_06_PLUS_SHOT07_V2_07/);
 assert.doesNotMatch(worker,/EP003_CUMULATIVE_LOCKED_SHOTS_01_TO_/);
 assert.match(worker,/directorLocked:false,wip:true/);
});
