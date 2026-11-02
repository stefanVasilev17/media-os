import {useState} from 'react';
import {Mic2} from 'lucide-react';
import {episodeRevisionVoiceApi, type EpisodeRevisionVoice} from '../api/episodeRevisionVoiceApi';
import {nativeShotKey, voiceGenerationBlocker} from '../lib/ep002VoiceReadiness';

type Props = {
  shot: {shotKey:string;title:string;englishNarration:string;wordCount:number};
  episodeId?: string;
};

export function Ep002VoiceActions({shot,episodeId}:Props) {
  const [voice,setVoice] = useState<EpisodeRevisionVoice|null>(null);
  const [loading,setLoading] = useState(false);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const [notice,setNotice] = useState('');
  const shotKey = nativeShotKey(shot.shotKey);
  const blocker = voice ? voiceGenerationBlocker(voice,shot) : null;

  async function inspect() {
    if (!episodeId || loading || busy) return;
    setLoading(true);
    setError('');
    try {
      setVoice(await episodeRevisionVoiceApi.state(episodeId,shotKey));
    } catch(cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setLoading(false);
    }
  }

  async function generate() {
    if (!episodeId || !voice || blocker || busy || loading) return;
    if (!window.confirm(
      'Paid ElevenLabs generation for '+shot.shotKey+' — '+shot.wordCount
      +' Director-locked English words. This creates ONE take using your configured EP001 voice. No other SHOT will be generated. Continue?'
    )) return;
    const requestId = crypto.randomUUID();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      setVoice(await episodeRevisionVoiceApi.generate(episodeId,shotKey,voice.shotRevision,requestId));
      setNotice('Voice take generated. Listen and approve it separately.');
    } catch (cause) {
      setError((cause instanceof Error ? cause.message : String(cause))
        + ' Do not retry a failed/uncertain paid request until its ledger status is checked.');
    } finally {
      setBusy(false);
    }
  }

  async function approve(takeId:string) {
    if (!episodeId || !voice || busy || voice.voiceApproved) return;
    if (!window.confirm('Approve this exact voice take for '+shot.shotKey+'? This is a Director LOCK.')) return;
    setBusy(true);
    setError('');
    try {
      setVoice(await episodeRevisionVoiceApi.approve(episodeId,shotKey,voice.shotRevision,takeId));
      setNotice('Voice take Director-approved. No additional ElevenLabs call was made.');
    } catch(cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {setBusy(false);}
  }

  return <section className="library-voice-actions" aria-label={shot.shotKey+' voice production'}>
    <h3><Mic2 size={18}/> ElevenLabs Voice Studio</h3>
    {!episodeId ? <>
      <p>Approved Script and Visual Pass are available in this library. Voice generation first requires a native EP002 production workspace and separate stage approvals. No credits will be spent during setup.</p>
      <a className="library-primary-link" href="#/episodes/new?template=EP002">Set up EP002 for Voice</a>
    </> : <>
      {!voice && <button type="button" className="library-voice-button"
        disabled={loading || busy} onClick={() => void inspect()}>
        {loading ? 'Checking Voice readiness…' : 'Check Voice / Generate for '+shot.shotKey}
      </button>}
      {voice && <>
        <p><strong>Source:</strong> {voice.source === 'DIRECTOR_LOCKED_ORIGINAL_SCRIPT' || voice.shotRevision===0
          ? 'Original locked Script' : 'Approved SHOT revision'} · <strong>Voice model:</strong> {voice.voiceModel || 'Not configured'} · <strong>Takes:</strong> {voice.takes.length}</p>
        <p><strong>EP001 voice identity:</strong> {voice.ep001VoiceIdentityVerified ? 'Verified' : 'Not verified'} ·
          <strong> Generation:</strong> {voice.generationStatus || 'Not started'}</p>
        {blocker
          ? <p role="status" className="library-voice-blocker">{blocker}</p>
          : <button type="button" className="library-voice-button" disabled={busy || loading}
              onClick={() => void generate()}>{busy ? 'Processing…' : 'Generate Voice with ElevenLabs · paid'}</button>}
        {voice.takes.length>0 && <div className="library-voice-takes">
          {voice.takes.map(take=><div key={take.id} className="library-voice-take">
            <strong>Take {take.takeNumber} {take.approvedAt?'· LOCKED':''}</strong>
            <audio controls preload="none" src={episodeRevisionVoiceApi.audio(episodeId,shotKey,take.id)}/>
            {!voice.voiceApproved && !blocker?.includes('differs from') &&
              <button type="button" className="library-voice-button secondary" disabled={busy || loading}
                onClick={() => void approve(take.id)}>Approve this take</button>}
          </div>)}
        </div>}
        <button type="button" className="library-voice-button secondary"
          disabled={busy || loading} onClick={() => void inspect()}>Refresh Voice Status</button>
      </>}
      {(!voice || Boolean(voice.blockedReason)) &&
        <a className="library-voice-setup" href={'#/episodes/'+episodeId+'/prepare'}>
          Review Research / Script / Visual Plan stage LOCKs
        </a>}
    </>}
    {error && <p role="alert" className="library-voice-error">{error}</p>}
    {notice && <p role="status" className="library-voice-ok">{notice}</p>}
  </section>;
}
