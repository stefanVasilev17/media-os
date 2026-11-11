import {useCallback,useEffect,useState} from 'react';
import {Clapperboard,Film,RotateCcw,ShieldCheck} from 'lucide-react';

type Source={
  shotKey:string;renderId:string;ready:boolean;
  frames:number|null;sizeBytes:number|null;
};
type MasterRender={
  status:string;renderId?:string;progress?:number;
  videoUrl?:string|null;error?:string|null;durationInFrames?:number;
};
type Preflight={
  status:string;sourceDigest:string;totalFrames:number;totalSeconds:number;
  shots:Source[];blockers:string[];canRender:boolean;
  renderEnabled:boolean;workerReleasePinned:boolean;
  master:MasterRender;finalDirectorLock:boolean;
};

const ENDPOINT='/api/v1/creative/episodes/EP002/master';

export function Ep002FullMasterPanel(){
  const [status,setStatus]=useState<Preflight|null>(null);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [revision,setRevision]=useState(0);
  const refresh=useCallback(async()=>{
    const response=await fetch(ENDPOINT+'/preflight',{cache:'no-store'});
    if(!response.ok)throw Error('EP002 full master preflight HTTP '+response.status);
    const data=await response.json() as Preflight;
    setStatus(data);
    return data;
  },[]);

  useEffect(()=>{
    let alive=true;
    setLoading(true);setError('');
    void refresh().catch(e=>{if(alive)setError(String(e));})
      .finally(()=>{if(alive)setLoading(false);});
    return()=>{alive=false;};
  },[refresh,revision]);

  const active=['QUEUED','RUNNING','RENDERING'].includes(status?.master?.status??'');
  useEffect(()=>{
    if(!active)return;
    let alive=true,working=false;
    const poll=async()=>{
      if(working)return;
      working=true;
      try{await refresh();if(alive)setError('');}
      catch(e){if(alive)setError(String(e));}
      finally{working=false;}
    };
    const timer=window.setInterval(()=>void poll(),2500);
    return()=>{alive=false;window.clearInterval(timer);};
  },[active,refresh]);

  async function startFullMaster(){
    if(busy||active||!status?.canRender||status.master.status==='READY')return;
    if(!window.confirm(
      'Create ONE full EP002 1920x1080 video from the EXACT eleven Director-approved MP4 files? '+
      'This runs billable Railway CPU and uses storage. It may incur charges. '+
      'It does NOT regenerate ElevenLabs audio, create new SHOT visualizations, replace locked source '+
      'videos, approve the final master, or publish to YouTube.'))return;
    setBusy(true);setError('');
    try{
      const response=await fetch(ENDPOINT+'/render',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          requestId:window.crypto.randomUUID(),
          expectedSourceDigest:status.sourceDigest,
          confirmPaidCpuRender:true,
        }),
      });
      if(!response.ok)throw Error('EP002 master queue HTTP '+response.status+
        ': '+(await response.text()).slice(0,240));
      await refresh();
    }catch(e){setError(String(e));}
    finally{setBusy(false);}
  }

  const available=status?.shots.filter(s=>s.ready).length??0;
  const master=status?.master;
  const readyVideo=master?.status==='READY'&&Boolean(master.videoUrl);
  const canStart=Boolean(status?.canRender&&!active&&!readyVideo&&!busy);
  const statusText=readyVideo?'MASTER MP4 READY FOR DIRECTOR REVIEW':
    active?'RENDERING MASTER · '+(master?.progress??0)+'%':
    loading?'VERIFYING PINNED MP4 FILES':
    status?.status==='ALL_11_MP4S_VERIFIED'?'ELEVEN STORED MP4S VERIFIED':
    'SOURCE OR RELEASE NOT READY';

  return <section className="library-episode-batch"
      aria-label="EP002 exact eleven SHOT full master review">
    <div className="library-episode-batch-heading">
      <div>
        <h2><Film size={20}/> EP002 — Full Episode Master · SHOT01–11</h2>
        <p>One continuous Full HD review video assembled from the eleven
          Director-approved MP4 recordings, starting with the new SHOT01 V2.
          No new voice, AI visual work or SHOT rendering is needed.
          The original source MP4 files stay unchanged.</p>
      </div>
      <span className="library-episode-batch-state" aria-live="polite">
        {statusText}
      </span>
    </div>
    {error&&<p role="alert" className="library-voice-error">{error}</p>}
    <p className="library-note">
      <ShieldCheck size={15} aria-hidden="true"/>{' '}
      Stored exact source MP4s: {available}/11.
      {' '}Measured duration: {status?.totalFrames
        ?(status.totalFrames/30/60).toFixed(2)+' minutes':'NOT VERIFIED'}.
      {' '}Full HD 1920×1080 / 30 fps. The actual video/audio codec and
      all boundary timings must still pass the CPU Worker FFprobe check.
      {' '}Pinned release: {status?.workerReleasePinned?'YES':'NOT CONFIGURED'}.
      {' '}Director final master LOCK: NOT YET GRANTED.
    </p>
    {status?.blockers?.length?<p role="alert" className="library-warning">
      Missing required exact inputs: {status.blockers.join('; ')}
    </p>:null}
    <div className="library-episode-batch-actions">
      <button type="button" className="library-voice-refresh"
        onClick={()=>setRevision(x=>x+1)} disabled={busy}>
        <RotateCcw size={15}/> Refresh all 11 SHOTs
      </button>
      <button type="button" className="library-voice-button"
        disabled={!canStart} onClick={()=>void startFullMaster()}>
        <Clapperboard size={15}/> Render full EP002 · 11 SHOTs · 1080p
      </button>
    </div>
    {master?.renderId&&<p className="library-note" aria-live="polite">
      Exact master Render ID: {master.renderId}.
      {' '}Status: {master.status}.
      {master.error?' Worker error: '+master.error:''}
    </p>}
    {active&&<div style={{marginTop:12}}>
      <div role="progressbar" aria-label="EP002 master CPU render progress"
        aria-valuemin={0} aria-valuemax={100}
        aria-valuenow={Math.max(0,Math.min(100,master?.progress??0))}
        style={{height:12,borderRadius:6,background:'rgba(54,88,111,.45)',overflow:'hidden'}}>
        <div style={{width:Math.max(0,Math.min(100,master?.progress??0))+'%',
          height:'100%',background:'#31C9E9',transition:'width .3s ease-out'}}/>
      </div>
    </div>}
    {readyVideo&&<div className="locked-cut-screen" style={{marginTop:16}}>
      <video src={master!.videoUrl!} controls playsInline preload="metadata"
        aria-label="Complete EP002 Full HD Master 11 SHOT review MP4"/>
      <p className="library-note">
        One actual stored MP4, not the multi-player Play all simulation.
        Review all 10 visual/audio cut boundaries and the final SHOT11 ending
        before granting a separate final Director LOCK.
      </p>
      <a href={master!.videoUrl!} target="_blank" rel="noopener noreferrer">
        Open the entire EP002 review MP4
      </a>
    </div>}
    <p className="library-note">Read-only checks and Refresh are free of paid
      video actions. Rendering requires a separate affirmative Director click
      and CPU charge confirmation. Preview completion does not authorize
      automatic publication or change any original Director-approved SHOT.</p>
  </section>;
}
