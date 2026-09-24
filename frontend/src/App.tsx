import { useEffect, useState, type ReactNode } from 'react';
import { AppBottomNav } from './components/AppBottomNav';
import { ActivityPage } from './pages/ActivityPage';
import { HomePage } from './pages/HomePage';
import { SettingsPage } from './pages/SettingsPage';
import { SplineWorkspacePage } from './pages/SplineWorkspacePage';

function normalizeLegacyRoute(hash: string) {
  if (hash.startsWith('#/spline-agent')) return '#/agents/spline';
  if (hash.startsWith('#/diagnostics')) return '#/agents/spline?view=health';
  if (hash.startsWith('#/browser-clone-proof')) return '#/agents/spline';
  return hash;
}

export function App() {
  const [hash, setHash] = useState(() => normalizeLegacyRoute(window.location.hash || '#/'));

  useEffect(() => {
    const onHashChange = () => {
      const raw = window.location.hash || '#/';
      const normalized = normalizeLegacyRoute(raw);
      if (normalized !== raw) {
        window.location.replace(`${window.location.pathname}${window.location.search}${normalized}`);
        return;
      }
      setHash(normalized);
    };

    if (hash !== (window.location.hash || '#/')) {
      window.location.replace(`${window.location.pathname}${window.location.search}${hash}`);
    }

    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  let page: ReactNode;

  if (hash.startsWith('#/agents/spline')) {
    page = <SplineWorkspacePage />;
  } else if (hash.startsWith('#/activity')) {
    page = <ActivityPage />;
  } else if (hash.startsWith('#/settings')) {
    page = <SettingsPage />;
  } else {
    page = <HomePage />;
  }

  return (
    <div className="media-os-product-shell">
      {page}
      <AppBottomNav currentHash={hash} />
    </div>
  );
}
