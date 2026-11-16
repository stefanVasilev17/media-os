import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const scene=read('./src/episodes/ep003/Shot09WhenPrimaryDisappearsV3.tsx');
const worker=read('./ep003-shot09-failover-v3-render-once.mjs');
const root=read('./src/Root.tsx');
test('SHOT09 V3 consumes only real SHA-verified SHOT08 V4, preserving exact decoded frame seam',()=>{
 for(const x of ["previous.render_key==='EP003_SHOT08_SHARDING_V4'",
 "previous.composition_id==='EP003-SHOT08-SHARDING-V4-DIRECTOR-CANDIDATE'",
 "previous.engine_version==='EP003_SHOT08_PIN_143975e3d6c0'",
 "process.env.EP003_SHOT08_V4_RENDER_ID",
 "process.env.EP003_SHOT08_V4_SHA256",
 'PREVIOUS_FRAMES=5372',
 'worldStartFrame:40298'])assert.ok(worker.includes(x),x);
 assert.ok(scene.includes("sourceRenderKey:'EP003_SHOT08_SHARDING_V4'"));
 assert.ok(root.includes('EP003-SHOT09-FAILOVER-V3-DIRECTOR-CANDIDATE'));
 assert.ok(scene.includes('frame===0'));
});
test('New SHOT09 uses exactly centered Owner B route and safe two-line header',()=>{
 assert.ok(scene.includes('ep003-premium-routing-v2.mjs'));
 assert.ok(scene.includes('PREMIUM_OWNER_HEADER'));
 assert.ok(scene.includes('PREMIUM_ROUTES.REPLICA_B'));
 assert.ok(!scene.includes('x="1696" y="342"'));
 assert.ok(!scene.includes('INDEPENDENT PRIMARY OWNERS'));
 const old=read('./src/episodes/ep003/Shot09WhenPrimaryDisappearsV2.tsx');
 assert.ok(old.includes('INDEPENDENT PRIMARY OWNERS'));
});
test('Strict original voice, real cue alignment, P0 encoded seam and moving frames',()=>{
 for(const x of ["const SELECTED_TAKE='7510815a-d096-415f-b4f0-52ae8398ce45'",
 'EP003_SHOT09_V3_DIRECTOR_RENDER_APPROVED',
 'EP003_SHOT09_V3_REAL_MP4_SAVED',
 'EP003_SHOT09_PRE_RENDER_P0_STILL_QA',
 'EP003_SHOT09_P0_REAL_SEAM_AND_MOTION_QA',
 'motion.uniqueMovingSteps>=18',
 "assert(Number.isFinite(psnr)&&psnr>=27"])assert.ok(worker.includes(x),x);
 assert.doesNotMatch(worker,/textToSpeech|generateSpeech/);
});
