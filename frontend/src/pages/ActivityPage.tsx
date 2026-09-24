import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, CheckCircle2, Clock3, RefreshCw, XCircle } from 'lucide-react';
import {
  loadLatestSplineJob,
  loadLiveMap,
  loadRunnerStatus,
  type LatestSplineJob,
  type LiveMapJob,
  type LiveMapView,
  type RunnerStatus
} from '../api/mediaOsApi';

function statusIcon(status: string) {
  if (status === 'COMPLETED' || status === 'APPROVED' || status === 'SUCCEEDED') {
    return <CheckCircle2 size={16} />;
  }
  if (status === 'FAILED' || status === 'REJECTED') {
    return <XCircle size={16} />;
  }
  if (status === 'RUNNING' || status === 'IN_PROGRESS' || status === 'CLAIMED') {
    return <Activity size={16} />;
  }
  return <Clock3 size={16} />;
}

export function ActivityPage() {
  const [map, setMap] = useState<LiveMapView | null>(null);
  const [latest, setLatest] = useState<LatestSplineJob | null>(null);
  const [runner, setRunner] = useState<RunnerStatus | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const [liveMap, latestSplineJob, runnerStatus] = await Promise.all([
        loadLiveMap(),
        loadLatestSplineJob(),
        loadRunnerStatus()
      ]);
      setMap(liveMap);
      setLatest(latestSplineJob);
      setRunner(runnerStatus);
      setSelectedJobId(current => current ?? liveMap.jobs[0]?.id ?? null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load production activity');
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const selectedJob: LiveMapJob | undefined = useMemo(
    () => map?.jobs.find(job => job.id === selectedJobId) ?? map?.jobs[0],
    [map, selectedJobId]
  );

  return (
    <main className="media-os-page media-os-activity-page">
      <header className="media-os-page-header compact">
        <div>
          <span className="media-os-eyebrow">ACTIVITY</span>
          <h1>Production activity</h1>
          <p>Read-only view of current jobs, task progress and the latest Spline execution.</p>
        </div>
        <button className="media-os-header-refresh" disabled={busy} onClick={() => void refresh()}>
          <RefreshCw size={17} className={busy ? 'spin' : ''} />
          Refresh
        </button>
      </header>

      {error && <div className="media-os-inline-error">{error}</div>}

      <section className="media-os-activity-summary">
        <article>
          <span>PROJECT</span>
          <strong>{map?.project.name ?? 'Media OS'}</strong>
          <small>{map?.project.status ?? 'Loading…'}</small>
        </article>
        <article>
          <span>SPLINE BRIDGE</span>
          <strong>{runner?.online ? 'ONLINE' : 'OFFLINE'}</strong>
          <small>{runner?.hostname ?? 'No runner registered'}</small>
        </article>
        <article>
          <span>LATEST SPLINE EXECUTION</span>
          <strong>{latest?.status ?? 'NONE'}</strong>
          <small>{latest?.taskType ?? 'No execution yet'}</small>
        </article>
      </section>

      <section className="media-os-activity-layout">
        <aside className="media-os-job-list">
          <div className="media-os-activity-heading">
            <span>JOBS</span>
            <strong>{map?.jobs.length ?? 0} available</strong>
          </div>
          {map?.jobs.length ? map.jobs.map(job => (
            <button
              key={job.id}
              className={job.id === selectedJob?.id ? 'active' : ''}
              onClick={() => setSelectedJobId(job.id)}
            >
              <div>{statusIcon(job.status)}</div>
              <div>
                <strong>{job.name}</strong>
                <span>{job.type} · {job.status}</span>
              </div>
              <small>{job.progress}%</small>
            </button>
          )) : (
            <div className="media-os-activity-empty">No production jobs yet.</div>
          )}
        </aside>

        <section className="media-os-task-list">
          <div className="media-os-activity-heading">
            <span>SELECTED JOB</span>
            <strong>{selectedJob?.name ?? 'No job selected'}</strong>
          </div>

          {selectedJob?.tasks.length ? selectedJob.tasks.map(task => (
            <article key={task.id}>
              <div className={`media-os-task-status ${task.status.toLowerCase()}`}>{statusIcon(task.status)}</div>
              <div>
                <strong>{task.name}</strong>
                <span>{task.type} · {task.status}</span>
                <small>
                  {task.agentRuns.length} agent run{task.agentRuns.length === 1 ? '' : 's'} · {' '}
                  {task.approvals.length} approval{task.approvals.length === 1 ? '' : 's'} · {' '}
                  {task.artifacts.length} artifact{task.artifacts.length === 1 ? '' : 's'}
                </small>
              </div>
            </article>
          )) : (
            <div className="media-os-activity-empty">No tasks for this job.</div>
          )}
        </section>
      </section>
    </main>
  );
}
