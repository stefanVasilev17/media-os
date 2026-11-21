import {Client} from 'pg';
const db=new Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:13000,application_name:'mediaos_pg_wal_retention_diagnostics_only'});
try{
await db.connect();await db.query('BEGIN READ ONLY');
const cfg=(await db.query(`select name,setting,unit,source,pending_restart from pg_settings where name in
('max_wal_size','min_wal_size','wal_keep_size','archive_mode','archive_command',
'archive_timeout','wal_level','max_replication_slots','max_wal_senders','checkpoint_timeout',
'wal_compression','hot_standby','max_slot_wal_keep_size','full_page_writes') order by name`)).rows;
console.log('MEDIAOS_WAL_CONFIG '+JSON.stringify(cfg));
try{console.log('MEDIAOS_WAL_CHECKPOINT '+JSON.stringify((await db.query("select * from pg_control_checkpoint()")).rows));}catch(e){console.log('CHECKPOINT_NOT_AVAILABLE '+e.message)}
try{console.log('MEDIAOS_ARCHIVER '+JSON.stringify((await db.query("select * from pg_stat_archiver")).rows));}catch(e){console.log('ARCHIVER_NOT_AVAILABLE '+e.message)}
try{const dir=(await db.query("select name,size,modification from pg_ls_waldir() order by name")).rows;console.log('MEDIAOS_WAL_FILE_DETAILS '+JSON.stringify({count:dir.length,first:dir.slice(0,4),last:dir.slice(-4)}));}catch(e){console.log('WAL_FILE_DETAILS_NOT_AVAILABLE '+e.message)}
try{console.log('MEDIAOS_WAL_STATS '+JSON.stringify((await db.query("select * from pg_stat_wal")).rows));}catch(e){console.log('WAL_STATS_NOT_AVAILABLE '+e.message)}
await db.query('COMMIT');
}catch(e){console.log('MEDIAOS_WAL_DIAGNOSTIC_FAILED '+String(e.stack||e).slice(0,2500));await db.query('ROLLBACK').catch(()=>{});}finally{await db.end().catch(()=>{})}
