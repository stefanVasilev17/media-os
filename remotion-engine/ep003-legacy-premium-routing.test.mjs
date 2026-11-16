import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {LEGACY_PREMIUM_ROUTES,legacyPremiumPath,legacyPremiumPosition,
 validateLegacyPremiumRouting} from './ep003-legacy-premium-routing.mjs';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
test('Former Primary and replica route geometry now has a compatible engineered standard',()=>{
 assert.equal(validateLegacyPremiumRouting(),true);
 assert.equal(Object.keys(LEGACY_PREMIUM_ROUTES).length,5);
 for(const name of Object.keys(LEGACY_PREMIUM_ROUTES)){
  const s=legacyPremiumPath(name);
  assert.ok(s.includes(' L'));
  assert.ok(!s.includes(' C'));
  assert.ok(Number.isFinite(legacyPremiumPosition(name,.55).x));
 }
});
test('Historical Director-LOCKED SHOT03-07 still need individual successor renders and review',()=>{
 const paths=[
 './src/episodes/ep003/Shot03WordingV4.tsx',
 './src/episodes/ep003/Shot04ReadWriteSplittingV1.tsx',
 './src/episodes/ep003/Shot05StaleReadV1.tsx',
 './src/episodes/ep003/Shot06CorrectnessBeforeSpeedV1.tsx',
 './src/episodes/ep003/Shot07BottleneckMeasurementV3.tsx'];
 for(const p of paths){
  const source=read(p);
  assert.ok(source.includes('const bezier='));
  assert.ok(!source.includes('legacyPremiumPath('));
 }
});
test('No false uniformity: new SHOT08,09,10 use premium paths, earlier shots are not yet retroactively changed',()=>{
 const newer=[
 './src/episodes/ep003/Shot08WhenCopiesAreNotEnoughV3.tsx',
 './src/episodes/ep003/Shot09WhenPrimaryDisappearsV2.tsx',
 './src/episodes/ep003/Shot10ProveArchitectureV1.tsx'];
 for(const p of newer)assert.ok(read(p).includes('PREMIUM_ROUTES'));
});
