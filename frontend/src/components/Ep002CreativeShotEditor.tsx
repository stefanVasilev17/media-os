import {useCallback,useEffect,useRef,useState} from 'react';
import {CheckCircle2,Pause,Play,RotateCcw,Save,Pencil} from 'lucide-react';
import {ep002CreativeVoiceApi,type CreativeShotState,type ExistingTakeAlignmentState} from '../api/ep002CreativeVoiceApi';
import type {ShotVoiceStatus} from './Ep002VoiceActions';

type Props={
  shot:{shotKey:string;englishNarration:string;voiceDirection:string;wordCount:number};
  onVoiceStatus:(shotKey:string,status:ShotVoiceStatus)=>void;
  onProductionChanged?:(shotKey:string)=>void;
};

function statusOf(shot:CreativeShotState):ShotVoiceStatus {
  if(shot.voiceApproved) return 'locked';
  return shot.hasCurrentTake?'generated':'pending';
}

export function Ep002CreativeShotEditor({shot,onVoiceStatus,onProductionChanged}:Props){
  const [state,setState]=useState<CreativeShotState|null>(null);
  const [text,setText]=useState(shot.englishNarration);
  const [direction,setDirection]=useState(shot.voiceDirection);
  const [editing,setEditing]=useState(false);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [confirming,setConfirming]=useState(false);
  const [slowConfirming,setSlowConfirming]=useState(false);
  const [playing,setPlaying]=useState<string|null>(null);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [alignment,setAlignment]=useState<ExistingTakeAlignmentState|null>(null);
  const [alignmentConfirming,setAlignmentConfirming]=useState(false);
  const audioRefs=useRef<Record<string,HTMLAudioElement|null>>({});
  const isDirty=Boolean(state) && (state?.revision===0 || text !== (state?.narration??shot.englishNarration)
      || direction !== (state?.voiceDirection??shot.voiceDirection));
  const currentTakes=state?.takes.filter(t=>t.revision===state.revision)??[];
  const generateLabel=currentTakes.length?'Regenerate':'Generate';

  const apply=useCallback((next:CreativeShotState)=>{
    setState(next);
    onVoiceStatus(shot.shotKey,statusOf(next));
  },[onVoiceStatus,shot.shotKey]);

  useEffect(()=>{
    let active=true;
    setLoading(true);
    ep002CreativeVoiceApi.state(shot.shotKey).then(result=>{
      if(!active)return;
      apply(result);
      setText(result.narration??shot.englishNarration);
      setDirection(result.voiceDirection??shot.voiceDirection);
    }).catch(cause=>{
      if(active){setError(String(cause));onVoiceStatus(shot.shotKey,'unavailable');}
    }).finally(()=>{if(active)setLoading(false);});
    return ()=>{active=false;Object.values(audioRefs.current).forEach(a=>a?.pause());};
  },[shot.shotKey,shot.englishNarration,shot.voiceDirection,apply,onVoiceStatus]);

  useEffect(()=>{
    let active=true;
    setAlignment(null);
    setAlignmentConfirming(false);
    if(!state?.preferredTakeId)return()=>{active=false;};
    ep002CreativeVoiceApi.alignmentState(shot.shotKey)
      .then(result=>{if(active)setAlignment(result);})
      .catch(()=>{if(active)setAlignment(null);});
    return()=>{active=false;};
  },[shot.shotKey,state?.preferredTakeId,state?.revision]);

  async function alignPreferredTake(){
    if(!state||!alignment?.canAlign||!state.preferredTakeId||busy||isDirty
      ||!alignmentConfirming||alignment.preferredTakeId!==state.preferredTakeId)return;
    setBusy(true);setError('');setNotice('');setAlignmentConfirming(false);
    try{
      const current=await ep002CreativeVoiceApi.alignmentState(shot.shotKey);
      if(!current.canAlign||current.preferredTakeId!==state.preferredTakeId
        ||current.revision!==state.revision)
        throw new Error('Preferred take or alignment state changed. No new paid request was made.');
      const next=await ep002CreativeVoiceApi.alignExisting(
        shot.shotKey,state.preferredTakeId,state.revision,crypto.randomUUID());
      setAlignment(next);
      onProductionChanged?.(shot.shotKey);
      setNotice('Existing recording aligned. No new voice was generated. View measured cues in the Remotion Blueprint.');
    }catch(cause){
      setError(String(cause)+' Do not retry a paid request if its status is uncertain. Refresh first.');
      try{setAlignment(await ep002CreativeVoiceApi.alignmentState(shot.shotKey));}catch{ }
    }finally{setBusy(false);}
  }

  function stop(){
    Object.values(audioRefs.current).forEach(a=>{if(a){a.pause();a.currentTime=0;}});
    setPlaying(null);
  }
  async function play(id:string){
    const audio=audioRefs.current[id];
    if(!audio)return;
    if(playing===id){stop();return;}
    stop();
    try{await audio.play();setPlaying(id);}
    catch(cause){setError('Cannot play recording: '+String(cause));}
  }

  async function save(){
    if(!state||busy||loading||!isDirty||!text.trim())return;
    setBusy(true);setError('');setNotice('');setConfirming(false);setSlowConfirming(false);
    try{
      const next=await ep002CreativeVoiceApi.save(shot.shotKey,state.revision,text,direction);
      apply(next);onProductionChanged?.(shot.shotKey);
      setText(next.narration??text);setDirection(next.voiceDirection??direction);
      setEditing(false);
      stop();
      setNotice('Saved as version '+next.revision+'. Older scripts and recordings are preserved.');
      if(next.canGenerate)setConfirming(true);
    }catch(cause){setError(String(cause));}
    finally{setBusy(false);}
  }

  async function generate(mode:'standard'|'slow'='standard'){
    const slow=mode==='slow';
    if(!state||busy||loading||isDirty||!state.canGenerate||state.revision<1
      ||(slow?(!slowConfirming||shot.shotKey!=='SHOT02'||!state.canGenerateSlow):!confirming))return;
    setBusy(true);setError('');setNotice('');setConfirming(false);setSlowConfirming(false);
    try{
      const latest=await ep002CreativeVoiceApi.state(shot.shotKey);
      apply(latest);
      if(latest.revision!==state.revision || latest.narration!==state.narration
        || latest.takes.length!==state.takes.length || !latest.canGenerate
        ||(slow&&!latest.canGenerateSlow))
        throw new Error('Script or voice state changed. Review the latest version before spending credits.');
      const next=slow
        ?await ep002CreativeVoiceApi.generateSlow(shot.shotKey,latest.revision,crypto.randomUUID())
        :await ep002CreativeVoiceApi.generate(shot.shotKey,latest.revision,crypto.randomUUID());
      stop();apply(next);onProductionChanged?.(shot.shotKey);
      setNotice(slow
        ?'New slower Eleven v4 Take saved with natural pauses. Listen before selecting it. The original Take is unchanged.'
        :'New audio take saved. Listen below and choose your preferred take.');
    }catch(cause){
      setError(String(cause)+' If the paid request status is uncertain, do not retry before checking it.');
    }finally{setBusy(false);}
  }

  async function approve(takeId:string){
    if(!state||busy||isDirty)return;
    if(!window.confirm('Select this take as preferred for version '+state.revision+
       '? You can still edit the script and create a newer version at any time.'))return;
    setBusy(true);setError('');
    try{
      const next=await ep002CreativeVoiceApi.approve(shot.shotKey,state.revision,takeId);
      apply(next);onProductionChanged?.(shot.shotKey);
      setNotice('Preferred take approved. Future edits remain available.');
    }catch(cause){setError(String(cause));}
    finally{setBusy(false);}
  }

  async function refresh(){
  async function restoreOlderTake(takeId:string,takeNumber:number,takeRevision:number){
    if(!state||busy||loading||isDirty||shot.shotKey!=='SHOT01')return;
    if(!window.confirm('Restore the exact narration from text v'+takeRevision+
      ' and reuse the audio of Take '+takeNumber+'? This creates a NEW editable revision and a linked audio copy. '+
      'The existing current script, Take history and original Take '+takeNumber+
      ' remain unchanged. No ElevenLabs generation or credits will be used.'))return;
    setBusy(true);setError('');setNotice('');setConfirming(false);setSlowConfirming(false);
    try{
      const next=await ep002CreativeVoiceApi.restoreOlderTake(shot.shotKey,state.revision,takeId);
      stop();apply(next);onProductionChanged?.(shot.shotKey);
      setText(next.narration??shot.englishNarration);
      setDirection(next.voiceDirection??shot.voiceDirection);
      setEditing(false);
      setNotice('Restored original Take '+takeNumber+' audio as the approved current version. '+
        'The prior Take and all revisions remain in history. Re-verify real voice cues before rendering.');
    }catch(cause){setError(String(cause));}finally{setBusy(false);}
  }


    if(busy||loading)return;
    if(isDirty&&!window.confirm('Discard unsaved edits and reload the saved version?'))return;
    setLoading(true);setError('');setConfirming(false);setSlowConfirming(false);
    try{const next=await ep002CreativeVoiceApi.state(shot.shotKey);
      apply(next);setText(next.narration??shot.englishNarration);
      setDirection(next.voiceDirection??shot.voiceDirection);
      setEditing(false);
      if(next.preferredTakeId){
        setAlignment(await ep002CreativeVoiceApi.alignmentState(shot.shotKey));
      }else{
        setAlignment(null);
      }
    }catch(cause){setError(String(cause));}
    finally{setLoading(false);}
  }

  const allCurrent=state?.takes.filter(t=>t.revision===state.revision)??[];
  return <div className="creative-voice-editor">
    <div className="creative-editor-heading">
      <h3>HEAR — narration</h3>
      <span>{state?.revision?'Saved v'+state.revision:'Original approved v4.0 source'}
        {state?.voiceApproved&&<b className="creative-approved"><CheckCircle2 size={15}/> VOICE APPROVED</b>}
      </span>
    </div>
    {!editing?<div className="library-verbatim creative-narration">{text}</div>
      :<div className="creative-edit-form">
        <label htmlFor={'edit-'+shot.shotKey}>Edit narration — you can change it any time</label>
        <textarea id={'edit-'+shot.shotKey} value={text} maxLength={5000}
          onChange={event=>setText(event.target.value)} rows={11}/>
        <label htmlFor={'direction-'+shot.shotKey}>Voice direction</label>
        <textarea id={'direction-'+shot.shotKey} value={direction} maxLength={1200}
          onChange={event=>setDirection(event.target.value)} rows={3}/>
        <div className="creative-action-row">
          <button type="button" className="library-voice-button" onClick={()=>void save()}
            disabled={busy||loading||!isDirty||!text.trim()}>
            <Save size={17}/> Save
          </button>
          <button type="button" className="library-voice-button secondary" onClick={()=>{
            setText(state?.narration??shot.englishNarration);
            setDirection(state?.voiceDirection??shot.voiceDirection);
            setEditing(false);
          }} disabled={busy}>Cancel</button>
          <button type="button" className="library-voice-button secondary" disabled={busy}
            onClick={()=>{setText(shot.englishNarration);setDirection(shot.voiceDirection);}}>
            Restore original text
          </button>
        </div>
      </div>}
    {!editing&&<div className="creative-action-row">
      <button type="button" className="library-voice-button secondary" disabled={busy||loading}
        onClick={()=>{setConfirming(false);setSlowConfirming(false);setEditing(true);}}>
        <Pencil size={17}/> Edit script
      </button>
      <button type="button" className="library-voice-button" disabled={busy||loading||!state?.canGenerate}
        onClick={()=>{setSlowConfirming(false);setConfirming(true);}}>{generateLabel}</button>
      {shot.shotKey==='SHOT02'&&<button type="button"
        className="library-voice-button" disabled={busy||loading||!state?.canGenerateSlow}
        onClick={()=>{setConfirming(false);setSlowConfirming(true);}}>
        Generate Slow Natural Take
      </button>}
      <span className="library-voice-count">{allCurrent.length} current take(s) · {state?.takes.length??0} total in history</span>
    </div>}
    {confirming&&state&&<div className="library-voice-confirm" role="group">
      <p><strong>Generate voice for saved version {state.revision}?</strong> This sends one paid ElevenLabs request.
      You can cancel and keep editing. Previous audio will not be replaced.</p>
      <div className="library-voice-confirm-buttons">
        <button type="button" className="library-voice-button secondary" disabled={busy}
          onClick={()=>setConfirming(false)}>No, keep saved text</button>
        <button type="button" className="library-voice-button" disabled={busy||!state.canGenerate||isDirty}
          onClick={()=>void generate('standard')}>Yes, {generateLabel} (paid)</button>
      </div>
    </div>}
    {slowConfirming&&state&&shot.shotKey==='SHOT02'&&<div
      className="library-voice-confirm" role="group" aria-label="Confirm paid slower voice">
      <p><strong>Generate one NEW SHOT02 voice recording with slower delivery?</strong>
        {' '}This sends one paid ElevenLabs v4 request using the exact same 115 spoken
        words from the locked Director script. The voice uses {state.slowVoicePauseCount??15}
        {' '}natural timing tags, including {state.slowVoiceLongPauseCount??7} long pauses.
        Actual pause duration is decided by ElevenLabs, so listen before approval.
        The original recording, approval and script remain unchanged.</p>
      <div className="library-voice-confirm-buttons">
        <button type="button" className="library-voice-button secondary" disabled={busy}
          onClick={()=>setSlowConfirming(false)}>Cancel</button>
        <button type="button" className="library-voice-button"
          disabled={busy||!state.canGenerateSlow||isDirty}
          onClick={()=>void generate('slow')}>Yes, generate one Slow Natural Take (paid)</button>
      </div>
    </div>}
    {!editing&&<div className="creative-direction"><strong>Voice direction</strong>
      <p>{direction}</p></div>}
    {state?.blockedReason&&<p role="status" className="library-voice-blocker">{state.blockedReason}</p>}
    {state&&state.takes.length>0&&<div className="library-voice-takes">
      <h4>Recordings · saved history</h4>
      {state.takes.map(take=><div key={take.id}
        className={'library-voice-take'+(take.approvedAt?' approved':'')}>
        <div className="library-voice-take-info">
          <strong>Take {take.takeNumber} · text v{take.revision}</strong>
          {take.deliveryMode==='ELEVEN_V4_SLOW_NATURAL_PAUSES_V1'&&
            <span>SLOW NATURAL · original words</span>}
          {take.id===state.preferredTakeId&&<span><CheckCircle2 size={15}/> PREFERRED</span>}
          {take.approvedAt&&take.id!==state.preferredTakeId&&<span>Previously selected</span>}
          {take.restoredFromTakeNumber!=null&&<span>Audio restored from Take {take.restoredFromTakeNumber}</span>}
          {take.revision!==state.revision&&<span>Earlier version</span>}
        </div>
        <audio preload="none" ref={audio=>{audioRefs.current[take.id]=audio;}}
          src={ep002CreativeVoiceApi.audio(shot.shotKey,take.id)}
          onEnded={()=>setPlaying(old=>old===take.id?null:old)}/>
        <div className="library-voice-take-controls">
          <button type="button" className="library-voice-button secondary" disabled={busy}
            onClick={()=>void play(take.id)}>
            {playing===take.id?<><Pause size={16}/> Stop record</>:<><Play size={16}/> Start record</>}
          </button>
          {take.id===state.preferredTakeId && take.revision===state.revision&&alignment&&
            <div className="library-voice-alignment">
              {alignment.alignmentPresent
                ? <p role="status">Voice timestamps saved. Remotion can use the original recording without regeneration.</p>
                : <>
                  <p>Existing recording: precise word timestamps are not stored.
                    Forced Alignment analyzes this MP3 and the saved transcript without generating new audio.
                    <strong> ElevenLabs bills this as a separate paid operation.</strong></p>
                  {alignment.reason&&<p role="status">{alignment.reason}</p>}
                  {alignment.lastAttemptAt&&
                    <p className="library-voice-alignment-history">
                      Last alignment request: {new Date(alignment.lastAttemptAt).toLocaleString()}
                      {' · '}Status: {alignment.paidRequestStatus}
                      {alignment.lastFailureCategory?' · Diagnostic: '+alignment.lastFailureCategory:''}
                    </p>}
                  {alignment.paidRequestStatus==='UNCERTAIN'&&
                    <p>To reconcile this request, check ElevenLabs → Developers → Request Log
                      for the same date and time. Review the Forced Alignment response and credit usage
                      before any new paid attempt.</p>}
                  {alignment.canAlign&&!alignmentConfirming&&
                    <button type="button" className="library-voice-button secondary"
                      disabled={busy||isDirty} onClick={()=>setAlignmentConfirming(true)}>
                      Align Existing Take
                    </button>}
                  {alignment.canAlign&&alignmentConfirming&&
                    <div className="library-voice-confirm" role="group">
                      <p><strong>Confirm paid Forced Alignment for Take {take.takeNumber}?</strong>
                        This sends the current MP3 and matching narration to ElevenLabs.
                        It is billed at the current Speech-to-Text rate. No new TTS recording is made.
                        If the result is uncertain, MediaOS will block automatic retry.</p>
                      <div className="library-voice-confirm-buttons">
                        <button type="button" className="library-voice-button secondary"
                          disabled={busy} onClick={()=>setAlignmentConfirming(false)}>Cancel</button>
                        <button type="button" className="library-voice-button"
                          disabled={busy||isDirty} onClick={()=>void alignPreferredTake()}>
                          Yes, align this existing take (paid)
                        </button>
                      </div>
                    </div>}
                </>}
            </div>}
          {take.id!==state.preferredTakeId && take.revision===state.revision &&
            <button type="button" className="library-voice-button secondary" disabled={busy||isDirty}
              onClick={()=>void approve(take.id)}>Use this take</button>}
          {shot.shotKey==='SHOT01'&&state.revision>take.revision&&
            <button type="button" className="library-voice-button secondary"
              disabled={busy||loading||isDirty}
              onClick={()=>void restoreOlderTake(take.id,take.takeNumber,take.revision)}>
              Restore &amp; use Take {take.takeNumber} · no TTS
            </button>}
        </div>
      </div>)}
    </div>}
    <button type="button" className="library-voice-refresh" disabled={busy||loading}
      onClick={()=>void refresh()}><RotateCcw size={14}/> Refresh</button>
    {error&&<p role="alert" className="library-voice-error">{error}</p>}
    {notice&&<p role="status" className="library-voice-ok">{notice}</p>}
    {loading&&<p>Loading saved versions…</p>}
  </div>;
}
