import {Client} from 'pg';
import {writeFile,unlink} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
const PROJECT='11111111-1111-1111-1111-111111111111';
const masters=[
 {episode:'EP001',id:'904b3075-c5ee-49a3-9d3b-7d4a36f8fbf8',composition:'EP001-Voice-CurrentPreview',expectedFrames:37703},
 {episode:'EP002',id:'56c2a4b7-8bc0-465b-baea-80fa3707e709',composition:'EP002-DIRECTOR-MASTER',expectedFrames:23446},
 {episode:'EP003',id:'63827ce6-2ea8-4853-a61b-8549fe8db967',composition:'EP003-CUMULATIVE-DIRECTOR-MASTER',expectedFrames:38593},
];
const check=(v,m)=>{if(!v)throw Error('THREE_FINAL_MASTERS_AUDIO_QA_FAILED_'+m)};
const run=(cmd,args)=>new Promise((res,rej)=>{
 const c=spawn(cmd,args,{stdio:['ignore','pipe','pipe']});let out='',err='';
 c.stdout.on('data',x=>out+=String(x));c.stderr.on('data',x=>err+=String(x));
 c.on('error',rej);c.on('close',code=>code===0?res(out):rej(Error(cmd+' status '+code+' '+err.slice(-1000))));
});
const db=new Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:17000,application_name:'three_final_mp4s_actual_audio_ffprobe_read_only'});
try{
 await db.connect();
 for(const m of masters){
  const r=(await db.query(`select id::text,composition_id,render_key,status,width,height,fps,duration_in_frames,
 coalesce(size_bytes,0)::bigint as expected_bytes,video_data
 from remotion_render where id=$1::uuid and project_id=$2::uuid`,[m.id,PROJECT])).rows[0];
  check(r?.status==='SUCCEEDED'&&r.composition_id===m.composition&&r.width===1920&&r.height===1080&&r.fps===30&&r.duration_in_frames===m.expectedFrames,m.episode+'_MASTER_METADATA');
  check(Buffer.isBuffer(r.video_data)&&r.video_data.length>10_000_000,m.episode+'_FULL_BYTES_MISSING');
  const sha=createHash('sha256').update(r.video_data).digest('hex');
  const path='/tmp/mediaos-'+m.episode+'-master-av-check.mp4';
  await writeFile(path,r.video_data);
  const raw=await run('ffprobe',['-v','error','-show_entries',
   'stream=index,codec_type,codec_name,sample_rate,channels,r_frame_rate,nb_frames,duration:format=duration,size,format_name',
   '-of','json',path]);
  const parsed=JSON.parse(raw);
  const video=(parsed.streams||[]).find(x=>x.codec_type==='video');
  const audio=(parsed.streams||[]).find(x=>x.codec_type==='audio');
  const seconds=m.expectedFrames/30;
  check(video?.codec_name==='h264'&&video.r_frame_rate==='30/1',m.episode+'_NOT_H264_30FPS');
  check(audio?.codec_name==='aac'&&Number(audio.channels)>=1,m.episode+'_AUDIO_AAC_NOT_PRESENT');
  check(Math.abs(Number(parsed.format.duration)-seconds)<2.5,m.episode+'_DURATION_DIFF');
  console.log('THREE_FINAL_MASTERS_ACTUAL_MP4_AUDIO_QA_PASS '+JSON.stringify({
   episode:m.episode,id:m.id,actualSha256:sha,bytes:r.video_data.length,
   frames:m.expectedFrames,expectedSeconds:seconds,
   verifiedStreamVideo:video,verifiedStreamAudio:audio,ffprobeFormat:parsed.format,
   finalMasterAudioIsEmbedded:true,otherMediaNotTouched:true
  }));
  await unlink(path);
 }
}catch(e){console.error('THREE_FINAL_MASTERS_AUDIO_QA_BLOCKED '+String(e.stack||e));process.exitCode=1;}
finally{await db.end().catch(()=>{})}
