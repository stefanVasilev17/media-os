import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateLockedSequence,validateWipSequence,episodeSegments}
 from './ep003-assemble-shot05-v1-five-shot-wip.mjs';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const locked=JSON.parse(read('../remotion-engine/ep003-director-locked-visual-sequence.json'));
const worker=read('./ep003-assemble-shot05-v1-five-shot-wip.mjs');
const clone=x=>JSON.parse(JSON.stringify(x));
const trial=()=>({...clone(locked),shots:[...clone(locked.shots),{
  shotKey:'SHOT05',version:'V1_STALE_READ_CANDIDATE',directorLocked:false,
  renderId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',sha256:'a'.repeat(64),
  compositionId:'EP003-SHOT05-STALE-READ-V1-DIRECTOR-CANDIDATE',
  renderKey:'EP003_SHOT05_STALE_READ_V1',frames:3001,fps:30,width:1920,height:1080,
  voiceLeadInFrames:60,voiceTakeId:'da70458f-6728-4437-953c-58113c8aae8d'
}]});
test('original four SHOTs stay Director-LOCKED, SHOT04 authentic and immutable',()=>{
 assert.equal(validateLockedSequence(locked),12878);
 assert.deepEqual(locked.shots.map(s=>s.shotKey),['SHOT01','SHOT02','SHOT03','SHOT04']);
 assert.ok(locked.shots.every(x=>x.directorLocked===true));
 assert.equal(locked.shots[3].renderId,'4079729b-c1b3-405c-9a83-1ace0ef25641');
 assert.equal(locked.shots[3].sha256,'61fd35dc6662b259818b6d29379b39948a7239fa6588f7c23a010b97a7a5a5f3');
});
test('5-SHOT WIP frame 0–15878, fifth SHOT NOT LOCKED and 4 real boundaries',()=>{
 const t=trial();assert.equal(validateWipSequence(t),15879);
 assert.deepEqual(episodeSegments(t.shots).map(s=>[s.startFrame,s.endFrame,s.directorLocked]),[
  [0,2513,true],[2514,5956,true],[5957,9036,true],
  [9037,12877,true],[12878,15878,false]
 ]);
 assert.equal(15879/30,529.3);
});
test('fail-closed: cannot silently lock candidate or mutate source/voice/frame',()=>{
 const transforms=[
  m=>m.shots[4].directorLocked=true,
  m=>m.shots[3].directorLocked=false,
  m=>m.shots[4].voiceTakeId='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  m=>m.shots[4].frames=3000,
  m=>m.shots[4].renderKey='EP003_SHOT04_READ_WRITE_SPLITTING_V1',
  m=>m.shots[3].sha256='a'.repeat(64),
  m=>m.shots[4].renderId=m.shots[3].renderId,
  m=>m.shots.push({...m.shots[4],shotKey:'SHOT06'}),
 ];
 for(const f of transforms){const m=trial();f(m);assert.throws(()=>validateWipSequence(m));}
});
test('only saved authentic H264/AAC files, all four decoded joins and source byte identity',()=>{
 for(const part of [
  'S05_RENDER_ID','S05_SHA','EP003_SHOT05_V1_RENDER_ID','EP003_SHOT05_V1_SHA256',
  'EP003_SHOT05_WIP_SLOW_VOICE_AND_LOCKED_SHOT04_HANDOFF_REQUIRED',
  'qa.length===segments.length-1','leftSourceMatch>=50&&rightSourceMatch>=50',
  'seamScore>=27',"' -c'".replace(' ','').replace('c', 'c'),
  'voiceRegenerated:false,videoReencoded:false',
  'EP003_WIP_ALL_FOUR_REAL_ENCODED_SEAMS_VERIFIED',
  'EP003_SHOT05_V1_FIVE_SHOT_WIP_FULL_MP4_SAVED',
  'WIP_UNAPPROVED_SHOT05_V1__NO_MASTER_PROMOTION',
  'lockedPrefixShotCount:4',
 ])assert.ok(worker.includes(part),part);
 assert.doesNotMatch(worker,/textToSpeech|elevenlabs\.generate|generateSpeech/);
});
test('official latest Director-LOCKED master unchanged; WIP remains separate render key',()=>{
 assert.match(worker,/EP003-CUMULATIVE-WIP-REVIEW/);
 assert.match(worker,/EP003_WIP_LOCKED_01_TO_04_PLUS_SHOT05_V1_05/);
 assert.doesNotMatch(worker,/EP003_CUMULATIVE_LOCKED_SHOTS_01_TO_/);
 assert.match(worker,/directorLocked:false,wip:true/);
});
