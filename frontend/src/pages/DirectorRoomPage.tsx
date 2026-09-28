import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowUp,
  BrainCircuit,
  Check,
  ChevronRight,
  CircleDot,
  Cloud,
  Gauge,
  GitBranch,
  Lightbulb,
  LoaderCircle,
  LockKeyhole,
  MessageSquareText,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  X
} from 'lucide-react';
import {
  dismissDirectorProposal,
  loadDirectorRoom,
  lockDirectorProposal,
  sendDirectorMessage,
  type DirectorMode,
  type DirectorProposal,
  type DirectorRoom
} from '../api/directorApi';
import '../styles/directorRoom.css';

const MODES: Array<{ key: DirectorMode; label: string; hint: string; icon: typeof MessageSquareText }> = [
  { key: 'DISCUSS', label: 'Discuss', hint: 'Think it through with me', icon: MessageSquareText },
  { key: 'CHALLENGE', label: 'Challenge', hint: 'Find hidden weaknesses', icon: Target },
  { key: 'IMPROVE', label: 'Improve', hint: 'Make the current idea stronger', icon: Sparkles },
  { key: 'IMPACT', label: 'Impact', hint: 'Trace downstream consequences', icon: GitBranch }
];

function formatTime(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(date);
}

function formatDate(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
}

function riskClass(value: string) {
  return value.toLowerCase().replace(/[^a-z]/g, '');
}

function pipelineClass(value: string) {
  return value.toLowerCase().replace(/[^a-z]/g, '-');
}

function ProposalCard({
  proposal,
  busy,
  onLock,
  onDismiss
}: {
  proposal: DirectorProposal;
  busy: boolean;
  onLock: () => void;
  onDismiss: () => void;
}) {
  return (
    <article className="director-proposal-card">
      <div className="director-proposal-head">
        <div>
          <span className={`director-risk ${riskClass(proposal.riskLevel)}`}>{proposal.riskLevel} RISK</span>
          <strong>{proposal.title}</strong>
        </div>
        <span className="director-confidence">{Math.round(Number(proposal.confidence || 0) * 100)}%</span>
      </div>
      <p>{proposal.summary}</p>
      {proposal.affectedObjects.length > 0 && (
        <div className="director-tag-row">
          {proposal.affectedObjects.slice(0, 5).map(item => <span key={item}>{item}</span>)}
        </div>
      )}
      {proposal.downstreamImpact.length > 0 && (
        <div className="director-impact-list">
          {proposal.downstreamImpact.slice(0, 4).map(item => (
            <div key={item}><ChevronRight size={12} /> <span>{item}</span></div>
          ))}
        </div>
      )}
      <div className="director-proposal-actions">
        <button type="button" className="lock" disabled={busy} onClick={onLock}>
          {busy ? <LoaderCircle size={14} className="spin" /> : <LockKeyhole size={14} />}
          Lock decision
        </button>
        <button type="button" className="dismiss" disabled={busy} onClick={onDismiss} aria-label="Dismiss proposal">
          <X size={14} />
        </button>
      </div>
    </article>
  );
}

export function DirectorRoomPage() {
  const [room, setRoom] = useState<DirectorRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [proposalBusy, setProposalBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState<DirectorMode>('DISCUSS');
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);

  async function refresh() {
    setError('');
    try {
      setRoom(await loadDirectorRoom());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load Director Room.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: loading ? 'auto' : 'smooth', block: 'end' });
  }, [room?.messages.length, loading]);

  const activeMode = useMemo(() => MODES.find(item => item.key === mode) ?? MODES[0], [mode]);

  async function send() {
    const text = message.trim();
    if (!text || busy) return;
    setMessage('');
    setBusy(true);
    setError('');
    try {
      const result = await sendDirectorMessage(text, mode);
      setRoom(result.room);
    } catch (cause) {
      const failure = cause instanceof Error ? cause.message : 'Director could not answer.';
      setMessage(text);
      try {
        setRoom(await loadDirectorRoom());
      } catch {
        // Preserve the original send error; the current room remains usable.
      }
      setError(failure);
    } finally {
      setBusy(false);
      window.setTimeout(() => composerRef.current?.focus(), 80);
    }
  }

  async function lockProposal(id: string) {
    if (proposalBusy) return;
    setProposalBusy(id);
    setError('');
    try {
      setRoom(await lockDirectorProposal(id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not lock the decision.');
    } finally {
      setProposalBusy(null);
    }
  }

  async function dismissProposal(id: string) {
    if (proposalBusy) return;
    setProposalBusy(id);
    setError('');
    try {
      setRoom(await dismissDirectorProposal(id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not dismiss the proposal.');
    } finally {
      setProposalBusy(null);
    }
  }

  if (loading && !room) {
    return (
      <main className="director-room-loading">
        <BrainCircuit size={28} />
        <span>Opening Director Room…</span>
      </main>
    );
  }

  if (!room) {
    return (
      <main className="director-room-loading error">
        <AlertTriangle size={28} />
        <strong>Director Room is unavailable</strong>
        <span>{error}</span>
        <button type="button" onClick={() => { setLoading(true); void refresh(); }}><RefreshCw size={15} /> Retry</button>
      </main>
    );
  }

  return (
    <main className="director-room-page">
      <header className="director-room-header">
        <div className="director-room-title">
          <div className="director-brand-mark"><BrainCircuit size={20} /></div>
          <div>
            <span>MEDIAOS DIRECTOR</span>
            <h1>Director Room</h1>
          </div>
        </div>
        <div className="director-header-meta">
          <div className="director-cloud-pill"><Cloud size={14} /><span>Cloud-only</span></div>
          <div className={`director-agent-pill ${room.agent.configured ? 'ready' : 'setup'}`}>
            <CircleDot size={13} />
            <span>{room.agent.configured ? 'Director online' : 'AI setup required'}</span>
          </div>
        </div>
      </header>

      {error && <div className="director-global-error"><AlertTriangle size={15} /><span>{error}</span></div>}
      {!room.agent.configured && (
        <div className="director-config-banner">
          <ShieldCheck size={18} />
          <div>
            <strong>Director Room is fully installed; the model credential is the only missing runtime setting.</strong>
            <span>Add <code>OPENAI_API_KEY</code> to the Railway backend service. No Windows worker or local machine is involved.</span>
          </div>
        </div>
      )}

      <div className="director-room-grid">
        <aside className="director-context-column">
          <section className="director-panel episode-panel">
            <div className="director-panel-kicker">CURRENT EPISODE</div>
            <strong className="director-episode-number">{room.episode.episodeNumber}</strong>
            <h2>{room.episode.title}</h2>
            <div className="director-episode-meta">
              <div><span>Stage</span><strong>{room.episode.currentStage.replaceAll('_', ' ')}</strong></div>
              <div><span>Status</span><strong>{room.episode.status.replaceAll('_', ' ')}</strong></div>
              <div><span>Source</span><strong>{room.episode.sourceOfTruthVersion || 'Not tracked'}</strong></div>
            </div>
          </section>

          <section className="director-panel pipeline-panel">
            <div className="director-panel-heading">
              <div>
                <span>PRODUCTION PIPELINE</span>
                <strong>Agent handoffs</strong>
              </div>
              <GitBranch size={16} />
            </div>
            <div className="director-pipeline-list">
              {room.pipeline.map((stage, index) => (
                <div className="director-pipeline-stage" key={stage.key} title={stage.detail}>
                  <div className="director-pipeline-rail">
                    <span className={`director-pipeline-dot ${pipelineClass(stage.status)}`} />
                    {index < room.pipeline.length - 1 && <span className="director-pipeline-line" />}
                  </div>
                  <div>
                    <strong>{stage.label}</strong>
                    <span>{stage.status.replaceAll('_', ' ')}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="director-panel rules-panel">
            <div className="director-panel-heading">
              <div><span>OPERATING RULES</span><strong>Director guardrails</strong></div>
              <ShieldCheck size={16} />
            </div>
            {room.operatingRules.map(rule => <p key={rule}><Check size={12} /> <span>{rule}</span></p>)}
          </section>
        </aside>

        <section className="director-chat-column">
          <div className="director-chat-head">
            <div>
              <span>DIRECTOR CONVERSATION</span>
              <strong>Think, challenge, decide</strong>
            </div>
            <small>{room.agent.model} · {room.agent.executionTarget}</small>
          </div>

          <div className="director-chat-history">
            {room.messages.map(item => (
              <article key={item.id} className={`director-message ${item.sender.toLowerCase()}`}>
                <div className="director-message-avatar">
                  {item.sender === 'USER' ? 'YOU' : item.sender === 'AGENT' ? <BrainCircuit size={15} /> : <ShieldCheck size={14} />}
                </div>
                <div className="director-message-body">
                  <div className="director-message-meta">
                    <strong>{item.sender === 'USER' ? 'You' : item.sender === 'AGENT' ? 'MediaOS Director' : 'System'}</strong>
                    <span>{formatTime(item.createdAt)}</span>
                  </div>
                  <div className="director-message-copy">{item.content}</div>
                </div>
              </article>
            ))}
            {busy && (
              <article className="director-message agent thinking">
                <div className="director-message-avatar"><BrainCircuit size={15} /></div>
                <div className="director-message-body">
                  <div className="director-message-meta"><strong>MediaOS Director</strong><span>thinking</span></div>
                  <div className="director-thinking-line"><i /><i /><i /></div>
                </div>
              </article>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="director-mode-row" aria-label="Director reasoning mode">
            {MODES.map(item => {
              const Icon = item.icon;
              const active = item.key === mode;
              return (
                <button
                  key={item.key}
                  type="button"
                  className={active ? 'active' : ''}
                  onClick={() => setMode(item.key)}
                  title={item.hint}
                >
                  <Icon size={14} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="director-composer">
            <textarea
              ref={composerRef}
              value={message}
              onChange={event => setMessage(event.target.value)}
              rows={4}
              disabled={busy || !room.agent.configured}
              placeholder={room.agent.configured
                ? `${activeMode.hint}. Ask about the episode, a new idea, a blocker, a shot, or the production system…`
                : 'Add OPENAI_API_KEY to Railway to activate Director conversation.'}
              onKeyDown={event => {
                if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                  event.preventDefault();
                  void send();
                }
              }}
            />
            <div className="director-composer-footer">
              <span><Lightbulb size={12} /> Discussion stays reversible until you lock a decision.</span>
              <button type="button" disabled={busy || !room.agent.configured || !message.trim()} onClick={() => void send()}>
                {busy ? <LoaderCircle size={17} className="spin" /> : <ArrowUp size={17} />}
              </button>
            </div>
          </div>
        </section>

        <aside className="director-state-column">
          <section className="director-panel metrics-panel">
            <div className="director-panel-heading">
              <div><span>PRODUCTION STATE</span><strong>Live context</strong></div>
              <Gauge size={16} />
            </div>
            <div className="director-metric-grid">
              <div><span>Shots</span><strong>{room.metrics.shotsPrepared}</strong></div>
              <div><span>Ready renders</span><strong>{room.metrics.rendersReady}</strong></div>
              <div><span>Rendering</span><strong>{room.metrics.rendersActive}</strong></div>
              <div className={room.metrics.rendersFailed > 0 ? 'warn' : ''}><span>Failed</span><strong>{room.metrics.rendersFailed}</strong></div>
            </div>
          </section>

          <section className="director-panel proposals-panel">
            <div className="director-panel-heading">
              <div>
                <span>REVIEW QUEUE</span>
                <strong>Proposed decisions</strong>
              </div>
              <span className="director-count-badge">{room.proposals.length}</span>
            </div>
            {room.proposals.length === 0 ? (
              <div className="director-empty-state">
                <Lightbulb size={18} />
                <span>Concrete recommendations from the conversation will wait here until you lock or dismiss them.</span>
              </div>
            ) : room.proposals.map(proposal => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                busy={proposalBusy === proposal.id}
                onLock={() => void lockProposal(proposal.id)}
                onDismiss={() => void dismissProposal(proposal.id)}
              />
            ))}
          </section>

          <section className="director-panel ledger-panel">
            <div className="director-panel-heading">
              <div>
                <span>DECISION LEDGER</span>
                <strong>Locked production intent</strong>
              </div>
              <LockKeyhole size={16} />
            </div>
            {room.decisions.length === 0 ? (
              <div className="director-empty-state compact">
                <span>No Director decisions have been locked yet.</span>
              </div>
            ) : (
              <div className="director-ledger-list">
                {room.decisions.map((decision, index) => (
                  <article key={decision.id}>
                    <div className="director-ledger-index">DEC-{String(room.decisions.length - index).padStart(3, '0')}</div>
                    <strong>{decision.title}</strong>
                    <p>{decision.summary}</p>
                    <span><LockKeyhole size={10} /> {formatDate(decision.decidedAt || decision.createdAt)}</span>
                  </article>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}
