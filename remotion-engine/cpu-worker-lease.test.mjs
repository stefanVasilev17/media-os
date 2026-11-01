import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createCpuWorkerLeaseClient} from './cpu-worker-lease.mjs';
import {createWorkerTokenTransport} from './worker-token-rotation.mjs';

const token = char => char.repeat(64);
const setup = (fetchImpl, clock = () => Date.parse('2026-11-01T20:00:00Z')) => {
  const transport = createWorkerTokenTransport('', '');
  const client = createCpuWorkerLeaseClient({
    backendUrl: 'https://example.test', workerId: 'remotion-cpu-production',
    workerKey: 'A'.repeat(64), transport, enabled: true, fetchImpl, clock,
  });
  return {transport, client};
};

test('bootstraps a scoped credential and rotates it before expiry without restarting', async () => {
  let now = Date.parse('2026-11-01T20:00:00Z');
  let requests = 0;
  const {transport, client} = setup(async (_url, options) => {
    requests++;
    assert.equal(options.method, 'POST');
    assert.equal(options.headers['X-Worker-Id'], 'remotion-cpu-production');
    assert.equal(options.headers['X-Media-OS-Worker'], 'remotion-cpu-production');
    return {ok: true, status: 200, json: async () => ({
      token: token(requests === 1 ? 'A' : 'B'),
      expiresAt: new Date(now + 60 * 60_000).toISOString(),
    })};
  }, () => now);
  await client.refresh();
  assert.equal(transport.scopedHeaders()['X-MediaOS-Workload-Token'], token('A'));
  now += 30 * 60_000;
  await client.refresh();
  assert.equal(requests, 1);
  now += 20 * 60_000;
  await client.refresh();
  assert.equal(requests, 2);
  assert.equal(transport.scopedHeaders()['X-MediaOS-Workload-Token'], token('B'));
});

test('before backend upgrade 404 causes bounded retry while keeping legacy mode', async () => {
  let now = Date.parse('2026-11-01T20:00:00Z');
  let requests = 0;
  const {transport, client} = setup(async () => {requests++; return {ok: false, status: 404};}, () => now);
  assert.equal(await client.refresh(), null);
  assert.deepEqual(transport.scopedHeaders(), {});
  await client.refresh();
  assert.equal(requests, 1);
  now += 11_000;
  await client.refresh();
  assert.equal(requests, 2);
});

test('401 never falls back silently to a legacy worker token', async () => {
  const {transport, client} = setup(async () => ({ok: false, status: 401}));
  await assert.rejects(client.refresh(), /rejected \(401\)/);
  assert.deepEqual(transport.scopedHeaders(), {});
});

test('rejects malformed or short-lived leases without installing them', async () => {
  for (const payload of [
    {token: 'invalid', expiresAt: '2026-11-01T21:00:00Z'},
    {token: token('A'), expiresAt: '2026-11-01T20:01:00Z'},
  ]) {
    const {transport, client} = setup(async () => ({
      ok: true, status: 200, json: async () => payload,
    }));
    await assert.rejects(client.refresh(), /invalid or expires too soon/);
    assert.deepEqual(transport.scopedHeaders(), {});
  }
});

test('parallel renewals request only one new scoped token', async () => {
  let requests = 0;
  const {client} = setup(async () => {
    requests++;
    await Promise.resolve();
    return {ok: true, status: 200, json: async () => ({
      token: token('A'), expiresAt: '2026-11-01T21:00:00Z',
    })};
  });
  await Promise.all([client.refresh(), client.refresh(), client.refresh()]);
  assert.equal(requests, 1);
});

test('a scoped 401 is repaired by a newly issued lease without a worker restart', async () => {
  let leaseRequests = 0;
  let workRequests = 0;
  let client;
  const transport = createWorkerTokenTransport(token('A'), '',
      async () => client.refresh(true));
  client = createCpuWorkerLeaseClient({
    backendUrl: 'https://example.test', workerId: 'remotion-cpu-production',
    workerKey: 'A'.repeat(64), transport, enabled: true,
    clock: () => Date.parse('2026-11-01T20:00:00Z'),
    fetchImpl: async () => {
      leaseRequests++;
      return {ok: true, status: 200, json: async () => ({
        token: token('B'), expiresAt: '2026-11-01T21:00:00Z',
      })};
    },
  });
  const result = await transport.request('/worker/claim', {
    method: 'POST', headers: transport.scopedHeaders(),
  }, async (_url, options) => {
    workRequests++;
    return {
      status: options.headers['X-MediaOS-Workload-Token'] === token('B') ? 204 : 401,
      ok: options.headers['X-MediaOS-Workload-Token'] === token('B'),
    };
  });
  assert.equal(result.status, 204);
  assert.equal(leaseRequests, 1);
  assert.equal(workRequests, 2);
  assert.equal(transport.scopedHeaders()['X-MediaOS-Workload-Token'], token('B'));
});
