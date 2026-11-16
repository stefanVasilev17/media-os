import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const scene=read('./src/episodes/ep003/Shot11HumanFirstFinaleV1.tsx');
const parent=read('./src/episodes/ep003/Shot09FinalWorldForShot10V2.tsx');
const worker=read('./ep003-shot11-human-finale-v1-render-once.mjs');
const anchors=JSON.parse(read('./ep003-shot11-real-cue-anchors.json'));
const root=read('./src/Root.tsx');
const voice=JSON.parse(read('../backend/src/main/resources/ep003-director-locked-voice-package-v1.json'));
test('SHOT11 uses exact Director-approved script, source take, 24 real non-guessed anchor phrases',()=>{
 const narration=voice.shots.find(s=>s.shotKey==='SHOT11').narration;
 assert.equal(Object.keys(anchors).length,24);
 for(const [key,phrase] of Object.entries(anchors)){
  assert.ok(narration.includes(phrase),key+' is not a literal anchor in locked script');
 }
 assert.ok(scene.includes("SELECTED_TAKE='5c3435f6-ae66-4ec3-a6b0-bf1cc8207486'"));
 assert.ok(worker.includes('getCharacters(doc)'));
 assert.ok(worker.includes('cueFramesFromRealVoice(source.timing)'));
 assert.ok(worker.includes("cueFrames.BEGIN>=LEAD_IN_FRAMES"));
 assert.doesNotMatch(worker,/generateSpeech|textToSpeech|elevenlabs\.generate/);
});
test('Exact SHOT10 V2 MP4 SHA, composition and final decoded frame are required',()=>{
 for(const part of [
 'process.env.EP003_SHOT10_V2_RENDER_ID','process.env.EP003_SHOT10_V2_SHA256',
 "previous.render_key==='EP003_SHOT10_MEASUREMENT_V2'",
 "previous.composition_id==='EP003-SHOT10-MEASUREMENT-V2-DIRECTOR-CANDIDATE'",
 "previous.engine_version==='EP003_SHOT10_PIN_51403eaa9dde'",
 "select=eq(n\\,4015)", 'worldStartFrame:47457',
 'EP003_SHOT11_PRE_RENDER_P0_STILL_QA',
 'EP003_SHOT11_V1_REAL_MP4_SAVED','motion.uniqueMovingSteps>=18',
 'motion.firstStep>0.12&&motion.firstStep<4.5',
 'EP003_SHOT11_V1_DIRECTOR_RENDER_APPROVED'
 ])assert.ok(worker.includes(part),part);
});
test('Reuses SHOT09/10 living architecture with exact centerline and no foreign packet positions',()=>{
 for(const part of [
 'Ep003Shot09FinalWorldForShot10V2','continuationFrameOffset={7159}',
 'previousLastFrameDataUri={props.previousLastFrameDataUri}',
 'f<8','opacity:1-f/8',
 'PREMIUM_ROUTES.REPLICA_B','premiumRouteD(route)',
 'SHOT10_LAST_WORLD_FRAME=47457','validatePremiumRoutes',
 'shot10TextWidth','ep003CardIsReadable','ep003CardOpacity'
 ])assert.ok(scene.includes(part),part);
 assert.ok(parent.includes('premiumRoutePoint(phase,r.route)'));
 assert.ok(!scene.includes('<circle'));
 assert.ok(!scene.includes('strokeDashoffset'));
});
test('Same safe one-card grammar; no containers over containers, no text outside bounds',()=>{
 assert.ok(scene.includes('560+width>1480'));
 assert.ok(scene.includes('777+height>1020'));
 assert.ok(scene.includes('width>830'));
 assert.ok(scene.includes("whiteSpace:'nowrap'"));
 assert.ok(scene.includes("position:'absolute',left:560,top:78"));
 assert.ok(scene.includes("left:560,top:777"));
 const names=['ONE HUMAN ACTION','HEALTHY IS NOT ENOUGH','CAPACITY AND CORRECTNESS',
 'EVERY GAIN HAS A COST','SYSTEM DESIGN IS A TRADE-OFF','THE HUMAN JOURNEY'];
 for(const name of names)assert.ok(scene.includes(name));
});
test('Registered separate nonlocked review composition',()=>{
 assert.ok(root.includes('EP003-SHOT11-FINALE-V1-DIRECTOR-CANDIDATE'));
 assert.ok(root.includes('Ep003Shot11HumanFirstFinaleV1'));
 assert.ok(worker.includes("EP003_SHOT11_FINALE_V1"));
 assert.ok(worker.includes('directorLocked:false'));
});
