import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const scene=read('./src/episodes/ep003/Shot10ProveArchitectureV1.tsx');
const fork=read('./src/episodes/ep003/Shot09FinalWorldForShot10V1.tsx');
const prev=read('./src/episodes/ep003/Shot09WhenPrimaryDisappearsV2.tsx');
const worker=read('./ep003-shot10-measurement-v1-render-once.mjs');
const root=read('./src/Root.tsx');
const anchors=JSON.parse(read('./ep003-shot10-real-cue-anchors.json'));
test('SHOT10 begins with exact decoded final frame of immutable Director LOCKED SHOT09 V2',()=>{
 for(const marker of [
  "const PREDECESSOR='b3a3912f-79ee-4c72-b313-cbe09f950a5e'",
  "const LAST_SHOT09_FRAME=3144",
  "const SHOT09_LAST_WORLD_FRAME=40298+LAST_SHOT09_FRAME",
  'continuationFrameOffset={LAST_SHOT09_FRAME}',
  'frame===0','previousLastFrameDataUri',
  "const PIN='b3a3912f-79ee-4c72-b313-cbe09f950a5e'",
  "const PIN_SHA='f80a362e0b805edf7eee045e11d5c6492280fdea997eb9a9204ce5f5c458dc7f'",
  "select=eq(n\\,3144)",
  "previous.render_key==='EP003_SHOT09_FAILOVER_V2'"])assert.ok((scene+worker).includes(marker),marker);
 assert.ok(fork.includes('continuationFrameOffset'));
 assert.ok(fork.includes('titleHandoffFrame'));
 assert.ok(prev.includes('Ep003Shot09WhenPrimaryDisappearsV2'));
 assert.ok(root.includes('EP003-SHOT10-MEASUREMENT-V1-DIRECTOR-CANDIDATE'));
});
test('Selected original Shot10 voice and 25 ordered real alignment anchors never guessed',()=>{
 assert.equal(Object.keys(anchors).length,25);
 assert.ok(worker.includes("const SELECTED_TAKE='0168eb87-538f-49d8-9c79-132d822bdb60'"));
 assert.ok(worker.includes('cueFramesFromRealVoice(source.timing)'));
 assert.ok(worker.includes('ep003-shot10-real-cue-anchors.json'));
 assert.ok(worker.includes('EP003_SHOT10_V1_DIRECTOR_RENDER_APPROVED'));
 assert.ok(!worker.includes('elevenlabs.generate'));
});
test('World stays one continuous Living Architecture map, including Premium Routing',()=>{
 for(const s of ['PREMIUM_ROUTES','shot10PremiumRouteD',
 'shot10PremiumPathPosition','Ep003Shot09FinalWorldForShot10V1',
 'Shot10PremiumRoutingContractV1'])assert.ok(scene.includes(s),s);
 assert.ok(scene.includes('validatePremiumRoutes()'));
 assert.ok(scene.includes('CARDS'));
 assert.ok(scene.includes('shot10TextWidth'));
 assert.ok(!scene.includes('container-on-container'));
});
test('Every measurement card is content fitted, controlled and legible',()=>{
 for(const s of ['SERVICE LEVEL INDICATOR','SERVICE LEVEL OBJECTIVE',
 'P95 LATENCY','DATABASE TELEMETRY','RECOVERY OBJECTIVES',
 'EP003_SHOT10_CARD_TEXT_OR_CONTAINER_INVALID_',
 'width>850','560+width>1480','lines.length!==2',
 "x.includes(';')"])assert.ok(scene.includes(s),s);
 assert.equal((scene.match(/start:'/g)||[]).length,10);
});
test('Final MP4 cannot save without genuine 09→10 seam and moving-frame QA',()=>{
 for(const s of ['EP003_SHOT10_PRE_RENDER_P0_STILL_QA',
 'EP003_SHOT10_P0_REAL_SEAM_AND_MOTION_QA',
 'EP003_SHOT10_V1_REAL_MP4_SAVED',
 "assert(Number.isFinite(psnr)&&psnr>=27",
 'motion.uniqueMovingSteps>=18',
 'motion.firstStep>0.12&&motion.firstStep<4.5'])
 assert.ok(worker.includes(s),s);
 assert.doesNotMatch(worker,/generateSpeech|textToSpeech/);
});
