import { useEffect, useState } from 'react';
import { CheckCircle2, RefreshCw, RotateCcw, Settings2, ShieldCheck } from 'lucide-react';
import { loadSystemVersionInfo, type SystemVersionInfo } from '../api/systemApi';
import { hardRefreshApplication } from '../lib/cacheRefresh';

function formatDate(value: string | undefined) {
  if (!value || value === 'unknown') return 'Unknown';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function SettingsPage() {
  const [system, setSystem] = useState<SystemVersionInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshingApp, setRefreshingApp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refreshVersion() {
    setLoading(true);
    setError(null);
    try {
      setSystem(await loadSystemVersionInfo());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load system version');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshVersion();
  }, []);

  async function hardRefresh() {
    setRefreshingApp(true);
    setError(null);
    try {
      await hardRefreshApplication();
    } catch (cause) {
      setRefreshingApp(false);
      setError(cause instanceof Error ? cause.message : 'Hard refresh failed');
    }
  }

  return (
    <main className="media-os-page media-os-settings-page">
      <header className="media-os-page-header compact">
        <div>
          <span className="media-os-eyebrow">SETTINGS</span>
          <h1>System & version</h1>
          <p>See exactly which Media OS release is running and recover immediately if your browser is showing an older interface.</p>
        </div>
        <Settings2 size={28} />
      </header>

      {error && <div className="media-os-inline-error">{error}</div>}

      <section className="media-os-settings-card release-card">
        <div className="media-os-card-heading">
          <div>
            <span>CURRENT RELEASE</span>
            <strong>{system?.release ?? 'Checking…'}</strong>
          </div>
          <button disabled={loading} onClick={() => void refreshVersion()}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            Check now
          </button>
        </div>

        <dl className="media-os-settings-grid">
          <div><dt>Media OS version</dt><dd>{system ? `v${system.version}` : '—'}</dd></div>
          <div><dt>Commit</dt><dd className="mono">{system?.commitSha ?? '—'}</dd></div>
          <div><dt>Built</dt><dd>{formatDate(system?.buildTime)}</dd></div>
          <div><dt>Running since</dt><dd>{formatDate(system?.startedAt)}</dd></div>
          <div><dt>Environment</dt><dd>{system?.environment ?? '—'}</dd></div>
          <div><dt>Deployment</dt><dd className="mono">{system?.deploymentId ?? '—'}</dd></div>
        </dl>

        {system?.commitMessage && (
          <div className="media-os-release-message">
            <span>Release note</span>
            <strong>{system.commitMessage}</strong>
          </div>
        )}
      </section>

      <section className="media-os-settings-card cache-card">
        <div className="media-os-cache-icon"><RotateCcw size={23} /></div>
        <div className="media-os-cache-copy">
          <span>BROWSER RECOVERY</span>
          <h2>Hard refresh Media OS</h2>
          <p>Use this after a deployment if your phone still shows an older UI. Media OS will remove app caches and registered service workers, request the latest app shell, then reload with a unique cache-busting URL.</p>
          <div className="media-os-safe-note"><ShieldCheck size={15} /> Server project data and agent history are not deleted.</div>
        </div>
        <button className="media-os-hard-refresh" disabled={refreshingApp} onClick={() => void hardRefresh()}>
          <RotateCcw size={17} className={refreshingApp ? 'spin' : ''} />
          {refreshingApp ? 'Refreshing…' : 'Hard refresh app'}
        </button>
      </section>

      <section className="media-os-settings-card policy-card">
        <CheckCircle2 size={20} />
        <div>
          <strong>Stale app-shell protection enabled</strong>
          <p>The server sends the Media OS HTML shell with a no-store policy, so new deployments should normally appear without manual intervention. Hard Refresh remains available as a recovery tool.</p>
        </div>
      </section>
    </main>
  );
}
