import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, ClipboardCheck, FileJson2, RefreshCw, ShieldAlert, ShieldCheck, UploadCloud, XCircle } from 'lucide-react';
import { productionMemoryImportApi, type ImportBatch, type ImportBatchSummary, type ImportCandidate } from '../api/productionMemoryImportApi';
import '../styles/episodeDirectorHub.css';
import '../styles/productionMemoryImport.css';

type Incoming = {
  schema: string;
  status: string;
  records: Array<{ candidateId: string; targetEpisode: string; scope: string; proposedRule: string }>;
};

export function ProductionMemoryImportPage() {
  const [raw, setRaw] = useState('');
  const [incoming, setIncoming] = useState<Incoming | null>(null);
  const [batches, setBatches] = useState<ImportBatchSummary[]>([]);
  const [batch, setBatch] = useState<ImportBatch | null>(null);
  const [writesEnabled, setWritesEnabled] = useState(false);
  const [directorCapability, setDirectorCapability] = useState('');
  const [reviewer, setReviewer] = useState('');
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [compared, setCompared] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const refresh = useCallback(async () => {
    try {
      const result = await productionMemoryImportApi.list();
      setBatches(result.batches);
      setWritesEnabled(result.writesEnabled);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function openBatch(id: string) {
    setBusy(true);
    setError('');
    try {
      const data = await productionMemoryImportApi.batch(id);
      setBatch(data);
      setExpanded(null);
      setCompared({});
      setReviewNotes({});
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally { setBusy(false); }
  }

  async function pickFile(file?: File) {
    setError('');
    setIncoming(null);
    setRaw('');
    if (!file) return;
    if (file.size > 500_000) { setError('Import JSON must be smaller than 500 KB.'); return; }
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Incoming;
      if (parsed.schema !== 'architectural-thinking.production-memory-staging.v1'
        || parsed.status !== 'REVIEW_ONLY_NOT_IMPORT_COMPATIBLE'
        || !Array.isArray(parsed.records)) {
        throw new Error('This is not a supported Director Review staging JSON.');
      }
      setRaw(text);
      setIncoming(parsed);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not read import JSON.');
    }
  }

  async function stage() {
    if (!raw || !directorCapability || !writesEnabled || busy) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const outcome = await productionMemoryImportApi.stage(raw, directorCapability);
      await refresh();
      await openBatch(outcome.batchId);
      setMessage(outcome.alreadyImported
        ? 'This exact staging file already exists. Loaded its earlier review decisions.'
        : 'Candidates staged successfully. Nothing was activated. Review every rule individually.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally { setBusy(false); }
  }

  async function review(candidate: ImportCandidate, action: 'ACTIVATE' | 'MARK_EXISTING' | 'REJECT') {
    if (!batch || busy || !compared[candidate.id] || !directorCapability || reviewer.trim().length < 3) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await productionMemoryImportApi.review(batch.batchId, candidate.candidateKey,
        action, reviewNotes[candidate.id] || '', reviewer, candidate.comparison.fingerprint,
        directorCapability);
      const updated = await productionMemoryImportApi.batch(batch.batchId);
      setBatch(updated);
      await refresh();
      setExpanded(null);
      setMessage(candidate.candidateKey + ': Director decision recorded. ' +
        (action === 'ACTIVATE' ? 'Rule activated in its selected scope.' : 'No new rule activated.'));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally { setBusy(false); }
  }

  const totals = useMemo(() => ({
    pending: batch?.candidates.filter(c => c.status === 'PENDING').length || 0,
    active: batch?.candidates.filter(c => c.status === 'ACTIVATED').length || 0
  }), [batch]);

  return (
    <main className="media-os-page episode-hub memory-import">
      <header className="episode-hub-header">
        <div>
          <button type="button" className="episode-hub-back" onClick={() => { window.location.hash = '#/episodes'; }}>
            <ArrowLeft size={15} /> Episodes
          </button>
          <span>MEDIAOS / PRODUCTION MEMORY</span>
          <h1>Import & Director Review</h1>
          <p>Bring existing Production Bible rules and approved corrections into MediaOS without changing production memory until you explicitly approve each rule.</p>
        </div>
        <button type="button" className="episode-hub-secondary" disabled={busy} onClick={() => void refresh()}>
          <RefreshCw size={16} /> Refresh
        </button>
      </header>

      {error && <p role="alert" className="episode-hub-error">{error}</p>}
      {message && <p role="status" className="shot-revision-notice">{message}</p>}
      <section className="memory-import-panel">
        <h2><FileJson2 size={19} /> Step 1 — Select a staging JSON</h2>
        <p>Import only a REVIEW_ONLY staging package. MediaOS does not activate any rule during staging.</p>
        <input type="file" accept=".json,application/json" aria-label="Choose reviewed Production Memory staging JSON"
          onChange={event => void pickFile(event.target.files?.[0])} />
        {incoming && (
          <div className="memory-import-preview">
            <strong>{incoming.records.length} proposed rules</strong>
            <span>{incoming.records.filter(r => r.targetEpisode === 'GLOBAL').length} Global · {incoming.records.filter(r => r.targetEpisode !== 'GLOBAL').length} Episode-specific</span>
            <p>{incoming.records.slice(0, 2).map(r => r.candidateId + ': ' + r.proposedRule).join(' | ')}</p>
          </div>
        )}
        <div className="memory-import-credentials">
          <label>Director reviewer
            <input value={reviewer} maxLength={120} placeholder="Reviewer name or verified identity"
              onChange={e => setReviewer(e.target.value)} />
          </label>
          <label>Director review capability
            <input type="password" autoComplete="off" value={directorCapability}
              placeholder="Ephemeral capability; never saved in browser storage"
              onChange={e => setDirectorCapability(e.target.value)} />
          </label>
        </div>
        <button type="button" className="memory-import-primary"
          disabled={!incoming || !writesEnabled || !directorCapability || busy}
          onClick={() => void stage()}><UploadCloud size={17}/> Stage Candidates — No Activation</button>
        {!writesEnabled && <p className="memory-import-warning">
          <ShieldAlert size={16}/> Staging/approval is disabled on this MediaOS environment. Review the JSON locally, or wait for the Director authorization and rollout gate.
        </p>}
      </section>

      <section className="memory-import-panel">
        <h2>Step 2 — Existing review batches</h2>
        {batches.length === 0 && <p>No import batches registered.</p>}
        <div className="memory-import-batches">
          {batches.map(item => (
            <button type="button" key={item.id} disabled={busy}
              className={batch?.batchId === item.id ? 'memory-import-batch active' : 'memory-import-batch'}
              onClick={() => void openBatch(item.id)}>
              <strong>{item.sourceLabel}</strong>
              <span>{item.candidateCount} candidates · {item.pending} pending · {item.activated} activated</span>
            </button>
          ))}
        </div>
      </section>

      {batch && <section className="memory-import-panel">
        <div className="memory-import-heading">
          <h2><ClipboardCheck size={19} /> Step 3 — Compare & decide each rule</h2>
          <span>{totals.pending} PENDING · {totals.active} ACTIVE</span>
        </div>
        <p>Source hashes in an uploaded JSON are declarations, not server-side proof of original file bytes. Verify the actual source before approving. Overlap detection is lexical only; it cannot establish semantic agreement.</p>
        <div className="memory-import-candidates">
          {batch.candidates.map(candidate => {
            const isOpen = expanded === candidate.id;
            const ready = !busy && writesEnabled && candidate.status === 'PENDING'
              && !!compared[candidate.id] && !!directorCapability
              && reviewer.trim().length >= 3 && (reviewNotes[candidate.id] || '').trim().length >= 15;
            return (
              <article className="memory-import-candidate" key={candidate.id}>
                <button type="button" className="memory-import-candidate-toggle"
                  onClick={() => setExpanded(isOpen ? null : candidate.id)}>
                  <span><strong>{candidate.candidateKey}</strong>
                    <small>{candidate.targetEpisode} · {candidate.scope} · {candidate.ruleType}</small></span>
                  <span className={'episode-hub-status ' + (candidate.status === 'ACTIVATED' || candidate.status === 'EXISTING' ? 'locked' : 'pending')}>
                    {candidate.status}
                  </span>
                </button>
                <p>{candidate.proposedRule}</p>
                {isOpen && <div className="memory-import-detail">
                  <p><strong>Source:</strong> {candidate.sourceFile}, line {candidate.sourceLine}</p>
                  <p><strong>Exact excerpt:</strong> {candidate.sourceExcerpt}</p>
                  <p><strong>Declared SHA-256:</strong> <code>{candidate.declaredSourceSha256}</code></p>
                  <p><strong>Source validation:</strong> {candidate.sourceVerification} — original source bytes must be checked separately.</p>
                  {candidate.comparison.exactDuplicateRuleId && <p className="memory-import-warning">
                    <CheckCircle2 size={15}/> Exact active duplicate: {candidate.comparison.exactDuplicateRuleId}. Use Mark Existing.
                  </p>}
                  {!candidate.comparison.episodeRegistered && <p className="memory-import-warning">
                    Target episode {candidate.targetEpisode} is not registered in MediaOS. This rule can be staged but cannot be activated yet.
                  </p>}
                  <strong>Existing rule comparison</strong>
                  {candidate.comparison.potentialOverlaps.length === 0 && <p>No strong lexical overlaps found. This does not prove there are no semantic conflicts.</p>}
                  {candidate.comparison.potentialOverlaps.map(other => (
                    <div className="memory-import-overlap" key={other.ruleId}>
                      <small>{other.scope} · {Math.round(other.similarity * 100)}% word overlap</small>
                      <p>{other.content}</p>
                    </div>
                  ))}
                  {candidate.status === 'PENDING' && <>
                    <label className="memory-import-compared">
                      <input type="checkbox" checked={!!compared[candidate.id]}
                        onChange={e => setCompared(previous => ({ ...previous, [candidate.id]: e.target.checked }))}/>
                      I compared this proposal with current Production Memory and verified its source and scope.
                    </label>
                    <textarea rows={3} maxLength={2000}
                      placeholder="Director review note: why this rule is global or episode-only, and whether it conflicts with existing policy."
                      value={reviewNotes[candidate.id] || ''}
                      onChange={e => setReviewNotes(previous => ({ ...previous, [candidate.id]: e.target.value }))} />
                    <div className="memory-import-actions">
                      <button type="button" disabled={!ready || !!candidate.comparison.exactDuplicateRuleId || !candidate.comparison.episodeRegistered}
                        onClick={() => void review(candidate,'ACTIVATE')}><ShieldCheck size={15}/> Activate in {candidate.targetEpisode}</button>
                      <button type="button" disabled={!ready || !candidate.comparison.exactDuplicateRuleId}
                        onClick={() => void review(candidate,'MARK_EXISTING')}><CheckCircle2 size={15}/> Mark Existing</button>
                      <button type="button" disabled={!ready}
                        onClick={() => void review(candidate,'REJECT')}><XCircle size={15}/> Reject</button>
                    </div>
                  </>}
                </div>}
              </article>
            );
          })}
        </div>
      </section>}
    </main>
  );
}
