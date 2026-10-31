import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { episodePreparationApi } from '../api/episodePreparationApi';
import '../styles/episodeDirectorHub.css';
import '../styles/episodePreparationQuiet.css';

export function EpisodeNewPage() {
  const [number, setNumber] = useState('');
  const [title, setTitle] = useState('');
  const [brief, setBrief] = useState('');
  const [sources, setSources] = useState('');
  const [showSources, setShowSources] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    episodePreparationApi.nextNumber()
      .then(value => setNumber(value.episodeNumber))
      .catch(reason => setError(reason instanceof Error ? reason.message : String(reason)));
  }, []);

  async function create() {
    if (!number || !title.trim() || brief.trim().length < 20 || saving) return;
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
          disabled={saving || !number || !title.trim() || brief.trim().length < 20}>
          {saving ? 'Creating…' : 'Create Episode'}
        </button>
      </form>
    </main>
  );
}
