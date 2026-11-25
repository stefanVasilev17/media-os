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

import {EP004_SHOT08_COMPOSITION,EP004_SHOT08_PREDECESSOR,SHOT08_BEATS,SHOT08_EVENTS,shot08State,validateEp004Shot08Production,verifyEp004Shot08ActualMotion,PRIMARY_ROUTES,ALT_ROUTES} from './src/components/architectural-thinking/EP004Shot08ProductionWorld.mjs';
const previous08={...target,expectedSourceCommit:EP004_SHOT08_PREDECESSOR.sourceCommit,durationInFrames:2606,verifiedCues:target.verifiedCues.map((c,i)=>({...c,startFrame:[90,280,600,900,1150,1368,1778,2220][i],endFrame:[90,280,600,900,1150,1368,1778,2220][i]+40})),eventFrames:{FLEET_B_FAIL:730,AFFECTED_PERCENT:984,ELAPSED_PERIOD:1142,REEL_START:1368,REEL_RESCUE:1649,REEL_PRESSURE:1778,REEL_B_FAIL:1910,REEL_REDIRECT:1992,LOCAL_VS_GLOBAL:2311,PAYOFF:2441}};
const start08=[90,300,510,870,1200,1500,1800,2150,2440,2600];
const cues08=SHOT08_BEATS.map((beatId,i)=>({beatId,anchor:'Synthetic regional cue '+i,startFrame:start08[i],endFrame:start08[i]+35}));
const events08={BULKHEAD:540,SEPARATE_ISSUE:1080,WIDER_IMPACT:1300,SERVICE_NAMES:1690,ALTERNATE_RECOVERY:1780,EXCHANGE_CONSTRAINT:2010,USER_CONTRAST:2600};
const p08={...target,shotKey:'SHOT08',previousRenderId:EP004_SHOT08_PREDECESSOR.renderId,previousSourceCommit:EP004_SHOT08_PREDECESSOR.sourceCommit,previousFrameCount:2606,previousLastEncodedFrame:2605,previousWorldStartFrame:previous08.worldStartFrame,worldStartFrame:previous08.worldStartFrame+2605,previousShot07Props:previous08,verifiedCues:cues08,visualBeats:cues08.map(c=>({beatId:c.beatId,cueAnchor:c.anchor,direction:'Synthetic regression region view'})),eventFrames:events08,durationInFrames:2800};

import {EP004_SHOT09_COMPOSITION,EP004_SHOT09_PREDECESSOR,SHOT09_BEATS,SHOT09_EVENTS,shot09State,validateEp004Shot09Production,verifyEp004Shot09ActualMotion,PROBE_ROUTE,WORK_ROUTE} from './src/components/architectural-thinking/EP004Shot09ProductionWorld.mjs';
const lock08={...p08,durationInFrames:2719,expectedSourceCommit:EP004_SHOT09_PREDECESSOR.sourceCommit};
const starts09=[74,425,726,925,1116,1349,1590,1836,1974,2146,2251];
const cue09=SHOT09_BEATS.map((beatId,i)=>({beatId,anchor:'Synthetic QA anchor '+i,startFrame:starts09[i],endFrame:starts09[i]+20}));
const events09=Object.fromEntries(SHOT09_EVENTS.map((k,i)=>[k,[213,277,326,504,563,726,868,1046,1219,1349,1590,1707,1836,1974,2146,2251][i]]));
const p09={...p08,shotKey:'SHOT09',previousRenderId:EP004_SHOT09_PREDECESSOR.renderId,previousSourceCommit:EP004_SHOT09_PREDECESSOR.sourceCommit,previousFrameCount:2719,previousLastEncodedFrame:2718,previousWorldStartFrame:lock08.worldStartFrame,worldStartFrame:lock08.worldStartFrame+2718,previousShot08Props:lock08,verifiedCues:cue09,visualBeats:cue09.map(c=>({beatId:c.beatId,cueAnchor:c.anchor,direction:'Synthetic QA state'})),eventFrames:events09,durationInFrames:2457};

import {EP004_SHOT10_PREDECESSOR,SHOT10_BEATS,SHOT10_EVENTS,shot10State,validateEp004Shot10Production,verifyEp004Shot10ActualMotion,REPLAY_ROUTE,WIDE_ROUTE,FLEET_ROUTES} from './src/components/architectural-thinking/EP004Shot10ProductionWorld.mjs';
const lock09={...p09,expectedSourceCommit:EP004_SHOT10_PREDECESSOR.sourceCommit};
const starts10=[74,410,890,1250,1740,2210];
const cue10=SHOT10_BEATS.map((beatId,i)=>({beatId,anchor:'Synthetic QA anchor '+i,startFrame:starts10[i],endFrame:starts10[i]+20}));
const events10=Object.fromEntries(SHOT10_EVENTS.map((k,i)=>[k,[180,350,435,850,920,1250,1470,1680,1770,1900,2100,2220,2330,2600][i]]));
const p10={...p09,shotKey:'SHOT10',previousRenderId:EP004_SHOT10_PREDECESSOR.renderId,previousSourceCommit:EP004_SHOT10_PREDECESSOR.sourceCommit,previousFrameCount:2457,previousLastEncodedFrame:2456,previousWorldStartFrame:lock09.worldStartFrame,worldStartFrame:lock09.worldStartFrame+2456,previousShot09Props:lock09,verifiedCues:cue10,visualBeats:cue10.map(c=>({beatId:c.beatId,cueAnchor:c.anchor,direction:'Synthetic QA state'})),eventFrames:events10,durationInFrames:2850};
test('SHOT10 protected predecessor, six original cues and exact voice contract',()=>{
 assert.equal(validateEp004Shot10Production(p10),true);
 assert.equal(verifyEp004Shot10ActualMotion(p10).status,'PASS');
 for(const change of [{previousRenderId:'bad'},{previousSourceCommit:'0'.repeat(40)},{previousFrameCount:2456},{previousLastEncodedFrame:2455},{previousVideoSha256:''},{voiceAudioSha256:''},{previewOnly:true},{verifiedCues:[]},{eventFrames:{}}])assert.throws(()=>validateEp004Shot10Production({...p10,...change}));
 assert.throws(()=>validateEp004Shot10Production(p10,true),/DECODED_LOCKED_FRAME_REQUIRED/);
});
test('SHOT10 exact live SHOT09 phase and causal controlled admission',()=>{
 const s=f=>shot10State(f,p10),e=events10;
 assert.deepEqual(s(0).prior,shot09State(2456,lock09));
 assert.ok(new Set(Array.from({length:30},(_,i)=>JSON.stringify(s(i).prior.probes))).size>=5);
 assert.equal(s(e.REPLAY).phase,'failed');assert.equal(s(e.ONLINE).phase,'running');
 assert.equal(s(e.RELAPSE).phase,'failed');assert.equal(s(e.CONTROL).traffic.length,0);
 assert.ok(s(e.CONTROL+200).traffic.some(p=>p.direction==='response'&&p.tone==='green'));
 assert.ok(s(e.CONTROL+200).queue.length<s(e.CONTROL).queue.length);
 for(const route of [REPLAY_ROUTE,WIDE_ROUTE,...FLEET_ROUTES])assert.ok(route.every(([x,y])=>x>=0&&x<=1920&&y>=0&&y<=1080));
});
test('SHOT10 contained visual labels and complete exact predecessor drawing',async()=>{
 const scene=await readFile(new URL('./src/episodes/ep004/Shot10ProductionScene.tsx',import.meta.url),'utf8');
 const prior=await readFile(new URL('./src/episodes/ep004/Shot09ProductionScene.tsx',import.meta.url),'utf8');
 const block=(s,a,b)=>s.slice(s.indexOf(a),s.indexOf(b,s.indexOf(a))).trim();
 assert.equal(block(scene,'const Recovery:','const Client:'),block(prior,'const Recovery:','const ContentionView:'));
 assert.ok(scene.includes('frame===0&&props.previousLastFrameDataUri'));
 assert.ok(!scene.includes('Illustrative workload pressure'));
 for(const s of ['<ReturnView s={s}/>','<FleetView s={s}/>','<ReplayView s={s}/>','Design principle · illustrative alternative'])assert.ok(scene.includes(s));
 for(const text of ['UNRESPONSIVE','STARTING','UNDER LOAD','RUNNING'])assert.ok(31+text.length*26*.85+24<=330);
 for(const text of ['Primary gateway','Pending demand','Held demand'])assert.ok(text.length*29*.85<=410);
 assert.ok(44+27*.85+20<=200);
});
test('SHOT10 private predecessor/voice and seam verified before completion',async()=>{
 const w=await readFile(new URL('./cpu-worker.mjs',import.meta.url),'utf8'),run=w.slice(w.indexOf('async function render(job)'));
 const v=run.indexOf('await fetchEp004Shot10ApprovedVoice(job,inputProps)'),p=run.indexOf('await preflightEp004Shot10PreviousVideo(job,inputProps,shot10SourceScratch)'),cpu=run.indexOf('await renderMedia('),mux=run.indexOf('await muxEp004Shot10ApprovedVoice(job,outputPath,inputProps)'),seam=run.indexOf('await verifyEp004Shot10SeamAndMotion(job,outputPath,');
 assert.ok(v>=0&&p>v&&cpu>p&&mux>cpu&&seam>mux&&run.indexOf('await complete(job.renderId, outputPath)',seam)>seam);
});
