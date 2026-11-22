import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {EP004_SHOT01_LOCKED_SOURCE_SHA256} from './src/components/architectural-thinking/EP004Shot01World.mjs';
import {EP004_SHOT04_COMPOSITION,EP004_SHOT04_BREATH_FRAMES,
  EP004_SHOT04_TAIL_FRAMES,EP004_SHOT04_REVEAL_START,
  EP004_SHOT04_REVEAL_END,validateEp004Shot04Production,
  ep004Shot04ProductionWorld}
  from './src/components/architectural-thinking/EP004Shot04ProductionWorld.mjs';

const cues=[
  {beatId:'SHOT04_P01_B01',anchor:'First authentic approved spoken phrase',startFrame:93,endFrame:165},
  {beatId:'SHOT04_P02_B01',anchor:'Second authentic approved spoken phrase',startFrame:410,endFrame:520},
  {beatId:'SHOT04_P03_B01',anchor:'Final authentic approved spoken phrase',startFrame:1080,endFrame:1190}
];
const beats=cues.map((cue,i)=>({
  beatId:cue.beatId,cueAnchor:cue.anchor,
  direction:i===0?'Primary gateway traffic':i===1?'Alternative Teams route':'Exchange mailbox continuity'
}));
const props={
  episodeKey:'EP004',shotKey:'SHOT04',previewOnly:false,directorCpuApproved:true,
  sourceSha256:EP004_SHOT01_LOCKED_SOURCE_SHA256,
  previousRenderId:'c52ccb1e-3165-4fff-bc00-bddaf1c38708',
  previousSourceCommit:'420e72ba17795c51efd553feb171b99a2bb17d82',
  previousFrameCount:2234,previousLastEncodedFrame:2233,
  previousVideoSha256:'a'.repeat(64),worldStartFrame:6356,
  durationInFrames:2100,breathFrames:72,scriptRevision:1,
  voiceTakeId:'00000000-0000-4000-8000-000000000004',
  narrationSha256:'b'.repeat(64),expectedSourceCommit:'c'.repeat(40),
  shotTitle:'The Architecture Behind the Gateway Failure',
  verifiedCues:cues,visualBeats:beats
};

test('SHOT04 keeps the exact locked predecessor identity and never invents narration',()=>{
  assert.equal(EP004_SHOT04_COMPOSITION,'EP004-SHOT04-CONTINUOUS-GATEWAYS-V1-VISUAL');
  assert.equal(validateEp004Shot04Production(props),true);
  const bad=[
    {previousFrameCount:2235},
    {previousLastEncodedFrame:2232},
    {worldStartFrame:6357},
    {previousSourceCommit:'not-a-commit'},
    {previousVideoSha256:'not-a-sha'},
    {sourceSha256:'0'.repeat(64)},
    {previewOnly:true},{directorCpuApproved:false},
    {breathFrames:60},{voiceTakeId:''},
    {expectedSourceCommit:'0000'},
    {verifiedCues:[]},{visualBeats:[]},
    {durationInFrames:599}
  ];
  for(const item of bad)assert.throws(
    ()=>validateEp004Shot04Production({...props,...item}),/EP004_/);
});
test('Director gets 2.4 seconds of moving silent transition and no frozen frame 1-30',()=>{
  assert.equal(EP004_SHOT04_BREATH_FRAMES,72);
  assert.equal(EP004_SHOT04_TAIL_FRAMES,45);
  assert.ok(EP004_SHOT04_REVEAL_END>EP004_SHOT04_REVEAL_START);
  let previousWorld=props.worldStartFrame-1;const positions=new Set();
  for(let frame=0;frame<=90;frame++){
    const state=ep004Shot04ProductionWorld(frame,props);
    assert.equal(state.worldFrame,props.worldStartFrame+frame);
    assert.ok(state.worldFrame>previousWorld);previousWorld=state.worldFrame;
    assert.equal(state.voiceStartFrame,72);
    assert.equal(state.spoken,frame>=72);
    assert.equal(state.sourceSnapshotIsStatic,false);
    assert.ok(state.reveal>=0&&state.reveal<=1);
    if(frame<72)assert.equal(state.beatIndex,-1);
    const token=state.storyboard.tokens[0];
    if(token)positions.add(token.x.toFixed(4)+'/'+token.y.toFixed(4));
  }
  assert.ok(positions.size>5,'living gateway traffic must keep moving throughout opening');
  const before=ep004Shot04ProductionWorld(71,props),after=ep004Shot04ProductionWorld(72,props);
  assert.equal(before.spoken,false);
  assert.equal(after.spoken,true);
  assert.ok(after.reveal>=before.reveal);
});
test('real aligned visual beats select readable gateway/messaging focus without script changes',()=>{
  const primary=ep004Shot04ProductionWorld(140,props);
  const teams=ep004Shot04ProductionWorld(460,props);
  const mailbox=ep004Shot04ProductionWorld(1120,props);
  assert.equal(primary.beatIndex,0);
  assert.equal(teams.beatIndex,1);
  assert.equal(mailbox.beatIndex,2);
  assert.ok(primary.focusAlpha>0&&teams.focusAlpha>0&&mailbox.focusAlpha>0);
  assert.notEqual(primary.focusY,teams.focusY);
  assert.notEqual(teams.focusY,mailbox.focusY);
});
test('locked SHOT03 seam, exact SHOT04 voice mux, no paid TTS or automatic CPU job',async()=>{
  const worker=await readFile(new URL('./cpu-worker.mjs',import.meta.url),'utf8');
  const body=worker.slice(worker.indexOf('async function render(job)'));
  const audio=body.indexOf('await fetchEp004Shot04ApprovedVoice(job,inputProps);');
  const source=body.indexOf('await preflightEp004Shot04PreviousVideo(');
  const cpu=body.indexOf('await renderMedia({');
  const mux=body.indexOf('await muxEp004Shot04ApprovedVoice(job,outputPath,inputProps);');
  const seam=body.indexOf('await verifyEp004Shot04SeamAndMotion(');
  assert.ok(audio>0&&source>audio&&cpu>source&&mux>cpu&&seam>mux);
  assert.match(worker,/adelay=2400:all=1/);
  assert.match(worker,/SHOT04_PREVIOUS_LAST_FRAME_TO_NEW_FIRST_FRAME_SEAM_FAILED/);
  assert.match(worker,/SHOT04_FIRST_1_8_SECONDS_MUST_REMAIN_VOICE_SILENT/);
  assert.match(worker,/SHOT04_LIVING_ARCHITECTURE_FIRST_30_FRAMES_MUST_MOVE/);
  assert.match(worker,/EP004_SHOT04_APPROVED_VOICE_AND_VERIFIED_SHOT03_PRECPU_PASS/);
  const root=await readFile(new URL('./src/Root.tsx',import.meta.url),'utf8');
  const shot=await readFile(new URL('./src/episodes/ep004/Shot04ProductionScene.tsx',import.meta.url),'utf8');
  assert.match(root,/EP004-SHOT04-CONTINUOUS-GATEWAYS-V1-VISUAL/);
  assert.match(shot,/frame===0&&props.previousLastFrameDataUri/);
  assert.match(shot,/Shot03LivingArchitectureWorldView/);
  assert.doesNotMatch(shot,/static freeze|fake audio|elevenlabs\.generate/);
});
