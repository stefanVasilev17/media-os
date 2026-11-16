import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PREMIUM_ROUTE_STYLE,PREMIUM_ROUTES,
 premiumRouteD,premiumRouteEnd,premiumRoutePoint,premiumPacketPoint,
 validatePremiumRoutes} from './ep003-premium-routing.mjs';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
test('All five constrained routes use straight lines and controlled quadratic corners',()=>{
 assert.equal(validatePremiumRoutes(),true);
 for(const route of Object.values(PREMIUM_ROUTES)){
  const d=premiumRouteD(route);
  assert.match(d,/^M\\d+ \\d+ L/);
  assert.doesNotMatch(d,/ C/);
  assert.deepEqual(premiumRoutePoint(0,route),route.start);
  assert.deepEqual(premiumRoutePoint(1,route),premiumRouteEnd(route));
 }
 assert.equal(PREMIUM_ROUTES.REPLICA_B.segments.filter(x=>x.type==='Q').length,2);
});
test('Every request position is sampled from the same rendered route and remains within canvas',()=>{
 for(const route of Object.values(PREMIUM_ROUTES)){
  for(let f=0;f<400;f++){
   const pos=premiumPacketPoint(f,.006,1/3,route);
   assert.ok(Number.isFinite(pos.x)&&Number.isFinite(pos.y));
   assert.ok(pos.opacity>=0&&pos.opacity<=1);
   assert.ok(pos.x>=1450&&pos.x<=1860&&pos.y>=375&&pos.y<=970);
  }
 }
});
test('Replica B keeps a separate exterior rail and avoids owner and Replica A labels',()=>{
 for(let i=0;i<200;i++){
  const p=premiumRoutePoint(i/200,PREMIUM_ROUTES.REPLICA_B);
  assert.ok(p.y<709||p.y>825||p.x>1819);
 }
 assert.equal(PREMIUM_ROUTES.REPLICA_A.start.y,667);
 assert.equal(PREMIUM_ROUTES.REPLICA_B.start.y,667);
 assert.ok(PREMIUM_ROUTE_STYLE.packetGlow<=6);
 assert.ok(PREMIUM_ROUTE_STYLE.activeWidth<=3);
});
test('Premium route contract is used by both revision sources and SHOT10',()=>{
 const s8=read('./src/episodes/ep003/Shot08WhenCopiesAreNotEnoughV3.tsx');
 const s9=read('./src/episodes/ep003/Shot09WhenPrimaryDisappearsV2.tsx');
 const s10=read('./src/episodes/ep003/Shot10PremiumRoutingContractV1.ts');
 for(const s of [s8,s9,s10]){
  assert.ok(s.includes('PREMIUM_ROUTES'));
  assert.ok(s.includes('premiumRouteD'));
  assert.ok(s.includes('premiumRoutePoint')||s.includes('premiumPacketPoint'));
 }
 assert.ok(!s8.includes("c1:{x:1850,y:719}"));
 assert.ok(!s9.includes("c2:{x:1530,y:736}"));
});
