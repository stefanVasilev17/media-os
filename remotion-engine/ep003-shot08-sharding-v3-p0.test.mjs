import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const scene=read('./src/episodes/ep003/Shot08WhenCopiesAreNotEnoughV3.tsx');
const source=read('./src/episodes/ep003/Shot08WhenCopiesAreNotEnoughV2.tsx');
const worker=read('./ep003-shot08-sharding-v3-render-once.mjs');
const root=read('./src/Root.tsx');
test('New V3 preserves selected voice and exact Director LOCKED SHOT07 V3 seam',()=>{
 for(const k of [
  "renderId:'09457c3c-32d9-432c-aa92-67f0e7b13f60'",
  'frame===0','OriginalReplicas frame={frame+3475}',
  "voiceTakeId:'368c239c-a93b-437e-a833-2f955fa51803'",
  'worldStartFrame:34927',
 ])assert.ok((scene+root).includes(k),k);
 assert.ok(worker.includes('EP003_SHOT08_V3_REAL_MP4_SAVED'));
 assert.ok(worker.includes('EP003_SHOT08_V3_DIRECTOR_RENDER_APPROVED'));
 assert.ok(worker.includes('EP003_SHOT08_P0_REAL_SEAM_AND_MOTION_QA'));
 assert.ok(source.includes("c1:{x:1850,y:719}"));
});
test('All packet positions derive from their rendered engineered path',()=>{
 for(const key of ['PREMIUM_ROUTES.AUTH_A','PREMIUM_ROUTES.AUTH_B',
 'PREMIUM_ROUTES.REPLICA_A','PREMIUM_ROUTES.REPLICA_B',
 'premiumRoutePoint(phase,r.route)','premiumRouteD(r.route)',
 'const routePath=(r:RouteCarrier)=>premiumRouteD(r.route)',
 'const routePoint=(t:number,r:RouteCarrier)=>premiumRoutePoint(t,r.route)'])
 assert.ok(scene.includes(key),key);
 assert.ok(!scene.includes("c1:{x:1850,y:719}"));
 assert.ok(!scene.includes("c2:{x:1680,y:707}"));
 assert.ok(scene.includes('PREMIUM_ROUTE_STYLE.packetRadius'));
});
test('Immutable previous V2 and original 8-shot official master',()=>{
 assert.ok(root.includes('EP003-SHOT08-SHARDING-V2-DIRECTOR-CANDIDATE'));
 assert.ok(root.includes('EP003-SHOT08-SHARDING-V3-DIRECTOR-CANDIDATE'));
 const manifest=JSON.parse(read('./ep003-director-locked-visual-sequence.json'));
 assert.equal(manifest.shots.length,8);
 assert.equal(manifest.shots[7].version,'V2');
 assert.equal(manifest.shots[7].renderId,'22059373-cc17-44fd-ad03-56d092cc57dc');
});
