import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, CircleDot, Headphones, LoaderCircle, Mic2, RefreshCw } from 'lucide-react';
import { episodeDirectorRoute, shotRevisionRoute } from '../api/episodeDirectorApi';
import { episodeRevisionVoiceApi, type EpisodeRevisionVoice } from '../api/episodeRevisionVoiceApi';
import { ActiveRuleStudioRules } from '../components/ActiveRuleStudioRules';
import '../styles/episodeDirectorHub.css';
import '../styles/shotRevisionAgent.css';

export function EpisodeRevisionVoicePage({ episodeId, shotKey }: { episodeId: string; shotKey: string }) {
  const [voice, setVoice] = useState<EpisodeRevisionVoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function load() {
    setError('');
    try {
      setVoice(await episodeRevisionVoiceApi.state(episodeId, shotKey));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not read approved voice script.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setVoice(null);
    setLoading(true);
    setNotice('');
    void load();
  }, [episodeId, shotKey]);

  async function execute(action: () => Promise<EpisodeRevisionVoice>, success: string) {
    if (busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      setVoice(await action());
      setNotice(success);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="media-os-page episode-hub shot-revision">
      <header className="episode-hub-header">
        <div>
          <button className="episode-hub-back" type="button" onClick={() => {
            window.location.hash = shotRevisionRoute(episodeId, shotKey);
          }}><ArrowLeft size={15} /> Revision Chat</button>
          <span>{voice?.episodeNumber || 'EPISODE'} / VOICE AGENT / {shotKey}</span>
          <h1><Mic2 size={24} style={{ verticalAlign: 'middle' }} /> ElevenLabs Voice Production</h1>
          <p>The exact Director-approved narration is loaded automatically. Generate, listen and approve a take for this revision.</p>
        </div>
        <button type="button" className="episode-hub-secondary" disabled={busy}
          onClick={() => void load()}><RefreshCw size={16} /> Refresh</button>
      </header>
      {loading && <p className="episode-hub-loading"><LoaderCircle className="spin" size={18} /> Opening Voice Agent…</p>}
      {error && <p role="alert" className="episode-hub-error">{error}</p>}
      {notice && <p role="status" className="shot-revision-notice">{notice}</p>}
      {voice && (
        <>
          <section className="episode-hub-stats">
            <div><span>Episode</span><strong>{voice.episodeNumber}</strong></div>
            <div><span>Script revision</span><strong>v{voice.shotRevision}</strong></div>
            <div><span>Voice</span><strong>{voice.voiceApproved ? 'APPROVED' : 'PENDING'}</strong></div>
          </section>
          <ActiveRuleStudioRules episodeId={episodeId} scope="VOICE" />
          <div className="shot-revision-layout">
            <section className="shot-revision-panel">
              <h2>Approved English narration</h2>
              <div className="episode-hub-empty" style={{ whiteSpace: 'pre-wrap' }}>
                {voice.narration}
              </div>
              <h2>Performance direction</h2>
              <p className="shot-revision-explain">{voice.voiceDirection || 'Calm, conversational, confident'}</p>
              <p className="shot-revision-explain">ElevenLabs model: {voice.voiceModel}. Generation uses the stored LOCKED narration, not an unsaved text field.</p>
              <button type="button" className="shot-revision-lock"
                disabled={busy || !voice.canGenerate}
                onClick={() => void execute(
                  () => episodeRevisionVoiceApi.generate(episodeId, shotKey, voice.shotRevision),
                  'New audio take generated. Listen to it before approving.'
                )}>
                {busy ? <LoaderCircle size={16} className="spin" /> : <Headphones size={16} />}
                Generate with ElevenLabs
              </button>
              {!voice.configured && <p className="shot-revision-explain">ElevenLabs is not configured in MediaOS.</p>}
              {voice.voiceApproved && <p className="shot-revision-notice">This revision has an approved voice. Another generation requires a new explicit shot revision.</p>}
            </section>
            <section className="shot-revision-panel">
              <h2>Listen and review takes</h2>
              {voice.takes.length === 0 && <div className="episode-hub-empty">No audio has been generated for this revision yet.</div>}
              {voice.takes.map(take => (
                <div className="episode-hub-empty" key={take.id}>
                  <div className="shot-revision-heading">
                    <strong>Take {take.takeNumber}</strong>
                    <span className={'episode-hub-status ' + (take.approvedAt ? 'locked' : 'pending')}>
                      {take.approvedAt ? <CheckCircle2 size={14} /> : <CircleDot size={14} />}
                      {take.approvedAt ? 'VOICE LOCKED' : 'PENDING REVIEW'}
                    </span>
                  </div>
                  <audio controls preload="none" style={{ width: '100%', marginTop: 12 }}
                    src={episodeRevisionVoiceApi.audio(episodeId, shotKey, take.id)} />
                  {!voice.voiceApproved && (
                    <button type="button" className="shot-revision-lock" disabled={busy}
                      onClick={() => void execute(
                        () => episodeRevisionVoiceApi.approve(episodeId, shotKey, voice.shotRevision, take.id),
                        'Director approved this exact audio take. The old recordings remain preserved.'
                      )}>
                      <CheckCircle2 size={16} /> Approve Voice Take {take.takeNumber}
                    </button>
                  )}
                  <p className="shot-revision-explain">Recorded for {voice.episodeNumber}, {shotKey}, revision v{voice.shotRevision}. {take.generatedAt}</p>
                </div>
              ))}
              {voice.voiceApproved && <button type="button" className="episode-hub-secondary"
                onClick={() => { window.location.hash = episodeDirectorRoute(episodeId); }}>
                Back to Director Overview
              </button>}
            </section>
          </div>
        </>
      )}
      {!loading && !voice && !error && <p className="episode-hub-empty">Approve the proposed narration in Revision Chat before voice production.</p>}
    </main>
  );
}
