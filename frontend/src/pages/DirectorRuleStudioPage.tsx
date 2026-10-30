import { useEffect, useState } from 'react';
import { ArrowLeft, BookOpenCheck, Bot, CheckCircle2, MessageSquareText, RefreshCw, ShieldCheck, Sparkles, XCircle } from 'lucide-react';
import { listEpisodeWorkspaces, type EpisodeSummary } from '../api/episodeWorkspaceApi';
import { directorRuleStudioApi, type RulePreview, type RuleRequest, type RuleScope, type StudioProposal } from '../api/directorRuleStudioApi';
import '../styles/episodeDirectorHub.css';
import '../styles/directorRuleStudio.css';

const scopeOptions: Array<{ value: RuleScope; label: string }> = [
  { value: 'VOICE_VISUAL', label: 'Voice + Video' },
  { value: 'VOICE', label: 'Voice only' },
  { value: 'VISUAL', label: 'Video / Remotion only' },
  { value: 'SCRIPT', label: 'Script only' },
  { value: 'ALL', label: 'All agents — Global production' }
];

export function DirectorRuleStudioPage() {
  const [episodes, setEpisodes] = useState<EpisodeSummary[]>([]);
  const [history, setHistory] = useState<StudioProposal[]>([]);
  const [target, setTarget] = useState('');
  const [scope, setScope] = useState<RuleScope>('VOICE_VISUAL');
  const [message, setMessage] = useState('');
  const [manualRule, setManualRule] = useState('');
  const [aiOn, setAiOn] = useState(false);
  const [preview, setPreview] = useState<RulePreview | null>(null);
  const [proposal, setProposal] = useState<StudioProposal | null>(null);
  const [parent, setParent] = useState<StudioProposal | null>(null);
  const [director, setDirector] = useState('');
  const [reviewer, setReviewer] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [compared, setCompared] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [paidAiEnabled, setPaidAiEnabled] = useState(false);
  const [aiConfigured, setAiConfigured] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function refresh() {
    try {
      const [home, episodeList] = await Promise.all([
        directorRuleStudioApi.home(), listEpisodeWorkspaces()
      ]);
      setHistory(home.proposals);
      setEnabled(home.writesEnabled);
      setPaidAiEnabled(home.paidAiEnabled);
      setAiConfigured(home.aiConfigured);
      setEpisodes(episodeList);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  }
  useEffect(() => { void refresh(); }, []);

  const request = (): RuleRequest => ({
    episodeId: target || null, scope, parentProposalId: parent?.id || null, message: message.trim()
  });

  function invalidate() {
    setPreview(null);
  }

  async function action<T>(work: () => Promise<T>, update: (value: T) => void, success: string) {
    if (busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await work();
      update(result);
      setNotice(success);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  }

  const readyForPaid = enabled && paidAiEnabled && aiConfigured
    && !!director && message.trim().length >= 5;
  const approveReady = enabled && !!director && reviewer.trim().length >= 3
    && reviewNote.trim().length >= 15 && compared && proposal?.status === 'DRAFT'
    && !!proposal.comparison?.fingerprint;

  function refine(item: StudioProposal) {
    if (item.status !== 'DRAFT') return;
    setTarget(item.episodeId || '');
    setScope(item.scope);
    setParent(item);
    setMessage('');
    setManualRule(item.proposedRule);
    setProposal(null);
    setPreview(null);
    setCompared(false);
    setNotice('Continue the conversation: describe how this rule should be improved.');
  }

  return (
    <main className="media-os-page episode-hub rule-studio">
      <header className="episode-hub-header">
        <div>
          <button type="button" className="episode-hub-back"
            onClick={() => { window.location.hash = '#/episodes'; }}>
            <ArrowLeft size={15} /> All episodes
          </button>
          <span>MEDIAOS / PRODUCTION MEMORY / DIRECTOR</span>
          <h1>Rule Studio</h1>
          <p>Write a production rule in your own words. OpenAI formulates a clear version,
            then you approve whether it becomes an instruction in future Voice, Video or Script work.</p>
        </div>
        <button type="button" className="episode-hub-secondary" disabled={busy}
          onClick={() => void refresh()}><RefreshCw size={16} /> Refresh</button>
      </header>

      {error && <p role="alert" className="episode-hub-error">{error}</p>}
      {notice && <p role="status" className="rule-studio-notice">{notice}</p>}
      {!enabled && <p className="rule-studio-warning">
        Rule Studio write actions are disabled until the secured MediaOS rollout is approved.
        Existing approved Production Memory remains unchanged.
      </p>}

      <div className="rule-studio-columns">
        <section className="rule-studio-panel">
          <div className="rule-studio-panel-heading">
            <h2><MessageSquareText size={18}/> Talk to the Rule Agent</h2>
            <label className="rule-studio-toggle">
              <input type="checkbox" checked={aiOn} onChange={event => {
                setAiOn(event.target.checked); invalidate();
              }}/>
              AI {aiOn ? 'ON' : 'OFF'}
            </label>
          </div>
          <label>Where should this rule apply?
            <select value={target} disabled={!!parent || busy} onChange={event => {
              setTarget(event.target.value); invalidate();
            }}>
              <option value="">GLOBAL — all future episodes</option>
              {episodes.map(ep => (
                <option key={ep.id} value={ep.id}>{ep.episodeNumber} — {ep.title}</option>
              ))}
            </select>
          </label>
          <label>Production area
            <select value={scope} disabled={!!parent || busy} onChange={event => {
              setScope(event.target.value as RuleScope); invalidate();
            }}>
              {scopeOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          {parent && <div className="rule-studio-context">
            <strong>Refining an earlier DRAFT</strong>
            <p>{parent.proposedRule}</p>
            <button type="button" onClick={() => { setParent(null); invalidate(); }}>
              End refinement; start a new rule
            </button>
          </div>}
          <div className="rule-studio-message director">
            <span>DIRECTOR PROMPT</span>
            <textarea rows={5} maxLength={4000} value={message}
              placeholder="Например: Когато обясняваме технически термин, първо дай прост пример, след това покажи как работи върху Living Architecture Map."
              onChange={event => { setMessage(event.target.value); invalidate(); }}/>
          </div>
          {!aiOn && <label>Manual rule (English; no AI tokens)
            <textarea rows={5} maxLength={2000} value={manualRule}
              placeholder="Write the exact production rule for approval."
              onChange={event => setManualRule(event.target.value)}/>
          </label>}
          <label>Director reviewer
            <input value={reviewer} maxLength={120}
              placeholder="Review identity"
              onChange={event => setReviewer(event.target.value)}/>
          </label>
          <label>Director capability (temporary protected environment)
            <input type="password" autoComplete="off" value={director}
              placeholder="Director approval capability"
              onChange={event => setDirector(event.target.value)}/>
          </label>
          <p className="rule-studio-muted">
            This uses the MediaOS OpenAI API, not the live ChatGPT chat or its private memory.
            The capability is kept only in page state; never deploy this secret-based
            interface publicly before proper Director authentication.
          </p>

          {aiOn ? (
            <div className="rule-studio-actions">
              <button type="button" disabled={!readyForPaid || busy}
                onClick={() => void action(
                  () => directorRuleStudioApi.preview(request(), director),
                  value => setPreview(value),
                  'Context prepared without AI tokens. Confirm the paid request to get a proposed rule.'
                )}>
                <Sparkles size={16}/> Preview AI request
              </button>
              <button type="button" disabled={!preview || !readyForPaid || busy}
                onClick={() => void action(
                  () => directorRuleStudioApi.generate(request(), director, preview!.authorizationToken),
                  value => { setProposal(value); setPreview(null); setCompared(false); },
                  'OpenAI formulated a rule. Review it below; no rule has been activated.'
                )}>
                <Bot size={16}/> Confirm & formulate rule
              </button>
            </div>
          ) : (
            <button type="button" className="rule-studio-primary"
              disabled={!enabled || !director || message.trim().length < 5
                || manualRule.trim().length < 15 || busy}
              onClick={() => void action(
                () => directorRuleStudioApi.manual({ ...request(), ruleEnglish: manualRule.trim() }, director),
                value => { setProposal(value); setCompared(false); },
                'Manual DRAFT saved; nothing was activated.'
              )}>Save manual DRAFT — zero AI tokens</button>
          )}
          {aiOn && (!paidAiEnabled || !aiConfigured) &&
            <p className="rule-studio-warning">Paid AI or OpenAI integration is OFF. You can still choose AI OFF and draft a rule manually.</p>}
          {preview && <div className="rule-studio-context">
            <strong>First-pass context ready</strong>
            <p>{preview.mandatoryRuleCount} mandatory rules · {preview.additionalRuleCount} additional rules.
              Policy: {preview.policyVersion}. Model: {preview.model}.
              This authorization allows one paid request and expires at {preview.expiresAt}.</p>
          </div>}
        </section>

        <section className="rule-studio-panel">
          <h2><BookOpenCheck size={19}/> Agent reply & Director approval</h2>
          {!proposal && <div className="episode-hub-empty">
            Your AI response will appear here as a complete, readable production rule.
            The AI can propose wording, but cannot activate a rule.
          </div>}
          {proposal && <>
            <div className="rule-studio-message agent">
              <span><Bot size={15}/> AI RULE FORMULATION · {proposal.sourceKind}</span>
              <p>{proposal.explanationBg}</p>
              <strong>PROPOSED PRODUCTION RULE (ENGLISH)</strong>
              <blockquote>{proposal.proposedRule}</blockquote>
              {proposal.positiveExample && <p><strong>Correct:</strong> {proposal.positiveExample}</p>}
              {proposal.negativeExample && <p><strong>Avoid:</strong> {proposal.negativeExample}</p>}
              <p><strong>Target:</strong> {proposal.episodeId
                ? episodes.find(ep => ep.id === proposal.episodeId)?.episodeNumber || 'Selected episode'
                : 'GLOBAL'} / {proposal.scope}</p>
              <span className={'episode-hub-status ' +
                (proposal.status === 'APPROVED' ? 'locked' : 'pending')}>{proposal.status}</span>
            </div>
            {proposal.comparison && <>
              {proposal.comparison.exactDuplicateRuleId && <p className="rule-studio-warning">
                Exact active duplicate exists: {proposal.comparison.exactDuplicateRuleId}.
                This candidate cannot be activated again.
              </p>}
              <div className="rule-studio-context">
                <strong>Existing Memory comparison</strong>
                <p>{proposal.comparison.relatedRules.length === 0
                  ? 'No strong text overlap found. This does not prove semantic consistency.'
                  : 'Potential overlaps. Read them before approving; similarity is not a semantic check.'}</p>
                {proposal.comparison.relatedRules.map(rule => (
                  <p key={rule.ruleId}><small>{rule.scope}, {Math.round(rule.similarity * 100)}% overlap</small> {rule.content}</p>
                ))}
              </div>
            </>}
            {proposal.status === 'DRAFT' && <>
              <label className="rule-studio-compared">
                <input type="checkbox" checked={compared}
                  onChange={event => setCompared(event.target.checked)}/>
                I reviewed the rule, examples, scope, and possible conflicts with existing memory.
              </label>
              <label>Director decision note
                <textarea rows={3} maxLength={1500} value={reviewNote}
                  placeholder="Why this rule should apply to the selected scope, and why it does not conflict with locked decisions."
                  onChange={event => setReviewNote(event.target.value)}/>
              </label>
              <div className="rule-studio-actions">
                <button type="button" className="rule-studio-primary"
                  disabled={!approveReady || !!proposal.comparison?.exactDuplicateRuleId || busy}
                  onClick={() => void action(
                    () => directorRuleStudioApi.review(
                      proposal.id,'APPROVE',proposal.comparison!.fingerprint,
                      reviewer,reviewNote,director),
                    result => { setProposal(result); setCompared(false); },
                    'Director approved the rule. It now belongs to active Production Memory and will be included in relevant future prompts.'
                  )}><ShieldCheck size={16}/> Approve & Activate</button>
                <button type="button" disabled={!approveReady || busy}
                  onClick={() => void action(
                    () => directorRuleStudioApi.review(
                      proposal.id,'REJECT',proposal.comparison!.fingerprint,
                      reviewer,reviewNote,director),
                    result => { setProposal(result); setCompared(false); },
                    'Proposal rejected. Production Memory was not changed.'
                  )}><XCircle size={16}/> Reject</button>
                <button type="button" disabled={busy} onClick={() => refine(proposal)}>
                  <MessageSquareText size={16}/> Refine via chat
                </button>
              </div>
            </>}
            {proposal.status === 'APPROVED' && <p className="rule-studio-approved">
              <CheckCircle2 size={17}/> ACTIVE — next relevant Script, Voice or Video planning prompt
              will inherit this rule. Existing locked media is unchanged.
            </p>}
          </>}
        </section>
      </div>

      <section className="rule-studio-panel" style={{ marginTop: 18 }}>
        <h2>Recent rule proposals</h2>
        <div className="rule-studio-history">
          {history.length === 0 && <p>No proposals yet.</p>}
          {history.map(item => (
            <button type="button" key={item.id} disabled={busy}
              onClick={() => void action(
                () => directorRuleStudioApi.proposal(item.id), setProposal, 'Rule proposal opened.'
              )}>
              <strong>{item.status} · {item.scope} · {item.episodeId ? 'Episode' : 'GLOBAL'}</strong>
              <span>{item.proposedRule}</span>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
