import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {EP004_SHOT01_LOCKED_SOURCE_SHA256}
  from './src/components/architectural-thinking/EP004Shot01World.mjs';
import {EP004_SHOT05_COMPOSITION,EP004_SHOT05_BREATH_FRAMES,
  validateEp004Shot05Production,ep004Shot05ProductionWorld,ep004Shot05StoryRoute}
  from './src/components/architectural-thinking/EP004Shot05ProductionWorld.mjs';
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
test('SHOT05 keeps actual Director source and original SHOT04 encoded continuity',()=>{
  assert.equal(EP004_SHOT05_COMPOSITION,'EP004-SHOT05-LIVING-ROUTE-CAUSALITY-V1-VISUAL');
  assert.equal(validateEp004Shot05Production(props),true);
  for(const change of [
    {sourceSha256:'0'.repeat(64)},
    {shotKey:'SHOT04'}, {previewOnly:true}, {directorCpuApproved:false},
    {previousFrameCount:2790}, {previousLastEncodedFrame:2789},
    {previousWorldStartFrame:6357},{worldStartFrame:9145},
    {previousVideoSha256:'invalid'},
    {breathFrames:60},{voiceTakeId:''},{verifiedCues:[]},
    {visualBeats:[]},{previousShot04Props:null},
    {previousShot04Props:{...approvedPrior,expectedSourceCommit:'f'.repeat(40)}}
  ])
    assert.throws(()=>validateEp004Shot05Production({...props,...change}),/EP004_SHOT05/);
});
test('SHOT05 first seventy-two frames continue true moving world without fabricated narration',()=>{
  assert.equal(EP004_SHOT05_BREATH_FRAMES,72);
  let before=props.worldStartFrame-1;
  const positions=new Set();
  for(let frame=0;frame<=110;frame++){
    const state=ep004Shot05ProductionWorld(frame,props);
    assert.equal(state.worldFrame,props.worldStartFrame+frame);
    assert.ok(state.worldFrame>before);before=state.worldFrame;
    assert.equal(state.spoken,frame>=72);
    if(frame<72)assert.equal(state.beatIndex,-1);
    assert.ok(state.cameraScale>=state.previous.cameraScale);
    assert.equal(state.storyboard.gatewayReveal,1);
    positions.add(state.storyboard.tokens[0].x.toFixed(4));
  }
  assert.ok(positions.size>10,'existing on-route requests must continue moving');
  assert.equal(ep004Shot05ProductionWorld(0,props).oldOpacity,1);
  assert.ok(ep004Shot05ProductionWorld(130,props).routeOpacity>0);
});
test('SHOT05 use only real authored routes and voice-cue-directed activity',()=>{
  assert.deepEqual(ep004Shot05StoryRoute('Outlook Exchange').routes,
    ['OUTLOOK_PRIMARY','PRIMARY_MAILBOX']);
  assert.deepEqual(ep004Shot05StoryRoute('Teams alternative').routes,
    ['TEAMS_ALTERNATIVE','ALTERNATIVE_TEAMS']);
  assert.equal(ep004Shot05StoryRoute('Shared gateway congestion').routes.length,4);
  assert.deepEqual(ep004Shot05StoryRoute('Reroute Teams traffic').routes,
    ['TEAMS_FAILOVER','PRIMARY_TEAMS']);
  const first=ep004Shot05ProductionWorld(141,props);
  const shared=ep004Shot05ProductionWorld(560,props);
  const changed=ep004Shot05ProductionWorld(1000,props);
  assert.equal(first.beatIndex,0);
  assert.equal(shared.beatIndex,1);
  assert.equal(changed.beatIndex,2);
  assert.equal(shared.route.key,'SHARED');
  assert.equal(changed.route.key,'REROUTE');
  assert.notEqual(first.cameraScale,ep004Shot05ProductionWorld(0,props).cameraScale);
});
test('SHOT05 visual rejects floating gateway rings and stays inside the same map',async()=>{
  const shot=await readFile(new URL('./src/episodes/ep004/Shot05ProductionScene.tsx',import.meta.url),'utf8');
  assert.match(shot,/Shot03LivingArchitectureWorldView/);
  assert.match(shot,/EP004_SHOT03_ROUTES/);
  assert.match(shot,/ep004BezierPosition/);
  assert.match(shot,/PacketStreams/);
  assert.match(shot,/state\.worldFrame/);
  assert.match(shot,/GatewayHighlight/);
  assert.match(shot,/previousLastFrameDataUri/);
  assert.match(shot,/frame===0/);
  assert.doesNotMatch(shot,/<circle cx=\{state\.focusX\}/);
  assert.doesNotMatch(shot,/spotlightPulse|pulseFade|drop-shadow|Math\.random/);
  assert.doesNotMatch(shot,/SIMULATED|ILLUSTRATIVE|decorative|latencyMs/);
  const wrapper=await readFile(new URL('./src/episodes/ep004/Shot05GeneratedScene.tsx',import.meta.url),'utf8');
  assert.match(wrapper,/validateEp004Shot05Production/);
  const factory=await readFile(new URL('./generate-factory-registry.mjs',import.meta.url),'utf8');
  assert.match(factory,/GeneratedScene/);
});
test('SHOT05 CPU worker selected voice, predecessor, mux, QA and Director-only consent are wired',async()=>{
  const worker=await readFile(new URL('./cpu-worker.mjs',import.meta.url),'utf8');
  const start=worker.indexOf('async function render(job)');
  const source=worker.slice(start);
  assert.ok(start>0);
  for(const name of [
    'fetchEp004Shot05ApprovedVoice',
    'preflightEp004Shot05PreviousVideo',
    'muxEp004Shot05ApprovedVoice',
    'verifyEp004Shot05SeamAndMotion'
  ])assert.ok(worker.includes(name),name+' should be implemented');
  assert.match(source,/EP004_SHOT05_REAL/);
  assert.match(worker,/adelay=2400:all=1/);
  assert.match(worker,/EP004_SHOT05_PREVIOUS_LOCKED_SHOT04_SHA256_LAST_FRAME_QA_PASS/);
  const claims=await readFile(new URL('./worker-claim-authorization.mjs',import.meta.url),'utf8');
  assert.match(claims,/EP004-SHOT05-LIVING-ROUTE-CAUSALITY-V1-VISUAL/);
});
