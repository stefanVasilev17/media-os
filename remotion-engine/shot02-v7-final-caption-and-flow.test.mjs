import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'src/episodes/ep002');
const scene=readFileSync(path.join(root,'Shot02DirectorVisualV5.tsx'),'utf8');
const ts=readFileSync(path.join(root,'Shot02PressureVisuals.ts'),'utf8');
const p=await import('data:text/javascript;charset=utf-8,'+
  encodeURIComponent(stripTypeScriptTypes(ts,{mode:'strip'})));

test('Closing title starts exactly 60 frames before speech ends and sits safely above controls',()=>{
  const spoken=1462;
  assert.equal(p.shot02ClosingBannerReveal(spoken-61,spoken),0);
  assert.equal(p.shot02ClosingBannerReveal(spoken-60,spoken),0);
  assert.ok(p.shot02ClosingBannerReveal(spoken-48,spoken)>.45);
  assert.equal(p.shot02ClosingBannerReveal(spoken-36,spoken),1);
  assert.equal(p.shot02ClosingBannerReveal(spoken+60,spoken),1);
  assert.match(scene,/const closingBannerReveal=shot02ClosingBannerReveal\(frame,spokenFrames\)/);
  assert.match(scene,/right:80,bottom:170,zIndex:25/);
  assert.match(scene,/opacity:closingBannerReveal/);
  assert.match(scene,/ONE DATABASE\. THREE AUTH INSTANCES\. RISING PRESSURE/);
});

test('Counter completes a safe 160px lift before closing title fades in',()=>{
  const spoken=1462;
  assert.equal(p.shot02CounterLift(spoken-96,spoken),0);
  assert.equal(p.shot02CounterLift(spoken-63,spoken),160);
  assert.equal(p.shot02CounterLift(spoken+60,spoken),160);
  let previous=0;
  for(let f=spoken-95;f<=spoken-60;f++){
    const height=p.shot02CounterLift(f,spoken);
    assert.ok(height>=previous&&height<=160);
    previous=height;
  }
  assert.ok(830-160+118<1080-170-50);
  assert.match(scene,/translateY\(-\$\{counterLift\}px\) scale\(/);
});

test('All green login particles have exactly one radius, fill and glow definition',()=>{
  assert.equal(p.SHOT02_LOGIN_PARTICLE.radius,9);
  assert.equal(p.SHOT02_LOGIN_PARTICLE.fill,'#73FFD0');
  assert.match(p.SHOT02_LOGIN_PARTICLE.glow,/drop-shadow/);
  assert.match(scene,/const RequestParticle:React\.FC/);
  assert.match(scene,/r=\{SHOT02_LOGIN_PARTICLE\.radius\}/);
  assert.match(scene,/fill=\{SHOT02_LOGIN_PARTICLE\.fill\}/);
  assert.match(scene,/filter:SHOT02_LOGIN_PARTICLE\.glow/);
  const instances=scene.match(/<RequestParticle\b/g)||[];
  assert.equal(instances.length,3);
  assert.match(scene,/SHOT02_PHONE_PIPE,SHOT02_GATEWAY_ENTRY/);
  assert.match(scene,/SHOT02_GATEWAY_EXIT,SHOT02_BALANCER_ENTRY/);
  assert.match(scene,/shot02CubicPoint\(t,a,m1,m2,b\)/);
  assert.match(scene,/shot02CubicPoint\(t,c,m3,m4,target\)/);
  assert.doesNotMatch(scene,/r=\{7\+2\*arrival\}|r=\{7\+3\*arrival\}|r=\{9\+2\*firstTapActive\}/);
});

test('Shared DB receives same green request animation immediately after first tap',()=>{
  assert.match(scene,/const firstTapFrame=start\[0\]\+15/);
  assert.match(scene,/const lookup=firstTapActive/);
  assert.match(scene,/const database=firstTapActive/);
  assert.match(scene,/visibility=\{particleAlpha\(t,lookup\)\*visible\}/);
  assert.match(scene,/const dbColor=shot02DatabaseColors\(stress\)/);
  assert.match(scene,/stroke=\{dbColor\.border\}/);
  assert.ok(p.shot02RequestStreamActivation(100+9,100)===1);
  assert.equal(p.shot02DatabaseStress(1000,1100),0);
});

test('Database orange stress starts only after the actual spoken User Database term',()=>{
  const spokenUserDatabaseEnd=1220;
  assert.equal(p.shot02DatabaseStress(spokenUserDatabaseEnd-1,spokenUserDatabaseEnd),0);
  assert.equal(p.shot02DatabaseStress(spokenUserDatabaseEnd,spokenUserDatabaseEnd),0);
  assert.ok(p.shot02DatabaseStress(spokenUserDatabaseEnd+25,spokenUserDatabaseEnd)>0);
  assert.equal(p.shot02DatabaseStress(spokenUserDatabaseEnd+65,spokenUserDatabaseEnd),1);
  assert.match(scene,/shot02DatabaseStress\(frame,terms\[6\]\.endFrame\)/);
  assert.match(scene,/shot02SharedDbPressure\(problemMention,problemMention,arrival\)/);
  assert.equal(p.shot02SharedDbPressure(0,0,1),0);
  assert.match(scene,/SHARED LOOKUP/);
  assert.match(scene,/opacity:1-clamp\(pressure\*4\)/);
  assert.match(scene,/opacity:clamp\(pressure\*4\)/);
  const quiet=p.shot02DatabaseColors(0),hot=p.shot02DatabaseColors(1);
  assert.notEqual(quiet.border,hot.border);
  assert.notEqual(quiet.glow,hot.glow);
});

test('No artificial narration offsets and no edits to the locked selected Take',()=>{
  assert.match(scene,/const spokenFrames=total-hold/);
  assert.match(scene,/requireShot02VerifiedCues\(spokenFrames/);
  assert.match(scene,/requireShot02SpokenTerms\(spokenFrames/);
  assert.match(scene,/SHOT02_HOLD_MUST_BE_EXACTLY_60_FRAMES/);
  assert.doesNotMatch(scene,/Math\.random\(|generateSpeech|fetch\(|<Audio|setTimeout/);
});
