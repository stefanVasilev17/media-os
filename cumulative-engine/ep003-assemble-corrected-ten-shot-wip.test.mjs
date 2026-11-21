import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {correctedWipSequence,episodeSegments,validateLockedSequence} from './ep003-assemble-corrected-ten-shot-wip.mjs';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const manifest=JSON.parse(read('../remotion-engine/ep003-director-locked-visual-sequence.json'));
const worker=read('./ep003-assemble-corrected-ten-shot-wip.mjs');
test('Official nine-shot master manifest remains unchanged',()=>{
 assert.equal(validateLockedSequence(manifest),31473);
 assert.equal(manifest.shots.length,9);
 assert.ok(manifest.shots.every(x=>x.directorLocked===true));
});
test('Corrected WIP always uses exact 08 V4 + 09 V3 + 10 V2 SHA pins and preserves first seven',()=>{
 const variables={
 EP003_SHOT08_V4_RENDER_ID:'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
 EP003_SHOT08_V4_SHA256:'a'.repeat(64),
 EP003_SHOT09_V3_RENDER_ID:'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',
 EP003_SHOT09_V3_SHA256:'b'.repeat(64),
 EP003_SHOT10_V2_RENDER_ID:'cccccccc-cccc-4ccc-cccc-cccccccccccc',
 EP003_SHOT10_V2_SHA256:'c'.repeat(64)};
 const previous=Object.fromEntries(Object.keys(variables).map(k=>[k,process.env[k]]));
 try{
  Object.assign(process.env,variables);
  const items=correctedWipSequence(manifest),parts=episodeSegments(items);
  assert.equal(items.length,10);
  assert.equal(parts.reduce((v,x)=>v+x.frames,0),35489);
  assert.deepEqual(items.slice(0,7),manifest.shots.slice(0,7));
  assert.deepEqual(items.slice(7).map(x=>x.version),['V4','V3','V2']);
  assert.deepEqual(parts.slice(7).map(x=>x.directorLocked),[false,false,false]);
  assert.deepEqual(parts.slice(0,7).map(x=>x.directorLocked),Array(7).fill(true));
  assert.deepEqual(parts.slice(7).map(x=>x.renderId),[
   variables.EP003_SHOT08_V4_RENDER_ID,variables.EP003_SHOT09_V3_RENDER_ID,
   variables.EP003_SHOT10_V2_RENDER_ID]);
  for(let i=1;i<parts.length;i++)assert.equal(parts[i].startFrame,parts[i-1].endFrame+1);
  delete process.env.EP003_SHOT10_V2_SHA256;
  assert.throws(()=>correctedWipSequence(manifest),/EP003_WIP_VERIFIED_SOURCE_MISSING_SHOT10/);
 }finally{for(const [key,v] of Object.entries(previous)){if(v===undefined)delete process.env[key];else process.env[key]=v;}}
});
test('WIP never replaces official LOCKED master or regenerates audio',()=>{
 for(const needle of ['EP003-CUMULATIVE-WIP-CORRECTED-TEN-SHOT',
  'EP003_CUMULATIVE_WIP_CORRECTED_SHOTS_01_TO_',
  "directorLocked:false,wip:true,verified:false",
  'lockedPrefixShotCount:7',
  "row.engine_version===s.engineVersion",
  "sha256(row.video_data)===s.sha256",
  'checkSeams(tmp,sources,master,segments)',
  'EP003_WIP_REQUIRES_NINE_VERIFIED_JOINS',
  "seamScore>=27","leftSourceMatch>=50&&rightSourceMatch>=50",
  "'-c','copy'",
  'CORRECTED_TEN_SHOT_WIP__NOT_DIRECTOR_LOCKED'
 ])assert.ok(worker.includes(needle),needle);
 assert.doesNotMatch(worker,/generateSpeech|textToSpeech/);
});
