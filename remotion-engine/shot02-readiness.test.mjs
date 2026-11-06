import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

const root = path.dirname(fileURLToPath(import.meta.url));
const base = path.join(root, 'src/episodes/ep002');
const shot02 = readFileSync(path.join(base, 'Shot02GeneratedScene.tsx'), 'utf8');
const shot01 = readFileSync(path.join(base, 'Shot01LoginWaiting.tsx'), 'utf8');
const phone = readFileSync(path.join(base, 'Shot01ReadablePhone.tsx'), 'utf8');

test('SHOT02 does not invent speech frames or use an editorial-duration fallback', () => {
  assert.match(shot02, /requireShot02VerifiedCues/);
  assert.match(shot02, /ELEVENLABS_CHARACTER_TIMESTAMPS/);
  assert.match(shot02, /verifiedCues\.length !== 5/);
  assert.match(shot02, /cue\.startFrame !== verifiedCues\[i - 1\]\.endFrame/);
  assert.match(shot02, /verifiedCues\[4\]\.endFrame !== durationInFrames/);
  assert.match(shot02, /verified\.map\(cue => cue\.startFrame\)/);
  assert.match(shot02, /SHOT02_REQUIRES_30FPS_EXACT_VOICE_DURATION/);
  assert.doesNotMatch(shot02, /PROVISIONAL_STORYBOARD|duration \* \[|duration \* \.0[1-9]|1205\s*;/);
});

test('SHOT02 keeps the exact accepted SHOT01 world geography', () => {
  assert.match(shot02, /gatewayX: 934/);
  assert.match(shot02, /gatewayY: 420/);
  assert.match(shot02, /balancerX: 1161/);
  assert.match(shot02, /balancerY: 420/);
  assert.match(shot02, /authX: 1510/);
  assert.match(shot02, /authY: 298/);
  assert.match(shot01, /title="API Gateway" x=\{934\} y=\{420\}/);
  assert.match(shot01, /title="Load Balancer" x=\{1161\} y=\{420\}/);
  assert.match(shot01, /title="Auth Service" x=\{1510\} y=\{298\}/);
  assert.match(shot02, /import \{Shot01ReadablePhone\}/);
  assert.match(shot02, /<Shot01ReadablePhone/);
  assert.match(phone, /Logging in \.\.\./);
});

test('SHOT02 reuses exact approved visual primitives', () => {
  for (const name of ['ATBackground','ATBackendNode','ATCameraRig',
    'ATControlledRealismLayer','AT_FONT']) {
    assert.ok(shot02.includes(name), 'missing reviewed primitive ' + name);
  }
  assert.doesNotMatch(shot02, /SHALLOW HEALTH DOES NOT GUARANTEE/);
  assert.doesNotMatch(shot02, /Please try again|CONNECTION LOST|DATABASE OFFLINE/);
});

test('SHOT02 has exactly three Auth replicas and shared User Database', () => {
  for (const name of ['Auth01','Auth02','Auth03','User Database']) {
    assert.ok(shot02.includes(name), 'missing architecture concept ' + name);
  }
  assert.match(shot02, /THREE AUTH REPLICAS/);
  assert.match(shot02, /SHARED ACCOUNT LOOKUP/);
  assert.match(shot02, /SHARED DEPENDENCY/);
});

test('SHOT02 follows the five Director-approved narrated visual changes', () => {
  for (const required of [
    '09:00 · TICKETS ON SALE', 'ArrivalWave', 'API Gateway',
    'Load Balancer', 'New Login arrivals/s', 'User Database',
  ]) {
    assert.ok(shot02.includes(required), 'missing visual beat concept ' + required);
  }
  assert.match(shot02, /ILLUSTRATIVE/);
  assert.match(shot02, /Later 650\/900 examples belong to SHOT03/);
  assert.doesNotMatch(shot02, /OPENAI_API_KEY|ELEVENLABS_API_KEY|fetch\(/);
});
