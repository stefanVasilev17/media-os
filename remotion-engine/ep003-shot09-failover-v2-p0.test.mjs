import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const scene=read('./src/episodes/ep003/Shot09WhenPrimaryDisappearsV2.tsx');
const worker=read('./ep003-shot09-failover-v2-render-once.mjs');
const root=read('./src/Root.tsx');
test('V2 continues exactly from saved verified 08 V3 candidate, no fake predecessor',()=>{
 assert.ok(scene.includes("sourceRenderKey:'EP003_SHOT08_SHARDING_V3'"));
 assert.ok(scene.includes('frame===0'));
 assert.ok(scene.includes('worldStartFrame:40298')||scene.includes('lastWorldFrame:34927+5372-1'));
 assert.ok(worker.includes('process.env.EP003_SHOT08_V3_RENDER_ID'));
 assert.ok(worker.includes('process.env.EP003_SHOT08_V3_SHA256'));
 assert.ok(worker.includes("previous.render_key==='EP003_SHOT08_SHARDING_V3'"));
 assert.ok(worker.includes("previous.engine_version==='EP003_SHOT08_PIN_52c99cdf2b4b'"));
 assert.ok(worker.includes("previous.composition_id==='EP003-SHOT08-SHARDING-V3-DIRECTOR-CANDIDATE'"));
 assert.ok(root.includes('EP003-SHOT09-FAILOVER-V2-DIRECTOR-CANDIDATE'));
});
test('Failover and replica routes use exact premium geometry for packets',()=>{
 for(const s of ['PREMIUM_ROUTES.RECOVERY_A','PREMIUM_ROUTES.REPLICA_A',
 'PREMIUM_ROUTES.REPLICA_B','premiumRoutePoint(phase,r.route)',
 'const routePath=(r:RouteCarrier)=>premiumRouteD(r.route)',
 'const routePoint=(t:number,r:RouteCarrier)=>premiumRoutePoint(t,r.route)',
 'const point=routePoint(phase,RECOVERY_ROUTE)'])assert.ok(scene.includes(s),s);
 assert.ok(!scene.includes("c2:{x:1530,y:736}"));
 assert.ok(!scene.includes("c1:{x:1850,y:719}"));
 assert.ok(scene.includes('PREMIUM_ROUTE_STYLE.packetRadius'));
});
test('No automatic Director LOCK, original voice and strict moving seam QA',()=>{
 for(const v of ['EP003_SHOT09_V2_REAL_MP4_SAVED','EP003_SHOT09_V2_DIRECTOR_RENDER_APPROVED',
 'motion.uniqueMovingSteps>=18','motion.firstStep>0.12&&motion.firstStep<4.5',
 "const SELECTED_TAKE='7510815a-d096-415f-b4f0-52ae8398ce45'"])
 assert.ok(worker.includes(v),v);
 assert.doesNotMatch(worker,/generateSpeech|textToSpeech|elevenlabs\.generate/);
});
