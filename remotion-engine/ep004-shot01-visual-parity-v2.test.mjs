import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {shot10TextWidth} from './shot10-content-fit-layout.mjs';
import {
  EP004_SHOT01_LAYOUT,EP004_MAIL_ROUTE,EP004_STANDBY_ROUTE,
  ep004Shot01LayoutValidate,ep004RoutePosition,ep004Shot01Phase,
  EP004_SHOT01_LOCKED_SOURCE_SHA256,EP004_SHOT01_BEATS
} from './src/components/architectural-thinking/EP004Shot01World.mjs';

const source=readFileSync(new URL('./src/episodes/ep004/Shot01OrdinaryWorkday.tsx',import.meta.url),'utf8');

test('EP004 v2 is physically tied to the EP001-EP003 Architectural Thinking components',()=>{
  for(const name of ['ATBackground','ATCameraRig','ATControlledRealismLayer','AT_FONT']){
    assert.match(source,new RegExp('\\b'+name+'\\b'));
  }
  assert.match(source,/EP004_SHOT01_LAYOUT/);
  assert.match(source,/EP004_MAIL_ROUTE/);
  assert.match(source,/EP004_STANDBY_ROUTE/);
  assert.doesNotMatch(source,/<Img\\b|previousLastFrameDataUri|staticPredecessor/);
});

test('client, gateway, server fleet and supporting service are non-overlapping, readable and attached to the same routes',()=>{
  assert.equal(ep004Shot01LayoutValidate(),true);
  const L=EP004_SHOT01_LAYOUT;
  assert.equal(L.client.x+L.client.width,EP004_MAIL_ROUTE[0].x);
  assert.equal(L.gateway.x,EP004_MAIL_ROUTE.at(-1).x);
  assert.equal(L.gateway.x+L.gateway.width,EP004_STANDBY_ROUTE[0].x);
  assert.equal(L.server.x,EP004_STANDBY_ROUTE.at(-1).x);
  assert.ok(L.otherServices.y>L.server.y+L.server.height+30);
  for(const rect of Object.values(L)){
    assert.ok(rect.x>=60&&rect.y>=130);
    assert.ok(rect.x+rect.width<=1860&&rect.y+rect.height<=1010);
  }
});

test('the only animated mailbox request uses the exact shared polyline, not an off-route detached dot',()=>{
  assert.ok(source.includes('cx={state.request.x} cy={state.request.y}'));
  assert.ok(source.includes('points={pathString(EP004_MAIL_ROUTE)}'));
  assert.ok(!source.includes('state.secondary.x')&&!source.includes('state.secondary.y'));
  const props={
    sourceSha256:EP004_SHOT01_LOCKED_SOURCE_SHA256,
    durationInFrames:2001,worldStartFrame:0,previewOnly:true
  };
  for(let frame=0;frame<2001;frame+=7){
    const w=ep004Shot01Phase(frame,props);
    const actual=ep004RoutePosition(EP004_MAIL_ROUTE,w.routeProgress);
    assert.ok(Math.abs(w.request.x-actual.x)<1e-8);
    assert.ok(Math.abs(w.request.y-actual.y)<1e-8);
  }
});

test('the original eight locked narration anchors are never replaced with invented timings',()=>{
  assert.equal(EP004_SHOT01_BEATS.length,8);
  assert.ok(source.includes('ep004Shot01Validate(props)'));
  assert.ok(source.includes('ep004Shot01Phase(frame,props)'));
  assert.ok(source.includes('props.previewOnly&&'));
  for(const bad of ['Math.random','Date.now','setTimeout','staticPredecessor'])assert.ok(!source.includes(bad));
});

test('moving prelude and final world state must remain frame-deterministic',()=>{
  const props={
    sourceSha256:EP004_SHOT01_LOCKED_SOURCE_SHA256,
    durationInFrames:2001,worldStartFrame:0,previewOnly:true
  };
  assert.equal(ep004Shot01Phase(0,props).worldFrame,0);
  assert.equal(ep004Shot01Phase(20,props).worldFrame,20);
  assert.equal(ep004Shot01Phase(59,props).worldFrame,59);
  assert.equal(ep004Shot01Phase(2000,props).worldFrame,2000);
  assert.ok(source.includes('pulse(worldFrame'));
  assert.ok(source.includes('frame={state.worldFrame}'));
  assert.ok(source.includes('scale={state.cameraScale}'));
});

test('all visible panel headings and states fit within premium node text lanes',()=>{
  const L=EP004_SHOT01_LAYOUT;
  const gatewayTextWidth=L.gateway.width-40;
  const gatewayStateWidth=gatewayTextWidth-80-18;
  const clientWidth=L.client.width-52;
  const serverWidth=L.server.width-40;
  const otherWidth=L.otherServices.width-40;
  const labels=[
    ['Outlook',29,clientWidth],
    ['PERSONAL INBOX',15,clientWidth],
    ['Gateway',27,gatewayTextWidth],
    ['Shared entry layer',16,gatewayTextWidth],
    ['ROUTING',17,gatewayStateWidth],
    ['REQUEST HELD',17,gatewayStateWidth],
    ['WAITING AT THE BOUNDARY',14,gatewayTextWidth],
    ['THE PATH CONTINUES',14,gatewayTextWidth],
    ['Server fleet',22,serverWidth],
    ['Remaining capacity',13,serverWidth],
    ['Other services',20,otherWidth],
    ['Not all unavailable',15,otherWidth]
  ];
  for(const [value,size,limit] of labels){
    assert.ok(shot10TextWidth(value,size)<=limit,
      'EP004_TEXT_MUST_NOT_ESCAPE_PANEL: '+value);
  }
});
