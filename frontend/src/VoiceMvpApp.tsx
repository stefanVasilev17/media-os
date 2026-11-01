import { useEffect, useState, type ReactNode } from 'react';
import { listEpisodeWorkspaces, type EpisodeSummary } from './api/episodeWorkspaceApi';
import { EpisodeNewPage } from './pages/EpisodeNewPage';
import { EpisodePreparationPage } from './pages/EpisodePreparationPage';
import { EpisodeDirectorPage } from './pages/EpisodeDirectorPage';
import { EpisodeRevisionVoicePage } from './pages/EpisodeRevisionVoicePage';
import { ShotRevisionAgentPage } from './pages/ShotRevisionAgentPage';
import { EpisodeShotWorkspacePage } from './pages/EpisodeShotWorkspacePage';
import { findEp002ForVoiceMvp, isEp002VoiceWorkspace } from './lib/voiceMvpSafety';
import './styles/episodeDirectorHub.css';

function Ep002Home() {
  const [episode, setEpisode] = useState<EpisodeSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    void listEpisodeWorkspaces()
      .then(episodes => { if (active) setEpisode(findEp002ForVoiceMvp(episodes)); })
      .catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'Could not read episodes.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return <main className="media-os-page episode-hub">
    <header><h1>EP002 / Voice Production</h1></header>
    <p>Source-locked Script, Hear/See and ElevenLabs narration. Video rendering uses Remotion in a separate workflow.</p>
    {error && <p role="alert">{error}</p>}
    {loading && <p>Checking EP002 workspace…</p>}
    {!loading && !error && !episode && <>
      <p>EP002 is not in this environment yet. Creation needs verified Director access and a reviewed Episode Brief.</p>
      <button type="button" onClick={() => { window.location.hash = '#/episodes/new'; }}>Create EP002 workspace</button>
    </>}
    {episode && <>
      <p>{episode.episodeNumber} — {episode.title}</p>
      <button type="button" onClick={() => {
        window.location.hash = episode.hasBrief === true
          && ['RESEARCH', 'SCRIPT', 'SCENE'].includes(episode.currentStage)
            ? '#/episodes/' + episode.id + '/prepare'
            : '#/episodes/' + episode.id + '/director';
      }}>Open EP002</button>
    </>}
  </main>;
}

function Ep002Guard({ episodeId, children }: { episodeId: string; children: ReactNode }) {
  const [access, setAccess] = useState<'checking' | 'allowed' | 'denied' | 'failed'>('checking');

  useEffect(() => {
    let active = true;
    setAccess('checking');
    void listEpisodeWorkspaces().then(episodes => {
      if (active) setAccess(isEp002VoiceWorkspace(episodes, episodeId)
        ? 'allowed' : 'denied');
    }).catch(() => { if (active) setAccess('failed'); });
    return () => { active = false; };
  }, [episodeId]);

  if (access === 'allowed') return <>{children}</>;
  return <main className="media-os-page episode-hub">
    {access === 'checking' && <p>Verifying EP002 identity…</p>}
    {access === 'denied' && <p role="alert">This Voice MVP workspace is for EP002 only. EP001 remains unchanged.</p>}
    {access === 'failed' && <p role="alert">Could not verify the episode. No edit action is available.</p>}
    <button type="button" onClick={() => { window.location.hash = '#/'; }}>EP002 home</button>
  </main>;
}

export function VoiceMvpApp() {
  const [hash, setHash] = useState(window.location.hash || '#/');

  useEffect(() => {
    const change = () => setHash(window.location.hash || '#/');
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  }, []);

  if (hash === '#/episodes/new') return <EpisodeNewPage />;

  const route = /^#\/episodes\/([0-9a-fA-F-]{36})\/(prepare|director|revision|voice|video)(?:\?|$)/.exec(hash);
  if (!route) return <Ep002Home />;

  const episodeId = route[1];
  const section = route[2];
  const shot = new URLSearchParams(hash.split('?', 2)[1] || '').get('shot') || '';
  let page: ReactNode;

  if (section === 'prepare') page = <EpisodePreparationPage episodeId={episodeId} />;
  else if (section === 'director') page = <EpisodeDirectorPage episodeId={episodeId} />;
  else if (section === 'revision') page = <ShotRevisionAgentPage key={hash} episodeId={episodeId} shotKey={shot} />;
  else if (section === 'voice') page = <EpisodeRevisionVoicePage key={hash} episodeId={episodeId} shotKey={shot} />;
  else page = <EpisodeShotWorkspacePage episodeId={episodeId} kind="video" shotKey={shot} />;

  return <div className="media-os-product-shell">
    <Ep002Guard episodeId={episodeId}>{page}</Ep002Guard>
  </div>;
}
