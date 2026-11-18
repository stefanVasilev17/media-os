import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EP004_MAIL_ROUTE,EP004_STANDBY_ROUTE,EP004_SHOT01_BEATS,
  EP004_SHOT01_LOCKED_SOURCE_SHA256,ep004RoutePolyline,
  ep004RoutePosition,ep004Shot01Phase,ep004Shot01Exit,
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
  for(const line of [EP004_MAIL_ROUTE,EP004_STANDBY_ROUTE]){
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
    assert.ok(w.routeProgress<=.955);
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
