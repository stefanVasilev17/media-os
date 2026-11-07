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

test('SHOT02 preserves SHOT01 node centers and reduces two touching nodes',()=>{
  const {gateway,balancer,auth,database}=layout.SHOT02_NODES;
  assert.deepEqual([gateway.x,gateway.y,balancer.x,balancer.y,auth.x,auth.y],
    [934,420,1161,420,1510,298]);
  assert.equal(database.x,2140);
  assert.ok(gateway.x+gateway.width/2+16 <= balancer.x-balancer.width/2,
    'Gateway and Balancer need a legible nonoverlap gap');
  assert.ok(balancer.x+balancer.width/2+16<=auth.x-auth.width/2,
    'Balancer must not collide with Auth Service');
});

test('SHOT02 projected typography stays clear across 1331 sampled camera poses',()=>{
  let sampled=0;
  const ten=[0,.1,.2,.3,.4,.5,.6,.7,.8,.9,1];
  for(const c of ten)for(const g of ten)for(const d of ten){
    const camera={
      x:-55*c-215*g-280*d,
      y:-8*g-12*d,
      scale:1.018-.045*c+.04*g+.028*d,
    };
    assert.doesNotThrow(()=>layout.assertShot02TextLanes(camera),
      'layout collision at '+JSON.stringify(camera));
    sampled++;
  }
  assert.equal(sampled,1331);
});

test('collision guard rejects unsafe camera translations or invalid camera scale',()=>{
  assert.throws(()=>layout.assertShot02TextLanes({x:850,y:0,scale:1}),
    /SHOT02_TEXT_OVERLAPS_ARCHITECTURE/);
  assert.throws(()=>layout.assertShot02TextLanes({x:0,y:0,scale:2}),
    /SHOT02_CAMERA_CONTRACT_INVALID/);
  assert.throws(()=>layout.assertShot02TextLanes({x:Number.NaN,y:0,scale:1}),
    /SHOT02_CAMERA_CONTRACT_INVALID/);
});

test('Spoken Login request label stays beside the path, not over Phone or server nodes',()=>{
  const marker=layout.SHOT02_REQUEST_MARKER;
  assert.deepEqual(marker,{left:792,top:645,width:204,height:46});
  const phone={left:320,top:165,width:450,height:815};
  const nodes=Object.values(layout.SHOT02_NODES).map(n=>({
    left:n.x-n.width/2,top:n.y,width:n.width,height:n.height,
  }));
  for(const region of [...nodes,phone]){
    assert.equal(layout.shot02Intersects(marker,region,12),false,
      'Login packet label must not overlap protected architecture');
  }
});
