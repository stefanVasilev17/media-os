import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Clock3,
  Eraser,
  Minus,
  Plus,
  RefreshCw,
  RotateCcw,
  Send,
  Stethoscope,
  X
} from 'lucide-react';
import {
  createSplineChatCommand,
  decideSplineJob,
  loadLatestSplineJob,
  loadPendingSplineApprovals,
  loadSplineChat,
  loadSplineSnapshotMeta,
  requestSplineSnapshot,
  splineSnapshotImageUrl,
  type LatestSplineJob,
  type PendingSplineApproval,
  type SplineChatMessage,
  type SplineSnapshotMeta
} from '../api/mediaOsApi';

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function commandText(instructions: string) {
  return instructions
    .replace('Execute exactly this creator command in the focused Spline scene: ', '')
    .replace(' Do not change unrelated objects. Verify the requested result before reporting success.', '');
}

type CommandActivity = {
  tone: 'working' | 'waiting' | 'success' | 'error' | 'cancelled';
  label: string;
  detail: string;
  spinning?: boolean;
};

function commandActivityForStatus(status?: string | null, error?: string | null): CommandActivity | null {
  switch (status) {
    case 'WAITING_APPROVAL':
      return {
        tone: 'waiting',
        label: 'Waiting for your approval',
        detail: 'The command is prepared. Review it below, then tap Approve to allow execution.'
      };
    case 'QUEUED':
      return {
        tone: 'working',
        label: 'Approved — waiting for Spline Agent',
        detail: 'The Local Runner is waiting to claim this command.',
        spinning: true
      };
    case 'CLAIMED':
      return {
        tone: 'working',
        label: 'Spline Agent claimed the command',
        detail: 'The production worker has picked up the job and is preparing execution.',
        spinning: true
      };
    case 'RUNNING':
      return {
        tone: 'working',
        label: 'Spline Agent is working',
        detail: 'The approved change is being executed in Spline. Keep the Spline desktop session available.',
        spinning: true
      };
    case 'SUCCEEDED':
      return {
        tone: 'success',
        label: 'Command completed',
        detail: 'Spline Agent reported success. Refresh the map to review the visual result.'
      };
    case 'FAILED':
      return {
        tone: 'error',
        label: 'Command failed',
        detail: error?.trim() || 'The change did not complete. Open Diagnostics for the execution error before retrying.'
      };
    case 'CHANGES_REQUESTED':
      return {
        tone: 'cancelled',
        label: 'Command cancelled',
        detail: 'The command was not allowed to execute.'
      };
    default:
      return null;
  }
}

function SplineMapViewer({
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
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef({ distance: 0, scale: 1 });

  const reset = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  const zoom = (delta: number) => setScale(current => clamp(current + delta, 1, 6));

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
      const dx = event.clientX - previous.x;
      const dy = event.clientY - previous.y;
      setOffset(current => ({ x: current.x + dx, y: current.y + dy }));
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
    <section className="spline-map-card">
      <div className="spline-map-toolbar">
        <div>
          <span>CURRENT SPLINE MAP</span>
          <strong>{meta?.status === 'READY' ? 'Latest desktop snapshot' : 'No snapshot yet'}</strong>
          {meta?.capturedAt && <small>{new Date(meta.capturedAt).toLocaleString()}</small>}
        </div>

        <div className="spline-map-actions">
          <button onClick={() => zoom(-0.5)} aria-label="Zoom out"><Minus size={16} /></button>
          <button onClick={reset} aria-label="Reset zoom"><RotateCcw size={16} /></button>
          <button onClick={() => zoom(0.5)} aria-label="Zoom in"><Plus size={16} /></button>
          <button className="snapshot-refresh" disabled={refreshing} onClick={onRefresh}>
            <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
            {refreshing ? 'Capturing…' : 'Refresh map'}
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
            alt="Current Spline map snapshot"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`
            }}
          />
        ) : (
          <div className="spline-map-empty">
            <strong>No map image yet.</strong>
            <span>Keep Spline open on the laptop and tap Refresh map.</span>
          </div>
        )}
      </div>
    </section>
  );
}

async function clearFrontendCache() {
  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map(key => caches.delete(key)));
  }

  localStorage.clear();
  sessionStorage.clear();

  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(registration => registration.update()));
  }

  const url = new URL(window.location.href);
  url.searchParams.set('cacheBust', Date.now().toString());
  window.location.replace(url.toString());
}

export function SplineAgentPage() {
  const [meta, setMeta] = useState<SplineSnapshotMeta | null>(null);
  const [messages, setMessages] = useState<SplineChatMessage[]>([]);
  const [approvals, setApprovals] = useState<PendingSplineApproval[]>([]);
  const [latestExecution, setLatestExecution] = useState<LatestSplineJob | null>(null);
  const [message, setMessage] = useState('');
  const [flash, setFlash] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [transientActivity, setTransientActivity] = useState<CommandActivity | null>(null);

  const refresh = useCallback(async () => {
    const [snapshot, chat, pending, latest] = await Promise.all([
      loadSplineSnapshotMeta(),
      loadSplineChat(),
      loadPendingSplineApprovals(),
      loadLatestSplineJob()
    ]);

    setMeta(snapshot);
    setMessages(chat);
    setApprovals(pending.filter(item => item.taskType.startsWith('CREATOR_SPLINE_COMMAND_')));
    setLatestExecution(latest);
  }, []);

  useEffect(() => {
    refresh().catch(error => {
      setFlash(error instanceof Error ? error.message : 'Could not load Spline Agent');
    });
  }, [refresh]);

  const pending = useMemo(() => approvals[0], [approvals]);
  const latestCommand = messages.length > 0 ? messages[messages.length - 1] : null;
  const latestCommandStatus = latestCommand?.status ?? null;
  const commandInFlight = Boolean(
    latestCommandStatus && ['WAITING_APPROVAL', 'QUEUED', 'CLAIMED', 'RUNNING'].includes(latestCommandStatus)
  );
  const commandActivity = transientActivity ?? commandActivityForStatus(latestCommandStatus, latestCommand?.error);

  useEffect(() => {
    if (!latestCommandStatus || !['QUEUED', 'CLAIMED', 'RUNNING'].includes(latestCommandStatus)) {
      return;
    }

    const timer = window.setInterval(() => {
      refresh().catch(error => {
        setFlash(error instanceof Error ? error.message : 'Could not refresh command status');
      });
    }, 2500);

    return () => window.clearInterval(timer);
  }, [latestCommandStatus, refresh]);

  async function captureSnapshot() {
    setRefreshing(true);
    setFlash(null);
    const previousId = meta?.id;

    try {
      await requestSplineSnapshot();

      for (let attempt = 0; attempt < 20; attempt += 1) {
        await new Promise(resolve => window.setTimeout(resolve, 1500));
        const next = await loadSplineSnapshotMeta();

        if (next.status === 'READY' && next.id !== previousId) {
          setMeta(next);
          setFlash('Map refreshed.');
          return;
        }
      }

      setFlash('Snapshot did not update within 30 seconds. Check that Spline is visible and no Windows dialog is covering it, then try again.');
    } catch (error) {
      setFlash(error instanceof Error ? error.message : 'Could not capture Spline map');
    } finally {
      setRefreshing(false);
    }
  }

  async function sendCommand() {
    const text = message.trim();
    if (!text) return;

    setBusy(true);
    setFlash(null);
    setTransientActivity({
      tone: 'working',
      label: 'Preparing command…',
      detail: 'Media OS is saving your request and creating the approval step.',
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
        label: 'Could not prepare command',
        detail: error instanceof Error ? error.message : 'Media OS could not create the approval step.'
      });
      setFlash(error instanceof Error ? error.message : 'Could not prepare Spline command');
    } finally {
      setBusy(false);
    }
  }

  async function decide(decision: 'APPROVE' | 'REQUEST_CHANGES') {
    if (!pending) return;

    setBusy(true);
    setFlash(null);
    setTransientActivity(
      decision === 'APPROVE'
        ? {
            tone: 'working',
            label: 'Approving command…',
            detail: 'Media OS is releasing this command to the Spline production worker.',
            spinning: true
          }
        : {
            tone: 'working',
            label: 'Cancelling command…',
            detail: 'Media OS is preventing this command from executing.',
            spinning: true
          }
    );

    try {
      await decideSplineJob(
        pending.productionJobId,
        decision,
        decision === 'REQUEST_CHANGES'
          ? 'Creator cancelled the command from Spline Agent chat.'
          : undefined
      );
      await refresh();
      setTransientActivity(null);
      setFlash(decision === 'APPROVE' ? 'Command approved and queued.' : 'Command cancelled.');
    } catch (error) {
      setTransientActivity({
        tone: 'error',
        label: 'Could not save decision',
        detail: error instanceof Error ? error.message : 'Media OS could not update this command.'
      });
      setFlash(error instanceof Error ? error.message : 'Could not save command decision');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="spline-agent-shell">
      <header className="spline-agent-header">
        <button
          className="icon-button"
          onClick={() => { window.location.hash = '#/'; }}
          aria-label="Back"
        >
          <ArrowLeft size={19} />
        </button>

        <div className="spline-agent-title">
          <span>SPLINE AGENT</span>
          <strong>Living Map control</strong>
        </div>

        <div className="spline-agent-header-actions">
          <button onClick={() => { window.location.hash = '#/diagnostics'; }}>
            <Stethoscope size={16} />
            Diagnostics
          </button>
          <button onClick={() => void clearFrontendCache()}>
            <Eraser size={16} />
            Clear cache
          </button>
        </div>
      </header>

      <div className="spline-agent-content">
        {flash && <div className="spline-agent-flash">{flash}</div>}

        <SplineMapViewer
          meta={meta}
          refreshing={refreshing}
          onRefresh={captureSnapshot}
        />

        <section className="spline-chat-card">
          <div className="spline-chat-heading">
            <div>
              <span>COMMAND CHAT</span>
              <strong>Tell Spline Agent what to change</strong>
            </div>
          </div>

          {commandActivity && (
            <div className={`spline-command-activity ${commandActivity.tone}`}>
              <div className="spline-command-activity-icon">
                {commandActivity.spinning ? (
                  <RefreshCw size={17} className="spin" />
                ) : commandActivity.tone === 'success' ? (
                  <Check size={17} />
                ) : commandActivity.tone === 'error' || commandActivity.tone === 'cancelled' ? (
                  <X size={17} />
                ) : (
                  <Clock3 size={17} />
                )}
              </div>
              <div>
                <strong>{commandActivity.label}</strong>
                <span>{commandActivity.detail}</span>
                {latestExecution?.result?.metrics && ['SUCCEEDED', 'FAILED'].includes(latestExecution.status) && (
                  <span className="spline-command-metrics">
                    {latestExecution.result.metrics.tokenCount ?? '—'} tokens
                    {' · '}
                    {latestExecution.result.metrics.splineMcpCalls ?? '—'} MCP
                    {' · '}
                    {typeof latestExecution.result.metrics.durationMs === 'number'
                      ? `${(latestExecution.result.metrics.durationMs / 1000).toFixed(1)}s`
                      : '—'}
                    {' · '}
                    {latestExecution.result.metrics.executionProfile ?? 'UNKNOWN_PROFILE'}
                    {latestExecution.result.metrics.recipeCache
                      ? ` · recipe ${latestExecution.result.metrics.recipeCache}`
                      : ''}
                    {typeof latestExecution.result.metrics.recipeChars === 'number'
                      ? ` · ${latestExecution.result.metrics.recipeChars} chars`
                      : ''}
                    {latestExecution.result.metrics.reasoningEffort
                      ? ` · ${latestExecution.result.metrics.reasoningEffort} reasoning`
                      : ''}
                    {typeof latestExecution.result.metrics.mcpToolSurface === 'number'
                      ? ` · ${latestExecution.result.metrics.mcpToolSurface} tools`
                      : ''}
                    {typeof latestExecution.result.metrics.efficiencyBudgetExceeded === 'boolean'
                      ? latestExecution.result.metrics.efficiencyBudgetExceeded
                        ? ' · budget OVER'
                        : ' · budget OK'
                      : ''}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="spline-chat-history">
            {messages.length === 0 ? (
              <div className="spline-chat-empty">
                Use the map above for context, then describe the exact change you want.
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

          {pending && (
            <div className="spline-pending-command">
              <div>
                <span>READY FOR APPROVAL</span>
                <strong>
                  {typeof pending.payload.creatorMessage === 'string'
                    ? pending.payload.creatorMessage
                    : commandText(pending.instructions)}
                </strong>
              </div>
              <div>
                <button
                  className="cancel-command"
                  disabled={busy}
                  onClick={() => void decide('REQUEST_CHANGES')}
                >
                  <X size={16} />
                  Cancel
                </button>
                <button
                  className="approve-command"
                  disabled={busy}
                  onClick={() => void decide('APPROVE')}
                >
                  <Check size={16} />
                  Approve
                </button>
              </div>
            </div>
          )}

          <div className="spline-chat-composer">
            <textarea
              value={message}
              onChange={event => setMessage(event.target.value)}
              placeholder="Example: Move AUTH_SERVICE 80px to the right and keep all connected paths aligned."
              rows={3}
              onKeyDown={event => {
                if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                  event.preventDefault();
                  void sendCommand();
                }
              }}
            />
            <button
              disabled={busy || !message.trim() || commandInFlight}
              onClick={() => void sendCommand()}
            >
              <Send size={17} />
              Send
            </button>
          </div>

          {pending ? (
            <small className="spline-chat-note">
              Approve or cancel the current command before sending another one.
            </small>
          ) : commandInFlight ? (
            <small className="spline-chat-note">
              Wait for the current Spline command to finish before sending another one.
            </small>
          ) : null}
        </section>
      </div>
    </main>
  );
}
