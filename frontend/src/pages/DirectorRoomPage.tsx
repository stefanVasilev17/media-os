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
      <div>
        <strong>{proposal.title}</strong>
        <p>{proposal.summary}</p>
      </div>
      <div className="director-decision-actions">
        <button type="button" disabled={busy} onClick={onLock}>
          {busy ? <LoaderCircle size={14} className="spin" /> : <LockKeyhole size={14} />}
          Lock
        </button>
        <button type="button" className="director-dismiss" disabled={busy} onClick={onDismiss} aria-label="Dismiss proposal">
          <X size={14} />
        </button>
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

function topicStatusLabel(topic: TopicCandidate) {
  return topic.status === 'CURRENT' ? 'Current episode' : 'Future idea';
}

function TopicSummary({ topic }: { topic: TopicCandidate }) {
  return (
    <article className="director-topic-summary">
      <div className="director-topic-title-row">
        <div>
          <span>{topicStatusLabel(topic)}</span>
          <h3>{topic.title}</h3>
        </div>
        <small>{topic.estimatedComplexity.toLowerCase()} complexity</small>
      </div>

      <p className="director-topic-question">{topic.centralQuestion}</p>
      <p className="director-topic-promise">{topic.viewerPromise}</p>

      <details className="director-topic-more">
        <summary>Show episode strategy</summary>
        <div className="director-topic-detail-grid">
          <div><strong>Human entry</strong><p>{topic.massEntry}</p></div>
          <div><strong>Senior lesson</strong><p>{topic.seniorLesson}</p></div>
          <div><strong>Core tension</strong><p>{topic.coreTension}</p></div>
          <div><strong>Failure / trade-off</strong><p>{topic.failureTradeoff}</p></div>
          <div><strong>System boundary</strong><p>{topic.systemBoundary}</p></div>
          <div><strong>World reuse</strong><p>{topic.reusePlan}</p></div>
          <div><strong>Series path</strong><p>{topic.seriesPath}</p></div>
          <div><strong>Why it lasts</strong><p>{topic.evergreenReason}</p></div>
        </div>
        {topic.ahaCandidates.length > 0 && (
          <div className="director-topic-aha">
            <strong>Possible Aha moments</strong>
            {topic.ahaCandidates.slice(0, 3).map((aha, index) => <p key={`${topic.id}-aha-${index}`}>{aha}</p>)}
          </div>
        )}
      </details>
    </article>
  );
}

function buildStepLabel(stepKey: string) {
  if (stepKey === 'TRUTH') return 'Truth';
  if (stepKey === 'HANDOFF') return 'Review package';
  return stepKey.charAt(0) + stepKey.slice(1).toLowerCase();
}

function BuildRun({ run, onRetry }: { run: EpisodeBuildRun; onRetry: () => void }) {
  const retryable = run.status === 'FAILED' || run.status === 'NEEDS_REVIEW';
  const complete = run.status === 'COMPLETE';

  return (
    <section className="director-build-run">
      <div className="director-build-run-head">
        <div>
          <span className="director-eyebrow">Autonomous build</span>
          <h2>{complete ? 'Initial episode draft is ready' : retryable ? 'Build needs attention' : 'Building the initial episode draft'}</h2>
          <p>{complete ? 'Review the Script first. Nothing was locked automatically.' : run.errorMessage || `Working on ${buildStepLabel(run.currentStep)}.`}</p>
        </div>
        <strong>{run.progressPercent}%</strong>
      </div>
      <div className="director-build-progress"><i style={{ width: `${run.progressPercent}%` }} /></div>
      <div className="director-build-steps">
        {run.steps.map(step => (
          <div key={step.stepKey} className={`director-build-step ${step.status.toLowerCase().replaceAll('_', '-')}`}>
            <span />
            <div>
              <strong>{buildStepLabel(step.stepKey)}</strong>
              <small>{step.status.toLowerCase().replaceAll('_', ' ')}</small>
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

function stageStatusLabel(status: string) {
  return status.toLowerCase().replaceAll('_', ' ');
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
        const firstFuture = nextBuildState.topics.find(topic => topic.status === 'READY')
          || nextBuildState.topics.find(topic => topic.status !== 'CURRENT');
        if (firstFuture) setSelectedTopicId(firstFuture.id);
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

  const futureTopics = useMemo(() => {
    return buildState?.topics.filter(topic => topic.status !== 'CURRENT') || [];
  }, [buildState]);

  const selectedTopic = useMemo(() => {
    return futureTopics.find(topic => topic.id === selectedTopicId) || futureTopics[0] || null;
  }, [futureTopics, selectedTopicId]);

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
  const primaryStage = overview.stages.find(stage => stage.stageKey === overview.episode.currentStage && stage.route)
    || overview.stages.find(stage => stage.route && !['LOCKED', 'COMPLETE', 'PUBLISHED'].includes(stage.status.toUpperCase()))
    || null;
  const nextAction = overview.nextActions[0] || primaryStage?.nextAction || overview.currentFocus || 'Review the current episode state.';
  const canStartBuild = Boolean(currentTopic && buildState.canStartCurrentEpisode && !latestRun);

  return (
    <main className="director-room-page">
      <header className="director-room-header">
        <div>
          <span>{overview.episode.episodeNumber} · Director</span>
          <h1>{overview.episode.title}</h1>
          <p>{overview.currentFocus}</p>
        </div>
        <div className="director-progress" aria-label={`Episode progress ${overview.progressPercent}%`}>
          <strong>{overview.progressPercent}%</strong>
          <div><i style={{ width: `${overview.progressPercent}%` }} /></div>
        </div>
      </header>

      {error && <div className="director-error">{error}</div>}

      <section className="director-now-card">
        <div className="director-now-copy">
          <span className="director-eyebrow">Now</span>
          <h2>{nextAction}</h2>
          <p>Director shows only the next useful action here. Detailed episode context is available below when you need it.</p>
        </div>
        <div className="director-now-actions">
          {latestRun?.status === 'COMPLETE' && (
            <button type="button" className="primary" onClick={() => { window.location.hash = '#/agents/script'; }}>
              Review Script <ArrowRight size={15} />
            </button>
          )}
          {canStartBuild && (
            <button type="button" className="primary" disabled={buildBusy || !buildState.configured} onClick={() => void startBuild()}>
              {buildBusy ? <LoaderCircle size={15} className="spin" /> : <Play size={15} />}
              Build initial episode
            </button>
          )}
          {primaryStage?.route && latestRun?.status !== 'COMPLETE' && (
            <button type="button" onClick={() => { if (primaryStage.route) window.location.hash = primaryStage.route; }}>
              Open {primaryStage.displayName} <ArrowRight size={15} />
            </button>
          )}
        </div>
        {canStartBuild && (
          <details className="director-build-options">
            <summary>Build options</summary>
            <label>
              Work budget
              <select value={budgetMinutes} onChange={event => setBudgetMinutes(Number(event.target.value))} aria-label="Build work budget">
                <option value={15}>15 min</option>
                <option value={20}>20 min</option>
                <option value={25}>25 min</option>
                <option value={30}>30 min</option>
              </select>
            </label>
            <small>Truth audit → Script → Scene plan → review package. Nothing is locked automatically.</small>
          </details>
        )}
      </section>

      {latestRun && <BuildRun run={latestRun} onRetry={() => void retryBuild()} />}

      {room.proposals.length > 0 && (
        <section className="director-review-card">
          <div className="director-section-title">
            <span className="director-eyebrow">Needs your decision</span>
            <h2>{room.proposals.length === 1 ? 'One proposal is waiting' : `${room.proposals.length} proposals are waiting`}</h2>
          </div>
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

      <section className="director-pipeline">
        <div className="director-section-title">
          <span className="director-eyebrow">Episode path</span>
          <h2>Where the episode is now</h2>
        </div>
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
                <strong>{stage.displayName}</strong>
                <small>{stageStatusLabel(stage.status)}</small>
                {clickable && <ArrowRight size={14} />}
              </button>
            );
          })}
        </div>
      </section>

      <div className="director-details-stack">
        <details className="director-panel" open>
          <summary>
            <span>Current episode context</span>
            <small>The important idea, question and promise</small>
          </summary>
          <div className="director-panel-body">
            {currentTopic ? <TopicSummary topic={currentTopic} /> : <p className="director-empty">No current topic snapshot is available.</p>}
          </div>
        </details>

        <details className="director-panel">
          <summary>
            <span>Future topic ideas</span>
            <small>Open only when planning the next episode</small>
          </summary>
          <div className="director-panel-body">
            <div className="director-panel-toolbar">
              <p>Keep future ideas out of the main production view until you need them.</p>
              <button type="button" disabled={buildBusy || !buildState.configured} onClick={() => void findTopics()}>
                {buildBusy ? <LoaderCircle size={14} className="spin" /> : <Sparkles size={14} />}
                Generate ideas
              </button>
            </div>

            {futureTopics.length > 0 ? (
              <>
                <div className="director-topic-tabs">
                  {futureTopics.map(topic => (
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
                {selectedTopic && <TopicSummary topic={selectedTopic} />}
                {selectedTopic?.status === 'READY' && (
                  <button
                    type="button"
                    className="director-discuss-topic"
                    onClick={() => setMessage(`I want to evaluate this as a future episode: "${selectedTopic.title}". Challenge the idea and tell me what would make the episode stronger before we commit to it.`)}
                  >
                    Put this idea into Director chat
                  </button>
                )}
              </>
            ) : (
              <p className="director-empty">No future topic ideas yet.</p>
            )}
          </div>
        </details>

        <details className="director-panel">
          <summary>
            <span>Ask Director</span>
            <small>Use chat only when a production decision needs discussion</small>
          </summary>
          <div className="director-panel-body">
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
                placeholder="Ask about one episode decision, risk, idea, or trade-off…"
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
          </div>
        </details>
      </div>
    </main>
  );
}
