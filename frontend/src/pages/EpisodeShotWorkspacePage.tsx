import { useEffect, useState } from 'react';
import { ArrowLeft, Clapperboard, Mic2 } from 'lucide-react';
import { episodeDirectorRoute, shotRevisionRoute, getEpisodeDirectorOverview, type EpisodeDirectorOverview } from '../api/episodeDirectorApi';
import '../styles/episodeDirectorHub.css';

export function EpisodeShotWorkspacePage({
  episodeId,
  kind,
  shotKey
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
  const label = kind === 'voice' ? 'Voice' : 'Video';

  return (
    <main className="media-os-page episode-hub">
      <header className="episode-hub-header">
        <div>
          <button className="episode-hub-back" type="button" onClick={() => { window.location.hash = episodeDirectorRoute(episodeId); }}>
            <ArrowLeft size={15} /> Director Overview
          </button>
          <span>{overview?.episode.episodeNumber || 'EPISODE'} / {label.toUpperCase()}</span>
          <h1>{shotKey || 'Choose a shot'}</h1>
          <p>{overview?.episode.title || 'Opening this episode…'}</p>
        </div>
        {kind === 'voice' ? <Mic2 size={28} /> : <Clapperboard size={28} />}
      </header>
      {error && <p role="alert" className="episode-hub-error">{error}</p>}
      {overview && !shot && (
        <div className="episode-hub-empty">This shot does not exist in {overview.episode.episodeNumber}. Nothing from another episode will be shown.</div>
      )}
      {shot && (
        <>
          <section className="episode-hub-stats">
            <div><span>Episode</span><strong>{overview?.episode.episodeNumber}</strong></div>
            <div><span>Shot</span><strong>{shot.shotKey}</strong></div>
            <div><span>{label} status</span><strong>{kind === 'voice' ? shot.voiceStatus : shot.videoStatus}</strong></div>
          </section>
          <section className="episode-hub-section">
            <h2>{shot.title}</h2>
            {shot.shotRevision > 0 && <p className="shot-revision-notice">
              Director-LOCKED shot revision v{shot.shotRevision} is active. This corrected text is now the
              Voice/Video handoff. Previous generated media is preserved and needs new approval.
            </p>}
            {kind === 'voice' && shot.shotRevision > 0 && <div className="episode-hub-empty">
              <strong>Updated voice direction:</strong> {shot.voiceDirection || 'Calm, conversational, confident'}
            </div>}
            {kind === 'video' && <div className="episode-hub-empty" style={{ whiteSpace: 'pre-wrap' }}>
              {shot.visualDirection || 'No Director-LOCKED visual revision has been published for this shot yet.'}
            </div>}
            {kind === 'voice' && <div className="episode-hub-empty" style={{ whiteSpace: 'pre-wrap' }}>
              {shot.narration || 'No episode-specific locked narration has been imported into MediaOS yet.'}
            </div>}
          </section>
          <div className="shot-revision-actions" style={{ marginTop: 14 }}>
            <button type="button" onClick={() => { window.location.hash = shotRevisionRoute(episodeId, shotKey); }}>
              Open Revision Chat
            </button>
          </div>
          <div className="episode-hub-empty" style={{ marginTop: 20 }}>
            {label} generation and Director approval for this episode are not enabled yet.
            This isolated workspace does not use the EP001 production API. The next platform phase will add
            episode-scoped generation and secure Director LOCK actions.
          </div>
        </>
      )}
    </main>
  );
}
