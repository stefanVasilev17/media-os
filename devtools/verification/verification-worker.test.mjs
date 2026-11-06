import test from 'node:test';
import assert from 'node:assert/strict';
import {allowedLease,STAGES,commandEnvironment} from './verification-worker.mjs';

const good={
  repository:'stefanVasilev17/media-os',
  sourceBranch:'feat/mediaos-ep002-unified-product-integration',
  sourceCommit:'a'.repeat(40),
  runId:'11111111-2222-4333-8444-555555555555',
  leaseId:'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'
};

test('accepted lease is only for exact MediaOS repo, branch, SHA and UUIDs',()=>{
  assert.equal(allowedLease(good),true);
  assert.equal(allowedLease({...good,repository:'someone/other'}),false);
  assert.equal(allowedLease({...good,sourceBranch:'main'}),false);
  assert.equal(allowedLease({...good,sourceCommit:'abc'}),false);
  assert.equal(allowedLease({...good,runId:'not-a-uuid'}),false);
  assert.equal(allowedLease({...good,leaseId:'not-a-uuid'}),false);
  assert.equal(allowedLease(null),false);
});

test('all four real verification stages are fixed and ordered',()=>{
  assert.deepEqual(STAGES.map(s=>s.stage),
    ['asset-check','backend','frontend','remotion']);
  assert.ok(STAGES.every(s=>s.timeout>0&&s.timeout<=1800000));
});

test('worker secrets never reach git or Docker subprocess environment',()=>{
  const keys=[
    'MEDIAOS_VERIFICATION_WORKLOAD_TOKEN','OPENAI_API_KEY',
    'ELEVENLABS_API_KEY','DATABASE_URL','RAILWAY_TOKEN',
    'MEDIA_OS_RENDER_WORKER_KEY'
  ];
  const env=commandEnvironment();
  for(const key of keys)assert.equal(
    Object.hasOwn(env,key),false,'Unsafe inherited key '+key);
  assert.equal(env.CI,'true');
  assert.equal(env.GIT_TERMINAL_PROMPT,'0');
});
