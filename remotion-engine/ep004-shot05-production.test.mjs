import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {EP004_SHOT01_LOCKED_SOURCE_SHA256}
  from './src/components/architectural-thinking/EP004Shot01World.mjs';
import {EP004_SHOT05_COMPOSITION,EP004_SHOT05_BREATH_FRAMES,
  validateEp004Shot05Production,ep004Shot05ProductionWorld,ep004Shot05StoryRoute}
  from './src/components/architectural-thinking/EP004Shot05ProductionWorld.mjs';
import {EP004_SHOT05_CLARITY_GRAMMAR,EP004_SHOT05_NODES,
  EP004_SHOT05_TRACKS,EP004_SHOT05_SAFE_FRAME,
  ep004Shot05MeasuredTextWidth,ep004Shot05TextBox,
  ep004Shot05ClarityStage,ep004Shot05ClarityState,validateEp004Shot05SafeLayout}
  from './src/components/architectural-thinking/EP004Shot05ClarityWorld.mjs';
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
test('SHOT05 frame zero exactly preserves locked SHOT04 media and voice timing',()=>{
  const initial=ep004Shot05ProductionWorld(0,props);
  assert.equal(initial.worldFrame,props.worldStartFrame);
  assert.equal(initial.sourceWorldFrame,props.previousWorldStartFrame+2790);
  assert.equal(initial.cinematic.sourceOpacity,1);
  assert.equal(initial.cinematic.sourcePush,1);
  assert.equal(initial.cinematic.interiorOpacity,0);
  assert.equal(initial.cinematic.beatIndex,-1);
  assert.equal(initial.spoken,false);
  for(let i=0;i<200;i++){
    const world=ep004Shot05ProductionWorld(i,props);
    assert.equal(world.worldFrame,props.worldStartFrame+i);
    assert.equal(world.spoken,i>=EP004_SHOT05_BREATH_FRAMES);
    assert.ok(world.cameraScale>=1&&world.cameraScale<1.03);
    assert.ok(world.cinematic.sourceOpacity>=0&&world.cinematic.sourceOpacity<=1);
    if(i<105)assert.equal(world.beatIndex,-1);
  }
  const last=ep004Shot05ProductionWorld(350,props);
  assert.equal(last.cinematic.sourceOpacity,0);
  assert.equal(last.cinematic.interiorOpacity,1);
});
test('SHOT05 V4 measured typography fits every actual node and varying content-size heading',()=>{
  assert.equal(EP004_SHOT05_CLARITY_GRAMMAR,'VISIBLE_PACKET_ROUTING_V4');
  assert.equal(validateEp004Shot05SafeLayout(),true);
  const nodes=Object.values(EP004_SHOT05_NODES);
  for(const n of nodes){
    assert.ok(n.font>=26,'minimum real readable node font');
    assert.ok(ep004Shot05MeasuredTextWidth(n.title,n.font)+54<=n.w,
      n.title+' would overflow own card');
    assert.ok(n.x>=EP004_SHOT05_SAFE_FRAME.left);
    assert.ok(n.x+n.w<=EP004_SHOT05_SAFE_FRAME.right);
    assert.ok(n.y+n.h<=EP004_SHOT05_SAFE_FRAME.bottom);
  }
  const short=ep004Shot05TextBox('FOLLOW THE REQUEST');
  const long=ep004Shot05TextBox('TWO ROUTES. ONE GATEWAY.');
  assert.notEqual(short.width,long.width,'headings must fit content not fixed largest panel');
  for(const h of [short,long,ep004Shot05TextBox('14% CAPACITY LOST')]){
    assert.ok(h.font>=40);
    assert.ok(h.x>=125&&h.x+h.width<=1795);
    assert.ok(ep004Shot05MeasuredTextWidth(h.text,h.font)+104<=h.width);
    assert.ok(h.y+h.height<245,'header cannot overlap diagram nodes');
  }
});
test('SHOT05 V4 original geography preserves route-to-node endpoints and no clutter',()=>{
  assert.equal(Object.keys(EP004_SHOT05_TRACKS).length,6);
  for(const [key,r] of Object.entries(EP004_SHOT05_TRACKS)){
    assert.match(r.path,/^M /,key);
    assert.equal(r.start[0],EP004_SHOT05_NODES[r.from].x+EP004_SHOT05_NODES[r.from].w);
    assert.equal(r.end[0],EP004_SHOT05_NODES[r.to].x);
    assert.ok(r.segments.every(([x,y])=>x>=160&&x<=1790&&y>=280&&y<=850),key);
  }
  assert.equal(EP004_SHOT05_TRACKS.OUTLOOK_PRIMARY.end[1],404);
  assert.equal(EP004_SHOT05_TRACKS.TEAMS_FAILOVER.end[1],495);
  assert.equal(EP004_SHOT05_TRACKS.TEAMS_ALTERNATIVE.end[1],745);
  assert.ok(EP004_SHOT05_NODES.primary.y+EP004_SHOT05_NODES.primary.h <
    EP004_SHOT05_NODES.alternative.y);
});
test('SHOT05 meaningful story stage is selected only from original cue anchor and direction',()=>{
  const known14=ep004Shot05ClarityStage('Our capacity was already reduced',4,
    'Fourteen percent of capacity was already missing');
  assert.equal(known14.key,'CAPACITY_14');
  assert.equal(known14.primaryStatus,'14%');
  assert.equal(ep004Shot05ClarityStage('Gateway capacity decreased',2).key,'CAPACITY');
  assert.notEqual(ep004Shot05ClarityStage('Primary Gateway',0).primaryStatus,'14%');
  assert.equal(ep004Shot05ClarityStage('Outlook to Exchange mailbox',0).key,'MAIL');
  assert.equal(ep004Shot05ClarityStage('Teams alternative',1).key,'ALTERNATIVE');
  assert.equal(ep004Shot05ClarityStage('Both routes share gateway pressure',2).key,'SHARED');
  assert.equal(ep004Shot05ClarityStage('Teams failover reroute',3).key,'SWITCH');
  assert.equal(ep004Shot05ClarityStage('Gateway outage unavailable',3).key,'DEGRADED');
});
test('SHOT05 progressive cues reveal meaningful work without all six routes at once',()=>{
  const first=ep004Shot05ClarityState(141,cues,beats,props.durationInFrames);
  const sharedStart=ep004Shot05ClarityState(520,cues,beats,props.durationInFrames);
  const sharedLater=ep004Shot05ClarityState(735,cues,beats,props.durationInFrames);
  const switched=ep004Shot05ClarityState(1150,cues,beats,props.durationInFrames);
  assert.equal(first.stage.key,'MAIL');
  assert.deepEqual(first.stage.lanes,['OUTLOOK_PRIMARY','PRIMARY_MAILBOX']);
  assert.equal(sharedStart.stage.key,'SHARED');
  assert.ok(sharedLater.secondLaneActivation>sharedStart.secondLaneActivation);
  assert.ok(sharedLater.visibleHistory.includes('outlook'));
  assert.ok(sharedLater.visibleHistory.includes('teams'));
  assert.equal(switched.stage.key,'SWITCH');
  assert.ok(switched.switchActivation>.95);
  assert.ok(switched.stage.lanes.includes('TEAMS_FAILOVER'));
  assert.ok(!first.stage.visible.includes('teams'));
});
test('SHOT05 absolute camera has steady educational holds and no repeated zoom',()=>{
  const start=ep004Shot05ClarityState(0,cues,beats,props.durationInFrames);
  assert.deepEqual(start.camera,{x:0,y:0,scale:1});
  const hold1=ep004Shot05ClarityState(331,cues,beats,props.durationInFrames);
  const hold2=ep004Shot05ClarityState(405,cues,beats,props.durationInFrames);
  assert.deepEqual(hold1.camera,hold2.camera);
  const hold3=ep004Shot05ClarityState(1250,cues,beats,props.durationInFrames);
  const hold4=ep004Shot05ClarityState(1500,cues,beats,props.durationInFrames);
  assert.deepEqual(hold3.camera,hold4.camera);
  for(const cue of cues){
    const before=ep004Shot05ClarityState(cue.startFrame-1,cues,beats,props.durationInFrames);
    const after=ep004Shot05ClarityState(cue.startFrame,cues,beats,props.durationInFrames);
    assert.ok(Math.abs(after.camera.scale-before.camera.scale)<.006);
    assert.ok(Math.abs(after.camera.x-before.camera.x)<2);
  }
  for(let i=0;i<props.durationInFrames;i+=11){
    const v=ep004Shot05ClarityState(i,cues,beats,props.durationInFrames);
    assert.ok(v.camera.scale>=1&&v.camera.scale<=1.027);
    assert.ok(Math.abs(v.camera.x)<=12&&Math.abs(v.camera.y)<=18);
  }
});
test('SHOT05 V4 removes old microcopy, bottom timeline, clipped x-ray and decorative flow',async()=>{
  const shot=await readFile(new URL('./src/episodes/ep004/Shot05ProductionScene.tsx',import.meta.url),'utf8');
  const world=await readFile(new URL('./src/components/architectural-thinking/EP004Shot05ProductionWorld.mjs',import.meta.url),'utf8');
  const clarity=await readFile(new URL('./src/components/architectural-thinking/EP004Shot05ClarityWorld.mjs',import.meta.url),'utf8');
  assert.match(shot,/FlowWorld/);
  assert.match(shot,/ep004Shot05TextBox/);
  assert.match(shot,/ep004Shot05MeasuredTextWidth/);
  assert.match(shot,/SHOT05_LABEL_CLIP/);
  assert.match(shot,/frame===0&&!props.previousLastFrameDataUri/);
  assert.match(shot,/transformOrigin:'69% 49%'/);
  assert.match(shot,/EP004_SHOT05_TRACKS/);
  assert.doesNotMatch(shot,/INSIDE THE ARCHITECTURE|STORY CHAPTERS|REQUEST.*ROUTE DECISION|EditorialOverlay|XRayGateway|ChapterRail|FocusCallout/);
  assert.doesNotMatch(shot,/Shot03LivingArchitectureWorldView|EP004_SHOT03_ROUTES/);
  assert.doesNotMatch(shot,/Math\.sin|Math\.random|stroke=\{AMBER\}|drop-shadow/);
  assert.doesNotMatch(world,/ep004Shot03StoryboardWorld|previous\.cameraScale\s*\+/);
  assert.doesNotMatch(clarity,/Math\.sin|Math\.random|Date\.now/);
  for(const [,font] of shot.matchAll(/fontSize=\{(\d+)\}/g))
    assert.ok(Number(font)>=20,'no microcopy font allowed');
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
  assert.ok(worker.includes("import {EP004_SHOT05_COMPOSITION} from './src/components/architectural-thinking/EP004Shot05ProductionWorld.mjs';"));
  assert.match(worker,/const EP004_SHOT05_REAL=EP004_SHOT05_COMPOSITION;/);
  assert.doesNotMatch(worker,/EP004-SHOT05-CONTINUOUS-GATEWAYS-V1-VISUAL/);
  assert.equal(EP004_SHOT05_COMPOSITION,
    'EP004-SHOT05-LIVING-ROUTE-CAUSALITY-V1-VISUAL');
  const beforeRender=source.indexOf("if(job.compositionId===EP004_SHOT05_REAL){");
  const actualRender=source.indexOf("await renderMedia({");
  const afterRender=source.lastIndexOf("await muxEp004Shot05ApprovedVoice(job,outputPath,inputProps);");
  const finalFormatCheck=source.indexOf("const probed=await probeFactoryMedia(outputPath);");
  assert.ok(beforeRender>0 && beforeRender<actualRender,
    'SHOT05 real Take and locked SHOT04 frame must be loaded BEFORE CPU render');
  assert.ok(afterRender>actualRender && afterRender<finalFormatCheck,
    'SHOT05 AAC mux and seam QA must run BEFORE final H264/AAC format check');
  assert.match(source,/shot05SourceFrame=await preflightEp004Shot05PreviousVideo/);
  assert.match(source,/await verifyEp004Shot05SeamAndMotion/);
  assert.match(worker,/adelay=2400:all=1/);
  assert.match(worker,/EP004_SHOT05_PREVIOUS_LOCKED_SHOT04_SHA256_LAST_FRAME_QA_PASS/);
  const claims=await readFile(new URL('./worker-claim-authorization.mjs',import.meta.url),'utf8');
  assert.match(claims,/EP004-SHOT05-LIVING-ROUTE-CAUSALITY-V1-VISUAL/);
});

test('SHOT05 V4 distinguishes client apps and downstream services and moves actual request packets',async()=>{
  assert.equal(EP004_SHOT05_NODES.outlook.title,'OUTLOOK APP');
  assert.equal(EP004_SHOT05_NODES.teams.title,'TEAMS APP');
  assert.equal(EP004_SHOT05_NODES.teamsService.title,'TEAMS SERVICE');
  const src=await readFile(new URL('./src/episodes/ep004/Shot05ProductionScene.tsx',import.meta.url),'utf8');
  assert.match(src,/pathLength=\{100\}/);
  assert.match(src,/strokeDashoffset=\{offset-i\*31\.3\}/);
  assert.match(src,/frame\*speed/);
  assert.match(src,/status==='14%'\?'14% CAPACITY LOST':status/);
  assert.doesNotMatch(src,/\bCONSTRAINED\b/);
  assert.match(src,/motion>.04/);
});
test('SHOT05 V4 preserves moving inputs and outputs while showing reduced headroom',()=>{
  const states=[
    ep004Shot05ClarityStage('Gateway capacity reduced',4),
    ep004Shot05ClarityStage('14 percent capacity lost',4),
    ep004Shot05ClarityStage('Gateway outage unavailable',4)
  ];
  for(const state of states){
    assert.ok(state.visible.includes('primary'));
    assert.ok(state.visible.includes('outlook'));
    assert.ok(state.visible.includes('teamsService'));
    for(const id of ['OUTLOOK_PRIMARY','PRIMARY_MAILBOX','TEAMS_FAILOVER','PRIMARY_TEAMS'])
      assert.ok(state.lanes.includes(id));
  }
  assert.equal(states[0].primaryStatus,'HEADROOM LOW');
  assert.equal(states[1].primaryStatus,'14%');
  for(const route of Object.values(EP004_SHOT05_TRACKS))
    assert.deepEqual(route.segments.at(-1),route.end);
});
