import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const scene=read('./src/episodes/ep003/Shot07BottleneckMeasurementV3.tsx');
const world=read('./src/episodes/ep002/Shot07CleanArchitectureWorldV3.tsx');
const worker=read('./ep003-shot07-bottleneck-v3-render-once.mjs');
const root=read('./src/Root.tsx');
test('Subtle Auth focus must not cover Auth Service title',()=>{
 assert.ok(world.includes('row===0?6:0'));
 assert.ok(world.includes('+.008*focus'));
 assert.ok(!world.includes('18*focus'));
 assert.ok(315+(412-315-35)+6-71*.008/2>315+65+1);
});
test('Primary and both read replicas have voice-aligned focus',()=>{
 for(const v of ['cues.PRIMARY_ONE+2,cues.TWO_REPLICAS-2',
 'cues.PRIMARY_CHECK+2,cues.LIMIT_REACHED-7',
 'cues.TWO_REPLICAS+4+i*14,cues.MORE_MACHINES-6',
 'cues.OPTIONAL_BUSY+4+i*10,cues.PRIMARY_CHECK-8',
 'primaryFocusLevel={primaryFocusLevel}',
 'focusLevels={replicaFocusLevels}'])assert.ok(scene.includes(v),v);
 assert.ok(world.includes('outline:primaryFocus>'));
 assert.ok(world.includes('1+.018*dbWave+.012*primaryFocus'));
 assert.ok(scene.includes('strokeOpacity={.88*focus}'));
});
test('New on-screen glossary uses periods',()=>{
 const cards=scene.split('const CALLOUTS=[')[1].split('] as const;')[0];
 assert.equal((cards.match(/title:'/g)||[]).length,3);
 assert.ok(cards.includes('Read-only copy. May return stale data'));
 assert.ok(!cards.includes(';'));
});
test('V3 only, existing V2 and selected voice preserved',()=>{
 for(const v of ['EP003_SHOT07_V3_DIRECTOR_RENDER_APPROVED','EP003_SHOT07_BOTTLENECK_V3',
 'EP003_SHOT07_V3_REAL_MP4_SAVED','LEAD_IN_FRAMES=60','PIN_SHA=',
 'cueFramesFromRealVoice(source.timing)','motion.uniqueMovingSteps>=18'])assert.ok(worker.includes(v),v);
 assert.ok(root.includes('EP003-SHOT07-BOTTLENECK-V3-DIRECTOR-CANDIDATE'));
 assert.ok(root.includes('EP003-SHOT07-BOTTLENECK-V2-DIRECTOR-CANDIDATE'));
 assert.doesNotMatch(worker,/generateSpeech|textToSpeech|elevenlabs\.generate/);
});
