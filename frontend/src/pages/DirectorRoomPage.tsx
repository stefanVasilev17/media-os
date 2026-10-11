import { useEffect, useState } from 'react';
import { ArrowRight, Check, LoaderCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { loadProductionFlow, type ProductionFlowState } from '../api/productionFlowApi';
import '../styles/productionFlow.css';

export function DirectorRoomPage() {
  const [state, setState] = useState<ProductionFlowState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setError('');
    try {
      setState(await loadProductionFlow());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load Director.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  if (loading) return <main className="production-loading"><LoaderCircle className="spin" size={22} /></main>;
  if (!state) return <main className="production-loading"><strong>{error || 'Director unavailable.'}</strong></main>;

  return (
    <main className="production-page director-focus-page">
      <header className="production-header">
        <div>
          <span>{state.episode.episodeNumber} · DIRECTOR</span>
          <h1>{state.episode.title}</h1>
          <p>One production flow. Only the information needed to make the next decision.</p>
        </div>
        <button type="button" className="icon-button" onClick={() => void load()} aria-label="Refresh Director">
          <RefreshCw size={16} />
        </button>
      </header>

      {error && <div className="production-error">{error}</div>}

      <section className="director-next-card">
        <div>
          <span>NEXT ACTION</span>
          <h2>{state.nextLabel}</h2>
          <p>MediaOS will continue from the current LOCKED state; completed upstream work stays protected.</p>
        </div>
        <button type="button" onClick={() => { window.location.hash = state.nextRoute; }}>
          {state.nextLabel} <ArrowRight size={16} />
        </button>
      </section>

      <section className="director-production-flow">
        <div className="production-section-head">
          <div>
            <span>EPISODE PRODUCTION</span>
            <h2>Director → Script → Voice → Visual</h2>
          </div>
          <div className="memory-preflight-badge">{state.memoryRuleCount} MEMORY RULES</div>
        </div>

        <div className="director-flow-list">
          {state.stages.map((stage, index) => (
            <button
              type="button"
              key={stage.key}
              className={'director-flow-row ' + stage.status.toLowerCase()}
              onClick={() => { window.location.hash = stage.route; }}
            >
              <div className="director-flow-index">{String(index + 1).padStart(2, '0')}</div>
              <div>
                <strong>{stage.label}</strong>
                <p>{stage.detail}</p>
              </div>
              <span>{stage.status === 'LOCKED' || stage.status === 'READY' ? <Check size={14} /> : stage.status}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="director-health-card">
        <ShieldCheck size={18} />
        <div>
          <strong>Production Memory is mandatory.</strong>
          <p>Script, Voice and Visual actions run a memory preflight before work starts. Creator corrections become durable rules for later work instead of disappearing inside one review cycle.</p>
        </div>
      </section>
    </main>
  );
}
