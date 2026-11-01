import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { episodeDirectorRoute, shotRevisionRoute } from '../api/episodeDirectorApi';
import { episodeRevisionVoiceApi, type EpisodeRevisionVoice } from '../api/episodeRevisionVoiceApi';
import { ActiveRuleStudioRules } from '../components/ActiveRuleStudioRules';
import '../styles/episodeDirectorHub.css';
import '../styles/episodeVoiceQuiet.css';

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
      setError(cause instanceof Error ? cause.message : 'Could not load Voice production.');
    } finally { setLoading(false); }
  }

  useEffect(() => {
    setVoice(null);
    setLoading(true);
    setNotice('');
    void load();
  }, [episodeId, shotKey]);

  async function execute(work: () => Promise<EpisodeRevisionVoice>, success: string) {
    if (busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      setVoice(await work());
      setNotice(success);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally { setBusy(false); }
  }

  return (
    <main className="media-os-page episode-hub voice-quiet">
      <nav className="voice-quiet-nav" aria-label="Voice navigation">
        <button type="button" onClick={() => {
          window.location.hash = shotRevisionRoute(episodeId, shotKey);
        }}><ArrowLeft size={18} /> Revision Chat</button>
        <button type="button" onClick={() => {
          window.location.hash = episodeDirectorRoute(episodeId);
        }}>Director</button>
      </nav>
      {error && <p role="alert" className="episode-hub-error">{error}</p>}
      {notice && <p role="status" className="voice-quiet-notice">{notice}</p>}
      {loading && <p className="voice-quiet-notice">Loading…</p>}
      {voice && <>
        <header className="voice-quiet-header">
          <h1>{voice.episodeNumber} / {shotKey} / Voice</h1>
          <p className={voice.voiceApproved ? 'voice-quiet-locked' : 'voice-quiet-pending'}>
            {voice.voiceApproved ? 'Locked' : 'Pending'}
          </p>
        </header>

        {voice.episodeNumber === 'EP002' && (
          <p role="status" className="voice-quiet-notice">
            {voice.ep001VoiceIdentityVerified
              ? 'EP001 narrator identity verified: same ElevenLabs voice and model. Final accent and delivery still require listening review.'
              : 'EP001 narrator identity is not verified. Generation is blocked until the EP001 reference matches.'}
          </p>
        )}
        <section className="voice-quiet-narration">
          <h2>Narration</h2>
          <p>{voice.narration}</p>
          {voice.voiceDirection && <>
            <h2>Voice direction</h2>
            <p>{voice.voiceDirection}</p>
          </>}
          <div className="voice-quiet-actions">
            <button type="button" className="voice-quiet-primary"
              disabled={busy || !voice.canGenerate}
              onClick={() => {
                if (!window.confirm('This action sends a paid ElevenLabs request for one SHOT. Continue?')) return;
                const requestId = crypto.randomUUID();
                void execute(
                  () => episodeRevisionVoiceApi.generate(episodeId, shotKey, voice.shotRevision, requestId),
                  'New take ready for review.'
                );
              }}>Generate with ElevenLabs</button>
            {voice.episodeNumber === 'EP002' && voice.generationStatus
              && voice.generationStatus !== 'NONE' && (
                <p role="status" className="voice-quiet-notice">
                  Latest ElevenLabs request: {voice.generationStatus}.
                </p>
              )}
            {voice.blockedReason && <p role="status" className="voice-quiet-notice">
              {voice.blockedReason}
            </p>}
            {!voice.configured && <p role="status" className="voice-quiet-notice">
              ElevenLabs is not connected.
            </p>}
          </div>
        </section>

        <section className="voice-quiet-takes">
          <h2>Takes</h2>
          {voice.takes.length === 0 && <p>No takes generated.</p>}
          {voice.takes.map(take => (
            <article className="voice-quiet-take" key={take.id}>
              <div className="voice-quiet-take-heading">
                <h3>Take {take.takeNumber}</h3>
                {take.approvedAt && <span className="voice-quiet-locked">Locked</span>}
              </div>
              <audio controls preload="none" src={episodeRevisionVoiceApi.audio(episodeId, shotKey, take.id)} />
              {!voice.voiceApproved && <button type="button" className="voice-quiet-primary"
                disabled={busy}
                onClick={() => void execute(
                  () => episodeRevisionVoiceApi.approve(episodeId, shotKey, voice.shotRevision, take.id),
                  'Voice approved.'
                )}>Approve this take</button>}
            </article>
          ))}
        </section>
        <ActiveRuleStudioRules episodeId={episodeId} scope="VOICE" />
      </>}
    </main>
  );
}
