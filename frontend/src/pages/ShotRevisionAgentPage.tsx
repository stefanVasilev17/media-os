import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Bot, CheckCircle2, CircleDot, LoaderCircle, Lock, MessageSquare, Mic2, Clapperboard, RefreshCw, Save } from 'lucide-react';
import { episodeDirectorRoute } from '../api/episodeDirectorApi';
import { shotRevisionApi, type AiPreview, type ShotRevisionState } from '../api/shotRevisionApi';
import '../styles/episodeDirectorHub.css';
import '../styles/shotRevisionAgent.css';

export function ShotRevisionAgentPage({ episodeId, shotKey }: { episodeId: string; shotKey: string }) {
  const [state, setState] = useState<ShotRevisionState | null>(null);
  const [aiOn, setAiOn] = useState(false);
  const [message, setMessage] = useState('');
  const [narration, setNarration] = useState('');
  const [voice, setVoice] = useState('');
  const [visual, setVisual] = useState('');
  const [changeSummary, setChangeSummary] = useState('');
  const [lockNote, setLockNote] = useState('');
  const [preview, setPreview] = useState<AiPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const apply = useCallback((next: ShotRevisionState) => {
    setState(next);
    const source = next.draft || next.approved;
    setNarration(source?.narration ?? next.originalNarration);
    setVoice(source?.voiceDirection || 'calm, conversational, confident');
    setVisual(source?.visualDirection || '');
    setChangeSummary(source?.changeSummary || '');
    setPreview(null);
  }, []);

  const refresh = useCallback(async () => {
    try {
      setError('');
      apply(await shotRevisionApi.state(episodeId, shotKey));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load Shot Revision Agent.');
    } finally {
      setLoading(false);
    }
  }, [episodeId, shotKey, apply]);

  useEffect(() => { setLoading(true); setAiOn(false); void refresh(); }, [refresh]);

  const revision = state?.draft?.revision ?? state?.approved?.revision ?? 0;
  const canEdit = Boolean(state?.writesEnabled) && !busy;

  async function perform(action: () => Promise<ShotRevisionState>, success: string) {
    if (busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      apply(await action());
      setNotice(success);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  }

  const draftDirty = Boolean(state?.draft) && (
    narration !== state!.draft!.narration ||
    voice !== (state!.draft!.voiceDirection || 'calm, conversational, confident') ||
    visual !== (state!.draft!.visualDirection || '') ||
    changeSummary !== (state!.draft!.changeSummary || '')
  );

  async function approveAndOpenVoice() {
    if (!state?.draft || busy || draftDirty || !state.qualityReport.passed) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const note = 'Director approved revised script and production handoff from Revision Chat for ' + shotKey + '.';
      await shotRevisionApi.lock(episodeId, shotKey, state.draft.revision, note);
      window.location.hash = '#/episodes/' + encodeURIComponent(episodeId)
        + '/voice?shot=' + encodeURIComponent(shotKey);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  }

  async function previewAi() {
    if (!state || !aiOn || !message.trim() || busy) return;
    setBusy(true);
    setPreview(null);
    setError('');
    setNotice('');
    try {
      const result = await shotRevisionApi.preview(episodeId, shotKey, revision, message.trim());
      setPreview(result);
      setNotice('Zero-token preview approved. The next action sends one paid OpenAI request.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally { setBusy(false); }
  }

  async function generateAi() {
    if (!preview || !state || !aiOn || busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await shotRevisionApi.generate(
        episodeId, shotKey, revision, message.trim(), preview.authorizationToken);
      apply(result);
      setMessage('');
      setNotice('AI prepared a new DRAFT. Review the narration, voice direction and visual plan before locking.');
    } catch (cause) {
      setPreview(null);
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally { setBusy(false); }
  }

  return (
    <main className="media-os-page episode-hub shot-revision">
      <header className="episode-hub-header">
        <div>
          <button className="episode-hub-back" type="button"
            onClick={() => { window.location.hash = episodeDirectorRoute(episodeId); }}>
            <ArrowLeft size={15} /> Director Overview
          </button>
          <span>SHOT REVISION AGENT / {shotKey}</span>
          <h1>{state?.title || 'Shot Revision Agent'}</h1>
          <p>Discuss corrections → review complete narration and visual direction → Director LOCK → handoff to Voice and Video.</p>
        </div>
        <button type="button" className="episode-hub-secondary" onClick={() => void refresh()} disabled={busy}>
          <RefreshCw size={16} /> Refresh
        </button>
      </header>
      {error && <p role="alert" className="episode-hub-error">{error}</p>}
      {notice && <p className="shot-revision-notice" role="status">{notice}</p>}
      {loading && <p><LoaderCircle className="spin" size={18} /> Loading shot…</p>}
      {state && (
        <>
          <section className="episode-hub-stats">
            <div><span>Episode</span><strong>{episodeId === '22222222-2222-2222-2222-222222222222' ? 'EP001' : 'Selected episode'}</strong></div>
            <div><span>Current draft</span><strong>{state.draft ? 'v' + state.draft.revision : 'None'}</strong></div>
            <div><span>Active Director revision</span>
              <strong>{state.approved ? 'v' + state.approved.revision + ' LOCKED' : 'Original Script'}</strong>
            </div>
          </section>
          <div className="shot-revision-layout">
            <section className="shot-revision-panel">
              <div className="shot-revision-heading">
                <h2><MessageSquare size={18} /> Revision Chat</h2>
                <label className="shot-revision-switch">
                  <input type="checkbox" checked={aiOn} disabled={!canEdit}
                    onChange={event => { setAiOn(event.target.checked); setPreview(null); }} />
                  <span>AI {aiOn ? 'ON' : 'OFF'}</span>
                </label>
              </div>
              <p className="shot-revision-explain">
                {aiOn
                  ? 'Uses the configured OpenAI API, not this live ChatGPT conversation. Each paid request needs a fresh preview and confirmation.'
                  : 'Manual notes only. No OpenAI requests or AI charges.'}
              </p>
              <div className="shot-revision-messages" aria-live="polite">
                {state.messages.length === 0 && <p className="shot-revision-placeholder">
                  Describe the change you want: timing, wording, tone, system behavior or Remotion visuals.
                </p>}
                {state.messages.map((entry, index) => (
                  <div key={entry.createdAt + index} className={'shot-revision-message ' + entry.sender.toLowerCase()}>
                    <span>{entry.sender === 'USER' ? 'Director' : entry.sender === 'AGENT' ? 'OpenAI' : 'MediaOS'}</span>
                    <p>{entry.content}</p>
                    {entry.sender === 'AGENT' && index === state.messages.length - 1 && state.draft && (
                      <div className="shot-revision-chat-approval">
                        <p>Review this proposed English narration. Approving it makes the saved DRAFT the active
                          shot revision and opens the exact Voice screen. It does not generate audio.</p>
                        <button type="button" disabled={!canEdit || draftDirty || !state.qualityReport.passed}
                          onClick={() => void approveAndOpenVoice()}>
                          <CheckCircle2 size={16} /> Approve → Open Voice
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <label className="shot-revision-label" htmlFor="shot-revision-message">Your correction</label>
              <textarea id="shot-revision-message" rows={4} maxLength={6000}
                placeholder="Example: Keep the narration, but make the camera hold for 2 more seconds over the database queue."
                value={message} onChange={event => { setMessage(event.target.value); setPreview(null); }} />
              <div className="shot-revision-actions">
                {!aiOn ? (
                  <button type="button" disabled={!canEdit || !message.trim()}
                    onClick={() => void perform(async () => {
                      const updated = await shotRevisionApi.note(episodeId, shotKey, message.trim());
                      setMessage('');
                      return updated;
                    }, 'Manual note saved. Edit the draft fields to prepare the correction.')}>
                    Save note (AI OFF)
                  </button>
                ) : (
                  <>
                    <button type="button" disabled={!canEdit || !message.trim() || !state.paidAiEnabled || !state.aiConfigured}
                      onClick={() => void previewAi()}>Preview AI request</button>
                    <button type="button" disabled={!canEdit || !preview || !aiOn}
                      onClick={() => void generateAi()}><Bot size={15} /> Confirm paid AI request</button>
                  </>
                )}
              </div>
              {aiOn && (!state.paidAiEnabled || !state.aiConfigured) && (
                <p className="shot-revision-explain">OpenAI API or MediaOS Paid AI is currently disabled. Manual revision remains available when episode writes are enabled.</p>
              )}
              {preview && <p className="shot-revision-explain">Model: {preview.model}. Up to {preview.estimatedMaxOutputTokens} output tokens; token expires at {preview.authorizationExpiresAt}. No generation has started.</p>}
            </section>
            <section className="shot-revision-panel">
              <div className="shot-revision-heading"><h2>Director Review</h2>
                {state.draft
                  ? <span className="episode-hub-status pending"><CircleDot size={14} /> DRAFT v{state.draft.revision}</span>
                  : state.approved
                    ? <span className="episode-hub-status locked"><CheckCircle2 size={14} /> LOCKED</span>
                    : <span className="episode-hub-status pending">NO REVISION</span>}
              </div>
              <div className="shot-revision-quality" role="status">
                <strong>Regression Quality Gate</strong>
                <span className={'episode-hub-status ' + (
                  state.qualityReport.passed && state.qualityReport.assertionCount > 0 ? 'locked' : 'pending')}>
                  {state.qualityReport.assertionCount === 0
                    ? 'NO EXECUTABLE TESTS'
                    : state.qualityReport.passed ? 'CHECKS PASSED' : 'BLOCKED'}
                </span>
                <p>{state.qualityReport.assertionCount} relevant deterministic assertion(s).
                  {state.qualityReport.assertionCount === 0
                    ? ' The system cannot prove that old mistakes are prevented until Director-approved regression rules are registered.'
                    : state.qualityReport.passed
                      ? ' Automated checks passed. Editorial and technical meaning still need Director review.'
                      : ' Existing or newly approved rules reject this saved candidate.'}
                </p>
                {!state.qualityReport.passed && state.qualityReport.violations.map(issue => (
                  <p key={issue.assertionId} className="episode-hub-error">
                    {issue.target}: {issue.predicate} — “{issue.literalValue}”
                    (Production Memory {issue.memoryRuleId})
                  </p>
                ))}
              </div>
              <p className="shot-revision-explain">The original locked Script stays intact. You are editing a new shot revision.</p>
              <label className="shot-revision-label" htmlFor="shot-revision-narration">Full English narration</label>
              <textarea id="shot-revision-narration" rows={13} value={narration}
                disabled={!canEdit} onChange={event => setNarration(event.target.value)} />
              <label className="shot-revision-label" htmlFor="shot-revision-voice">Voice direction</label>
              <textarea id="shot-revision-voice" rows={3} value={voice}
                disabled={!canEdit} onChange={event => setVoice(event.target.value)} />
              <label className="shot-revision-label" htmlFor="shot-revision-visual">Video / Remotion direction</label>
              <textarea id="shot-revision-visual" rows={6} value={visual}
                disabled={!canEdit} onChange={event => setVisual(event.target.value)}
                placeholder="Explain camera focus, objects, packets, timing and the visual consequence." />
              <label className="shot-revision-label" htmlFor="shot-revision-summary">Revision summary</label>
              <input id="shot-revision-summary" value={changeSummary}
                disabled={!canEdit} onChange={event => setChangeSummary(event.target.value)} />
              <div className="shot-revision-actions">
                <button type="button" disabled={!canEdit || !narration.trim()}
                  onClick={() => void perform(() => shotRevisionApi.draft(episodeId, shotKey, {
                    expectedRevision: revision, narration, voiceDirection: voice,
                    visualDirection: visual, changeSummary
                  }), 'New reviewable DRAFT saved. Voice and Video remain unchanged until Director LOCK.')}>
                  <Save size={15} /> Save revision DRAFT
                </button>
              </div>
              <hr className="shot-revision-divider" />
              {state.draft && <button type="button" className="shot-revision-lock"
                disabled={!canEdit || draftDirty}
                onClick={() => void approveAndOpenVoice()}>
                <CheckCircle2 size={16} /> Approve → Open Voice
              </button>}
              {state.draft && draftDirty && <p className="shot-revision-explain">
                Save your editor changes as a new DRAFT before approval. Unsaved edits are never published.
              </p>}
              <label className="shot-revision-label" htmlFor="shot-revision-lock-note">Optional detailed Director LOCK note</label>
              <textarea id="shot-revision-lock-note" rows={3} value={lockNote}
                disabled={!canEdit || !state.draft} onChange={event => setLockNote(event.target.value)}
                placeholder="I approve this narration and the matching Voice/Visual plan." />
              <button type="button" className="shot-revision-lock" disabled={!canEdit || !state.draft || lockNote.trim().length < 10}
                onClick={() => void perform(async () => {
                  const updated = await shotRevisionApi.lock(episodeId, shotKey, state.draft!.revision, lockNote);
                  setLockNote('');
                  return updated;
                }, 'Director LOCK saved. New narration and visual direction are now the active shot handoff. Voice and Video require new review.')}>
                <Lock size={16} /> Director LOCK this shot revision
              </button>
              {state.approved && (
                <div className="shot-revision-handoff">
                  <p><CheckCircle2 size={16} /> Latest approved revision: v{state.approved.revision}</p>
                  <p>Existing approved audio/video was NOT deleted. A revised recording and visual render require new review and approval.</p>
                  <div>
                    <button type="button" onClick={() => { window.location.hash = '#/episodes/' + episodeId + '/voice?shot=' + encodeURIComponent(shotKey); }}>
                      <Mic2 size={15} /> Open updated Voice
                    </button>
                    <button type="button" onClick={() => { window.location.hash = '#/episodes/' + episodeId + '/video?shot=' + encodeURIComponent(shotKey); }}>
                      <Clapperboard size={15} /> Open updated Video
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </main>
  );
}
