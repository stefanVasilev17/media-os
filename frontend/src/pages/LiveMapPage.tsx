import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Bot,
  Box,
  CheckCircle2,
  Circle,
  Clock3,
  Network,
  Play,
  Plus,
  ShieldCheck,
  XCircle
} from 'lucide-react';
import {
  createSplineEditProof,
  decideSplineJob,
  loadLiveMap,
  loadPendingSplineApprovals,
  type LiveMapJob,
  type LiveMapTask,
  type LiveMapView,
  type PendingSplineApproval
} from '../api/mediaOsApi';
import { StatusPill } from '../components/StatusPill';

function statusIcon(status: string) {
  if (status === 'COMPLETED' || status === 'APPROVED') return <CheckCircle2 size={16} />;
  if (status === 'RUNNING' || status === 'IN_PROGRESS') return <Activity size={16} />;
  return <Circle size={16} />;
}

function taskMeta(task: LiveMapTask) {
  const parts: string[] = [];
  if (task.agentRuns.length > 0) parts.push(`${task.agentRuns.length} agent run${task.agentRuns.length === 1 ? '' : 's'}`);
  if (task.approvals.length > 0) parts.push(`${task.approvals.length} approval${task.approvals.length === 1 ? '' : 's'}`);
  if (task.artifacts.length > 0) parts.push(`${task.artifacts.length} artifact${task.artifacts.length === 1 ? '' : 's'}`);
  return parts.length > 0 ? parts.join(' · ') : 'No execution data yet';
}

export function LiveMapPage() {
  const [view, setView] = useState<LiveMapView | null>(null);
  const [approvals, setApprovals] = useState<PendingSplineApproval[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [map, pending] = await Promise.all([loadLiveMap(), loadPendingSplineApprovals()]);
    setView(map);
    setApprovals(pending);
    setSelectedJobId(current => current ?? map.jobs[0]?.id ?? null);
  }, []);

  useEffect(() => {
    refresh().catch(err => setError(err instanceof Error ? err.message : 'Live Map could not be loaded'));
  }, [refresh]);

  const selectedJob: LiveMapJob | undefined = useMemo(
    () => view?.jobs.find(job => job.id === selectedJobId) ?? view?.jobs[0],
    [view, selectedJobId]
  );

  async function prepareEditProof() {
    setBusy(true);
    setFlash(null);
    try {
      await createSplineEditProof();
      await refresh();
      setFlash('Safe Spline edit proof created. Review it before execution.');
    } catch (err) {
      setFlash(err instanceof Error ? err.message : 'Could not create edit proof');
    } finally {
      setBusy(false);
    }
  }

  async function decide(productionJobId: string, decision: 'APPROVE' | 'REQUEST_CHANGES') {
    setBusy(true);
    setFlash(null);
    try {
      await decideSplineJob(
        productionJobId,
        decision,
        decision === 'REQUEST_CHANGES' ? 'Creator requested changes from the Approval Feed.' : undefined
      );
      await refresh();
      setFlash(
        decision === 'APPROVE'
          ? 'Approved. The Spline job is queued for the worker.'
          : 'Changes requested. The Spline job will not execute.'
      );
    } catch (err) {
      setFlash(err instanceof Error ? err.message : 'Could not save decision');
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return <main className="loading">{error}</main>;
  }

  if (!view) {
    return <main className="loading">Loading Media OS Live Map…</main>;
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="agent-icon"><Network size={18} /></div>
        <div className="agent-heading">
          <div>
            <strong>Media OS Live Map</strong>
            <span>{view.project.name} · {view.project.status}</span>
          </div>
        </div>
        <StatusPill>LIVE</StatusPill>
      </header>

      <section className="approval-feed">
        <div className="approval-feed-heading">
          <div>
            <div className="review-label">APPROVAL FEED</div>
            <h2>Spline Agent decisions</h2>
            <p className="muted">Nothing reaches the production worker until you approve it.</p>
          </div>
          {approvals.length === 0 && (
            <button className="prepare-proof-button" disabled={busy} onClick={prepareEditProof}>
              <Plus size={16} />
              Prepare safe edit proof
            </button>
          )}
        </div>

        {flash && <div className="flash">{flash}</div>}

        {approvals.length === 0 ? (
          <div className="approval-empty">
            <ShieldCheck size={20} />
            <div>
              <strong>No decisions waiting.</strong>
              <span>Create the first controlled edit job for MEDIA_OS_CONNECTION_TEST.</span>
            </div>
          </div>
        ) : (
          <div className="approval-card-list">
            {approvals.map(approval => (
              <article className="approval-card" key={approval.approvalId}>
                <div className="approval-card-top">
                  <div>
                    <span>{approval.taskType}</span>
                    <strong>{approval.name}</strong>
                  </div>
                  <div className="approval-state">WAITING APPROVAL</div>
                </div>

                <p>{approval.instructions}</p>

                <div className="approval-meta-grid">
                  <div>
                    <span>Target</span>
                    <strong>{approval.target}</strong>
                  </div>
                  <div>
                    <span>Allowed</span>
                    <strong>{approval.permissions.join(' · ')}</strong>
                  </div>
                  <div className="approval-meta-wide">
                    <span>Protected</span>
                    <strong>{approval.protectedObjects.join(' · ')}</strong>
                  </div>
                </div>

                <div className="approval-actions">
                  <button
                    className="request-changes-button"
                    disabled={busy}
                    onClick={() => decide(approval.productionJobId, 'REQUEST_CHANGES')}
                  >
                    <XCircle size={16} />
                    Request changes
                  </button>
                  <button
                    className="approve-job-button"
                    disabled={busy}
                    onClick={() => decide(approval.productionJobId, 'APPROVE')}
                  >
                    <Play size={16} />
                    Approve & queue
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="live-map-shell">
        <aside className="live-map-sidebar">
          <div className="review-label">PROJECT</div>
          <h2>{view.project.name}</h2>
          <p className="muted">Operational state of jobs, tasks, agents, approvals, artifacts and execution events.</p>

          <div className="project-summary">
            <div><span>Jobs</span><strong>{view.jobs.length}</strong></div>
            <div><span>Status</span><strong>{view.project.status}</strong></div>
          </div>

          <div className="job-list">
            {view.jobs.map(job => (
              <button
                key={job.id}
                className={`job-card ${selectedJob?.id === job.id ? 'selected' : ''}`}
                onClick={() => setSelectedJobId(job.id)}
              >
                <div>
                  <strong>{job.name}</strong>
                  <span>{job.type}</span>
                </div>
                <div className="job-progress">{job.progress}%</div>
              </button>
            ))}
          </div>
        </aside>

        <section className="live-map-main">
          {selectedJob ? (
            <>
              <div className="live-map-heading">
                <div>
                  <div className="episode-kicker">ACTIVE JOB</div>
                  <h1>{selectedJob.name}</h1>
                  <p className="muted">{selectedJob.type} · {selectedJob.status} · {selectedJob.progress}% complete</p>
                </div>
                <div className="progress-ring">{selectedJob.progress}%</div>
              </div>

              <div className="flow-stack">
                {selectedJob.tasks.map((task, index) => (
                  <article className="flow-task" key={task.id}>
                    <div className="flow-index">{index + 1}</div>
                    <div className="flow-rail">
                      <div className={`flow-dot ${task.status.toLowerCase()}`} />
                      {index < selectedJob.tasks.length - 1 && <div className="flow-line-vertical" />}
                    </div>
                    <div className="flow-task-card">
                      <div className="flow-task-title">
                        <div>
                          <strong>{task.name}</strong>
                          <span>{task.type}</span>
                        </div>
                        <div className={`task-status ${task.status.toLowerCase()}`}>
                          {statusIcon(task.status)}
                          {task.status}
                        </div>
                      </div>

                      <p>{taskMeta(task)}</p>

                      {(task.agentRuns.length > 0 || task.approvals.length > 0 || task.artifacts.length > 0) && (
                        <div className="execution-grid">
                          <div><Bot size={15} /><span>Agents</span><strong>{task.agentRuns.length}</strong></div>
                          <div><ShieldCheck size={15} /><span>Approvals</span><strong>{task.approvals.length}</strong></div>
                          <div><Box size={15} /><span>Artifacts</span><strong>{task.artifacts.length}</strong></div>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-map">No jobs yet.</div>
          )}
        </section>

        <aside className="live-map-events">
          <div className="review-label">ACTIVITY</div>
          <h2>Event stream</h2>
          <div className="event-list">
            {view.events.map(event => (
              <article className="event-card" key={event.id}>
                <Clock3 size={14} />
                <div>
                  <strong>{event.type.replaceAll('_', ' ')}</strong>
                  <p>{event.message}</p>
                </div>
              </article>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}
