import { useEffect, useMemo, useState } from 'react';
import { ShotPreviewOverlay } from '../components/ShotPreviewOverlay';
import { loadSplineShot, type SplineShot } from '../api/splineShotApi';

function shotIdFromHash() {
  const match = window.location.hash.match(/^#\/render\/spline-shot\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

export function ShotRenderPage() {
  const shotId = useMemo(shotIdFromHash, []);
  const [shot, setShot] = useState<SplineShot | null>(null);
  const [state, setState] = useState<'loading' | 'playing' | 'complete' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    document.documentElement.dataset.mediaOsRenderState = state;
    document.documentElement.dataset.mediaOsRenderError = error;
    return () => {
      delete document.documentElement.dataset.mediaOsRenderState;
      delete document.documentElement.dataset.mediaOsRenderError;
    };
  }, [state, error]);

  useEffect(() => {
    if (!shotId) {
      setError('Missing shot id.');
      setState('error');
      return;
    }
    loadSplineShot(shotId)
      .then(result => {
        if (!result) throw new Error('Shot is not ready.');
        setShot(result);
        setState('playing');
      })
      .catch(cause => {
        setError(cause instanceof Error ? cause.message : 'Could not load shot.');
        setState('error');
      });
  }, [shotId]);

  if (!shot) {
    return <div style={{ width: '100vw', height: '100vh', background: '#050913' }} />;
  }

  return (
    <ShotPreviewOverlay
      shot={shot}
      onComplete={() => setState('complete')}
      onError={message => {
        setError(message);
        setState('error');
      }}
    />
  );
}
