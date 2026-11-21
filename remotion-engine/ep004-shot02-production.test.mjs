import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {
  EP004_SHOT01_LOCKED_SOURCE_SHA256,EP004_MAIL_ROUTE,EP004_HANDOFF_ROUTE,
  EP004_STANDBY_ROUTE,EP004_SPILLOVER_ROUTE,EP004_DEGRADED_ROUTE,
  ep004Shot01Exit,ep004RoutePosition,ep004BezierPosition
} from './src/components/architectural-thinking/EP004Shot01World.mjs';
import {
  EP004_SHOT01_V8_LOCKED_RENDER_ID,EP004_SHOT01_V8_SOURCE_COMMIT
} from './src/components/architectural-thinking/EP004Shot02ContinuityWorld.mjs';
import {
  EP004_SHOT02_COMPOSITION,EP004_SHOT02_BREATH_FRAMES,
  ep004Shot02ProductionWorld,validateEp004Shot02Render
} from './src/components/architectural-thinking/EP004Shot02ProductionWorld.mjs';

const cues=[
  {beatId:'SHOT02_P01_B01',anchor:'A true spoken first cue',startFrame:90,endFrame:180},
  {beatId:'SHOT02_P01_B02',anchor:'Another real second cue',startFrame:390,endFrame:490},
  {beatId:'SHOT02_P02_B01',anchor:'The final valid spoken cue',startFrame:1170,endFrame:1280}
];
const props={
  episodeKey:'EP004',shotKey:'SHOT02',sourceSha256:EP004_SHOT01_LOCKED_SOURCE_SHA256,
  previousRenderId:EP004_SHOT01_V8_LOCKED_RENDER_ID,
  previousSourceCommit:EP004_SHOT01_V8_SOURCE_COMMIT,
  worldStartFrame:2000,durationInFrames:2124,previewOnly:false,
  directorCpuApproved:true,scriptRevision:1,
  voiceTakeId:'00000000-0000-4000-8000-000000000001',
  narrationSha256:'a'.repeat(64),expectedSourceCommit:'b'.repeat(40),
  shotTitle:'Two Gateway Systems, One Shared Pressure',
  verifiedCues:cues,
  visualBeats:cues.map((z,i)=>({beatId:z.beatId,cueAnchor:z.anchor,
    direction:'Show original source visual beat '+i}))
};

test('SHOT02 production validates real voice, original locked V8 and source SHA',()=>{
  assert.equal(EP004_SHOT02_COMPOSITION,'EP004-SHOT02-TWO-GATEWAYS-V1-VISUAL');
  assert.equal(EP004_SHOT02_BREATH_FRAMES,60);
  assert.equal(validateEp004Shot02Render(props),true);
  for(const changed of [
    {voiceTakeId:''},{sourceSha256:'0'.repeat(64)},
    {previousRenderId:'00000000-0000-4000-8000-000000000000'},
    {previousSourceCommit:'f'.repeat(40)},{worldStartFrame:2001},
    {previewOnly:true},{directorCpuApproved:false},
    {narrationSha256:'0'}, {expectedSourceCommit:'bad'},
    {verifiedCues:[]}, {visualBeats:[]},
    {episodeKey:'EP003'},{shotKey:'SHOT01'}
  ])assert.throws(()=>validateEp004Shot02Render({...props,...changed}),
    /REQUIRED|MISMATCH/);
});

test('reject synthetic, reversed, outside-timeline, mismatched or duplicate cues',()=>{
  for(const changed of [
    {verifiedCues:[...cues.slice(0,1),{...cues[1],startFrame:60},cues[2]]},
    {verifiedCues:[cues[0],{...cues[1],beatId:cues[0].beatId},cues[2]]},
    {verifiedCues:[cues[0],{...cues[1],endFrame:2100},cues[2]]},
    {visualBeats:props.visualBeats.map((x,i)=>i===1?{...x,cueAnchor:'Altered cue'}:x)},
    {verifiedCues:[cues[0],{...cues[1],startFrame:90},cues[2]]}
  ])assert.throws(()=>validateEp004Shot02Render({...props,...changed}),
    /MISMATCH/);
});

test('production frame zero preserves V8 final world camera, traffic and diagnostics exactly',()=>{
  const original=ep004Shot01Exit({sourceSha256:EP004_SHOT01_LOCKED_SOURCE_SHA256,
    durationInFrames:2001,worldStartFrame:0,previewOnly:true});
  const first=ep004Shot02ProductionWorld(0,props);
  assert.equal(first.worldFrame,2000);
  assert.equal(first.cameraX,original.cameraX);
  assert.equal(first.cameraScale,original.cameraScale);
  assert.equal(first.blocked,original.blocked);
  assert.equal(first.tension,original.tension);
  assert.deepEqual(first.traffic,original.traffic);
  assert.deepEqual(first.diagnostics,original.diagnostics);
  assert.equal(first.cueIndex,-1);
  assert.equal(first.headerProgress,0);
});

test('real cues initiate visible meaning changes only at provider-aligned frames',()=>{
  const before=ep004Shot02ProductionWorld(89,props);
  const first=ep004Shot02ProductionWorld(90,props);
  const next=ep004Shot02ProductionWorld(390,props);
  const last=ep004Shot02ProductionWorld(1170,props);
  assert.equal(before.cueIndex,-1);
  assert.equal(first.cueIndex,0);
  assert.equal(next.cueIndex,1);
  assert.equal(last.cueIndex,2);
  assert.ok(last.visualStage>first.visualStage);
  assert.ok(last.cameraX<first.cameraX);
});

test('moving live request tokens remain exactly on existing approved routing paths',()=>{
  const routes={MAIL:EP004_MAIL_ROUTE,HANDOFF:EP004_HANDOFF_ROUTE,
    STANDBY:EP004_STANDBY_ROUTE,SPILLOVER:EP004_SPILLOVER_ROUTE};
  let count=0;
  for(let f=0;f<props.durationInFrames;f+=7){
    const state=ep004Shot02ProductionWorld(f,props);
    for(const token of state.traffic){
      const pos=token.lane==='MAIL'||token.lane==='HANDOFF'?
        ep004RoutePosition(routes[token.lane],token.progress):
        ep004BezierPosition(routes[token.lane],token.progress);
      assert.ok(Math.hypot(token.x-pos.x,token.y-pos.y)<1e-6,
        'Production token off path '+token.id+' at frame '+f);
      count++;
    }
    for(const signal of state.diagnostics){
      const pos=ep004BezierPosition(EP004_DEGRADED_ROUTE,signal.progress);
      assert.ok(Math.hypot(signal.x-pos.x,signal.y-pos.y)<1e-6);
    }
  }
  assert.ok(count>500);
});

test('preview original remains isolated and SHOT01 V8 files are never modified',async()=>{
  const production=await readFile(new URL('./src/episodes/ep004/Shot02DirectorV1.tsx',import.meta.url),'utf8');
  const preview=await readFile(new URL('./src/episodes/ep004/Shot02ContinuityV1.tsx',import.meta.url),'utf8');
  const generated=await readFile(new URL('./src/episodes/ep004/Shot02GeneratedScene.tsx',import.meta.url),'utf8');
  const root=await readFile(new URL('./src/Root.tsx',import.meta.url),'utf8');
  assert.match(preview,/CONTINUITY MOCK · NOT DIRECTOR LOCKED/);
  assert.match(production,/ep004Shot02ProductionWorld\(frame,props\)/);
  assert.match(generated,/validateEp004Shot02Render\(props\)/);
  assert.match(root,/EP004-SHOT02-TWO-GATEWAYS-V1-VISUAL/);
  assert.match(root,/EP004-SHOT01-ORDINARY-WORKDAY-V1-VISUAL/);
});

test('production SHOT02 contains no generic voice-beat card or free-form text overflow',async()=>{
  const source=await readFile(new URL('./src/episodes/ep004/Shot02DirectorV1.tsx',import.meta.url),'utf8');
  assert.doesNotMatch(source,/ARCHITECTURE UNDER PRESSURE/);
  assert.doesNotMatch(source,/props\.visualBeats\[state\.cueIndex\]\.direction/);
  assert.doesNotMatch(source,/<rect x=\{554\} y=\{880\}/);
  assert.match(source,/state\.traffic\.map\(/);
  assert.match(source,/ep004RoutePolyline\(EP004_MAIL_ROUTE\)/);
  assert.match(source,/ep004BezierPath\(EP004_STANDBY_ROUTE\)/);
});
