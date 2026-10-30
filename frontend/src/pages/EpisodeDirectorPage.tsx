import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, CircleDot, Clapperboard, Mic2, RefreshCw, MessageSquareText } from 'lucide-react';
import { getEpisodeDirectorOverview, episodeShotRoute, shotRevisionRoute, type EpisodeDirectorOverview } from '../api/episodeDirectorApi';
import '../styles/episodeDirectorHub.css';

function Status({ state }: { state: string }) {
  const locked = state === 'LOCKED';
  return (
    <span className={'episode-hub-status ' + (locked ? 'locked' : 'pending')}>
      {locked ? <CheckCircle2 size={14} /> : <CircleDot size={14} />}
      {locked ? 'LOCKED' : 'PENDING'}
    </span>
  );
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
    <main className="media-os-page episode-hub">
      <header className="episode-hub-header">
        <div>
          <button className="episode-hub-back" type="button" onClick={() => { window.location.hash = '#/episodes'; }}>
            <ArrowLeft size={15} /> All episodes
          </button>
          <span>{overview?.episode.episodeNumber || 'EPISODE'} / DIRECTOR OVERVIEW</span>
          <h1>{overview?.episode.title || 'Opening episode…'}</h1>
          <p>Production decisions, each shot's actual Voice and Video status, and one-click navigation.</p>
        </div>
        <button type="button" className="episode-hub-secondary" onClick={() => void refresh()}>
          <RefreshCw size={16} /> Refresh
        </button>
      </header>
      {error && <p role="alert" className="episode-hub-error">{error}</p>}
      {busy && <p className="episode-hub-loading">Loading Director data…</p>}
      {overview && (
        <>
          <section className="episode-hub-stats" aria-label="Episode progress">
            <div><span>Shots</span><strong>{overview.counts.total}</strong></div>
            <div><span>Voice LOCKED</span><strong>{overview.counts.voiceLocked} / {overview.counts.total}</strong></div>
            <div><span>Video LOCKED</span><strong>{overview.counts.videoLocked} / {overview.counts.total}</strong></div>
          </section>
          <section className="episode-hub-section">
            <h2>Production stages</h2>
            <div className="episode-hub-stage-row">
              {overview.stages.map(stage => (
                <div className="episode-hub-stage" key={stage.stageKey}>
                  <span>{stage.displayName}</span>
                  <Status state={stage.status} />
                </div>
              ))}
            </div>
          </section>
          <section className="episode-hub-section">
            <div className="episode-hub-section-title">
              <h2>Shot-by-shot production</h2>
              <span>Green = Director-approved · Orange = pending</span>
            </div>
            {overview.shots.length === 0 && (
              <div className="episode-hub-empty">
                No shot data has been imported into this episode yet. A Script LOCK in a different tool does not automatically create MediaOS shot records.
              </div>
            )}
            <div className="episode-hub-shots">
              {overview.shots.map(shot => (
                <article className="episode-hub-shot" key={shot.shotKey}>
                  <div className="episode-hub-shot-title">
                    <strong>{shot.shotKey}</strong>
                    <span>{shot.title}</span>
                  <button type="button" className="episode-hub-revision-action"
                    onClick={() => { window.location.hash = shotRevisionRoute(episodeId, shot.shotKey); }}>
                    <MessageSquareText size={15} /> Revision Chat
                    {shot.shotRevision > 0 && <span>v{shot.shotRevision} LOCKED</span>}
                  </button>
                  </div>
                  <div className="episode-hub-shot-links">
                    <button
                      type="button"
                      className="episode-hub-action"
                      onClick={() => { window.location.hash = episodeShotRoute(episodeId, overview.legacyEpisode, 'voice', shot.shotKey, shot.shotRevision > 0); }}
                    >
                      <Mic2 size={16} />
                      <span>Voice</span>
                      <Status state={shot.voiceStatus} />
                      <ArrowRight size={15} />
                    </button>
                    <button
                      type="button"
                      className="episode-hub-action"
                      onClick={() => { window.location.hash = episodeShotRoute(episodeId, overview.legacyEpisode, 'video', shot.shotKey, shot.shotRevision > 0); }}
                    >
                      <Clapperboard size={16} />
                      <span>Video</span>
                      <Status state={shot.videoStatus} />
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
          {!overview.voiceVideoWriteReady && (
            <p className="episode-hub-footnote">
              This episode's Voice and Video production require episode-scoped runtimes. EP001 generation controls cannot be reused across episodes.
            </p>
          )}
        </>
      )}
    </main>
  );
}
