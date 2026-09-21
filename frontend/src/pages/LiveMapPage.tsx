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
  RefreshCw,
  Search,
  ShieldCheck,
  XCircle
} from 'lucide-react';
import {
  createSplineEditProof,
  createSplineObjectEdit,
  decideSplineJob,
  loadLatestSplineJob,
  loadLiveMap,
  loadPendingSplineApprovals,
  loadSplineSceneCatalog,
  refreshSplineSceneCatalog,
  type LiveMapJob,
  type LiveMapTask,
  type LatestSplineJob,
  type LiveMapView,
  type PendingSplineApproval,
  type SplineCatalogNode,
  type SplineSceneCatalog
} from '../api/mediaOsApi';
import { StatusPill } from '../components/StatusPill';

function statusIcon(status: string) {
  if (status === 'COMPLETED' || status === 'APPROVED') return <CheckCircle2 size={16} />;
  if (status === 'RUNNING' || status === 'IN_PROGRESS') return <Activity size={16} />;
  return <Circle size={16} />;
}

function flattenCatalogNodes(nodes: SplineCatalogNode[]): SplineCatalogNode[] {
  return nodes.flatMap(node => [node, ...flattenCatalogNodes(node.children ?? [])]);
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
  const [latestSplineJob, setLatestSplineJob] = useState<LatestSplineJob | null>(null);
  const [sceneCatalog, setSceneCatalog] = useState<SplineSceneCatalog | null>(null);
  const [catalogBusy, setCatalogBusy] = useState(false);
  const [showObjectEdit, setShowObjectEdit] = useState(false);
  const [selectedSectionPath, setSelectedSectionPath] = useState('');
  const [objectSearch, setObjectSearch] = useState('');
  const [objectName, setObjectName] = useState('MEDIA_OS_CONNECTION_TEST');
  const [position, setPosition] = useState<[number, number, number]>([4700, 0, 0]);
  const [size, setSize] = useState<[number, number, number]>([60, 60, 60]);
  const [color, setColor] = useState('cyan');
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [map, pending, latest, catalog] = await Promise.all([
      loadLiveMap(),
      loadPendingSplineApprovals(),
      loadLatestSplineJob(),
      loadSplineSceneCatalog()
    ]);
    setView(map);
    setApprovals(pending);
    setLatestSplineJob(latest);
    setSceneCatalog(catalog);
    setSelectedJobId(current => current ?? map.jobs[0]?.id ?? null);

    if (catalog.status === 'READY' && catalog.catalog?.sections.length) {
      setSelectedSectionPath(current => current || catalog.catalog!.sections[0].path);
    }
  }, []);

  useEffect(() => {
    refresh().catch(err => setError(err instanceof Error ? err.message : 'Live Map could not be loaded'));
  }, [refresh]);

  const catalogSections = sceneCatalog?.catalog?.sections ?? [];
  const selectedSection = useMemo(
    () => catalogSections.find(section => section.path === selectedSectionPath) ?? catalogSections[0],
    [catalogSections, selectedSectionPath]
  );
  const selectedSectionObjects = useMemo(() => {
    if (!selectedSection) return [];
    const nodes = selectedSection.children?.length
      ? flattenCatalogNodes(selectedSection.children)
      : [selectedSection];
    const query = objectSearch.trim().toLowerCase();
    return query
      ? nodes.filter(node =>
          node.name.toLowerCase().includes(query) ||
          node.path.toLowerCase().includes(query) ||
          node.type.toLowerCase().includes(query)
        )
      : nodes;
  }, [selectedSection, objectSearch]);

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

  async function syncSceneCatalog() {
    setCatalogBusy(true);
    setFlash(null);
    try {
      await refreshSplineSceneCatalog();
      setFlash('Spline catalog refresh queued. The Local Runner will read the focused scene.');
      window.setTimeout(() => {
        refresh().catch(() => undefined);
      }, 8000);
    } catch (err) {
      setFlash(err instanceof Error ? err.message : 'Could not refresh Spline catalog');
    } finally {
      setCatalogBusy(false);
    }
  }

  async function prepareObjectEdit() {
    setBusy(true);
    setFlash(null);
    try {
      await createSplineObjectEdit({
        objectName: objectName.trim(),
        position,
        size,
        color: color.trim()
      });
      await refresh();
      setShowObjectEdit(false);
      setFlash('Controlled Spline object edit prepared. Review it before execution.');
    } catch (err) {
      setFlash(err instanceof Error ? err.message : 'Could not create controlled object edit');
    } finally {
      setBusy(false);
    }
  }

  function updateVector(
    current: [number, number, number],
    index: number,
    value: string,
    setter: (value: [number, number, number]) => void
  ) {
    const parsed = Number(value);
    const next: [number, number, number] = [...current] as [number, number, number];
    next[index] = Number.isFinite(parsed) ? parsed : 0;
    setter(next);
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
            <p className="muted">Edits require approval. Read-only scene catalog sync can run automatically.</p>
          </div>
          {approvals.length === 0 && (
            <div className="spline-create-actions">
              <button className="prepare-proof-button" disabled={busy} onClick={() => setShowObjectEdit(value => !value)}>
                <Plus size={16} />
                New controlled edit
              </button>
              <button className="secondary-proof-button" disabled={busy} onClick={prepareEditProof}>
                Safe proof
              </button>
            </div>
          )}
        </div>

        {flash && <div className="flash">{flash}</div>}

        {showObjectEdit && approvals.length === 0 && (
          <div className="spline-object-editor">
            <div className="spline-editor-heading">
              <div>
                <strong>Spline Agent v2 · targeted object edit</strong>
                <span>Sandbox scope: MEDIA_OS_* objects only. Execution still requires approval.</span>
              </div>
            </div>

            <div className="scene-catalog-panel">
              <div className="scene-catalog-toolbar">
                <div>
                  <span className="catalog-kicker">SCENE CATALOG</span>
                  <strong>{sceneCatalog?.sceneName ?? 'Not synced yet'}</strong>
                  <small>
                    {sceneCatalog?.status === 'READY'
                      ? `${sceneCatalog.objectCount ?? 0} objects · ${sceneCatalog.rootSectionCount ?? 0} sections`
                      : 'Sync the focused Spline scene to browse objects.'}
                  </small>
                </div>
                <button className="catalog-refresh-button" disabled={catalogBusy} onClick={syncSceneCatalog}>
                  <RefreshCw size={15} className={catalogBusy ? 'spin' : ''} />
                  {sceneCatalog?.status === 'READY' ? 'Refresh' : 'Sync scene'}
                </button>
              </div>

              {sceneCatalog?.status === 'READY' && catalogSections.length > 0 ? (
                <>
                  <label>
                    <span>Main section</span>
                    <select
                      value={selectedSection?.path ?? ''}
                      onChange={event => {
                        setSelectedSectionPath(event.target.value);
                        setObjectSearch('');
                        setObjectName('');
                      }}
                    >
                      {catalogSections.map(section => (
                        <option key={section.path} value={section.path}>
                          {section.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Find object in section</span>
                    <div className="catalog-search">
                      <Search size={15} />
                      <input
                        value={objectSearch}
                        onChange={event => setObjectSearch(event.target.value)}
                        placeholder="Search name, path or type"
                      />
                    </div>
                  </label>

                  <label>
                    <span>Object</span>
                    <select value={objectName} onChange={event => setObjectName(event.target.value)}>
                      <option value="">Select object…</option>
                      {selectedSectionObjects.map(node => (
                        <option key={node.path} value={node.name}>
                          {node.name} · {node.type}
                        </option>
                      ))}
                    </select>
                  </label>

                  {objectName && (
                    <div className="selected-object-summary">
                      <span>Selected</span>
                      <strong>{objectName}</strong>
                      <small>
                        {selectedSectionObjects.find(node => node.name === objectName)?.path ?? selectedSection?.path}
                      </small>
                    </div>
                  )}
                </>
              ) : (
                <div className="catalog-empty-state">
                  <strong>No catalog snapshot yet.</strong>
                  <span>Keep the correct Spline file focused, then sync the scene. This is read-only.</span>
                </div>
              )}
            </div>

            <div className="spline-vector-row">
              <div>
                <span>Position</span>
                <div className="vector-inputs">
                  {position.map((value, index) => (
                    <input
                      key={`position-${index}`}
                      type="number"
                      value={value}
                      onChange={event => updateVector(position, index, event.target.value, setPosition)}
                      aria-label={`Position ${['X', 'Y', 'Z'][index]}`}
                    />
                  ))}
                </div>
              </div>
              <div>
                <span>Size</span>
                <div className="vector-inputs">
                  {size.map((value, index) => (
                    <input
                      key={`size-${index}`}
                      type="number"
                      min="0.01"
                      value={value}
                      onChange={event => updateVector(size, index, event.target.value, setSize)}
                      aria-label={`Size ${['X', 'Y', 'Z'][index]}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <label>
              <span>Material color</span>
              <input value={color} onChange={event => setColor(event.target.value)} placeholder="cyan or #00ffff" />
            </label>

            {objectName && !objectName.startsWith('MEDIA_OS_') && (
              <div className="catalog-permission-note">
                This object is visible in the catalog, but v2 execution is still sandbox-limited to MEDIA_OS_* objects.
              </div>
            )}

            <button
              className="prepare-v2-button"
              disabled={busy || !objectName.trim() || !objectName.startsWith('MEDIA_OS_')}
              onClick={prepareObjectEdit}
            >
              <ShieldCheck size={16} />
              Prepare for approval
            </button>
          </div>
        )}

        {latestSplineJob && latestSplineJob.status !== 'NONE' && (
          <div className="spline-execution-metrics">
            <div>
              <span>Latest execution</span>
              <strong>{latestSplineJob.status}</strong>
            </div>
            <div>
              <span>Tokens</span>
              <strong>{latestSplineJob.result?.metrics?.tokenCount?.toLocaleString() ?? '—'}</strong>
            </div>
            <div>
              <span>Spline MCP calls</span>
              <strong>{latestSplineJob.result?.metrics?.splineMcpCalls ?? '—'}</strong>
            </div>
            <div>
              <span>Duration</span>
              <strong>
                {latestSplineJob.result?.metrics?.durationMs
                  ? `${Math.round(latestSplineJob.result.metrics.durationMs / 1000)}s`
                  : '—'}
              </strong>
            </div>
          </div>
        )}

        {approvals.length === 0 ? (
          <div className="approval-empty">
            <ShieldCheck size={20} />
            <div>
              <strong>No decisions waiting.</strong>
              <span>Select a catalog object, prepare an edit, then approve it before execution.</span>
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
