import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, ArrowUp, LoaderCircle, LockKeyhole, Play, RefreshCw, Sparkles, X } from 'lucide-react';
import {
  dismissDirectorProposal,
  loadDirectorRoom,
  lockDirectorProposal,
  sendDirectorMessage,
  type DirectorProposal,
  type DirectorRoom
} from '../api/directorApi';
import { loadProductionOverview, type ProductionOverview } from '../api/creativeApi';
import {
  generateTopicCandidates,
  loadEpisodeBuildState,
  retryEpisodeBuild,
  startCurrentEpisodeBuild,
  type EpisodeBuildRun,
  type EpisodeBuildState,
  type TopicCandidate
} from '../api/episodeBuildApi';
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
    <span className="director-thinking" aria-label="Director is thinking">
      <span />
      <span />
      <span />
    </span>
  );
}

function hasRun(run: EpisodeBuildState['latestRun']): run is EpisodeBuildRun {
  return Boolean(run && 'id' in run && run.id);
}

function TopicDetail({ topic }: { topic: TopicCandidate }) {
  return (
    <article className="director-topic-detail">
      <div className="director-topic-title-row">
        <div>
          <span>{topic.status === 'CURRENT' ? 'Current episode' : 'Episode idea'}</span>
          <h3>{topic.title}</h3>
        </div>
        <small>{topic.estimatedComplexity.toLowerCase()} production complexity</small>
      </div>

      <p className="director-topic-question">{topic.centralQuestion}</p>
      <p className="director-topic-promise">{topic.viewerPromise}</p>

      <div className="director-topic-detail-grid">
        <div><strong>Why it lasts</strong><p>{topic.evergreenReason}</p></div>
        <div><strong>Human entry</strong><p>{topic.massEntry}</p></div>
        <div><strong>Engineering depth</strong><p>{topic.seniorLesson}</p></div>
        <div><strong>Core tension</strong><p>{topic.coreTension}</p></div>
        <div><strong>System boundary</strong><p>{topic.systemBoundary}</p></div>
        <div><strong>Failure / trade-off</strong><p>{topic.failureTradeoff}</p></div>
        <div><strong>World reuse</strong><p>{topic.reusePlan}</p></div>
        <div><strong>Series path</strong><p>{topic.seriesPath}</p></div>
      </div>

      {topic.ahaCandidates.length > 0 && (
        <div className="director-topic-aha">
          <strong>Possible Aha moments</strong>
          {topic.ahaCandidates.slice(0, 3).map((aha, index) => <p key={`${topic.id}-aha-${index}`}>{aha}</p>)}
        </div>
      )}
    </article>
  );
}

function BuildRun({ run, onRetry }: { run: EpisodeBuildRun; onRetry: () => void }) {
  const retryable = run.status === 'FAILED' || run.status === 'NEEDS_REVIEW';
  const complete = run.status === 'COMPLETE';
  return (
    <section className="director-build-run">
      <div className="director-build-run-head">
        <div>
          <h3>{complete ? 'Initial version ready' : retryable ? 'Initial build needs attention' : 'Building initial version'}</h3>
          <p>{complete ? 'Review Script first, then Scene, then continue to Spline.' : run.errorMessage || `Working through ${run.currentStep.toLowerCase()}.`}</p>
        </div>
        <strong>{run.progressPercent}%</strong>
      </div>
      <div className="director-build-progress"><i style={{ width: `${run.progressPercent}%` }} /></div>
      <div className="director-build-steps">
        {run.steps.map(step => (
          <div key={step.stepKey} className={`director-build-step ${step.status.toLowerCase().replaceAll('_', '-')}`}>
            <span />
            <div>
              <strong>{step.stepKey === 'TRUTH' ? 'Truth' : step.stepKey === 'HANDOFF' ? 'Review package' : step.stepKey.charAt(0) + step.stepKey.slice(1).toLowerCase()}</strong>
              {step.summary && <p>{step.summary}</p>}
            </div>
          </div>
        ))}
      </div>
      <div className="director-build-actions">
        {complete && <button type="button" onClick={() => { window.location.hash = '#/agents/script'; }}>Review Script <ArrowRight size={15} /></button>}
        {retryable && <button type="button" onClick={onRetry}>Retry build <RefreshCw size={14} /></button>}
      </div>
    </section>
  );
}

export function DirectorRoomPage() {
  const [room, setRoom] = useState<DirectorRoom | null>(null);
  const [overview, setOverview] = useState<ProductionOverview | null>(null);
  const [buildState, setBuildState] = useState<EpisodeBuildState | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [buildBusy, setBuildBusy] = useState(false);
  const [proposalBusy, setProposalBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [pendingMessage, setPendingMessage] = useState('');
  const [budgetMinutes, setBudgetMinutes] = useState(20);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const chatHistoryRef = useRef<HTMLDivElement | null>(null);

  async function refresh(clearError = true) {
    if (clearError) setError('');
    try {
      const [nextRoom, nextOverview, nextBuildState] = await Promise.all([
        loadDirectorRoom(),
        loadProductionOverview(),
        loadEpisodeBuildState()
      ]);
      setRoom(nextRoom);
      setOverview(nextOverview);
      setBuildState(nextBuildState);
      if (!selectedTopicId) {
        const current = nextBuildState.topics.find(topic => topic.status === 'CURRENT') || nextBuildState.topics[0];
        if (current) setSelectedTopicId(current.id);
      }
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

  const latestRun = buildState && hasRun(buildState.latestRun) ? buildState.latestRun : null;
  const buildIsRunning = latestRun?.status === 'QUEUED' || latestRun?.status === 'RUNNING';

  useEffect(() => {
    if (!buildIsRunning) return;
    const timer = window.setInterval(async () => {
      try {
        const [nextBuild, nextOverview] = await Promise.all([loadEpisodeBuildState(), loadProductionOverview()]);
        setBuildState(nextBuild);
        setOverview(nextOverview);
      } catch {
      }
    }, 3000);
    return () => window.clearInterval(timer);
  }, [buildIsRunning]);

  const selectedTopic = useMemo(() => {
    if (!buildState) return null;
    return buildState.topics.find(topic => topic.id === selectedTopicId)
      || buildState.topics.find(topic => topic.status === 'CURRENT')
      || buildState.topics[0]
      || null;
  }, [buildState, selectedTopicId]);

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

  async function findTopics() {
    if (buildBusy) return;
    setBuildBusy(true);
    setError('');
    try {
      const next = await generateTopicCandidates();
      setBuildState(next);
      const firstFuture = next.topics.find(topic => topic.status === 'READY');
      if (firstFuture) setSelectedTopicId(firstFuture.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not generate episode ideas.');
    } finally {
      setBuildBusy(false);
    }
  }

  async function startBuild() {
    if (buildBusy) return;
    setBuildBusy(true);
    setError('');
    try {
      const next = await startCurrentEpisodeBuild(budgetMinutes);
      setBuildState(next);
      setOverview(await loadProductionOverview());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not start the autonomous episode build.');
    } finally {
      setBuildBusy(false);
    }
  }

  async function retryBuild() {
    if (buildBusy) return;
    setBuildBusy(true);
    setError('');
    try {
      setBuildState(await retryEpisodeBuild());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not retry the autonomous episode build.');
    } finally {
      setBuildBusy(false);
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

  if (loading && (!room || !overview || !buildState)) {
    return <main className="director-room-loading"><LoaderCircle size={22} className="spin" /></main>;
  }

  if (!room || !overview || !buildState) {
    return (
      <main className="director-room-loading">
        <strong>Director Room is unavailable.</strong>
        <p>{error}</p>
        <button type="button" onClick={() => { setLoading(true); void refresh(); }}>Retry</button>
      </main>
    );
  }

  const visibleMessages = room.messages.filter(item => item.sender !== 'SYSTEM');
  const currentTopic = buildState.topics.find(topic => topic.status === 'CURRENT') || null;

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
          <section className="director-topic-section">
            <div className="director-section-head">
              <h2>Topic direction</h2>
              <button type="button" className="director-quiet-action" disabled={buildBusy || !buildState.configured} onClick={() => void findTopics()}>
                {buildBusy ? <LoaderCircle size={14} className="spin" /> : <Sparkles size={14} />}
                Find next topics
              </button>
            </div>

            <div className="director-topic-tabs">
              {buildState.topics.map(topic => (
                <button
                  type="button"
                  key={topic.id}
                  className={topic.id === selectedTopic?.id ? 'selected' : ''}
                  onClick={() => setSelectedTopicId(topic.id)}
                >
                  {topic.title}
                </button>
              ))}
            </div>

            {selectedTopic && <TopicDetail topic={selectedTopic} />}

            {selectedTopic?.status === 'READY' && (
              <button
                type="button"
                className="director-discuss-topic"
                onClick={() => setMessage(`I want to evaluate this as a future episode: "${selectedTopic.title}". Challenge the idea and tell me what would make the episode stronger before we commit to it.`)}
              >
                Discuss this idea with Director
              </button>
            )}

            {currentTopic && buildState.canStartCurrentEpisode && !latestRun && (
              <div className="director-build-start">
                <div>
                  <strong>Build the first complete EP001 version</strong>
                  <p>Truth audit → Script → Scene plan → shot prompts. Nothing is locked automatically.</p>
                </div>
                <select value={budgetMinutes} onChange={event => setBudgetMinutes(Number(event.target.value))} aria-label="Build work budget">
                  <option value={15}>15 min</option>
                  <option value={20}>20 min</option>
                  <option value={25}>25 min</option>
                  <option value={30}>30 min</option>
                </select>
                <button type="button" disabled={buildBusy || !buildState.configured} onClick={() => void startBuild()}>
                  {buildBusy ? <LoaderCircle size={15} className="spin" /> : <Play size={15} />}
                  Build initial episode
                </button>
              </div>
            )}

            {latestRun && <BuildRun run={latestRun} onRetry={() => void retryBuild()} />}
          </section>

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
              placeholder="Ask about the episode, an idea, a risk, or a production decision…"
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
