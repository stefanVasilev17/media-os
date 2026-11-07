import {useEffect,useState} from 'react';
import {Clapperboard,RotateCcw,ShieldCheck} from 'lucide-react';

type Readiness={
  ready:boolean;reason:string;inputFingerprint:string;
  voiceTakeId:string|null;durationInFrames:number;
  verifiedCues:unknown[];termCues:unknown[];
};
type Capability={enabled:boolean;workerPinned:boolean;canQueue:boolean};
type EditorialPlan={
  ready:boolean;reason?:string;naturalSlowTake?:boolean;sourceDurationInFrames?:number;
  durationInFrames?:number;addedFrames?:number;
  pauses?:Array<{afterPhrase:string;atFrame:number;holdFrames:number}>;
};
type RenderStatus={
  status:string;renderId?:string;progress?:number;error?:string|null;
  videoUrl?:string|null;durationInFrames?:number;
};
const BASE='/api/v1/creative/episodes/EP002';
const PREVIEW=BASE+'/shots/SHOT02/render-preview';

export function Ep002Shot02RenderPanel(){
  const [readiness,setReadiness]=useState<Readiness|null>(null);
  const [capability,setCapability]=useState<Capability|null>(null);
  const [editorial,setEditorial]=useState<EditorialPlan|null>(null);
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
      fetch(PREVIEW+'/editorial-plan',{cache:'no-store'}),
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
      setEditorial(values[3] as EditorialPlan);
    }).catch(e=>{if(active){setError(String(e));setReadiness(null);setCapability(null);setEditorial(null);}});
    return()=>{active=false;};
  },[refresh]);

  const trackingRender=['QUEUED','RUNNING','RENDERING'].includes(render?.status??'');

  useEffect(()=>{
    if(!trackingRender||!render?.renderId)return;
    const currentRenderId=render.renderId;
    let mounted=true;
    let inFlight=false;
    let failures=0;
    const poll=async()=>{
      if(inFlight)return;
      inFlight=true;
      try{
        const response=await fetch(PREVIEW,{cache:'no-store'});
        if(!response.ok)throw Error('Render status HTTP '+response.status);
        const latest=await response.json() as RenderStatus;
        if(!mounted)return;
        if(latest.renderId===currentRenderId){
          failures=0;
          setRender(latest);
          setError('');
        }
      }catch(e){
        if(!mounted)return;
        failures++;
        if(failures>=3)setError('Cannot update render progress automatically: '+String(e));
      }finally{
        inFlight=false;
      }
    };
    void poll();
    const timer=window.setInterval(()=>void poll(),1500);
    return()=>{mounted=false;window.clearInterval(timer);};
  },[render?.renderId,trackingRender]);

  async function requestPreview(){
    if(busy||!readiness?.ready||!capability?.canQueue)return;
    const natural=Boolean(editorial?.naturalSlowTake);
    if(!window.confirm(natural
      ?'Start one Director-authorized SHOT02 1920x1080 Railway CPU preview with the newly approved Slow Natural ElevenLabs recording? No second editorial silence pass will be added. This may incur cloud rendering costs.'
      :'Start one Director-authorized SHOT02 1920x1080 Railway CPU preview with natural editorial voice pauses? This may incur cloud rendering costs. The selected ElevenLabs Take is reused; no new TTS request is made.'))return;
    setBusy(true);setError('');
    try{
      const response=await fetch(PREVIEW,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          requestId:window.crypto.randomUUID(),
          expectedEpisodeFingerprint:readiness.inputFingerprint,
          editorialPauses:!natural,
        }),
      });
      if(!response.ok)throw Error('SHOT02 render was not queued (HTTP '+response.status+
        '): '+(await response.text()).slice(0,250));
      const result=await response.json() as RenderStatus;
      setRender(result);
      setRefresh(x=>x+1);
    }catch(e){setError(String(e));}finally{setBusy(false);}
  }

  const ready=Boolean(readiness?.ready&&capability?.canQueue&&editorial?.ready);
  const active=trackingRender;
  const displayStatus=render?.status==='QUEUED'?'STARTING'
    :render?.status==='RUNNING'?'RENDERING'
    :render?.status==='SUCCEEDED'?'COMPLETED'
    :render?.status??'CHECKING';
  const progress=Math.max(0,Math.min(100,render?.progress??0));
  return <section className="library-episode-batch" aria-label="EP002 SHOT02 verified render">
    <div className="library-episode-batch-heading">
      <div>
        <h2><Clapperboard size={21}/> SHOT02 — 1080p Voice-Synced Preview</h2>
        <p>Create a slower editorial cut of the existing selected ElevenLabs Take with seven genuine
          spoken technical-term cues. Source SHA, Director approval and
          worker release must match before CPU work starts.</p>
      </div>
      <span className="library-episode-batch-state">
        <span aria-live="polite">{displayStatus}</span></span>
    </div>
    {error&&<p className="library-voice-error" role="alert">{error}</p>}
    <p className="library-note">
      <ShieldCheck size={15} aria-hidden="true"/>{' '}
      Audio timing: {readiness?.ready?'7 REAL TERMS VERIFIED':readiness?.reason??'CHECKING'}. Editor pauses: {editorial?.ready?'NATURAL SENTENCE BREAKS VERIFIED':editorial?.reason??'CHECKING'}.
      {' '}Pinned Worker release: {capability?.canQueue?'ENABLED':'NOT ENABLED'}.
      {' '}Enable this preview only after independently verified Maven/Remotion QA and Director release approval.
    </p>
    {editorial?.ready&&!editorial.naturalSlowTake&&<p className="library-note">
      Original Take: {((editorial.sourceDurationInFrames??0)/30).toFixed(2)}s.
      {' '}Edited SHOT02: {((editorial.durationInFrames??0)/30).toFixed(2)}s.
      {' '}Natural spoken-sentence pauses added: {((editorial.addedFrames??0)/30).toFixed(2)}s
      {' '}across {editorial.pauses?.length??0} positions.
      No voice regeneration. All timing cues are remapped to the edited soundtrack.
    </p>}
    {editorial?.ready&&editorial.naturalSlowTake&&<p className="library-note">
      Approved Slow Natural ElevenLabs Take: {((editorial.sourceDurationInFrames??0)/30).toFixed(2)}s.
      {' '}V5 preview: {((editorial.durationInFrames??0)/30).toFixed(2)}s,
      including an exact two-second animated hold after the final spoken words.
      The pauses are spoken naturally in the original recording, not inserted as artificial silence.
      No additional nine-gap editorial audio processing will run. Review the selected
      new Take and re-approve its genuine seven-term timing before a CPU preview.
    </p>}
    <div className="library-episode-batch-actions">
      <button type="button" className="library-voice-refresh"
        disabled={busy} onClick={()=>setRefresh(x=>x+1)}>
        <RotateCcw size={14}/> Refresh render state
      </button>
      <button type="button" className="library-voice-button"
        disabled={busy||!ready||active} onClick={()=>void requestPreview()}>
        <Clapperboard size={15}/> {busy?'Requesting…':editorial?.naturalSlowTake
          ?'Render SHOT02 — new Slow Natural Take · 1920×1080'
          :'Render SHOT02 V3 — slower voice · 1920×1080'}
      </button>
    </div>
    {render?.renderId&&<div className="library-note" aria-live="polite">
      Render ID: {render.renderId}. Status: {displayStatus}.
      {active?' Automatic progress updates are enabled.':''}
      {render.error?' Error: '+render.error:''}
      {(active||render?.status==='SUCCEEDED')&&<div style={{marginTop:12}}>
        <div role="progressbar" aria-label="SHOT02 render progress"
          aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}
          style={{height:12,borderRadius:6,background:'rgba(54,88,111,.45)',overflow:'hidden'}}>
          <div style={{width:progress+'%',height:'100%',borderRadius:6,
            background:'linear-gradient(90deg,#31C9E9,#7AE3C3)',
            transition:'width .3s ease-out'}}/>
        </div>
        <strong style={{display:'block',marginTop:7}}>
          {displayStatus==='STARTING'?'Starting verified Remotion worker…':progress+'%'}
        </strong>
      </div>}
    </div>}
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
