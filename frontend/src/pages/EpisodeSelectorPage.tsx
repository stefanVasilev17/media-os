import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { listEpisodeWorkspaces, type EpisodeSummary } from '../api/episodeWorkspaceApi';
import { episodeDirectorRoute } from '../api/episodeDirectorApi';
import '../styles/episodeDirectorHub.css';
import '../styles/episodeSelectorQuiet.css';

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
      setError(cause instanceof Error ? cause.message : 'Could not load episodes.');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { void refresh(); }, []);

  return (
    <main className="media-os-page episode-hub episode-selector-quiet">
      <header className="episode-selector-header">
        <h1>Episodes</h1>
      </header>
      {error && <p role="alert" className="episode-hub-error">{error}</p>}
      {busy && <p className="episode-selector-message">Loading episodes…</p>}
      {!busy && episodes.length === 0 &&
        <p className="episode-selector-message">No episodes yet.</p>}
      <section className="episode-selector-list" aria-label="Choose an episode">
        {[...episodes]
          .sort((a, b) => b.episodeNumber.localeCompare(a.episodeNumber, undefined, { numeric: true }))
          .map(episode => (
          <button type="button"
            className={episode.fullyLocked ? 'episode-selector-row fully-locked' : 'episode-selector-row'}
            aria-label={episode.episodeNumber + ' — ' + episode.title + (episode.fullyLocked ? ', fully locked' : '')}
            key={episode.id}
            onClick={() => { window.location.hash = episodeDirectorRoute(episode.id); }}>
            <span className="episode-selector-id">{episode.episodeNumber}</span>
            <strong>{episode.title}</strong>
            <ArrowRight size={22} aria-hidden="true"/>
          </button>
        ))}
      </section>
    </main>
  );
}
