import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateLockedSequence,episodeSegments} from './ep003-assemble-master.mjs';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const m=JSON.parse(read('../remotion-engine/ep003-director-locked-visual-sequence.json'));
const w=read('./ep003-assemble-master.mjs');
const clone=x=>JSON.parse(JSON.stringify(x));
test('Director approved exactly nine SHA-pinned consecutive shots, including premium replacements',()=>{
 assert.equal(validateLockedSequence(m),31473);
 assert.deepEqual(m.shots.map(x=>x.shotKey),Array.from({length:9},(_,i)=>'SHOT'+String(i+1).padStart(2,'0')));
 assert.deepEqual(m.shots.map(x=>x.frames),[2514,3443,3080,3841,3001,3601,3476,5372,3145]);
 assert.deepEqual(m.shots.map(x=>x.version),['V2','V4','V4','V1','V1','V1','V3','V3','V2']);
 assert.ok(m.shots.every(x=>x.directorLocked===true));
 assert.equal(m.shots[7].renderId,'d67eec72-66bb-427b-bdb9-0d4043ed5dd2');
 assert.equal(m.shots[7].sha256,'270744ad8a3fc0bd0aee2ea65fbdd83b887eb59dab05a7a369aaefe553a96bc1');
 assert.equal(m.shots[8].renderId,'b3a3912f-79ee-4c72-b313-cbe09f950a5e');
 assert.equal(m.shots[8].sha256,'f80a362e0b805edf7eee045e11d5c6492280fdea997eb9a9204ce5f5c458dc7f');
 assert.equal(m.shots[7].voiceTakeId,'368c239c-a93b-437e-a833-2f955fa51803');
 assert.equal(m.shots[8].voiceTakeId,'7510815a-d096-415f-b4f0-52ae8398ce45');
});
test('Immutable first seven approvals stay byte identical in manifest',()=>{
 const ids=['b6fd7f30-7c78-414b-a88c-387c0ee8c43a','78db6f85-ba05-4714-ba4f-fc70d64def88',
 'fc26ca7b-60f2-4c35-b248-6b373736ce99','4079729b-c1b3-405c-9a83-1ace0ef25641',
 '04b9f55a-7705-4f23-b9f7-a0103e8c955b','0007bd16-edbf-4ecc-927a-4a5781d0b921',
 '09457c3c-32d9-432c-aa92-67f0e7b13f60'];
 assert.deepEqual(m.shots.slice(0,7).map(s=>s.renderId),ids);
});
test('Nine-shot offset contiguous with eight real decoded joins',()=>{
 const q=episodeSegments(m.shots);
 assert.equal(q.length,9);
 assert.equal(q.at(-1).startFrame,28328);
 assert.equal(q.at(-1).endFrame,31472);
 for(let i=1;i<q.length;i++)assert.equal(q[i].startFrame,q[i-1].endFrame+1);
 assert.equal(q.filter(x=>x.directorLocked).length,9);
});
test('Reject unlocking or modifying any approved source including replacements',()=>{
 for(let i=0;i<9;i++){
  const x=clone(m);x.shots[i].directorLocked=false;
  assert.throws(()=>validateLockedSequence(x));
 }
 const x=clone(m);x.shots[8].shotKey='SHOT10';
 assert.throws(()=>validateLockedSequence(x));
 const y=clone(m);y.shots[8].renderId=y.shots[7].renderId;
 assert.throws(()=>validateLockedSequence(y));
});
test('Only original verified H264 and selected AAC samples, zero reencode',()=>{
 for(const phrase of ["sha256(row.video_data)===s.sha256","'-c','copy'",
 "checkSeams(tmp,sources,master,segments)",'qa.length===segments.length-1',
 'seamScore>=27','leftSourceMatch>=50&&rightSourceMatch>=50',
 'EP003_CUMULATIVE_DIRECTOR_FULL_VIDEO_SAVED',
 'EP003_CUMULATIVE_REAL_ENCODED_SEAMS_VERIFIED'])assert.ok(w.includes(phrase),phrase);
 assert.doesNotMatch(w,/adelay=|apad=|textToSpeech|generateSpeech/);
});
