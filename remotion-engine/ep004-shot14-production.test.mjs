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

import {EP004_SHOT11_PREDECESSOR,SHOT11_BEATS,shot11State,validateEp004Shot11Production,verifyEp004Shot11ActualMotion} from './src/components/architectural-thinking/EP004Shot11ProductionWorld.mjs';
const lock10={...p10,expectedSourceCommit:EP004_SHOT11_PREDECESSOR.sourceCommit,durationInFrames:2059,eventFrames:{RESTART:197,RESPONDING:259,WAITING:321,RETURNED:527,FLEET:623,REPLAY:845,BACKLOG:1051,ONLINE:1166,RUSH:1219,CONTENTION:1358,RELAPSE:1480,TWICE:1563,CONTROL:1716,GOAL:1931},verifiedCues:p10.verifiedCues.map((c,i)=>({...c,startFrame:[90,305,600,845,1200,1550][i],endFrame:[90,305,600,845,1200,1550][i]+30}))};
const cue11=SHOT11_BEATS.map((beatId,i)=>({beatId,anchor:'Synthetic clock cue '+i,startFrame:[90,300,620,1000,1400,1650,2000,2300][i],endFrame:[90,300,620,1000,1400,1650,2000,2300][i]+30}));
const p11={...p10,shotKey:'SHOT11',previousRenderId:EP004_SHOT11_PREDECESSOR.renderId,previousSourceCommit:EP004_SHOT11_PREDECESSOR.sourceCommit,previousFrameCount:2059,previousLastEncodedFrame:2058,previousWorldStartFrame:lock10.worldStartFrame,worldStartFrame:lock10.worldStartFrame+2058,previousShot10Props:lock10,verifiedCues:cue11,visualBeats:cue11.map(c=>({beatId:c.beatId,cueAnchor:c.anchor,direction:'Synthetic visual clock'})),eventFrames:{SHIFT:180,LOAD:320,DETECT:540,REDIRECT:650,ALERT:800,EVENING:1000,RESTART:1100,PROBE:1250,CAPACITY:1400,RELAPSE:1770,PATTERN:2000,LOOP:2110,DEFECT:2250,END:2400},durationInFrames:2550};

import {EP004_SHOT12_PREDECESSOR,SHOT12_BEATS,SHOT12_EVENTS,shot12State,validateEp004Shot12Production,verifyEp004Shot12ActualMotion} from './src/components/architectural-thinking/EP004Shot12ProductionWorld.mjs';
const lock11={...p11,durationInFrames:2637,expectedSourceCommit:EP004_SHOT12_PREDECESSOR.sourceCommit};
const e12=Object.fromEntries(SHOT12_EVENTS.map((k,i)=>[k,[90,240,270,390,520,600,850,930,1090,1300,1500,1740,1890,2050,2130,2300,2380,2440,2510,2580][i]]));
const c12=SHOT12_BEATS.map((beatId,i)=>({beatId,anchor:'Synthetic recovery cue '+i,startFrame:[90,240,500,850,1080,1380,1740,2010,2300,2500][i],endFrame:[90,240,500,850,1080,1380,1740,2010,2300,2500][i]+20}));
const p12={...p11,shotKey:'SHOT12',previousRenderId:EP004_SHOT12_PREDECESSOR.renderId,previousSourceCommit:EP004_SHOT12_PREDECESSOR.sourceCommit,previousFrameCount:2637,previousLastEncodedFrame:2636,previousWorldStartFrame:lock11.worldStartFrame,worldStartFrame:lock11.worldStartFrame+2636,previousShot11Props:lock11,verifiedCues:c12,visualBeats:c12.map(c=>({beatId:c.beatId,cueAnchor:c.anchor,direction:'Synthetic staged restoration'})),eventFrames:e12,durationInFrames:2700};

import {EP004_SHOT13_PREDECESSOR,SHOT13_BEATS,SHOT13_EVENTS,shot13State,validateEp004Shot13Production,verifyEp004Shot13ActualMotion} from './src/components/architectural-thinking/EP004Shot13ProductionWorld.mjs';
const lock12={...p12,durationInFrames:2613,expectedSourceCommit:EP004_SHOT13_PREDECESSOR.sourceCommit,eventFrames:{...p12.eventFrames,LESSON:2442,REPLY:2377,MESSAGE:2339,INBOX:2306,USER:2200,DELAYED:2054,IMPACT_END:1907,REGIONS:1811,MORNING:1639,TRAFFIC_ONLY:1462,CODE_ONLY:1286,DEMAND:1121,CODE:943,TWO_JOBS:823,CAPACITY:596,ADMISSION:539,RESTART:437,ROLLOUT:365,FIX:276,IDENTIFY:74}};
lock12.verifiedCues=lock12.verifiedCues.map((c,i)=>({...c,startFrame:[74,276,510,823,1090,1286,1639,1850,2200,2377][i],endFrame:[74,276,510,823,1090,1286,1639,1850,2200,2377][i]+20}));
const e13=Object.fromEntries(SHOT13_EVENTS.map((k,i)=>[k,90+i*100]));
const c13=SHOT13_BEATS.map((beatId,i)=>({beatId,anchor:'Synthetic design cue '+i,startFrame:[e13.QUESTION,e13.GENERAL,e13.HOOK,e13.SPREAD,e13.ISOLATE][i],endFrame:[e13.QUESTION,e13.GENERAL,e13.HOOK,e13.SPREAD,e13.ISOLATE][i]+20}));
const p13={...p12,shotKey:'SHOT13',previousRenderId:EP004_SHOT13_PREDECESSOR.renderId,previousSourceCommit:EP004_SHOT13_PREDECESSOR.sourceCommit,previousFrameCount:2613,previousLastEncodedFrame:2612,previousWorldStartFrame:lock12.worldStartFrame,worldStartFrame:lock12.worldStartFrame+2612,previousShot12Props:lock12,verifiedCues:c13,visualBeats:c13.map(c=>({beatId:c.beatId,cueAnchor:c.anchor,direction:'Synthetic design beat'})),eventFrames:e13,durationInFrames:2500};

import {EP004_SHOT14_PREDECESSOR,SHOT14_BEATS,SHOT14_EVENTS,shot14State,validateEp004Shot14Production,verifyEp004Shot14ActualMotion} from './src/components/architectural-thinking/EP004Shot14ProductionWorld.mjs';
const lock13={...p13,durationInFrames:2078,expectedSourceCommit:EP004_SHOT14_PREDECESSOR.sourceCommit,eventFrames:{QUESTION:74,NO:166,SYSTEM:194,SHARED:278,SPARE:326,GENERAL:353,GUARANTEE:631,HOOK:782,HEALTHY:943,FAILOVER:992,REGIONS:1025,WEAKNESS:1155,SPREAD:1219,RESTART:1355,REPEAT:1453,PROTECT:1522,CAPACITY:1610,ISOLATE:1658,STAGED:1696,OUTPUT:1891}};
lock13.verifiedCues=lock13.verifiedCues.map((c,i)=>({...c,startFrame:[74,353,782,1219,1658][i],endFrame:[74,353,782,1219,1658][i]+20}));
const e14={"LOOK":90,"LATENT":195,"TEAMS":300,"REDUCED":405,"PEAK":510,"DEFECT":615,"UNRESPONSIVE":720,"REDIRECT":825,"DESTINATIONS":930,"SHARED":1035,"PRESSURE":1140,"RESTART":1245,"RELAPSE":1350,"RECOVERY":1455,"PARADOX":1560,"LOCAL":1665,"GLOBAL":1770,"SUCCESS":1875,"NEXT":1980,"RELATIONSHIPS":2085};
const c14=SHOT14_BEATS.map((beatId,i)=>({beatId,anchor:'Synthetic paradox cue '+i,startFrame:[90,300,510,825,1035,1350,1560,1770,1980][i],endFrame:[90,300,510,825,1035,1350,1560,1770,1980][i]+20}));
const p14={...p13,shotKey:'SHOT14',previousRenderId:EP004_SHOT14_PREDECESSOR.renderId,previousSourceCommit:EP004_SHOT14_PREDECESSOR.sourceCommit,previousFrameCount:2078,previousLastEncodedFrame:2077,previousWorldStartFrame:lock13.worldStartFrame,worldStartFrame:lock13.worldStartFrame+2077,previousShot13Props:lock13,verifiedCues:c14,visualBeats:c14.map(c=>({beatId:c.beatId,cueAnchor:c.anchor,direction:'Synthetic causal state'})),eventFrames:e14,durationInFrames:2500};
test('SHOT14 exact locked predecessor and nine original cues',()=>{assert.equal(validateEp004Shot14Production(p14),true);assert.equal(verifyEp004Shot14ActualMotion(p14).status,'PASS');assert.deepEqual(shot14State(0,p14).prior,shot13State(2077,lock13));for(const patch of [{previousRenderId:'bad'},{previousFrameCount:2077},{verifiedCues:[]},{eventFrames:{}}])assert.throws(()=>validateEp004Shot14Production({...p14,...patch}));});
test('SHOT14 cue causal transitions and local versus global result',()=>{const s=f=>shot14State(f,p14);assert.equal(s(e14.LOOK).openingMix,0);assert.equal(s(e14.LOOK+12).openingMix,1);assert.equal(s(e14.TEAMS-1).teams,0);assert.equal(s(e14.DEFECT-1).contention,false);assert.equal(s(e14.DEFECT).contention,true);assert.equal(s(e14.UNRESPONSIVE).phases[1],'failed');assert.equal(s(e14.RECOVERY).controlled,true);assert.equal(s(e14.LOCAL).local,true);assert.equal(s(e14.GLOBAL).global,true);assert.equal(s(e14.RELATIONSHIPS).global,false);});
test('SHOT14 persistent world and real worker seam',async()=>{const s=await readFile(new URL('./src/episodes/ep004/Shot14ProductionScene.tsx',import.meta.url),'utf8');const w=await readFile(new URL('./cpu-worker.mjs',import.meta.url),'utf8');assert.ok(s.includes('data-shot14-world="persistent"'));assert.ok(!s.includes('opacity={s.openingMix}'));assert.ok(s.includes('frame===0&&props.previousLastFrameDataUri'));assert.ok(w.includes('await preflightEp004Shot14PreviousVideo(job,inputProps,shot14SourceScratch)'));assert.ok(w.includes('await muxEp004Shot14ApprovedVoice(job,outputPath,inputProps)'));});
