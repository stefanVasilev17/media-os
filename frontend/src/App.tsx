import { useEffect, useState } from 'react';
import { DiagnosticsPage } from './pages/DiagnosticsPage';
import { LiveMapPage } from './pages/LiveMapPage';
import { BrowserCloneProofPage } from './pages/BrowserCloneProofPage';
import { SplineAgentPage } from './pages/SplineAgentPage';

export function App() {
  const [hash, setHash] = useState(window.location.hash || '#/');

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash || '#/');
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  if (hash.startsWith('#/browser-clone-proof')) return <BrowserCloneProofPage />;
  if (hash.startsWith('#/spline-agent')) return <SplineAgentPage />;
  if (hash.startsWith('#/diagnostics')) return <DiagnosticsPage />;
  return <LiveMapPage />;
}
