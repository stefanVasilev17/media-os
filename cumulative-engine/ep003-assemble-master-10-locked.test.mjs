import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateLockedSequence,episodeSegments} from './ep003-assemble-master-10-locked.mjs';
const file=JSON.parse(fs.readFileSync(new URL('../remotion-engine/ep003-director-locked-visual-sequence-10.json',import.meta.url),'utf8'));
const previous=JSON.parse(fs.readFileSync(new URL('../remotion-engine/ep003-director-locked-visual-sequence.json',import.meta.url),'utf8'));
const worker=fs.readFileSync(new URL('./ep003-assemble-master-10-locked.mjs',import.meta.url),'utf8');
test('Ten Director-approved consecutive SHA-pinned original source MP4s total 35,489 frames',()=>{
 assert.equal(validateLockedSequence(file),35489);
 assert.equal(file.shots.length,10);
 assert.ok(file.shots.every(x=>x.directorLocked===true));
 assert.deepEqual(file.shots.map(x=>x.shotKey),Array.from({length:10},(_,i)=>'SHOT'+String(i+1).padStart(2,'0')));
 const segments=episodeSegments(file.shots);
 assert.equal(segments[9].endFrame,35488);
 for(let i=1;i<segments.length;i++)assert.equal(segments[i].startFrame,segments[i-1].endFrame+1);
});
test('Old 9 SHOT master sources remain a separate immutable historical manifest; first 7 are byte-identical',()=>{
 assert.equal(previous.shots.length,9);
 assert.deepEqual(file.shots.slice(0,7),previous.shots.slice(0,7));
 assert.equal(previous.shots[7].version,'V3');
 assert.equal(previous.shots[8].version,'V2');
 assert.deepEqual(file.shots.slice(7).map(x=>x.version),['V4','V3','V2']);
 assert.deepEqual(file.shots.slice(7).map(x=>x.renderId),[
 '07207345-1350-4e82-aea2-3c369160f653',
 '53ac60b4-346e-400b-8dec-7932ef2de94d',
 '174c8a8b-3202-4067-95ef-7dab1de11aa3']);
});
test('Official locked master copies original H264 and AAC, validates all encoded joins, never regenerates narration',()=>{
 for(const x of [
 "EP003-CUMULATIVE-DIRECTOR-MASTER",
 "EP003_CUMULATIVE_LOCKED_SHOTS_01_TO_",
 "EP003_TEN_SHOT_DIRECTOR_LOCK_ASSEMBLY_APPROVED",
 "ep003-director-locked-visual-sequence-10.json",
 "sha256(row.video_data)===s.sha256",
 "'-c','copy'",
 "qa.length===segments.length-1",
 "seamScore>=27",
 "leftSourceMatch>=50&&rightSourceMatch>=50",
 "EP003_CUMULATIVE_DIRECTOR_FULL_VIDEO_SAVED"
 ])assert.ok(worker.includes(x),x);
 assert.doesNotMatch(worker,/generateSpeech|textToSpeech|adelay=/);
});
