import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { EpisodeSelectorPage } from './pages/EpisodeSelectorPage';
import { EpisodeProductionLibraryPage } from './pages/EpisodeProductionLibraryPage';
import { EpisodeNewPage } from './pages/EpisodeNewPage';
import {EpisodePackageImportPage} from './pages/EpisodePackageImportPage';
import {Ep003Shot07V2DirectorReview} from './components/Ep003Shot07V2DirectorReview';
import {Ep003Shot07V3DirectorReview} from './components/Ep003Shot07V3DirectorReview';
import {Ep003Shot08V1DirectorReview} from './components/Ep003Shot08V1DirectorReview';
import {Ep003Shot08V2DirectorReview} from './components/Ep003Shot08V2DirectorReview';
import {Ep003Shot09V1DirectorReview} from './components/Ep003Shot09V1DirectorReview';
import {Ep003Shot09V2DirectorReview} from './components/Ep003Shot09V2DirectorReview';
import {Ep003Shot10V1DirectorReview} from './components/Ep003Shot10V1DirectorReview';
import {Ep003Shot10V2DirectorReview} from './components/Ep003Shot10V2DirectorReview';
import {Ep003Shot11V1DirectorReview} from './components/Ep003Shot11V1DirectorReview';
import {Ep003Shot08V3DirectorReview} from './components/Ep003Shot08V3DirectorReview';
import {Ep003Shot08V4DirectorReview} from './components/Ep003Shot08V4DirectorReview';
import {Ep003Shot09V3DirectorReview} from './components/Ep003Shot09V3DirectorReview';
import {Ep003CumulativeFullVideo} from './components/Ep003CumulativeFullVideo';
import {Ep003CorrectedTenShotFullWip} from './components/Ep003CorrectedTenShotFullWip';
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
  if (/^#\/ep003\/shot\d{2}(?:\/|$)/.test(hash) || hash.startsWith('#/ep003/corrected/full')) return '#/ep003/full';
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

  if (hash === '#/ep003/shot08/v4') {
    return <div className="media-os-product-shell"><Ep003Shot08V4DirectorReview/></div>;
  }
  if (hash === '#/ep003/shot09/v3') {
    return <div className="media-os-product-shell"><Ep003Shot09V3DirectorReview/></div>;
  }

  if (hash === '#/ep003/corrected/full') {
    return <div className="media-os-product-shell"><Ep003CorrectedTenShotFullWip/></div>;
  }

  if (hash === '#/ep003/shot11/v1') {
    return <div className="media-os-product-shell"><Ep003Shot11V1DirectorReview/></div>;
  }

  if (hash === '#/ep003/shot10/v2') {
    return <div className="media-os-product-shell"><Ep003Shot10V2DirectorReview/></div>;
  }

  if (hash === '#/ep003/shot10/v1') {
    return <div className="media-os-product-shell"><Ep003Shot10V1DirectorReview/></div>;
  }

  if (hash === '#/ep003/shot09/v2') {
    return <div className="media-os-product-shell"><Ep003Shot09V2DirectorReview/></div>;
  }
  if (hash === '#/ep003/shot08/v3') {
    return <div className="media-os-product-shell"><Ep003Shot08V3DirectorReview/></div>;
  }
  if (hash === '#/ep003/shot09/v1') {
    return <div className="media-os-product-shell"><Ep003Shot09V1DirectorReview/></div>;
  }

  if (hash === '#/ep003/shot08/v2') {
    return <div className="media-os-product-shell"><Ep003Shot08V2DirectorReview/></div>;
  }

  if (hash === '#/ep003/shot08/v1') {
    return <div className="media-os-product-shell"><Ep003Shot08V1DirectorReview/></div>;
  }

  if (hash === '#/ep003/full') {
    return <div className="media-os-product-shell"><Ep003CumulativeFullVideo/></div>;
  }

  if (hash === '#/ep003/shot07/v3') {
    return <div className="media-os-product-shell"><Ep003Shot07V3DirectorReview/></div>;
  }

  if (hash === '#/ep003/shot07/v2') {
    return <div className="media-os-product-shell"><Ep003Shot07V2DirectorReview/></div>;
  }

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
  if (hash === '#/library/EP001' || hash === '#/library/EP002') {
    page = <EpisodeProductionLibraryPage episodeKey={hash.endsWith('EP001') ? 'EP001' : 'EP002'} />;
  } else if (hash === '#/episode-packages/import' || hash.startsWith('#/episode-packages/import?')) {
    page = <EpisodePackageImportPage />;
  } else if (hash === '#/episodes/new' || hash.startsWith('#/episodes/new?')) {
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
