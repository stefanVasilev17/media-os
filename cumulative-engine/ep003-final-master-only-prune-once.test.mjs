import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateApprovedMaster} from './ep003-final-master-only-prune-once.mjs';
const manifest=JSON.parse(fs.readFileSync(new URL('../remotion-engine/ep003-director-locked-visual-sequence-11.json',import.meta.url),'utf8'));
const script=fs.readFileSync(new URL('./ep003-final-master-only-prune-once.mjs',import.meta.url),'utf8');
const actual={
 id:'63827ce6-2ea8-4853-a61b-8549fe8db967',project_id:'11111111-1111-1111-1111-111111111111',
 status:'SUCCEEDED',composition_id:'EP003-CUMULATIVE-DIRECTOR-MASTER',
 render_key:'EP003_CUMULATIVE_LOCKED_SHOTS_01_TO_11',profile:'REVIEW',
 width:1920,height:1080,fps:30,duration_in_frames:38593,actual_bytes:152025545,
 input_props:{directorLocked:true,verified:true,
  masterSha256:'1560d46f8067c735a2578d769bfcda465f651e46babdf4bd7dfa1090f6ce8ff6',
  shotCount:11,sequence:manifest.shots.map(x=>({
   renderId:x.renderId,sha256:x.sha256,frames:x.frames,
   shotKey:x.shotKey,directorLocked:true
  })),qa:Array.from({length:10},(_,i)=>({
   from:manifest.shots[i].shotKey,to:manifest.shots[i+1].shotKey,
   actualJoinPsnrDb:44.642372,matchedOriginalPreviousPsnrDb:100,matchedOriginalNextPsnrDb:100
  }))}};
test('Safety gate recognizes only exact verified immutable 11-shot full MP4 with all real source IDs and 10 joins',()=>{
 assert.equal(validateApprovedMaster(actual,manifest),true);
 for(const [key,value] of [
  ['id','11111111-1111-1111-1111-111111111111'],
  ['actual_bytes',99],
  ['duration_in_frames',38592],
  ['composition_id','EP003-CUMULATIVE-WIP-CORRECTED-TEN-SHOT'],
  ['status','RUNNING']
 ])assert.throws(()=>validateApprovedMaster({...actual,[key]:value},manifest),/FAIL_CLOSED/);
 assert.throws(()=>validateApprovedMaster({...actual,input_props:{...actual.input_props,qa:[]}},manifest),/FAIL_CLOSED/);
 assert.throws(()=>validateApprovedMaster({...actual,input_props:{...actual.input_props,sequence:[...actual.input_props.sequence.slice(0,10),{...actual.input_props.sequence[10],sha256:'0'.repeat(64)}]}},manifest),/FAIL_CLOSED/);
 assert.throws(()=>validateApprovedMaster({...actual,input_props:{...actual.input_props,masterSha256:'0'.repeat(64)}},manifest),/FAIL_CLOSED/);
});
test('Deletion is explicit, scoped to EP003, respects final master and future work, keeps metadata and voice',()=>{
 for(const s of [
  "process.env.EP003_FINISHED_MASTER_PRUNE_CONFIRMED==='true'",
  "if(!DELETE)return;",
  "id<>$2::uuid and created_at <= $3::timestamptz",
  "composition_id like 'EP003-%'",
  "profile<>'REEL'",
  "status in ('QUEUED','RUNNING')",
  "and not exists(select 1 from remotion_render live",
  "set video_data=null,size_bytes=null,updated_at=now()",
  "EP003_FINAL_MASTER_ONLY_STORAGE_AUDIT",
  "EP003_FINAL_MASTER_ONLY_STORAGE_PRUNE_SAVED",
  "EP003_STORAGE_PRUNE_BLOCKED",
  "metadataRetained:true,voiceRetained:true"
 ])assert.ok(script.includes(s),s);
 assert.ok(!script.includes('delete from remotion_render'));
 assert.ok(!script.includes('delete from episode_package_voice_take'));
});
