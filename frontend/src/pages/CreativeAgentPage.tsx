import { useEffect, useRef, useState } from 'react';
import { ArrowRight, LoaderCircle, LockKeyhole, Send } from 'lucide-react';
import {
  generateCreativeStage,
  loadCreativeStage,
  lockCreativeStage,
  sendCreativeMessage,
  type CreativeStageKey,
  type CreativeStageState,
  type SceneArtifact,
  type ScriptArtifact
} from '../api/creativeApi';
import '../styles/creativeAgent.css';

type Artifact = ScriptArtifact | SceneArtifact;

function clock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.max(0, totalSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function TimelineRange({ start, end }: { start: number; end: number }) {
  return <div className="creative-time">{clock(start)}–{clock(end)}</div>;
}

function ThinkingDots() {
  return (
    <span className="creative-thinking" aria-label="Agent is thinking">
      <span />
      <span />
      <span />
    </span>
  );
}

function ScriptView({ artifact }: { artifact: ScriptArtifact }) {
  return (
    <>
      <section className="creative-section creative-overview">
        <h2>Script</h2>
        <p>{artifact.overview}</p>
        <strong>{clock(artifact.targetDurationSeconds)} production draft</strong>
      </section>

      <section className="creative-section">
        <h2>Timeline</h2>
        <div className="creative-timeline">
          {artifact.timeline.map(item => (
            <article key={item.sectionId} className="creative-timeline-row">
              <TimelineRange start={item.startSecond} end={item.endSecond} />
              <div className="creative-timeline-copy">
                <div className="creative-timeline-title">
                  <h3>{item.sectionTitle}</h3>
                  {(item.ahaMoment || item.reelCandidate) && (
                    <span className="creative-beat-markers">
                      {item.ahaMoment && <i>Aha</i>}
                      {item.reelCandidate && <i>Short</i>}
                    </span>
                  )}
                </div>
                <p className="creative-narration">{item.narration}</p>
                <p className="creative-voice"><strong>Voice:</strong> {item.voiceDirection}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="creative-section creative-handoff">
        <h2>Scene Agent handoff</h2>
        <p>{artifact.handoffPrompt}</p>
      </section>
    </>
  );
}

function SceneView({ artifact }: { artifact: SceneArtifact }) {
  return (
    <>
      <section className="creative-section creative-overview">
        <h2>Scene plan</h2>
        <p>{artifact.overview}</p>
      </section>

      <section className="creative-section">
        <h2>Timeline — script + voice + scene movement</h2>
        <div className="creative-timeline scene-timeline">
          {artifact.timeline.map(item => (
            <article key={item.sceneId} className="creative-timeline-row scene-row">
              <TimelineRange start={item.startSecond} end={item.endSecond} />
              <div className="creative-timeline-copy">
                <h3>{item.sectionTitle}</h3>
                <p className="creative-narration">{item.narration}</p>
                <p className="creative-voice"><strong>Voice:</strong> {item.voiceDirection}</p>
                <div className="creative-scene-direction">
                  <p><strong>Visual:</strong> {item.visualFocus}</p>
                  {item.sceneMoves.map((move, index) => <p key={`${item.sceneId}-move-${index}`}><strong>{index + 1}.</strong> {move}</p>)}
                  <p><strong>Camera:</strong> {item.camera}</p>
                  {item.objects.length > 0 && <p><strong>Objects:</strong> {item.objects.join(', ')}</p>}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="creative-section">
        <h2>Shots → Spline Agent</h2>
        <div className="creative-shot-list">
          {artifact.shots.map(shot => (
            <article key={shot.shotKey} className="creative-shot">
              <div className="creative-shot-head">
                <strong>{shot.shotKey}</strong>
                <TimelineRange start={shot.startSecond} end={shot.endSecond} />
              </div>
              <p className="creative-narration">{shot.script}</p>
              <p className="creative-voice"><strong>Voice:</strong> {shot.voiceDirection}</p>
              <div className="creative-shot-direction">
                {shot.moves.map((move, index) => <p key={`${shot.shotKey}-move-${index}`}><strong>{index + 1}.</strong> {move}</p>)}
                <p><strong>Camera:</strong> {shot.camera}</p>
                <p><strong>Goal:</strong> {shot.visualGoal}</p>
              </div>
              <div className="creative-spline-prompt">
                <strong>Spline prompt</strong>
                <p>{shot.promptForSpline}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="creative-section creative-handoff">
        <h2>Spline handoff</h2>
        <p>{artifact.handoffPrompt}</p>
      </section>
    </>
  );
}

export function CreativeAgentPage({ stageKey }: { stageKey: CreativeStageKey }) {
  const [state, setState] = useState<CreativeStageState<Artifact> | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [pendingMessage, setPendingMessage] = useState('');
  const [error, setError] = useState('');
  const chatHistoryRef = useRef<HTMLDivElement | null>(null);
  const autoGeneratedScriptRef = useRef<string | null>(null);

  async function load() {
    try {
      setError('');
      setState(await loadCreativeStage<Artifact>(stageKey));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : `Could not load ${stageKey.toLowerCase()} agent.`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    autoGeneratedScriptRef.current = null;
    setLoading(true);
    void load();
  }, [stageKey]);

  useEffect(() => {
    const history = chatHistoryRef.current;
    if (!history) return;
    history.scrollTop = history.scrollHeight;
  }, [state?.messages.length, busy, pendingMessage]);

  async function generate() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      setState(await generateCreativeStage<Artifact>(stageKey));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create the production artifact.');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (stageKey !== 'SCRIPT' || !state || state.artifact || state.locked || busy || !state.upstreamReady || !state.agentConfigured) return;
    const generationKey = `${state.episode.id}:${state.revision}`;
    if (autoGeneratedScriptRef.current === generationKey) return;
    autoGeneratedScriptRef.current = generationKey;
    void generate();
  }, [stageKey, state?.artifact, state?.locked, state?.upstreamReady, state?.agentConfigured, state?.episode.id, state?.revision, busy]);

  async function send() {
    const text = message.trim();
    if (!text || busy) return;
    setBusy(true);
    setError('');
    setMessage('');
    setPendingMessage(text);
    try {
      setState(await sendCreativeMessage<Artifact>(stageKey, text));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not revise the production artifact.');
      try {
        setState(await loadCreativeStage<Artifact>(stageKey));
      } catch {
      }
    } finally {
      setPendingMessage('');
      setBusy(false);
    }
  }

  async function lock() {
    if (!state || busy) return;
    if (state.locked) {
      window.location.hash = state.nextRoute;
      return;
    }
    setBusy(true);
    setError('');
    try {
      const result = await lockCreativeStage<Artifact>(stageKey);
      setState(result.stage);
      window.location.hash = result.nextRoute;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not lock this stage.');
    } finally {
      setBusy(false);
    }
  }

  if (loading && !state) return <main className="creative-agent-page"><div className="creative-loading"><LoaderCircle className="spin" size={22} /></div></main>;
  if (!state) return <main className="creative-agent-page"><div className="creative-error">{error || 'Agent unavailable.'}</div></main>;

  const script = stageKey === 'SCRIPT' ? state.artifact as ScriptArtifact | null : null;
  const scene = stageKey === 'SCENE' ? state.artifact as SceneArtifact | null : null;
  const lockLabel = stageKey === 'SCRIPT' ? 'LOCK SCRIPT → SCENE' : 'LOCK SCENES → SPLINE';
  const nextAgentLabel = stageKey === 'SCRIPT' ? 'SCENE AGENT' : 'SPLINE AGENT';

  return (
    <main className="creative-agent-page">
      <header className="creative-agent-header">
        <div>
          <span>{state.episode.episodeNumber}</span>
          <h1>{state.displayName} Agent</h1>
          <p>{state.episode.title}</p>
        </div>
        <button type="button" className="creative-director-link" onClick={() => { window.location.hash = '#/'; }}>Director</button>
      </header>

      {error && <div className="creative-error">{error}</div>}

      {!state.upstreamReady ? (
        <section className="creative-empty">
          <h2>Script must be locked first.</h2>
          <button type="button" onClick={() => { window.location.hash = '#/agents/script'; }}>Open Script Agent <ArrowRight size={15} /></button>
        </section>
      ) : !state.artifact ? (
        <section className="creative-empty creative-generating">
          {stageKey === 'SCRIPT' ? (
            <>
              <h2>{busy ? 'Writing the complete script…' : 'Script generation is ready.'}</h2>
              {busy ? <ThinkingDots /> : <button type="button" disabled={!state.agentConfigured} onClick={() => { autoGeneratedScriptRef.current = null; void generate(); }}>Retry Script</button>}
            </>
          ) : (
            <>
              <h2>Create the complete scene plan.</h2>
              <button type="button" disabled={busy || !state.agentConfigured} onClick={() => void generate()}>
                {busy ? <LoaderCircle size={16} className="spin" /> : null}
                Create Scene Plan
              </button>
            </>
          )}
        </section>
      ) : (
        <>
          <div className="creative-workspace">
            <div className="creative-artifact-column">
              {script && <ScriptView artifact={script} />}
              {scene && <SceneView artifact={scene} />}
            </div>

            <aside className="creative-review-column">
              <section className="creative-chat">
                <h2>Corrections</h2>
                <div className="creative-chat-history" ref={chatHistoryRef}>
                  {state.messages.length === 0 && <p className="creative-chat-empty">Ask for a change after reviewing the work.</p>}
                  {state.messages.map(item => (
                    <article key={item.id} className={item.sender === 'USER' ? 'creator' : 'agent'}>
                      <strong>{item.sender === 'USER' ? 'You' : state.displayName}</strong>
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
                {!state.locked && (
                  <div className="creative-chat-input">
                    <textarea
                      value={message}
                      onChange={event => setMessage(event.target.value)}
                      placeholder="What should change?"
                      rows={4}
                      disabled={busy}
                      onKeyDown={event => {
                        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                          event.preventDefault();
                          void send();
                        }
                      }}
                    />
                    <button type="button" disabled={busy || !message.trim()} onClick={() => void send()} aria-label="Send correction">
                      {busy ? <ThinkingDots /> : <Send size={16} />}
                    </button>
                  </div>
                )}
              </section>
            </aside>
          </div>

          <section className={`creative-stage-gate ${state.locked ? 'is-locked' : ''}`}>
            {!state.locked && state.remainingTasks.length > 0 && (
              <div className="creative-remaining">
                {state.remainingTasks.map(item => <p key={item}>{item}</p>)}
              </div>
            )}
            <button
              type="button"
              className={`creative-lock-button ${state.locked ? 'locked' : ''}`}
              disabled={busy || (!state.locked && !state.readyToLock)}
              onClick={() => void lock()}
            >
              {state.locked ? <>LOCKED — OPEN {nextAgentLabel} <ArrowRight size={16} /></> : <><LockKeyhole size={16} /> {lockLabel}</>}
            </button>
          </section>
        </>
      )}
    </main>
  );
}
