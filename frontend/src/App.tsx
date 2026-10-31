import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { EpisodeSelectorPage } from './pages/EpisodeSelectorPage';
import { EpisodeNewPage } from './pages/EpisodeNewPage';
import { EpisodePreparationPage } from './pages/EpisodePreparationPage';
import { ProductionMemoryImportPage } from './pages/ProductionMemoryImportPage';
import { DirectorRuleStudioPage } from './pages/DirectorRuleStudioPage';
import { EpisodeDirectorPage } from './pages/EpisodeDirectorPage';
import { EpisodeShotWorkspacePage } from './pages/EpisodeShotWorkspacePage';
import { ShotRevisionAgentPage } from './pages/ShotRevisionAgentPage';
import { EpisodeRevisionVoicePage } from './pages/EpisodeRevisionVoicePage';
import { SceneAgentPage } from './pages/SceneAgentPage';
import { ScriptAgentPage } from './pages/ScriptAgentPage';
import { ShotStudioPage } from './pages/ShotStudioPage';
import { EpisodeWorkspacesPage } from './pages/EpisodeWorkspacesPage';
import { VoiceAgentPage } from './pages/VoiceAgentPage';
import { VisualAgentPage } from './pages/VisualAgentPage';
import './styles/episodeSceneCompositor.css';

const EP001_ID = '22222222-2222-2222-2222-222222222222';

const SplineWorkspacePage = lazy(async () => {
  await import('./lib/runtimeCameraVariables');
  const module = await import('./pages/SplineWorkspacePage');
  return { default: module.SplineWorkspacePage };
});

const ShotRenderPage = lazy(async () => {
  await import('./lib/runtimeCameraVariables');
  const module = await import('./pages/ShotRenderPage');
  return { default: module.ShotRenderPage };
});

function normalizeLegacyRoute(hash: string) {
  if (hash.startsWith('#/spline-agent')) return '#/agents/spline';
  if (hash.startsWith('#/diagnostics')) return '#/agents/spline';
  if (hash.startsWith('#/browser-clone-proof')) return '#/agents/spline';
  return hash;
}

function AgentLoading() {
  return <main className="media-os-page"><div className="loading">Opening workspace…</div></main>;
}

function legacyEpisodeAllowed(hash: string) {
  const params = new URLSearchParams(hash.split('?', 2)[1] || '');
  const episodeId = params.get('episodeId');
  return !episodeId || episodeId === EP001_ID;
}

export function App() {
  const [hash, setHash] = useState(() => normalizeLegacyRoute(window.location.hash || '#/'));

  useEffect(() => {
    const onHashChange = () => {
      const raw = window.location.hash || '#/';
      const normalized = normalizeLegacyRoute(raw);
      if (normalized !== raw) {
        window.location.replace(window.location.pathname + window.location.search + normalized);
        return;
      }
      setHash(normalized);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  if (hash.startsWith('#/render/spline-shot/')) {
    return (
      <Suspense fallback={<div style={{ width: '100vw', height: '100vh', background: '#050913' }} />}>
        <ShotRenderPage />
      </Suspense>
    );
  }

  const episodePath = /^#\/episodes\/([0-9a-fA-F-]{36})\/(director|voice|video|revision)(?:\?|$)/.exec(hash);
  const episodeId = episodePath?.[1];
  const section = episodePath?.[2];
  const routeParams = new URLSearchParams(hash.split('?', 2)[1] || '');
  const shotKey = routeParams.get('shot') || '';
  let page: ReactNode;

  const preparationRoute = /^#\/episodes\/([0-9a-fA-F-]{36})\/prepare(?:\?|$)/.exec(hash);
  if (hash === '#/episodes/new') {
    page = <EpisodeNewPage />;
  } else if (preparationRoute) {
    page = <EpisodePreparationPage episodeId={preparationRoute[1]} />;
  } else if (hash.startsWith('#/rule-studio')) {
    page = <DirectorRuleStudioPage />;
  } else if (hash.startsWith('#/memory-import')) {
    page = <ProductionMemoryImportPage />;
  } else if (episodeId && section === 'revision') {
    page = <ShotRevisionAgentPage key={hash} episodeId={episodeId} shotKey={shotKey} />;
  } else if (episodeId && section === 'director') {
    page = <EpisodeDirectorPage episodeId={episodeId} />;
  } else if (episodeId && section === 'voice') {
    page = <EpisodeRevisionVoicePage key={hash} episodeId={episodeId} shotKey={shotKey} />;
  } else if (episodeId && section === 'video') {
    page = <EpisodeShotWorkspacePage episodeId={episodeId} kind={section} shotKey={shotKey} />;
  } else if (hash === '#/' || hash === '' || hash.startsWith('#/episodes')) {
    page = <EpisodeSelectorPage />;
  } else if (hash.startsWith('#/workspace-inspector')) {
    page = <EpisodeWorkspacesPage />;
  } else if (!legacyEpisodeAllowed(hash)) {
    page = <EpisodeSelectorPage />;
  } else if (hash.startsWith('#/studio')) {
    page = <ShotStudioPage key={hash} />;
  } else if (hash.startsWith('#/agents/script')) {
    page = <ScriptAgentPage />;
  } else if (hash.startsWith('#/agents/voice')) {
    page = <VoiceAgentPage key={hash} />;
  } else if (hash.startsWith('#/agents/visual')) {
    page = <VisualAgentPage key={hash} />;
  } else if (hash.startsWith('#/agents/scene')) {
    page = <SceneAgentPage />;
  } else if (hash.startsWith('#/agents/spline')) {
    page = <Suspense fallback={<AgentLoading />}><SplineWorkspacePage /></Suspense>;
  } else {
    page = <EpisodeSelectorPage />;
  }

  return (
    <div className="media-os-product-shell">
      {page}
    </div>
  );
}
