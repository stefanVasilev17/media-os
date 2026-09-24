import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Clock3, HeartPulse, LoaderCircle, RefreshCw, Send, X } from 'lucide-react';
import { AgentWorkspaceFrame } from '../components/AgentWorkspaceFrame';
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
  { label: 'Frame', description: 'Adjust the live browser framing for the shot.' },
  { label: 'Export', description: 'Save frames or record the temporary scene.' }
];

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
        detail: 'Review the prepared change below, then approve it or ask for another version.'
      };
    case 'QUEUED':
      return {
        tone: 'working',
        label: 'Approved and waiting',
        detail: 'Spline Agent will start the approved change as soon as the editing connection is available.',
        spinning: true
      };
    case 'CLAIMED':
      return {
        tone: 'working',
        label: 'Spline Agent picked up the request',
        detail: 'The requested change is being prepared now.',
        spinning: true
      };
    case 'RUNNING':
      return {
        tone: 'working',
        label: 'Spline Agent is working',
        detail: 'The approved scene change is being applied now.',
        spinning: true
      };
    case 'SUCCEEDED':
      return {
        tone: 'success',
        label: 'Change completed',
        detail: 'Spline Agent completed the requested change.'
      };
    case 'FAILED':
      return {
        tone: 'error',
        label: 'Change could not be completed',
        detail: error?.trim() || 'Open Advanced & health for technical details before retrying.'
      };
    case 'CHANGES_REQUESTED':
      return {
        tone: 'cancelled',
        label: 'Change cancelled',
        detail: 'The prepared change was not applied.'
      };
    default:
      return null;
  }
}

export function SplineWorkspacePage() {
  const [messages, setMessages] = useState<SplineChatMessage[]>([]);
  const [approvals, setApprovals] = useState<PendingSplineApproval[]>([]);
  const [latestExecution, setLatestExecution] = useState<LatestSplineJob | null>(null);
  const [runner, setRunner] = useState<RunnerStatus | null>(null);
  const [message, setMessage] = useState('');
  const [flash, setFlash] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [transientActivity, setTransientActivity] = useState<CommandActivity | null>(null);

  const refresh = useCallback(async () => {
    const [chat, pending, latest, runnerStatus] = await Promise.all([
      loadSplineChat(),
      loadPendingSplineApprovals(),
      loadLatestSplineJob(),
      loadRunnerStatus()
    ]);

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

  async function sendCommand() {
    const text = message.trim();
    if (!text) return;

    setBusy(true);
    setFlash(null);
    setTransientActivity({
      tone: 'working',
      label: 'Preparing your request',
      detail: 'Spline Agent is turning your message into a reviewable change.',
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
        detail: error instanceof Error ? error.message : 'Spline Agent could not prepare this change.'
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

  return (
    <AgentWorkspaceFrame
      agentName="Spline Agent"
      description="Build the temporary episode scene, adjust it visually, animate it and export the result from one workspace. Use chat below when you want the agent to make or revise a change for you."
      statusLabel="Browser workspace"
      statusTone="ready"
      capabilities={CAPABILITIES}
    >
      {flash && <div className="spline-agent-flash">{flash}</div>}

      <SplineRuntimeComposer />

      <section className="agent-chat-section">
        <div className="agent-chat-section-header">
          <span>AGENT CHAT</span>
          <strong>Ask for a change or correction</strong>
          <p>Direct controls above are instant browser-scene tools. Use chat when you want Spline Agent to handle the change for you.</p>
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
              Example: “Duplicate Auth Service as Token Service, place it to the right and keep the same visual behavior.”
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
            value={message}
            onChange={event => setMessage(event.target.value)}
            placeholder="Describe the result you want or the correction to the last result…"
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

        {pendingApproval && (
          <small className="spline-chat-note">Approve or revise the current request before sending another.</small>
        )}
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
