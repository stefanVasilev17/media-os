import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { listEpisodeWorkspaces, type EpisodeSummary } from '../api/episodeWorkspaceApi';
import { episodeDirectorRoute } from '../api/episodeDirectorApi';
import { ep001, ep002 } from '../lib/episodeProductionLibrary';
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
        <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
          <button type="button" className="episode-selector-create"
            onClick={() => { window.location.hash = '#/episode-packages/import'; }}>Import Episode Package</button>
          <button type="button" className="episode-selector-create"
            onClick={() => { window.location.hash = '#/episodes/new'; }}>+ New Episode</button>
        </div>
      </header>
      {error && <p role="alert" className="episode-hub-error">{error}</p>}
      {busy && <p className="episode-selector-message">Loading episodes…</p>}
      {!busy && episodes.length === 0 &&
        <p className="episode-selector-message">No native production episodes found. The approved source library is still available.</p>}
      <section className="episode-selector-list" aria-label="Choose an episode">
        <button type="button" className="episode-selector-row" onClick={() => {window.location.hash='#/library/EP001';}}>
          <span className="episode-selector-id">EP001</span>
          <span className="episode-selector-name"><strong>{ep001.title}</strong><small>Current 12-SHOT production · LOCKED sources, voice and videos</small></span>
          <ArrowRight size={22} aria-hidden="true"/>
        </button>
        <button type="button" className="episode-selector-row" onClick={() => {window.location.hash='#/library/EP002';}}>
          <span className="episode-selector-id">EP002</span>
          <span className="episode-selector-name"><strong>{ep002.title}</strong><small>{episodes.some(row=>row.episodeNumber==='EP002')?'Production workspace +':'Source library · not yet registered in production'} · 11 locked script SHOTs / 59 approved visual beats</small></span>
          <ArrowRight size={22} aria-hidden="true"/>
        </button>
        {[...episodes].filter(episode => !['EP001','EP002'].includes(episode.episodeNumber))
          .sort((a, b) => b.episodeNumber.localeCompare(a.episodeNumber, undefined, { numeric: true }))
          .map(episode => (
          <button type="button"
            className={episode.fullyLocked ? 'episode-selector-row fully-locked' : 'episode-selector-row'}
            aria-label={episode.episodeNumber + ' — ' + episode.title + (episode.fullyLocked ? ', fully locked' : '')}
            key={episode.id}
            onClick={() => {
              window.location.hash = episode.hasBrief === true
                && ['RESEARCH','SCRIPT','SCENE'].includes(episode.currentStage)
                  ? '#/episodes/' + episode.id + '/prepare'
                  : episodeDirectorRoute(episode.id);
            }}>
            <span className="episode-selector-id">{episode.episodeNumber}</span>
            <strong>{episode.title}</strong>
            <ArrowRight size={22} aria-hidden="true"/>
          </button>
        ))}
      </section>
    </main>
  );
}
