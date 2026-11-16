import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const scene=read('./src/episodes/ep003/Shot10ProveArchitectureV2.tsx');
const fork=read('./src/episodes/ep003/Shot09FinalWorldForShot10V2.tsx');
const worker=read('./ep003-shot10-measurement-v2-render-once.mjs');
const root=read('./src/Root.tsx');
test('V2 continues only actual SHOT09 V3 centered predecessor by render ID + SHA',()=>{
 for(const x of ["process.env.EP003_SHOT09_V3_RENDER_ID",
  "process.env.EP003_SHOT09_V3_SHA256",
  "previous.render_key==='EP003_SHOT09_FAILOVER_V3'",
  "previous.composition_id==='EP003-SHOT09-FAILOVER-V3-DIRECTOR-CANDIDATE'",
  "previous.engine_version==='EP003_SHOT09_PIN_599d23563c9c'",
  "select=eq(n", '3144)'])assert.ok(worker.includes(x),x);
 assert.ok(root.includes('EP003-SHOT10-MEASUREMENT-V2-DIRECTOR-CANDIDATE'));
 assert.ok(scene.includes('Shot09FinalWorldForShot10V2'));
 assert.ok(scene.includes('frame===0'));
});
test('Corrected Owner B stays centered through exact inherited SHOT09 scene and SHOT10 premium paths',()=>{
 for(const x of ['PREMIUM_OWNER_HEADER','PREMIUM_ROUTES.REPLICA_B',
 'ep003-premium-routing-v2.mjs'])assert.ok(fork.includes(x),x);
 assert.ok(scene.includes('ep003-premium-routing-v2.mjs'));
 assert.ok(scene.includes('Shot10PremiumRoutingContractV2'));
 assert.ok(!fork.includes('INDEPENDENT PRIMARY OWNERS'));
});
test('Retain selected original voice, 25 original cues, protected text fitting and strict motion',()=>{
 for(const x of ["const SELECTED_TAKE='0168eb87-538f-49d8-9c79-132d822bdb60'",
  'EP003_SHOT10_V2_DIRECTOR_RENDER_APPROVED','EP003_SHOT10_V2_REAL_MP4_SAVED',
  'EP003_SHOT10_PRE_RENDER_P0_STILL_QA','EP003_SHOT10_P0_REAL_SEAM_AND_MOTION_QA',
  "assert(Number.isFinite(psnr)&&psnr>=27",
  'motion.uniqueMovingSteps>=18'])assert.ok(worker.includes(x),x);
 assert.ok(scene.includes('shot10TextWidth'));
 assert.ok(scene.includes("x.includes(';')"));
 assert.doesNotMatch(worker,/generateSpeech|textToSpeech/);
});
