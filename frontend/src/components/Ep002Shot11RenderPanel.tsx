import {useEffect,useState} from 'react';
import {Clapperboard,RotateCcw,ShieldCheck} from 'lucide-react';

type Readiness={
  ready:boolean;reason:string;inputFingerprint:string;
  voiceTakeId:string|null;durationInFrames:number;
  verifiedCues:unknown[];termCues:unknown[];
};
type Capability={
  enabled:boolean;workerPinned:boolean;canQueue:boolean;
  lockedShot10BoundaryReady?:boolean;reason?:string;
};
type RenderStatus={
  status:string;renderId?:string;progress?:number;error?:string|null;
  videoUrl?:string|null;durationInFrames?:number;
};
const BASE='/api/v1/creative/episodes/EP002';
const PREVIEW=BASE+'/shots/SHOT11/render-preview';

export function Ep002Shot11RenderPanel(){
  const [readiness,setReadiness]=useState<Readiness|null>(null);
  const [capability,setCapability]=useState<Capability|null>(null);
  const [render,setRender]=useState<RenderStatus|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [refresh,setRefresh]=useState(0);

  useEffect(()=>{
    let mounted=true;
    setError('');
    const endpoints=[
      BASE+'/voice-cue-review/SHOT11/render-readiness',
      PREVIEW+'/capability',
      PREVIEW,
    ];
    void Promise.all(endpoints.map(url=>fetch(url,{cache:'no-store'})))
      .then(async responses=>{
        for(const [index,response] of responses.entries()){
          if(!response.ok)throw Error('SHOT11 read-only preflight '+endpoints[index]+
            ' HTTP '+response.status);
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
        if(!response.ok)throw Error('SHOT11 progress HTTP '+response.status);
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
      'Generate ONE paid Railway CPU SHOT11 1920x1080 preview with the CURRENT approved '+
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
      if(!response.ok)throw Error('SHOT11 render not queued: HTTP '+response.status+
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
    aria-label="EP002 SHOT11 Tier++ verified audio render">
    <div className="library-episode-batch-heading">
      <div>
        <h2><Clapperboard size={21}/> SHOT11 — Healthy Is Not the Same as Available · Director Render</h2>
        <p>The original Director-locked SHOT10 final world frame continues without
          resetting Phone, Gateway, Load Balancer, the original three Auth servers,
          the single shared User Database, or request traffic. Five real HEAR → SEE
          beats and nineteen precisely spoken anchors close the architectural story:
          no added servers, no faster Database, bounded retries and concurrency,
          early Login rejection, more on-time accepted completions, and proof that
          healthy servers do not guarantee a successful end-to-end Login.
          All small, quickly changing panels are removed. Only five large
          content-fitted orange messages remain; the final text says
          “NEXT: MULTIPLE DATABASE INSTANCES.” for at least four real
          voice-aligned seconds through the final frame. The existing ONE
          Database is highlighted without introducing any fictional replicas.
          No additional voice, silent padding or paid voice generation happens here.</p>
      </div>
      <span className="library-episode-batch-state" aria-live="polite">{status}</span>
    </div>
    {error&&<p className="library-voice-error" role="alert">{error}</p>}
    <p className="library-note">
      <ShieldCheck size={15} aria-hidden="true"/>{' '}
      Real voice: {readiness?.ready?'5 REAL BEATS + 19 SPOKEN TERMS VERIFIED':
        readiness?.reason??'CHECKING'}. Pinned Worker:
      {' '}{capability?.canQueue?'READY FOR DIRECTOR REVIEW RENDER':'RELEASE OR VOICE NOT READY'}.
      {' '}Locked SHOT10 final-frame seam:
      {' '}{capability?.lockedShot10BoundaryReady?'VERIFIED EXACT MP4 HANDOFF':
        capability?.reason??'NOT VERIFIED'}.
      {' '}Voice duration: {readiness?.durationInFrames
        ?(readiness.durationInFrames/30).toFixed(2)+'s':'NOT CONFIRMED'}.
    </p>
    <div className="library-episode-batch-actions">
      <button className="library-voice-refresh" type="button"
        disabled={busy} onClick={()=>setRefresh(n=>n+1)}>
        <RotateCcw size={14}/> Refresh SHOT11 verification
      </button>
      <button className="library-voice-button" type="button"
        disabled={busy||!ready||active} onClick={()=>void requestRender()}>
        <Clapperboard size={15}/> Render SHOT11 — approved Take · 1920×1080
      </button>
    </div>
    {render?.renderId&&<div className="library-note" aria-live="polite">
      Render ID: {render.renderId}. Status: {status}.
      {render.error?' Error: '+render.error:''}
      {(active||render?.status==='SUCCEEDED')&&<div style={{marginTop:12}}>
        <div role="progressbar" aria-label="SHOT11 render progress"
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
        Watch SHOT11 MP4 — Director visual review required
      </a>
    </p>}
    <p className="library-note">The source begins at worldFrame 10407 from the exact Director-LOCKED SHOT10 2360-frame MP4. Before a new paid render, generate/select/approve the genuine SHOT11 Slow Natural Take and refresh verification. Technical 1080p/30fps MP4 completion is not
      a visual Tier++ LOCK. The Director must review real frames, diagram
      readability, the audio timing, the continuous architecture, and the ending.</p>
  </section>;
}
