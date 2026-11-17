import {Client} from 'pg';

const required=[
  ['EP001','904b3075-c5ee-49a3-9d3b-7d4a36f8fbf8',94164846,37703],
  ['EP002','56c2a4b7-8bc0-465b-baea-80fa3707e709',83569046,23446],
  ['EP003','63827ce6-2ea8-4853-a61b-8549fe8db967',152025545,38593]
];
const db=new Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:12000,application_name:'mediaos_pg_cgroup_memory_diagnosis_readonly'});
const mib=x=>Number((Number(x)/1048576).toFixed(2));
function relevantMemoryStat(raw){
 const allow=new Set(['anon','file','kernel','kernel_stack','pagetables','percpu','sock','shmem','file_mapped','file_dirty','file_writeback','inactive_anon','active_anon','inactive_file','active_file','slab','slab_reclaimable','slab_unreclaimable','pgfault','pgmajfault','workingset_refault_file']);
 return Object.fromEntries(String(raw).split(/\n/).map(s=>s.trim().split(/\s+/)).filter(p=>allow.has(p[0])).map(p=>[p[0],p[0].startsWith('pg')||p[0].startsWith('workingset_')?Number(p[1]):mib(p[1])]));
}
async function optionalRead(path){
 try{return (await db.query('select pg_read_file($1) as data',[path])).rows[0].data;}catch(e){return {blocked:String(e.code||e.message).slice(0,150)};}
}
try{
 if(!String(process.env.DATABASE_URL||'').startsWith('postgres'))throw Error('DATABASE_URL_REQUIRED');
 await db.connect();
 console.log('MEDIAOS_PG_CGROUP_MEMORY_AUDIT_CONNECTED');
 const stat=await optionalRead('/sys/fs/cgroup/memory.stat');
 const current=await optionalRead('/sys/fs/cgroup/memory.current');
 const max=await optionalRead('/sys/fs/cgroup/memory.max');
 const processStatus=await optionalRead('/proc/self/status');
 await db.query("BEGIN READ ONLY");
 await db.query("SET LOCAL statement_timeout='20000ms'");
 const settings=(await db.query("select name,setting,unit from pg_settings where name in ('shared_buffers','work_mem','maintenance_work_mem','autovacuum_work_mem','max_connections','effective_cache_size','huge_pages','max_wal_size','min_wal_size','autovacuum','autovacuum_max_workers','temp_buffers') order by name")).rows;
 const activity=(await db.query("select state,count(*)::int as connections from pg_stat_activity where datname=current_database() group by state order by state")).rows;
 const stats=(await db.query("select numbackends,blks_read,blks_hit,temp_bytes,deadlocks from pg_stat_database where datname=current_database()")).rows[0];
 const films=(await db.query("select id::text, status, duration_in_frames, size_bytes, video_data is not null as has_video from remotion_render where id=any($1::uuid[]) order by id",[required.map(x=>x[1])])).rows;
 if(films.length!==3)throw Error('PROTECTED_FILM_METADATA_MISSING');
 for(const [ep,id,size,frames] of required){const v=films.find(x=>x.id===id);if(v?.status!=='SUCCEEDED'||!v.has_video||v.duration_in_frames!==frames)throw Error('PROTECTED_FILM_CHANGED_'+ep);}
 await db.query('COMMIT');
 const ps=typeof processStatus==='string'?Object.fromEntries(processStatus.split('\n').filter(s=>/^(VmRSS|VmSize|RssAnon|RssFile|VmSwap):/.test(s)).map(s=>s.trim().split(':').map(v=>v.trim()))):processStatus;
 console.log('MEDIAOS_PG_CGROUP_MEMORY_AUDIT_SUCCESS '+JSON.stringify({
 mode:'READ_ONLY',memoryCurrentMiB:typeof current==='string'?mib(current.trim()):current,
 memoryMaxMiB:typeof max==='string'?max.trim()==='max'?'unlimited':mib(max.trim()):max,
 cgroupMemoryStat:typeof stat==='string'?relevantMemoryStat(stat):stat,
 postgresBackendMemory:ps,settings,connectionStates:activity,databaseCounters:stats,
 protectedMastersVerified:3,readOnly:true,noResetsNoDeletesNoCostlyRenders:true
 }));
}catch(e){console.error('MEDIAOS_PG_CGROUP_MEMORY_AUDIT_BLOCKED '+String(e.stack||e));await db.query('ROLLBACK').catch(()=>{});process.exitCode=1}
finally{await db.end().catch(()=>{})}
