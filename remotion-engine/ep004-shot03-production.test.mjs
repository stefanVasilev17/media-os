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
  EP004_SHOT03_PREDECESSOR,EP004_SHOT03_ROUTES
} from './src/components/architectural-thinking/EP004Shot03LivingWorld.mjs';
import {
  EP004_SHOT03_COMPOSITION,extendedEp004Shot02SourceProps,
  validateEp004Shot03Production,ep004Shot03ProductionWorld
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
  assert.match(worker,/animatedUniqueFrames/);
  assert.match(worker,/EP004_SHOT03_ACTUAL_SEAM_PSNR/);
});
