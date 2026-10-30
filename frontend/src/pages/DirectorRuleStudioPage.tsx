import { useEffect, useState } from 'react';
import { ArrowLeft, Check, ChevronDown } from 'lucide-react';
import { listEpisodeWorkspaces, type EpisodeSummary } from '../api/episodeWorkspaceApi';
import { directorRuleStudioApi, type RulePreview, type RuleRequest, type RuleScope, type StudioProposal } from '../api/directorRuleStudioApi';
import '../styles/episodeDirectorHub.css';
import '../styles/directorRuleStudio.css';

const scopes: Array<{ value: RuleScope; label: string }> = [
  { value: 'VOICE_VISUAL', label: 'Voice + Video' },
  { value: 'VOICE', label: 'Voice' },
  { value: 'VISUAL', label: 'Video' },
  { value: 'SCRIPT', label: 'Script' },
  { value: 'ALL', label: 'All agents' }
];

export function DirectorRuleStudioPage() {
  const [episodes, setEpisodes] = useState<EpisodeSummary[]>([]);
  const [history, setHistory] = useState<StudioProposal[]>([]);
  const [target, setTarget] = useState('');
  const [scope, setScope] = useState<RuleScope>('VOICE_VISUAL');
  const [message, setMessage] = useState('');
  const [manualRule, setManualRule] = useState('');
  const [aiOn, setAiOn] = useState(true);
  const [preview, setPreview] = useState<RulePreview | null>(null);
  const [proposal, setProposal] = useState<StudioProposal | null>(null);
  const [parent, setParent] = useState<StudioProposal | null>(null);
  const [director, setDirector] = useState('');
  const [reviewer, setReviewer] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [compared, setCompared] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewDecision, setReviewDecision] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [paidAiEnabled, setPaidAiEnabled] = useState(false);
  const [aiConfigured, setAiConfigured] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function refresh() {
    try {
      const [home, availableEpisodes] = await Promise.all([
        directorRuleStudioApi.home(), listEpisodeWorkspaces()
      ]);
      setHistory(home.proposals);
      setEpisodes(availableEpisodes);
      setEnabled(home.writesEnabled);
      setPaidAiEnabled(home.paidAiEnabled);
      setAiConfigured(home.aiConfigured);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  }

  useEffect(() => { void refresh(); }, []);

  function request(): RuleRequest {
    return {
      episodeId: target || null,
      scope,
      parentProposalId: parent?.id || null,
      message: message.trim()
    };
  }

  function invalidate() {
    setPreview(null);
    setError('');
    setNotice('');
  }

  function requireAccess(): boolean {
    if (director.trim()) return true;
    setAccessOpen(true);
    setError('Director access is required.');
    return false;
  }

  async function action<T>(work: () => Promise<T>, update: (value: T) => void) {
    if (busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      update(await work());
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  }

  function refine(item: StudioProposal) {
    if (item.status !== 'DRAFT') return;
    setTarget(item.episodeId || '');
    setScope(item.scope);
    setParent(item);
    setProposal(null);
    setPreview(null);
    setReviewOpen(false);
    setManualRule(item.proposedRule);
    setMessage('');
    setError('');
  }

  function startReview(decision: 'APPROVE' | 'REJECT') {
    if (!requireAccess()) return;
    setReviewDecision(decision);
    setReviewOpen(true);
    setError('');
  }

  const hasMessage = message.trim().length >= 5;
  const paidAvailable = enabled && paidAiEnabled && aiConfigured;
  const hasDuplicate = !!proposal?.comparison?.exactDuplicateRuleId;
  const canSubmitReview = enabled && !!proposal?.comparison?.fingerprint
    && reviewer.trim().length >= 3 && reviewNote.trim().length >= 15
    && compared && !busy && (reviewDecision === 'REJECT' || !hasDuplicate);

  return (
    <main className="media-os-page episode-hub rule-studio">
      <div className="rule-studio-topbar">
        <button type="button" className="rule-studio-text-action"
          onClick={() => { window.location.hash = '#/episodes'; }}>
          <ArrowLeft size={18} /> Episodes
        </button>
        <div className="rule-studio-top-actions">
          <button type="button" className="rule-studio-text-action"
            aria-expanded={historyOpen} onClick={() => setHistoryOpen(value => !value)}>History</button>
          <button type="button" className="rule-studio-text-action"
            aria-expanded={accessOpen} onClick={() => setAccessOpen(value => !value)}>Access</button>
        </div>
      </div>

      <header className="rule-studio-header">
        <h1>Rule Studio</h1>
      </header>
      {!enabled && <p role="status" className="rule-studio-alert">
        Rule Studio is not enabled in this environment.
      </p>}
      {error && <p role="alert" className="rule-studio-error">{error}</p>}
      {notice && <p role="status" className="rule-studio-success">{notice}</p>}

      {accessOpen && <section className="rule-studio-disclosure" aria-label="Director access">
        <h2>Director access</h2>
        <div className="rule-studio-field">
          <label htmlFor="rule-studio-reviewer">Reviewer</label>
          <input id="rule-studio-reviewer" value={reviewer} maxLength={120}
            onChange={event => setReviewer(event.target.value)} />
        </div>
        <div className="rule-studio-field">
          <label htmlFor="rule-studio-secret">Director authorization</label>
          <input id="rule-studio-secret" type="password" autoComplete="off"
            value={director} onChange={event => setDirector(event.target.value)} />
        </div>
      </section>}

      <section className="rule-studio-workspace" aria-label="Compose production rule">
        <div className="rule-studio-controls">
          <div className="rule-studio-field">
            <label htmlFor="rule-studio-episode">Applies to</label>
            <select id="rule-studio-episode" value={target} disabled={!!parent || busy}
              onChange={event => { setTarget(event.target.value); invalidate(); }}>
              <option value="">All episodes</option>
              {episodes.map(ep => <option key={ep.id} value={ep.id}>
                {ep.episodeNumber} — {ep.title}
              </option>)}
            </select>
          </div>
          <div className="rule-studio-field">
            <label htmlFor="rule-studio-scope">Area</label>
            <select id="rule-studio-scope" value={scope} disabled={!!parent || busy}
              onChange={event => { setScope(event.target.value as RuleScope); invalidate(); }}>
              {scopes.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </div>
          <label className="rule-studio-ai-control">
            <input type="checkbox" checked={aiOn} onChange={event => {
              setAiOn(event.target.checked); invalidate();
            }} />
            AI {aiOn ? 'On' : 'Off'}
          </label>
        </div>

        {parent && <div className="rule-studio-parent">
          <strong>Refining a draft</strong>
          <p>{parent.proposedRule}</p>
          <button type="button" className="rule-studio-text-action"
            onClick={() => { setParent(null); invalidate(); }}>Start new rule</button>
        </div>}

        <label htmlFor="rule-studio-prompt" className="rule-studio-prompt-label">Your rule</label>
        <textarea id="rule-studio-prompt" className="rule-studio-prompt" rows={6}
          maxLength={4000} value={message}
          placeholder="Напиши правилото така, както би ми го обяснил в разговор…"
          onChange={event => { setMessage(event.target.value); invalidate(); }} />

        {!aiOn && <div className="rule-studio-field">
          <label htmlFor="rule-studio-manual">Final wording in English</label>
          <textarea id="rule-studio-manual" rows={4} maxLength={2000}
            value={manualRule} onChange={event => setManualRule(event.target.value)} />
        </div>}

        <div className="rule-studio-primary-row">
          {aiOn ? (
            !preview ? (
              <button type="button" className="rule-studio-primary"
                disabled={busy || !paidAvailable || !hasMessage}
                onClick={() => {
                  if (!requireAccess()) return;
                  void action(() => directorRuleStudioApi.preview(request(), director), setPreview);
                }}>
                Prepare rule
              </button>
            ) : (
              <button type="button" className="rule-studio-primary"
                disabled={busy || !paidAvailable || !hasMessage}
                onClick={() => {
                  if (!requireAccess()) return;
                  void action(() => directorRuleStudioApi.generate(request(), director, preview.authorizationToken),
                    result => {
                      setProposal(result);
                      setPreview(null);
                      setReviewOpen(false);
                      setCompared(false);
                    });
                }}>
                Generate rule (paid)
              </button>
            )
          ) : (
            <button type="button" className="rule-studio-primary"
              disabled={busy || !enabled || !hasMessage || manualRule.trim().length < 15}
              onClick={() => {
                if (!requireAccess()) return;
                void action(() => directorRuleStudioApi.manual({
                  ...request(), ruleEnglish: manualRule.trim()
                }, director), result => {
                  setProposal(result);
                  setReviewOpen(false);
                  setCompared(false);
                });
              }}>Save draft</button>
          )}
          {preview && <button type="button" className="rule-studio-text-action"
            onClick={invalidate}>Cancel</button>}
        </div>
        {aiOn && !paidAvailable && enabled && <p className="rule-studio-alert">
          AI generation is unavailable. You can turn AI Off and write a rule manually.
        </p>}
      </section>

      {proposal && <section className="rule-studio-result" aria-label="Proposed production rule">
        <div className="rule-studio-result-heading">
          <h2>{proposal.status === 'APPROVED' ? 'Active rule' :
            proposal.status === 'REJECTED' ? 'Rejected rule' : 'Proposed rule'}</h2>
          {proposal.status === 'APPROVED' && <Check size={23} className="rule-studio-active-check" />}
        </div>
        <p className="rule-studio-rule-text">{proposal.proposedRule}</p>
        {proposal.explanationBg && <p className="rule-studio-explanation">{proposal.explanationBg}</p>}

        {(proposal.positiveExample || proposal.negativeExample || proposal.comparison?.relatedRules.length) &&
          <details className="rule-studio-more">
            <summary>Review examples and related rules <ChevronDown size={16} /></summary>
            {proposal.positiveExample && <p><strong>Do</strong> — {proposal.positiveExample}</p>}
            {proposal.negativeExample && <p><strong>Avoid</strong> — {proposal.negativeExample}</p>}
            {proposal.comparison?.relatedRules.map(rule =>
              <p key={rule.ruleId}>{rule.content}</p>)}
          </details>}

        {proposal.status === 'DRAFT' && !reviewOpen &&
          <div className="rule-studio-primary-row">
            <button type="button" className="rule-studio-primary" disabled={busy || hasDuplicate}
              onClick={() => startReview('APPROVE')}>Approve</button>
            <button type="button" className="rule-studio-text-action" disabled={busy}
              onClick={() => refine(proposal)}>Improve</button>
            <button type="button" className="rule-studio-text-action" disabled={busy}
              onClick={() => startReview('REJECT')}>Reject</button>
          </div>}

        {hasDuplicate && proposal.status === 'DRAFT' &&
          <p className="rule-studio-alert">An identical rule is already active.</p>}

        {reviewOpen && proposal.status === 'DRAFT' && <div className="rule-studio-review">
          <h3>{reviewDecision === 'APPROVE' ? 'Approve rule' : 'Reject rule'}</h3>
          <label className="rule-studio-checkbox">
            <input type="checkbox" checked={compared}
              onChange={event => setCompared(event.target.checked)} />
            I checked the scope and existing rules.
          </label>
          <div className="rule-studio-field">
            <label htmlFor="rule-studio-note">Director decision</label>
            <textarea id="rule-studio-note" rows={3} maxLength={1500}
              value={reviewNote} onChange={event => setReviewNote(event.target.value)}
              placeholder="Защо взимаш това решение?" />
          </div>
          <div className="rule-studio-primary-row">
            <button type="button" className="rule-studio-primary"
              disabled={!canSubmitReview}
              onClick={() => {
                if (!proposal || !proposal.comparison || !requireAccess()) return;
                void action(() => directorRuleStudioApi.review(
                  proposal.id, reviewDecision, proposal.comparison!.fingerprint,
                  reviewer, reviewNote, director), result => {
                  setProposal(result);
                  setReviewOpen(false);
                  setCompared(false);
                });
              }}>{reviewDecision === 'APPROVE' ? 'Activate rule' : 'Confirm rejection'}</button>
            <button type="button" className="rule-studio-text-action"
              onClick={() => setReviewOpen(false)}>Cancel</button>
          </div>
        </div>}
      </section>}

      {historyOpen && <section className="rule-studio-history" aria-label="Recent rule history">
        <h2>History</h2>
        {history.length === 0 && <p>No saved rules.</p>}
        {history.map(item => (
          <button type="button" key={item.id} disabled={busy}
            onClick={() => void action(
              () => directorRuleStudioApi.proposal(item.id), result => {
                setProposal(result);
                setReviewOpen(false);
                setCompared(false);
              })}>
            <span className="rule-studio-history-text">{item.proposedRule}</span>
            <span className="rule-studio-history-state">
              {item.status === 'APPROVED' ? 'Active' : item.status === 'REJECTED' ? 'Rejected' : 'Draft'}
            </span>
          </button>
        ))}
      </section>}
    </main>
  );
}
