import {useEffect,useState} from 'react';
import {Film,RotateCcw,ShieldCheck} from 'lucide-react';

type Render={status:string;renderId?:string;progress?:number;videoUrl?:string|null;error?:string|null};
type Snapshot={shot10:Render;master:Render;expectedFrames:number;breathFramesPerBoundary:number;
  boundaryCount:number;workerPinned:boolean;historicalMasterId:string;directorFinalLock:boolean};

const URL='/api/v1/creative/episodes/EP002/master/v2/preflight';

export function Ep002V2DirectorMasterPanel(){
  const [state,setState]=useState<Snapshot|null>(null);
  const [error,setError]=useState('');
  const [revision,setRevision]=useState(0);
  useEffect(()=>{
    let alive=true;
    async function poll(){
      try{
        const response=await fetch(URL,{cache:'no-store'});
        if(!response.ok)throw Error('V2 production status HTTP '+response.status);
        const data=await response.json() as Snapshot;
        if(alive){setState(data);setError('');}
      }catch(e){if(alive)setError(String(e));}
    }
    void poll();
    const interval=window.setInterval(()=>void poll(),4000);
    return ()=>{alive=false;window.clearInterval(interval);};
  },[revision]);
  const shot=state?.shot10;
  const master=state?.master;
  const ready=master?.status==='READY'&&Boolean(master.videoUrl);
  const videoUrl=ready?master!.videoUrl!:null;
  return <section className="library-episode-batch"
    aria-label="EP002 director V2 pacing and clean SHOT10 master">
    <div className="library-episode-batch-heading">
      <div>
        <h2><Film size={20}/> EP002 V2 — Narration Breathing Room</h2>
        <p>11 real SHOTs, clean SHOT10 recovery map, ten 2-second spoken rests
          with moving visuals. Same Director-approved voice. New separate MP4;
          original 13:01 master and original individual SHOTs remain untouched.</p>
      </div>
      <span className="library-episode-batch-state" aria-live="polite">
        {ready?'V2 VIDEO READY FOR DIRECTOR REVIEW':
          ['QUEUED','RENDERING'].includes(master?.status??'')
            ?'V2 MASTER '+master!.status+' · '+(master!.progress??0)+'%':
          shot?.status==='READY'?'CLEAN SHOT10 READY · ASSEMBLY QUEUE':
          ['QUEUED','RENDERING'].includes(shot?.status??'')
            ?'CLEAN SHOT10 '+shot!.status+' · '+(shot!.progress??0)+'%':
          'V2 PREPARATION'}
      </span>
    </div>
    {error&&<p className="library-voice-error" role="alert">{error}</p>}
    <p className="library-note">
      <ShieldCheck size={15} aria-hidden="true"/>{' '}
      Pacing: exactly 60 silent voice frames at each of 10 SHOT boundaries.
      Target: 1920×1080 / 30 fps, 24,046 frames (13:21.53).
      These V2 files do not inherit the original Director final LOCK.
    </p>
    <div className="library-episode-batch-actions">
      <button type="button" className="library-voice-refresh"
        onClick={()=>setRevision(n=>n+1)}>
        <RotateCcw size={15}/> Refresh V2 render status
      </button>
    </div>
    {shot?.renderId&&<p className="library-note">
      Revised SHOT10: {shot.renderId} · {shot.status}
      {shot.error?' · '+shot.error:''}
    </p>}
    {master?.renderId&&<p className="library-note" aria-live="polite">
      V2 complete master: {master.renderId} · {master.status}
      {master.error?' · '+master.error:''}
    </p>}
    {videoUrl&&<div className="locked-cut-screen" style={{marginTop:16}}>
      <video src={videoUrl} controls playsInline preload="metadata"
        aria-label="Complete EP002 V2 cinematic breathing room Director review MP4"/>
      <p className="library-note">
        This is a single stored V2 MP4. Listen for a real two-second voice break
        at every transition and inspect the simplified SHOT10 architecture.
        Director final creative approval is still pending.
      </p>
      <a href={videoUrl} target="_blank" rel="noopener noreferrer">
        Open complete EP002 V2 master MP4
      </a>
      {' · '}
      <a href={videoUrl} download="EP002_Director_V2_Breathing_Room_1080p.mp4">
        Download EP002 V2 MP4
      </a>
    </div>}
  </section>;
}
