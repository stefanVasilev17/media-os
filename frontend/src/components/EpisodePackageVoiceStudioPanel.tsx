import {useCallback,useEffect,useRef,useState} from 'react';
import {RefreshCw,Save,Mic2,ShieldCheck} from 'lucide-react';
import {reconcilePaidVoiceState} from '../lib/paidVoiceReconciliation';
import {isExpectedTakeApproved,voiceReadinessExplanation,readinessRecheckReceipt} from '../lib/voiceTakeApproval';
import type {ShotReadinessSnapshot} from '../lib/voiceTakeApproval';

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
type RenderResult={renderId:string;status:string;videoUrl?:string;compositionId?:string;progress?:number};
type EpisodeReadinessResponse={shots:ShotReadinessSnapshot[]};
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
  const ep004Shot02=episodeKey==='EP004'&&shotKey==='SHOT02';
  const ep004Shot03=episodeKey==='EP004'&&shotKey==='SHOT03';
  const ep004Supported=ep004Shot01||ep004Shot02||ep004Shot03;
  const cpuComposition=ep004Shot03?'EP004-SHOT03-LIVING-GATEWAYS-V1-VISUAL'
    :ep004Shot02?'EP004-SHOT02-TWO-GATEWAYS-V1-VISUAL'
    :'EP004-SHOT01-ORDINARY-WORKDAY-V1-VISUAL';
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
  const [paidReconciliationRequired,setPaidReconciliationRequired]=useState(false);
  const [shotReadiness,setShotReadiness]=useState<ShotReadinessSnapshot|null>(null);
  const [shotReadinessError,setShotReadinessError]=useState('');
  const [checkingReadiness,setCheckingReadiness]=useState(false);
  const [readinessCheckFeedback,setReadinessCheckFeedback]=useState('');
  const [cpuConsent,setCpuConsent]=useState(false);
  const [cpuBusy,setCpuBusy]=useState(false);
  const [cpuReady,setCpuReady]=useState<Ep004Readiness|null>(null);
  const [renderJob,setRenderJob]=useState<RenderResult|null>(null);
  const inFlight=useRef(false);
  const pendingPaidId=useRef<string|null>(null);
  const knownPaidTakeIds=useRef<string[]>([]);
  const readinessCheckInFlight=useRef(false);
  const cpuRequestId=useRef<string|null>(null);
  const cpuRefreshSerial=useRef(0);

  const apply=(result:State)=>{
    setData(result);setNarration(result.narration);setDirection(result.voiceDirection);
    setTake(result.selectedTakeId??'');setConsent(false);
  };
  const refresh=useCallback(async()=>{
    const state=await checked<State>(await fetch(base,{cache:'no-store'}));
    apply(state);
  },[base]);
  const refreshShotReadiness=useCallback(async()=>{
    const url='/api/v1/episode-packages/'+encodeURIComponent(packageId)+'/voice-readiness';
    const report=await checked<EpisodeReadinessResponse>(
      await fetch(url,{cache:'no-store'}));
    const shot=report.shots.find(entry=>entry.shotKey===shotKey);
    if(!shot)throw Error('Voice readiness did not include '+shotKey);
    setShotReadiness(shot);
    setShotReadinessError('');
    return shot;
  },[packageId,shotKey]);

  async function recheckShotReadinessWithReceipt(){
    if(readinessCheckInFlight.current)return;
    readinessCheckInFlight.current=true;
    setCheckingReadiness(true);
    setReadinessCheckFeedback('Checking existing SHOT voice readiness (read-only, no charge)…');
    try{
      const previous=shotReadiness;
      const current=await refreshShotReadiness();
      const checkedAt=new Date().toLocaleTimeString();
      setReadinessCheckFeedback(readinessRecheckReceipt(current,previous)
        +' Checked at '+checkedAt+'.');
    }catch(reason){
      const failure='Read-only check failed: '+String(reason)
        +'. The existing approved Take is unchanged. No paid call was sent.';
      setShotReadinessError(failure);
      setReadinessCheckFeedback('Readiness check failed. See error above.');
    }finally{
      readinessCheckInFlight.current=false;
      setCheckingReadiness(false);
    }
  }

  async function recheckPaidAttempt(originalFailure=''){
    try{
      const state=await checked<State>(await fetch(base,{cache:'no-store'}));
      apply(state);
      const outcome=reconcilePaidVoiceState(state,knownPaidTakeIds.current);
      setPaidReconciliationRequired(!outcome.resolved);
      if(outcome.resolved){
        pendingPaidId.current=null;
        setError('');
        setMessage(outcome.message);
        onStatusChanged?.();
      }else{
        setMessage('');
        setError((originalFailure?originalFailure+'. ':'')+outcome.message);
      }
    }catch(recheckFailure){
      setPaidReconciliationRequired(true);
      setError((originalFailure?originalFailure+'. ':'')
        +'Read-only request status refresh failed: '+String(recheckFailure)
        +'. Do not retry the paid request until the provider outcome is reconciled.');
    }
  }

  useEffect(()=>{
    let active=true;setLoading(true);setError('');setMessage('');
    void fetch(base,{cache:'no-store'}).then(checked<State>)
      .then(result=>{if(active)apply(result);})
      .catch(reason=>{if(active)setError(String(reason));})
      .finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[base]);

  useEffect(()=>{
    if(!data?.approvedCurrentRevision||!data.selectedTakeId){
      setShotReadiness(null);
      setShotReadinessError('');
      return;
    }
    void refreshShotReadiness().catch(reason=>
      setShotReadinessError('Voice readiness could not be refreshed: '+String(reason)));
  },[data?.approvedCurrentRevision,data?.selectedTakeId,refreshShotReadiness]);

  const cpuBase='/api/v1/episode-packages/'+encodeURIComponent(packageId)+
    '/shots/'+encodeURIComponent(shotKey);
  const reloadCpu=useCallback(async()=>{
    if(!ep004Supported)return;
    const serial=++cpuRefreshSerial.current;
    const response=await checked<Ep004Readiness>(
      await fetch(cpuBase+'/render-readiness',{cache:'no-store'}));
    if(response.episodeKey!=='EP004'||response.shotKey!==shotKey)
      throw Error('Render readiness belongs to another SHOT. No CPU request was sent.');
    const compiledSource=/^[a-f0-9]{40}$/.test(response.expectedSourceCommit)
      ?response.expectedSourceCommit:null;
    const latest=compiledSource?await checked<RenderResult>(await fetch(
      '/api/v1/remotion/renders/compositions/'+encodeURIComponent(cpuComposition)
      +'/latest?profile=REVIEW&sourceCommit='+encodeURIComponent(compiledSource),
      {cache:'no-store'})):null;
    if(serial!==cpuRefreshSerial.current)return;
    setCpuReady(response);setCpuConsent(false);
    setRenderJob(latest?.status==='EMPTY'?null:latest);
  },[cpuBase,cpuComposition,ep004Supported,shotKey]);

  useEffect(()=>{
    setCpuReady(null);setCpuConsent(false);setRenderJob(null);
    if(ep004Supported && data?.approvedCurrentRevision){
      void reloadCpu().catch(reason=>setError(String(reason)));
    }
    return()=>{cpuRefreshSerial.current++;};
  },[ep004Supported,data?.approvedCurrentRevision,data?.selectedTakeId,reloadCpu]);

  async function renderApprovedShot(){
    if(!ep004Supported||!data?.approvedCurrentRevision||!cpuReady?.ready||
        cpuReady.episodeKey!=='EP004'||cpuReady.shotKey!==shotKey||
        data.shotKey!==shotKey||cpuReady.selectedTakeId!==data.selectedTakeId||
        !cpuConsent||cpuBusy||busy||dirty)return;
    if(!window.confirm('Render EP004 '+shotKey+' as a real 1920x1080 Remotion Director candidate using ONLY the selected current-revision Take and verified HEAR → SEE cues? This consumes bounded shared CPU and private S3 storage, but makes NO ElevenLabs call. Continue with one approved CPU job?'))return;
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
      if(output.compositionId&&output.compositionId!==cpuComposition)
        throw Error('Render server returned an unexpected composition. Stop and inspect.');
      cpuRequestId.current=null;
      setRenderJob(output);setCpuConsent(false);
      const status=output.status;
      setMessage(status==='QUEUED'
        ?'One approved '+shotKey+' candidate is QUEUED for the selected source. No voice was regenerated.'
        :status==='RENDERING'
          ?'The approved '+shotKey+' render is RENDERING. No new voice was generated.'
          :status==='READY'
            ?'An existing completed '+shotKey+' candidate was returned. No new render entered the queue.'
            :'The server returned '+status+' for '+shotKey+'. Inspect this render status before another request.');
    }catch(reason){setError(String(reason)+' Do not send another render request while the previous job might exist.');}
    finally{setCpuBusy(false);}
  }

  const dirty=!!data && (narration!==data.narration||direction!==data.voiceDirection);
  const cpuContextMatches=!!cpuReady&&!!data&&cpuReady.episodeKey==='EP004'
    &&cpuReady.shotKey===shotKey&&data.shotKey===shotKey
    &&cpuReady.selectedTakeId===data.selectedTakeId;
  const cpuActionBlocked=!cpuReady?.ready||!cpuContextMatches||
    !cpuConsent||cpuBusy||busy||dirty;
  const canSave=!!data&&!ep003SlowOnly&&dirty&&!busy&&narration.trim().length>=20
    &&narration.length<=12000&&direction.trim().length>=8&&direction.length<=1200;
  const paidConsentDisabled=!data||!data.canGenerate||busy||dirty||paidReconciliationRequired;
  const paidConsentReason=!data?'Voice state is still loading.'
    :paidReconciliationRequired?'An earlier paid request has an unresolved outcome. Recheck its existing status without generating again.'
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
      ||paidReconciliationRequired
      ||(mode==='SLOW_NATURAL'&&!data.canGenerateSlow))return;
    if(!window.confirm('This is a '+(mode==='SLOW_NATURAL'?'Slow Natural':'Standard')
      +' paid ElevenLabs API generation for '+shotKey+
      ' / revision '+data.revision+'. It may incur provider charges. '+
      'Continue once? A failed or uncertain request will NOT be retried automatically.'))return;
    inFlight.current=true;setBusy(true);setError('');setMessage('');
    const id=pendingPaidId.current??window.crypto.randomUUID();
    pendingPaidId.current=id;
    knownPaidTakeIds.current=data.takes.map(item=>item.id);
    try{
      const result=await checked<State>(await fetch(base+'/generate',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({expectedRevision:data.revision,
          expectedNarrationSha256:data.narrationSha256,requestId:id,
          confirmPaidElevenLabs:true,deliveryMode:mode}),
      }));
      pendingPaidId.current=null;
      setPaidReconciliationRequired(false);
      apply(result);
      onStatusChanged?.();
      setMessage((mode==='SLOW_NATURAL'?'New Slow Natural':'New Standard')
        +' Take stored. Listen and approve your preferred Take; previous recordings are preserved.');
    }catch(e){
      setPaidReconciliationRequired(true);
      setConsent(false);
      await recheckPaidAttempt(String(e));
    }finally{inFlight.current=false;setBusy(false);}
  }

  async function approve(){
    if(!data||!take||dirty||busy||inFlight.current
      ||isExpectedTakeApproved(data,take))return;
    if(!window.confirm('Approve Take '+take.slice(0,8)+'… for '+shotKey+
      ' revision '+data.revision+'? This does NOT authorize OpenAI agents.'))return;
    inFlight.current=true;setBusy(true);setError('');setMessage('');
    try{
      const result=await checked<State>(await fetch(base+'/approve',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({expectedRevision:data.revision,takeId:take,
          decision:'DIRECTOR_APPROVE'}),
      }));
      if(!isExpectedTakeApproved(result,take))
        throw Error('The server did not confirm the selected Take as approved for the current revision.');
      apply(result);
      setMessage('SUCCESS: The selected Voice Take is Director-approved for this revision. '+
        'SHOT production readiness and visual Director LOCK are separate checks.');
      try{onStatusChanged?.();}
      catch(notifyFailure){
        setShotReadinessError('Approval succeeded, but the page refresh failed: '+String(notifyFailure));
      }
    }catch(e){setError('Voice Take approval could not be confirmed: '+String(e));}
    finally{inFlight.current=false;setBusy(false);}
  }

  return <div className="episode-package-voice-studio">
    <div className="episode-package-voice-head">
      <h3><Mic2 size={19}/> Voice Studio · {shotKey}</h3>
      <button type="button" disabled={busy||loading}
        onClick={()=>{if(dirty&&!window.confirm('Discard unsaved narration edits?'))return;
          setLoading(true);void (paidReconciliationRequired?
            recheckPaidAttempt():refresh()).catch(e=>setError(String(e)))
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

      <p className="episode-package-voice-note">
        Approve selected Take is a free voice decision. The paid ElevenLabs authorization
        checkbox below is only for generating NEW audio and is not required for approval.
      </p>
      {data.approvedCurrentRevision&&data.selectedTakeId&&<>
        <p className="episode-package-notice" role="status">
          VOICE TAKE DIRECTOR APPROVED · Current revision {data.revision}.
          This does not mean SHOT visual Director LOCK is complete.
        </p>
        {shotReadiness&&<p className="episode-package-voice-note" role="status">
          SHOT voice readiness: <strong>{shotReadiness.status}</strong>.
          {' '}{voiceReadinessExplanation(shotReadiness)}
        </p>}
        {shotReadinessError&&<p className="episode-package-voice-note" role="status">
          {shotReadinessError}. Your existing Take approval is preserved.
        </p>}
        {readinessCheckFeedback&&<p className="episode-package-voice-note"
          role="status" aria-live="polite">{readinessCheckFeedback}</p>}
        <button type="button" disabled={busy||loading||checkingReadiness}
          onClick={()=>void recheckShotReadinessWithReceipt()}>
          <RefreshCw size={14}/>
          {checkingReadiness
            ?' Checking SHOT voice readiness…'
            :' Recheck SHOT voice readiness (read-only)'}
        </button>
      </>}
      <button type="button" className="episode-package-voice-primary"
        disabled={!take||busy||dirty||data.takes.every(t=>t.id!==take||t.revision!==data.revision)
          ||isExpectedTakeApproved(data,take)}
        onClick={()=>void approve()}>
        <ShieldCheck size={16}/>{isExpectedTakeApproved(data,take)
          ?' Selected Take already Director-approved':' Approve selected current-revision Take'}
      </button>

      <div className="episode-package-voice-paid">
        <h4>Generate new Take · Paid ElevenLabs call</h4>
        <p>Server paid gate: {data.paidGateEnabled?'enabled':'disabled'} ·
          {' '}Latest paid attempt: {label(data.generationStatus)}</p>
        {paidReconciliationRequired&&<button type="button"
          disabled={busy||loading||dirty}
          onClick={()=>{
            setBusy(true);
            void recheckPaidAttempt().finally(()=>setBusy(false));
          }}>
          <RefreshCw size={14}/> Recheck existing paid request (read-only, no charge)
        </button>}
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
          disabled={!data.canGenerate||!consent||busy||dirty||paidReconciliationRequired}
          onClick={()=>void generate('STANDARD')}><Mic2 size={16}/> Generate one Take (paid)</button>}
        <button type="button" className="episode-package-voice-primary"
          disabled={!data.canGenerateSlow||!consent||busy||dirty||paidReconciliationRequired}
          onClick={()=>void generate('SLOW_NATURAL')}><Mic2 size={16}/>
          {ep003SlowOnly?'Generate (slow intake) · First Take (paid)':'Generate Slow Natural Take (paid)'}</button>
        <p className="episode-package-voice-note">
          Slow Natural adds {data.slowVoicePauseCount} sentence and concept pauses,
          including {data.slowVoiceLongPauseCount} longer pauses, without changing the saved words.
          It makes one separate paid ElevenLabs request and never replaces a selected Take.
          Actual voice speed is reviewed by the Director after generation.
        </p>
      </div>
      {ep004Supported&&data.approvedCurrentRevision&&<section className="episode-package-voice-paid">
        <h4>Render target: EP004 / {shotKey} · 1080p Director Review</h4>
        <p role="status">This control sends work for <strong>{shotKey} only</strong>.
          {' '}To render SHOT03 V2, the current heading must say SHOT03;
          rendering another SHOT will not create a SHOT03 candidate.</p>
        <p>Only the current approved Take is used. The backend derives every HEAR → SEE cue
          from saved ElevenLabs provider alignment, not from editorial estimates.
          The existing shared worker stores the MP4 in private S3.</p>
        <button type="button" disabled={cpuBusy||busy}
          onClick={()=>{void reloadCpu().catch(e=>setError(String(e)));}}>
          <RefreshCw size={14}/> Refresh real voice + worker readiness
        </button>
        {cpuReady&&<>
          <p role="status">Source: EP004 Director-LOCKED ·
            {' '}Real cues: {cpuReady.ready?Object.keys(cpuReady.cueFrames).length+' VERIFIED':'NOT VERIFIED'} ·
            {' '}Frames: {cpuReady.durationInFrames} ·
            {' '}Worker: {cpuReady.ready?'MATCHED':'NOT READY'} ·
            {' '}Source: {cpuReady.expectedSourceCommit?.slice(0,12)||'UNVERIFIED'}</p>
          {!cpuContextMatches&&<p className="episode-package-voice-blocker" role="alert">
            Current SHOT/Take does not match the render readiness result.
            Refresh this SHOT before approving CPU work.
          </p>}
          {dirty&&<p className="episode-package-voice-blocker" role="status">
            Render is disabled because the working narration or direction contains
            unsaved changes. Save or discard them first.
          </p>}
          {cpuReady.blockers.length>0&&<p className="episode-package-voice-blocker" role="status">
            {cpuReady.blockers.join(' · ')}. {cpuReady.nextAction}
          </p>}
          <label className="episode-package-voice-option">
            <input type="checkbox" checked={cpuConsent}
              disabled={!cpuReady.ready||!cpuContextMatches||cpuBusy||busy||dirty}
              onChange={event=>setCpuConsent(event.target.checked)}/>
            I approve one bounded shared-CPU render of this current {shotKey} Take.
            No ElevenLabs generation and no automatic rerun.
          </label>
          <button type="button" className="episode-package-voice-primary"
            disabled={cpuActionBlocked}
            onClick={()=>{void renderApprovedShot();}}>
            {cpuBusy?'Queuing approved render…':'Render '+shotKey+' · 1080p Director Candidate'}
          </button>
        </>}
        {renderJob&&<>
          <p role="status">Current-source render: {renderJob.status}
            {' '}· {renderJob.renderId}
            {renderJob.progress!=null?' · '+renderJob.progress+'%':''}</p>
          {renderJob.status==='FAILED'&&<p role="alert" className="episode-package-voice-blocker">
            This render failed. No MP4 was produced and no automatic CPU retry is scheduled.
            The original Director-approved Voice Take remains unchanged.
          </p>}
          {renderJob.videoUrl&&<video controls preload="metadata"
            src={renderJob.videoUrl} style={{width:'100%',maxWidth:800,aspectRatio:'16 / 9'}}/>}
        </>}
      </section>}
    </>}
    {error&&<p className="episode-hub-error" role="alert">{error}</p>}
    {message&&!(ep004Supported&&renderJob?.status==='FAILED'&&message.startsWith('One approved '))&&<p className="episode-package-notice" role="status">{message}</p>}
  </div>;
}
