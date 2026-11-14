import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateLockedSequence,validateWipSequence,episodeSegments}
  from './ep003-assemble-shot03-v4-three-shot-wip.mjs';

const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const locked=JSON.parse(read('../remotion-engine/ep003-director-locked-visual-sequence.json'));
const worker=read('./ep003-assemble-shot03-v4-three-shot-wip.mjs');
const clone=v=>JSON.parse(JSON.stringify(v));
const trial=()=>({...clone(locked),shots:[...clone(locked.shots),{
  shotKey:'SHOT03',version:'V4_WORDING_CANDIDATE',directorLocked:false,
  renderId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  sha256:'a'.repeat(64),
  compositionId:'EP003-SHOT03-WORDING-V4-DIRECTOR-CANDIDATE',
  renderKey:'EP003_SHOT03_WORDING_V4',
  frames:3080,fps:30,width:1920,height:1080,
  voiceLeadInFrames:60,
  voiceTakeId:'63a94494-f134-411a-8e7d-2389ce83a6b4'
}]});

test('original manifest remains exactly two immutable Director-LOCKED source shots',()=>{
  assert.equal(validateLockedSequence(locked),5957);
  assert.deepEqual(locked.shots.map(s=>s.shotKey),['SHOT01','SHOT02']);
  assert.equal(locked.shots[0].renderId,'b6fd7f30-7c78-414b-a88c-387c0ee8c43a');
  assert.equal(locked.shots[1].renderId,'78db6f85-ba05-4714-ba4f-fc70d64def88');
  assert.ok(locked.shots.every(s=>s.directorLocked===true));
});
test('three real SHOTs form a separate WIP with exact cut points, never all locked',()=>{
  const t=trial();
  assert.equal(validateWipSequence(t),9037);
  const seg=episodeSegments(t.shots);
  assert.deepEqual(seg.map(s=>[s.startFrame,s.endFrame,s.directorLocked]),[
    [0,2513,true],[2514,5956,true],[5957,9036,false]
  ]);
  assert.equal(9037/30,301.23333333333335);
  assert.equal(seg[2].voiceLeadInFrames,60);
});
test('unapproved V4 candidate is exact, never substitutes V3, never promoted to official master',()=>{
  for(const modifier of [
    t=>t.shots[2].directorLocked=true,
    t=>t.shots[2].version='V3',
    t=>t.shots[2].renderKey='EP003_SHOT03_PRIMARY_CLARITY_V3',
    t=>t.shots[2].voiceTakeId='00000000-0000-0000-0000-000000000000',
    t=>t.shots[2].frames=3079,
    t=>t.shots[1].directorLocked=false,
    t=>t.shots[0].renderId='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    t=>t.shots.push({...t.shots[2],shotKey:'SHOT04'}),
    t=>t.episodeKey='EP002',
  ]){
    const t=trial();modifier(t);assert.throws(()=>validateWipSequence(t));
  }
});
test('two raw frame joins validated, source pixels preserved, audio never regenerated',()=>{
  for(const token of [
    "const qa=await checkSeams(tmp,sources,master,segments)",
    "seamScore>=27",
    "leftSourceMatch>=50&&rightSourceMatch>=50",
    "qa.length===segments.length-1",
    "'-c','copy'",
    "voiceRegenerated:false,videoReencoded:false",
    "Number(video.nb_frames)===expectedFrames",
    "video?.codec_name==='h264'",
    "audio?.codec_name==='aac'",
  ])assert.ok(worker.includes(token),token);
  assert.doesNotMatch(worker,/textToSpeech|generateSpeech|elevenlabs\.generate|'-c:v','libx264'/);
});
test('output is separate WIP render with verified two-shot Director-LOCKED prefix',()=>{
  for(const token of [
    "COMPOSITION='EP003-CUMULATIVE-WIP-REVIEW'",
    "RENDER_KEY='EP003_WIP_LOCKED_01_02_PLUS_SHOT03_WORDING_V4_03'",
    "EP003_SHOT03_V4_RENDER_ID",
    "EP003_SHOT03_V4_SHA256",
    "lockedPrefixShotCount:2",
    "directorLocked:false,wip:true",
    "EP003_SHOT03_V4_THREE_SHOT_WIP_FULL_MP4_SAVED",
    "EP003_WIP_BOTH_REAL_ENCODED_SEAMS_VERIFIED",
    "WIP_UNAPPROVED_SHOT03_V4__NO_MASTER_PROMOTION",
  ])assert.ok(worker.includes(token),token);
  assert.doesNotMatch(worker,/insert into director_lock|update episode_package_voice|EP003_CUMULATIVE_LOCKED_SHOTS_01_TO_/);
});
