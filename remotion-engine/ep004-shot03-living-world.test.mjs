import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {ep004BezierPosition} from './src/components/architectural-thinking/EP004Shot01World.mjs';
import {
  EP004_SHOT03_PREDECESSOR,EP004_SHOT03_STORYBOARD_ONLY,
  EP004_SHOT03_BREATH_FRAMES,EP004_SHOT03_ROUTES,
  EP004_SHOT03_NODES,validateEp004Shot03Routes,
  validateEp004Shot03Storyboard,ep004Shot03StoryboardWorld
} from './src/components/architectural-thinking/EP004Shot03LivingWorld.mjs';

const props={
  episodeKey:'EP004',shotKey:'SHOT03',previewOnly:true,
  sourceSha256:EP004_SHOT03_PREDECESSOR.sourceSha256,
  previousRenderId:EP004_SHOT03_PREDECESSOR.renderId,
  previousSourceCommit:EP004_SHOT03_PREDECESSOR.sourceCommit,
  previousFrameCount:2124,previousLastEncodedFrame:2123,
  worldStartFrame:4123,durationInFrames:540,
};

test('EP004 SHOT03 visual foundation pins the genuine successful SHOT02 MP4 lineage',()=>{
  assert.equal(EP004_SHOT03_PREDECESSOR.renderId,'20758da0-46f9-4973-9ef8-ec93eb437a5a');
  assert.equal(EP004_SHOT03_PREDECESSOR.sourceCommit,'714d7c31affb84793780eee42bc5062387b069a7');
  assert.equal(EP004_SHOT03_PREDECESSOR.frameCount,2124);
  assert.equal(EP004_SHOT03_PREDECESSOR.lastEncodedFrame,2123);
  assert.equal(EP004_SHOT03_PREDECESSOR.worldStartFrame,2000+2123);
  assert.equal(EP004_SHOT03_BREATH_FRAMES,60);
  assert.equal(EP004_SHOT03_STORYBOARD_ONLY,true);
  assert.equal(validateEp004Shot03Storyboard(props),true);
});
test('the sketch is not a production CPU composition and never accepts fake approved voice',()=>{
  const invalid=[
    {previewOnly:false},{directorCpuApproved:true},
    {voiceTakeId:'00000000-0000-4000-8000-000000000000'},
    {previousRenderId:'f6f39781-b295-4d58-926a-d3d5a6efe4db'},
    {previousRenderId:'e8f3818e-aac0-40f2-8e1a-d70e9fa108e0'},
    {previousSourceCommit:'0'.repeat(40)},
    {previousFrameCount:2123},{previousLastEncodedFrame:2124},
    {worldStartFrame:2123},{worldStartFrame:0},
    {sourceSha256:'0'.repeat(64)}, {durationInFrames:90}, {durationInFrames:901}
  ];
  for(const p of invalid)assert.throws(()=>validateEp004Shot03Storyboard({...props,...p}),
    /EP004_SHOT03_STORYBOARD_ONLY_REAL_PREDECESSOR_AND_NO_CPU/,
    JSON.stringify(p));
});
test('two separate physical gateway shapes have connected, bounded mail and Teams routes',()=>{
  assert.equal(validateEp004Shot03Routes(),true);
  assert.equal(Object.keys(EP004_SHOT03_ROUTES).length,6);
  assert.deepEqual(EP004_SHOT03_ROUTES.OUTLOOK_PRIMARY[3],{x:EP004_SHOT03_NODES.primary.left,y:370});
  assert.deepEqual(EP004_SHOT03_ROUTES.TEAMS_FAILOVER[3],{x:EP004_SHOT03_NODES.primary.left,y:370});
  assert.deepEqual(EP004_SHOT03_ROUTES.TEAMS_ALTERNATIVE[3],{x:EP004_SHOT03_NODES.alternative.left,y:696});
  assert.deepEqual(EP004_SHOT03_ROUTES.PRIMARY_MAILBOX[3],{x:EP004_SHOT03_NODES.mailbox.left,y:370});
  assert.deepEqual(EP004_SHOT03_ROUTES.PRIMARY_TEAMS[3],{x:EP004_SHOT03_NODES.teams.left,y:696});
  assert.deepEqual(EP004_SHOT03_ROUTES.ALTERNATIVE_TEAMS[3],{x:EP004_SHOT03_NODES.teams.left,y:696});
});
test('moving frame 1 continues the source world, never shows a static 55-frame predecessor image',()=>{
  const a=ep004Shot03StoryboardWorld(0,props),b=ep004Shot03StoryboardWorld(1,props);
  assert.equal(a.worldFrame,4123);
  assert.equal(b.worldFrame,4124);
  assert.equal(a.originalOpacity,1);
  assert.equal(a.gatewayReveal,0);
  assert.equal(a.cameraX,b.cameraX);
  assert.equal(a.cameraScale,b.cameraScale);
  const moving=a.originalState.traffic.some(x=>{
    const y=b.originalState.traffic.find(t=>t.id===x.id);
    return y && x.opacity>.03 && y.opacity>.03 &&
      (Math.abs(x.x-y.x)>0.0000001||Math.abs(x.y-y.y)>0.0000001);
  });
  assert.equal(moving,true,'request dots must move from the first frame');
  assert.equal(a.isVoiceAligned,false);
  assert.equal(a.transitionsAreEditorialStoryboard,true);
});
test('new cinematic traffic advances only on its own rendered Bezier route, sampled through whole shot',()=>{
  for(let frame=0;frame<props.durationInFrames;frame+=3){
    const s=ep004Shot03StoryboardWorld(frame,props);
    assert.equal(s.worldFrame,4123+frame);
    assert.equal(s.tokens.length,20);
    for(const t of s.tokens){
      const expected=ep004BezierPosition(EP004_SHOT03_ROUTES[t.route],t.progress);
      assert.ok(Math.abs(expected.x-t.x)<1e-8&&Math.abs(expected.y-t.y)<1e-8,
        'off-path particle '+t.id+' @ '+frame);
      assert.ok(t.opacity>=0&&t.opacity<=1);
      assert.ok(t.progress>=0&&t.progress<1);
      assert.ok(t.x>480&&t.x<1850&&t.y>290&&t.y<780);
      if(t.route==='TEAMS_FAILOVER'||t.route==='PRIMARY_TEAMS')
        assert.equal(t.kind,'TEAMS');
      if(t.route==='PRIMARY_MAILBOX')
        assert.equal(t.kind,'OUTLOOK');
    }
  }
});
test('Teams joins Primary without being reclassified as Exchange or instantly destroying healthy system',()=>{
  const normal=ep004Shot03StoryboardWorld(250,props);
  const shift=ep004Shot03StoryboardWorld(400,props);
  const july=ep004Shot03StoryboardWorld(520,props);
  assert.equal(normal.redirect,0);
  assert.ok(normal.tokens.filter(t=>t.route==='TEAMS_ALTERNATIVE').some(t=>t.opacity>.05));
  assert.ok(shift.redirect>.95);
  assert.ok(shift.tokens.filter(t=>t.route==='TEAMS_FAILOVER').some(t=>t.opacity>.05));
  assert.ok(shift.tokens.filter(t=>t.route==='PRIMARY_TEAMS').some(t=>t.opacity>.05));
  assert.ok(shift.tokens.filter(t=>t.route==='TEAMS_ALTERNATIVE').every(t=>t.opacity<.05));
  assert.ok(shift.sharedLoad>.8);
  assert.ok(july.julyMarker>.9);
  assert.ok(july.cameraScale>normal.cameraScale);
});
test('the screen has only earned labels and never invents architecture counts or generic cards',async()=>{
  const scene=await readFile(new URL('./src/episodes/ep004/Shot03LivingArchitectureV1.tsx',import.meta.url),'utf8');
  const root=await readFile(new URL('./src/Root.tsx',import.meta.url),'utf8');
  const factory=await readFile(new URL('./src/episodes/ep004/Shot03GeneratedScene.tsx',import.meta.url),'utf8');
  assert.doesNotMatch(scene,/CONCEPTUAL ARCHITECTURE/);
  assert.match(scene,/state\.clarity\.note/);
  assert.match(scene,/Primary Gateway/);
  assert.match(scene,/Alternative Gateway/);
  assert.match(scene,/Exchange Online/);
  assert.match(scene,/Microsoft Teams/);
  const story=await readFile(new URL('./src/components/architectural-thinking/EP004Shot03LivingWorld.mjs',import.meta.url),'utf8');
  assert.match(story,/01:07 UTC/);
  assert.doesNotMatch(scene,/JULY GATEWAY UPDATE/);
  assert.match(scene,/JULY UPDATE/);
  assert.match(story,/BACK TO JULY/);
  assert.match(scene,/ATOutlookMailClient/);
  assert.match(scene,/ATStableServiceNodes/);
  assert.match(scene,/ep004BezierPath\(points\)/);
  assert.match(scene,/state\.tokens\.map/);
  assert.doesNotMatch(scene,/ARCHITECTURE UNDER PRESSURE|props\.visualBeats|generatedByAI|previousLastFrameDataUri|<Img/);
  assert.match(root,/EP004-SHOT03-LIVING-WORLD-STORYBOARD-V1/);
  assert.match(root,/previewOnly:true as const/);
  assert.match(factory,/validateEp004Shot03Storyboard\(props\)/);
});
