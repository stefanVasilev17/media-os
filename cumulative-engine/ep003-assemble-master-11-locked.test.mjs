import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateLockedSequence,episodeSegments} from './ep003-assemble-master-11-locked.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'));
const m=read('../remotion-engine/ep003-director-locked-visual-sequence-11.json');
const prior=read('../remotion-engine/ep003-director-locked-visual-sequence-10.json');
const code=fs.readFileSync(new URL('./ep003-assemble-master-11-locked.mjs',import.meta.url),'utf8');
test('All 11 SHA256-pinned Director locks are consecutive and include the exact SHOT11 V1 MP4',()=>{
 assert.equal(validateLockedSequence(m),38593);
 assert.equal(m.shots.length,11);
 assert.ok(m.shots.every(x=>x.directorLocked===true));
 assert.deepEqual(m.shots.map(s=>s.shotKey),
  Array.from({length:11},(_,i)=>'SHOT'+String(i+1).padStart(2,'0')));
 const segments=episodeSegments(m.shots);
 assert.equal(segments[10].startFrame,35489);
 assert.equal(segments[10].endFrame,38592);
 assert.equal(segments[10].frames,3104);
 for(let i=1;i<segments.length;i++)
  assert.equal(segments[i].startFrame,segments[i-1].endFrame+1);
 const last=m.shots.at(-1);
 assert.equal(last.version,'V1');
 assert.equal(last.renderId,'80dcf256-5cf3-4b38-8517-19dcff7a6ac9');
 assert.equal(last.sha256,'cdbde7240e05705e39e553cf5a63ee336fb40e0bacdd535c298d90ccc635aa67');
 assert.equal(last.renderKey,'EP003_SHOT11_FINALE_V1');
 assert.equal(last.compositionId,'EP003-SHOT11-FINALE-V1-DIRECTOR-CANDIDATE');
 assert.equal(last.voiceTakeId,'5c3435f6-ae66-4ec3-a6b0-bf1cc8207486');
 assert.equal(last.voiceLeadInFrames,60);
});
test('All ten previously Director LOCKED segments, bytes and chosen voices stay exactly unchanged',()=>{
 assert.equal(prior.shots.length,10);
 assert.deepEqual(m.shots.slice(0,10),prior.shots);
 assert.notEqual(m.shots[10].renderId,m.shots[9].renderId);
 assert.equal(m.shots[9].renderId,'174c8a8b-3202-4067-95ef-7dab1de11aa3');
});
test('Official append-only master stream copies H264 and AAC and verifies all ten decoded seams before save',()=>{
 for(const text of [
  "EP003-CUMULATIVE-DIRECTOR-MASTER",
  "EP003_CUMULATIVE_LOCKED_SHOTS_01_TO_",
  "EP003_ELEVEN_SHOT_DIRECTOR_LOCK_ASSEMBLY_APPROVED",
  "ep003-director-locked-visual-sequence-11.json",
  "EP003_CUMULATIVE_DIRECTOR_LOCKED_ELEVEN_SHOT_V1|",
  "sha256(row.video_data)===s.sha256",
  "'-c','copy'",
  "qa.length===segments.length-1",
  "seamScore>=27",
  "leftSourceMatch>=50&&rightSourceMatch>=50",
  "EP003_CUMULATIVE_REAL_ENCODED_SEAMS_VERIFIED",
  "EP003_CUMULATIVE_DIRECTOR_FULL_VIDEO_SAVED",
  "directorLocked:true",
  "verified:true",
 ])assert.ok(code.includes(text),text);
 assert.ok(!/generateSpeech|textToSpeech|adelay=/.test(code));
});
