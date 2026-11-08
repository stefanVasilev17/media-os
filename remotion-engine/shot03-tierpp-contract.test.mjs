import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const project=path.dirname(fileURLToPath(import.meta.url));
const ep002=path.join(project,'src/episodes/ep002');
const read=name=>readFileSync(path.join(ep002,name),'utf8');
const imports=source=>{
  const output=ts.transpileModule(source,{
    compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022},
  }).outputText;
  return 'data:text/javascript;base64,'+Buffer.from(output).toString('base64');
};
const layout=read('Shot02PremiumLayout.ts');
const contractSource=read('Shot03VisualContract.ts')
  .replace(/^import\s+\{SHOT02_NODES,shot02Intersects,type Rect\}\s+from\s+'\.\/Shot02PremiumLayout';\s*/m,'');
const contract=await import(imports(layout+'\n'+contractSource));
const scene=read('Shot03DirectorVisualV1.tsx');
const root=readFileSync(path.join(project,'src/Root.tsx'),'utf8');

const starts=[30,250,480,650,725,920,1300,1670,1830,1990,2180];
const termCues=contract.SHOT03_TERM_ORDER.map((id,index)=>({
  id,spokenAnchor:id.replaceAll('_',' '),startFrame:starts[index],
  endFrame:starts[index]+10,
}));
const beatStarts=[0,400,900,1250,1600];
const verifiedCues=beatStarts.map((startFrame,i)=>({
  beatNumber:i+1,spokenAnchor:'real unique quote '+i,
  startFrame,endFrame:i===4?2300:beatStarts[i+1],
}));
const props={
  durationInFrames:2300,voiceTakeId:'32e02d0c-acff-4dbb-8bde-81dd41901474',
  timingMode:'ELEVENLABS_CHARACTER_TIMESTAMPS',verifiedCues,termCues,
};

test('SHOT03 strictly requires selected Take and complete real voice terms',()=>{
  assert.doesNotThrow(()=>contract.validateShot03Source(props));
  assert.throws(()=>contract.validateShot03Source({...props,voiceTakeId:''}),/REQUIRES_CURRENT/);
  assert.throws(()=>contract.validateShot03Source({...props,verifiedCues:[]}),/REQUIRES_CURRENT/);
  assert.throws(()=>contract.validateShot03Source({...props,termCues:[]}),/REQUIRES_CURRENT/);
  assert.throws(()=>contract.validateShot03Source({...props,durationInFrames:2000}),/INVALID|MEASURED|ORDER/);
  assert.throws(()=>contract.validateShot03Source({...props,
    termCues:[...termCues].reverse()}),/TERM_ORDER/);
});

test('SHOT03 preserves SHOT02 world and all text rectangles are collision free',()=>{
  assert.doesNotThrow(()=>contract.assertShot03SafeLayout());
  assert.equal(contract.SHOT03_AUTH_PORTS.length,3);
  for(const [name,rect] of Object.entries(contract.SHOT03_TEXT_AREAS)){
    assert.ok(rect.left>=44&&rect.top>=35,name);
    assert.ok(rect.left+rect.width<=1876&&rect.top+rect.height<=1040,name);
  }
  for(const item of ['SHOT02_NODES','SHOT02_AUTH_REPLICA_PORTS',
    'SHOT02_DATABASE_ENTRY','Shot02PressurePhone']){
    assert.ok(scene.includes(item),'missing '+item);
  }
  assert.match(scene,/translate3d\(-680px,-150px,0\) scale\(1\.11\)/);
  assert.doesNotMatch(scene,/camera\.zoom|Math\.random|setTimeout|fetch\(/);
});

test('show 500, then 650, then 900 only after their spoken terms',()=>{
  const six=650,nine=725;
  assert.equal(contract.shot03ArrivalRate(six-1,six,nine),350);
  assert.equal(contract.shot03ArrivalRate(six,six,nine),350);
  assert.equal(contract.shot03ArrivalRate(six+28,six,nine),650);
  assert.equal(contract.shot03ArrivalRate(nine-1,six,nine),650);
  assert.equal(contract.shot03ArrivalRate(nine+28,six,nine),900);
  assert.equal(contract.shot03CompletionRate(249,250),350);
  assert.equal(contract.shot03CompletionRate(250,250),500);
  assert.match(scene,/starts.SIX_FIFTY/);
  assert.match(scene,/starts.NINE_HUNDRED/);
  assert.match(scene,/starts.THROUGHPUT/);
});

test('database stays running and work queues outside the DB',()=>{
  assert.equal(contract.shot03DatabasePressure(1670,1670,1830),.55);
  assert.ok(contract.shot03DatabasePressure(1740,1670,1830)>.72);
  assert.ok(contract.shot03DatabasePressure(1900,1670,1830)>.84);
  assert.equal(contract.shot03WaitingDepth(1299,1300,725),2);
  assert.equal(contract.shot03WaitingDepth(1300,1300,725),2);
  assert.equal(contract.shot03WaitingDepth(1400,1300,725),11);
  assert.ok(contract.shot03LatencyBar(2075,1990)>contract.shot03LatencyBar(1989,1990));
  for(const t of ['WAITING FOR RESOURCES','COMPLETING WORK','SATURATED · RUNNING'])
    assert.ok(scene.includes(t));
  assert.doesNotMatch(scene,/DATABASE OFFLINE|CONNECTION LOST|SYSTEM DOWN|CRASHED/);
});

test('one consistent Login request particle; separate completions',()=>{
  for(const t of ['SHOT02_LOGIN_PARTICLE.radius','SHOT02_LOGIN_PARTICLE.fill',
     'SHOT02_LOGIN_PARTICLE.glow','SHOT03_OUTPUT_PORT','SHOT03_OUTPUT_END'])
    assert.ok(scene.includes(t));
  assert.match(scene,/shot02CubicPoint\(t,a,m1,m2,b\)/);
  assert.match(scene,/shot02CubicPoint\(approach,c,m3,m4,target\)/);
  assert.match(scene,/rect key=\{k\}/);
  assert.match(scene,/toLocaleString/);
});

test('request clock deterministic, monotone and accelerates only with arrivals',()=>{
  const six=650,nine=725;
  for(let f=1;f<1700;f++)
    assert.ok(contract.shot03FlowClock(f,six,nine)>contract.shot03FlowClock(f-1,six,nine));
  const calm=contract.shot03FlowClock(500,six,nine)-contract.shot03FlowClock(499,six,nine);
  const heavy=contract.shot03FlowClock(1000,six,nine)-contract.shot03FlowClock(999,six,nine);
  assert.ok(heavy>calm);
});

test('SHOT03 candidate is registered but cannot render with blank voice props',()=>{
  assert.match(root,/id="EP002-SHOT03-CANDIDATE"/);
  assert.match(root,/component=\{Shot03DirectorVisualV1\}/);
  assert.match(root,/voiceTakeId:''/);
  assert.match(root,/verifiedCues:\[\]/);
  assert.match(root,/termCues:\[\]/);
  assert.match(scene,/validateShot03Source\(props\)/);
  assert.match(scene,/assertShot03SafeLayout\(\)/);
  assert.match(scene,/video.fps!==30/);
  assert.doesNotMatch(scene,/<Audio|generateSpeech|Math.random\(/);
  assert.doesNotMatch(scene,/postVoiceHoldFrames|editorialSilence/);
});


test('title transitions into SHOT03 instead of appearing fully in the first frame',()=>{
  assert.match(scene,/const titleShow=shot03Ease\(frame,8,18\)/);
  assert.match(scene,/const titleLineShow=shot03Ease\(frame,15,19\)/);
  assert.match(scene,/const contextLabelShow=shot03Ease\(frame,19,18\)/);
  assert.match(scene,/opacity:titleShow/);
  assert.match(scene,/transform:'scaleX\('/);
  assert.match(scene,/THE CAPACITY LIMIT/);
  assert.equal(contract.shot03Ease(0,8,18),0);
  assert.equal(contract.shot03Ease(29,8,18),1);
});

test('inbound flow increases in speed and density with real spoken pressure terms',()=>{
  const six=650,nine=725,bottleneck=1670;
  const early=contract.shot03RequestDensity(400,six,nine,bottleneck);
  const during=contract.shot03RequestDensity(690,six,nine,bottleneck);
  const high=contract.shot03RequestDensity(860,six,nine,bottleneck);
  const peak=contract.shot03RequestDensity(1770,six,nine,bottleneck);
  assert.equal(early,2);
  assert.ok(during>early&&high>during&&peak>high);
  const speedAt=frame=>contract.shot03FlowClock(frame+1,six,nine,bottleneck)
    -contract.shot03FlowClock(frame,six,nine,bottleneck);
  assert.ok(speedAt(1200)>speedAt(400)*2);
  assert.ok(speedAt(1800)>speedAt(1200));
  assert.match(scene,/shot03RequestDensity\(frame,sixFifty,nineHundred,bottleneck\)/);
});

test('queued work is illustrated outside DB with orange→dark-orange→red→bright-red stages',()=>{
  const unfinished=1300,bottleneck=1670,saturation=1830;
  const level=frame=>contract.shot03CongestionLevel(frame,unfinished,bottleneck,saturation);
  assert.equal(level(unfinished-1),0);
  assert.equal(level(unfinished),0);
  assert.ok(level(unfinished+75)>.25&&level(unfinished+75)<.35);
  assert.ok(level(bottleneck+75)>.60&&level(bottleneck+75)<.65);
  assert.equal(level(saturation+80),1);
  assert.equal(contract.shot03CongestionColor(0),'#F5A623');
  assert.equal(contract.shot03CongestionColor(1),'#FF3B30');
  assert.notEqual(contract.shot03CongestionColor(.33),
    contract.shot03CongestionColor(.66));
  assert.ok(contract.shot03ApproachPosition(.84,1)<.84);
  assert.equal(contract.shot03ApproachPosition(.84,0),.84);
  assert.doesNotThrow(()=>contract.assertShot03SafeLayout());
  assert.match(scene,/AUTH POOL WAIT · DB PERMITS/);
  assert.match(scene,/SHOT03_PRE_DB_WAIT_ZONE/);
  assert.match(scene,/queueLevel=\{queueLevel\}/);
  assert.match(scene,/saturated=\{frame>=starts.SATURATION\}/);
  assert.match(scene,/COMPLETING WORK/);
});

test('closing sentence matches the precise Director-approved message',()=>{
  assert.match(scene,/The database hasn&apos;t stopped working\. It just can&apos;t keep up!/);
  assert.doesNotMatch(scene,/THE DATABASE IS WORKING\. IT JUST CAN&apos;T KEEP UP\./);
});
