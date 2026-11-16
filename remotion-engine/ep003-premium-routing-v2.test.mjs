import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
 PREMIUM_ROUTES,PREMIUM_OWNER_HEADER,PREMIUM_ROUTING_VERSION,
 premiumRouteD,premiumRouteEnd,premiumRoutePoint,validatePremiumRoutes
} from './ep003-premium-routing-v2.mjs';
import {shot10TextWidth} from './shot10-content-fit-layout.mjs';

const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
test('OWNER B route starts exactly at its label center with a vertical segment',()=>{
 assert.equal(PREMIUM_ROUTING_VERSION,'EP003_PREMIUM_ROUTING_V2');
 assert.equal(validatePremiumRoutes(),true);
 const r=PREMIUM_ROUTES.REPLICA_B;
 assert.deepEqual(r.start,{x:1771,y:667});
 assert.deepEqual(r.segments[0].to,{x:1771,y:681});
 assert.deepEqual(premiumRouteEnd(r),{x:1690,y:852});
 assert.deepEqual(premiumRoutePoint(0,r),r.start);
 assert.deepEqual(premiumRoutePoint(1,r),premiumRouteEnd(r));
 assert.ok(!premiumRouteD(r).includes(' C'));
});
test('Replica B line is external to Replica A and stops on the top middle of its own card',()=>{
 const r=PREMIUM_ROUTES.REPLICA_B;
 for(let i=0;i<=2000;i++){
  const q=premiumRoutePoint(i/2000,r);
  assert.ok(q.y<709||q.y>825||q.x>=1822,'Replica A collision: '+JSON.stringify(q));
  assert.ok(q.y<=852,'Replica B internal line '+JSON.stringify(q));
 }
});
test('Independent Primary Owners sits right of Auth, inside safe frame, with no compressed typography',()=>{
 const h=PREMIUM_OWNER_HEADER;
 assert.deepEqual(h.textLines,['INDEPENDENT','PRIMARY OWNERS']);
 assert.equal(h.fontSize,22);
 assert.ok(h.centerX>1696);
 for(const line of h.textLines){
  const w=shot10TextWidth(line,h.fontSize);
  assert.ok(h.centerX-w/2>=h.safeTextLeft,'Auth overlap: '+line);
  assert.ok(h.centerX+w/2<=h.safeTextRight,'Canvas overlap: '+line);
 }
});
test('Both premium replacement shots and their final-world fork use shared B route and header',()=>{
 const ps=['Shot08WhenCopiesAreNotEnoughV4.tsx','Shot09WhenPrimaryDisappearsV3.tsx',
  'Shot09FinalWorldForShot10V2.tsx'];
 for(const file of ps){
  const scene=read('./src/episodes/ep003/'+file);
  assert.ok(scene.includes('ep003-premium-routing-v2.mjs'),file);
  assert.ok(scene.includes('PREMIUM_OWNER_HEADER'),file);
  assert.ok(scene.includes('PREMIUM_ROUTES.REPLICA_B'),file);
  assert.ok(!scene.includes('x="1696" y="342"'),file);
 }
 assert.ok(read('./src/episodes/ep003/Shot10ProveArchitectureV2.tsx')
   .includes('Shot09FinalWorldForShot10V2'));
});
