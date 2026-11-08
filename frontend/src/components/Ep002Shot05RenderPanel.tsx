import {useEffect,useState} from 'react';
import {Clapperboard,RotateCcw,ShieldCheck} from 'lucide-react';

type Readiness={
  ready:boolean;reason:string;inputFingerprint:string;
  voiceTakeId:string|null;durationInFrames:number;
  verifiedCues:unknown[];termCues:unknown[];
};
type Capability={enabled:boolean;workerPinned:boolean;canQueue:boolean};
type RenderStatus={
  status:string;renderId?:string;progress?:number;error?:string|null;
  videoUrl?:string|null;durationInFrames?:number;
};
const BASE='/api/v1/creative/episodes/EP002';
const PREVIEW=BASE+'/shots/SHOT05/render-preview';

export function Ep002Shot05RenderPanel(){
  const [readiness,setReadiness]=useState<Readiness|null>(null);
  const [capability,setCapability]=useState<Capability|null>(null);
  const [render,setRender]=useState<RenderStatus|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [refresh,setRefresh]=useState(0);

  useEffect(()=>{
    let mounted=true;
    setError('');
    void Promise.all([
      fetch(BASE+'/voice-cue-review/SHOT05/render-readiness',{cache:'no-store'}),
      fetch(PREVIEW+'/capability',{cache:'no-store'}),
      fetch(PREVIEW,{cache:'no-store'}),
    ]).then(async responses=>{
      for(const response of responses){
        if(!response.ok)throw Error('SHOT05 read-only preflight HTTP '+response.status);
      }
      return Promise.all(responses.map(r=>r.json()));
    }).then(values=>{
      if(!mounted)return;
      setReadiness(values[0] as Readiness);
      setCapability(values[1] as Capability);
      setRender(values[2] as RenderStatus);
    }).catch(e=>{
      if(!mounted)return;
      setReadiness(null);setCapability(null);setError(String(e));
    });
    return()=>{mounted=false;};
  },[refresh]);

  const active=['QUEUED','RUNNING','RENDERING'].includes(render?.status??'');

  useEffect(()=>{
    if(!active||!render?.renderId)return;
    const expectedId=render.renderId;
    let mounted=true,inFlight=false,failures=0;
    const poll=async()=>{
      if(inFlight)return;
      inFlight=true;
      try{
        const response=await fetch(PREVIEW,{cache:'no-store'});
        if(!response.ok)throw Error('SHOT05 progress HTTP '+response.status);
        const latest=await response.json() as RenderStatus;
        if(!mounted)return;
        if(latest.renderId===expectedId){
          failures=0;setRender(latest);setError('');
        }
      }catch(e){if(mounted&&++failures>=3)setError(String(e));}
      finally{inFlight=false;}
    };
    void poll();
    const id=window.setInterval(()=>void poll(),1500);
    return()=>{mounted=false;window.clearInterval(id);};
  },[active,render?.renderId]);

  async function requestRender(){
    if(busy||active||!readiness?.ready||!capability?.canQueue)return;
    if(!window.confirm(
      'Generate ONE paid Railway CPU SHOT05 1920x1080 preview with the CURRENT approved '+
      'Slow Natural ElevenLabs Take and exact verified voice cues? This uses cloud '+
      'CPU resources and may incur costs. No new ElevenLabs generation, editorial silence '+
      'or automatic Director visual approval will be performed.'))return;
    setBusy(true);setError('');
    try{
      const response=await fetch(PREVIEW,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          requestId:window.crypto.randomUUID(),
          expectedEpisodeFingerprint:readiness.inputFingerprint,
          confirmPaidCpuRender:true,
        }),
      });
      if(!response.ok)throw Error('SHOT05 render not queued: HTTP '+response.status+
        ' '+(await response.text()).slice(0,260));
      setRender(await response.json() as RenderStatus);
      setRefresh(x=>x+1);
    }catch(e){setError(String(e));}
    finally{setBusy(false);}
  }

  const ready=Boolean(readiness?.ready&&capability?.canQueue);
  const status=render?.status==='QUEUED'?'STARTING':
    render?.status==='RUNNING'?'RENDERING':
    render?.status==='SUCCEEDED'?'COMPLETED':render?.status??'CHECKING';
  const progress=Math.max(0,Math.min(100,render?.progress??0));
  return <section className="library-episode-batch"
    aria-label="EP002 SHOT05 Tier++ verified audio render">
    <div className="library-episode-batch-heading">
      <div>
        <h2><Clapperboard size={21}/> SHOT05 — Tier++ Connection Pool: The Hidden Queue Render</h2>
        <p>The locked SHOT04 red saturated-but-running architecture becomes a
          camera dive into AUTH 01. One eight-slot connection pool, reusable
          borrowing, clearly marked historical REPLAY 1→5→7→8, an outside-pool
          WAITING FOR CONNECTION queue, distinct in-flight versus queued work
          and the same Phone spinner. Five current Director-reviewed beats and
          fifteen exact spoken terms control the visual cues. No guessed time
          frames and no new TTS generation.</p>
      </div>
      <span className="library-episode-batch-state" aria-live="polite">{status}</span>
    </div>
    {error&&<p className="library-voice-error" role="alert">{error}</p>}
    <p className="library-note">
      <ShieldCheck size={15} aria-hidden="true"/>{' '}
      Real voice: {readiness?.ready?'5 DIRECTOR BEATS + 15 REAL TERMS VERIFIED':
        readiness?.reason??'CHECKING'}. Pinned Worker:
      {' '}{capability?.canQueue?'AUTHORIZED FOR MANUAL RENDER':'NOT YET ENABLED'}.
      {' '}Voice duration: {readiness?.durationInFrames
        ?(readiness.durationInFrames/30).toFixed(2)+'s':'NOT CONFIRMED'}.
    </p>
    <div className="library-episode-batch-actions">
      <button className="library-voice-refresh" type="button"
        disabled={busy} onClick={()=>setRefresh(n=>n+1)}>
        <RotateCcw size={14}/> Refresh SHOT05 verification
      </button>
      <button className="library-voice-button" type="button"
        disabled={busy||!ready||active} onClick={()=>void requestRender()}>
        <Clapperboard size={15}/> Render SHOT05 — approved Take · 1920×1080
      </button>
    </div>
    {render?.renderId&&<div className="library-note" aria-live="polite">
      Render ID: {render.renderId}. Status: {status}.
      {render.error?' Error: '+render.error:''}
      {(active||render?.status==='SUCCEEDED')&&<div style={{marginTop:12}}>
        <div role="progressbar" aria-label="SHOT05 render progress"
          aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}
          style={{height:12,borderRadius:6,background:'rgba(54,88,111,.45)',
            overflow:'hidden'}}>
          <div style={{width:progress+'%',height:'100%',borderRadius:6,
            background:'linear-gradient(90deg,#31C9E9,#7AE3C3)',
            transition:'width .3s ease-out'}}/>
        </div>
        <strong style={{display:'block',marginTop:7}}>
          {status==='STARTING'?'Starting pinned Remotion worker…':progress+'%'}
        </strong>
      </div>}
    </div>}
    {render?.videoUrl&&<p>
      <a href={render.videoUrl} target="_blank" rel="noopener noreferrer">
        Watch SHOT05 MP4 — Director visual review required
      </a>
    </p>}
    <p className="library-note">Technical 1080p/30fps MP4 completion is not
      a visual Tier++ LOCK. The Director must review real frames, diagram
      readability, the audio timing, the continuous architecture, and the ending.</p>
  </section>;
}
