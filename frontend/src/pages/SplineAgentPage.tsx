import { useEffect, useState } from 'react';
import { Check, ChevronLeft, Mic, Send, Sparkles, X } from 'lucide-react';
import { decideProposal, loadSplineThread, type ThreadView } from '../api/mediaOsApi';
import { StatusPill } from '../components/StatusPill';

export function SplineAgentPage() {
  const [view, setView] = useState<ThreadView | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => { loadSplineThread().then(setView); }, []);
  if (!view) return <main className="loading">Loading Media OS…</main>;

  async function decide(decision: 'APPROVE' | 'REQUEST_CHANGES') {
    if (!view) return;

    setSaving(true);
    try {
      await decideProposal(view.proposal.id, decision, note);
      setFlash(decision === 'APPROVE' ? 'Proposal approved.' : 'Changes requested and saved.');
      setNote('');
    } catch {
      setFlash('Preview mode: backend persistence will activate after deployment.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="icon-button" aria-label="Back"><ChevronLeft size={22} /></button>
        <div className="agent-heading">
          <div className="agent-icon"><Sparkles size={18} /></div>
          <div><strong>{view.agentName}</strong><span>{view.episodeNumber} · {view.agentStatus}</span></div>
        </div>
        <StatusPill>LOW RISK</StatusPill>
      </header>

      <section className="workspace">
        <div className="conversation-pane">
          <div className="episode-kicker">{view.episodeNumber}</div>
          <h1>{view.episodeTitle}</h1>
          <p className="muted">Director view · You review intent and result. The agent handles implementation.</p>

          <div className="messages">
            {view.messages.map(message => (
              <article className={`message ${message.sender.toLowerCase()}`} key={message.id}>
                <span>{message.sender === 'CREATOR' ? 'You' : message.sender === 'AGENT' ? 'Spline Agent' : 'System'}</span>
                <p>{message.content}</p>
              </article>
            ))}
          </div>

          <div className="composer">
            <button className="icon-button" aria-label="Voice note"><Mic size={20} /></button>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="Tell Spline Agent what to change…" />
            <button className="icon-button primary-icon" aria-label="Send"><Send size={18} /></button>
          </div>
        </div>

        <aside className="review-pane">
          <div className="review-label">CURRENT PROPOSAL</div>
          <h2>{view.proposal.title}</h2>
          <p className="proposal-summary">{view.proposal.summary}</p>

          <div className="meta-grid">
            <div><span>Reuse confidence</span><strong>{Math.round(view.proposal.confidence * 100)}%</strong></div>
            <div><span>Risk</span><strong>{view.proposal.riskLevel}</strong></div>
          </div>

          <div className="preview-card">
            <div className="preview-grid" />
            <div className="node auth">AUTH STATE</div>
            <div className="node restore">SESSION RESTORE</div>
            <div className="flow-line" />
            <div className="preview-caption"><span>SANDBOX PREVIEW</span><strong>Restore path review</strong></div>
          </div>

          <div className="operations">
            <h3>What the agent wants to do</h3>
            {view.proposal.proposedOperations.map(operation => (
              <div className="operation" key={operation}><Check size={16} /> <span>{operation}</span></div>
            ))}
          </div>

          <div className="affected">
            <span>Affected objects</span>
            <div>{view.proposal.affectedObjects.map(o => <code key={o}>{o}</code>)}</div>
          </div>

          {flash && <div className="flash">{flash}</div>}

          <div className="sticky-actions">
            <button className="secondary-action" disabled={saving} onClick={() => decide('REQUEST_CHANGES')}><X size={18} /> Request Changes</button>
            <button className="approve-action" disabled={saving} onClick={() => decide('APPROVE')}><Check size={18} /> Approve</button>
          </div>
        </aside>
      </section>
    </main>
  );
}
