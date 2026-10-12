import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, FileJson2, LockKeyhole, LoaderCircle, Upload } from 'lucide-react';
import { loadCreativeStage, type CreativeStageState, type ScriptArtifact } from '../api/creativeApi';
import {
  importProductionContract,
  loadProductionContract,
  type ProductionContractPayload,
  type ProductionContractSegment,
  type ProductionContractState
} from '../api/productionContractApi';
import { clock } from '../lib/ep001Production';
import { CreativeAgentPage } from './CreativeAgentPage';
import '../styles/productionFlow.css';

function LockedScript({ state }: { state: CreativeStageState<ScriptArtifact> }) {
  const artifact = state.artifact!;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [contract, setContract] = useState<ProductionContractState | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [importMessage, setImportMessage] = useState('');

  const segmentByRange = useMemo(() => {
    const map = new Map<string, ProductionContractSegment>();
    for (const segment of contract?.payload?.timeline || []) {
      map.set(segment.startSecond + ':' + segment.endSecond, segment);
    }
    return map;
  }, [contract]);

  useEffect(() => {
    let active = true;
    loadProductionContract()
      .then(next => { if (active) setContract(next); })
      .catch(() => { if (active) setContract(null); });
    return () => { active = false; };
  }, []);

  async function handleImport(file?: File) {
    if (!file || importing) return;
    setImporting(true);
    setError('');
    setImportMessage('');
    try {
      const raw = await file.text();
      const payload = JSON.parse(raw) as ProductionContractPayload;
      const result = await importProductionContract(payload);
      setContract(await loadProductionContract());
      setImportMessage(result.message + ' ' + result.timelineSegments + ' timeline blocks are active.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not import production contract.');
    } finally {
      setImporting(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <main className="production-page">
      <header className="production-header">
        <div>
          <span>{state.episode.episodeNumber} · SCRIPT AGENT</span>
          <h1>Locked Production Timeline</h1>
          <p>{state.episode.title}</p>
        </div>
        <div className="production-lock"><LockKeyhole size={15} /> LOCKED · REV {state.revision}</div>
      </header>

      {error && <div className="production-error">{error}</div>}
      {importMessage && <div className="production-success">{importMessage}</div>}

      <section className="production-summary">
        <div><span>WORKING TIMELINE</span><strong>{clock(artifact.targetDurationSeconds)}</strong></div>
        <div><span>CONTRACT</span><strong>{contract?.ready ? 'HEAR + SEE imported' : 'Narration only'}</strong></div>
        <div><span>NEXT</span><strong>Voice Agent</strong></div>
      </section>

      <section className="contract-import-card">
        <div>
          <span>PRODUCTION CONTRACT INPUT</span>
          <strong>{contract?.ready ? 'Validated ChatGPT / external contract is active.' : 'Import the HEAR / SEE contract created in ChatGPT.'}</strong>
          <p>
            Import never changes LOCKED narration. MediaOS rejects the file if timing or spoken text differs from Script revision {state.revision}.
            The same downstream Voice and Visual functions run regardless of whether the contract came from import or the OpenAI Agent.
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={event => void handleImport(event.target.files?.[0])}
        />
        <button type="button" disabled={importing} onClick={() => inputRef.current?.click()}>
          {importing ? <LoaderCircle className="spin" size={15} /> : <Upload size={15} />}
          {contract?.ready ? 'Replace Contract' : 'Import Contract'}
        </button>
      </section>

      <section className="script-contract">
        <div className="production-section-head">
          <div>
            <span>SECOND-BY-SECOND PRODUCTION CONTRACT</span>
            <h2>At every interval: what is heard, how it is delivered, and what the viewer sees.</h2>
          </div>
          <div className="contract-source">
            <FileJson2 size={14} />
            {contract?.ready ? contract.source || 'IMPORTED' : 'WAITING FOR IMPORT'}
          </div>
        </div>

        <div className="script-contract-list">
          {artifact.timeline.map(item => {
            const segment = segmentByRange.get(item.startSecond + ':' + item.endSecond);
            return (
              <article className="script-contract-row" key={item.sectionId}>
                <div className="script-contract-time">
                  {clock(item.startSecond)}–{clock(item.endSecond)}
                  {segment && <small>{segment.shotKey}<br />{segment.clipKey}</small>}
                </div>
                <div className="script-contract-copy">
                  <span>{item.sectionTitle}</span>
                  <div className="hear-see-grid">
                    <div className="timeline-hear">
                      <h3>WHAT YOU HEAR</h3>
                      <p>{item.narration}</p>
                      <div className="script-voice-direction">
                        <strong>VOICE / INTONATION</strong>
                        <p>{segment?.voiceDirection || item.voiceDirection}</p>
                      </div>
                    </div>
                    <div className="timeline-see">
                      <h3>WHAT YOU SEE</h3>
                      {segment ? (
                        <>
                          <p>{segment.visual.summary}</p>
                          {segment.visual.camera && <dl><dt>CAMERA</dt><dd>{segment.visual.camera}</dd></dl>}
                          {segment.visual.attentionCue && <dl><dt>ATTENTION</dt><dd>{segment.visual.attentionCue}</dd></dl>}
                          {!!segment.visual.objects?.length && <dl><dt>OBJECTS</dt><dd>{segment.visual.objects.join(' · ')}</dd></dl>}
                          {!!segment.visual.semanticAnchors?.length && <dl><dt>ANCHORS</dt><dd>{segment.visual.semanticAnchors.join(' · ')}</dd></dl>}
                          {!!segment.visual.effects?.length && <dl><dt>EFFECTS</dt><dd>{segment.visual.effects.join(' · ')}</dd></dl>}
                        </>
                      ) : (
                        <p className="timeline-empty">Visual direction will appear here after importing the production contract.</p>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="production-next">
        <div>
          <span>ONE CONTRACT · TWO INPUT MODES</span>
          <strong>Import from ChatGPT now; OpenAI generation remains available for future unlocked Script revisions.</strong>
          <p>Both paths converge on the same validated timeline contract before Voice and Visual production.</p>
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

  // Unlocked episodes keep the existing OpenAI Responses API workflow.
  return <CreativeAgentPage stageKey="SCRIPT" />;
}
