import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 EP004_V3_LAYOUT,EP004_V3_LINEAGE,EP004_V3_ROUTES,
 EP004_V3_ROUTE_STYLE,ep004V3ValidateLayout,ep004V3Phase,
 ep004V3Point,ep004V3Path,ep004V3Exit,ep004V3Shot02Entry
} from './ep004-shot01-inherited-world-v3.mjs';
import {EP004_SHOT01_LOCKED_SOURCE_SHA256,EP004_SHOT01_BEATS}
 from './src/components/architectural-thinking/EP004Shot01World.mjs';
import {PREMIUM_ROUTE_STYLE} from './ep003-premium-routing-v2.mjs';
import {shot10TextWidth} from './shot10-content-fit-layout.mjs';

const props={
 sourceSha256:EP004_SHOT01_LOCKED_SOURCE_SHA256,
 durationInFrames:2001,worldStartFrame:0,previewOnly:true
};
const code=readFileSync(new URL('./src/episodes/ep004/Shot01InheritedWorldV3.tsx',import.meta.url),'utf8');
const entry=readFileSync(new URL('./src/episodes/ep004/Shot01OrdinaryWorkday.tsx',import.meta.url),'utf8');
const approved=readFileSync(new URL('./src/episodes/ep002/Shot02PremiumLayout.ts',import.meta.url),'utf8');

test('V3 inherits actual EP002 approved node centers instead of inventing new map',()=>{
 assert.equal(ep004V3ValidateLayout(),true);
 for(const [node,ep2] of [
  ['gateway','gateway'],['router','balancer'],
  ['mailboxFleet','auth'],['otherServices','database']
 ]){
  const n=EP004_V3_LAYOUT[node];
  const expression=new RegExp(ep2+':\\{x:'+n.x+',y:'+n.y+
    ',width:'+n.width+',height:'+n.height+'\\}');
  assert.match(approved,expression,'The inherited layout must remain physically exact: '+node);
 }
 assert.match(code,/SHOT02_NODES/);
});

test('V3 directly uses real EP001–EP003 primitives, not replacement boxes',()=>{
 for(const name of [
  'ATBackground','ATCameraRig','ATControlledRealismLayer',
  'ATPrimaryNode','ATBackendNode','EP004_V3_ROUTES'
 ])assert.ok(code.includes(name),'Missing real component '+name);
 assert.match(entry,/Ep004Shot01InheritedWorldV3 as Ep004Shot01OrdinaryWorkday/);
 assert.equal(EP004_V3_LINEAGE.premiumRouteImplementation,
  'ep003-premium-routing-v2.mjs');
 assert.deepEqual(EP004_V3_ROUTE_STYLE,PREMIUM_ROUTE_STYLE);
 for(const p of Object.values(EP004_V3_ROUTES))
   assert.ok(ep004V3Path(p).startsWith('M'));
});

test('V3 preserves the exact approved episode source and eight true cue identifiers',()=>{
 assert.equal(EP004_SHOT01_LOCKED_SOURCE_SHA256,
  'a47b5d2af200014828089bcfb0812017970a8ecfe623cefc67456359af4fe365');
 assert.equal(EP004_SHOT01_BEATS.length,8);
 assert.throws(()=>ep004V3Phase(0,{...props,sourceSha256:'wrong'}),/LOCKED_SOURCE/);
 assert.throws(()=>ep004V3Phase(0,{...props,previewOnly:false}),/DIRECTOR_SELECTED_TAKE/);
});

test('One primary request stays precisely on one visible canonical EP003 path for 2001 frames',()=>{
 let prev=-1;
 for(let frame=0;frame<2001;frame++){
  const s=ep004V3Phase(frame,props);
  const p=ep004V3Point(EP004_V3_ROUTES.mailbox,s.routeProgress);
  assert.ok(Math.hypot(s.request.x-p.x,s.request.y-p.y)<.00001);
  assert.ok(s.routeProgress+1e-8>=prev);
  prev=s.routeProgress;
 }
 assert.ok(code.includes('cx={s.request.x} cy={s.request.y}'));
 assert.ok(code.includes('ep004V3Path(EP004_V3_ROUTES.mailbox)'));
 assert.ok(!code.includes('s.secondary.x')&&!code.includes('s.secondary.y'));
});

test('Living 60-frame narrator-free prelude moves before first voice cue',()=>{
 const a=ep004V3Phase(0,props),b=ep004V3Phase(20,props),c=ep004V3Phase(59,props);
 assert.ok(a.routeProgress<b.routeProgress&&b.routeProgress<c.routeProgress);
 assert.ok(Math.hypot(a.request.x-c.request.x,a.request.y-c.request.y)>20);
 assert.notEqual(a.ambiance,b.ambiance);
});

test('The main request stops at boundary, never teleports to standby',()=>{
 const a=ep004V3Phase(470,props),b=ep004V3Phase(900,props);
 assert.equal(a.requestStatus,'WAITING');
 assert.equal(b.requestStatus,'WAITING');
 assert.ok(a.routeProgress<=.97);
 assert.ok(b.routeProgress<=.97);
 assert.ok(!code.includes('ep004V3Point(EP004_V3_ROUTES.standby'));
 assert.ok(code.includes('strokeDasharray'));
});

test('SHOT02 inherits the identical camera and waiting request in continuous world time',()=>{
 const last=ep004V3Exit(props),next=ep004V3Shot02Entry(last);
 assert.equal(last.worldFrame,2000);
 assert.equal(next.worldFrame,2001);
 assert.deepEqual(last.camera,next.camera);
 assert.deepEqual(last.request,next.request);
 assert.equal(next.routeProgress,last.routeProgress);
 assert.equal(next.requestStatus,'WAITING');
 assert.throws(()=>ep004V3Shot02Entry({...last,requestStatus:'IN_TRANSIT'}),/EXACT_SHOT01_EXIT/);
});

test('Text lanes and nodes are conservative and non-clipping at 1080p',()=>{
 for(const [label,size,width] of [
  ['Outlook',35,342],['Inbox',28,342],
  ['Gateway',19,236],['Traffic Router',19,224],
  ['Mail Services',28,310],['Schematic endpoints',20,310],
  ['Illustrative topology',18,310],['Services',28,212],
  ['Other M365 apps',19,212],['Not all offline',18,212]
 ])assert.ok(shot10TextWidth(label,size)<=width,'Text clipped: '+label);
 for(const n of Object.values(EP004_V3_LAYOUT)){
  assert.ok(n.x-n.width/2>=48);
  assert.ok(n.x+n.width/2<=1890);
  assert.ok(n.y+n.height<1030);
 }
});

test('Never reintroduce static predecessor frame, detached packet or fake provider timing',()=>{
 for(const banned of [
  'previousLastFrameDataUri','staticPredecessor','Math.random',
  'Date.now','setTimeout','voiceTakeId:undefined'
 ])assert.ok(!code.includes(banned),'Rejected source pattern: '+banned);
 assert.ok(code.includes('ep004Shot01Validate(props)'));
 assert.ok(code.includes('ep004V3Phase(frame,props)'));
});

test('Pinned production route may not invent source-independent cue timestamps',()=>{
 const a={...props,previewOnly:false,voiceTakeId:'11111111-1111-4111-8111-111111111111'};
 assert.throws(()=>ep004V3Phase(0,a),/REAL_ORDERED_VOICE_CUE/);
 const cues=Object.fromEntries(EP004_SHOT01_BEATS.map((id,i)=>[id,65+i*220]));
 const verified={...a,cueFrames:cues};
 assert.doesNotThrow(()=>ep004V3Phase(0,verified));
 assert.throws(()=>ep004V3Phase(0,{...verified,cueFrames:{...cues,SHOT01_P01_B02:65}}),
   /REAL_ORDERED_VOICE_CUE/);
});
