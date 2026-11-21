import {Client} from 'pg';
const db=new Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:15000,application_name:'mediaos_pre_cleanup_wal_recycle_guarded'});
const mib=n=>Math.round(Number(n)/1048576*100)/100;
const check=(v,m)=>{if(!v)throw Error('MEDIAOS_WAL_GUARD_'+m)};
const wal=async()=>{
const row=(await db.query(`select count(*)::integer as files,coalesce(sum(size),0)::bigint as bytes from pg_ls_waldir()`)).rows[0];
return {files:row.files,MiB:mib(row.bytes)};
};
try{
await db.connect();
const pre=(await db.query(`select current_user,(select rolsuper from pg_roles where rolname=current_user) as superuser,
pg_is_in_recovery() as replica,current_setting('max_wal_size') as max_wal,
current_setting('min_wal_size') as min_wal,
pg_database_size(current_database())::bigint as database_bytes,
(select count(*)::integer from pg_replication_slots) as replication_slot_count`)).rows[0];
const before=await wal();
console.log('MEDIAOS_WAL_CHECKPOINT_PREFLIGHT '+JSON.stringify({before,dbMiB:mib(pre.database_bytes),...pre}));
check(pre.superuser===true&&!pre.replica&&pre.replication_slot_count===0,'PRIMARY_SUPERUSER_NO_SLOTS_REQUIRED');
check(before.MiB>=650&&before.MiB<=2500,'UNEXPECTED_WAL_FOOTPRINT');
check(['1GB','256MB'].includes(pre.max_wal)&&pre.min_wal==='80MB','UNKNOWN_EXISTING_WAL_TUNING');
check(process.env.MEDIAOS_RECLAIM_WAL_CONFIRMED==='true','EXPLICIT_GUARD_DISABLED');
if(pre.max_wal!=='256MB')await db.query("ALTER SYSTEM SET max_wal_size='256MB'");
const reload=(await db.query('select pg_reload_conf() as success')).rows[0];
check(reload.success===true,'RELOAD_FAILED');
let current=null;
for(let attempt=0;attempt<20;attempt++){
 current=(await db.query("select current_setting('max_wal_size') as max_wal")).rows[0];
 if(current.max_wal==='256MB')break;
 await new Promise(resolve=>setTimeout(resolve,500));
}
check(current?.max_wal==='256MB','NEW_WAL_LIMIT_NOT_APPLIED');
console.log('MEDIAOS_WAL_CHECKPOINT_START '+JSON.stringify({before,target:'256MB',time:new Date().toISOString()}));
await db.query('CHECKPOINT');
const after=await wal();
const post=(await db.query("select current_setting('max_wal_size') as max_wal, pg_database_size(current_database())::bigint as db_bytes")).rows[0];
console.log('MEDIAOS_WAL_CHECKPOINT_COMPLETED '+JSON.stringify({before,after,
 reclaimedWalMiB:Math.max(0,Math.round((before.MiB-after.MiB)*100)/100),
 dbMiBBefore:mib(pre.database_bytes),dbMiBAfter:mib(post.db_bytes),
 activeWalSetting:post.max_wal,replicationSlots:pre.replication_slot_count,
 noVideoOrVoiceDataTouched:true}));
}catch(e){console.error('MEDIAOS_WAL_CHECKPOINT_BLOCKED '+String(e.stack||e));process.exitCode=1;}
finally{await db.end().catch(()=>{});}
