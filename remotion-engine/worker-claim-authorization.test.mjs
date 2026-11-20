import test from 'node:test';
import assert from 'node:assert/strict';
import {shouldClaimRenderWork,requireSupportedTargetComposition} from './worker-claim-authorization.mjs';

test('CPU claim dispatch stays disabled unless explicitly activated', () => {
  for (const value of [undefined, null, '', 'false', 'TRUE', '1', 'yes', ' true ', 'False']) {
    assert.equal(shouldClaimRenderWork(value), false);
  }
  assert.equal(shouldClaimRenderWork('true'), true);
});

test('EP004 SHOT01 is a valid single-composition scoped release target',()=>{
  assert.equal(requireSupportedTargetComposition('EP004-SHOT01-ORDINARY-WORKDAY-V1-VISUAL'),
    'EP004-SHOT01-ORDINARY-WORKDAY-V1-VISUAL');
  assert.equal(requireSupportedTargetComposition('EP002-SHOT10-CANDIDATE'),
    'EP002-SHOT10-CANDIDATE');
  assert.equal(requireSupportedTargetComposition(''), '');
  for(const invalid of [
    'EP004-SHOT02-ORDINARY-WORKDAY-V1-VISUAL',
    'EP004-SHOT01-ORDINARY-WORKDAY-V1-VISUAL; EP003',
    'AT-FACTORY-SHOT','EP001-VerticalSlice','undefined',undefined,null,
  ])assert.throws(()=>requireSupportedTargetComposition(invalid),
    /REMOTION_WORKER_TARGET_COMPOSITION_INVALID/);
});
