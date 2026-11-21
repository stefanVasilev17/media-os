import {Client} from 'pg';
const PROJECT='11111111-1111-1111-1111-111111111111';
const masters=[['904b3075-c5ee-49a3-9d3b-7d4a36f8fbf8',94164846],['56c2a4b7-8bc0-465b-baea-80fa3707e709',83569046],['63827ce6-2ea8-4853-a61b-8549fe8db967',152025545]];
const mb=n=>Math.round(Number(n)/1048576*100)/100;
const check=(v,m)=>{if(!v)throw Error('MEDIAOS_LEGACY_SPLINE_BLOBS_PRUNE_BLOCKED_'+m)};
const db=new Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:13000,
 application_name:'remove_legacy_spline_mp4_and_snapshots_three_master_only'});
async function verify(){
 const rows=(await db.query(`select id::text,octet_length(video_data)::bigint as bytes from remotion_render
 where project_id=$1::uuid and id=any($2::uuid[]) and status='SUCCEEDED'`,
 [PROJECT,masters.map(x=>x[0])])).rows;
 check(rows.length===3&&masters.every(x=>Number(rows.find(y=>y.id===x[0])?.bytes)===x[1]),'FINAL_MASTER_CONTENT_CHANGED');
}
try{
 check(process.env.MEDIAOS_FINAL_FILMS_SPLINE_DELETE_EXPLICIT==='true','CONFIRMATION_GATE');
 await db.connect();await verify();
 const before=(await db.query(`select pg_database_size(current_database())::bigint as bytes,
 (select coalesce(sum(size),0)::bigint from pg_ls_waldir()) as walbytes`)).rows[0];
 check(mb(before.bytes)<3500&&mb(before.walbytes)<512,'DISK_USAGE_UNSAFE');
 const pre=(await db.query(`select
  (select count(*)::int from spline_shot_render where project_id=$1::uuid and video_data is not null) as spline_videos,
  (select coalesce(sum(pg_column_size(video_data)),0)::bigint from spline_shot_render where project_id=$1::uuid) as video_bytes,
  (select count(*)::int from spline_snapshot where project_id=$1::uuid and octet_length(image_data)>0) as snapshot_images,
  (select coalesce(sum(pg_column_size(image_data)),0)::bigint from spline_snapshot where project_id=$1::uuid) as snapshot_bytes`,[PROJECT])).rows[0];
 check(mb(pre.video_bytes)<25&&mb(pre.snapshot_bytes)<10,'UNEXPECTED_LEGACY_BLOB_SIZE');
 console.log('MEDIAOS_FINAL_FILMS_SPLINE_LEGACY_BLOBS_PLAN '+JSON.stringify({renders:pre.spline_videos,
  videoMiB:mb(pre.video_bytes),snapshots:pre.snapshot_images,snapshotMiB:mb(pre.snapshot_bytes)}));
 const a=await db.query(`update spline_shot_render set video_data=null,size_bytes=null,updated_at=now()
  where project_id=$1::uuid and video_data is not null`,[PROJECT]);
 const b=await db.query(`update spline_snapshot set image_data=decode('','hex')
  where project_id=$1::uuid and octet_length(image_data)>0`,[PROJECT]);
 check(a.rowCount===pre.spline_videos&&b.rowCount===pre.snapshot_images,'TARGET_CHANGED');
 await verify();
 const r=(await db.query(`select
  (select count(*)::int from spline_shot_render where project_id=$1::uuid and video_data is not null) as remaining_video,
  (select count(*)::int from spline_snapshot where project_id=$1::uuid and octet_length(image_data)>0) as remaining_snapshots`,[PROJECT])).rows[0];
 check(r.remaining_video===0&&r.remaining_snapshots===0,'OLD_BLOBS_REMAIN');
 console.log('MEDIAOS_FINAL_FILMS_SPLINE_LEGACY_BLOBS_REMOVED '+JSON.stringify({deletedVideoPayloads:a.rowCount,
  deletedSnapshotImages:b.rowCount,sourceMiB:mb(Number(pre.video_bytes)+Number(pre.snapshot_bytes)),
  remainingVideo:0,remainingSnapshots:0,protectedFullMp4s:3,metadataPreserved:true}));
}catch(e){console.error('MEDIAOS_FINAL_FILMS_SPLINE_LEGACY_BLOBS_BLOCKED '+String(e.stack||e));process.exitCode=1;}
finally{await db.end().catch(()=>{})}
