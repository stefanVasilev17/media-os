import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {validateFactorySource} from './validate-factory-scenes.mjs';

const episode='/tmp/remotion-engine/src/episodes/ep003';
const source=path.join(episode,'Shot01GeneratedScene.tsx');
const valid=`import React from 'react';
import {AbsoluteFill,useCurrentFrame} from 'remotion';
import {ATArchitectureMap} from '../../components/architectural-thinking';
export const Shot01GeneratedScene=()=><AbsoluteFill>{useCurrentFrame()}</AbsoluteFill>;`;

test('new episode-local scenes can import React/Remotion and protected source read-only',()=>{
 assert.deepEqual(validateFactorySource(source,valid,episode),[]);
});

test('generated scene cannot access EP001/EP002, Root or arbitrary files',()=>{
 for(const value of [
  '../../ep001/live-diagram/LoginIntentLiveScene',
  '../../../Root',
  '../../../api/secrets',
  '../../../../../../etc/passwd'
 ]){
  const content=`import {secret} from '${value}';export const Shot01GeneratedScene=()=>null;`;
  assert.ok(validateFactorySource(source,content,episode).length>0,value);
 }
});

test('new scenes cannot execute Node OS APIs, fetch or arbitrary network/file commands',()=>{
 for(const [external,code] of [
  ['node:fs',`import fs from 'node:fs';const a=fs.readFile('/tmp/a');`],
  ['node:child_process',`import {spawn} from 'node:child_process';spawn('sh');`],
  ['axios',`import axios from 'axios';axios.get('https://evil.test');`],
  ['eval',`const a=eval('1+1');`],
  ['fetch',`const a=fetch('https://evil.test');`],
  ['dynamic import',`const mod=import('./unsafe');`],
  ['globalThis',`globalThis.process.exit(1);`],
 ]){
  assert.ok(validateFactorySource(source,code,episode).length>0,external);
 }
});
