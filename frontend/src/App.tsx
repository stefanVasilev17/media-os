import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { AppBottomNav } from './components/AppBottomNav';
import { DirectorRoomPage } from './pages/DirectorRoomPage';
import { SceneAgentPage } from './pages/SceneAgentPage';
import { ScriptAgentPage } from './pages/ScriptAgentPage';
import { ShotStudioPage } from './pages/ShotStudioPage';
import { EpisodeWorkspacesPage } from './pages/EpisodeWorkspacesPage';
import { VoiceAgentPage } from './pages/VoiceAgentPage';
import { VisualAgentPage } from './pages/VisualAgentPage';
import './styles/episodeSceneCompositor.css';

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
  return <main className="media-os-page"><div className="loading">Opening legacy workspace…</div></main>;
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

  let page: ReactNode;
  if (hash.startsWith('#/episodes')) {
    page = <EpisodeWorkspacesPage />;
  } else if (hash.startsWith('#/studio')) {
    page = <ShotStudioPage />;
  } else if (hash.startsWith('#/agents/script')) {
    page = <ScriptAgentPage />;
  } else if (hash.startsWith('#/agents/voice')) {
    page = <VoiceAgentPage />;
  } else if (hash.startsWith('#/agents/visual')) {
    page = <VisualAgentPage />;
  } else if (hash.startsWith('#/agents/scene')) {
    page = <SceneAgentPage />;
  } else if (hash.startsWith('#/agents/spline')) {
    page = <Suspense fallback={<AgentLoading />}><SplineWorkspacePage /></Suspense>;
  } else {
    page = <DirectorRoomPage />;
  }

  return (
    <div className="media-os-product-shell">
      {page}
      <AppBottomNav currentHash={hash} />
    </div>
  );
}
