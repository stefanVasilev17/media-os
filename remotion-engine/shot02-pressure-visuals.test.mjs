import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const base=path.join(path.dirname(fileURLToPath(import.meta.url)),'src/episodes/ep002');
const read=(name)=>readFileSync(path.join(base,name),'utf8');
const visuals=await import('data:text/javascript;charset=utf-8,'+
  encodeURIComponent(stripTypeScriptTypes(read('Shot02PressureVisuals.ts'),{mode:'strip'})));
const scene=read('Shot02GeneratedScene.tsx');
const phone=read('Shot02PressurePhone.tsx');
const canon=read('Shot01ReadablePhone.tsx');

test('Auth replicas are three distinct cards, each with unique ingress and egress',()=>{
  assert.deepEqual(visuals.SHOT02_AUTH_REPLICA_PORTS.map(x=>x.id),
    ['AUTH 01','AUTH 02','AUTH 03']);
  assert.equal(new Set(visuals.SHOT02_AUTH_REPLICA_PORTS.map(x=>x.y)).size,3);
  assert.ok(visuals.SHOT02_AUTH_CARD_LEFT<visuals.SHOT02_AUTH_CARD_RIGHT);
  for(const replica of visuals.SHOT02_AUTH_REPLICA_PORTS){
    assert.ok(replica.y>=298+70&&replica.y<=298+354-35);
    const a=visuals.SHOT02_BALANCER_EXIT;
    const b={x:visuals.SHOT02_AUTH_CARD_LEFT,y:replica.y};
    const c={x:visuals.SHOT02_AUTH_CARD_RIGHT,y:replica.y};
    const db=visuals.SHOT02_DATABASE_ENTRY;
    const ingress=visuals.shot02CubicPoint(1,a,{x:1290,y:a.y},{x:1302,y:replica.y},b);
    const egress=visuals.shot02CubicPoint(1,c,{x:1808,y:replica.y},{x:1918,y:db.y},db);
    assert.deepEqual(ingress,b);
    assert.deepEqual(egress,db);
  }
  assert.match(scene,/SHOT02_AUTH_REPLICA_PORTS\.map/);
  assert.match(scene,/const branch=/);
  assert.match(scene,/const lookup=/);
  assert.doesNotMatch(scene,/const ReplicaRail/);
});

test('Login pressure changes gradually from turquoise to orange and red',()=>{
  let previous=-1;
  const distance=(a,b)=>{
    const channels=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16));
    const x=channels(a),y=channels(b);
    return Math.max(...x.map((v,i)=>Math.abs(v-y[i])));
  };
  for(let i=0;i<=100;i++){
    const pressure=visuals.shot02UserRequestPressure(i/100,i/100,i/100,i/100,i/100);
    assert.ok(pressure>=previous && pressure<=1);
    previous=pressure;
    const palette=visuals.shot02ButtonColors(pressure);
    for(const c of Object.values(palette))assert.match(c,/^#[A-Fa-f0-9]{6}$/);
    if(i<100)assert.ok(distance(palette.top,
      visuals.shot02ButtonColors(visuals.shot02UserRequestPressure(
        (i+1)/100,(i+1)/100,(i+1)/100,(i+1)/100,(i+1)/100)).top)<22);
  }
  const stable=visuals.shot02ButtonColors(0);
  const critical=visuals.shot02ButtonColors(1);
  assert.notEqual(stable.top,critical.top);
  assert.ok(parseInt(critical.top.slice(1,3),16)>parseInt(critical.top.slice(3,5),16));
  assert.match(phone,/pressure=\{pressure\}/);
  assert.match(scene,/pressure=\{userPressure\}/);
  assert.match(scene,/shot02UserRequestPressure\(context,wave,distribution,authActivity,flowBoost\)/);
  assert.match(canon,/export const Shot01ReadablePhone/);
  assert.doesNotMatch(phone,/export const Shot01ReadablePhone/);
});

test('Database colors heat only after lookup begins, never imply offline failure',()=>{
  assert.equal(visuals.shot02SharedDbPressure(0,0,1),0);
  const l=visuals.shot02SharedDbPressure(.25,0,1);
  const m=visuals.shot02SharedDbPressure(.6,.3,1);
  const h=visuals.shot02SharedDbPressure(1,1,1);
  assert.ok(l>0&&m>l&&h>m);
  const a=visuals.shot02DatabaseColors(0),b=visuals.shot02DatabaseColors(1);
  assert.notEqual(a.border,b.border);
  assert.notEqual(a.core,b.core);
  assert.match(scene,/const PressureDatabaseNode/);
  assert.match(scene,/shot02SharedDbPressure\(lookup,database,flowBoost\)/);
  assert.doesNotMatch(scene,/DATABASE OFFLINE|CONNECTION LOST|Math\.random\(/);
});

test('Premium motion remains bound to real selected Take cues and never regenerates audio',()=>{
  assert.match(scene,/const lookup=ease\(frame,starts\[4\]/);
  assert.match(scene,/const dbReveal=ease\(frame,terms\[5\]\.startFrame/);
  assert.match(scene,/const flowBoost=shot02FlowIntensity\(frame,terms\[4\]\.startFrame/);
  assert.match(scene,/requireShot02VerifiedCues/);
  assert.match(scene,/requireShot02SpokenTerms/);
  assert.match(scene,/<Shot02PressurePhone/);
  assert.doesNotMatch(scene,/\<Audio|\/generateSpeech|setTimeout|fetch\(/);
});
