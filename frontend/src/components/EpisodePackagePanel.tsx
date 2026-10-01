import { CheckCircle2, FileJson2, LoaderCircle, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  applyEpisodePackage,
  loadCurrentEpisodePackage,
  previewEpisodePackage,
  type EpisodePackageCurrent,
  type EpisodePackagePreview
} from '../api/episodePackageApi';
import '../styles/episodePackage.css';

export function EpisodePackagePanel({ onApplied }: { onApplied: () => void | Promise<void> }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [current, setCurrent] = useState<EpisodePackageCurrent | null>(null);
  const [preview, setPreview] = useState<EpisodePackagePreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function loadCurrent() {
    try {
      setCurrent(await loadCurrentEpisodePackage());
    } catch {
      setCurrent(null);
    }
  }

  useEffect(() => {
    void loadCurrent();
  }, []);

  async function chooseFile(file: File | null) {
    if (!file || busy) return;
    setBusy(true);
    setError('');
    setPreview(null);
    try {
      setPreview(await previewEpisodePackage(file));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not validate the episode package.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function apply() {
    if (!preview?.canApply || !preview.packageId || busy) return;
    setBusy(true);
    setError('');
    try {
      await applyEpisodePackage(preview.packageId);
      setPreview(null);
      await loadCurrent();
      await onApplied();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not apply the approved episode package.');
    } finally {
      setBusy(false);
    }
  }

  const hasCurrent = Boolean(current?.id);

  return (
    <details className="director-panel episode-package-panel">
      <summary>
        <span>Approved episode package</span>
        <small>Import locked work from ChatGPT and execute it with 0 paid AI calls</small>
      </summary>
      <div className="director-panel-body episode-package-body">
        {hasCurrent && (
          <div className="episode-package-current">
            <CheckCircle2 size={16} />
            <div>
              <strong>{current?.episodeNumber} · {current?.title}</strong>
              <small>{current?.filename} · {current?.shots ?? 0} shots · 0 paid AI calls</small>
            </div>
          </div>
        )}

        <div className="episode-package-intro">
          <p>Upload a creator-approved <code>.mediaos.json</code> file. MediaOS validates it locally, locks the approved Research, Script and Scene contracts, then queues deterministic read-only Spline shot planning. No model is called and no GPU render starts automatically.</p>
          <input
            ref={inputRef}
            type="file"
            accept=".json,.mediaos.json,application/json"
            onChange={event => void chooseFile(event.target.files?.[0] || null)}
            disabled={busy}
          />
          <button type="button" disabled={busy} onClick={() => inputRef.current?.click()}>
            {busy ? <LoaderCircle size={15} className="spin" /> : <Upload size={15} />}
            {busy ? 'Checking package…' : 'Choose episode package'}
          </button>
        </div>

        {error && <div className="episode-package-error">{error}</div>}

        {preview && (
          <section className={`episode-package-preview ${preview.valid ? 'valid' : 'invalid'}`}>
            <div className="episode-package-preview-head">
              <FileJson2 size={17} />
              <div>
                <strong>{preview.episodeNumber || 'Episode'} · {preview.title || preview.filename}</strong>
                <small>ZERO-TOKEN FILE PREVIEW · {preview.contentHash.slice(0, 12)}</small>
              </div>
            </div>

            {preview.valid ? (
              <>
                <p>{preview.durationSeconds}s working script · {preview.scriptBlocks} script blocks · {preview.sceneBlocks} scene blocks · {preview.shots} shots</p>
                <p className="episode-package-safety">0 paid AI calls · no Windows machine · no automatic GPU render</p>
                <details>
                  <summary>What MediaOS will do</summary>
                  <p>Lock: {preview.willLock.join(' → ')}</p>
                  <p>Queue: {preview.willQueue}</p>
                  {preview.willNotDo.map(item => <p key={item}>{item}</p>)}
                </details>
                <button type="button" className="episode-package-apply" disabled={!preview.canApply || busy} onClick={() => void apply()}>
                  {busy ? <LoaderCircle size={15} className="spin" /> : <CheckCircle2 size={15} />}
                  {preview.alreadyApplied ? 'This exact package is already applied' : 'Apply locked package · 0 AI calls'}
                </button>
              </>
            ) : (
              <div className="episode-package-blockers">
                {preview.blockers.map(item => <p key={item}>{item}</p>)}
              </div>
            )}
          </section>
        )}
      </div>
    </details>
  );
}
