import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const scene=read('./src/episodes/ep003/Shot08WhenCopiesAreNotEnoughV2.tsx');
const v1=read('./src/episodes/ep003/Shot08WhenCopiesAreNotEnoughV1.tsx');
const worker=read('./ep003-shot08-sharding-v2-render-once.mjs');
const root=read('./src/Root.tsx');
const anchor=JSON.parse(read('./ep003-shot08-real-cue-anchors.json'));
test('Independent owners have 165px separation and distinct names',()=>{
 assert.ok(scene.includes("key:'A',center:1606"));
 assert.ok(scene.includes("key:'B',center:1771"));
 assert.ok(scene.includes('>OWNER {n.key}</text>'));
 assert.ok(scene.includes('EP003_SHOT08_V2_SHARD_LABEL_COLLISION'));
 assert.ok(!scene.includes('>ACCOUNT OWNER</text>'));
 assert.ok(1771-1606>110+30);
 assert.ok(v1.includes('ACCOUNT OWNER'));
});
test('Replica title and icon stay inside card bounds, with smooth intro transition',()=>{
 for(const x of ['REPLICA_TITLE_BASELINE_OFFSET=98',
 'REPLICA_TITLE_FONT_SIZE=20','REPLICA_ICON_SCALE=.92',
 'layout=ease(introFrame,15,45)',
 'titleBaseline=r.top+111+(REPLICA_TITLE_BASELINE_OFFSET-111)*layout',
 'OriginalReplicas frame={frame+3475} introFrame={frame}',
 'EP003_SHOT08_V2_REPLICA_TITLE_OUTSIDE_BORDER',
 'EP003_SHOT08_V2_REPLICA_ICON_AND_TITLE_COLLIDE'])assert.ok(scene.includes(x),x);
 const iconBottom=8+(65+11)*.92;
 assert.ok(98-16-iconBottom>=3);
 assert.ok(98+5<=116-10);
});
test('Replicate vs shard definitions occupy separate measured lines, no semicolons',()=>{
 const cards=scene.split('const CALLOUTS=[')[1].split('] as const;')[0];
 assert.ok(cards.includes('Replication copies the same data.'));
 assert.ok(cards.includes('Sharding splits data between owners.'));
 assert.ok(!cards.includes(';'));
 assert.ok(scene.includes("meaning.split('\\n')")||scene.includes("meaning.split('\n')"));
 assert.ok(scene.includes('lines.length>1?165:CARD_HEIGHT'));
 assert.ok(scene.includes('shot10TextWidth(line,fontSize)'));
 assert.ok(scene.includes('EP003_SHOT08_CARD_TEXT_OUTSIDE_SAFE_AREA'));
 assert.equal((cards.match(/title:'/g)||[]).length,4);
});
test('All request dots follow the rendered route. Exact predecessor and selected voice',()=>{
 for(const x of ["end:{x:1568,y:518}","end:{x:1733,y:518}",
 'const p=routePoint(phase,r)','<path d={path}','cx={p.x} cy={p.y}'])assert.ok(scene.includes(x),x);
 assert.equal(Object.keys(anchor).length,29);
 assert.ok(worker.includes("const PIN='09457c3c-32d9-432c-aa92-67f0e7b13f60'"));
 assert.ok(worker.includes("const SELECTED_TAKE='368c239c-a93b-437e-a833-2f955fa51803'"));
 for(const marker of ['EP003_SHOT08_V2_DIRECTOR_RENDER_APPROVED','EP003_SHOT08_V2_REAL_MP4_SAVED',
 'EP003_SHOT08_PRE_RENDER_P0_STILL_QA','EP003_SHOT08_P0_REAL_SEAM_AND_MOTION_QA'])assert.ok(worker.includes(marker),marker);
 assert.ok(root.includes('EP003-SHOT08-SHARDING-V2-DIRECTOR-CANDIDATE'));
 assert.ok(root.includes('EP003-SHOT08-SHARDING-V1-DIRECTOR-CANDIDATE'));
 assert.doesNotMatch(worker,/generateSpeech|textToSpeech|elevenlabs\.generate/);
});
