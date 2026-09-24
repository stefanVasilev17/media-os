import { useEffect, useState } from 'react';
import {
  Activity,
  ArrowRight,
  Box,
  Camera,
  Download,
  Move3d,
  Plus,
  Settings,
  WandSparkles
} from 'lucide-react';
import { loadRunnerStatus, type RunnerStatus } from '../api/mediaOsApi';
import { loadSystemVersionInfo, type SystemVersionInfo } from '../api/systemApi';

function StatusDot({ ready }: { ready: boolean }) {
  return <span className={`media-os-status-dot ${ready ? 'ready' : 'offline'}`} aria-hidden="true" />;
}

export function HomePage() {
  const [runner, setRunner] = useState<RunnerStatus | null>(null);
  const [system, setSystem] = useState<SystemVersionInfo | null>(null);

  useEffect(() => {
    void Promise.allSettled([
      loadRunnerStatus().then(setRunner),
      loadSystemVersionInfo().then(setSystem)
    ]);
  }, []);

  return (
    <main className="media-os-page media-os-home-page">
      <header className="media-os-page-header media-os-home-header">
        <div>
          <span className="media-os-eyebrow">MEDIA OS</span>
          <h1>Your production control center</h1>
          <p>Open an agent, work on the current episode, review production activity, or manage the running Media OS version.</p>
        </div>
        <div className="media-os-release-pill">
          <StatusDot ready={Boolean(system)} />
          <span>Release</span>
          <strong>{system?.release ?? 'checking…'}</strong>
        </div>
      </header>

      <section className="media-os-section">
        <div className="media-os-section-heading">
          <div>
            <span>AGENTS</span>
            <h2>Work with an agent</h2>
          </div>
          <small>One agent = one workspace, one chat, all of its tools.</small>
        </div>

        <button
          className="media-os-agent-card primary"
          onClick={() => { window.location.hash = '#/agents/spline'; }}
        >
          <div className="media-os-agent-icon"><Box size={25} /></div>
          <div className="media-os-agent-copy">
            <div className="media-os-agent-title-row">
              <strong>Spline Agent</strong>
              <span className="ready">
                <StatusDot ready />
                Browser workspace
              </span>
            </div>
            <p>Build a temporary episode scene from reusable Spline objects, adjust it visually, animate it, frame the shot and export the result.</p>
            <div className="media-os-capability-row">
              <span><Plus size={14} /> Create</span>
              <span><Move3d size={14} /> Edit</span>
              <span><WandSparkles size={14} /> Animate</span>
              <span><Camera size={14} /> Frame</span>
              <span><Download size={14} /> Export</span>
            </div>
          </div>
          <ArrowRight size={20} />
        </button>
      </section>

      <section className="media-os-section">
        <div className="media-os-section-heading">
          <div>
            <span>SYSTEM</span>
            <h2>Media OS tools</h2>
          </div>
        </div>

        <div className="media-os-tool-grid">
          <button className="media-os-tool-card" onClick={() => { window.location.hash = '#/activity'; }}>
            <Activity size={21} />
            <div>
              <strong>Production Activity</strong>
              <span>Current work, approvals and execution progress.</span>
            </div>
            <ArrowRight size={17} />
          </button>

          <button className="media-os-tool-card" onClick={() => { window.location.hash = '#/settings'; }}>
            <Settings size={21} />
            <div>
              <strong>Settings & Version</strong>
              <span>Running release, deployment information and hard refresh.</span>
            </div>
            <ArrowRight size={17} />
          </button>
        </div>
      </section>

      <section className="media-os-system-strip">
        <div>
          <span>MEDIA OS</span>
          <strong>{system ? `v${system.version} · ${system.environment}` : 'Checking system…'}</strong>
        </div>
        <div>
          <span>SPLINE AGENT</span>
          <strong>{runner?.online ? 'Browser tools ready · assisted editing available' : 'Browser tools ready'}</strong>
        </div>
      </section>
    </main>
  );
}
