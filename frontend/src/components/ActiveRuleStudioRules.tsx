import { useEffect, useState } from 'react';
import { directorRuleStudioApi } from '../api/directorRuleStudioApi';
import '../styles/activeRulesQuiet.css';

type Rule = { id: string; scope: string; content: string; severity: string };

export function ActiveRuleStudioRules({
  episodeId, scope
}: {
  episodeId: string;
  scope: 'VOICE' | 'VISUAL';
}) {
  const [rules, setRules] = useState<Rule[]>([]);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;
    setRules([]);
    setError('');
    setOpen(false);
    directorRuleStudioApi.effective(episodeId, scope)
      .then(result => { if (active) setRules(result.rules); })
      .catch(reason => {
        if (active) setError(reason instanceof Error ? reason.message : String(reason));
      });
    return () => { active = false; };
  }, [episodeId, scope]);

  return (
    <section className="active-rules-quiet">
      <div className="active-rules-heading">
        <button type="button" aria-expanded={open} onClick={() => setOpen(value => !value)}>
          Production rules ({rules.length})
        </button>
        <button type="button" onClick={() => { window.location.hash = '#/rule-studio'; }}>
          Edit rules
        </button>
      </div>
      {error && <p role="alert" className="episode-hub-error">{error}</p>}
      {open && <div className="active-rules-list">
        {rules.length === 0 && <p>No active rules.</p>}
        {rules.map(rule => <p key={rule.id}>{rule.content}</p>)}
      </div>}
    </section>
  );
}
