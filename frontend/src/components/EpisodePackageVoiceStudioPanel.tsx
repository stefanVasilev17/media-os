import {useCallback,useEffect,useRef,useState} from 'react';
import {RefreshCw,Save,Mic2,ShieldCheck} from 'lucide-react';

type Take={
  id:string;revision:number;takeNumber:number;contentType:string;
  modelId:string;voiceId:string;durationSeconds:number|null;
  hasAlignment:boolean;generatedAt:string;deliveryMode?:string;
};
type Ep004Readiness={
  ready:boolean;episodeKey:string;shotKey:string;
  selectedTakeId:string|null;narrationSha256:string|null;
  sourceSha256:string;durationInFrames:number;
  cueFrames:Record<string,number>;expectedSourceCommit:string;
  blockers:string[];nextAction:string;
};
type RenderResult={renderId:string;status:string;videoUrl?:string};
type State={
  packageId:string;shotKey:string;revision:number;narration:string;
  voiceDirection:string;narrationSha256:string;takes:Take[];
  selectedTakeId:string|null;approvedCurrentRevision:boolean;
  voiceStatus:string;generationStatus:string;configured:boolean;
  paidGateEnabled:boolean;canGenerate:boolean;blockedReason:string;
  timingStatus:string;canGenerateSlow:boolean;
   slowVoicePauseCount:number;slowVoiceLongPauseCount:number;
};

const label=(text:string)=>text.replaceAll('_',' ').toLowerCase();

async function checked<T>(response:Response):Promise<T>{
  if(!response.ok)throw Error('HTTP '+response.status+': '+(await response.text()).slice(0,280));
  return response.json() as Promise<T>;
}

export function EpisodePackageVoiceStudioPanel({packageId,shotKey,episodeKey,onStatusChanged}:{
  packageId:string;shotKey:string;episodeKey?:string;onStatusChanged?:()=>void;
}){
  const ep003SlowOnly=episodeKey==='EP003';
  const ep004Shot01=episodeKey==='EP004'&&shotKey==='SHOT01';
  const base='/api/v1/episode-packages/'+encodeURIComponent(packageId)
    +'/shots/'+encodeURIComponent(shotKey)+'/voice';
  const [data,setData]=useState<State|null>(null);
  const [narration,setNarration]=useState('');
  const [direction,setDirection]=useState('');
  const [take,setTake]=useState('');
  const [error,setError]=useState('');
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);
  const [loading,setLoading]=useState(true);
  const [consent,setConsent]=useState(false);
  const [cpuConsent,setCpuConsent]=useState(false);
  const [cpuBusy,setCpuBusy]=useState(false);
  const [cpuReady,setCpuReady]=useState<Ep004Readiness|null>(null);
  const [renderJob,setRenderJob]=useState<RenderResult|null>(null);
  const inFlight=useRef(false);
  const pendingPaidId=useRef<string|null>(null);
  const cpuRequestId=useRef<string|null>(null);

  const apply=(result:State)=>{
    setData(result);setNarration(result.narration);setDirection(result.voiceDirection);
    setTake(result.selectedTakeId??'');setConsent(false);
  };
  const refresh=useCallback(async()=>{
    const state=await checked<State>(await fetch(base,{cache:'no-store'}));
    apply(state);
  },[base]);

  useEffect(()=>{
    let active=true;setLoading(true);setError('');setMessage('');
    void fetch(base,{cache:'no-store'}).then(checked<State>)
      .then(result=>{if(active)apply(result);})
      .catch(reason=>{if(active)setError(String(reason));})
      .finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[base]);

  const cpuBase='/api/v1/episode-packages/'+encodeURIComponent(packageId)+
    '/shots/SHOT01';
  const reloadCpu=useCallback(async()=>{
    if(!ep004Shot01)return;
    const response=await checked<Ep004Readiness>(
      await fetch(cpuBase+'/render-readiness',{cache:'no-store'}));
    setCpuReady(response);setCpuConsent(false);
    const latest=await checked<RenderResult>(await fetch(
      '/api/v1/remotion/renders/compositions/EP004-SHOT01-ORDINARY-WORKDAY-V1-VISUAL/latest?profile=REVIEW',
      {cache:'no-store'}));
    setRenderJob(latest.status==='EMPTY'?null:latest);
  },[cpuBase,ep004Shot01]);

  useEffect(()=>{
    if(ep004Shot01 && data?.approvedCurrentRevision){
      void reloadCpu().catch(reason=>setError(String(reason)));
    }else{
      setCpuReady(null);setCpuConsent(false);
    }
  },[ep004Shot01,data?.approvedCurrentRevision,data?.selectedTakeId,reloadCpu]);

  async function renderApprovedShot01(){
    if(!ep004Shot01||!data?.approvedCurrentRevision||!cpuReady?.ready||
        !cpuConsent||cpuBusy||busy||dirty)return;
    if(!window.confirm('Render EP004 SHOT01 as a real 1920x1080 Remotion review MP4 using ONLY the selected approved Slow Natural Take. This consumes bounded shared CPU time and S3 storage, but makes NO ElevenLabs call. Continue with this one approved CPU job?'))return;
    setCpuBusy(true);setError('');setMessage('');
    const id=cpuRequestId.current??window.crypto.randomUUID();
    cpuRequestId.current=id;
    try{
      const output=await checked<RenderResult>(await fetch(cpuBase+'/render',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({requestId:id,
          expectedNarrationSha256:cpuReady.narrationSha256,
          expectedVoiceTakeId:cpuReady.selectedTakeId,
          expectedSourceCommit:cpuReady.expectedSourceCommit,
          maximumFrames:cpuReady.durationInFrames,confirmCpuRender:true})
      }));
      cpuRequestId.current=null;
      setRenderJob(output);setCpuConsent(false);
      setMessage('One approved SHOT01 Remotion job queued. No voice was regenerated. Refresh render status to see the completed MP4.');
    }catch(reason){setError(String(reason)+' Do not send another render request while the previous job might exist.');}
    finally{setCpuBusy(false);}
  }

  const dirty=!!data && (narration!==data.narration||direction!==data.voiceDirection);
  const canSave=!!data&&!ep003SlowOnly&&dirty&&!busy&&narration.trim().length>=20
    &&narration.length<=12000&&direction.trim().length>=8&&direction.length<=1200;
  const paidConsentDisabled=!data||!data.canGenerate||busy||dirty;
  const paidConsentReason=!data?'Voice state is still loading.'
    :!data.canGenerate?(data.blockedReason||'Voice generation is blocked by the server.')
    :busy?'A voice operation is running. Finish it before confirming another request.'
    :dirty?'Working narration or voice direction has unsaved changes. Save the revision first.'
    :!data.canGenerateSlow?'Slow Natural is unavailable for this voice model or narration. Do not generate a paid Standard Take by mistake.'
    :'';

  async function save(){
    if(!canSave||inFlight.current||!data)return;
    inFlight.current=true;setBusy(true);setError('');setMessage('');
    try{
      const result=await checked<State>(await fetch(base+'/script',{
        method:'PUT',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({expectedRevision:data.revision,narration,
          voiceDirection:direction}),
      }));
      apply(result);
      onStatusChanged?.();
      setMessage('Working narration saved as revision '+result.revision+
        '. Earlier takes are preserved, but only the new revision can be approved.');
    }catch(e){setError(String(e));}
    finally{inFlight.current=false;setBusy(false);}
  }

  async function generate(mode:'STANDARD'|'SLOW_NATURAL'='SLOW_NATURAL'){
    if(ep003SlowOnly&&mode!=='SLOW_NATURAL')return;
    if(!data||!data.canGenerate||dirty||!consent||busy||inFlight.current
      ||(mode==='SLOW_NATURAL'&&!data.canGenerateSlow))return;
    if(!window.confirm('This is a '+(mode==='SLOW_NATURAL'?'Slow Natural':'Standard')
      +' paid ElevenLabs API generation for '+shotKey+
      ' / revision '+data.revision+'. It may incur provider charges. '+
      'Continue once? A failed or uncertain request will NOT be retried automatically.'))return;
    inFlight.current=true;setBusy(true);setError('');setMessage('');
    const id=pendingPaidId.current??window.crypto.randomUUID();
    pendingPaidId.current=id;
    try{
      const result=await checked<State>(await fetch(base+'/generate',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({expectedRevision:data.revision,
          expectedNarrationSha256:data.narrationSha256,requestId:id,
          confirmPaidElevenLabs:true,deliveryMode:mode}),
      }));
      pendingPaidId.current=null;
      apply(result);
      onStatusChanged?.();
      setMessage((mode==='SLOW_NATURAL'?'New Slow Natural':'New Standard')
        +' Take stored. Listen and approve your preferred Take; previous recordings are preserved.');
    }catch(e){
      setError(String(e)+' Payment status may be uncertain. Do not retry without reconciling the provider request.');
      setConsent(false);
    }finally{inFlight.current=false;setBusy(false);}
  }

  async function approve(){
    if(!data||!take||dirty||busy||inFlight.current)return;
    if(!window.confirm('Approve Take '+take.slice(0,8)+'… for '+shotKey+
      ' revision '+data.revision+'? This does NOT authorize OpenAI agents.'))return;
    inFlight.current=true;setBusy(true);setError('');setMessage('');
    try{
      const result=await checked<State>(await fetch(base+'/approve',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({expectedRevision:data.revision,takeId:take,
          decision:'DIRECTOR_APPROVE'}),
      }));
      apply(result);
      onStatusChanged?.();
      setMessage('Director-approved Take selected for current revision. '+
        'Voice timing still requires explicit verification before AI execution.');
    }catch(e){setError(String(e));}
    finally{inFlight.current=false;setBusy(false);}
  }

  return <div className="episode-package-voice-studio">
    <div className="episode-package-voice-head">
      <h3><Mic2 size={19}/> Voice Studio · {shotKey}</h3>
      <button type="button" disabled={busy||loading}
        onClick={()=>{if(dirty&&!window.confirm('Discard unsaved narration edits?'))return;
          setLoading(true);void refresh().catch(e=>setError(String(e)))
            .finally(()=>setLoading(false));}}>
        <RefreshCw size={14}/> Refresh</button>
    </div>
    {loading?<p>Loading current voice revision…</p>:data&&<>
      {ep003SlowOnly&&<p className="episode-package-voice-note" role="status">
        EP003 · SCRIPT v0.4 DIRECTOR LOCKED · SLOW NATURAL FIRST TAKE ONLY.
        The approved 11-SHOT narration cannot be edited here. No Standard Take,
        automatic regeneration, or paid request without your confirmation.
      </p>}
      <p>Script revision <strong>{data.revision}</strong> ·
        {' '}<strong>{label(data.voiceStatus)}</strong> ·
        {' '}Timing: <strong>{label(data.timingStatus)}</strong></p>
      <p className="episode-package-voice-note">Original imported narration remains immutable.
        Edit and Save creates a new working revision without deleting older audio.</p>
      <label htmlFor={'narration-'+shotKey}>Current working narration</label>
      <textarea id={'narration-'+shotKey} rows={5} maxLength={12000}
        value={narration} disabled={busy||ep003SlowOnly} onChange={e=>setNarration(e.target.value)}/>
      <label htmlFor={'direction-'+shotKey}>Editorial voice direction</label>
      <textarea id={'direction-'+shotKey} rows={3} maxLength={1200}
        value={direction} disabled={busy||ep003SlowOnly} onChange={e=>setDirection(e.target.value)}/>
      <p className="episode-package-voice-note">Voice direction is retained for editorial review.
        The current ElevenLabs v4 generation uses the approved EP001 delivery profile; it does not
        interpret arbitrary directions as ElevenLabs API settings.</p>
      {!ep003SlowOnly&&<button type="button" className="episode-package-voice-primary"
        disabled={!canSave} onClick={()=>void save()}>
        <Save size={16}/> {busy?'Saving…':'Save working revision (no API cost)'}
      </button>}

      <div className="episode-package-voice-takes">
        <h4>Generated takes · Playback and Director selection</h4>
        {data.takes.length===0?<p>No audio Take generated yet.</p>:
          data.takes.map(item=><div key={item.id} className="episode-package-voice-take">
            <label className="episode-package-voice-option">
              <input type="radio" name={'take-'+shotKey} value={item.id}
                checked={take===item.id}
                onChange={()=>setTake(item.id)} disabled={busy||dirty||item.revision!==data.revision}/>
              <span>Take {item.takeNumber} · revision {item.revision}
                {item.id===data.selectedTakeId?' · DIRECTOR APPROVED':''}</span>
            </label>
            <p>{item.durationSeconds!=null?item.durationSeconds+'s measured':'Duration not measured'}
              {' · '}{item.hasAlignment?'Provider alignment saved':'No verified alignment'}
              {' · '}{item.modelId}
              {item.deliveryMode?.includes('SLOW_NATURAL')?' · SLOW NATURAL':''}</p>
            <audio controls preload="none"
              src={base+'/takes/'+encodeURIComponent(item.id)+'/audio'} />
          </div>)}
      </div>

      <button type="button" className="episode-package-voice-primary"
        disabled={!take||busy||dirty||data.takes.every(t=>t.id!==take||t.revision!==data.revision)}
        onClick={()=>void approve()}>
        <ShieldCheck size={16}/> Approve selected current-revision Take
      </button>

      <div className="episode-package-voice-paid">
        <h4>Generate new Take · Paid ElevenLabs call</h4>
        <p>Server paid gate: {data.paidGateEnabled?'enabled':'disabled'} ·
          {' '}Latest paid attempt: {label(data.generationStatus)}</p>
        {paidConsentReason&&<p id={'paid-consent-reason-'+shotKey}
          className="episode-package-voice-blocker" role="status">
          {paidConsentDisabled?'Paid consent is disabled: ':'Slow Natural unavailable: '}
          {paidConsentReason}
        </p>}
        <label className={'episode-package-voice-option'+(paidConsentDisabled?' episode-package-voice-option-disabled':'')}>
          <input type="checkbox" checked={consent} disabled={paidConsentDisabled}
            aria-describedby={paidConsentReason?'paid-consent-reason-'+shotKey:undefined}
            onChange={e=>setConsent(e.target.checked)}/>
          <span>I authorize one paid {ep003SlowOnly?'Slow Natural first-Take':'ElevenLabs'} generation for this exact narration version.
            No automatic retry or OpenAI visual execution.</span>
        </label>
        {!ep003SlowOnly&&<button type="button" className="episode-package-voice-primary"
          disabled={!data.canGenerate||!consent||busy||dirty}
          onClick={()=>void generate('STANDARD')}><Mic2 size={16}/> Generate one Take (paid)</button>}
        <button type="button" className="episode-package-voice-primary"
          disabled={!data.canGenerateSlow||!consent||busy||dirty}
          onClick={()=>void generate('SLOW_NATURAL')}><Mic2 size={16}/>
          {ep003SlowOnly?'Generate (slow intake) · First Take (paid)':'Generate Slow Natural Take (paid)'}</button>
        <p className="episode-package-voice-note">
          Slow Natural adds {data.slowVoicePauseCount} sentence and concept pauses,
          including {data.slowVoiceLongPauseCount} longer pauses, without changing the saved words.
          It makes one separate paid ElevenLabs request and never replaces a selected Take.
          Actual voice speed is reviewed by the Director after generation.
        </p>
      </div>
      {ep004Shot01&&data.approvedCurrentRevision&&<section className="episode-package-voice-paid">
        <h4>SHOT01 · 1080p Remotion Director Review</h4>
        <p>Only the current approved Take is used. The backend derives every HEAR → SEE cue
          from saved ElevenLabs provider alignment, not from editorial estimates.
          The existing shared worker stores the MP4 in private S3.</p>
        <button type="button" disabled={cpuBusy||busy}
          onClick={()=>{void reloadCpu().catch(e=>setError(String(e)));}}>
          <RefreshCw size={14}/> Refresh real voice + worker readiness
        </button>
        {cpuReady&&<>
          <p role="status">Source: EP004 Director-LOCKED ·
            {' '}Real cues: {Object.keys(cpuReady.cueFrames).length===8?'8/8 VERIFIED':'NOT VERIFIED (all 8 required)'} ·
            {' '}Frames: {cpuReady.durationInFrames} ·
            {' '}Worker: {cpuReady.ready?'MATCHED':'NOT READY'}</p>
          {cpuReady.blockers.length>0&&<p className="episode-package-voice-blocker" role="status">
            {cpuReady.blockers.join(' · ')}. {cpuReady.nextAction}
          </p>}
          <label className="episode-package-voice-option">
            <input type="checkbox" checked={cpuConsent}
              disabled={!cpuReady.ready||cpuBusy||busy||dirty}
              onChange={event=>setCpuConsent(event.target.checked)}/>
            I approve one bounded shared-CPU render of this current SHOT01 Take.
            No ElevenLabs generation and no automatic rerun.
          </label>
          <button type="button" className="episode-package-voice-primary"
            disabled={!cpuReady.ready||!cpuConsent||cpuBusy||busy||dirty}
            onClick={()=>{void renderApprovedShot01();}}>
            {cpuBusy?'Queuing approved render…':'Render SHOT01 · 1080p Director Candidate'}
          </button>
        </>}
        {renderJob&&<>
          <p>Render: {renderJob.status} · {renderJob.renderId}</p>
          {renderJob.videoUrl&&<video controls preload="metadata"
            src={renderJob.videoUrl} style={{width:'100%',maxWidth:800,aspectRatio:'16 / 9'}}/>}
        </>}
      </section>}
    </>}
    {error&&<p className="episode-hub-error" role="alert">{error}</p>}
    {message&&<p className="episode-package-notice" role="status">{message}</p>}
  </div>;
}
