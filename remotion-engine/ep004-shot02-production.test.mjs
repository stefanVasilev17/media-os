import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {shot10TextWidth} from './shot10-content-fit-layout.mjs';
import {ep003CardIsReadable,ep003CardOpacity} from './ep003-readable-card-policy.mjs';
import {
  atGlossaryTextWidth,atGlossaryCardIsReadable,atGlossaryCardOpacity,
  atGlossaryMinReadableFrames
} from './src/components/architectural-thinking/ATReadableTermCardPolicy.mjs';
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
  failoverTermStartFrame:210,
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
    {failoverTermStartFrame:59},{failoverTermStartFrame:1900},
    {failoverTermStartFrame:null},
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


test('SHOT02 selected audio is authorized before any paid CPU frames and reauthorized before final mux',async()=>{
  const worker=await readFile(new URL('./cpu-worker.mjs',import.meta.url),'utf8');
  const entry=worker.slice(worker.indexOf('async function render(job)'));
  const preflight=entry.indexOf('await fetchEp004Shot02ApprovedVoice(job,inputProps);');
  const expensive=entry.indexOf('await renderMedia({');
  const mux=entry.indexOf('await muxEp004Shot02ApprovedVoice(job,outputPath,inputProps);');
  assert.ok(preflight>0&&expensive>preflight&&mux>expensive,
    'approved voice GET must succeed before CPU frames, then run again at final mux');
  assert.match(worker,/async function fetchEp004Shot02ApprovedVoice\(job,inputProps\)/);
  assert.match(worker,/ep004-shot02-selected-voice/);
  assert.match(worker,/EP004_SHOT02_APPROVED_TAKE_CPU_PREFLIGHT_PASS/);
  assert.match(worker,/await leaseClient\.refresh\(\)/);
});


test('FAILOVER glossary reproduces EP003 amber definition card and contains locked text',async()=>{
  const file=await readFile(new URL('./src/episodes/ep004/Shot02DirectorV1.tsx',import.meta.url),'utf8');
  assert.match(file,/const FAILOVER_TITLE='FAILOVER'/);
  assert.match(file,/Moving work to an alternative path/);
  assert.match(file,/when the original path cannot serve it/);
  assert.match(file,/ep003CardOpacity\(frame,start,until\)/);
  assert.match(file,/ep003CardIsReadable\(FAILOVER_TITLE,definition,start,until,30\)/);
  assert.match(file,/shot10TextWidth\(line,29\)/);
  assert.match(file,/borderRadius:17,border:'2px solid '\+AMBER/);
  assert.match(file,/background:'linear-gradient\(120deg,rgba\(10,32,50,\.977\),rgba\(5,19,37,\.988\)\)'/);
  assert.match(file,/boxShadow:'0 13px 36px rgba\(0,0,0,\.33\),0 0 18px rgba\(89,202,232,\.08\)'/);
  assert.match(file,/fontSize:23,lineHeight:'29px'/);
  assert.match(file,/fontSize:29,lineHeight:'39px'/);
  assert.match(file,/start=\{props.failoverTermStartFrame\}/);
  assert.doesNotMatch(file,/props\.visualBeats\[state\.cueIndex\]\.direction/);
  const title='FAILOVER';
  const lines=['Moving work to an alternative path',
    'when the original path cannot serve it'];
  const start=210,end=start+240,left=560,top=742,height=178;
  assert.ok(ep003CardIsReadable(title,lines.join(' '),start,end,30));
  assert.equal(ep003CardOpacity(start-1,start,end),0);
  assert.equal(ep003CardOpacity(start,start,end),0);
  assert.ok(ep003CardOpacity(start+18,start,end)>.99);
  assert.equal(ep003CardOpacity(end,start,end),0);
  const width=Math.ceil(Math.max(shot10TextWidth(title,23),
    ...lines.map(line=>shot10TextWidth(line,29)))+80);
  assert.ok(width>=320&&width<=950);
  assert.ok(left+width<=1510&&top+height<=1020);
  assert.ok(top>=690,'Glossary does not overlap locked EP003 nodes ending at 663px');
  assert.ok(left>=560,'Glossary does not overlap Outlook client ending at x485');
  assert.ok(start>=60&&end<=props.durationInFrames-45);
});


test('factory-safe shared glossary policy is mathematically identical to EP003 across real inputs',()=>{
  const words=['FAILOVER','LATENCY','BOTTLENECK',
    'Moving work to an alternative path',
    'when the original path cannot serve it'];
  for(const term of words){
    for(const size of [18,23,29]){
      assert.equal(atGlossaryTextWidth(term,size),shot10TextWidth(term,size));
    }
  }
  for(const start of [60,210,650]){
    for(const frames of [90,165,210,240,270]){
      const end=start+frames;
      const text='Moving work to an alternative path when the original path cannot serve it';
      assert.equal(atGlossaryCardIsReadable('FAILOVER',text,start,end,30),
        ep003CardIsReadable('FAILOVER',text,start,end,30));
      for(const frame of [start-1,start,start+1,start+18,start+frames-20,end-1,end]){
        assert.equal(atGlossaryCardOpacity(frame,start,end),
          ep003CardOpacity(frame,start,end));
      }
    }
  }
  assert.ok(atGlossaryMinReadableFrames('FAILOVER',
    'Moving work to an alternative path when the original path cannot serve it',30)<=240);
});
