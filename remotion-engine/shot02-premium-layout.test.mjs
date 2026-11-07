import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

const root=path.dirname(fileURLToPath(import.meta.url));
const modulePath=path.join(root,'src/episodes/ep002/Shot02PremiumLayout.ts');
const raw=readFileSync(modulePath,'utf8');
const stripped=stripTypeScriptTypes(raw,{mode:'strip'});
const layout=await import('data:text/javascript;charset=utf-8,'+encodeURIComponent(stripped));

test('SHOT02 premium HUD lanes do not overlap or leave 1080p frame',()=>{
  const lanes=Object.entries(layout.SHOT02_TEXT_LANES);
  assert.equal(lanes.length,3);
  for(const [name,area] of lanes){
    assert.ok(area.left>=44&&area.top>=40,name+' left/top margin');
    assert.ok(area.left+area.width<=1880&&area.top+area.height<=1040,
      name+' right/bottom margin');
    for(const [otherName,other] of lanes){
      if(name<otherName)
        assert.equal(layout.shot02Intersects(area,other,20),false,
          name+' overlaps '+otherName);
    }
  }
});

test('SHOT02 V5 diagram fits the entire 1920x1080 canvas',()=>{
  const {gateway,balancer,auth,database}=layout.SHOT02_NODES;
  assert.deepEqual([gateway.x,gateway.y,balancer.x,balancer.y,auth.x,auth.y],
    [650,410,927,410,1326,315]);
  assert.equal(database.x,1697);
  for(const [name,n] of Object.entries(layout.SHOT02_NODES)){
    assert.ok(n.x-n.width/2>=510,name+' not overlapping phone');
    assert.ok(n.x+n.width/2<1870,name+' right edge not clipped');
    assert.ok(n.y>250&&n.y+n.height<800,name+' vertical bounds');
  }
  assert.ok(gateway.x+gateway.width/2+14 <= balancer.x-balancer.width/2);
  assert.ok(balancer.x+balancer.width/2+38<=auth.x-auth.width/2);
  assert.ok(auth.x+auth.width/2+35<=database.x-database.width/2);
});

test('V5 camera is stationary and all 3 safe text lanes remain unobstructed',()=>{
  assert.doesNotThrow(()=>layout.assertShot02TextLanes({x:0,y:0,scale:1}));
  assert.ok(layout.SHOT02_PHONE_VISUAL_SAFE_BOUNDS.left>=44);
  assert.ok(layout.SHOT02_PHONE_VISUAL_SAFE_BOUNDS.left+
    layout.SHOT02_PHONE_VISUAL_SAFE_BOUNDS.width<510);
});

test('collision guard rejects unsafe camera translations or invalid camera scale',()=>{
  assert.throws(()=>layout.assertShot02TextLanes({x:850,y:0,scale:1}),
    /SHOT02_CAMERA_CONTRACT_INVALID/);
  assert.throws(()=>layout.assertShot02TextLanes({x:0,y:0,scale:2}),
    /SHOT02_CAMERA_CONTRACT_INVALID/);
  assert.throws(()=>layout.assertShot02TextLanes({x:Number.NaN,y:0,scale:1}),
    /SHOT02_CAMERA_CONTRACT_INVALID/);
});

test('Spoken Login request label stays beside the path, not over Phone or server nodes',()=>{
  const marker=layout.SHOT02_REQUEST_MARKER;
  assert.deepEqual(marker,{left:536,top:710,width:330,height:64});
  const phone=layout.SHOT02_PHONE_VISUAL_SAFE_BOUNDS;
  const nodes=Object.values(layout.SHOT02_NODES).map(n=>({
    left:n.x-n.width/2,top:n.y,width:n.width,height:n.height,
  }));
  for(const region of [...nodes,phone]){
    assert.equal(layout.shot02Intersects(marker,region,12),false,
      'Login packet label must not overlap protected architecture');
  }
});
