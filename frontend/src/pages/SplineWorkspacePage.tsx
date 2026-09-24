import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Clock3,
  HeartPulse,
  Map as MapIcon,
  MessageSquare,
  Minus,
  Plus,
  RefreshCw,
  RotateCcw,
  Send,
  X
} from 'lucide-react';
import {
  createSplineChatCommand,
  decideSplineJob,
  loadLatestSplineJob,
  loadPendingSplineApprovals,
  loadRunnerStatus,
  loadSplineChat,
  loadSplineSnapshotMeta,
  requestSplineSnapshot,
  splineSnapshotImageUrl,
  type LatestSplineJob,
  type PendingSplineApproval,
  type RunnerStatus,
  type SplineChatMessage,
  type SplineSnapshotMeta
} from '../api/mediaOsApi';

type WorkspaceView = 'chat' | 'map' | 'health';

type CommandActivity = {
  tone: 'working' | 'waiting' | 'success' | 'error' | 'cancelled';
  label: string;
  detail: string;
  spinning?: boolean;
};

function initialWorkspaceView(): WorkspaceView {
  const query = window.location.hash.split('?')[1] ?? '';
  const requested = new URLSearchParams(query).get('view');
  return requested === 'map' || requested === 'health' ? requested : 'chat';
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function commandText(instructions: string) {
  return instructions
    .replace('Execute exactly this creator command in the focused Spline scene: ', '')
    .replace(' Do not change unrelated objects. Verify the requested result before reporting success.', '');
}

function activityForStatus(status?: string | null, error?: string | null): CommandActivity | null {
  switch (status) {
    case 'WAITING_APPROVAL':
      return {
        tone: 'waiting',
        label: 'Ready for your approval',
        detail: 'Review the prepared change below, then approve or cancel it.'
      };
    case 'QUEUED':
      return {
        tone: 'working',
        label: 'Approved — waiting for the Spline worker',
        detail: 'The command is queued and will start when the production bridge claims it.',
        spinning: true
      };
    case 'CLAIMED':
      return {
        tone: 'working',
        label: 'Spline Agent claimed the command',
        detail: 'The worker is preparing the requested scene operation.',
        spinning: true
      };
    case 'RUNNING':
      return {
        tone: 'working',
        label: 'Spline Agent is working',
        detail: 'The approved scene change is being executed now.',
        spinning: true
      };
    case 'SUCCEEDED':
      return {
        tone: 'success',
        label: 'Command completed',
        detail: 'The requested Spline change completed successfully.'
      };
    case 'FAILED':
      return {
        tone: 'error',
        label: 'Command failed',
        detail: error?.trim() || 'The Spline change did not complete.'
      };
    case 'CHANGES_REQUESTED':
      return {
        tone: 'cancelled',
        label: 'Command cancelled',
        detail: 'The prepared change was not released to the production worker.'
      };
    default:
      return null;
  }
}

function SplineMap({
  meta,
  refreshing,
  onRefresh
}: {
  meta: SplineSnapshotMeta | null;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const pointers = useRef(new globalThis.Map<number, { x: number; y: number }>());
  const pinch = useRef({ distance: 0, scale: 1 });

  function reset() {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }

  function zoom(delta: number) {
    setScale(current => clamp(current + delta, 1, 6));
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.current.size === 2) {
      const [a, b] = Array.from(pointers.current.values());
      pinch.current = {
        distance: Math.hypot(a.x - b.x, a.y - b.y),
        scale
      };
    }
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const previous = pointers.current.get(event.pointerId);
    if (!previous) return;

    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.current.size === 1) {
      setOffset(current => ({
        x: current.x + event.clientX - previous.x,
        y: current.y + event.clientY - previous.y
      }));
      return;
    }

    if (pointers.current.size === 2) {
      const [a, b] = Array.from(pointers.current.values());
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch.current.distance > 0) {
        setScale(clamp(pinch.current.scale * (distance / pinch.current.distance), 1, 6));
      }
    }
  }

  function releasePointer(event: React.PointerEvent<HTMLDivElement>) {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) {
      pinch.current.distance = 0;
      pinch.current.scale = scale;
    }
  }

  return (
    <section className="spline-workspace-panel spline-map-panel">
      <div className="spline-panel-heading">
        <div>
          <span>CURRENT MAP</span>
          <strong>{meta?.status === 'READY' ? 'Latest Spline snapshot' : 'No snapshot yet'}</strong>
          {meta?.capturedAt && <small>Updated {new Date(meta.capturedAt).toLocaleString()}</small>}
        </div>
        <div className="spline-map-actions">
          <button onClick={() => zoom(-0.5)} aria-label="Zoom out"><Minus size={16} /></button>
          <button onClick={reset} aria-label="Reset zoom"><RotateCcw size={16} /></button>
          <button onClick={() => zoom(0.5)} aria-label="Zoom in"><Plus size={16} /></button>
          <button className="snapshot-refresh" disabled={refreshing} onClick={onRefresh}>
            <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
            {refreshing ? 'Refreshing…' : 'Refresh map'}
          </button>
        </div>
      </div>

      <div
        className="spline-map-viewport"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={releasePointer}
        onPointerCancel={releasePointer}
        onWheel={event => {
          event.preventDefault();
          zoom(event.deltaY < 0 ? 0.25 : -0.25);
        }}
      >
        {meta?.status === 'READY' ? (
          <img
            draggable={false}
            src={splineSnapshotImageUrl(meta.id)}
            alt="Current Spline architecture map"
            style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
          />
        ) : (
          <div className="spline-map-empty">
            <strong>No map image yet</strong>
            <span>Keep the Spline production session available, then tap Refresh map.</span>
          </div>
        )}
      </div>
    </section>
  );
}

export function SplineWorkspacePage() {
  const [activeView, setActiveView] = useState<WorkspaceView>(() => initialWorkspaceView());
  const [meta, setMeta] = useState<SplineSnapshotMeta | null>(null);
  const [messages, setMessages] = useState<SplineChatMessage[]>([]);
  const [approvals, setApprovals] = useState<PendingSplineApproval[]>([]);
  const [latestExecution, setLatestExecution] = useState<LatestSplineJob | null>(null);
  const [runner, setRunner] = useState<RunnerStatus | null>(null);
  const [message, setMessage] = useState('');
  const [flash, setFlash] = useState<string | null>(null);
  const [refreshingMap, setRefreshingMap] = useState(false);
  const [busy, setBusy] = useState(false);
  const [transientActivity, setTransientActivity] = useState<CommandActivity | null>(null);

  const refresh = useCallback(async () => {
    const [snapshot, chat, pending, latest, runnerStatus] = await Promise.all([
      loadSplineSnapshotMeta(),
      loadSplineChat(),
      loadPendingSplineApprovals(),
      loadLatestSplineJob(),
      loadRunnerStatus()
    ]);

    setMeta(snapshot);
    setMessages(chat);
    setApprovals(pending.filter(item => item.taskType.startsWith('CREATOR_SPLINE_COMMAND_')));
    setLatestExecution(latest);
    setRunner(runnerStatus);
  }, []);

  useEffect(() => {
    refresh().catch(error => {
      setFlash(error instanceof Error ? error.message : 'Could not load Spline Agent');
    });
  }, [refresh]);

  const pendingApproval = useMemo(() => approvals[0], [approvals]);
  const latestCommand = messages.length > 0 ? messages[messages.length - 1] : null;
  const latestStatus = latestCommand?.status ?? null;
  const commandInFlight = Boolean(
    latestStatus && ['WAITING_APPROVAL', 'QUEUED', 'CLAIMED', 'RUNNING'].includes(latestStatus)
  );
  const commandActivity = transientActivity ?? activityForStatus(latestStatus, latestCommand?.error);

  useEffect(() => {
    if (!latestStatus || !['QUEUED', 'CLAIMED', 'RUNNING'].includes(latestStatus)) return;
    const timer = window.setInterval(() => {
      refresh().catch(() => undefined);
    }, 2500);
    return () => window.clearInterval(timer);
  }, [latestStatus, refresh]);

  function selectView(view: WorkspaceView) {
    setActiveView(view);
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${window.location.search}#/agents/spline?view=${view}`
    );
  }

  async function refreshMap() {
    setRefreshingMap(true);
    setFlash(null);
    const previousId = meta?.id;

    try {
      await requestSplineSnapshot();
      for (let attempt = 0; attempt < 20; attempt += 1) {
        await new Promise(resolve => window.setTimeout(resolve, 1500));
        const next = await loadSplineSnapshotMeta();
        if (next.status === 'READY' && next.id !== previousId) {
          setMeta(next);
          setFlash('Current map refreshed.');
          return;
        }
      }
      setFlash('The map did not update within 30 seconds. Check the Spline production session and try again.');
    } catch (error) {
      setFlash(error instanceof Error ? error.message : 'Could not refresh the current map');
    } finally {
      setRefreshingMap(false);
    }
  }

  async function sendCommand() {
    const text = message.trim();
    if (!text) return;

    setBusy(true);
    setFlash(null);
    setTransientActivity({
      tone: 'working',
      label: 'Preparing your request',
      detail: 'Media OS is converting the message into an approval-ready Spline command.',
      spinning: true
    });

    try {
      await createSplineChatCommand(text);
      setMessage('');
      await refresh();
      setTransientActivity(null);
    } catch (error) {
      setTransientActivity({
        tone: 'error',
        label: 'Could not prepare the request',
        detail: error instanceof Error ? error.message : 'Media OS could not prepare this Spline command.'
      });
    } finally {
      setBusy(false);
    }
  }

  async function decide(decision: 'APPROVE' | 'REQUEST_CHANGES') {
    if (!pendingApproval) return;
    setBusy(true);
    setFlash(null);

    try {
      await decideSplineJob(
        pendingApproval.productionJobId,
        decision,
        decision === 'REQUEST_CHANGES' ? 'Creator cancelled the command from Spline Agent chat.' : undefined
      );
      await refresh();
      setTransientActivity(null);
      setFlash(decision === 'APPROVE' ? 'Command approved and queued.' : 'Command cancelled.');
    } catch (error) {
      setFlash(error instanceof Error ? error.message : 'Could not save the decision');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="media-os-page spline-workspace-page">
      <header className="media-os-page-header spline-workspace-header">
        <div>
          <span className="media-os-eyebrow">AGENT</span>
          <h1>Spline Agent</h1>
          <p>One place for scene instructions, current-map context and Spline production health.</p>
        </div>
        <div className={`spline-agent-connection ${runner?.online ? 'online' : 'offline'}`}>
          <span>{runner?.online ? 'Connected' : 'Standby'}</span>
          <strong>{runner?.status ?? 'UNKNOWN'}</strong>
        </div>
      </header>

      <nav className="spline-workspace-tabs" aria-label="Spline Agent sections">
        <button className={activeView === 'chat' ? 'active' : ''} onClick={() => selectView('chat')}>
          <MessageSquare size={17} /> Chat
        </button>
        <button className={activeView === 'map' ? 'active' : ''} onClick={() => selectView('map')}>
          <MapIcon size={17} /> Map
        </button>
        <button className={activeView === 'health' ? 'active' : ''} onClick={() => selectView('health')}>
          <HeartPulse size={17} /> Health
        </button>
      </nav>

      {flash && <div className="spline-agent-flash">{flash}</div>}

      {activeView === 'chat' && (
        <section className="spline-workspace-panel spline-chat-panel">
          <div className="spline-panel-heading">
            <div>
              <span>CHAT</span>
              <strong>Tell Spline Agent what you want changed</strong>
              <small>Write operations stay behind an approval step.</small>
            </div>
          </div>

          {commandActivity && (
            <div className={`spline-command-activity ${commandActivity.tone}`}>
              <div className="spline-command-activity-icon">
                {commandActivity.spinning ? <RefreshCw size={17} className="spin" />
                  : commandActivity.tone === 'success' ? <Check size={17} />
                    : commandActivity.tone === 'error' || commandActivity.tone === 'cancelled' ? <X size={17} />
                      : <Clock3 size={17} />}
              </div>
              <div>
                <strong>{commandActivity.label}</strong>
                <span>{commandActivity.detail}</span>
              </div>
            </div>
          )}

          <div className="spline-chat-history">
            {messages.length === 0 ? (
              <div className="spline-chat-empty">
                Describe the scene change in normal language. Media OS prepares it for approval before anything is edited.
              </div>
            ) : (
              messages.map(item => (
                <div className="spline-chat-message" key={item.id}>
                  <p>{item.content}</p>
                  <span>{item.status?.replaceAll('_', ' ') ?? 'SAVED'}</span>
                </div>
              ))
            )}
          </div>

          {pendingApproval && (
            <div className="spline-pending-command">
              <div>
                <span>READY FOR APPROVAL</span>
                <strong>
                  {typeof pendingApproval.payload.creatorMessage === 'string'
                    ? pendingApproval.payload.creatorMessage
                    : commandText(pendingApproval.instructions)}
                </strong>
              </div>
              <div>
                <button className="cancel-command" disabled={busy} onClick={() => void decide('REQUEST_CHANGES')}>
                  <X size={16} /> Cancel
                </button>
                <button className="approve-command" disabled={busy} onClick={() => void decide('APPROVE')}>
                  <Check size={16} /> Approve
                </button>
              </div>
            </div>
          )}

          <div className="spline-chat-composer">
            <textarea
              value={message}
              onChange={event => setMessage(event.target.value)}
              placeholder="Example: Move Auth Service slightly to the right and keep the connected paths aligned."
              rows={4}
              onKeyDown={event => {
                if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                  event.preventDefault();
                  void sendCommand();
                }
              }}
            />
            <button disabled={busy || !message.trim() || commandInFlight} onClick={() => void sendCommand()}>
              <Send size={17} /> Send
            </button>
          </div>

          {pendingApproval && (
            <small className="spline-chat-note">Approve or cancel the current request before sending another.</small>
          )}
        </section>
      )}

      {activeView === 'map' && (
        <SplineMap meta={meta} refreshing={refreshingMap} onRefresh={refreshMap} />
      )}

      {activeView === 'health' && (
        <section className="spline-health-grid">
          <article className="spline-workspace-panel spline-health-card">
            <div className="spline-health-icon"><CheckCircle2 size={19} /></div>
            <span>PRODUCTION BRIDGE</span>
            <strong>{runner?.online ? 'ONLINE' : 'OFFLINE'} · {runner?.status ?? 'UNKNOWN'}</strong>
            <p>{runner?.hostname ?? 'No runner registered'} · runner {runner?.runnerVersion ?? '—'}</p>
            <dl>
              <div><dt>Production commit</dt><dd>{runner?.productionCommit ?? '—'}</dd></div>
              <div><dt>Last heartbeat</dt><dd>{runner?.lastSeen ? new Date(runner.lastSeen).toLocaleString() : '—'}</dd></div>
              <div><dt>Last error</dt><dd>{runner?.lastError || 'None'}</dd></div>
            </dl>
          </article>

          <article className="spline-workspace-panel spline-health-card">
            <div className="spline-health-icon"><HeartPulse size={19} /></div>
            <span>LATEST SPLINE EXECUTION</span>
            <strong>{latestExecution?.status ?? 'NONE'}</strong>
            <dl>
              <div><dt>Task</dt><dd>{latestExecution?.taskType ?? '—'}</dd></div>
              <div><dt>Tokens</dt><dd>{latestExecution?.result?.metrics?.tokenCount?.toLocaleString() ?? '—'}</dd></div>
              <div><dt>MCP calls</dt><dd>{latestExecution?.result?.metrics?.splineMcpCalls ?? '—'}</dd></div>
              <div><dt>Duration</dt><dd>{latestExecution?.result?.metrics?.durationMs ? `${Math.round(latestExecution.result.metrics.durationMs / 1000)}s` : '—'}</dd></div>
              <div><dt>Error</dt><dd>{latestExecution?.error || 'None'}</dd></div>
            </dl>
          </article>

          <button className="spline-health-refresh" disabled={busy} onClick={() => void refresh()}>
            <RefreshCw size={16} className={busy ? 'spin' : ''} /> Refresh health
          </button>
        </section>
      )}
    </main>
  );
}
