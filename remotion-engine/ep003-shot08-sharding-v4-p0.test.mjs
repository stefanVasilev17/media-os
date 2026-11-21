import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const scene=read('./src/episodes/ep003/Shot08WhenCopiesAreNotEnoughV4.tsx');
const worker=read('./ep003-shot08-sharding-v4-render-once.mjs');
const root=read('./src/Root.tsx');
test('SHOT08 V4 preserves the Director-LOCKED SHOT07 V3 encoded precursor and original narration',()=>{
 for(const x of ["renderId:'09457c3c-32d9-432c-aa92-67f0e7b13f60'",
 "sha256:'7f7429a6a4117c49b4338dec256eae72fbe5e269728729dfdb23ab63e6ba27f8'",
 'worldStartFrame:34927','frame===0'])assert.ok((worker+root+scene).includes(x),x);
 assert.ok(worker.includes("const SELECTED_TAKE='368c239c-a93b-437e-a833-2f955fa51803'"));
 assert.ok(worker.includes('EP003_SHOT08_V4_REAL_MP4_SAVED'));
 assert.ok(worker.includes('EP003_SHOT08_P0_REAL_SEAM_AND_MOTION_QA'));
 assert.ok(root.includes('EP003-SHOT08-SHARDING-V4-DIRECTOR-CANDIDATE'));
});
test('Only a new version uses centered OWNER B, the original LOCKED SHOT08 V3 is unmodified',()=>{
 assert.ok(scene.includes('PREMIUM_OWNER_HEADER'));
 assert.ok(scene.includes('ep003-premium-routing-v2.mjs'));
 assert.ok(scene.includes('PREMIUM_ROUTES.REPLICA_B'));
 assert.ok(!scene.includes('INDEPENDENT PRIMARY OWNERS'));
 assert.ok(!scene.includes('x="1696" y="342"'));
 const old=read('./src/episodes/ep003/Shot08WhenCopiesAreNotEnoughV3.tsx');
 assert.ok(old.includes('INDEPENDENT PRIMARY OWNERS'));
 assert.ok(old.includes('ep003-premium-routing.mjs'));
});
test('P0 encoded frame, in-motion checks and selected voice remain mandatory',()=>{
 for(const x of ['EP003_SHOT08_V4_DIRECTOR_RENDER_APPROVED',
  'EP003_SHOT08_PRE_RENDER_P0_STILL_QA',
  'EP003_SHOT08_P0_REAL_SEAM_AND_MOTION_QA',
  'motion.uniqueMovingSteps>=18',
  'motion.firstStep>0.12&&motion.firstStep<4.5',
  "assert(Number.isFinite(psnr)&&psnr>=27"])assert.ok(worker.includes(x),x);
 assert.doesNotMatch(worker,/generateSpeech|textToSpeech/);
});
