import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { listEpisodeWorkspaces, type EpisodeSummary } from '../api/episodeWorkspaceApi';
import { episodeDirectorRoute } from '../api/episodeDirectorApi';
import { importedEpisodeRoute, listImportedEpisodePackages, type ImportedEpisodeSummary } from '../api/episodePackageApi';
import { episodeHomeFeed } from '../lib/episodeHomeFeed';
import { ep001, ep002 } from '../lib/episodeProductionLibrary';
import '../styles/episodeDirectorHub.css';
import '../styles/episodeSelectorQuiet.css';

export function EpisodeSelectorPage() {
  const [episodes, setEpisodes] = useState<EpisodeSummary[]>([]);
  const [imported, setImported] = useState<ImportedEpisodeSummary[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');

  async function refresh() {
    setBusy(true);
    setError('');
    try {
      const [native, packages] = await Promise.allSettled([
        listEpisodeWorkspaces(), listImportedEpisodePackages()
      ]);
      setEpisodes(native.status === 'fulfilled' ? native.value : []);
      setImported(packages.status === 'fulfilled' ? packages.value : []);
      const failures: string[] = [];
      if (native.status === 'rejected') failures.push('Production workspaces could not load.');
      if (packages.status === 'rejected') failures.push('Imported Episode Packages could not load.');
      if (failures.length) setError(failures.join(' ') + ' Refresh or check your Director session.');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { void refresh(); }, []);

  const activeEpisodes = episodeHomeFeed(episodes, imported);

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
      {!busy && activeEpisodes.length === 0 && !error &&
        <p className="episode-selector-message">No active imported or native production episodes. The completed-film library remains available.</p>}
      <section className="episode-selector-list" aria-label="Choose an episode">
        <button type="button" className="episode-selector-row" onClick={() => {window.location.hash='#/library/EP001';}}>
          <span className="episode-selector-id">EP001</span>
          <span className="episode-selector-name"><strong>{ep001.title}</strong><small>Full MP4 20:56.77 · H.264/AAC · standalone SHOTs and voice takes removed</small></span>
          <ArrowRight size={22} aria-hidden="true"/>
        </button>
        <button type="button" className="episode-selector-row" onClick={() => {window.location.hash='#/library/EP002';}}>
          <span className="episode-selector-id">EP002</span>
          <span className="episode-selector-name"><strong>{ep002.title}</strong><small>Full MP4 13:01.53 · H.264/AAC · standalone SHOTs and voice takes removed</small></span>
          <ArrowRight size={22} aria-hidden="true"/>
        </button>
        <button type="button" className="episode-selector-row"
          onClick={() => {window.location.hash='#/library/EP003';}}>
          <span className="episode-selector-id">EP003</span>
          <span className="episode-selector-name">
            <strong>What Happens When One Database Is No Longer Enough?</strong>
            <small>Full MP4 21:26.43 · 11 SHOTs Director LOCKED · H.264/AAC</small>
          </span>
          <ArrowRight size={22} aria-hidden="true"/>
        </button>
        {activeEpisodes.map(item => item.kind === 'imported' ? (
          <button type="button" className="episode-selector-row episode-selector-imported"
            aria-label={item.number + ' — ' + item.episode.title + ', imported source, open Voice Studio'}
            key={'package-' + item.episode.packageId}
            onClick={() => {window.location.hash=importedEpisodeRoute(item.episode.packageId, 'SHOT01');}}>
            <span className="episode-selector-id">{item.number}</span>
            <span className="episode-selector-name">
              <strong>{item.episode.title}</strong>
              <small>Imported source · {item.episode.shotCount} SHOTs · {item.episode.beatCount} HEAR → SEE beats · {item.episode.status} · Open Voice Studio</small>
            </span>
            <ArrowRight size={22} aria-hidden="true"/>
          </button>
        ) : (
          <button type="button"
            className={item.episode.fullyLocked ? 'episode-selector-row fully-locked' : 'episode-selector-row'}
            aria-label={item.number + ' — ' + item.episode.title + (item.episode.fullyLocked ? ', fully locked' : '')}
            key={'workspace-' + item.episode.id}
            onClick={() => {
              const episode=item.episode;
              window.location.hash = episode.hasBrief === true
                && ['RESEARCH','SCRIPT','SCENE'].includes(episode.currentStage)
                  ? '#/episodes/' + episode.id + '/prepare'
                  : episodeDirectorRoute(episode.id);
            }}>
            <span className="episode-selector-id">{item.number}</span>
            <strong>{item.episode.title}</strong>
            <ArrowRight size={22} aria-hidden="true"/>
          </button>
        ))}
      </section>
    </main>
  );
}
