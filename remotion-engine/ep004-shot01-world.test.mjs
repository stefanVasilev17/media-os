import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EP004_MAIL_ROUTE,EP004_STANDBY_ROUTE,EP004_SHOT01_BEATS,
  EP004_SHOT01_LOCKED_SOURCE_SHA256,ep004RoutePolyline,
  ep004RoutePosition,ep004BezierPath,ep004BezierPosition,ep004Shot01Phase,ep004Shot01Exit,
  ep004Shot01Validate
} from './src/components/architectural-thinking/EP004Shot01World.mjs';

const props={
  sourceSha256:EP004_SHOT01_LOCKED_SOURCE_SHA256,
  durationInFrames:2000,worldStartFrame:0,previewOnly:false,
  voiceTakeId:'11111111-1111-4111-8111-111111111111',
  cueFrames:Object.fromEntries(EP004_SHOT01_BEATS.map((beat,i)=>[beat,65+220*i]))
};

test('preview never claims to be a voice-verified production render',()=>{
  assert.equal(ep004Shot01Validate({...props,previewOnly:true,voiceTakeId:undefined,cueFrames:undefined}),true);
  assert.throws(()=>ep004Shot01Validate({...props,previewOnly:false,cueFrames:undefined}),/REAL_ORDERED_VOICE_CUE/);
  assert.throws(()=>ep004Shot01Validate({...props,voiceTakeId:'not-a-selected-take'}),/DIRECTOR_SELECTED_TAKE/);
  assert.throws(()=>ep004Shot01Validate({...props,sourceSha256:'wrong'}),/LOCKED_SOURCE/);
});
test('all eight original cues must be real, strictly increasing, and after moving prelude',()=>{
  assert.equal(EP004_SHOT01_BEATS.length,8);
  assert.equal(ep004Shot01Validate(props),true);
  const bad={...props,cueFrames:{...props.cueFrames,SHOT01_P01_B02:65}};
  assert.throws(()=>ep004Shot01Validate(bad),/REAL_ORDERED_VOICE_CUE/);
  assert.throws(()=>ep004Shot01Validate({...props,cueFrames:{...props.cueFrames,SHOT01_P01_B01:10}}),/REAL_ORDERED_VOICE_CUE/);
});
test('request tokens stay exactly on the visible source-of-truth polylines',()=>{
  for(const line of [EP004_MAIL_ROUTE]){
    assert.equal(ep004RoutePolyline(line).split(' ').length,line.length);
    for(let n=0;n<=100;n++){
      const p=ep004RoutePosition(line,n/100);
      const onSegment=line.slice(1).some((b,i)=>{
        const a=line[i];
        const cross=(p.x-a.x)*(b.y-a.y)-(p.y-a.y)*(b.x-a.x);
        const dot=(p.x-a.x)*(b.x-a.x)+(p.y-a.y)*(b.y-a.y);
        return Math.abs(cross)<1e-6 && dot>=-1e-7
          &&dot<=(b.x-a.x)**2+(b.y-a.y)**2+1e-7;
      });
      assert.equal(onSegment,true,'detached packet on route at '+n);
    }
  }
});
test('the blocked request never teleports to the alternate route',()=>{
  let last=-Infinity;
  for(let f=0;f<props.durationInFrames;f+=13){
    const w=ep004Shot01Phase(f,props);
    assert.ok(w.routeProgress>=last);
    assert.ok(w.routeProgress<=.97);
    last=w.routeProgress;
  }
  const exit=ep004Shot01Exit(props);
  assert.equal(exit.worldFrame,1999);
  assert.equal(exit.requestStatus,'WAITING');
  assert.ok(exit.towardNext>.95);
  assert.ok(exit.cameraScale<1);
});
test('continuity contract passes exact world/camera/packet state to next shot',()=>{
  const exit=ep004Shot01Exit(props);
  assert.equal(exit.worldFrame+1,props.worldStartFrame+props.durationInFrames);
  assert.deepEqual(exit.request,ep004RoutePosition(EP004_MAIL_ROUTE,exit.routeProgress));
  assert.ok(Number.isFinite(exit.cameraX)&&Number.isFinite(exit.cameraScale));
});

test('EP004 inherits exact EP003 canonical public request path ports',()=>{
  assert.deepEqual(EP004_MAIL_ROUTE,[
    {x:485,y:532},{x:521,y:532}
  ]);
  assert.deepEqual(EP004_STANDBY_ROUTE,[
    {x:1050,y:535},{x:1090,y:535},{x:1137,y:584},{x:1192,y:584}
  ]);
  for(let frame=0;frame<props.durationInFrames;frame+=7){
    const state=ep004Shot01Phase(frame,props);
    assert.deepEqual(state.request,
      ep004RoutePosition(EP004_MAIL_ROUTE,state.routeProgress));
    if(state.secondaryVisible)assert.deepEqual(state.secondary,
      ep004BezierPosition(EP004_STANDBY_ROUTE,
        .03+.94*((props.worldStartFrame+frame)*.0022%1)));
    assert.ok(state.secondaryOpacity>=0&&state.secondaryOpacity<=1);
    assert.ok(state.spillover>=0&&state.spillover<=1);
    assert.ok(state.cameraScale>=.95);
    assert.ok(state.cameraScale<=1.08);
    assert.ok(state.mailOpen>=0&&state.mailOpen<=1);
    assert.ok(state.mailAttempt>=0&&state.mailAttempt<=1);
  }
});
test('EP004 keeps approved EP003 nodes untouched and reuses canonical geometry',async()=>{
  const {readFile}=await import('node:fs/promises');
  const nodes=await readFile(new URL('./src/components/architectural-thinking/ATStableServiceNodes.tsx',import.meta.url),'utf8');
  const outlook=await readFile(new URL('./src/components/architectural-thinking/ATOutlookMailClient.tsx',import.meta.url),'utf8');
  const shot=await readFile(new URL('./src/episodes/ep004/Shot01OrdinaryWorkday.tsx',import.meta.url),'utf8');
  assert.match(nodes,/ATBackendNode/);
  assert.match(nodes,/ATPrimaryNode/);
  assert.match(nodes,/EP004_LOCKED_EP003_NODE_BOUNDS/);
  assert.match(nodes,/EP004_LOCKED_EP003_REPLICA_Y/);
  assert.match(nodes,/ATStableServiceNodes/);
  assert.match(shot,/ATOutlookMailClient/);
  assert.match(shot,/ep004RoutePolyline\(EP004_MAIL_ROUTE\)/);
  assert.match(shot,/ep004BezierPath\(EP004_STANDBY_ROUTE\)/);
  assert.doesNotMatch(shot,/const Gateway:|const Server:|const Mailbox:/);
  assert.match(outlook,/clipPath=/);
  assert.match(outlook,/Trying to reconnect/);
  assert.match(outlook,/Focused/);
});

test('standby request stays on the exact EP003 Bezier route, including 2001 live frames',()=>{
  assert.equal(ep004BezierPath(EP004_STANDBY_ROUTE),
    'M 1050 535 C 1090 535 1137 584 1192 584');
  assert.deepEqual(ep004BezierPosition(EP004_STANDBY_ROUTE,0),{x:1050,y:535});
  assert.deepEqual(ep004BezierPosition(EP004_STANDBY_ROUTE,1),{x:1192,y:584});
  let previous=null;
  for(let f=0;f<2001;f++){
    const st=ep004Shot01Phase(f,{...props,durationInFrames:2001});
    const phase=(f*.0022)%1;
    const expected=ep004BezierPosition(EP004_STANDBY_ROUTE,.03+.94*phase);
    assert.deepEqual(st.secondary,expected);
    assert.ok(st.secondaryOpacity>=0&&st.secondaryOpacity<=1);
    if(previous && phase<previous.phase) {
      assert.ok(previous.opacity<.10);
      assert.ok(st.secondaryOpacity<.10);
    }
    previous={phase,opacity:st.secondaryOpacity};
  }
});
test('narrated pressure reaches downstream servers only after the true spillover beat',()=>{
  const before=ep004Shot01Phase(props.cueFrames.SHOT01_P02_B03-1,props);
  const during=ep004Shot01Phase(props.cueFrames.SHOT01_P02_B03+80,props);
  assert.equal(before.spillover,0);
  assert.ok(during.spillover>0&&during.spillover<1);
  const end=ep004Shot01Exit(props);
  assert.equal(end.spillover,1);
});
test('Outlook interaction fits inside one client and persistent nodes remain identical in layout',async()=>{
  const {readFile}=await import('node:fs/promises');
  const client=await readFile(new URL('./src/components/architectural-thinking/ATOutlookMailClient.tsx',import.meta.url),'utf8');
  const nodes=await readFile(new URL('./src/components/architectural-thinking/ATStableServiceNodes.tsx',import.meta.url),'utf8');
  assert.match(client,/Focused/);
  assert.match(client,/Microsoft 365/);
  assert.match(client,/New mail/);
  assert.match(client,/Search mail/);
  assert.match(client,/Trying to reconnect/);
  assert.match(client,/opacity=\{1-waiting\}/);
  assert.match(nodes,/EP004_LOCKED_EP003_NODE_BOUNDS/);
  assert.match(nodes,/EP004_LOCKED_EP003_REPLICA_Y/);
  assert.match(nodes,/spreading/);
  assert.doesNotMatch(client,/foreignObject|<iframe|<video/);
});

test('EP004 camera begins on Outlook then reveals the original EP003 main-node map',()=>{
  const start=ep004Shot01Phase(0,props);
  const middle=ep004Shot01Phase(props.cueFrames.SHOT01_P02_B01+210,props);
  const end=ep004Shot01Exit(props);
  assert.equal(start.cameraScale,1.08);
  assert.equal(start.cameraX,92);
  assert.ok(middle.cameraScale<start.cameraScale);
  assert.ok(end.cameraScale<middle.cameraScale);
  assert.ok(end.cameraX<middle.cameraX);
  const clientLeft=960+(56-960)*start.cameraScale+start.cameraX;
  const clientBottom=540+(926-540)*start.cameraScale;
  assert.ok(clientLeft>=40&&clientBottom<=1020,'Outlook frame clips at the opening');
  const clientExitLeft=960+(56-960)*end.cameraScale+end.cameraX;
  assert.ok(clientExitLeft>=40&&clientExitLeft<=150);
});


test('EP004 V4 final source keeps exact Outlook and inherited EP003 nodes inside the video safe area',async()=>{
  const {readFile}=await import('node:fs/promises');
  const scene=await readFile(new URL('./src/episodes/ep004/Shot01OrdinaryWorkday.tsx',import.meta.url),'utf8');
  const client=await readFile(new URL('./src/components/architectural-thinking/ATOutlookMailClient.tsx',import.meta.url),'utf8');
  const nodes=await readFile(new URL('./src/components/architectural-thinking/ATStableServiceNodes.tsx',import.meta.url),'utf8');
  const canonical=await readFile(new URL('./src/episodes/ep002/Shot02PremiumLayout.ts',import.meta.url),'utf8');
  assert.match(canonical,/gateway:\{x:650,y:410,width:258,height:250\}/);
  assert.match(nodes,/gateway:\{x:650,y:410,width:258,height:250\}/);
  assert.match(nodes,/balancer:\{x:927,y:410,width:246,height:250\}/);
  assert.match(nodes,/auth:\{x:1326,y:315,width:350,height:348\}/);
  assert.match(nodes,/database:\{x:1697,y:368,width:252,height:280\}/);
  assert.match(nodes,/\[412,498,584\]/);

  assert.match(canonical,/balancer:\{x:927,y:410,width:246,height:250\}/);
  assert.match(canonical,/auth:\{x:1326,y:315,width:350,height:348\}/);
  assert.match(nodes,/EP004_LOCKED_EP003_NODE_BOUNDS/);
  assert.match(nodes,/EP004_LOCKED_EP003_REPLICA_Y/);
  assert.match(scene,/ep004BezierPath\(EP004_STANDBY_ROUTE\)/);
  assert.doesNotMatch(scene,/from ['\"]\.\.\/ep002\//);
  assert.doesNotMatch(nodes,/from ['\"]\.\.\/\.\.\/episodes\/ep002\//);
  assert.match(scene,/opacity=\{state\.secondaryOpacity\}/);
  assert.match(client,/clipPath="url\(#ep004-outlook-window-clip\)"/);
  assert.match(client,/Microsoft 365/);
  assert.match(client,/Trying to reconnect/);
  assert.match(scene,/actionProgress=\{state\.mailAttempt\}/);
  assert.doesNotMatch(scene,/const (?:Gateway|Mailbox|Server):/);
  assert.doesNotMatch(client,/foreignObject|<iframe|<video/);
});


test('V5 Outlook header never overlaps the Microsoft 365 product label and three-dot menu',async()=>{
  const {readFile}=await import('node:fs/promises');
  const src=await readFile(new URL('./src/components/architectural-thinking/ATOutlookMailClient.tsx',import.meta.url),'utf8');
  assert.match(src,/<text x=\{140\} y=\{197\} fontSize=\{28\}/);
  assert.match(src,/<text x=\{140\} y=\{222\} fontSize=\{17\}[\s\S]{0,110}>Microsoft 365<\/text>/);
  assert.match(src,/<rect x=\{427\} y=\{172\} width=\{37\} height=\{58\} rx=\{12\}/);
  assert.match(src,/\{\[186,201,216\]\.map\(y=><circle key=\{y\}/);
  const conservativeLabelRight=140+'Microsoft 365'.length*17*.75;
  assert.ok(conservativeLabelRight<427-35,'Microsoft 365 may overlap menu reserved area');
  assert.ok(172>159 && 172+58<239,'Menu must fit within header height');
  assert.ok(216+2.7<239,'Third dot must fit within the header');
  assert.doesNotMatch(src,/<text x=\{350\} y=\{207\}/);
});

test('V5 reuses the original locked-size premium Load Balancer and Outlook Service shells',async()=>{
  const {readFile}=await import('node:fs/promises');
  const nodes=await readFile(new URL('./src/components/architectural-thinking/ATStableServiceNodes.tsx',import.meta.url),'utf8');
  const scene=await readFile(new URL('./src/episodes/ep004/Shot01OrdinaryWorkday.tsx',import.meta.url),'utf8');
  assert.match(nodes,/import \{ATBackendNode,ATPrimaryNode\} from '\.\/ATArchitecturePrimitives'/);
  assert.match(nodes,/gateway:\{x:650,y:410,width:258,height:250\}/);
  assert.match(nodes,/balancer:\{x:927,y:410,width:246,height:250\}/);
  assert.match(nodes,/auth:\{x:1326,y:315,width:350,height:348\}/);
  assert.match(nodes,/database:\{x:1697,y:368,width:252,height:280\}/);
  assert.match(nodes,/frame,arrival:\.82,selected:reroute/);
  assert.match(nodes,/flow:\.47\+\.29\*reroute/);
  assert.match(nodes,/height:67,display:'flex'/);
  assert.match(nodes,/RISING LOAD/);
  assert.match(nodes,/AVAILABLE/);
  assert.match(nodes,/fontSize:18,fontWeight:660/);
  assert.match(nodes,/activity=clamp/);
  assert.match(nodes,/\[0,1,2,3\]\.map\(j=>/);
  assert.doesNotMatch(nodes,/ATMiniWorld|position:'absolute',top:/);
  assert.match(scene,/ep004BezierPath\(EP004_STANDBY_ROUTE\)/);
  assert.match(scene,/ATOutlookMailClient/);
});
