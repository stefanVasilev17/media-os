import test from 'node:test';
import assert from 'node:assert/strict';
import {shouldClaimRenderWork} from './worker-claim-authorization.mjs';

test('CPU claim dispatch stays disabled unless explicitly activated', () => {
  for (const value of [undefined, null, '', 'false', 'TRUE', '1', 'yes', ' true ', 'False']) {
    assert.equal(shouldClaimRenderWork(value), false);
  }
  assert.equal(shouldClaimRenderWork('true'), true);
});
