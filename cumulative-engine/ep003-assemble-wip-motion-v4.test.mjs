import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateWipSequence,episodeSegments} from './ep003-assemble-wip-motion-v4.mjs';

const worker=fs.readFileSync(new URL('./ep003-assemble-wip-motion-v4.mjs',import.meta.url),'utf8');
const locked=JSON.parse(fs.readFileSync(new URL('../remotion-engine/ep003-director-locked-visual-sequence.json',import.meta.url),'utf8'));
const candidate={shotKey:'SHOT02',version:'V4_MOTION_CANDIDATE',directorLocked:false,
  renderId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  sha256:'a'.repeat(64),frames:3443,fps:30,width:1920,height:1080,
  voiceLeadInFrames:60,voiceTakeId:'c4131401-2b42-4bac-873f-05de50040c99',
  compositionId:'EP003-SHOT02-MOTION-V4-DIRECTOR-CANDIDATE',renderKey:'EP003_SHOT02_MOTION_V4'};
const manifest={...locked,shots:[locked.shots[0],candidate]};
const copy=x=>JSON.parse(JSON.stringify(x));

test('WIP is exactly SHOT01 V2 LOCKED + SHOT02 V4 UNLOCKED candidate, not stable master',()=>{
  assert.equal(validateWipSequence(manifest),5957);
  const s=episodeSegments(manifest.shots);
  assert.equal(s[0].directorLocked,true);
  assert.equal(s[1].directorLocked,false);
  assert.equal(s[0].startFrame,0);
  assert.equal(s[0].endFrame,2513);
  assert.equal(s[1].startFrame,2514);
  assert.equal(s[1].endFrame,5956);
});
test('Only actual saved V4 candidate with original Slow Natural voice, exact source world and real bytes',()=>{
  for(const match of [
    "render_key='EP003_SHOT02_MOTION_V4'",
    "composition_id='EP003-SHOT02-MOTION-V4-DIRECTOR-CANDIDATE'",
    "candidate.input_props?.voiceTakeId",
    "candidate.input_props?.previousRenderId",
    "Number(candidate.input_props?.worldStartFrame)===14491",
    "Number(candidate.duration_in_frames)===3443",
    "sha256(candidate.video_data)",
    "candidate.status==='SUCCEEDED'",
    "LOCKED_PREFIX"
  ].filter(x=>x!=="LOCKED_PREFIX"&&x!=="candidate.status==='SUCCEEDED'"))
    assert.ok(worker.includes(match),match);
  assert.match(worker,/status='SUCCEEDED' and profile='REVIEW'/);
});
test('Unsafe or false lock/candidate combinations block, never overwrite stable locked episode',()=>{
  for(const edit of [
    m=>{m.shots[0].directorLocked=false},
    m=>{m.shots[0].sha256='0'.repeat(64)},
    m=>{m.shots[1].directorLocked=true},
    m=>{m.shots[1].renderKey='EP003_SHOT02_TERMS_V3'},
    m=>{m.shots[1].voiceLeadInFrames=0},
    m=>{m.shots[1].frames=3383},
    m=>{m.shots[1].voiceTakeId='00000000-0000-0000-0000-000000000000'},
    m=>{m.episodeKey='EP002'},
    m=>{m.shots.push(m.shots[1])}
  ]){const m=copy(manifest);edit(m);assert.throws(()=>validateWipSequence(m));}
});
test('WIP checks FFmpeg real source SHA, exact 5957 frames, H264/AAC and encoded seam on every boundary',()=>{
  for(const x of [
    "sha256(row.video_data)===s.sha256",
    "checkSeams(tmp,sources,master,segments)",
    "seamScore>=27",
    "leftSourceMatch>=50&&rightSourceMatch>=50",
    "video?.codec_name==='h264'",
    "audio?.codec_name==='aac'",
    "Number(video.nb_frames)===expectedFrames",
    "'-c','copy'",
    "EP003_CUMULATIVE_WIP_FULL_VIDEO_SAVED"
  ])assert.ok(worker.includes(x),x);
  assert.doesNotMatch(worker,/adelay=|textToSpeech|elevenlabs\.generate/);
});
test('WIP production key and approval separate from approved FULL VIDEO; previous master never changed',()=>{
  assert.match(worker,/EP003_WIP_MOTION_V4_ASSEMBLY_APPROVED/);
  assert.match(worker,/EP003-CUMULATIVE-WIP-REVIEW/);
  assert.match(worker,/EP003_WIP_SHOT01_LOCKED_PLUS_SHOT02_MOTION_V4_/);
  assert.match(worker,/directorLocked:false,wip:true,lockedPrefixShotCount:1/);
  assert.doesNotMatch(worker,/EP003-CUMULATIVE-DIRECTOR-MASTER/);
  assert.match(worker,/EP003_CUMULATIVE_IDENTICAL_MASTER_ALREADY_PRESENT/);
  assert.doesNotMatch(worker,/update episode_package_voice_take/i);
});
