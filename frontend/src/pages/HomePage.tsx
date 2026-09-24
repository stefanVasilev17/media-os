import { useEffect, useState } from 'react';
import {
  Activity,
  ArrowRight,
  Box,
  CheckCircle2,
  MessageSquare,
  MonitorUp,
  Settings,
  ShieldCheck
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
          <p>Open an agent, review current production activity, or manage the running Media OS version.</p>
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
          <small>Each agent has one workspace and its own chat.</small>
        </div>

        <button
          className="media-os-agent-card primary"
          onClick={() => { window.location.hash = '#/agents/spline'; }}
        >
          <div className="media-os-agent-icon"><Box size={25} /></div>
          <div className="media-os-agent-copy">
            <div className="media-os-agent-title-row">
              <strong>Spline Agent</strong>
              <span className={runner?.online ? 'ready' : 'standby'}>
                <StatusDot ready={Boolean(runner?.online)} />
                {runner?.online ? 'Connected' : 'Standby'}
              </span>
            </div>
            <p>Inspect the current architecture map, send change instructions, approve edits, and check Spline health from one place.</p>
            <div className="media-os-capability-row">
              <span><MessageSquare size={14} /> Chat</span>
              <span><MonitorUp size={14} /> Current map</span>
              <span><ShieldCheck size={14} /> Approvals</span>
              <span><CheckCircle2 size={14} /> Health</span>
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
              <span>Jobs, approvals, tasks and current execution state.</span>
            </div>
            <ArrowRight size={17} />
          </button>

          <button className="media-os-tool-card" onClick={() => { window.location.hash = '#/settings'; }}>
            <Settings size={21} />
            <div>
              <strong>Settings & Version</strong>
              <span>Running release, deployment information and hard cache refresh.</span>
            </div>
            <ArrowRight size={17} />
          </button>
        </div>
      </section>

      <section className="media-os-system-strip">
        <div>
          <span>MEDIA OS BACKEND</span>
          <strong>{system ? `v${system.version} · ${system.environment}` : 'Checking system…'}</strong>
        </div>
        <div>
          <span>SPLINE BRIDGE</span>
          <strong>{runner?.online ? `${runner.hostname ?? 'Runner'} · ${runner.status}` : 'Not connected'}</strong>
        </div>
      </section>
    </main>
  );
}
