import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {verifyManifest,inspectLockedMaster,assembleLockedMaster}
  from './ep002-locked-master-assembly.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const manifestPath=path.join(root,
  'docs/engineering/EP002_DIRECTOR_LOCKED_MASTER_INPUTS_20261111.json');
const roomPath=path.join(root,'frontend/src/components/Ep002LockedCutReviewRoom.tsx');

async function inputs(){
  return JSON.parse(await fs.readFile(manifestPath,'utf8'));
}

test('Director master manifest pins exactly 11 unique ordered approved MP4s',async()=>{
  const approved=verifyManifest(await inputs());
  assert.equal(approved.shots.length,11);
  assert.equal(approved.shots[0].expectedFrames,1172);
  assert.equal(approved.shots[0].renderId,
    '8f46fafd-9613-4375-bce2-ea98854e8b20');
  assert.equal(approved.shots.at(-1).renderId,
    '73ec0e6f-d348-4518-a32b-573bf89a8ab5');
  assert.equal(approved.directorApproval.originalShot01ArchivedRenderId,
    '447f2846-3d1d-4d6c-924c-ea3918520625');
});

test('approved master manifest stays exactly aligned with Director Review Room',async()=>{
  const {shots}=await inputs();
  const room=await fs.readFile(roomPath,'utf8');
  for(const shot of shots){
    assert.ok(room.includes("shotKey:'"+shot.shotKey+"'"));
    assert.ok(room.includes("renderId:'"+shot.renderId+"'"));
    assert.ok(room.includes("compositionId:'"+shot.compositionId+"'"));
  }
  assert.ok(room.includes('width:1920,height:1080'));
  assert.ok(!room.includes("renderId:'447f2846-3d1d-4d6c-924c-ea3918520625'"));
});

test('missing, reordered, duplicated or substituted SHOT IDs fail closed',async()=>{
  const original=await inputs();
  for(const corrupt of [
    {...original,shots:original.shots.slice(0,10)},
    {...original,shots:[...original.shots].reverse()},
    {...original,shots:original.shots.map((s,i)=>i===1
      ?{...s,renderId:original.shots[0].renderId}:s)},
    {...original,shots:original.shots.map((s,i)=>i===0
      ?{...s,renderId:original.directorApproval.originalShot01ArchivedRenderId}:s)},
    {...original,assemblyPolicy:{...original.assemblyPolicy,
      doNotRenderWithoutDirectorPaidConfirmation:false}},
  ])assert.throws(()=>verifyManifest(corrupt),/EP002_MASTER_ASSEMBLY_BLOCKED/);
});

test('master assembly cannot begin without explicit Director consent',async()=>{
  await assert.rejects(
    ()=>assembleLockedMaster({inputDir:'/not-present',outputFile:'/tmp/master.mp4'}),
    /Explicit Director paid render confirmation is required/);
});

test('preflight cannot silently fabricate or fetch missing source MP4s',async()=>{
  await assert.rejects(
    ()=>inspectLockedMaster({manifestPath,inputDir:'/dir-that-does-not-exist'}),
    /Approved stored MP4 is missing/);
});
