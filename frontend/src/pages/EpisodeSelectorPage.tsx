import { useEffect, useState } from 'react';
import { ArrowRight, FolderOpen, LoaderCircle, RefreshCw, BookOpenCheck } from 'lucide-react';
import { listEpisodeWorkspaces, type EpisodeSummary } from '../api/episodeWorkspaceApi';
import { episodeDirectorRoute } from '../api/episodeDirectorApi';
import '../styles/episodeDirectorHub.css';

export function EpisodeSelectorPage() {
  const [episodes, setEpisodes] = useState<EpisodeSummary[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');

  async function refresh() {
    setBusy(true);
    setError('');
    try {
      setEpisodes(await listEpisodeWorkspaces());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not open episode catalog.');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { void refresh(); }, []);

  return (
    <main className="media-os-page episode-hub">
      <header className="episode-hub-header">
        <div>
          <span>ARCHITECTURAL THINKING / MEDIAOS</span>
          <h1>Choose an episode</h1>
          <p>Each video has its own Script, Voice, Visual, approvals and Director overview.</p>
        </div>
        <button type="button" className="episode-hub-secondary" onClick={() => void refresh()}>
          <RefreshCw size={16} /> Refresh
        </button>
      </header>
      {error && <p role="alert" className="episode-hub-error">{error}</p>}
      {busy && <p className="episode-hub-loading"><LoaderCircle size={18} className="spin" /> Loading episodes…</p>}
      {!busy && episodes.length === 0 && (
        <div className="episode-hub-empty">No episode workspace is registered yet. New episodes must be created through the audited Director workflow.</div>
      )}
      <section className="episode-hub-grid" aria-label="Available episodes">
        {episodes.map(episode => (
          <button
            type="button"
            key={episode.id}
            className="episode-hub-choice"
            onClick={() => { window.location.hash = episodeDirectorRoute(episode.id); }}
          >
            <div className="episode-hub-choice-top">
              <span className="episode-hub-number">{episode.episodeNumber}</span>
              <ArrowRight size={18} />
            </div>
            <FolderOpen size={24} aria-hidden="true" />
            <strong>{episode.title}</strong>
            <span className="episode-hub-meta">Current stage: {episode.currentStage} · {episode.status}</span>
            <span className="episode-hub-open">Open Director Overview</span>
          </button>
        ))}
      </section>
      <div style={{ marginTop: 24 }}>
        <button type="button" className="episode-hub-secondary"
          onClick={() => { window.location.hash = '#/memory-import'; }}>
          <BookOpenCheck size={17} /> Production Memory — Import & Review
        </button>
      </div>
      <p className="episode-hub-footnote">
        Only episodes registered in MediaOS appear here. Opening an episode never creates or imports another episode's assets.
      </p>
    </main>
  );
}
