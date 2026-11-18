import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
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
  assert.match(source,/cx=\\{state\\.request\\.x\\} cy=\\{state\\.request\\.y\\}/);
  assert.match(source,/points=\\{pathString\\(EP004_MAIL_ROUTE\\)\\}/);
  assert.doesNotMatch(source,/state\\.secondary\\.x|state\\.secondary\\.y/);
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
  assert.match(source,/ep004Shot01Validate\\(props\\)/);
  assert.match(source,/ep004Shot01Phase\\(frame,props\\)/);
  assert.match(source,/props\\.previewOnly&&/);
  assert.doesNotMatch(source,/Math\\.random|Date\\.now|setTimeout|staticPredecessor/);
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
  assert.match(source,/pulse\\(worldFrame/);
  assert.match(source,/frame=\\{state\\.worldFrame\\}/);
  assert.match(source,/scale=\\{state\\.cameraScale\\}/);
});
