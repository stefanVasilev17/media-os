import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const scene=read('./src/episodes/ep003/Shot09WhenPrimaryDisappearsV1.tsx');
const source=read('./src/episodes/ep003/Shot08WhenCopiesAreNotEnoughV2.tsx');
const worker=read('./ep003-shot09-failover-v1-render-once.mjs');
const root=read('./src/Root.tsx');
const anchors=JSON.parse(read('./ep003-shot09-real-cue-anchors.json'));
test('SHOT09 starts exactly from Director locked SHOT08 V2 decoded final frame',()=>{
 for(const a of ["renderId:'22059373-cc17-44fd-ad03-56d092cc57dc'",
 "sha256:'3ad48fefdc2c887380ca44f2c04e6d6ac342557dc78422a3a7272ccb26291118'",
 'frames:5372,lastWorldFrame:34927+5372-1',
 'frame===0','frame+3475+5372','worldFrame=props.worldStartFrame+frame'])
 assert.ok(scene.includes(a),a);
 for(const a of ["const PIN='22059373-cc17-44fd-ad03-56d092cc57dc'",
 'PREVIOUS_FRAMES=5372','worldStartFrame:40298',
 'select=eq(n\\\\,5371)',
 "previous.render_key==='EP003_SHOT08_SHARDING_V2'",
 'LEAD_IN_FRAMES=60'])assert.ok(worker.includes(a),a);
 assert.ok(root.includes('EP003-SHOT09-FAILOVER-V1-DIRECTOR-CANDIDATE'));
});
test('Failover is understandable and request dots never leave rendered paths',()=>{
 for(const a of ['PRIMARY_FAIL','PROMOTE','LEGITIMATE_OWNER','SPLIT_BRAIN',
  'FENCING','ASYNC','DATA_LOSS','TEST_FAILURES',
  'const RECOVERY_ROUTE=','const point=routePoint(phase,RECOVERY_ROUTE)',
  'cx={point.x} cy={point.y}','<path d={routePath(RECOVERY_ROUTE)}',
  'hotA={loss}','visibility={recovery}'])assert.ok(scene.includes(a),a);
 assert.ok(scene.includes("i===0&&warning>.72"));
 assert.ok(scene.includes("i===0?1-clamp(hotA)*.92:1"));
 assert.ok(scene.includes('primaryOpacity={0} legacyDatabaseFlowOpacity={0}'));
 assert.ok(source.includes('meaning:\'Replication copies the same data.'));
});
test('All named glossary cards fit and preserve existing replica geometry',()=>{
 const cards=scene.split('const CALLOUTS=[')[1].split('] as const;')[0];
 assert.equal((cards.match(/title:'/g)||[]).length,5);
 assert.ok(!cards.includes(';'));
 for(const key of ['FAILOVER','SPLIT-BRAIN','FENCING','ASYNCHRONOUS REPLICATION','RECOVERY TRADE-OFF'])
 assert.ok(cards.includes("title:'"+key+"'"),key);
 assert.ok(scene.includes('shot10TextWidth'));
 assert.ok(scene.includes('EP003_SHOT09_CARD_OVERLAPS_ARCHITECTURE'));
 assert.ok(scene.includes("key:'A',center:1606"));
 assert.ok(scene.includes("key:'B',center:1771"));
 assert.ok(scene.includes('REPLICA_TITLE_BASELINE_OFFSET=98'));
 assert.ok(scene.includes('REPLICA_ICON_SCALE=.92'));
 assert.ok(scene.includes('const layout=1;'));
});
test('Only original selected natural narration and 24 real aligned voice events, no paid generation',()=>{
 assert.equal(Object.keys(anchors).length,24);
 assert.ok(worker.includes("const SELECTED_TAKE='7510815a-d096-415f-b4f0-52ae8398ce45'"));
 assert.ok(worker.includes('ep003-shot09-real-cue-anchors.json'));
 for(const v of ['cueFramesFromRealVoice(source.timing)',
  'EP003_SHOT09_V1_DIRECTOR_RENDER_APPROVED',
  'EP003_SHOT09_V1_REAL_MP4_SAVED',
  'EP003_SHOT09_PRE_RENDER_P0_STILL_QA',
  'EP003_SHOT09_P0_REAL_SEAM_AND_MOTION_QA'])
 assert.ok(worker.includes(v),v);
 assert.doesNotMatch(worker,/generateSpeech|textToSpeech|elevenlabs\\.generate/);
});
test('Never bypass actual encoded seam or live motion QA',()=>{
 assert.ok(worker.includes('EP003_SHOT09_V1_FIRST_FRAME_DETERMINISTIC_ENCODE_REQUIRED'));
 assert.ok(worker.includes("overlay=0:0:enable='eq(n,0)'"));
 assert.ok(worker.includes("assert(Number.isFinite(psnr)&&psnr>=27"));
 assert.ok(worker.includes('motion.uniqueMovingSteps>=18'));
 assert.ok(worker.includes('motion.firstStep>0.12&&motion.firstStep<4.5'));
});
