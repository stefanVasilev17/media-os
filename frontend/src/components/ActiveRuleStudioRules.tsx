import { useEffect, useState } from 'react';
import { BookOpenCheck, MessageSquareText } from 'lucide-react';
import { directorRuleStudioApi, type RuleScope } from '../api/directorRuleStudioApi';

type Rule = { id: string; scope: string; content: string; severity: string };

export function ActiveRuleStudioRules({
  episodeId, scope
}: {
  episodeId: string;
  scope: 'VOICE' | 'VISUAL';
}) {
  const [rules, setRules] = useState<Rule[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setRules([]);
    setError('');
    directorRuleStudioApi.effective(episodeId, scope as RuleScope)
      .then(result => { if (active) setRules(result.rules); })
      .catch(reason => {
        if (active) setError(reason instanceof Error ? reason.message : String(reason));
      });
    return () => { active = false; };
  }, [episodeId, scope]);

  return (
    <section className="episode-hub-section">
      <div className="episode-hub-section-title">
        <h2><BookOpenCheck size={17} style={{ verticalAlign: 'middle' }} /> Active Production Rules</h2>
        <button type="button" className="episode-hub-secondary"
          onClick={() => { window.location.hash = '#/rule-studio'; }}>
          <MessageSquareText size={15} /> Add or refine a rule
        </button>
      </div>
      {error && <p role="alert" className="episode-hub-error">{error}</p>}
      <details className="episode-hub-empty">
        <summary>{rules.length} applicable {scope === 'VOICE' ? 'Voice' : 'Video'} production rules</summary>
        <p style={{ marginTop: 12 }}>
          New Director-approved rules are included in the next relevant AI planning prompt.
          Existing approved narration or audio is never silently rewritten.
          Generation still needs its own review and approval.
        </p>
        {rules.map(rule => (
          <p key={rule.id} style={{ fontSize: 12, lineHeight: 1.6 }}>
            <strong>{rule.scope} · {rule.severity}:</strong> {rule.content}
          </p>
        ))}
      </details>
    </section>
  );
}
