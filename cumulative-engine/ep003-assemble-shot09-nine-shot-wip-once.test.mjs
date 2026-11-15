import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const worker=read('./ep003-assemble-shot09-nine-shot-wip-once.mjs');
const manifest=JSON.parse(read('../remotion-engine/ep003-director-locked-visual-sequence.json'));
test('Official master unchanged with exactly the eight explicitly Director-LOCKED shots',()=>{
 assert.equal(manifest.shots.length,8);
 assert.ok(manifest.shots.every(x=>x.directorLocked===true));
 assert.equal(manifest.shots[7].renderId,'22059373-cc17-44fd-ad03-56d092cc57dc');
 assert.equal(manifest.shots.reduce((s,x)=>s+x.frames,0),28328);
 assert.ok(worker.includes("const EIGHT_MASTER_ID='624da8ff-78e7-404e-8202-a4aa6e02e4f5'"));
});
test('Ninth shot remains unlocked WIP and cannot overwrite official cumulative',()=>{
 for(const text of [
  'EP003_CUMULATIVE_WIP_SHOTS_01_TO_09',
  'EP003-CUMULATIVE-WIP-SHOT09',
  "directorLocked:false,lockedShots:8,unlockedCandidate:'SHOT09'",
  'unlockedShot09:true',
  'officialEightShotMasterPreserved:true',
  'EP003_SHOT09_NINE_SHOT_WIP_FULL_MP4_SAVED'
 ])assert.ok(worker.includes(text),text);
 assert.ok(!worker.includes('EP003_CUMULATIVE_LOCKED_SHOTS_01_TO_09'));
 assert.doesNotMatch(worker,/textToSpeech|generateSpeech|elevenlabs\\.generate/);
});
test('Verified exact source SHA, pinned new SHOT09 and encoded join before save',()=>{
 for(const code of [
  'sha(master.video_data)===EIGHT_MASTER_SHA',
  'sha(candidate.video_data)===CANDIDATE_SHA',
  'candidate.render_key===SHOT09_RENDER_KEY',
  "candidate.composition_id===SHOT09_COMPOSITION",
  "candidate?.status==='SUCCEEDED'",
  'boundary>=27&&match8>=50&&match9>=50',
  'Number(video.nb_frames)===frames',
  'media(await probe(output),frames',
  "'-c','copy'",
 ])assert.ok(worker.includes(code),code);
});
