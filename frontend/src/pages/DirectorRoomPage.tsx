import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUp, LoaderCircle, LockKeyhole, X } from 'lucide-react';
import {
  dismissDirectorProposal,
  loadDirectorRoom,
  lockDirectorProposal,
  sendDirectorMessage,
  type DirectorProposal,
  type DirectorRoom
} from '../api/directorApi';
import { loadProductionOverview, type ProductionOverview } from '../api/creativeApi';
import '../styles/directorRoom.css';

function Proposal({
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
    <article className="director-decision">
      <strong>{proposal.title}</strong>
      <p>{proposal.summary}</p>
      <div>
        <button type="button" disabled={busy} onClick={onLock}>
          {busy ? <LoaderCircle size={14} className="spin" /> : <LockKeyhole size={14} />}
          Lock
        </button>
        <button type="button" className="director-dismiss" disabled={busy} onClick={onDismiss} aria-label="Dismiss"><X size={14} /></button>
      </div>
    </article>
  );
}

function ThinkingDots() {
  return (
    <div className="director-thinking" aria-label="Director is thinking">
      <span />
      <span />
      <span />
    </div>
  );
}

export function DirectorRoomPage() {
  const [room, setRoom] = useState<DirectorRoom | null>(null);
  const [overview, setOverview] = useState<ProductionOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [proposalBusy, setProposalBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [pendingMessage, setPendingMessage] = useState('');
  const chatHistoryRef = useRef<HTMLDivElement | null>(null);

  async function refresh(clearError = true) {
    if (clearError) setError('');
    try {
      const [nextRoom, nextOverview] = await Promise.all([loadDirectorRoom(), loadProductionOverview()]);
      setRoom(nextRoom);
      setOverview(nextOverview);
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
    const history = chatHistoryRef.current;
    if (!history) return;
    history.scrollTop = history.scrollHeight;
  }, [room?.messages.length, busy, pendingMessage]);

  async function send() {
    const text = message.trim();
    if (!text || busy) return;
    setMessage('');
    setPendingMessage(text);
    setBusy(true);
    setError('');
    try {
      const result = await sendDirectorMessage(text, 'DISCUSS');
      setRoom(result.room);
      setOverview(await loadProductionOverview());
    } catch (cause) {
      const failure = cause instanceof Error ? cause.message : 'Director could not answer.';
      try {
        const [nextRoom, nextOverview] = await Promise.all([loadDirectorRoom(), loadProductionOverview()]);
        setRoom(nextRoom);
        setOverview(nextOverview);
      } catch {
      }
      setError(failure);
    } finally {
      setPendingMessage('');
      setBusy(false);
    }
  }

  async function lockProposal(id: string) {
    if (proposalBusy) return;
    setProposalBusy(id);
    setError('');
    try {
      setRoom(await lockDirectorProposal(id));
      setOverview(await loadProductionOverview());
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

  if (loading && (!room || !overview)) {
    return <main className="director-room-loading"><LoaderCircle size={22} className="spin" /></main>;
  }

  if (!room || !overview) {
    return (
      <main className="director-room-loading">
        <strong>Director Room is unavailable.</strong>
        <p>{error}</p>
        <button type="button" onClick={() => { setLoading(true); void refresh(); }}>Retry</button>
      </main>
    );
  }

  const visibleMessages = room.messages.filter(item => item.sender !== 'SYSTEM');

  return (
    <main className="director-room-page">
      <header className="director-room-header">
        <div>
          <span>{overview.episode.episodeNumber}</span>
          <h1>{overview.episode.title}</h1>
          <p>{overview.currentFocus}</p>
        </div>
        <div className="director-progress" aria-label={`Episode progress ${overview.progressPercent}%`}>
          <strong>{overview.progressPercent}%</strong>
          <div><i style={{ width: `${overview.progressPercent}%` }} /></div>
        </div>
      </header>

      {error && <div className="director-error">{error}</div>}

      <div className="director-command-grid">
        <div className="director-episode-column">
          <section className="director-stage-section">
            <h2>Episode</h2>
            <div className="director-stage-list">
              {overview.stages.map(stage => {
                const clickable = Boolean(stage.route);
                return (
                  <button
                    type="button"
                    key={stage.stageKey}
                    className="director-stage"
                    disabled={!clickable}
                    onClick={() => { if (stage.route) window.location.hash = stage.route; }}
                  >
                    <span className={`director-stage-dot ${stage.status.toLowerCase().replaceAll('_', '-')}`} />
                    <div>
                      <strong>{stage.displayName}</strong>
                      {stage.summary && <p>{stage.summary}</p>}
                    </div>
                    {clickable && <ArrowRight size={15} />}
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="director-conversation">
          <h2>Director</h2>
          <div className="director-chat-history" ref={chatHistoryRef}>
            {visibleMessages.map(item => (
              <article key={item.id} className={item.sender === 'USER' ? 'creator' : 'agent'}>
                <strong>{item.sender === 'USER' ? 'You' : 'Director'}</strong>
                <p>{item.content}</p>
              </article>
            ))}
            {pendingMessage && (
              <article className="creator pending">
                <strong>You</strong>
                <p>{pendingMessage}</p>
              </article>
            )}
            {busy && <ThinkingDots />}
          </div>

          <div className="director-composer">
            <textarea
              value={message}
              onChange={event => setMessage(event.target.value)}
              rows={4}
              disabled={busy || !room.agent.configured}
              placeholder="Ask about the episode or change a production decision…"
              onKeyDown={event => {
                if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                  event.preventDefault();
                  void send();
                }
              }}
            />
            <button type="button" disabled={busy || !room.agent.configured || !message.trim()} onClick={() => void send()} aria-label="Send">
              {busy ? <ThinkingDots /> : <ArrowUp size={17} />}
            </button>
          </div>

          {room.proposals.length > 0 && (
            <section className="director-proposals">
              <h2>Review</h2>
              {room.proposals.map(proposal => (
                <Proposal
                  key={proposal.id}
                  proposal={proposal}
                  busy={proposalBusy === proposal.id}
                  onLock={() => void lockProposal(proposal.id)}
                  onDismiss={() => void dismissProposal(proposal.id)}
                />
              ))}
            </section>
          )}
        </aside>
      </div>
    </main>
  );
}
