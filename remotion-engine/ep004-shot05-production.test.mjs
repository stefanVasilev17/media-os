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
  ep004Shot05ClarityStage,ep004Shot05ClarityState,validateEp004Shot05SafeLayout,
  ep004Shot05Migration,ep004Shot05SamplePacket,ep004Shot05PacketTrail,EP004_SHOT05_PACKET_ROUTES,EP004_SHOT05_NEW_PACKET_SPEED,ep004Shot05VerifyReroute,EP004_SHOT05_DIRECTOR_REVIEW}
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
test('SHOT05 V7 measured typography fits every actual node and varying content-size heading',()=>{
  assert.equal(EP004_SHOT05_CLARITY_GRAMMAR,'DIRECTOR_CHECKPOINT_REROUTE_V9');
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
test('SHOT05 V7 original geography preserves route-to-node endpoints and no clutter',()=>{
  assert.equal(Object.keys(EP004_SHOT05_TRACKS).length,6);
  for(const [key,r] of Object.entries(EP004_SHOT05_TRACKS)){
    assert.match(r.path,/^M /,key);
    assert.equal(r.start[0],EP004_SHOT05_NODES[r.from].x+EP004_SHOT05_NODES[r.from].w);
    assert.equal(r.end[0],EP004_SHOT05_NODES[r.to].x);
    assert.ok(r.segments.every(([x,y])=>x>=160&&x<=1790&&y>=280&&y<=850),key);
  }
  assert.equal(EP004_SHOT05_TRACKS.OUTLOOK_PRIMARY.end[1],330);
  assert.equal(EP004_SHOT05_TRACKS.TEAMS_FAILOVER.end[1],430);
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
test('SHOT05 V7 removes old microcopy, bottom timeline, clipped x-ray and decorative flow',async()=>{
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

test('SHOT05 V7 distinguishes client apps and downstream services and moves actual request packets',async()=>{
  assert.equal(EP004_SHOT05_NODES.outlook.title,'OUTLOOK APP');
  assert.equal(EP004_SHOT05_NODES.teams.title,'TEAMS APP');
  assert.equal(EP004_SHOT05_NODES.teamsService.title,'TEAMS SERVICE');
  const src=await readFile(new URL('./src/episodes/ep004/Shot05ProductionScene.tsx',import.meta.url),'utf8');
  assert.match(src,/m\.packets\.map/);
  assert.match(src,/ep004Shot05PacketTrail\(p.route,p.travel/);
  assert.match(src,/nodeId="primary"/);
  assert.match(src,/nodeId="alternative"/);
  assert.doesNotMatch(src,/strokeDashoffset|HEADROOM LOW|CONSTRAINED/);
});
test('SHOT05 V7 preserves moving inputs and outputs while showing reduced headroom',()=>{
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
  assert.equal(states[0].primaryStatus,'REDUCED');
  assert.equal(states[1].primaryStatus,'14%');
  for(const route of Object.values(EP004_SHOT05_TRACKS))
    assert.deepEqual(route.segments.at(-1),route.end);
});

test('V5 capacity alone does not reroute; only aligned route cue starts migration',()=>{
  const c=[{startFrame:100,endFrame:180,anchor:'Teams request'},{startFrame:250,endFrame:340,anchor:'Reduced capacity'},{startFrame:500,endFrame:650,anchor:'Reroute Teams traffic'},{startFrame:530,endFrame:660,anchor:'Both workloads share gateway'}];
  const b=[{direction:'Teams alternative'},{direction:'Gateway capacity reduced'},{direction:'Teams failover reroute'},{direction:'Both routes share gateway pressure'}];
  const state=f=>ep004Shot05Migration(f,c,b);
  assert.equal(state(499).primaryWeight,0);
  assert.equal(state(500).primaryWeight,0);
  assert.ok(state(563).primaryWeight>.4&&state(563).primaryWeight<.6);
  assert.equal(state(626).primaryWeight,1);
  assert.equal(state(800).primaryWeight,1);
  assert.ok(state(350).pressure>.9);
  assert.equal(state(350).explicit14,false);
  for(let i=501;i<800;i++)assert.ok(state(i).primaryWeight>=state(i-1).primaryWeight);
});
test('V5 real per-packet route assignment survives cue boundaries and finishes at destination',()=>{
  const c=[{startFrame:100,endFrame:180,anchor:'Teams request'},{startFrame:300,endFrame:400,anchor:'Rerouting'}];
  const b=[{direction:'Teams alternative'},{direction:'Teams failover reroute'}];
  const state=f=>ep004Shot05Migration(f,c,b);
  let mixed=false;
  for(let f=250;f<600;f++){
    const a=state(f),next=state(f+1);
    if(a.packets.some(p=>p.route==='OLD')&&a.packets.some(p=>p.route==='NEW'))mixed=true;
    for(const p of a.packets){
      const q=next.packets.find(x=>x.id===p.id);
      if(q){assert.equal(p.route,q.route);assert.ok(Math.hypot(p.x-q.x,p.y-q.y)<=(p.route==='NEW'?EP004_SHOT05_NEW_PACKET_SPEED:8.4)+.00001);}
    }
  }
  assert.ok(mixed,'old requests drain while new requests enter');
  assert.ok(!state(700).packets.some(p=>p.route==='OLD'));
  assert.ok(state(700).packets.some(p=>p.route==='NEW'));
  for(const [key,pts] of Object.entries(EP004_SHOT05_PACKET_ROUTES)){
    const len=pts.slice(1).reduce((a,p,i)=>a+Math.hypot(p[0]-pts[i][0],p[1]-pts[i][1]),0);
    const start=ep004Shot05SamplePacket(key,0),end=ep004Shot05SamplePacket(key,len);
    assert.deepEqual([start.x,start.y],pts[0]);
    assert.ok(Math.hypot(end.x-pts.at(-1)[0],end.y-pts.at(-1)[1])<.00001);
  }
});
test('V5 equal gateway bodies fit frame and remain on exact port positions',()=>{
  const {primary,alternative}=EP004_SHOT05_NODES;
  assert.equal(primary.w,alternative.w);assert.equal(primary.h,alternative.h);
  assert.equal(alternative.x,primary.x);
  assert.equal(EP004_SHOT05_TRACKS.TEAMS_ALTERNATIVE.end[1],alternative.y+110);
  assert.equal(validateEp004Shot05SafeLayout(),true);
});

test('V5 inactive route light drains gradually rather than cutting off',()=>{
  const c=[{startFrame:100,endFrame:180,anchor:'Teams request'},{startFrame:300,endFrame:400,anchor:'Rerouting'}];
  const b=[{direction:'Teams alternative'},{direction:'Teams failover reroute'}];
  for(let f=301;f<650;f++){
    const a=ep004Shot05Migration(f-1,c,b),v=ep004Shot05Migration(f,c,b);
    assert.ok(Math.abs(v.oldStrength-a.oldStrength)<.04);
  }
  assert.equal(ep004Shot05Migration(750,c,b).oldStrength,0);
});

test('V6 the entire upper Teams route is absent before first redirected emission, including capacity-only beats',()=>{
  const c=[{startFrame:100,endFrame:180,anchor:'Teams request'},{startFrame:250,endFrame:340,anchor:'Reduced capacity'},{startFrame:500,endFrame:650,anchor:'Reroute Teams traffic'}];
  const b=[{direction:'Teams alternative'},{direction:'Gateway capacity reduced'},{direction:'Teams failover reroute'}];
  for(let f=0;f<=500;f++){
    const m=ep004Shot05Migration(f,c,b);
    assert.equal(m.ingressReveal,0);assert.equal(m.coreReveal,0);assert.equal(m.egressReveal,0);
    assert.ok(!m.packets.some(p=>p.route==='NEW'));
  }
  const first=ep004Shot05Migration(500,c,b).firstNewEmission;
  assert.ok(first>500);
  assert.equal(ep004Shot05Migration(first,c,b).ingressReveal,0);
  const during=ep004Shot05Migration(first+10,c,b);
  assert.ok(during.ingressReveal>0&&during.ingressReveal<1);
  assert.equal(during.coreReveal,0);assert.equal(during.egressReveal,0);
  let prev=ep004Shot05Migration(first,c,b);
  for(let f=first+1;f<first+300;f++){
    const next=ep004Shot05Migration(f,c,b);
    for(const k of ['ingressReveal','coreReveal','egressReveal']){
      assert.ok(next[k]>=prev[k]);assert.ok(next[k]>=0&&next[k]<=1);
    }
    if(next.coreReveal>0)assert.equal(next.ingressReveal,1);
    if(next.egressReveal>0)assert.equal(next.coreReveal,1);
    prev=next;
  }
  assert.equal(prev.egressReveal,1);
});
test('V6 the renderer really omits hidden strokes and both gateway cores follow actual packets',async()=>{
  const src=await readFile(new URL('./src/episodes/ep004/Shot05ProductionScene.tsx',import.meta.url),'utf8');
  assert.match(src,/if\(reveal<=0\)return null/);
  assert.match(src,/if\(l\.reveal<=0\)return null/);
  assert.match(src,/TEAMS_FAILOVER:m\.ingressReveal,PRIMARY_TEAMS:m\.egressReveal/);
  assert.match(src,/strokeDasharray=\{dash\}/);
  assert.doesNotMatch(src,/processing=|processing\(|shot05V6Core/);
  assert.match(src,/rx=\{44\}/);
  assert.ok(EP004_SHOT05_TRACKS.TEAMS_FAILOVER.segments.length>30);
  assert.ok(EP004_SHOT05_TRACKS.PRIMARY_TEAMS.segments.length>30);
});

test('V7 explicit rerouting takes priority over earlier shared pressure, then pilot and mixed arrivals are legible',()=>{
  const c=[{startFrame:100,endFrame:180,anchor:'Teams request'},{startFrame:250,endFrame:340,anchor:'Shared pressure'},{startFrame:500,endFrame:650,anchor:'Reroute Teams traffic'}];
  const b=[{direction:'Teams alternative'},{direction:'Teams and Outlook converge on shared gateway pressure'},{direction:'Teams failover reroute'}];
  const prior=ep004Shot05Migration(499,c,b);
  assert.equal(prior.rerouteFrame,500);assert.equal(prior.ingressReveal,0);
  const first=prior.firstNewEmission;
  assert.ok(first>500&&first<=518);
  const following=ep004Shot05Migration(first+19,c,b);
  assert.ok(following.packets.some(p=>p.route==='NEW'&&p.born===first));
  assert.ok(following.packets.some(p=>p.route==='OLD'&&p.born===first+18));
  const done=ep004Shot05Migration(first+350,c,b);
  assert.equal(done.oldStrength,0);assert.equal(done.egressReveal,1);
  assert.ok(!done.packets.some(p=>p.route==='OLD'));
});
test('V7 light trails lie on the actual route, including curved joins, without animated internal furniture',async()=>{
  const points=EP004_SHOT05_PACKET_ROUTES.NEW;
  const len=points.slice(1).reduce((a,p,i)=>a+Math.hypot(p[0]-points[i][0],p[1]-points[i][1]),0);
  for(let d=1;d<len;d+=7){
    const trail=ep004Shot05PacketTrail('NEW',d,92);
    const end=ep004Shot05SamplePacket('NEW',d);
    assert.ok(Math.hypot(trail.at(-1).x2-end.x,trail.at(-1).y2-end.y)<.000001);
    for(let i=1;i<trail.length;i++)assert.ok(Math.hypot(trail[i].x1-trail[i-1].x2,trail[i].y1-trail[i-1].y2)<.000001);
  }
  const src=await readFile(new URL('./src/episodes/ep004/Shot05ProductionScene.tsx',import.meta.url),'utf8');
  const gateway=src.slice(src.indexOf('const Gateway:'),src.indexOf('const Track:'));
  const title=src.slice(src.indexOf('const Title:'),src.indexOf('const Endpoint:'));
  assert.doesNotMatch(gateway,/processing|<circle|<ellipse/);
  assert.ok(!gateway.includes('.map(i=>'));
  assert.doesNotMatch(title,/<rect/);
  assert.ok(src.includes('pilot?92:62'));
});

test('V8 exact Director-identified spoken moved-traffic cue overrides unrelated failover directions',()=>{
  const c=[{startFrame:100,endFrame:180,anchor:'Fourteen percent of capacity was missing'},
    {startFrame:220,endFrame:320,anchor:'Consider the previous gateway configuration'},
    {startFrame:500,endFrame:660,anchor:'Teams traffic has moved into it'},
    {startFrame:850,endFrame:950,anchor:'The consequence of the shared dependency'}];
  const b=[{direction:'Capacity reduced'},{direction:'Show earlier failover configuration and gateway routes'},
    {direction:'Show shared pressure in primary'},{direction:'Show downstream consequence'}];
  const state=f=>ep004Shot05Migration(f,c,b);
  assert.equal(state(499).rerouteFrame,500);
  assert.equal(state(499).ingressReveal,0);
  assert.ok(!state(499).packets.some(p=>p.route==='NEW'));
  assert.equal(ep004Shot05ClarityStage(b[2].direction,2,c[2].anchor).key,'SWITCH');
  const first=state(500).firstNewEmission;
  assert.ok(first>=500&&first<=518);
  let entered=false,mixed=false;
  for(let f=first+1;f<=first+100;f++){
    const m=state(f);
    if(m.packets.some(p=>p.route==='NEW'&&p.x>=726&&p.x<=1194&&Math.abs(p.y-430)<.001)&&m.packets.some(p=>p.route==='OLD'))entered=true;
    if(m.packets.some(p=>p.route==='NEW'&&p.y<710)&&m.packets.some(p=>p.route==='OLD'))mixed=true;
  }
  assert.ok(entered,'actual Teams packet reaches upper gateway while old traffic still exists');
  assert.ok(mixed,'upward turn is visible while lower route is still carrying requests');
  assert.equal(state(first+320).egressReveal,1);
  assert.ok(!state(first+320).packets.some(p=>p.route==='OLD'));
  assert.ok(state(first+320).packets.some(p=>p.route==='NEW'));
});
test('V8 exact 14 percent cue drives only its amber segment with bounded smooth brightness',async()=>{
  const c=[{startFrame:100,endFrame:170,anchor:'Reduced headroom'},{startFrame:240,endFrame:330,anchor:'14 percent of capacity'},{startFrame:500,endFrame:620,anchor:'Teams traffic has moved into it'}];
  const b=[{direction:'Reduced capacity'},{direction:'Show capacity loss'},{direction:'Shared pressure'}];
  const state=f=>ep004Shot05Migration(f,c,b);
  assert.equal(state(239).amberPulse,0);
  assert.equal(state(239).explicit14,false);
  assert.equal(state(240).capacity14Frame,240);
  assert.equal(state(240).explicit14,true);
  assert.ok(state(240).amberPulse>0);
  assert.ok(state(264).amberPulse>.95);
  assert.ok(state(288).amberPulse<.4);
  assert.equal(state(264).capacity14Reveal,1);
  for(let f=241;f<380;f++)assert.ok(Math.abs(state(f).amberPulse-state(f-1).amberPulse)<.05);
  const src=await readFile(new URL('./src/episodes/ep004/Shot05ProductionScene.tsx',import.meta.url),'utf8');
  assert.ok(src.includes('amberPulse={m.amberPulse}'));
  assert.ok(src.includes('amberPulse={0}'));
  assert.ok(src.includes('fill="#FFF1A4" opacity={amberPulse*.94}'));
});


test('V9 Director-rejected 01:03 checkpoint is shared even if the exact spoken action is missing or late',()=>{
  const c=[{beatId:'SHOT05_P01_B01',startFrame:100,endFrame:200,anchor:'Fourteen percent of capacity'},
    {beatId:'SHOT05_P02_B01',startFrame:900,endFrame:1020,anchor:'The previous arrangement'},
    {beatId:'SHOT05_P03_B01',startFrame:1745,endFrame:1950,anchor:'Less headroom remains'},
    {beatId:'SHOT05_P04_B01',startFrame:2200,endFrame:2300,anchor:'Teams traffic has moved into it'}];
  const b=[{direction:'Capacity reduced'},{direction:'Separate mail and collaboration'},{direction:'Reduced capacity'},{direction:'Show both workloads'}];
  for(const last of ['Teams traffic has moved into it','The consequence of this change']){
    const cues=c.map((v,i)=>i===3?{...v,anchor:last}:v);
    const state=f=>ep004Shot05Migration(f,cues,b,2573);
    assert.equal(state(0).rerouteFrame,1740);
    assert.equal(state(0).rerouteReason,'DIRECTOR_VISUAL_CHECKPOINT');
    assert.equal(state(1739).ingressReveal,0);
    assert.equal(state(1739).packets.filter(p=>p.route==='NEW').length,0);
    const audit=ep004Shot05VerifyReroute(cues,b,2573);
    assert.equal(audit.status,'PASS');assert.equal(audit.checkpoint,1890);
    assert.ok(audit.entered&&audit.exited&&audit.turned&&audit.mixed);
    assert.equal(state(1890).egressReveal,1);
    assert.equal(state(2200).oldStrength,0);
    assert.ok(!state(2200).packets.some(p=>p.route==='OLD'));
  }
});
test('V9 preserves earlier genuine cues and never changes the original verified timeline',()=>{
  const c=[{startFrame:100,endFrame:200,anchor:'Fourteen percent capacity'},{startFrame:1200,endFrame:1380,anchor:'Teams traffic has moved into it'}];
  const b=[{direction:'Capacity reduced'},{direction:'Shared gateway'}];
  const before=JSON.stringify(c);
  const audit=ep004Shot05VerifyReroute(c,b,2573);
  assert.equal(audit.reason,'VERIFIED_CUE');assert.equal(audit.rerouteFrame,1200);
  assert.equal(JSON.stringify(c),before);
  assert.equal(ep004Shot05Migration(1199,c,b,2573).ingressReveal,0);
});
test('V9 actual job traversal gate runs before expensive CPU render and keeps amber and glass design',async()=>{
  const worker=await readFile(new URL('./cpu-worker.mjs',import.meta.url),'utf8');
  const render=worker.slice(worker.indexOf('async function render(job)'));
  const audit=render.indexOf('ep004Shot05VerifyReroute(inputProps.verifiedCues,inputProps.visualBeats,inputProps.durationInFrames)');
  assert.ok(audit>=0&&audit<render.indexOf('await renderMedia('));
  assert.ok(render.includes('EP004_SHOT05_V9_ACTUAL_JOB_ROUTE_PRECPU_PASS'));
  const src=await readFile(new URL('./src/episodes/ep004/Shot05ProductionScene.tsx',import.meta.url),'utf8');
  assert.ok(src.includes('title={migrationTitle}'));
  assert.ok(src.includes('amberPulse={m.amberPulse}'));
  assert.equal(EP004_SHOT05_DIRECTOR_REVIEW.checkpoint,63*30);
});
