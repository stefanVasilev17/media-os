import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const scene=read('./src/episodes/ep003/Shot07BottleneckMeasurementV2.tsx');
const world=read('./src/episodes/ep002/Shot07CleanArchitectureWorld.tsx');
const worker=read('./ep003-shot07-bottleneck-v2-render-once.mjs');
const root=read('./src/Root.tsx');
test('Director: replace generic cards with three real architectural glossary concepts',()=>{
 const cards=scene.split('const CALLOUTS=[')[1].split('] as const;')[0];
 assert.equal((cards.match(/title:'/g)||[]).length,3);
 for(const v of ['READ REPLICA','CRITICAL PATH','THE REAL BOTTLENECK'])assert.ok(cards.includes("title:'"+v+"'"));
 for(const v of ['MORE SYSTEM, SAME LIMIT','CRITICAL ACCOUNT LOOKUP','PRIMARY STILL REQUIRED','USERS STILL CANNOT LOG IN','A DIFFERENT NEXT STEP'])assert.ok(!scene.includes(v),v);
 assert.ok(scene.includes('ep003CardIsReadable'));
 assert.ok(!scene.includes('{primaryLabel}')&&!scene.includes('{replicaLabel}'));
});
test('Voice-locked sequential Auth 01–03 container lift with opt-in backward compatibility',()=>{
 for(const v of ['props.cueFrames.THREE_AUTH+6+i*12','props.cueFrames.PRIMARY_ONE-13','authFocusLevels={authFocusLevels}'])assert.ok(scene.includes(v),v);
 for(const v of ['authFocusLevels?:readonly [number,number,number]','const focus=i<3?clamp(authFocusLevels?.[row]??0):0',"focus>0?'translate3d(0,-'"])assert.ok(world.includes(v),v);
});
test('Real selected voice only; pinned unchanged SHOT06; verified MP4, no TTS',()=>{
 for(const v of ['PIN_SHA=','worldStartFrame:31452','cueFramesFromRealVoice(source.timing)','LEAD_IN_FRAMES=60','motion.uniqueMovingSteps>=18','EP003_SHOT07_V2_REAL_MP4_SAVED','EP003_SHOT07_V2_DIRECTOR_RENDER_APPROVED','EP003_SHOT07_BOTTLENECK_V2'])assert.ok(worker.includes(v),v);
 assert.doesNotMatch(worker,/elevenlabs\.generate|generateSpeech|textToSpeech/);
 assert.ok(root.includes('EP003-SHOT07-BOTTLENECK-V2-DIRECTOR-CANDIDATE'));
});
