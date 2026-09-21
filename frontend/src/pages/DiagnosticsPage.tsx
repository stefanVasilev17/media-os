import { useEffect, useState } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import {
  loadLatestSplineJob,
  loadRunnerStatus,
  type LatestSplineJob,
  type RunnerStatus
} from '../api/mediaOsApi';

export function DiagnosticsPage() {
  const [runner, setRunner] = useState<RunnerStatus | null>(null);
  const [latest, setLatest] = useState<LatestSplineJob | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setBusy(true);
    try {
      const [runnerStatus, latestJob] = await Promise.all([
        loadRunnerStatus(),
        loadLatestSplineJob()
      ]);
      setRunner(runnerStatus);
      setLatest(latestJob);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <main className="diagnostics-shell">
      <header className="spline-agent-header">
        <button
          className="icon-button"
          onClick={() => { window.location.hash = '#/spline-agent'; }}
          aria-label="Back"
        >
          <ArrowLeft size={19} />
        </button>

        <div className="spline-agent-title">
          <span>DIAGNOSTICS</span>
          <strong>Media OS production health</strong>
        </div>

        <button
          className="diagnostics-refresh"
          disabled={busy}
          onClick={() => void refresh()}
        >
          <RefreshCw size={16} className={busy ? 'spin' : ''} />
          Refresh
        </button>
      </header>

      <section className="diagnostics-content">
        <article className="diagnostic-card">
          <span>LOCAL PRODUCTION BRIDGE</span>
          <strong>{runner?.online ? 'ONLINE' : 'OFFLINE'} · {runner?.status ?? 'UNKNOWN'}</strong>
          <p>{runner?.hostname ?? 'No runner registered'} · runner {runner?.runnerVersion ?? '—'}</p>

          <dl>
            <div>
              <dt>Production commit</dt>
              <dd>{runner?.productionCommit ?? '—'}</dd>
            </div>
            <div>
              <dt>Last heartbeat</dt>
              <dd>{runner?.lastSeen ? new Date(runner.lastSeen).toLocaleString() : '—'}</dd>
            </div>
            <div>
              <dt>Last error</dt>
              <dd>{runner?.lastError || 'None'}</dd>
            </div>
          </dl>
        </article>

        <article className="diagnostic-card">
          <span>LATEST SPLINE EXECUTION</span>
          <strong>{latest?.status ?? 'NONE'}</strong>

          <dl>
            <div>
              <dt>Task</dt>
              <dd>{latest?.taskType ?? '—'}</dd>
            </div>
            <div>
              <dt>Tokens</dt>
              <dd>{latest?.result?.metrics?.tokenCount?.toLocaleString() ?? '—'}</dd>
            </div>
            <div>
              <dt>MCP calls</dt>
              <dd>{latest?.result?.metrics?.splineMcpCalls ?? '—'}</dd>
            </div>
            <div>
              <dt>Duration</dt>
              <dd>
                {latest?.result?.metrics?.durationMs
                  ? `${Math.round(latest.result.metrics.durationMs / 1000)}s`
                  : '—'}
              </dd>
            </div>
            <div>
              <dt>Error</dt>
              <dd>{latest?.error || 'None'}</dd>
            </div>
          </dl>
        </article>
      </section>
    </main>
  );
}
