import {useEffect,useRef,useState} from 'react';
import {Film,RotateCcw,ShieldCheck} from 'lucide-react';

type RenderState={
  status:string;renderId?:string;progress?:number;
  videoUrl?:string|null;error?:string|null;
};
type Seam={
  index:number;from:string;to:string;
  startSeconds:number;endSeconds:number;profile:string;
};
type Status={
  master:RenderState;seams:Seam[];expectedFrames:number;
  sourceCount:number;seamCount:number;
  silentFramesPerSeam:number;retimedSourceFrames:number;
  workerPinned:boolean;directorFinalLock:boolean;
  previousV2MasterId:string;
};
const URL='/api/v1/creative/episodes/EP002/master/v3/preflight';
function timestamp(seconds:number){
  const s=Math.max(0,Math.floor(seconds));
  return String(Math.floor(s/60)).padStart(2,'0')+':'+
    String(s%60).padStart(2,'0');
}
export function Ep002V3ContinuityDirectorPanel(){
  const [status,setStatus]=useState<Status|null>(null);
  const [error,setError]=useState('');
  const [refresh,setRefresh]=useState(0);
  const video=useRef<HTMLVideoElement|null>(null);
  useEffect(()=>{
    let active=true;
    async function check(){
      try{
        const response=await fetch(URL,{cache:'no-store'});
        if(!response.ok)throw Error('EP002 continuity review HTTP '+response.status);
        const data=await response.json() as Status;
        if(active){setStatus(data);setError('');}
      }catch(e){if(active)setError(String(e));}
    }
    void check();
    const interval=window.setInterval(()=>void check(),5000);
    return ()=>{active=false;window.clearInterval(interval);};
  },[refresh]);
  const render=status?.master;
  const ready=render?.status==='READY'&&Boolean(render?.videoUrl);
  const videoUrl=ready?render!.videoUrl!:null;
  const working=['QUEUED','RENDERING'].includes(render?.status??'');
  function previewSeam(seam:Seam){
    if(!video.current||!ready)return;
    video.current.currentTime=Math.max(0,seam.startSeconds-.8);
    void video.current.play().catch(()=>undefined);
  }
  return <section className="library-episode-batch"
    aria-label="EP002 V3 frame-matched Director continuity review">
    <div className="library-episode-batch-heading">
      <div>
        <h2><Film size={20}/> EP002 V3 — Seamless Motion / 10 Transition Audit</h2>
        <p>Separate 11-SHOT Full HD Director review master. No slowed or duplicated
          original frames. Each 2-second narration break uses a moving,
          camera-matched visual bridge between the prior final frame and the
          next SHOT's first frame. Existing V2 and all original SHOTs are preserved.</p>
      </div>
      <span className="library-episode-batch-state" aria-live="polite">
        {ready?'V3 MASTER READY — DIRECTOR REVIEW':
          working?'V3 MASTER '+render!.status+' · '+(render!.progress??0)+'%':
          render?.status==='FAILED'?'V3 MASTER FAILED — REVIEW ERROR':
          'V3 PRODUCTION PREPARATION'}
      </span>
    </div>
    {error&&<p className="library-voice-error" role="alert">{error}</p>}
    <p className="library-note">
      <ShieldCheck size={15} aria-hidden="true"/>{' '}
      Target: 1920×1080, 30fps, 24,046 frames (13:21.53).
      Exactly 10 × 60-frame moving seam bridges, 0 original source frames retimed.
      Creative final LOCK remains unapproved.
    </p>
    <div className="library-episode-batch-actions">
      <button type="button" className="library-voice-refresh"
        onClick={()=>setRefresh(n=>n+1)}>
        <RotateCcw size={15}/> Refresh V3 continuity status
      </button>
    </div>
    {render?.renderId&&<p className="library-note" aria-live="polite">
      V3 render: {render.renderId} · {render.status}
      {render.error?' · '+render.error:''}
    </p>}
    {videoUrl&&<div className="locked-cut-screen" style={{marginTop:16}}>
      <video ref={video} src={videoUrl} controls playsInline preload="metadata"
        aria-label="EP002 V3 complete 11-SHOT frame-matched transition master"/>
      <p className="library-note">
        Inspect every transition below. Each button starts playback shortly
        before that join, so you can watch request movement, object positions
        and the original 2-second narration breathing room.
      </p>
      <a href={videoUrl} target="_blank" rel="noopener noreferrer">
        Open complete EP002 V3 MP4
      </a>
      {' · '}
      <a href={videoUrl} download="EP002_V3_Continuity_Master_1080p.mp4">
        Download EP002 V3 MP4
      </a>
    </div>}
    {status?.seams&&status.seams.length===10&&<div style={{marginTop:20}}>
      <h3>Every transition — Director seam review</h3>
      <div style={{display:'flex',flexWrap:'wrap',gap:10,marginTop:12}}>
        {status.seams.map(seam=><button key={seam.index} type="button"
          className="library-voice-refresh" disabled={!ready}
          onClick={()=>previewSeam(seam)}
          title={seam.profile}>
          {seam.from} → {seam.to} · {timestamp(seam.startSeconds)}
        </button>)}
      </div>
      <p className="library-note">
        Transition buttons are available when the stored V3 video is ready.
        10 seam boundaries are calculated from the exact approved SHOT
        frame counts, not estimated from the player timeline.
      </p>
    </div>}
  </section>;
}
