import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {
  EP004_SHOT01_LOCKED_SOURCE_SHA256,ep004BezierPosition
} from './src/components/architectural-thinking/EP004Shot01World.mjs';
import {
  EP004_SHOT01_V8_LOCKED_RENDER_ID,EP004_SHOT01_V8_SOURCE_COMMIT
} from './src/components/architectural-thinking/EP004Shot02ContinuityWorld.mjs';
import {ep004Shot02ProductionWorld}
  from './src/components/architectural-thinking/EP004Shot02ProductionWorld.mjs';
import {
  EP004_SHOT03_PREDECESSOR,EP004_SHOT03_ROUTES,ep004Shot03Clarity
} from './src/components/architectural-thinking/EP004Shot03LivingWorld.mjs';
import {
  EP004_SHOT03_COMPOSITION,EP004_SHOT03_SWITCH_FRAME,
  EP004_SHOT03_SWITCH_START_FRAME,EP004_SHOT03_SWITCH_END_FRAME,
  extendedEp004Shot02SourceProps,validateEp004Shot03Production,
  ep004Shot03ProductionWorld
} from './src/components/architectural-thinking/EP004Shot03ProductionWorld.mjs';

const priorCues=[
  {beatId:'SHOT02_P01_B01',anchor:'First voice-aligned SHOT02 line',startFrame:90,endFrame:180},
  {beatId:'SHOT02_P01_B02',anchor:'Second voice-aligned SHOT02 line',startFrame:390,endFrame:490},
  {beatId:'SHOT02_P02_B01',anchor:'Final aligned real SHOT02 line',startFrame:1170,endFrame:1280}
];
const previousShot02Props={
  episodeKey:'EP004',shotKey:'SHOT02',sourceSha256:EP004_SHOT01_LOCKED_SOURCE_SHA256,
  previousRenderId:EP004_SHOT01_V8_LOCKED_RENDER_ID,
  previousSourceCommit:EP004_SHOT01_V8_SOURCE_COMMIT,
  worldStartFrame:2000,durationInFrames:2124,previewOnly:false,
  directorCpuApproved:true,scriptRevision:1,
  voiceTakeId:'00000000-0000-4000-8000-000000000001',
  narrationSha256:'b'.repeat(64),
  expectedSourceCommit:EP004_SHOT03_PREDECESSOR.sourceCommit,
  shotTitle:'Two Gateway Systems, One Shared Pressure',
  failoverTermStartFrame:210,verifiedCues:priorCues,
  visualBeats:priorCues.map((x,i)=>({beatId:x.beatId,cueAnchor:x.anchor,
    direction:'Authentic source SHOT02 beat '+i}))
};
const cues=[
  {beatId:'SHOT03_P01_B01',anchor:'Preliminary incident source',startFrame:90,endFrame:130},
  {beatId:'SHOT03_P02_B01',anchor:'Real November shift anchor',startFrame:960,endFrame:1020},
  {beatId:'SHOT03_P03_B01',anchor:'Real backward-in-time anchor',startFrame:1960,endFrame:2040}
];
const props={
  episodeKey:'EP004',shotKey:'SHOT03',
  sourceSha256:EP004_SHOT01_LOCKED_SOURCE_SHA256,
  previousRenderId:EP004_SHOT03_PREDECESSOR.renderId,
  previousSourceCommit:EP004_SHOT03_PREDECESSOR.sourceCommit,
  previousFrameCount:2124,previousLastEncodedFrame:2123,worldStartFrame:4123,
  previousVideoSha256:'c'.repeat(64),previousShot02Props,
  durationInFrames:2700,previewOnly:false,directorCpuApproved:true,
  scriptRevision:1,
  voiceTakeId:'00000000-0000-4000-8000-000000000003',
  narrationSha256:'d'.repeat(64),expectedSourceCommit:'e'.repeat(40),
  shotTitle:'Two Gateway Systems, One Shared Pressure',
  novemberFrame:950,backwardFrame:1940,
  verifiedCues:cues,
  visualBeats:cues.map((c,i)=>({beatId:c.beatId,cueAnchor:c.anchor,
    direction:'Original Director SHOT03 visual beat '+i}))
};

test('source-bound SHOT03 accepts only authentic private original SHOT02 and 60-frame approved voice',()=>{
  assert.equal(EP004_SHOT03_COMPOSITION,'EP004-SHOT03-LIVING-GATEWAYS-V1-VISUAL');
  assert.equal(EP004_SHOT03_PREDECESSOR.frameCount,2124);
  assert.equal(validateEp004Shot03Production(props),true);
  assert.equal(extendedEp004Shot02SourceProps(props).durationInFrames,2315);
  for(const bad of [
    {previewOnly:true},{directorCpuApproved:false},
    {previousRenderId:'f6f39781-b295-4d58-926a-d3d5a6efe4db'},
    {previousLastEncodedFrame:2122},{worldStartFrame:2000},
    {previousSourceCommit:'0'.repeat(40)},
    {previousFrameCount:2123},{previousVideoSha256:'x'},
    {previousShot02Props:{...previousShot02Props,expectedSourceCommit:'0'.repeat(40)}},
    {previousShot02Props:{...previousShot02Props,voiceTakeId:''}},
    {novemberFrame:60},{backwardFrame:950},{backwardFrame:2690},
    {verifiedCues:[]},{visualBeats:[]},{expectedSourceCommit:'not-a-commit'},
    {durationInFrames:90}
  ])assert.throws(()=>validateEp004Shot03Production({...props,...bad}),
    /SHOT03_|EP004_/);
});
test('visual frame0 starts at actual SHOT02 encoded last-frame world and frame1 continues moving',()=>{
  const original=ep004Shot02ProductionWorld(2123,previousShot02Props);
  const first=ep004Shot03ProductionWorld(0,props);
  const next=ep004Shot03ProductionWorld(1,props);
  const afterBreathing=ep004Shot03ProductionWorld(60,props);
  assert.equal(first.sourceFrame,2123);
  assert.equal(first.originalSourceWorldFrame,4123);
  assert.deepEqual(first.previous.traffic,original.traffic);
  assert.deepEqual(first.previous.diagnostics,original.diagnostics);
  assert.equal(first.previous.cameraX,original.cameraX);
  assert.equal(first.previous.cameraScale,original.cameraScale);
  assert.equal(first.sourceAlpha,1);
  assert.equal(first.storyAlpha,0);
  assert.equal(next.sourceFrame,2124);
  assert.equal(next.worldFrame,4124);
  assert.equal(next.sourceAlpha,1);
  assert.equal(afterBreathing.sourceAlpha,1);
  assert.equal(first.silenceFrames,60);
  assert.equal(first.realVoiceStartFrame,60);
  const moving=original.traffic.some(x=>{
    const to=next.previous.traffic.find(y=>y.id===x.id);
    return to&&x.opacity>.05&&to.opacity>.05&&
      Math.hypot(x.x-to.x,x.y-to.y)>0.0000001;
  });
  assert.equal(moving,true,'frame1 must not be a previous image frozen for 55 frames');
});
test('new living traffic keeps monotonic actual world clock despite independent editorial camera timing',()=>{
  let last=4122,count=0;
  for(let frame=0;frame<props.durationInFrames;frame+=7){
    const x=ep004Shot03ProductionWorld(frame,props);
    assert.equal(x.worldFrame,4123+frame);
    assert.equal(x.storyboard.worldFrame,4123+frame);
    assert.ok(x.worldFrame>last);last=x.worldFrame;
    assert.ok(x.editorialFrame>=0&&x.editorialFrame<=539);
    assert.ok(x.sourceAlpha>=0&&x.sourceAlpha<=1);
    assert.ok(x.storyAlpha>=0&&x.storyAlpha<=1);
    for(const token of x.storyboard.tokens){
      const p=ep004BezierPosition(EP004_SHOT03_ROUTES[token.route],token.progress);
      assert.ok(Math.hypot(token.x-p.x,token.y-p.y)<.000001,'off-path: '+token.id);
      count++;
    }
  }
  assert.ok(count>3000);
  assert.equal(ep004Shot03ProductionWorld(950,props).editorialFrame,285);
  assert.equal(ep004Shot03ProductionWorld(1940,props).editorialFrame,420);
  assert.equal(ep004Shot03ProductionWorld(2699,props).editorialFrame,539);
  assert.equal(ep004Shot03ProductionWorld(190,props).storyAlpha,1);
});
test('no misleading generic cards, static photo over frame1, voice re-generation or SHOT02 file editing',async()=>{
  const prod=await readFile(new URL('./src/episodes/ep004/Shot03DirectorV1.tsx',import.meta.url),'utf8');
  const copied=await readFile(new URL('./src/episodes/ep004/Shot03PreviousLiveTail.tsx',import.meta.url),'utf8');
  const locked=await readFile(new URL('./src/episodes/ep004/Shot02DirectorV1.tsx',import.meta.url),'utf8');
  const root=await readFile(new URL('./src/Root.tsx',import.meta.url),'utf8');
  assert.match(prod,/sourceFrame=\{state.sourceFrame\}/);
  assert.match(prod,/state\.sourceAlpha/);
  assert.match(prod,/state\.storyAlpha/);
  assert.match(prod,/frame===0&&props\.previousLastFrameDataUri/);
  assert.doesNotMatch(prod,/frame<55|fade.+55|static.*55/);
  assert.match(copied,/sourceFrame:number/);
  assert.match(copied,/ep004Shot02ProductionWorld\(frame,props\)/);
  assert.match(locked,/export const Ep004Shot02DirectorV1/);
  assert.match(root,/EP004-SHOT03-LIVING-GATEWAYS-V1-VISUAL/);
  assert.match(root,/novemberFrame:-1,backwardFrame:-1/);
});
test('pre-CPU real Take and original SHOT02 2124-frame SHA are verified before expensive render',async()=>{
  const worker=await readFile(new URL('./cpu-worker.mjs',import.meta.url),'utf8');
  const body=worker.slice(worker.indexOf('async function render(job)'));
  const voice=body.indexOf('await fetchEp004Shot03ApprovedVoice(job,inputProps);');
  const source=body.indexOf('await preflightEp004Shot03PreviousVideo(');
  const render=body.indexOf('await renderMedia({');
  const mux=body.indexOf('await muxEp004Shot03ApprovedVoice(job,outputPath,inputProps);');
  const seam=body.indexOf('await verifyEp004Shot03SeamAndMotion(');
  assert.ok(voice>0&&source>voice&&render>source&&mux>render&&seam>mux);
  assert.match(worker,/ep004-shot03-selected-voice/);
  assert.match(worker,/ep004-shot03-previous-video/);
  assert.match(worker,/select=eq\(n\\\\,2123\)/);
  assert.match(worker,/previousLastFrameDataUri/);
  assert.match(worker,/adelay=2000:all=1/);
  assert.match(worker,/'-map','0:v:0','-an','-frames:v','30'/);
  assert.match(worker,/animatedUniqueFrames/);
  assert.match(worker,/EP004_SHOT03_ACTUAL_SEAM_PSNR/);
});

test('Director V2 explanation advances one grounded route at a time and clears orange end copy',async()=>{
  const outlook=ep004Shot03Clarity(150);
  const alternative=ep004Shot03Clarity(246);
  const rerouted=ep004Shot03Clarity(344);
  const july=ep004Shot03Clarity(464);
  const final=ep004Shot03Clarity(539);
  assert.match(outlook.note,/OUTLOOK.*PRIMARY.*EXCHANGE ONLINE/);
  assert.match(alternative.note,/TEAMS.*ALTERNATIVE.*TEAMS/);
  assert.match(rerouted.note,/01:07 UTC.*PRIMARY GATEWAY/);
  assert.match(july.note,/JULY.*GATEWAY/);
  for(const stage of [outlook,alternative,rerouted,july])
    assert.ok(stage.noteOpacity>.5,'One readable explanatory line must have real dwell');
  assert.ok(outlook.routes.OUTLOOK_PRIMARY>.8);
  assert.ok(alternative.routes.TEAMS_ALTERNATIVE>.75);
  assert.equal(alternative.routes.TEAMS_FAILOVER,0);
  assert.ok(rerouted.routes.TEAMS_FAILOVER>.55);
  assert.ok(rerouted.routes.TEAMS_ALTERNATIVE<.25);
  assert.ok(july.julyCallout>.5);
  assert.equal(final.julyCallout,0,'The orange July caption must be absent at the final frame');
  assert.equal(final.utcStamp,0,'The November UTC caption cannot leak into the July ending');
  assert.equal(final.note,'');
  assert.equal(final.noteOpacity,0,'No end-of-shot floating explanatory text');
  const ending=ep004Shot03ProductionWorld(props.durationInFrames-1,props);
  assert.equal(ending.storyboard.clarity.julyCallout,0);
  assert.equal(ending.storyboard.clarity.noteOpacity,0);
  assert.equal(ending.storyAlpha,1);
  assert.equal(ending.sourceAlpha,0);
  assert.equal(ending.worldFrame,4123+props.durationInFrames-1);
  const scene=await readFile(new URL('./src/episodes/ep004/Shot03LivingArchitectureV1.tsx',import.meta.url),'utf8');
  const director=await readFile(new URL('./src/episodes/ep004/Shot03DirectorV1.tsx',import.meta.url),'utf8');
  assert.doesNotMatch(scene,/JULY GATEWAY UPDATE|CONCEPTUAL ARCHITECTURE/);
  assert.match(scene,/state.clarity.note/);
  assert.match(scene,/state.clarity.routes\[key\]/);
  assert.match(scene,/julyCallout=\{state.clarity.julyCallout\}/);
  assert.doesNotMatch(director,/DIRECTOR REVIEW CANDIDATE/);
  assert.match(director,/frame===0&&props.previousLastFrameDataUri/);
  assert.throws(()=>ep004Shot03Clarity(540),/FRAME_OUT_OF_RANGE/);
});

test('Director V4 smoothly reveals gateways over 100 moving frames without a full-frame flash',async()=>{
  assert.equal(EP004_SHOT03_SWITCH_START_FRAME,90);
  assert.equal(EP004_SHOT03_SWITCH_FRAME,140);
  assert.equal(EP004_SHOT03_SWITCH_END_FRAME,190);
  const early=ep004Shot03ProductionWorld(90,props);
  const half=ep004Shot03ProductionWorld(140,props);
  const complete=ep004Shot03ProductionWorld(190,props);
  assert.equal(early.sourceAlpha,1);
  assert.equal(early.storyAlpha,0);
  assert.equal(early.revealProgress,0);
  assert.equal(half.sourceAlpha,1);
  assert.equal(half.storyAlpha,1,
    'Both live diagram sources must be available for complementary spatial masks');
  assert.ok(Math.abs(half.revealProgress-.5)<.00001);
  assert.ok(Math.abs(half.transitionBoundaryX-960)<.001);
  assert.equal(complete.sourceAlpha,0);
  assert.equal(complete.storyAlpha,1);
  assert.equal(complete.revealProgress,1);
  assert.equal(complete.transitionBoundaryX,0);
  assert.equal(early.sourceHeadingOpacity,1);
  assert.equal(complete.gatewayHeadingOpacity,1);
  let lastBoundary=1920;
  let lastWorld=4122;
  for(let frame=0;frame<=190;frame++){
    const state=ep004Shot03ProductionWorld(frame,props);
    assert.equal(state.worldFrame,4123+frame);
    assert.equal(state.worldFrame,lastWorld+1);
    assert.ok(state.transitionBoundaryX<=lastBoundary+0.0001);
    assert.ok(state.transitionBoundaryX>=0&&state.transitionBoundaryX<=1920);
    assert.ok(state.sourceHeadingOpacity>=0&&state.sourceHeadingOpacity<=1);
    assert.ok(state.gatewayHeadingOpacity>=0&&state.gatewayHeadingOpacity<=1);
    if(frame>=91&&frame<190){
      assert.equal(state.transitionActive,true);
      assert.equal(state.sourceAlpha,1);
      assert.equal(state.storyAlpha,1);
      assert.equal(state.storyboard.originalOpacity,0,
        'New gateway layer must not repeat the old architecture');
    }
    if(frame>0)assert.ok(lastBoundary-state.transitionBoundaryX<30,
      'Transition must not jump or snap more than 30 screen pixels/frame');
    lastBoundary=state.transitionBoundaryX;
    lastWorld=state.worldFrame;
  }
  const director=await readFile(new URL(
    './src/episodes/ep004/Shot03DirectorV1.tsx',import.meta.url),'utf8');
  assert.match(director,/maskImage:oldMask/);
  assert.match(director,/maskImage:gatewayMask/);
  assert.match(director,/headingOpacity=\{state.sourceHeadingOpacity\}/);
  assert.match(director,/headingOpacity=\{state.gatewayHeadingOpacity\}/);
  assert.doesNotMatch(director,/shutterProgress|shutterOverOldWorld|crossfade/);
});
test('Director V3 July gateway annotation holds through a readable real-voice interval',()=>{
  let previous=-1,visible=0;
  for(let frame=props.backwardFrame;frame<props.durationInFrames;frame++){
    const s=ep004Shot03ProductionWorld(frame,props);
    if(s.storyboard.clarity.julyCallout>.75)visible++;
    assert.ok(s.editorialFrame>=previous);
    previous=s.editorialFrame;
  }
  assert.ok(visible>=165,'July gateway label must hold at least 5.5 seconds @30fps');
  const tail=ep004Shot03ProductionWorld(props.durationInFrames-1,props);
  assert.equal(tail.storyboard.clarity.julyCallout,0);
  assert.equal(tail.storyboard.clarity.noteOpacity,0);
});
