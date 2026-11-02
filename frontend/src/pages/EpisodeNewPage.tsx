import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { episodePreparationApi } from '../api/episodePreparationApi';
import {ep002} from '../lib/episodeProductionLibrary';
import '../styles/episodeDirectorHub.css';
import '../styles/episodePreparationQuiet.css';

export function EpisodeNewPage() {
  const [number, setNumber] = useState('');
  const isEp002Template = new URLSearchParams(window.location.hash.split('?',2)[1] || '').get('template') === 'EP002';
  const [title, setTitle] = useState(isEp002Template ? ep002.title : '');
  const [brief, setBrief] = useState(isEp002Template
    ? 'Director-approved EP002 companion to successful Login. Explain why a healthy Auth Service can still fail when database throughput, connection pools, retries and end-to-end deadlines become bottlenecks. Restore the approved Research, Script v4.0 and NEW Visual Pass v1.0; do not rewrite narration or generate voice before native stage approvals.'
    : '');
  const [sources, setSources] = useState(isEp002Template
    ? [ep002.scriptAssembly,ep002.editorialApproval,ep002.visualApproval,ep002.qaAudit].join('\n')
    : '');
  const [showSources, setShowSources] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    episodePreparationApi.nextNumber()
      .then(value => setNumber(value.episodeNumber))
      .catch(reason => setError(reason instanceof Error ? reason.message : String(reason)));
  }, []);

  async function create() {
    if (!number || !title.trim() || brief.trim().length < 20 || saving
        || (isEp002Template && number !== 'EP002')) return;
    setSaving(true);
    setError('');
    try {
      const episode = await episodePreparationApi.create(
        number, title.trim(), brief.trim(), sources.trim());
      window.location.hash = '#/episodes/' + episode.id + '/prepare';
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally { setSaving(false); }
  }

  return (
    <main className="media-os-page episode-hub episode-preparation">
      <nav className="episode-preparation-nav">
        <button type="button" onClick={() => { window.location.hash = '#/episodes'; }}>
          <ArrowLeft size={18}/> Episodes
        </button>
      </nav>
      <header className="episode-preparation-header">
        <h1>New Episode</h1>
        {number && <p>{number}</p>}
        {isEp002Template && <p>Approved EP002 brief and GitHub sources are prefilled. Review them before creating the production workspace. This does not generate voice or import native LOCKs.</p>}
        {isEp002Template && number && number !== 'EP002' && <p role="alert">The next available episode is {number}, not EP002. No duplicate or wrongly numbered episode will be created. Return to the catalog and open the existing EP002 if present.</p>}
      </header>
      {error && <p role="alert" className="episode-hub-error">{error}</p>}
      <form className="episode-preparation-form" onSubmit={event => {
        event.preventDefault();
        void create();
      }}>
        <label htmlFor="new-episode-title">Title</label>
        <input id="new-episode-title" maxLength={260} value={title} required
          onChange={event => setTitle(event.target.value)}
          placeholder="What Happens When Redis Fails?" />
        <label htmlFor="new-episode-brief">Episode idea</label>
        <textarea id="new-episode-brief" rows={7} maxLength={10000} value={brief} required
          onChange={event => setBrief(event.target.value)}
          placeholder="Опиши какво искаш да научи зрителят и какви архитектурни проблеми ще покажем." />
        <button className="episode-preparation-secondary" type="button"
          aria-expanded={showSources} onClick={() => setShowSources(value => !value)}>
          {showSources ? 'Hide sources' : 'Add sources'}
        </button>
        {showSources && <>
          <label htmlFor="new-episode-sources">Technical sources</label>
          <textarea id="new-episode-sources" rows={4} maxLength={12000}
            value={sources} onChange={event => setSources(event.target.value)}
            placeholder="One reference or technical source per line." />
        </>}
        <button className="episode-preparation-primary" type="submit"
          disabled={saving || !number || !title.trim() || brief.trim().length < 20 || (isEp002Template && number !== 'EP002')}>
          {saving ? 'Creating…' : 'Create Episode'}
        </button>
      </form>
    </main>
  );
}
