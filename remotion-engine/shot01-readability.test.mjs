import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

const root=path.dirname(fileURLToPath(import.meta.url));
const scene=readFileSync(path.join(root,'src/episodes/ep002/Shot01LoginWaiting.tsx'),'utf8');
const phone=readFileSync(path.join(root,'src/episodes/ep002/Shot01ReadablePhone.tsx'),'utf8');

test('SHOT01 keeps Director-approved five voice cue starts',()=>{
  assert.match(scene,/beatStartFrames\?: number\[\]/);
  assert.match(scene,/input\?\.length === 5/);
  assert.match(scene,/shot01CueStarts\(duration, beatStartFrames\)/);
});

test('SHOT01 removes two explanatory overlays while keeping health pass facts',()=>{
  assert.doesNotMatch(scene,/SHALLOW HEALTH DOES NOT GUARANTEE LOGIN COMPLETION/i);
  assert.doesNotMatch(scene,/ILLUSTRATIVE SHALLOW HEALTH PROBES/i);
  assert.match(scene,/Liveness: PASS/);
  assert.match(scene,/Readiness: PASS/);
});

test('SHOT01 uses scoped readable phone and preserves EP001 architecture world',()=>{
  assert.match(scene,/import \{Shot01ReadablePhone\}/);
  assert.match(scene,/<Shot01ReadablePhone/);
  assert.match(scene,/<ATBackground>/);
  assert.match(scene,/<ATCameraRig/);
  assert.match(scene,/<ATBackendNode/);
});

test('SHOT01 phone shows readable credential fields and prominent working indicator',()=>{
  assert.match(phone,/fontSize:23,fontWeight:760/);
  assert.match(phone,/height:73,borderRadius:17/);
  assert.match(phone,/height:88,borderRadius:20/);
  assert.match(phone,/width:35,height:35/);
  assert.match(phone,/Logging in \.\.\./);
  assert.doesNotMatch(phone,/>Waiting</);
});

test('SHOT01 waiting time rail stays right of enlarged phone and below health probes',()=>{
  const layout=scene.match(/const TIME_RAIL_SAFE_AREA = \\{left: (\\d+), top: (\\d+), width: (\\d+), height: (\\d+)\\} as const;/);
  assert.ok(layout,'TimeRail must declare an explicit bounded safe area');
  const [,left,top,width,height]=layout.map(Number);
  assert.ok(left>=1000,'Rail must stay to the right of the phone');
  assert.ok(top>=875,'Rail must remain below the health-probe panel');
  assert.ok(left+width<=1600,'Rail must stay inside the 1920px composition');
  assert.ok(top+height<=1000,'Rail must stay above the lower frame edge');
  assert.match(scene,/position: 'absolute', \\.\\.\\.TIME_RAIL_SAFE_AREA/);
});
