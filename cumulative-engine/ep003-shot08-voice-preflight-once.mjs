import {Client} from 'pg';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const DB=String(process.env.DATABASE_URL||'');
const SHA=String(process.env.RAILWAY_GIT_COMMIT_SHA||'');
const scriptHash=s=>createHash('sha256').update(s).digest('hex');
const check=(x,s)=>{if(!x)throw Error(s);};
async function main(){
 check(DB.startsWith('postgres'),'POSTGRES_NOT_CONFIGURED');
 check(/^[0-9a-f]{40}$/.test(SHA),'SOURCE_COMMIT_NOT_PINNED');
 const json=JSON.parse(await fs.readFile('/app/backend/src/main/resources/ep003-director-locked-voice-package-v1.json','utf8'));
 const shot=json.shots.find(s=>s.shotKey==='SHOT08');
 check(shot?.narration?.length>300,'SHOT08_DIRECTOR_ORIGINAL_SCRIPT_MISSING');
 const db=new Client({connectionString:DB,connectionTimeoutMillis:12000,
   application_name:'ep003_shot08_voice_readiness_no_spend'});
 await db.connect();
 try{
  const q=await db.query(`
   select p.id as package_id,p.source_sha256,s.id as shot_id,s.original_narration,
          r.revision,r.narration,c.take_id,t.audio,t.content_type,t.duration_seconds,
          t.model_id,t.voice_id,t.generated_alignment::text as timing,
          t.generated_alignment->>'mediaos_delivery_mode' as delivery_mode,
          t.generated_alignment->>'mediaos_spoken_script_sha256' as spoken_sha
   from episode_package_import p
   join episode_package_shot s on s.package_id=p.id and s.shot_key='SHOT08'
   join episode_package_shot_revision r on r.shot_id=s.id and r.revision=1
   left join lateral (
     select c.take_id from episode_package_voice_choice c
     where c.shot_id=s.id and c.revision=1
     order by c.selected_at desc,c.id desc limit 1
   ) c on true
   left join episode_package_voice_take t on t.id=c.take_id and t.shot_id=s.id and t.revision=1
   where p.episode_key='EP003'
  `);
  check(q.rows.length===1,'EP003_SHOT08_SOURCE_RECORD_NOT_FOUND_OR_MULTIPLE');
  const row=q.rows[0];
  check(row.original_narration===shot.narration&&row.narration===shot.narration,
   'EP003_SHOT08_SCRIPT_CHANGED_FROM_DIRECTOR_ORIGINAL');
  if(!row.take_id){
   console.log('EP003_SHOT08_VOICE_PREFLIGHT '+JSON.stringify({
     status:'BLOCKED_SELECTED_VOICE_TAKE_MISSING',sourceScriptSha:scriptHash(shot.narration),
     originalScriptLocked:true,paidCallsMade:false,renderAllowed:false}));
   return;
  }
  const timing=typeof row.timing==='string'?JSON.parse(row.timing):row.timing;
  const matches=[timing?.normalized_alignment,timing?.alignment,timing?.generated_alignment?.normalized_alignment,timing?.generated_alignment?.alignment,timing];
  const chars=matches.find(x=>Array.isArray(x?.characters)&&x.characters.length>=120
    &&Array.isArray(x.character_start_times_seconds)
    &&x.characters.length===x.character_start_times_seconds.length);
  const ready=row.delivery_mode==='ELEVEN_V4_AUTO_SLOW_NATURAL_PAUSES_V1'&&
    row.spoken_sha===scriptHash(shot.narration)&&
    row.audio?.length>15000&&Number(row.duration_seconds)>20&&
    Number(row.duration_seconds)<400&&Boolean(chars);
  console.log('EP003_SHOT08_VOICE_PREFLIGHT '+JSON.stringify({
    status:ready?'READY_EXISTING_SELECTED_SLOW_NATURAL':'BLOCKED_SELECTED_TAKE_NOT_READY',
    takeId:row.take_id,durationSeconds:Number(row.duration_seconds),
    selectedOriginalTake:row.delivery_mode,
    spokenShaMatches:row.spoken_sha===scriptHash(shot.narration),
    originalScriptLocked:true,bytes:row.audio?.length??0,
    alignmentCharacters:chars?.characters?.length??0,
    renderAllowed:ready,paidCallsMade:false
  }));
 }finally{await db.end();}
}
main().catch(e=>{console.error('EP003_SHOT08_PREFLIGHT_ERROR '+String(e.stack||e));process.exitCode=1;});
