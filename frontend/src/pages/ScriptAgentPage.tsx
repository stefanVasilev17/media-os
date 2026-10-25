import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Bot, Download, FileJson2, LockKeyhole, LoaderCircle, PencilLine, Save, Upload, Mic2 } from 'lucide-react';
import { loadCreativeStage, type CreativeStageState, type ScriptArtifact } from '../api/creativeApi';
import {
  importProductionContract,
  loadProductionContract,
  type ProductionContractPayload,
  type ProductionContractSegment,
  type ProductionContractState
} from '../api/productionContractApi';
import { importLockedScript, type LockedScriptImportPayload } from '../api/lockedScriptApi';
import { importDirectorVoicePack, type DirectorVoicePackPayload } from '../api/directorVoicePackApi';
import {
  importDirectorShot10Draft, loadDirectorShot10Draft, prepareDirectorShot10Studio,
  type DirectorShot10DraftPayload, type DirectorShot10DraftState
} from '../api/directorShot10DraftApi';
import { loadVoiceClips, syncVoiceClips, updateVoiceClipNarration, type VoiceClipState } from '../api/voiceClipApi';
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
  const amendmentRef = useRef<HTMLInputElement | null>(null);
  const [amending, setAmending] = useState(false);
  const [contract, setContract] = useState<ProductionContractState | null>(null);
  const [voiceClips, setVoiceClips] = useState<VoiceClipState[]>([]);
  const [editingClipKey, setEditingClipKey] = useState('');
  const [draftByClip, setDraftByClip] = useState<Record<string, string>>({});
  const [savingClipKey, setSavingClipKey] = useState('');
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [importMessage, setImportMessage] = useState('');
  const [shot10Draft, setShot10Draft] = useState<DirectorShot10DraftState | null>(null);
  const [preparingShot10, setPreparingShot10] = useState(false);

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
    Promise.all([
      loadProductionContract(),
      loadVoiceClips(state.revision).catch(() => [] as VoiceClipState[])
    ])
      .then(([nextContract, nextClips]) => {
        if (!active) return;
        setContract(nextContract);
        setVoiceClips(nextClips);
      })
      .catch(() => {
        if (!active) return;
        setContract(null);
        setVoiceClips([]);
      });
    return () => { active = false; };
  }, [state.revision]);

  useEffect(() => {
    let active = true;
    loadDirectorShot10Draft()
      .then(draft => { if (active) setShot10Draft(draft); })
      .catch(() => { if (active) setShot10Draft(null); });
    return () => { active = false; };
  }, []);

  async function prepareShot10Studio() {
    if (preparingShot10 || !shot10Draft?.ready) return;
    setPreparingShot10(true);
    setError('');
    setImportMessage('');
    try {
      const result = await prepareDirectorShot10Studio();
      setShot10Draft(await loadDirectorShot10Draft());
      setImportMessage(result.message);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not prepare SHOT 10 Studio voices.');
    } finally {
      setPreparingShot10(false);
    }
  }

  function beginNarrationEdit(clipKey: string, narration: string) {
    setError('');
    setImportMessage('');
    setDraftByClip(current => ({ ...current, [clipKey]: narration }));
    setEditingClipKey(clipKey);
  }

  async function saveNarrationAndOpenVoice(segment: ProductionContractSegment, narration: string) {
    if (savingClipKey) return;
    const nextNarration = narration.trim();
    if (!nextNarration) {
      setError('WHAT YOU HEAR cannot be empty.');
      return;
    }

    setSavingClipKey(segment.clipKey);
    setError('');
    setImportMessage('');
    try {
      let availableClips = voiceClips;
      let existing = availableClips.find(clip => clip.clipKey === segment.clipKey);

      if (!existing) {
        const bundles = contract?.ready && contract.payload
          ? buildVoiceShotBundlesFromContract(contract.payload)
          : buildVoiceShotBundles(artifact);
        availableClips = await syncVoiceClips(state.revision, bundles);
        setVoiceClips(availableClips);
        existing = availableClips.find(clip => clip.clipKey === segment.clipKey);
      }

      if (existing?.approved) {
        throw new Error('This voice clip is already LOCKED. Unlock/correct it in the Voice workflow before changing its spoken words.');
      }

      let saved = existing;
      if (!existing || nextNarration !== existing.narration.trim()) {
        saved = await updateVoiceClipNarration(segment.clipKey, {
          scriptRevision: state.revision,
          narration: nextNarration
        });
      }

      if (!saved) throw new Error('Voice clip could not be initialized for this Script block.');

      setVoiceClips(current => {
        const found = current.some(clip => clip.clipKey === saved!.clipKey);
        return found
          ? current.map(clip => clip.clipKey === saved!.clipKey ? saved! : clip)
          : [...current, saved!];
      });
      setDraftByClip(current => ({ ...current, [segment.clipKey]: saved!.narration }));
      setEditingClipKey('');

      window.location.hash = '#/agents/voice?shot=' + encodeURIComponent(segment.shotKey)
        + '&clip=' + encodeURIComponent(segment.clipKey);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save WHAT YOU HEAR.');
    } finally {
      setSavingClipKey('');
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

  async function importDirectorAmendment(file?: File) {
    if (!file || amending) return;
    setAmending(true);
    setError('');
    try {
      const payload = JSON.parse(await file.text());
      const response = await fetch('/api/v1/locked-script/director-amendment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.detail || body.message || `Director amendment rejected (HTTP ${response.status}).`);
      }
      window.location.reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Director amendment import failed.');
    } finally {
      setAmending(false);
      if (amendmentRef.current) amendmentRef.current.value = '';
    }
  }

  async function handleImport(file?: File) {
    if (!file || importing) return;
    setImporting(true);
    setError('');
    setImportMessage('');
    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw) as {
        schemaVersion: string;
        shotKey?: string;
        clips?: unknown[];
      };
      if (parsed.schemaVersion === 'mediaos.director-shot-draft.v1') {
        const result = await importDirectorShot10Draft(parsed as DirectorShot10DraftPayload);
        setShot10Draft(await loadDirectorShot10Draft());
        setImportMessage(result.message + ' Review three HEAR/SEE blocks below, then prepare Studio voices.');
      } else if (parsed.schemaVersion === 'mediaos.director-voice-pack.v1') {
        const result = await importDirectorVoicePack(parsed as DirectorVoicePackPayload);
        setImportMessage(result.message + ' Navigate to Voice Agent → SHOT 07; SHOT 08 and SHOT 09 are also ready.');
      } else if (parsed.schemaVersion === 'mediaos.shot06-director-voice.v1') {
        const response = await fetch('/api/v1/voice-clips/shot06/director-voice-import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed)
        });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error((body as { detail?: string; message?: string }).detail ||
            (body as { message?: string }).message || 'SHOT 06 Director voice import failed.');
        }
        const imported = await response.json() as {message: string;voiceClips: number};
        setVoiceClips(await loadVoiceClips(state.revision));
        setImportMessage(imported.message + ' Open Voice Agent → SHOT 06 to record the seven clips.');
      } else {
        const result = await importProductionContract(parsed as ProductionContractPayload);
        setContract(await loadProductionContract());
        setImportMessage(result.message + ' ' + result.timelineSegments + '/' + artifact.timeline.length + ' timeline blocks are now active.');
      }
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

      <section className="contract-import-card">
        <div>
          <span>EP001 · SHOT 10 · 72-SECOND DIRECTOR REVIEW</span>
          <strong>Short Session Creation HEAR/SEE — independent of the legacy LOCKED Script</strong>
          <p>
            Import the mediaos.director-shot-draft.v1 JSON using the contract import control below.
            The draft preserves SHOT 01–09 and does not overwrite the historical long SHOT 10,
            any generated voice, or the locked cumulative video.
          </p>
          {shot10Draft?.ready && shot10Draft.payload && (
            <div>
              <p><strong>Imported draft:</strong> {shot10Draft.payload.shotTitle} · {shot10Draft.payload.durationSeconds}s · {shot10Draft.payload.timeline.length} voice clips · DIRECTOR REVIEW / NOT LOCKED</p>
              {shot10Draft.payload.timeline.map(segment => (
                <div key={segment.clipKey} style={{ marginTop: '12px' }}>
                  <strong>{segment.clipKey} · {clock(segment.startSecond)}–{clock(segment.endSecond)}</strong>
                  <p><b>HEAR:</b> {segment.hear}</p>
                  <p><b>VOICE:</b> {segment.voiceDirection}</p>
                  <p><b>SEE:</b> {segment.visual.summary}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        {shot10Draft?.ready && (
          <div className="contract-import-actions">
            {shot10Draft.studioPrepared ? (
              <button type="button" onClick={() => { window.location.hash = '#/studio'; }}>
                Open SHOT 10 Studio · Voice Review
              </button>
            ) : (
              <button type="button" disabled={preparingShot10} onClick={() => void prepareShot10Studio()}>
                {preparingShot10 ? <LoaderCircle className="spin" size={15} /> : <Mic2 size={15} />}
                {preparingShot10 ? 'Preparing voices…' : 'Prepare 3 Studio Voice Clips'}
              </button>
            )}
          </div>
        )}
      </section>

      <section className="production-summary">
        <div><span>WORKING TIMELINE</span><strong>{clock(artifact.targetDurationSeconds)}</strong></div>
        <div><span>CONTRACT</span><strong>{contract?.ready ? (contract.payload?.timeline.length || 0) + '/' + artifact.timeline.length + ' HEAR + SEE blocks' : 'Narration only'}</strong></div>
        <div><span>NEXT</span><strong>Voice Agent</strong></div>
      </section>

      <section className="contract-import-card">
        <div>
          <span>DIRECTOR-APPROVED SCRIPT AMENDMENT · SHOT 05</span>
          <strong>First import file 01 — the full approved script revision. SHOT 01–04 voice and video locks remain untouched.</strong>
          <p>This creates an immutable amendment under the existing Script revision. The canonical LOCKED source is never overwritten. Once accepted, import file 02 using Production Contract below.</p>
        </div>
        <input ref={amendmentRef} type="file" accept=".json,application/json" hidden
          onChange={event => void importDirectorAmendment(event.target.files?.[0])} />
        <div className="contract-import-actions">
          <button type="button" disabled={amending || Boolean((artifact as ScriptArtifact & {directorAmendment?: string}).directorAmendment)} onClick={() => amendmentRef.current?.click()}>
            {amending ? <LoaderCircle className="spin" size={15} /> : <Upload size={15} />}
            {(artifact as ScriptArtifact & {directorAmendment?: string}).directorAmendment ? "SHOT 05 Amendment Active" : "Import Director Revision · File 01"}
          </button>
        </div>
      </section>

      <section className="contract-import-card">
        <div>
          <span>PRODUCTION CONTRACT / DIRECTOR VOICE IMPORTS (SHOT 06–09)</span>
          <strong>{contract?.ready ? 'Validated HEAR / SEE blocks are active. Add the next shot contract to merge it into the current timeline.' : 'Import the first HEAR / SEE shot contract created in ChatGPT.'}</strong>
          <p>
            Import standard HEAR / SEE contracts, SHOT 06 Director voice JSON, or the new SHOT 07–09 explained voice pack.
            Director voice imports write only the designated Voice Agent clips and do not replace the original LOCKED Script
            or any earlier Director-LOCKED shots. Existing HEAR / SEE contracts remain available.
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
            {contract?.ready ? 'Import Contract / Director Voice Pack JSON' : 'Import Shot Contract / Voice Pack JSON'}
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
                    <div className="timeline-hear locked-script-copy">
                      {(() => {
                        const clip = segment?.clipKey ? voiceClipByKey.get(segment.clipKey) : undefined;
                        const effectiveNarration = clip?.narration || segment?.hear || item.narration;
                        const clipKey = segment?.clipKey || '';
                        const isEditing = Boolean(clipKey) && editingClipKey === clipKey;
                        const draft = clipKey ? (draftByClip[clipKey] ?? effectiveNarration) : effectiveNarration;
                        const canEdit = Boolean(segment?.clipKey) && !clip?.approved;
                        const saving = Boolean(clipKey) && savingClipKey === clipKey;
                        return (
                          <>
                            <div className="locked-hear-head">
                              <div>
                                <h3>WHAT YOU HEAR</h3>
                                <span className="locked-hear-badge"><LockKeyhole size={11} /> LOCKED SCRIPT</span>
                                {clip?.narrationOverridden && <span className="director-edit-badge">DIRECTOR EDIT</span>}
                              </div>
                              {segment?.clipKey && (
                                clip?.approved
                                  ? <span className="voice-locked-badge">VOICE LOCKED</span>
                                  : !isEditing && (
                                    <button
                                      type="button"
                                      className="edit-hear-button"
                                      disabled={Boolean(savingClipKey)}
                                      onClick={() => beginNarrationEdit(segment.clipKey, effectiveNarration)}
                                    >
                                      <PencilLine size={13} /> Edit words
                                    </button>
                                  )
                              )}
                            </div>

                            {isEditing && segment ? (
                              <div className="hear-editor">
                                <textarea
                                  autoFocus
                                  value={draft}
                                  onChange={event => setDraftByClip(current => ({
                                    ...current,
                                    [segment.clipKey]: event.target.value
                                  }))}
                                  rows={Math.max(4, Math.min(12, Math.ceil(draft.length / 68)))}
                                />
                                <div className="hear-editor-actions">
                                  <small>Save updates this clip's downstream narration and opens it directly in Voice Generation.</small>
                                  <div>
                                    <button
                                      type="button"
                                      disabled={saving}
                                      onClick={() => setEditingClipKey('')}
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      className="primary"
                                      disabled={saving || !draft.trim()}
                                      onClick={() => void saveNarrationAndOpenVoice(segment, draft)}
                                    >
                                      {saving ? <LoaderCircle className="spin" size={14} /> : <Save size={14} />}
                                      {saving ? 'Saving…' : 'Save → Voice'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <p className="locked-hear-text">{effectiveNarration}</p>
                            )}

                            {!segment?.clipKey && (
                              <small className="hear-edit-unavailable">Import this shot's production contract before routing narration edits to Voice.</small>
                            )}
                            <div className="script-voice-direction">
                              <strong>VOICE / INTONATION</strong>
                              <p>{segment?.voiceDirection || item.voiceDirection}</p>
                            </div>
                          </>
                        );
                      })()}
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
