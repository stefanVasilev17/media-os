import { useCallback, useEffect, useRef, useState } from 'react';
import { Box, LoaderCircle, Play, RefreshCw, Send } from 'lucide-react';
import { ShotVideoPreviewOverlay } from '../components/ShotVideoPreviewOverlay';
import { SplineDirectorSceneView } from '../components/SplineDirectorSceneView';
import {
  createSplineShotCommand,
  ensureSplineShotRender,
  loadLatestSplineShot,
  loadLatestSplineShotRender,
  type SplineShot,
  type SplineShotRender
} from '../api/splineShotApi';
import '../styles/splineShotDirector.css';

type SessionMessage = {
  id: number;
  role: 'user' | 'agent';
  text: string;
};

function explicitlyStartsNewShot(value: string) {
  const text = value.toLowerCase();
  return /\bnew shot\b|\bnext shot\b|\bshot\s*0?\d+\b|нова сцена|следваща сцена|нов шот|следващ шот/.test(text);
}

export function SplineWorkspacePage() {
  const [latestShot, setLatestShot] = useState<SplineShot | null>(null);
  const [latestRender, setLatestRender] = useState<SplineShotRender | null>(null);
  const [previewShot, setPreviewShot] = useState<SplineShot | null>(null);
  const [previewRender, setPreviewRender] = useState<SplineShotRender | null>(null);
  const [revisionShotId, setRevisionShotId] = useState<string | null>(null);
  const [pendingShotJobId, setPendingShotJobId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [sessionMessages, setSessionMessages] = useState<SessionMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const messageSequenceRef = useRef(0);

  const appendSessionMessage = useCallback((role: SessionMessage['role'], text: string) => {
    messageSequenceRef.current += 1;
    setSessionMessages(current => [...current, { id: messageSequenceRef.current, role, text }]);
  }, []);

  const refresh = useCallback(async (ensureCurrentRender = false) => {
    const shot = await loadLatestSplineShot().catch(() => null);
    if (!shot) return;

    setLatestShot(shot);
    setPendingShotJobId(current => current && shot.productionJobId === current ? null : current);

    let render = ensureCurrentRender
      ? await ensureSplineShotRender(shot.id).catch(() => null)
      : await loadLatestSplineShotRender(shot.id).catch(() => null);

    if (!render) {
      render = await ensureSplineShotRender(shot.id).catch(() => null);
    }
    setLatestRender(render);
  }, []);

  useEffect(() => {
    setSessionMessages([]);
    setMessage('');
    refresh(true).catch(() => undefined);
  }, [refresh]);

  const renderInFlight = Boolean(latestRender && ['QUEUED', 'RENDERING'].includes(latestRender.status));

  useEffect(() => {
    if (!pendingShotJobId && !renderInFlight) return;
    const timer = window.setInterval(() => {
      refresh(false).catch(() => undefined);
    }, 2500);
    return () => window.clearInterval(timer);
  }, [pendingShotJobId, renderInFlight, refresh]);

  async function sendCommand() {
    const text = message.trim();
    if (!text || busy) return;

    const continueShot = Boolean(revisionShotId && !explicitlyStartsNewShot(text));
    appendSessionMessage('user', text);
    setMessage('');
    setBusy(true);

    try {
      const result = await createSplineShotCommand(text, continueShot ? revisionShotId : null);
      setPendingShotJobId(result.productionJobId);
      setLatestRender(null);
      if (!continueShot) setRevisionShotId(null);
      appendSessionMessage('agent', continueShot ? 'Revision is being prepared.' : 'Shot is being prepared.');
      await refresh(false);
    } catch (error) {
      appendSessionMessage('agent', error instanceof Error ? error.message : 'Could not prepare the shot.');
    } finally {
      setBusy(false);
      window.setTimeout(() => composerRef.current?.focus(), 50);
    }
  }

  async function retryRender() {
    if (!latestShot || busy) return;
    setBusy(true);
    try {
      const render = await ensureSplineShotRender(latestShot.id);
      setLatestRender(render);
    } catch (error) {
      appendSessionMessage('agent', error instanceof Error ? error.message : 'Could not restart the render.');
    } finally {
      setBusy(false);
    }
  }

  function startPreview() {
    if (!latestShot || !latestRender || latestRender.status !== 'READY' || !latestRender.videoUrl) return;
    const fullscreen = document.documentElement.requestFullscreen;
    if (typeof fullscreen === 'function') fullscreen.call(document.documentElement).catch(() => undefined);
    setPreviewShot(latestShot);
    setPreviewRender(latestRender);
  }

  function returnFromPreview() {
    const completedShot = previewShot;
    setPreviewShot(null);
    setPreviewRender(null);
    if (completedShot) setRevisionShotId(completedShot.id);

    if (document.fullscreenElement && typeof document.exitFullscreen === 'function') {
      document.exitFullscreen().catch(() => undefined);
    }

    window.setTimeout(() => composerRef.current?.focus(), 80);
  }

  if (previewShot && previewRender) {
    return <ShotVideoPreviewOverlay shot={previewShot} render={previewRender} onComplete={returnFromPreview} />;
  }

  const previewReady = Boolean(latestShot && latestRender?.status === 'READY' && latestRender.videoUrl && !pendingShotJobId);
  const renderFailed = latestRender?.status === 'FAILED';
  const preparing = Boolean(pendingShotJobId || renderInFlight || busy);

  return (
    <main className="spline-minimal-page">
      <header className="spline-minimal-header">
        <strong>Spline Agent</strong>
        <div className="spline-minimal-brand" aria-label="MediaOS">
          <Box size={12} strokeWidth={2.1} />
          <span>MediaOS</span>
        </div>
      </header>

      <SplineDirectorSceneView />

      <section className="spline-minimal-chat" aria-label="Spline Agent chat">
        {sessionMessages.length > 0 && (
          <div className="spline-minimal-chat-session">
            {sessionMessages.map(item => (
              <div key={item.id} className={`spline-minimal-message ${item.role}`}>
                {item.text}
              </div>
            ))}
          </div>
        )}

        <div className="spline-minimal-composer">
          <textarea
            ref={composerRef}
            value={message}
            onChange={event => setMessage(event.target.value)}
            placeholder={revisionShotId
              ? 'Describe the correction…'
              : 'Describe the shot…'}
            rows={4}
            onKeyDown={event => {
              if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                event.preventDefault();
                void sendCommand();
              }
            }}
          />
          <button type="button" onClick={() => void sendCommand()} disabled={busy || !message.trim()} aria-label="Send">
            {busy ? <LoaderCircle size={18} className="spin" /> : <Send size={18} />}
          </button>
        </div>
      </section>

      <button
        type="button"
        className={`spline-minimal-preview ${renderFailed ? 'failed' : ''}`}
        disabled={!previewReady && !renderFailed}
        onClick={() => renderFailed ? void retryRender() : startPreview()}
      >
        {renderFailed ? <RefreshCw size={18} /> : preparing ? <LoaderCircle size={18} className="spin" /> : <Play size={18} />}
        {renderFailed ? 'Retry render' : preparing ? 'Rendering…' : 'Preview shot'}
      </button>
    </main>
  );
}
