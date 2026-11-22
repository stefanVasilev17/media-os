import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {EP004_SHOT01_LOCKED_SOURCE_SHA256}
  from './src/components/architectural-thinking/EP004Shot01World.mjs';
import {EP004_SHOT05_COMPOSITION,EP004_SHOT05_BREATH_FRAMES,
  validateEp004Shot05Production,ep004Shot05ProductionWorld,ep004Shot05StoryRoute}
  from './src/components/architectural-thinking/EP004Shot05ProductionWorld.mjs';
import {EP004_SHOT05_CINEMATIC_GRAMMAR,EP004_SHOT05_XRAY_ROUTES,
  ep004Shot05XrayPosition,ep004Shot05XrayPath,ep004Shot05CinematicStage,
  ep004Shot05CinematicState,validateEp004Shot05XrayRoutes}
  from './src/components/architectural-thinking/EP004Shot05CinematicWorld.mjs';
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
test('SHOT05 actual final SHOT04 frame is preserved before a finite one-way camera entry',()=>{
  assert.equal(EP004_SHOT05_BREATH_FRAMES,72);
  const a=ep004Shot05ProductionWorld(0,props);
  assert.equal(a.worldFrame,props.worldStartFrame);
  assert.equal(a.sourceWorldFrame,props.previousWorldStartFrame+2790);
  assert.equal(a.cinematic.sourceOpacity,1);
  assert.equal(a.cinematic.sourcePush,1);
  assert.equal(a.cinematic.interiorOpacity,0);
  assert.equal(a.cinematic.beatIndex,-1);
  assert.equal(a.spoken,false);
  let previous=props.worldStartFrame-1;
  for(let frame=0;frame<200;frame++){
    const state=ep004Shot05ProductionWorld(frame,props);
    assert.equal(state.worldFrame,++previous);
    assert.equal(state.spoken,frame>=72);
    assert.ok(state.cameraScale>=1&&state.cameraScale<=1.315);
    assert.ok(Number.isFinite(state.panX));
    assert.ok(state.cinematic.sourcePush>=1&&state.cinematic.sourcePush<=2.16);
    if(frame<72)assert.equal(state.cinematic.beatIndex,-1);
  }
  const late=ep004Shot05ProductionWorld(340,props);
  assert.equal(late.cinematic.sourceOpacity,0);
  assert.equal(late.cinematic.interiorOpacity,1);
  assert.equal(late.cinematic.sceneFullyRevealed,true);
  assert.equal(late.cinematic.stage.key,'MAIL');
});
test('SHOT05 uniquely redraws a physically bounded cutaway without invalid amber splines',()=>{
  assert.equal(EP004_SHOT05_CINEMATIC_GRAMMAR,'GATEWAY_XRAY_DIRECTOR_V2');
  assert.equal(validateEp004Shot05XrayRoutes(),true);
  assert.equal(Object.keys(EP004_SHOT05_XRAY_ROUTES).length,6);
  for(const [key,points] of Object.entries(EP004_SHOT05_XRAY_ROUTES)){
    assert.match(ep004Shot05XrayPath(points),/^M /);
    assert.equal(points.length,4);
    for(let i=0;i<=100;i++){
      const p=ep004Shot05XrayPosition(points,i/100);
      assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y),key);
      assert.ok(p.x>=115&&p.x<=1800&&p.y>=320&&p.y<=920,key);
    }
  }
  assert.equal(ep004Shot05CinematicStage('Teams traffic failover',2).key,'SWITCH');
  assert.equal(ep004Shot05CinematicStage('Shared primary gateway pressure',1).key,'SHARED');
  assert.equal(ep004Shot05CinematicStage('Exchange mailbox',0).key,'MAIL');
  assert.equal(ep004Shot05CinematicStage('Outage unavailable',3).key,'DEGRADED');
});
test('SHOT05 cinematic camera never zoom-loops and pauses to explain each cue',()=>{
  const first=ep004Shot05CinematicState(0,cues,beats,props.durationInFrames);
  const during=ep004Shot05CinematicState(141,cues,beats,props.durationInFrames);
  const heldA=ep004Shot05CinematicState(330,cues,beats,props.durationInFrames);
  const heldB=ep004Shot05CinematicState(405,cues,beats,props.durationInFrames);
  assert.equal(first.camera.scale,1);
  assert.ok(during.camera.scale>1);
  assert.deepEqual(heldA.camera,heldB,'camera must hold, not zoom repeatedly');
  const pressure=ep004Shot05CinematicState(560,cues,beats,props.durationInFrames);
  const shifted=ep004Shot05CinematicState(1020,cues,beats,props.durationInFrames);
  assert.equal(pressure.stage.key,'SHARED');
  assert.equal(shifted.stage.key,'SWITCH');
  assert.notDeepEqual(pressure.camera,shifted.camera);
  for(let i=0;i<props.durationInFrames;i+=13){
    const c=ep004Shot05CinematicState(i,cues,beats,props.durationInFrames);
    assert.ok(Number.isFinite(c.camera.x)&&Number.isFinite(c.camera.y));
    assert.ok(c.camera.scale>=1&&c.camera.scale<1.32);
    assert.ok(c.sourceOpacity>=0&&c.sourceOpacity<=1);
    assert.ok(c.interiorOpacity>=0&&c.interiorOpacity<=1);
  }
});
test('SHOT05 aggressive dolly never jumps at a voice cue boundary or restarts its zoom',()=>{
  for(const cue of cues){
    const before=ep004Shot05CinematicState(cue.startFrame-1,cues,beats,props.durationInFrames);
    const after=ep004Shot05CinematicState(cue.startFrame,cues,beats,props.durationInFrames);
    assert.ok(Math.abs(before.camera.x-after.camera.x)<2.5,'camera x discontinuity');
    assert.ok(Math.abs(before.camera.y-after.camera.y)<2.5,'camera y discontinuity');
    assert.ok(Math.abs(before.camera.scale-after.camera.scale)<.008,'zoom discontinuity');
  }
  const once=ep004Shot05CinematicState(105+200,cues,beats,props.durationInFrames);
  const twice=ep004Shot05CinematicState(105+300,cues,beats,props.durationInFrames);
  assert.deepEqual(once.camera,twice.camera,'dolly must hold after completed inspected action');
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
test('SHOT05 director V2 is truly an immersive gateway cutaway, not recycled SHOT03 map',async()=>{
  const shot=await readFile(new URL('./src/episodes/ep004/Shot05ProductionScene.tsx',import.meta.url),'utf8');
  const world=await readFile(new URL('./src/components/architectural-thinking/EP004Shot05ProductionWorld.mjs',import.meta.url),'utf8');
  const cutaway=await readFile(new URL('./src/components/architectural-thinking/EP004Shot05CinematicWorld.mjs',import.meta.url),'utf8');
  assert.match(shot,/ActivityWorld/);
  assert.match(shot,/XRayGateway/);
  assert.match(shot,/RouteLine/);
  assert.match(shot,/previousLastFrameDataUri/);
  assert.match(shot,/frame===0&&!props.previousLastFrameDataUri/);
  assert.match(shot,/transformOrigin:'69% 49%'/);
  assert.match(shot,/transform:worldTransform/);
  assert.match(shot,/EditorialOverlay/);
  assert.match(shot,/SHOT05_AUTHENTIC_LOCKED_SHOT04_LAST_FRAME_REQUIRED/);
  assert.doesNotMatch(shot,/Shot03LivingArchitectureWorldView|EP004_SHOT03_ROUTES/);
  assert.doesNotMatch(shot,/stroke=\\{AMBER\\}|Math\\.random|Math\\.sin|drop-shadow|spotlightPulse/);
  assert.doesNotMatch(world,/previous\\.cameraScale\\s*\\+|ep004Shot03StoryboardWorld/);
  assert.doesNotMatch(cutaway,/Math\\.random|Math\\.sin|setInterval|Date\\.now/);
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
