import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { getEpisodeDirectorOverview, episodeShotRoute, shotRevisionRoute, type EpisodeDirectorOverview } from '../api/episodeDirectorApi';
import '../styles/episodeDirectorHub.css';
import '../styles/episodeDirectorQuiet.css';

function Status({ state }: { state: string }) {
  const locked = state === 'LOCKED';
  return <span className={locked ? 'director-status-locked' : 'director-status-pending'}>
    {locked ? 'Locked' : 'Pending'}
  </span>;
}

export function EpisodeDirectorPage({ episodeId }: { episodeId: string }) {
  const [overview, setOverview] = useState<EpisodeDirectorOverview | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');

  async function refresh() {
    setBusy(true);
    setError('');
    try {
      setOverview(await getEpisodeDirectorOverview(episodeId));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not open Director Overview.');
      setOverview(null);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { void refresh(); }, [episodeId]);

  return (
    <main className="media-os-page episode-hub director-quiet">
      <nav className="director-quiet-topbar" aria-label="Director navigation">
        <button type="button" onClick={() => { window.location.hash = '#/episodes'; }}>
          <ArrowLeft size={18} /> Episodes
        </button>
        <div className="director-quiet-header-actions">
          {overview?.legacyEpisode && <details className="director-quiet-tools">
            <summary>Tools</summary>
            <div className="director-quiet-tools-menu">
              <button type="button" onClick={() => { window.location.hash = '#/studio?episodeId=' + episodeId; }}>Shot Studio</button>
              <button type="button" onClick={() => { window.location.hash = '#/agents/script?episodeId=' + episodeId; }}>Script</button>
              <button type="button" onClick={() => { window.location.hash = '#/agents/visual?episodeId=' + episodeId; }}>Visual</button>
              <button type="button" onClick={() => { window.location.hash = '#/agents/voice?episodeId=' + episodeId; }}>Voice</button>
            </div>
          </details>}
          <button type="button" disabled={busy} onClick={() => void refresh()}>Refresh</button>
        </div>
      </nav>

      {error && <p role="alert" className="episode-hub-error">{error}</p>}
      {busy && <p className="director-quiet-loading">Loading…</p>}

      {overview && <div>
        <header className="director-quiet-header">
          <h1>{overview.episode.episodeNumber} — {overview.episode.title}</h1>
          <p>
            {overview.counts.voiceLocked} of {overview.counts.total} Voice locked
            <span aria-hidden="true"> · </span>
            {overview.counts.videoLocked} of {overview.counts.total} Video locked
          </p>
        </header>

        <section className="director-quiet-shots" aria-label="Shots">
          <h2>Shots</h2>
          {overview.shots.length === 0 && <p>No shots have been added.</p>}
          {overview.shots.map(shot => (
            <article className="director-quiet-shot" key={shot.shotKey}>
              <div className="director-quiet-shot-name">
                <strong>{shot.shotKey}</strong>
                <span>{shot.title}</span>
              </div>
              <div className="director-quiet-shot-actions">
                <button type="button"
                  disabled={!overview.stages.some(stage => stage.stageKey === 'SCRIPT' && stage.status === 'LOCKED')}
                  title={!overview.stages.some(stage => stage.stageKey === 'SCRIPT' && stage.status === 'LOCKED')
                    ? 'Director-LOCK the Script before revising this shot' : undefined}
                  onClick={() => { window.location.hash = shotRevisionRoute(episodeId, shot.shotKey); }}>
                  Edit{shot.shotRevision > 0 ? ' v' + shot.shotRevision : ''}
                </button>
                <button type="button"
                  onClick={() => {
                    window.location.hash = episodeShotRoute(
                      episodeId, overview.legacyEpisode, 'voice', shot.shotKey, shot.shotRevision > 0);
                  }}>
                  <span>Voice</span><Status state={shot.voiceStatus} /><ArrowRight size={17} />
                </button>
                <button type="button"
                  onClick={() => {
                    window.location.hash = episodeShotRoute(
                      episodeId, overview.legacyEpisode, 'video', shot.shotKey, shot.shotRevision > 0);
                  }}>
                  <span>Video</span><Status state={shot.videoStatus} /><ArrowRight size={17} />
                </button>
              </div>
            </article>
          ))}
        </section>

        <details className="director-quiet-details">
          <summary>Production stages</summary>
          {overview.stages.map(stage => (
            <div key={stage.stageKey}>
              <span>{stage.displayName}</span>
              <Status state={stage.status}/>
            </div>
          ))}
        </details>
      </div>}
    </main>
  );
}
