import {Client} from 'pg';
import fs from 'node:fs/promises';

const PROJECT='11111111-1111-1111-1111-111111111111';
const EP001_LOCKED=[
 'fd1046d0-6b20-4267-8135-8b67add2ca33',
 '7e55c59a-3102-4d4c-b23e-96c68ad1f286',
 '3a09dbd5-7ef8-4c0e-9621-12ca8a4b99a0',
 '5d8c7db2-b34e-4781-af1a-2aa236691ea5'
];
const EP002_MASTER='8876235a-8037-4f19-8f5c-d2398f3ef22f';
const DOC='/app/remotion-engine/ep002-approved-master-manifest.json';
const bytesMb=n=>Math.round(Number(n)/1048576*100)/100;
const check=(v,label)=>{if(!v)throw Error('EP001_EP002_AUDIT_FAIL_CLOSED_'+label)};
async function main(){
 check(String(process.env.DATABASE_URL||'').startsWith('postgres'),'DATABASE_URL_MISSING');
 const manifest=JSON.parse(await fs.readFile(DOC,'utf8'));
 check(manifest.episodeId==='EP002'&&manifest.shots?.length===11,'EP002_MANIFEST_INVALID');
 const protectedIds=[...EP001_LOCKED,EP002_MASTER,...manifest.shots.map(s=>s.renderId)];
 check(new Set(protectedIds).size===protectedIds.length,'DUPLICATE_PROTECTED_ID');
 const db=new Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:12000,
  application_name:'ep001_ep002_render_retention_audit_read_only'});
 await db.connect();
 try{
  await db.query('BEGIN READ ONLY');
  const sql=`select r.id::text as id,r.composition_id,r.render_key,r.status,r.profile,
  r.created_at,r.updated_at,r.finished_at,r.episode_id::text as episode_id,
  r.duration_in_frames,r.width,r.height,r.fps,r.progress,
  r.object_url,coalesce(r.size_bytes,octet_length(r.video_data),0)::bigint as bytes,
  r.video_data is not null as has_mp4,
  exists(select 1 from visual_shot_lock l where l.render_id=r.id) as has_visual_lock,
  exists(select 1 from voice_shot_workflow v where v.remotion_render_id=r.id) as voice_workflow_reference,
  exists(select 1 from episode_shot05_voice_revision_archive a where a.remotion_render_id=r.id) as voice_archive_reference
  from remotion_render r where r.project_id=$1::uuid
  and (r.composition_id ilike 'EP001-%' or r.composition_id ilike 'EP002-%')
  order by r.composition_id,r.created_at,r.id`;
  const rows=(await db.query(sql,[PROJECT])).rows;
  const groups=['EP001','EP002'].map(episode=>{
   const all=rows.filter(r=>r.composition_id?.toUpperCase().startsWith(episode+'-'));
   const stored=all.filter(r=>r.has_mp4);
   const classification=stored.map(r=>{
    const reasons=[];
    if(protectedIds.includes(r.id))reasons.push('PINNED_SOURCE_OR_STORED_MASTER');
    if(r.has_visual_lock)reasons.push('VISUAL_SHOT_LOCK');
    if(r.voice_workflow_reference)reasons.push('VOICE_WORKFLOW_REFERENCE');
    if(r.voice_archive_reference)reasons.push('VOICE_REVISION_ARCHIVE');
    if(r.object_url)reasons.push('EXTERNAL_OBJECT_STORAGE');
    if(r.status!=='SUCCEEDED')reasons.push('NOT_SUCCEEDED');
    const candidateForManualReview=reasons.length===0;
    return {...r,bytes:Number(r.bytes),protectedReasons:reasons,candidateForManualReview};
   });
   const candidates=classification.filter(x=>x.candidateForManualReview);
   return {
    episode,totalRows:all.length,storedMp4Count:stored.length,
    storedMp4MiB:bytesMb(stored.reduce((t,r)=>t+Number(r.bytes),0)),
    pinnedSourceCount:classification.filter(x=>protectedIds.includes(x.id)).length,
    visuallyLockedSourceCount:classification.filter(x=>x.has_visual_lock).length,
    possibleReviewCandidates:candidates.length,
    possibleReviewCandidateMiB:bytesMb(candidates.reduce((t,r)=>t+Number(r.bytes),0)),
    statusBreakdown:Object.entries(all.reduce((acc,r)=>{acc[r.status]=(acc[r.status]||0)+1;return acc;},{})),
    compositionBreakdown:Object.values(stored.reduce((acc,r)=>{const key=r.composition_id;
      const k=acc[key]??(acc[key]={composition:key,count:0,bytes:0});
      k.count++;k.bytes+=Number(r.bytes);return acc;},{}))
      .sort((a,b)=>b.bytes-a.bytes).map(x=>({...x,MiB:bytesMb(x.bytes),bytes:undefined})),
    largestProtected:classification.filter(x=>x.protectedReasons.length>0).sort((a,b)=>b.bytes-a.bytes).slice(0,22)
      .map(x=>({id:x.id,composition:x.composition_id,status:x.status,MiB:bytesMb(x.bytes),reasons:x.protectedReasons})),
    largestUnprotected:classification.filter(x=>x.protectedReasons.length===0).sort((a,b)=>b.bytes-a.bytes).slice(0,32)
      .map(x=>({id:x.id,composition:x.composition_id,status:x.status,MiB:bytesMb(x.bytes),createdAt:x.created_at})),
   };
  });
  const dbStats=(await db.query(`select pg_database_size(current_database())::bigint as bytes,
    pg_total_relation_size('remotion_render')::bigint as remotion_bytes`)).rows[0];
  const report={mode:'READ_ONLY_PRODUCTION_INVENTORY',sourceCommit:process.env.RAILWAY_GIT_COMMIT_SHA,
   projectId:PROJECT,canonicallyProtectedIds:protectedIds.length,
   ep00112ShotAggregateNotDirectorLocked:true,
   ep002FullFilmRequiresFinalDirectorLock:true,
   groups,databaseLogicalAllocatedMiB:bytesMb(dbStats.bytes),
   renderRelationAllocatedMiB:bytesMb(dbStats.remotion_bytes),
   noDeletesPerformed:true,originalVoiceUnchanged:true};
  console.log('EP001_EP002_STORAGE_AUDIT '+JSON.stringify(report));
  await db.query('COMMIT');
 }catch(e){await db.query('ROLLBACK').catch(()=>{});throw e}finally{await db.end()}
}
main().catch(e=>{console.error('EP001_EP002_STORAGE_AUDIT_BLOCKED '+String(e.stack||e));process.exitCode=1});
