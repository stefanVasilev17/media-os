import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {EP004_SHOT01_LOCKED_SOURCE_SHA256} from './src/components/architectural-thinking/EP004Shot01World.mjs';
import {SHOT06_BEATS} from './src/components/architectural-thinking/EP004Shot06FleetPreview.mjs';
import {EP004_SHOT06_COMPOSITION,EP004_SHOT06_PREDECESSOR,validateEp004Shot06Production,verifyEp004Shot06ActualMotion} from './src/components/architectural-thinking/EP004Shot06ProductionWorld.mjs';
// Synthetic regression fixtures only; never used as live selected media metadata.
const approvedPrior={
  episodeKey:'EP004',shotKey:'SHOT04',previewOnly:false,
  directorCpuApproved:true,sourceSha256:EP004_SHOT01_LOCKED_SOURCE_SHA256,
  previousRenderId:'20758da0-46f9-4973-9ef8-ec93eb437a5a',
  previousSourceCommit:'714d7c31affb84793780eee42bc5062387b069a7',
  previousFrameCount:2234,previousLastEncodedFrame:2233,
  previousVideoSha256:'a'.repeat(64),worldStartFrame:6356,
  durationInFrames:2791,breathFrames:72,scriptRevision:1,
  voiceTakeId:'00000000-0000-4000-8000-000000000004',
  narrationSha256:'b'.repeat(64),
  expectedSourceCommit:'07bda35ffc4e89caf72dff280c8c070d3637a310',
  shotTitle:'Two Gateways, One Shared Pressure',
  verifiedCues:[
    {beatId:'SHOT04_P01_B01',anchor:'Narration anchor primary',startFrame:93,endFrame:165},
    {beatId:'SHOT04_P02_B01',anchor:'Narration anchor teams',startFrame:410,endFrame:520}
  ],
  visualBeats:[
    {beatId:'SHOT04_P01_B01',cueAnchor:'Narration anchor primary',direction:'Primary gateway traffic'},
    {beatId:'SHOT04_P02_B01',cueAnchor:'Narration anchor teams',direction:'Teams through gateway'}
  ],
};
const cues=[
  {beatId:'SHOT05_P01_B01',anchor:'Original gateway route',startFrame:105,endFrame:210},
  {beatId:'SHOT05_P02_B01',anchor:'Original shared pressure',startFrame:515,endFrame:620},
  {beatId:'SHOT05_P03_B01',anchor:'Original route change',startFrame:940,endFrame:1050},
];
const beats=[
  {beatId:cues[0].beatId,cueAnchor:cues[0].anchor,direction:'Outlook enters Primary gateway and Exchange mailbox'},
  {beatId:cues[1].beatId,cueAnchor:cues[1].anchor,direction:'Teams and Outlook converge on shared gateway pressure'},
  {beatId:cues[2].beatId,cueAnchor:cues[2].anchor,direction:'Reroute Teams traffic and follow the failover'},
];
const props={
  episodeKey:'EP004',shotKey:'SHOT05',previewOnly:false,
  directorCpuApproved:true,sourceSha256:EP004_SHOT01_LOCKED_SOURCE_SHA256,
  previousRenderId:'443dce4e-aa25-4b0f-a69b-26fe26a9d21b',
  previousSourceCommit:'07bda35ffc4e89caf72dff280c8c070d3637a310',
  previousFrameCount:2791,previousLastEncodedFrame:2790,
  previousWorldStartFrame:6356,worldStartFrame:9146,
  previousVideoSha256:'d'.repeat(64),previousShot04Props:approvedPrior,
  durationInFrames:2250,breathFrames:72,scriptRevision:1,
  voiceTakeId:'00000000-0000-4000-8000-000000000005',
  narrationSha256:'c'.repeat(64),expectedSourceCommit:'e'.repeat(40),
  shotTitle:'Gateway Failover and Real Traffic',
  verifiedCues:cues,visualBeats:beats,
};

const lock=EP004_SHOT06_PREDECESSOR;
const starts=[90,270,480,660,870,1190,1450,1690,1950,2180];
const verifiedCues=SHOT06_BEATS.map((beatId,i)=>({beatId,anchor:'Synthetic cue '+i,startFrame:starts[i],endFrame:starts[i]+80}));
const prior={...props,durationInFrames:lock.frames,expectedSourceCommit:lock.sourceCommit};
const prod={episodeKey:'EP004',shotKey:'SHOT06',previewOnly:false,directorCpuApproved:true,sourceSha256:EP004_SHOT01_LOCKED_SOURCE_SHA256,previousRenderId:lock.renderId,previousSourceCommit:lock.sourceCommit,previousFrameCount:lock.frames,previousLastEncodedFrame:lock.frames-1,previousWorldStartFrame:prior.worldStartFrame,worldStartFrame:prior.worldStartFrame+lock.frames-1,previousVideoSha256:'f'.repeat(64),previousShot05Props:prior,breathFrames:72,scriptRevision:1,voiceTakeId:'00000000-0000-4000-8000-000000000006',narrationSha256:'a'.repeat(64),voiceAudioSha256:'b'.repeat(64),voiceAudioBytes:5000,expectedSourceCommit:'c'.repeat(40),packageId:'00000000-0000-4000-8000-000000000010',renderRequestId:'00000000-0000-4000-8000-000000000011',shotTitle:'When The Route Changes, So Does The Risk',durationInFrames:2460,verifiedCues,visualBeats:verifiedCues.map(c=>({beatId:c.beatId,cueAnchor:c.anchor,direction:'Illustrative motion fixture'}))};

import {EP004_SHOT07_COMPOSITION,EP004_SHOT07_PREDECESSOR,SHOT07_BEATS,SHOT07_EVENTS,REEL_OUTPUTS,shot07State,validateEp004Shot07Production,verifyEp004Shot07ActualMotion} from './src/components/architectural-thinking/EP004Shot07ProductionWorld.mjs';
import {SHOT06_OUTPUTS,shot06Length,shot06Point} from './src/components/architectural-thinking/EP004Shot06FleetPreview.mjs';
const previous={...prod,durationInFrames:2373,expectedSourceCommit:EP004_SHOT07_PREDECESSOR.sourceCommit};
const starts07=[90,320,630,980,1180,1500,2200,2750];
const cues07=SHOT07_BEATS.map((beatId,i)=>({beatId,anchor:'Synthetic regression anchor '+i,startFrame:starts07[i],endFrame:starts07[i]+40}));
const eventFrames={FLEET_B_FAIL:800,AFFECTED_PERCENT:1080,ELAPSED_PERIOD:1220,REEL_START:1500,REEL_RESCUE:1760,REEL_PRESSURE:2200,REEL_B_FAIL:2400,REEL_REDIRECT:2570,LOCAL_VS_GLOBAL:2850,PAYOFF:3000};
const target={...prod,shotKey:'SHOT07',previousRenderId:EP004_SHOT07_PREDECESSOR.renderId,previousSourceCommit:EP004_SHOT07_PREDECESSOR.sourceCommit,previousFrameCount:2373,previousLastEncodedFrame:2372,previousWorldStartFrame:previous.worldStartFrame,worldStartFrame:previous.worldStartFrame+2372,previousShot06Props:previous,verifiedCues:cues07,visualBeats:cues07.map(c=>({beatId:c.beatId,cueAnchor:c.anchor,direction:'Synthetic regression visual event'})),eventFrames,durationInFrames:3240,shotTitle:'The Cascade'};
test('SHOT07 exact real predecessor identity and fail-closed cue contract',()=>{
 assert.equal(EP004_SHOT07_COMPOSITION,'EP004-SHOT07-CASCADING-FAILURE-V1-VISUAL');
 assert.equal(validateEp004Shot07Production(target),true);
 assert.equal(verifyEp004Shot07ActualMotion(target).status,'PASS');
 for(const change of [{previousRenderId:prod.previousRenderId},{previousSourceCommit:'0'.repeat(40)},{previousFrameCount:2372},{previousLastEncodedFrame:2371},{previousVideoSha256:''},{voiceAudioSha256:''},{voiceAudioBytes:0},{previewOnly:true},{directorCpuApproved:false},{verifiedCues:[]},{visualBeats:[]},{eventFrames:{}},{eventFrames:{...eventFrames,REEL_B_FAIL:2100}},{eventFrames:{...eventFrames,AFFECTED_PERCENT:900}}]){
   assert.throws(()=>validateEp004Shot07Production({...target,...change}));
 }
 assert.throws(()=>validateEp004Shot07Production(target,true),/DECODED_LOCKED_FRAME_REQUIRED/);
 assert.equal(validateEp004Shot07Production({...target,previousLastFrameDataUri:'data:image/png;base64,QUJD'},true),true);
});
test('SHOT07 living inherited fleet, causal failure and factual cue gating',()=>{
 const s=f=>shot07State(f,target);
 assert.equal(s(0).states[0].status,'Unresponsive');
 assert.equal(s(0).states[1].status,'Higher load');
 assert.ok(new Set(Array.from({length:30},(_,i)=>JSON.stringify(s(i).packets))).size>=20);
 assert.equal(s(799).states[1].status,'Higher load');
 assert.equal(s(800).states[1].status,'Unresponsive');
 assert.equal(s(1079).percentage,false);assert.equal(s(1080).percentage,true);
 assert.equal(s(1219).elapsed,false);assert.equal(s(1220).elapsed,true);
 const after=s(950).packets.filter(x=>x.phase==='TO_SERVER');
 assert.ok(after.length>0);assert.ok(after.every(x=>x.destination===2));
});
test('SHOT07 independent centered reel has genuine rescue, failure and final contrast',()=>{
 const s=f=>shot07State(f,target);
 assert.equal(s(1500).stage,'reel');assert.equal(s(1500).states[0].status,'Unresponsive');
 assert.equal(s(1500).states[1].status,'Serving');
 assert.ok(Array.from({length:320},(_,i)=>s(1770+i)).some(x=>x.packets.some(p=>p.phase==='RESPONSE')));
 assert.equal(s(2399).states[1].status,'Higher load');assert.equal(s(2400).states[1].status,'Unresponsive');
 assert.ok(s(2750).packets.filter(x=>x.phase==='TO_SERVER').every(x=>x.destination===2));
 assert.equal(s(2849).globalBad,false);assert.equal(s(2850).globalBad,true);
 assert.equal(s(3239).routerGood,true);assert.equal(s(3239).payoff,true);
 for(const path of REEL_OUTPUTS)for(const [x,y] of path){assert.ok(x>=656&&x<=1264);assert.ok(y>=0&&y<=1080);}
});
test('SHOT07 worker preflight and final mux/seam execute before paid render completion',async()=>{
 const w=await readFile(new URL('./cpu-worker.mjs',import.meta.url),'utf8');
 const run=w.slice(w.indexOf('async function render(job)'));
 assert.ok(w.includes('const EP004_SHOT07_REAL=EP004_SHOT07_COMPOSITION;'));
 const voice=run.indexOf('await fetchEp004Shot07ApprovedVoice(job,inputProps)');
 const pred=run.indexOf('await preflightEp004Shot07PreviousVideo(job,inputProps,shot07SourceScratch)');
 const cpu=run.indexOf('await renderMedia(');
 const mux=run.indexOf('await muxEp004Shot07ApprovedVoice(job,outputPath,inputProps)');
 const seam=run.indexOf('await verifyEp004Shot07SeamAndMotion(job,outputPath,');
 const complete=run.indexOf('await complete(job.renderId, outputPath)',seam);
 assert.ok(voice>=0&&pred>voice&&cpu>pred&&mux>cpu&&seam>mux&&complete>seam);
 assert.ok(w.includes('SHOT07_SELECTED_VOICE_SHA256_CHANGED'));
 assert.ok(w.includes('SHOT07_LOCKED_PREDECESSOR_SHA256_CHANGED'));
});
test('SHOT07 one-frame actual seam and protected original scene',async()=>{
 const scene=await readFile(new URL('./src/episodes/ep004/Shot07ProductionScene.tsx',import.meta.url),'utf8');
 assert.ok(scene.includes('frame===0&&props.previousLastFrameDataUri'));
 assert.ok(scene.includes('Microsoft preliminary report'));
 assert.ok(scene.includes('s.elapsed&&'));
 assert.ok(!scene.includes('Schematic fleet'));
 assert.ok(!scene.includes('ILLUSTRATIVE REQUEST'));
 assert.ok(scene.includes('Routing decision'));
 assert.ok(scene.includes('Shared availability'));
});

test('SHOT07 V2 Director feedback: return packets red in all diagram views; preserve other directions and remove only rejected copy',async()=>{
 const scene=await readFile(new URL('./src/episodes/ep004/Shot07ProductionScene.tsx',import.meta.url),'utf8');
 const layer=scene.slice(scene.indexOf('const PacketLayer:'),scene.indexOf('const Fleet:'));
 assert.equal((layer.match(/p\.phase==='RESPONSE'\?RED:p\.phase==='STOPPED'\?AMBER:color\(p\.lane\)/g)||[]).length,2);
 assert.ok(!layer.includes("RESPONSE'?GREEN"));
 assert.ok(scene.includes('<PacketLayer s={s}/>'));
 assert.ok(scene.includes('<PacketLayer s={s} reel/>'));
 assert.ok(!/Schematic fleet|ILLUSTRATIVE REQUEST/i.test(scene));
 for(const text of ['Microsoft preliminary report','Affected gateway servers','Less than two hours','Routing decision','Shared availability','frame===0&&props.previousLastFrameDataUri'])
   assert.ok(scene.includes(text),text);
});
