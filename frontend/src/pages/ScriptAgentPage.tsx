import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Bot, Download, FileJson2, LockKeyhole, LoaderCircle, Save, Upload } from 'lucide-react';
import { loadCreativeStage, type CreativeStageState, type ScriptArtifact } from '../api/creativeApi';
import {
  importProductionContract,
  loadProductionContract,
  type ProductionContractPayload,
  type ProductionContractSegment,
  type ProductionContractState
} from '../api/productionContractApi';
import { importLockedScript, type LockedScriptImportPayload } from '../api/lockedScriptApi';
import { syncVoiceClips, updateVoiceClipNarration, type VoiceClipState } from '../api/voiceClipApi';
import { buildVoiceShotBundles, buildVoiceShotBundlesFromContract, clock } from '../lib/ep001Production';
import { CreativeAgentPage } from './CreativeAgentPage';
import '../styles/productionFlow.css';

function ManualLockedScriptImport({
  state,
  onImported,
  onOpenAiMode
}: {
  state: CreativeStageState<ScriptArtifact>;
  onImported: (next: CreativeStageState<ScriptArtifact>) => void;
  onOpenAiMode: () => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleImport(file?: File) {
    if (!file || busy) return;
    setBusy(true);
    setError('');
    try {
      const payload = JSON.parse(await file.text()) as LockedScriptImportPayload;
      await importLockedScript(payload);
      onImported(await loadCreativeStage<ScriptArtifact>('SCRIPT'));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not import the LOCKED Script.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <main className="production-page script-import-page">
      <header className="production-header">
        <div>
          <span>{state.episode.episodeNumber} · SCRIPT AGENT</span>
          <h1>Add the Locked Script</h1>
          <p>{state.episode.title}</p>
        </div>
      </header>

      {error && <div className="production-error">{error}</div>}

      <section className="manual-script-import-card">
        <div className="manual-script-import-copy">
          <span>MANUAL FIRST · NO OPENAI CALL</span>
          <h2>Import the director-approved canonical narration.</h2>
          <p>
            MediaOS validates episode identity, the full 20-minute contiguous timeline, every narration block,
            and the FULLY_LOCKED declaration. A successful import creates a Script revision and immediately locks it.
          </p>
        </div>

        <div className="manual-script-import-flow">
          <div><strong>1</strong><span>Choose LOCKED Script JSON</span></div>
          <i>→</i>
          <div><strong>2</strong><span>Validate + store revision</span></div>
          <i>→</i>
          <div><strong>3</strong><span>Open read-only timeline</span></div>
          <i>→</i>
          <div><strong>4</strong><span>Voice Agent becomes ready</span></div>
        </div>

        <input
          ref={inputRef}
          hidden
          type="file"
          accept=".json,application/json"
          onChange={event => void handleImport(event.target.files?.[0])}
        />

        <button type="button" className="manual-script-primary" disabled={busy} onClick={() => inputRef.current?.click()}>
          {busy ? <LoaderCircle size={16} className="spin" /> : <Upload size={16} />}
          {busy ? 'Validating and locking…' : 'Import Locked Script'}
        </button>
      </section>

      <section className="manual-script-openai">
        <div>
          <span>ALTERNATIVE INPUT</span>
          <strong>MediaOS can still create or revise a Script through the OpenAI Responses API.</strong>
          <p>We are deliberately not using that path for this first EP001 test.</p>
        </div>
        <button type="button" onClick={onOpenAiMode}><Bot size={15} /> OpenAI Agent Mode</button>
      </section>
    </main>
  );
}

function LockedScript({ state }: { state: CreativeStageState<ScriptArtifact> }) {
  const artifact = state.artifact!;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [contract, setContract] = useState<ProductionContractState | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [importMessage, setImportMessage] = useState('');
  const [voiceClips, setVoiceClips] = useState<VoiceClipState[]>([]);
  const [hearDrafts, setHearDrafts] = useState<Record<string, string>>({});
  const [savingClip, setSavingClip] = useState('');

  const segmentByRange = useMemo(() => {
    const map = new Map<string, ProductionContractSegment>();
    for (const segment of contract?.payload?.timeline || []) {
      map.set(segment.startSecond + ':' + segment.endSecond, segment);
    }
    return map;
  }, [contract]);

  const voiceClipByKey = useMemo(
    () => new Map(voiceClips.map(clip => [clip.clipKey, clip])),
    [voiceClips]
  );

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const nextContract = await loadProductionContract();
        if (!active) return;
        setContract(nextContract);

        const bundles = nextContract.ready && nextContract.payload
          ? buildVoiceShotBundlesFromContract(nextContract.payload)
          : buildVoiceShotBundles(artifact);
        const nextClips = await syncVoiceClips(state.revision, bundles);
        if (!active) return;
        setVoiceClips(nextClips);
        setHearDrafts(Object.fromEntries(nextClips.map(clip => [clip.clipKey, clip.narration])));
      } catch (cause) {
        if (!active) return;
        setContract(null);
        setError(cause instanceof Error ? cause.message : 'Could not prepare editable narration.');
      }
    })();
    return () => { active = false; };
  }, [artifact, state.revision]);

  async function saveHear(segment: ProductionContractSegment, fallbackNarration: string) {
    const clip = voiceClipByKey.get(segment.clipKey);
    if (!clip || clip.approved || savingClip) return;

    const narration = (hearDrafts[segment.clipKey] ?? clip.narration ?? fallbackNarration).trim();
    if (!narration) {
      setError('WHAT YOU HEAR cannot be empty.');
      return;
    }

    setSavingClip(segment.clipKey);
    setError('');
    try {
      const saved = await updateVoiceClipNarration(segment.clipKey, {
        scriptRevision: state.revision,
        narration
      });
      setVoiceClips(current => current.map(row => row.clipKey === saved.clipKey ? saved : row));
      setHearDrafts(current => ({ ...current, [saved.clipKey]: saved.narration }));
      window.location.hash = '#/agents/voice?shot=' + encodeURIComponent(segment.shotKey)
        + '&clip=' + encodeURIComponent(segment.clipKey);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save the narration correction.');
    } finally {
      setSavingClip('');
    }
  }

  async function downloadTemplate() {
    setError('');
    try {
      const response = await fetch('/api/v1/production-contract/template', { cache: 'no-store' });
      if (!response.ok) throw new Error('Could not export the exact LOCKED Script template.');
      const payload = await response.json();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = state.episode.episodeNumber + '_MediaOS_Production_Contract_TEMPLATE.json';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not export contract template.');
    }
  }

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
      setImportMessage(result.message + ' ' + result.timelineSegments + '/' + artifact.timeline.length + ' timeline blocks are now active.');
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
        <div><span>CONTRACT</span><strong>{contract?.ready ? (contract.payload?.timeline.length || 0) + '/' + artifact.timeline.length + ' HEAR + SEE blocks' : 'Narration only'}</strong></div>
        <div><span>NEXT</span><strong>Voice Agent</strong></div>
      </section>

      <section className="contract-import-card">
        <div>
          <span>PRODUCTION CONTRACT INPUT</span>
          <strong>{contract?.ready ? 'Validated HEAR / SEE blocks are active. Add the next shot contract to merge it into the current timeline.' : 'Import the first HEAR / SEE shot contract created in ChatGPT.'}</strong>
          <p>
            Import never changes LOCKED narration. MediaOS rejects the file if timing or spoken text differs from Script revision {state.revision}.
            Shot contracts are merged incrementally: new time blocks are added, and matching time blocks are updated. Existing blocks outside the imported shot stay untouched.
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={event => void handleImport(event.target.files?.[0])}
        />
        <div className="contract-import-actions">
          <button type="button" className="secondary" disabled={importing} onClick={() => void downloadTemplate()}>
            <Download size={15} /> Exact Template
          </button>
          <button type="button" disabled={importing} onClick={() => inputRef.current?.click()}>
            {importing ? <LoaderCircle className="spin" size={15} /> : <Upload size={15} />}
            {contract?.ready ? 'Add / Update Shot Contract' : 'Import First Shot Contract'}
          </button>
        </div>
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
                    {(() => {
                      const clip = segment ? voiceClipByKey.get(segment.clipKey) : undefined;
                      const savedNarration = clip?.narration || item.narration;
                      const draft = segment ? hearDrafts[segment.clipKey] ?? savedNarration : savedNarration;
                      const changed = draft.trim() !== savedNarration.trim();
                      const editable = Boolean(segment && clip && !clip.approved);
                      const saving = Boolean(segment && savingClip === segment.clipKey);

                      return (
                        <div className={'timeline-hear locked-hear-panel' + (clip?.approved ? ' is-voice-locked' : '')}>
                          <div className="timeline-hear-head">
                            <h3>WHAT YOU HEAR</h3>
                            <div className="timeline-lock-badges">
                              <span>LOCKED SCRIPT</span>
                              {clip?.narrationOverridden && <span className="override">DIRECTOR OVERRIDE</span>}
                              {clip?.approved && <span className="voice-locked">VOICE LOCKED</span>}
                            </div>
                          </div>

                          {editable && segment ? (
                            <>
                              <textarea
                                className="timeline-hear-editor"
                                value={draft}
                                onChange={event => setHearDrafts(current => ({
                                  ...current,
                                  [segment.clipKey]: event.target.value
                                }))}
                                aria-label={'Edit WHAT YOU HEAR for ' + segment.clipKey}
                              />
                              <div className="timeline-hear-actions">
                                <small>Save keeps the Script baseline locked, updates the Voice override, and opens this exact clip in Voice Agent.</small>
                                <button
                                  type="button"
                                  disabled={!changed || saving}
                                  onClick={() => void saveHear(segment, item.narration)}
                                >
                                  {saving ? <LoaderCircle className="spin" size={14} /> : <Save size={14} />}
                                  {saving ? 'Saving…' : 'Save & Open Voice'}
                                </button>
                              </div>
                            </>
                          ) : (
                            <p className="timeline-hear-readonly">{savedNarration}</p>
                          )}

                          <div className="script-voice-direction">
                            <strong>VOICE / INTONATION</strong>
                            <p>{segment?.voiceDirection || item.voiceDirection}</p>
                          </div>
                        </div>
                      );
                    })()}
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
  const [openAiMode, setOpenAiMode] = useState(false);

  useEffect(() => {
    let active = true;
    loadCreativeStage<ScriptArtifact>('SCRIPT')
      .then(next => { if (active) setState(next); })
      .catch(() => { if (active) setState(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) return <main className="production-loading"><LoaderCircle className="spin" size={22} /></main>;
  if (!state) return <main className="production-loading"><strong>Script Agent unavailable.</strong></main>;
  if (state.locked && state.artifact) return <LockedScript state={state} />;
  if (openAiMode) return <CreativeAgentPage stageKey="SCRIPT" />;

  return (
    <ManualLockedScriptImport
      state={state}
      onImported={setState}
      onOpenAiMode={() => setOpenAiMode(true)}
    />
  );
}
