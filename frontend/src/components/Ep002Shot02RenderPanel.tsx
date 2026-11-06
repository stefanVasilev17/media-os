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
const PREVIEW=BASE+'/shots/SHOT02/render-preview';

export function Ep002Shot02RenderPanel(){
  const [readiness,setReadiness]=useState<Readiness|null>(null);
  const [capability,setCapability]=useState<Capability|null>(null);
  const [render,setRender]=useState<RenderStatus|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [refresh,setRefresh]=useState(0);

  useEffect(()=>{
    let active=true;
    setError('');
    void Promise.all([
      fetch(BASE+'/voice-cue-review/SHOT02/render-readiness',{cache:'no-store'}),
      fetch(PREVIEW+'/capability',{cache:'no-store'}),
      fetch(PREVIEW,{cache:'no-store'}),
    ]).then(async responses=>{
      for(const r of responses){
        if(!r.ok)throw Error('SHOT02 pre-render state unavailable (HTTP '+r.status+').');
      }
      return await Promise.all(responses.map(async r=>await r.json()));
    }).then(values=>{
      if(!active)return;
      setReadiness(values[0] as Readiness);
      setCapability(values[1] as Capability);
      setRender(values[2] as RenderStatus);
    }).catch(e=>{if(active){setError(String(e));setReadiness(null);setCapability(null);}});
    return()=>{active=false;};
  },[refresh]);

  async function requestPreview(){
    if(busy||!readiness?.ready||!capability?.canQueue)return;
    if(!window.confirm('Start one Director-authorized SHOT02 1920x1080 Railway CPU '+
      'preview? This may incur cloud rendering costs. The verified selected voice '+
      'will be reused; no new ElevenLabs or Codex request will be made.'))return;
    setBusy(true);setError('');
    try{
      const response=await fetch(PREVIEW,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          requestId:window.crypto.randomUUID(),
          expectedEpisodeFingerprint:readiness.inputFingerprint,
        }),
      });
      if(!response.ok)throw Error('SHOT02 render was not queued (HTTP '+response.status+
        '): '+(await response.text()).slice(0,250));
      const result=await response.json() as RenderStatus;
      setRender(result);
      setRefresh(x=>x+1);
    }catch(e){setError(String(e));}finally{setBusy(false);}
  }

  const ready=Boolean(readiness?.ready&&capability?.canQueue);
  const active=['QUEUED','RENDERING','RUNNING'].includes(render?.status??'');
  return <section className="library-episode-batch" aria-label="EP002 SHOT02 verified render">
    <div className="library-episode-batch-heading">
      <div>
        <h2><Clapperboard size={21}/> SHOT02 — 1080p Voice-Synced Preview</h2>
        <p>Render the existing selected ElevenLabs Take with seven genuine
          spoken technical-term cues. Source SHA, Director approval and
          worker release must match before CPU work starts.</p>
      </div>
      <span className="library-episode-batch-state">
        {render?.status??'CHECKING'}</span>
    </div>
    {error&&<p className="library-voice-error" role="alert">{error}</p>}
    <p className="library-note">
      <ShieldCheck size={15} aria-hidden="true"/>{' '}
      Audio timing: {readiness?.ready?'7 REAL TERMS VERIFIED':readiness?.reason??'CHECKING'}.
      {' '}Pinned Worker release: {capability?.canQueue?'ENABLED':'NOT ENABLED'}.
      {' '}This button cannot bypass Maven/Remotion QA or Director CPU authorization.
    </p>
    <div className="library-episode-batch-actions">
      <button type="button" className="library-voice-refresh"
        disabled={busy} onClick={()=>setRefresh(x=>x+1)}>
        <RotateCcw size={14}/> Refresh render state
      </button>
      <button type="button" className="library-voice-button"
        disabled={busy||!ready||active} onClick={()=>void requestPreview()}>
        <Clapperboard size={15}/> {busy?'Requesting…':'Render SHOT02 — 1920×1080'}
      </button>
    </div>
    {render?.renderId&&<p className="library-note">
      Render ID: {render.renderId}. Status: {render.status}.
      {render.progress!==undefined?' Progress: '+render.progress+'%.':''}
      {render.error?' Error: '+render.error:''}
    </p>}
    {render?.videoUrl&&<p>
      <a href={render.videoUrl} target="_blank" rel="noopener noreferrer">
        Review SHOT02 MP4 (Director approval required)
      </a>
    </p>}
    <p className="library-note">Five locked gates: animated technical terms,
      actual voice-to-visual timing, zero overlap, premium Living Architecture,
      and cinematic camera movement. A completed MP4 must pass visual QA before LOCK.</p>
  </section>;
}
