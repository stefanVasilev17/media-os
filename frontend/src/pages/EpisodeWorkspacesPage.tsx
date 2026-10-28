import { useEffect, useState } from 'react';
import { getEpisodeWorkspace, listEpisodeWorkspaces, type EpisodeSummary, type WorkspaceContext } from '../api/episodeWorkspaceApi';
import '../styles/episodeWorkspaces.css';

export function EpisodeWorkspacesPage() {
  const [episodes, setEpisodes] = useState<EpisodeSummary[]>([]);
  const [selected, setSelected] = useState('');
  const [workspace, setWorkspace] = useState<WorkspaceContext | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    let active = true;
    listEpisodeWorkspaces().then(rows => {
      if (!active) return;
      setEpisodes(rows);
      setSelected(rows[0]?.id || '');
    }).catch(err => { if (active) setError(String(err)); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selected) return;
    let active = true;
    setWorkspace(null);
    setError('');
    getEpisodeWorkspace(selected).then(result => {
      if (active) setWorkspace(result);
    }).catch(err => { if (active) setError(String(err)); });
    return () => { active = false; };
  }, [selected]);

  return (
    <main className="media-os-page episode-workspaces">
      <header className="episode-workspaces-heading">
        <div>
          <span>MediaOS / Production Foundation</span>
          <h1>Episode Workspaces</h1>
          <p>Separate Truth Maps, Director decisions, memory and approved reusable assets. No locked EP001 assets are modified here.</p>
        </div>
        <div className="episode-workspaces-label">Episode-aware · Read-only navigator</div>
      </header>

      {busy && <p>Loading episode catalog…</p>}
      {error && <p role="alert" className="episode-workspaces-error">{error}</p>}
      <div className="episode-workspaces-layout">
        <aside className="episode-workspaces-sidebar" aria-label="Episodes">
          <h2>Production catalog</h2>
          {episodes.map(ep => (
            <button type="button" key={ep.id} className={selected === ep.id ? 'selected' : ''}
              onClick={() => setSelected(ep.id)}>
              <strong>{ep.episodeNumber}</strong>
              <span>{ep.title}</span>
              <small>{ep.status}</small>
            </button>
          ))}
          <p className="episode-workspaces-hint">New episode creation remains disabled until the cross-episode production routing release is approved.</p>
        </aside>

        <section className="episode-workspaces-detail">
          {workspace && (
            <>
              <div className="episode-workspaces-overview">
                <span>Selected episode — {workspace.episode.episodeNumber}</span>
                <h2>{workspace.episode.title}</h2>
                <p>Current stage: {workspace.episode.currentStage} · Status: {workspace.episode.status}</p>
                <div className="episode-workspaces-metrics">
                  <div><strong>{workspace.rules.length}</strong><small>Applicable memory rules</small></div>
                  <div><strong>{workspace.assetsAvailable.length}</strong><small>Approved shared assets</small></div>
                  <div><strong>{workspace.assetsReferenced.length}</strong><small>Referenced in episode</small></div>
                  <div><strong>{workspace.directorLockedShots.length}</strong><small>Director-locked shots</small></div>
                </div>
              </div>
              <h3>Independent production stages</h3>
              <div className="episode-workspaces-stages">
                {workspace.stages.map(stage => (
                  <div key={stage.stageKey} className="episode-workspaces-stage">
                    <div><strong>{stage.displayName}</strong><small>Revision {stage.revision}</small></div>
                    <span className={stage.status === 'LOCKED' ? 'locked' : ''}>{stage.status}</span>
                  </div>
                ))}
              </div>
              <p className="episode-workspaces-hint">This screen is an inspection surface. Creating episodes, saving drafts and locking stages require audited API operations and explicit Director review. Legacy EP001 editors are not automatically redirected to other episodes.</p>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
