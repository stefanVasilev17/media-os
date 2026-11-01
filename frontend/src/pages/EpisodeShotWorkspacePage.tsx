import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { episodeDirectorRoute, shotRevisionRoute, getEpisodeDirectorOverview, type EpisodeDirectorOverview } from '../api/episodeDirectorApi';
import { ActiveRuleStudioRules } from '../components/ActiveRuleStudioRules';
import '../styles/episodeDirectorHub.css';
import '../styles/episodeVoiceQuiet.css';

export function EpisodeShotWorkspacePage({
  episodeId, kind, shotKey
}: {
  episodeId: string;
  kind: 'voice' | 'video';
  shotKey: string;
}) {
  const [overview, setOverview] = useState<EpisodeDirectorOverview | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setOverview(null);
    setError('');
    getEpisodeDirectorOverview(episodeId)
      .then(data => { if (active) setOverview(data); })
      .catch(cause => { if (active) setError(cause instanceof Error ? cause.message : String(cause)); });
    return () => { active = false; };
  }, [episodeId]);

  const shot = overview?.shots.find(item => item.shotKey === shotKey);
  const name = kind === 'voice' ? 'Voice' : 'Video';
  const status = kind === 'voice' ? shot?.voiceStatus : shot?.videoStatus;

  return (
    <main className="media-os-page episode-hub voice-quiet">
      <nav className="voice-quiet-nav" aria-label="Shot navigation">
        <button type="button" onClick={() => { window.location.hash = episodeDirectorRoute(episodeId); }}>
          <ArrowLeft size={18} /> Director
        </button>
        <button type="button" onClick={() => {
          window.location.hash = shotRevisionRoute(episodeId, shotKey);
        }}>Revision Chat</button>
      </nav>
      {error && <p role="alert" className="episode-hub-error">{error}</p>}
      {overview && !shot && <p role="status" className="voice-quiet-notice">
        This shot does not exist in {overview.episode.episodeNumber}.
      </p>}
      {shot && <>
        <header className="voice-quiet-header">
          <h1>{overview?.episode.episodeNumber} / {shotKey} / {name}</h1>
          <p className={status === 'LOCKED' ? 'voice-quiet-locked' : 'voice-quiet-pending'}>
            {status === 'LOCKED' ? 'Locked' : 'Pending'}
          </p>
        </header>
        <section className="voice-quiet-narration">
          <h2>{shot.title}</h2>
          {kind === 'video' && shot.visualDirection && <p>{shot.visualDirection}</p>}
          {kind === 'voice' && shot.narration && <p>{shot.narration}</p>}
          {kind === 'voice' && shot.voiceDirection && <>
            <h2>Voice direction</h2>
            <p>{shot.voiceDirection}</p>
          </>}
          <p role="status" className="voice-quiet-notice">
            {name} generation is not available in this episode workspace yet.
          </p>
        </section>
        <ActiveRuleStudioRules episodeId={episodeId} scope={kind === 'voice' ? 'VOICE' : 'VISUAL'} />
      </>}
    </main>
  );
}
