import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Clock3, HeartPulse, LoaderCircle, Play, RefreshCw, Send, X } from 'lucide-react';
import { AgentWorkspaceFrame } from '../components/AgentWorkspaceFrame';
import { ShotVideoPreviewOverlay } from '../components/ShotVideoPreviewOverlay';
import { SplineRuntimeComposer } from '../components/SplineRuntimeComposer';
import {
  createSplineChatCommand,
  decideSplineJob,
  loadLatestSplineJob,
  loadPendingSplineApprovals,
  loadRunnerStatus,
  loadSplineChat,
  type LatestSplineJob,
  type PendingSplineApproval,
  type RunnerStatus,
  type SplineChatMessage
} from '../api/mediaOsApi';
import {
  createSplineShotCommand,
  ensureSplineShotRender,
  loadLatestSplineShot,
  loadLatestSplineShotRender,
  loadSplineDirectorMemorySummary,
  type SplineShot,
  type SplineShotRender
} from '../api/splineShotApi';
import '../styles/splineShotDirector.css';

type CommandActivity = {
  tone: 'working' | 'waiting' | 'success' | 'error' | 'cancelled';
  label: string;
  detail: string;
  spinning?: boolean;
};

const CAPABILITIES = [
  { label: 'Create', description: 'Build temporary episode objects from reusable templates.' },
  { label: 'Edit', description: 'Rename, move and adjust live runtime objects.' },
  { label: 'Animate', description: 'Set states and trigger authored animations.' },
  { label: 'Frame', description: 'Direct camera framing and timing from chat.' },
  { label: 'Render', description: 'Generate a 1920×1080 MP4 director preview in the cloud.' }
];

const SHOT_TASK_TYPE = 'CREATE_RUNTIME_SHOT_V1';

function commandText(instructions: string) {
  return instructions
    .replace('Execute exactly this creator command in the focused Spline scene: ', '')
    .replace(' Do not change unrelated objects. Verify the requested result before reporting success.', '');
}

function looksLikeShotDirection(value: string) {
  const text = value.toLowerCase();
  return /\bshot\b|\bscene\b|\bpreview\b|\bcamera\b|\bseconds?\b|сцена|шот|кадър|камера|секунд/.test(text);
}

function explicitlyStartsNewShot(value: string) {
  const text = value.toLowerCase();
  return /\bnew shot\b|\bnext shot\b|\bshot\s*0?\d+\b|нова сцена|следваща сцена|нов шот|следващ шот/.test(text);
}

function activityForStatus(
  status?: string | null,
  error?: string | null,
  shotExecution = false
): CommandActivity | null {
  if (shotExecution) {
    switch (status) {
      case 'QUEUED':
        return { tone: 'working', label: 'Shot direction queued', detail: 'Spline Agent will turn your direction into a runtime ShotSpec.', spinning: true };
      case 'CLAIMED':
        return { tone: 'working', label: 'Spline Agent picked up the shot', detail: 'The agent is reading only the scene references needed for this shot.', spinning: true };
      case 'RUNNING':
        return { tone: 'working', label: 'Building the shot', detail: 'Camera beats, authored events and timing are being assembled without changing the master Spline file.', spinning: true };
      case 'SUCCEEDED':
        return { tone: 'success', label: 'Shot plan ready', detail: 'Media OS will render the 1920×1080 director preview in the cloud.' };
      case 'FAILED':
        return { tone: 'error', label: 'Shot could not be prepared', detail: error?.trim() || 'Open Advanced & health for the execution error.' };
      default:
        return null;
    }
  }

  switch (status) {
    case 'WAITING_APPROVAL':
      return { tone: 'waiting', label: 'Ready for your approval', detail: 'Review the prepared change below, then approve it or ask for another version.' };
    case 'QUEUED':
      return { tone: 'working', label: 'Approved and waiting', detail: 'Spline Agent will start the approved change as soon as the editing connection is available.', spinning: true };
    case 'CLAIMED':
      return { tone: 'working', label: 'Spline Agent picked up the request', detail: 'The requested change is being prepared now.', spinning: true };
    case 'RUNNING':
      return { tone: 'working', label: 'Spline Agent is working', detail: 'The approved scene change is being applied now.', spinning: true };
    case 'SUCCEEDED':
      return { tone: 'success', label: 'Change completed', detail: 'Spline Agent completed the requested change.' };
    case 'FAILED':
      return { tone: 'error', label: 'Change could not be completed', detail: error?.trim() || 'Open Advanced & health for technical details before retrying.' };
    case 'CHANGES_REQUESTED':
      return { tone: 'cancelled', label: 'Change cancelled', detail: 'The prepared change was not applied.' };
    default:
      return null;
  }
}

export function SplineWorkspacePage() {
  const [messages, setMessages] = useState<SplineChatMessage[]>([]);
  const [approvals, setApprovals] = useState<PendingSplineApproval[]>([]);
  const [latestExecution, setLatestExecution] = useState<LatestSplineJob | null>(null);
  const [runner, setRunner] = useState<RunnerStatus | null>(null);
  const [latestShot, setLatestShot] = useState<SplineShot | null>(null);
  const [latestRender, setLatestRender] = useState<SplineShotRender | null>(null);
  const [previewShot, setPreviewShot] = useState<SplineShot | null>(null);
  const [previewRender, setPreviewRender] = useState<SplineShotRender | null>(null);
  const [revisionShotId, setRevisionShotId] = useState<string | null>(null);
  const [shotJobId, setShotJobId] = useState<string | null>(null);
  const [memoryCount, setMemoryCount] = useState(0);
  const [message, setMessage] = useState('');
  const [flash, setFlash] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [transientActivity, setTransientActivity] = useState<CommandActivity | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const chatSectionRef = useRef<HTMLElement | null>(null);

  const refresh = useCallback(async () => {
    const [chat, pending, latest, runnerStatus, shot, memory] = await Promise.all([
      loadSplineChat(),
      loadPendingSplineApprovals(),
      loadLatestSplineJob(),
      loadRunnerStatus(),
      loadLatestSplineShot().catch(() => null),
      loadSplineDirectorMemorySummary().catch(() => ({ count: 0, recent: [] }))
    ]);

    let render: SplineShotRender | null = null;
    if (shot) {
      render = await loadLatestSplineShotRender(shot.id).catch(() => null);
      if (!render) {
        render = await ensureSplineShotRender(shot.id).catch(() => null);
      }
    }

    setMessages(chat);
    setApprovals(pending.filter(item => item.taskType.startsWith('CREATOR_SPLINE_COMMAND_')));
    setLatestExecution(latest);
    setRunner(runnerStatus);
    setLatestShot(shot);
    setLatestRender(render);
    setMemoryCount(memory.count);
  }, []);

  useEffect(() => {
    refresh().catch(error => {
      setFlash(error instanceof Error ? error.message : 'Could not load Spline Agent');
    });
  }, [refresh]);

  const pendingApproval = useMemo(() => approvals[0], [approvals]);
  const latestCommand = messages.length > 0 ? messages[messages.length - 1] : null;
  const latestStatus = latestCommand?.status ?? null;
  const isShotExecution = Boolean(
    latestExecution?.taskType === SHOT_TASK_TYPE ||
    (shotJobId && latestCommand?.productionJobId === shotJobId)
  );
  const commandInFlight = Boolean(latestStatus && ['WAITING_APPROVAL', 'QUEUED', 'CLAIMED', 'RUNNING'].includes(latestStatus));
  const renderInFlight = Boolean(latestRender && ['QUEUED', 'RENDERING'].includes(latestRender.status));
  const commandActivity = transientActivity ?? activityForStatus(latestStatus, latestCommand?.error, isShotExecution);
  const previewReady = Boolean(
    latestShot &&
    latestRender?.status === 'READY' &&
    latestRender.shotId === latestShot.id &&
    latestRender.videoUrl
  );
  const shotDirectorMode = Boolean(latestShot || revisionShotId || isShotExecution);

  useEffect(() => {
    if (!commandInFlight && !renderInFlight) return;
    const timer = window.setInterval(() => {
      refresh().catch(() => undefined);
    }, 2500);
    return () => window.clearInterval(timer);
  }, [commandInFlight, renderInFlight, refresh]);

  async function sendCommand() {
    const text = message.trim();
    if (!text) return;

    const continueShot = Boolean(revisionShotId && !explicitlyStartsNewShot(text));
    const createShot = continueShot || looksLikeShotDirection(text);

    setBusy(true);
    setFlash(null);
    setTransientActivity({
      tone: 'working',
      label: createShot ? (continueShot ? 'Preparing shot revision' : 'Preparing runtime shot') : 'Preparing your request',
      detail: createShot
        ? continueShot
          ? 'Your correction will revise the same shot and become part of Director Feedback Memory.'
          : 'Spline Agent is translating your direction into a temporary runtime ShotSpec.'
        : 'Spline Agent is turning your message into a reviewable change.',
      spinning: true
    });

    try {
      if (createShot) {
        const result = await createSplineShotCommand(text, continueShot ? revisionShotId : null);
        setShotJobId(result.productionJobId);
        setLatestRender(null);
        if (!continueShot) setRevisionShotId(null);
      } else {
        await createSplineChatCommand(text);
        setShotJobId(null);
      }
      setMessage('');
      await refresh();
      setTransientActivity(null);
    } catch (error) {
      setTransientActivity({
        tone: 'error',
        label: createShot ? 'Could not prepare the shot' : 'Could not prepare the request',
        detail: error instanceof Error ? error.message : 'Spline Agent could not prepare this request.'
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
        decision === 'REQUEST_CHANGES' ? 'Creator requested another version from the Spline Agent workspace.' : undefined
      );
      await refresh();
      setTransientActivity(null);
      setFlash(decision === 'APPROVE' ? 'Change approved.' : 'Prepared change cancelled. Send the correction in chat.');
    } catch (error) {
      setFlash(error instanceof Error ? error.message : 'Could not save your decision');
    } finally {
      setBusy(false);
    }
  }

  function startPreview() {
    if (!latestShot || !latestRender || latestRender.status !== 'READY' || !latestRender.videoUrl) return;
    const fullscreen = document.documentElement.requestFullscreen;
    if (typeof fullscreen === 'function') fullscreen.call(document.documentElement).catch(() => undefined);
    setPreviewShot(latestShot);
    setPreviewRender(latestRender);
  }

  function returnFromPreview() {
    const completedShot = previewShot;
    setPreviewShot(null);
    setPreviewRender(null);
    if (completedShot) setRevisionShotId(completedShot.id);

    if (document.fullscreenElement && typeof document.exitFullscreen === 'function') {
      document.exitFullscreen().catch(() => undefined);
    }

    setFlash('Shot preview finished. What would you like to change?');
    window.setTimeout(() => {
      chatSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      composerRef.current?.focus();
    }, 80);
  }

  if (previewShot && previewRender) {
    return <ShotVideoPreviewOverlay shot={previewShot} render={previewRender} onComplete={returnFromPreview} />;
  }

  return (
    <AgentWorkspaceFrame
      agentName="Spline Agent"
      description="Direct shots in natural language, render 1080p previews in the cloud, review them as video and revise them from the same conversation."
      statusLabel="Director workspace"
      statusTone="ready"
      capabilities={CAPABILITIES}
    >
      {flash && <div className="spline-agent-flash">{flash}</div>}

      {!shotDirectorMode && <SplineRuntimeComposer />}

      <section className="agent-chat-section" ref={chatSectionRef}>
        <div className="agent-chat-section-header">
          <span>AGENT CHAT</span>
          <strong>Direct the shot. Render it. Review it. Correct it.</strong>
          <p>Describe the result you want in normal language. Media OS builds a temporary ShotSpec, renders a 1920×1080 MP4 in the cloud and returns the video here for review.</p>
        </div>

        <div className="spline-director-memory-strip">
          <div>
            <span>DIRECTOR FEEDBACK MEMORY</span>
            <strong>{memoryCount} learned {memoryCount === 1 ? 'correction' : 'corrections'}</strong>
          </div>
          <p>Corrections after a preview are attached to the shot revision and supplied back to Spline Agent on future shot work.</p>
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

        {latestRender && latestRender.status !== 'READY' && (
          <div className={`spline-command-activity ${latestRender.status === 'FAILED' ? 'error' : 'working'}`}>
            <div className="spline-command-activity-icon">
              {latestRender.status === 'FAILED' ? <X size={17} /> : <RefreshCw size={17} className="spin" />}
            </div>
            <div>
              <strong>{latestRender.status === 'FAILED' ? '1080p render failed' : 'Rendering 1920×1080 preview'}</strong>
              <span>{latestRender.status === 'FAILED'
                ? latestRender.error || 'The render worker could not create the preview.'
                : 'Spline runs in the cloud. Your phone will receive only the finished MP4.'}</span>
            </div>
          </div>
        )}

        <div className="spline-chat-history">
          {messages.length === 0 ? (
            <div className="spline-chat-empty">
              Example: “Create a 20-second opening shot. Start on Login, hold, then slowly move to Client Boundary while the authored animations play.”
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

        {latestShot && latestCommand?.status === 'SUCCEEDED' && latestCommand.productionJobId === latestShot.productionJobId && (
          <div className="spline-shot-ready-card">
            <div>
              <span>{latestShot.shotKey} · REVISION {latestShot.revision}</span>
              <strong>{latestShot.name}</strong>
              <small>{(latestShot.durationMs / 1000).toFixed(1)}s · 1920×1080 · 30 fps · MP4 director preview</small>
            </div>
            <button type="button" disabled={!previewReady} onClick={startPreview}>
              {previewReady ? <Play size={17} /> : <LoaderCircle size={17} className="spin" />}
              {previewReady ? 'Preview shot' : 'Rendering…'}
            </button>
          </div>
        )}

        {revisionShotId && !commandInFlight && (
          <div className="spline-shot-revision-context">
            <span>REVISION MODE</span>
            <strong>Your next message will revise the shot you just previewed.</strong>
            <small>Say “new shot” or “next shot” when you want to start another shot instead.</small>
          </div>
        )}

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
                <X size={16} /> Revise
              </button>
              <button className="approve-command" disabled={busy} onClick={() => void decide('APPROVE')}>
                <Check size={16} /> Approve
              </button>
            </div>
          </div>
        )}

        <div className="spline-chat-composer">
          <textarea
            ref={composerRef}
            value={message}
            onChange={event => setMessage(event.target.value)}
            placeholder={revisionShotId
              ? 'Tell Spline Agent what to change in the shot you just watched…'
              : 'Describe the shot, scene change or correction you want…'}
            rows={4}
            onKeyDown={event => {
              if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                event.preventDefault();
                void sendCommand();
              }
            }}
          />
          <button disabled={busy || !message.trim() || commandInFlight} onClick={() => void sendCommand()}>
            {busy ? <LoaderCircle size={17} className="spin" /> : <Send size={17} />}
            Send
          </button>
        </div>

        {pendingApproval && <small className="spline-chat-note">Approve or revise the current request before sending another.</small>}
      </section>

      <details className="agent-health-details">
        <summary>
          <div>
            <span>ADVANCED & HEALTH</span>
            <strong>Technical status and latest execution</strong>
          </div>
          <HeartPulse size={18} />
        </summary>

        <div className="agent-health-grid">
          <article>
            <span>EDITING CONNECTION</span>
            <strong>{runner?.online ? 'ONLINE' : 'OFFLINE'} · {runner?.status ?? 'UNKNOWN'}</strong>
            <dl>
              <div><dt>Host</dt><dd>{runner?.hostname ?? '—'}</dd></div>
              <div><dt>Runner</dt><dd>{runner?.runnerVersion ?? '—'}</dd></div>
              <div><dt>Commit</dt><dd>{runner?.productionCommit ?? '—'}</dd></div>
              <div><dt>Last seen</dt><dd>{runner?.lastSeen ? new Date(runner.lastSeen).toLocaleString() : '—'}</dd></div>
              <div><dt>Last error</dt><dd>{runner?.lastError || 'None'}</dd></div>
            </dl>
          </article>

          <article>
            <span>LATEST EXECUTION</span>
            <strong>{latestExecution?.status ?? 'NONE'}</strong>
            <dl>
              <div><dt>Task</dt><dd>{latestExecution?.taskType ?? '—'}</dd></div>
              <div><dt>Tokens</dt><dd>{latestExecution?.result?.metrics?.tokenCount?.toLocaleString() ?? '—'}</dd></div>
              <div><dt>MCP calls</dt><dd>{latestExecution?.result?.metrics?.splineMcpCalls ?? '—'}</dd></div>
              <div><dt>Duration</dt><dd>{latestExecution?.result?.metrics?.durationMs ? `${Math.round(latestExecution.result.metrics.durationMs / 1000)}s` : '—'}</dd></div>
              <div><dt>Error</dt><dd>{latestExecution?.error || 'None'}</dd></div>
            </dl>
          </article>
        </div>
      </details>
    </AgentWorkspaceFrame>
  );
}
