import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createWorkerTokenTransport} from './worker-token-rotation.mjs';

test('rolls over after an authorized 401 and switches future calls to the next credential', async () => {
  const transport = createWorkerTokenTransport('current-token', 'next-token');
  const seen = [];
  const send = async (_url, options) => {
    seen.push(options.headers['X-MediaOS-Workload-Token']);
    return {status: seen.length === 1 ? 401 : 204, ok: seen.length !== 1};
  };
  const result = await transport.request('/worker/claim', {
    method: 'POST', headers: transport.scopedHeaders(),
  }, send);
  assert.equal(result.status, 204);
  assert.deepEqual(seen, ['current-token', 'next-token']);
  assert.equal(transport.scopedHeaders()['X-MediaOS-Workload-Token'], 'next-token');
});

test('does not retry a state-changing operation after any non-401 response', async () => {
  for (const status of [200, 204, 403, 409, 429, 500]) {
    const transport = createWorkerTokenTransport('current', 'next');
    let count = 0;
    await transport.request('/worker/complete', {
      method: 'PUT',
      headers: transport.scopedHeaders(),
      body: Buffer.from('video'),
    }, async () => {
      count++;
      return {status, ok: status < 400};
    });
    assert.equal(count, 1);
    assert.equal(transport.scopedHeaders()['X-MediaOS-Workload-Token'], 'current');
  }
});

test('does not rotate without a distinct staged credential or when request has no active credential', async () => {
  for (const [current, next] of [['old', ''], ['same', 'same'], ['', 'next']]) {
    const transport = createWorkerTokenTransport(current, next);
    let count = 0;
    const result = await transport.request('/worker/claim', {
      method: 'POST', headers: transport.scopedHeaders(),
    }, async () => {
      count++;
      return {status: 401, ok: false};
    });
    assert.equal(result.status, 401);
    assert.equal(count, 1);
  }
});

test('does not retry a 401 without proof that the active token was sent', async () => {
  const transport = createWorkerTokenTransport('current', 'next');
  let count = 0;
  await transport.request('/worker/claim', {
    method: 'POST', headers: {'X-MediaOS-Workload-Token': 'unrelated'},
  }, async () => {
    count++;
    return {status: 401, ok: false};
  });
  assert.equal(count, 1);
});
