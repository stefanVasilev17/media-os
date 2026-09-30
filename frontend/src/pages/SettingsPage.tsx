import { useEffect, useState } from 'react';
import { CheckCircle2, RefreshCw, RotateCcw, Settings2, ShieldCheck } from 'lucide-react';
import { loadAiControl, updateAiControl, type AiControlState } from '../api/aiControlApi';
import { loadSystemVersionInfo, type SystemVersionInfo } from '../api/systemApi';
import { hardRefreshApplication } from '../lib/cacheRefresh';

function formatDate(value: string | undefined | null) {
  if (!value || value === 'unknown') return 'Unknown';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function SettingsPage() {
  const [system, setSystem] = useState<SystemVersionInfo | null>(null);
  const [aiControl, setAiControl] = useState<AiControlState | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
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

  async function refreshAiControl() {
    setAiBusy(true);
    setError(null);
    try {
      setAiControl(await loadAiControl());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load AI spending controls');
    } finally {
      setAiBusy(false);
    }
  }

  useEffect(() => {
    void refreshVersion();
    void refreshAiControl();
  }, []);

  async function setPaidAi(enabled: boolean) {
    setAiBusy(true);
    setError(null);
    try {
      setAiControl(await updateAiControl({ paidAiEnabled: enabled }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update Paid AI');
    } finally {
      setAiBusy(false);
    }
  }

  async function setAutoRepair(enabled: boolean) {
    setAiBusy(true);
    setError(null);
    try {
      setAiControl(await updateAiControl({ autoRepairEnabled: enabled }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update automatic repair');
    } finally {
      setAiBusy(false);
    }
  }

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
          <h1>System & safety</h1>
          <p>Keep Media OS predictable: paid model calls stay blocked until you explicitly enable them.</p>
        </div>
        <Settings2 size={28} />
      </header>

      {error && <div className="media-os-inline-error">{error}</div>}

      <section className="media-os-settings-card policy-card">
        <ShieldCheck size={20} />
        <div>
          <span>AI SPENDING</span>
          <h2>{aiControl?.paidAiEnabled ? 'Paid AI is ON' : 'Zero-spend mode'}</h2>
          <p>
            {aiControl?.paidAiEnabled
              ? 'Paid model calls are allowed. Every call is written to the AI ledger before the request starts.'
              : 'All paid model calls are blocked on the server before an OpenAI request can be sent.'}
          </p>
          <div className="media-os-safe-note">
            Automatic repair is {aiControl?.autoRepairEnabled ? 'ON and may add extra paid calls.' : 'OFF, so failed validation cannot silently trigger another paid model call.'}
          </div>
        </div>
        <button disabled={aiBusy || !aiControl} onClick={() => void setPaidAi(!aiControl?.paidAiEnabled)}>
          {aiBusy ? 'Updating…' : aiControl?.paidAiEnabled ? 'Disable paid AI' : 'Enable paid AI'}
        </button>
      </section>

      {aiControl?.paidAiEnabled && (
        <section className="media-os-settings-card policy-card">
          <ShieldCheck size={20} />
          <div>
            <span>EXTRA CALLS</span>
            <h2>Automatic repair</h2>
            <p>Keep this OFF while we tune the agents. When ON, autonomous Script and Scene validation may each trigger one extra repair call.</p>
          </div>
          <button disabled={aiBusy} onClick={() => void setAutoRepair(!aiControl.autoRepairEnabled)}>
            {aiControl.autoRepairEnabled ? 'Disable auto-repair' : 'Allow auto-repair'}
          </button>
        </section>
      )}

      {aiControl && (
        <section className="media-os-settings-card release-card">
          <div className="media-os-card-heading">
            <div>
              <span>AI CALL LEDGER · THIS MONTH</span>
              <strong>{aiControl.month.succeeded} successful paid calls</strong>
            </div>
            <button disabled={aiBusy} onClick={() => void refreshAiControl()}>
              <RefreshCw size={16} className={aiBusy ? 'spin' : ''} />
              Refresh
            </button>
          </div>

          <dl className="media-os-settings-grid">
            <div><dt>Attempts</dt><dd>{aiControl.month.attempts}</dd></div>
            <div><dt>Blocked before spend</dt><dd>{aiControl.month.blocked}</dd></div>
            <div><dt>Failed upstream</dt><dd>{aiControl.month.failed}</dd></div>
            <div><dt>Safety mode</dt><dd>{aiControl.safetyMode === 'ZERO_SPEND' ? 'Zero spend' : 'Paid AI on'}</dd></div>
          </dl>

          {aiControl.recentCalls.length > 0 && (
            <details>
              <summary>Recent AI calls</summary>
              <dl className="media-os-settings-grid">
                {aiControl.recentCalls.slice(0, 6).map(call => (
                  <div key={call.id}>
                    <dt>{call.agentKey} · {call.operation}</dt>
                    <dd>{call.status.toLowerCase()} · {formatDate(call.startedAt)}</dd>
                  </div>
                ))}
              </dl>
            </details>
          )}
        </section>
      )}

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
