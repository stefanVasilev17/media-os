import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from 'react';
import { Application } from '@splinetool/runtime';
import { loadSplineRuntimeConfig } from '../api/mediaOsApi';

const DEFAULT_ZOOM = 0.12;
const MIN_ZOOM = 0.06;
const MAX_ZOOM = 1.6;

type PointerPoint = { x: number; y: number };
type PinchState = { distance: number; zoom: number };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function distance(left: PointerPoint, right: PointerPoint) {
  return Math.hypot(right.x - left.x, right.y - left.y);
}

export function SplineDirectorSceneView() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const appRef = useRef<Application | null>(null);
  const pointersRef = useRef<Map<number, PointerPoint>>(new Map());
  const pinchRef = useRef<PinchState | null>(null);
  const zoomRef = useRef(DEFAULT_ZOOM);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const config = await loadSplineRuntimeConfig();
        if (cancelled) return;
        if (!config.configured || !config.sceneUrl.trim()) {
          setError('Spline view is not configured.');
          setLoading(false);
          return;
        }

        const canvas = canvasRef.current;
        if (!canvas) return;

        const app = new Application(canvas, { renderMode: 'auto', htmlContentMode: 'none' });
        appRef.current = app;
        await app.load(config.sceneUrl.trim());
        if (cancelled) {
          app.dispose();
          return;
        }

        app.play();
        app.setZoom(DEFAULT_ZOOM);
        app.requestRender();
        zoomRef.current = DEFAULT_ZOOM;
        setLoading(false);
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : 'Could not load the Spline view.');
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
      pointersRef.current.clear();
      pinchRef.current = null;
      appRef.current?.dispose();
      appRef.current = null;
    };
  }, []);

  function applyZoom(next: number) {
    const app = appRef.current;
    if (!app) return;
    const value = clamp(next, MIN_ZOOM, MAX_ZOOM);
    zoomRef.current = value;
    app.setZoom(value);
    app.requestRender();
  }

  function block(event: { preventDefault: () => void; stopPropagation: () => void }) {
    event.preventDefault();
    event.stopPropagation();
  }

  function onWheel(event: ReactWheelEvent<HTMLDivElement>) {
    block(event);
    const factor = Math.exp(-event.deltaY * 0.0018);
    applyZoom(zoomRef.current * factor);
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    block(event);
    event.currentTarget.setPointerCapture?.(event.pointerId);
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    const points = [...pointersRef.current.values()];
    if (points.length >= 2) {
      pinchRef.current = {
        distance: Math.max(1, distance(points[0], points[1])),
        zoom: zoomRef.current
      };
    }
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!pointersRef.current.has(event.pointerId)) return;
    block(event);
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    const points = [...pointersRef.current.values()];
    if (points.length < 2 || !pinchRef.current) return;

    const currentDistance = Math.max(1, distance(points[0], points[1]));
    applyZoom(pinchRef.current.zoom * (currentDistance / pinchRef.current.distance));
  }

  function onPointerEnd(event: ReactPointerEvent<HTMLDivElement>) {
    block(event);
    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
  }

  return (
    <div
      className="spline-director-scene"
      onWheelCapture={onWheel}
      onPointerDownCapture={onPointerDown}
      onPointerMoveCapture={onPointerMove}
      onPointerUpCapture={onPointerEnd}
      onPointerCancelCapture={onPointerEnd}
      onClickCapture={block}
      onDoubleClickCapture={block}
      onContextMenu={block}
    >
      <canvas ref={canvasRef} className="spline-director-scene-canvas" />
      {loading && <div className="spline-director-scene-state">Loading Spline…</div>}
      {error && <div className="spline-director-scene-state error">{error}</div>}
    </div>
  );
}
