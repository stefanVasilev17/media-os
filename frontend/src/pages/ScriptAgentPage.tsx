import { useEffect, useState } from 'react';
import { ArrowRight, LockKeyhole, LoaderCircle } from 'lucide-react';
import { loadCreativeStage, type CreativeStageState, type ScriptArtifact } from '../api/creativeApi';
import { clock } from '../lib/ep001Production';
import { CreativeAgentPage } from './CreativeAgentPage';
import '../styles/productionFlow.css';

function LockedScript({ state }: { state: CreativeStageState<ScriptArtifact> }) {
  const artifact = state.artifact!;

  return (
    <main className="production-page">
      <header className="production-header">
        <div>
          <span>{state.episode.episodeNumber} · SCRIPT AGENT</span>
          <h1>Locked Script</h1>
          <p>{state.episode.title}</p>
        </div>
        <div className="production-lock"><LockKeyhole size={15} /> LOCKED · REV {state.revision}</div>
      </header>

      <section className="production-summary">
        <div><span>WORKING TIMELINE</span><strong>{clock(artifact.targetDurationSeconds)}</strong></div>
        <div><span>MODE</span><strong>Read-only source of truth</strong></div>
        <div><span>NEXT</span><strong>Voice Agent</strong></div>
      </section>

      <section className="script-contract">
        <div className="production-section-head">
          <div>
            <span>SECOND-BY-SECOND NARRATION CONTRACT</span>
            <h2>What the viewer hears, and how it should be delivered.</h2>
          </div>
        </div>

        <div className="script-contract-list">
          {artifact.timeline.map(item => (
            <article className="script-contract-row" key={item.sectionId}>
              <div className="script-contract-time">{clock(item.startSecond)}–{clock(item.endSecond)}</div>
              <div className="script-contract-copy">
                <span>{item.sectionTitle}</span>
                <h3>What you hear</h3>
                <p>{item.narration}</p>
                <div className="script-voice-direction">
                  <strong>VOICE / INTONATION</strong>
                  <p>{item.voiceDirection}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="production-next">
        <div>
          <span>SCRIPT IS CANONICAL</span>
          <strong>Voice generation cannot rewrite this text.</strong>
          <p>Voice Agent consumes this exact locked narration in smaller clips and attaches real ElevenLabs timing.</p>
        </div>
        <button type="button" onClick={() => { window.location.hash = '#/agents/voice'; }}>
          Continue to Voice Agent <ArrowRight size={16} />
        </button>
      </section>
    </main>
  );
}

export function ScriptAgentPage() {
  const [state, setState] = useState<CreativeStageState<ScriptArtifact> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    loadCreativeStage<ScriptArtifact>('SCRIPT')
      .then(next => { if (active) setState(next); })
      .catch(() => { if (active) setState(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) return <main className="production-loading"><LoaderCircle className="spin" size={22} /></main>;
  if (state?.locked && state.artifact) return <LockedScript state={state} />;
  return <CreativeAgentPage stageKey="SCRIPT" />;
}
