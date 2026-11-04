import test from 'node:test';
import assert from 'node:assert/strict';
import {validateFactoryAssembly} from './factory-media-worker.mjs';

function entry(kind='AT-FACTORY-MASTER'){
 const input={
   runId:'11111111-1111-4111-8111-111111111111',
   episodeKey:'EP003',
   sourceRenderIds:['22222222-2222-4222-8222-222222222222',
                    '33333333-3333-4333-8333-333333333333'],
   expectedSourceCommit:'a'.repeat(40),sourceDigest:'b'.repeat(64),
   durationInFrames:18000,startFrame:0,endFrame:18000,
 };
 if(kind==='AT-FACTORY-SHORT'){
   input.startFrame=1000; input.endFrame=2200; input.shortOrdinal=1;
 }
 return {renderId:'44444444-4444-4444-8444-444444444444',
   compositionId:kind,inputProps:input,fps:30,
   durationInFrames:input.endFrame-input.startFrame,
   width:kind==='AT-FACTORY-SHORT'?1080:1920,
   height:kind==='AT-FACTORY-SHORT'?1920:1080};
}

test('one exact source-bound master and one vertical 20-45 second Short are valid',()=>{
 const master=entry();
 assert.equal(validateFactoryAssembly(master).ids.length,2);
 const short=entry('AT-FACTORY-SHORT');
 assert.equal(validateFactoryAssembly(short).end-validateFactoryAssembly(short).start,1200);
});

test('never accept arbitrary clip identifiers, duplicates or URLs',()=>{
 for(const ids of [
   [],['https://evil.test/video.mp4'],['../file.mp4'],
   ['22222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-222222222222']]){
   const job=entry();
   job.inputProps.sourceRenderIds=ids;
   assert.throws(()=>validateFactoryAssembly(job),/FACTORY_MP4_SOURCE_IDS_INVALID/);
 }
});

test('reject protected or unsafe episodes and missing exact Git SHA',()=>{
 for(const key of ['EP001','EP002','../../ep001','ep003']){
   const job=entry();job.inputProps.episodeKey=key;
   assert.throws(()=>validateFactoryAssembly(job),/FACTORY_ASSEMBLY_SOURCE_NOT_PINN/);
 }
 const job=entry();job.inputProps.expectedSourceCommit='unverified';
 assert.throws(()=>validateFactoryAssembly(job),/FACTORY_ASSEMBLY_SOURCE_NOT_PINN/);
});

test('reject wrong fps and frame duration even for a valid source',()=>{
 const wrong=entry();wrong.fps=29;
 assert.throws(()=>validateFactoryAssembly(wrong),/FACTORY_ASSEMBLY_FPS_OR_DURATION_MISMATCH/);
 const frames=entry();frames.durationInFrames=999;
 assert.throws(()=>validateFactoryAssembly(frames),/FACTORY_ASSEMBLY_FPS_OR_DURATION_MISMATCH/);
});

test('vertical Shorts must be real 20-45 second 9:16 windows',()=>{
 const clips=[entry('AT-FACTORY-SHORT'),entry('AT-FACTORY-SHORT'),
              entry('AT-FACTORY-SHORT')];
 clips[0].inputProps.endFrame=1150;clips[0].durationInFrames=150;
 clips[1].inputProps.endFrame=2700;clips[1].durationInFrames=1700;
 clips[2].width=1920;
 for(const clip of clips){
  assert.throws(()=>validateFactoryAssembly(clip),/FACTORY_SHORT_VERTICAL_CONTRACT_INVALID/);
 }
});
