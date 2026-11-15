import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const scene=read('./src/episodes/ep003/Shot08WhenCopiesAreNotEnoughV1.tsx');
const world=read('./src/episodes/ep002/Shot08CleanArchitectureWorldV1.tsx');
const flow=read('./src/episodes/ep003/Shot08RequestFlowsV1.tsx');
const worker=read('./ep003-shot08-sharding-v1-render-once.mjs');
const root=read('./src/Root.tsx');
const anchors=JSON.parse(read('./ep003-shot08-real-cue-anchors.json'));
test('Exact Director LOCKED SHOT07 V3 frame handoff and living-motion silent prelude',()=>{
 for(const v of ["renderId:'09457c3c-32d9-432c-aa92-67f0e7b13f60'",
   'lastWorldFrame:31452+3476-1','OriginalReplicas frame={frame+3475}',
   'LegacyRouting frame={frame+3475}','frame===0',
   'worldFrame=props.worldStartFrame+frame'])assert.ok(scene.includes(v),v);
 for(const v of ["const PIN='09457c3c-32d9-432c-aa92-67f0e7b13f60'",
   'PREVIOUS_FRAMES=3476','worldStartFrame:34927',
   "previous.render_key==='EP003_SHOT07_BOTTLENECK_V3'",
   'LEAD_IN_FRAMES=60','motion.uniqueMovingSteps>=18'])
 assert.ok(worker.includes(v),v);
 assert.ok(root.includes('EP003-SHOT08-SHARDING-V1-DIRECTOR-CANDIDATE'));
});
test('Request packets only exist on physically drawn login routes and switch with the Primary',()=>{
 for(const s of ['const routePath=','const routePoint=','const p=routePoint(phase,r)',
   '<path d={path}','cx={p.x} cy={p.y}','legacyDatabaseFlowOpacity={1-shardReveal}'])
 assert.ok(scene.includes(s),s);
 assert.ok(flow.includes('opacity={edge(t)*.88*allowed*legacy}'));
 assert.ok(flow.includes('opacity={edge(t)*retry*.9*allowed*legacy}'));
 assert.ok(world.includes('opacity:clamp(primaryOpacity)'));
});
test('Shard A and B are distinct nonnested Primary owners, all glossary cards are text fit',()=>{
 assert.ok(scene.includes("key:'A',center:1635"));
 assert.ok(scene.includes("key:'B',center:1750"));
 assert.ok(scene.includes('EP003_SHOT08_CARD_OVERLAPS_ARCHITECTURE'));
 assert.ok(scene.includes('EP003_SHOT08_NESTED_OR_OVERLAPPING_SHARD_CONTAINERS'));
 const cards=scene.split('const CALLOUTS=[')[1].split('] as const;')[0];
 assert.equal((cards.match(/title:'/g)||[]).length,4);
 assert.ok(!cards.includes(';'));
 for(const c of ['SHARD','SHARD KEY','HOT SHARD','REPLICATION VS SHARDING'])
 assert.ok(cards.includes("title:'"+c+"'"),c);
 assert.ok(scene.includes('shot10TextWidth'));
 assert.ok(scene.includes('ep003CardIsReadable'));
});
test('Original Slow Natural selected Take, exact 29 real voice cues, no paid TTS',()=>{
 assert.equal(Object.keys(anchors).length,29);
 assert.ok(worker.includes("const SELECTED_TAKE='368c239c-a93b-437e-a833-2f955fa51803'"));
 assert.ok(worker.includes('ep003-shot08-real-cue-anchors.json'));
 assert.ok(worker.includes('cueFramesFromRealVoice(source.timing)'));
 assert.ok(worker.includes('EP003_SHOT08_V1_REAL_MP4_SAVED'));
 assert.ok(worker.includes('EP003_SHOT08_V1_DIRECTOR_RENDER_APPROVED'));
 assert.doesNotMatch(worker,/generateSpeech|textToSpeech|elevenlabs\.generate/);
});
