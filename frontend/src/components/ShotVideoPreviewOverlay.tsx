import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { SplineShot, SplineShotRender } from '../api/splineShotApi';
import '../styles/shotVideoPreview.css';

type Props = {
  shot: SplineShot;
  render: SplineShotRender;
  onComplete: () => void;
};

function formatTime(seconds: number) {
  const safe = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  const minutes = Math.floor(safe / 60);
  const rest = safe - minutes * 60;
  return `${String(minutes).padStart(2, '0')}:${rest.toFixed(2).padStart(5, '0')}`;
}

export function ShotVideoPreviewOverlay({ shot, render, onComplete }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [time, setTime] = useState(0);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onComplete();
    };
    window.addEventListener('keydown', escape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', escape);
    };
  }, [onComplete]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const play = () => video.play().catch(() => undefined);
    if (video.readyState >= 2) play();
    else video.addEventListener('canplay', play, { once: true });
    return () => video.removeEventListener('canplay', play);
  }, [render.videoUrl]);

  return (
    <div className="shot-video-preview-overlay" role="dialog" aria-modal="true" aria-label={`Preview ${shot.name}`}>
      <div className="shot-video-preview-topbar">
        <div>
          <span>{shot.shotKey} · REVISION {shot.revision}</span>
          <strong>{shot.name}</strong>
        </div>
        <button type="button" aria-label="Return to Spline Agent chat" onClick={onComplete}><X size={20} /></button>
      </div>

      <div className="shot-video-preview-stage">
        <video
          ref={videoRef}
          src={render.videoUrl}
          playsInline
          muted
          controls
          preload="auto"
          onTimeUpdate={event => setTime(event.currentTarget.currentTime)}
          onEnded={onComplete}
        />
      </div>

      <div className="shot-video-preview-timecode">
        {formatTime(time)} / {formatTime(render.durationMs / 1000)}
      </div>
    </div>
  );
}
