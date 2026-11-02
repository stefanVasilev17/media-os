import {useEffect, useRef, useState} from 'react';
import {CheckCircle2, Mic2, Pause, Play, RotateCcw} from 'lucide-react';
import {episodeRevisionVoiceApi, type EpisodeRevisionVoice} from '../api/episodeRevisionVoiceApi';
import {nativeShotKey, voiceGenerationBlocker} from '../lib/ep002VoiceReadiness';

export type ShotVoiceStatus = 'pending' | 'generated' | 'locked' | 'unavailable';

type Props = {
  shot: {shotKey:string;title:string;englishNarration:string;wordCount:number};
  episodeId?: string;
  onVoiceStatus: (shotKey:string,status:ShotVoiceStatus)=>void;
};

export function shotVoiceStatus(voice: EpisodeRevisionVoice): ShotVoiceStatus {
  if (voice.voiceApproved || voice.takes.some(take=>take.approvedAt !== null)) return 'locked';
  if (voice.takes.length) return 'generated';
  return 'pending';
}

export function Ep002VoiceActions({shot,episodeId,onVoiceStatus}:Props) {
  const [voice,setVoice] = useState<EpisodeRevisionVoice|null>(null);
  const [loading,setLoading] = useState(Boolean(episodeId));
  const [busy,setBusy] = useState(false);
  const [confirming,setConfirming] = useState(false);
  const [playingTakeId,setPlayingTakeId] = useState<string|null>(null);
  const [error,setError] = useState('');
  const [notice,setNotice] = useState('');
  const audioRefs = useRef<Record<string, HTMLAudioElement|null>>({});
  const shotKey = nativeShotKey(shot.shotKey);
  const blocker = voice ? voiceGenerationBlocker(voice,shot) : null;
  const hasTakes = Boolean(voice?.takes.length);
  const action = hasTakes ? 'Regenerate' : 'Generate';

  useEffect(()=>{
    let active=true;
    setVoice(null);
    setConfirming(false);
    setPlayingTakeId(null);
    setNotice('');
    setError('');
    if (!episodeId) {
      setLoading(false);
      onVoiceStatus(shot.shotKey,'unavailable');
      return;
    }
    setLoading(true);
    episodeRevisionVoiceApi.state(episodeId,shotKey)
      .then(result=>{
        if (!active) return;
        setVoice(result);
        onVoiceStatus(shot.shotKey,shotVoiceStatus(result));
      })
      .catch(cause=>{
        if (!active) return;
        onVoiceStatus(shot.shotKey,'unavailable');
        setError(cause instanceof Error ? cause.message : String(cause));
      })
      .finally(()=>{if(active)setLoading(false);});
    return ()=>{
      active=false;
      Object.values(audioRefs.current).forEach(element=>element?.pause());
    };
  },[episodeId,shotKey,shot.shotKey,onVoiceStatus]);

  function applyVoice(next:EpisodeRevisionVoice) {
    setVoice(next);
    onVoiceStatus(shot.shotKey,shotVoiceStatus(next));
  }

  async function refresh() {
    if (!episodeId || busy || loading) return;
    setLoading(true);
    setError('');
    try {
      applyVoice(await episodeRevisionVoiceApi.state(episodeId,shotKey));
    } catch(cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {setLoading(false);}
  }

  function stopPlayback() {
    Object.values(audioRefs.current).forEach(element=>{
      if (!element) return;
      element.pause();
      element.currentTime=0;
    });
    setPlayingTakeId(null);
  }

  async function togglePlayback(takeId:string) {
    const element=audioRefs.current[takeId];
    if (!element) return;
    if (playingTakeId===takeId) {
      stopPlayback();
      return;
    }
    stopPlayback();
    setError('');
    try {
      await element.play();
      setPlayingTakeId(takeId);
    } catch(cause) {
      setError('Audio could not be played: '+(cause instanceof Error ? cause.message : String(cause)));
    }
  }

  async function confirmGeneration() {
    if (!episodeId || !voice || blocker || busy || loading || !confirming) return;
    setConfirming(false);
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const fresh=await episodeRevisionVoiceApi.state(episodeId,shotKey);
      applyVoice(fresh);
      const currentBlocker=voiceGenerationBlocker(fresh,shot);
      if (currentBlocker) throw new Error(currentBlocker);
      const oldTakeIds=voice.takes.map(take=>take.id).join(',');
      const currentTakeIds=fresh.takes.map(take=>take.id).join(',');
      if (fresh.shotRevision!==voice.shotRevision || oldTakeIds!==currentTakeIds)
        throw new Error('Voice state changed while confirming. Review the latest take before another paid request.');
      const requestId=crypto.randomUUID();
      stopPlayback();
      applyVoice(await episodeRevisionVoiceApi.generate(episodeId,shotKey,fresh.shotRevision,requestId));
      setNotice('New take saved. Listen to it, then approve the exact take you want to keep.');
    } catch(cause) {
      setError((cause instanceof Error ? cause.message : String(cause))
        +' If a paid request may have started, check the ledger status before retrying.');
    } finally {setBusy(false);}
  }

  async function approveTake(takeId:string) {
    if (!episodeId || !voice || busy || loading || voice.voiceApproved) return;
    if (voice.narration!==shot.englishNarration) {
      setError('The production narration differs from Script v4.0. Approval is blocked.');
      return;
    }
    if (!window.confirm('Director LOCK: approve this exact voice take for '+shot.shotKey+'? This cannot be regenerated without a separate approved revision.')) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      stopPlayback();
      applyVoice(await episodeRevisionVoiceApi.approve(episodeId,shotKey,voice.shotRevision,takeId));
      setNotice('Voice take approved and LOCKED. No ElevenLabs credits were spent on approval.');
    } catch(cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {setBusy(false);}
  }

  return <section className={'library-voice-actions'+(voice?.voiceApproved?' library-voice-actions-locked':'')}
    aria-label={shot.shotKey+' inline voice controls'}>
    <h3><Mic2 size={18}/> Voice recording
      {voice?.voiceApproved && <span className="library-voice-locked-label"><CheckCircle2 size={16}/> VOICE LOCKED</span>}
    </h3>
    <div className="library-voice-main-row">
      <button type="button" className="library-voice-button"
        disabled={!episodeId || loading || busy || !voice || Boolean(blocker)}
        onClick={()=>{setConfirming(true);setError('');setNotice('');}}>
        {busy?'Processing…':loading?'Checking…':action}
      </button>
      <span className="library-voice-count">
        {!episodeId?'Native workspace required':loading?'Loading status…':
          voice ? voice.takes.length+' take'+(voice.takes.length===1?'':'s')+' · '+(voice.voiceApproved?'Approved':'Not approved')
            :'Status unavailable'}
      </span>
    </div>
    {confirming && !blocker && !busy && <div className="library-voice-confirm" role="group"
      aria-label={'Confirm paid '+action.toLowerCase()+' for '+shot.shotKey}>
      <p><strong>Confirm {action.toLowerCase()} for {shot.shotKey}?</strong> This will send one paid ElevenLabs request
        for {shot.wordCount} approved words. Existing takes remain available for comparison.
        No other SHOT will be generated.</p>
      <div className="library-voice-confirm-buttons">
        <button type="button" className="library-voice-button secondary" onClick={()=>setConfirming(false)}>Cancel</button>
        <button type="button" className="library-voice-button" onClick={()=>void confirmGeneration()}>
          Yes, {action} (paid)
        </button>
      </div>
    </div>}
    {!episodeId && <p className="library-voice-blocker">
      EP002 is not registered in the production database. The voice buttons remain disabled until
      the existing episode setup and native Research / Script / Visual Plan Director approvals are complete.
      <a className="library-voice-setup" href="#/episodes/new?template=EP002">Set up EP002</a>
    </p>}
    {blocker && <p role="status" className="library-voice-blocker">
      {blocker}{voice?.voiceApproved?' The approved voice cannot be overwritten.':''}
    </p>}
    {voice?.generationStatus && voice.generationStatus!=='NONE' &&
      <p className="library-note">Latest paid operation: {voice.generationStatus}</p>}
    {voice && voice.takes.length>0 && <div className="library-voice-takes">
      <h4>Recordings — start / stop playback</h4>
      {voice.takes.map(take=><div key={take.id} className={'library-voice-take'+(take.approvedAt?' approved':'')}>
        <div className="library-voice-take-info"><strong>Take {take.takeNumber}</strong>
          {take.approvedAt && <span><CheckCircle2 size={15}/> LOCKED</span>}
        </div>
        <audio preload="none" ref={element=>{audioRefs.current[take.id]=element;}}
          src={episodeRevisionVoiceApi.audio(episodeId!,shotKey,take.id)}
          onEnded={()=>setPlayingTakeId(current=>current===take.id?null:current)}
          onError={()=>{if(playingTakeId===take.id)setError('Audio playback failed. Refresh and try again.');}}/>
        <div className="library-voice-take-controls">
          <button type="button" className="library-voice-button secondary" disabled={busy || loading}
            onClick={()=>void togglePlayback(take.id)}>
            {playingTakeId===take.id?<><Pause size={16}/> Stop record</>:<><Play size={16}/> Start record</>}
          </button>
          {!voice.voiceApproved && <button type="button" className="library-voice-button secondary"
            disabled={busy || loading || voice.narration!==shot.englishNarration}
            onClick={()=>void approveTake(take.id)}>Approve take</button>}
        </div>
      </div>)}
    </div>}
    {episodeId && <button type="button" className="library-voice-refresh"
      disabled={busy || loading} onClick={()=>{stopPlayback();void refresh();}}>
      <RotateCcw size={14}/> Refresh voice status
    </button>}
    {episodeId && blocker && !voice?.voiceApproved &&
      <p><a className="library-voice-setup" href={'#/episodes/'+episodeId+'/prepare'}>
        Review missing native stage approvals</a></p>}
    {error && <p role="alert" className="library-voice-error">{error}</p>}
    {notice && <p role="status" className="library-voice-ok">{notice}</p>}
  </section>;
}
