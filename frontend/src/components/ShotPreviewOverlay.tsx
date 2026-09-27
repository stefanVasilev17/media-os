import { useEffect, useRef, useState } from 'react';
import { Application } from '@splinetool/runtime';
import { LoaderCircle, RotateCcw, X } from 'lucide-react';
import { loadSplineRuntimeConfig } from '../api/mediaOsApi';
import type {
  CameraShotBeat,
  FlowShotBeat,
  ShotBeat,
  ShotEasing,
  SplineShot,
  ZoomShotBeat
} from '../api/splineShotApi';
import { createRuntimeFlowExecutor, getRuntimeFlow } from '../lib/episodeRuntimeFlows';
import { runtimeWorldPosition } from '../lib/runtimeObjectFocus';
import type { RuntimeObject } from '../lib/runtimeSceneProof';
import '../styles/shotPreview.css';

type ShotPreviewOverlayProps = {
  shot: SplineShot;
  onComplete: () => void;
  onError?: (message: string) => void;
};

type CameraPose = {
  x: number;
  y: number;
  z: number;
  rx: number;
  ry: number;
  rz: number;
  zoom: number;
};

type RuntimeLookupApplication = Application & {
  findObjectByName?: (name: string) => unknown;
  pauseGameControls?: () => void;
  setSize?: (width: number, height: number) => void;
  stop?: () => void;
};

type CameraReference = {
  beat: CameraShotBeat;
  pose: CameraPose;
};

const CAMERA_RIG_NAME = 'MEDIA_OS_CAMERA';
const PREVIEW_WIDTH = 1920;
const PREVIEW_HEIGHT = 1080;
const MIN_ZOOM = 0.05;
const MAX_ZOOM = 4;
const FINAL_FRAME_HOLD_MS = 320;
const PROGRESS_UPDATE_MS = 48;
const PREVIEW_BOOT_GRACE_MS = 650;
const PREVIEW_TEARDOWN_GRACE_MS = 900;
const CAMERA_CALIBRATION_TIMEOUT_MS = 2500;
const CAMERA_CALIBRATION_SAMPLE_MS = 80;
const CAMERA_CALIBRATION_STABLE_MS = 480;
const cameraCalibrationCache = new Map<string, CameraPose>();

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function finite(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function ease(value: number, easing: ShotEasing = 'smooth') {
  const t = clamp(value, 0, 1);
  if (easing === 'linear') return t;
  if (easing === 'easeInOut') return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  return t * t * (3 - 2 * t);
}

function lerp(from: number, to: number, amount: number) {
  return from + (to - from) * amount;
}

function lerpAngle(from: number, to: number, amount: number) {
  let delta = (to - from) % (Math.PI * 2);
  if (delta > Math.PI) delta -= Math.PI * 2;
  if (delta < -Math.PI) delta += Math.PI * 2;
  return from + delta * amount;
}

function runtimeZoom(object: RuntimeObject, fallback: number) {
  const candidate = object as RuntimeObject & {
    zoom?: number;
    orthographicZoom?: number;
    camera?: { zoom?: number; orthographicZoom?: number };
  };
  const values = [candidate.zoom, candidate.orthographicZoom, candidate.camera?.zoom, candidate.camera?.orthographicZoom];
  return values.map(Number).find(value => Number.isFinite(value) && value >= MIN_ZOOM && value <= MAX_ZOOM) ?? fallback;
}

function cameraZoomFallback(cameraName: string, fallback: number) {
  const normalized = cameraName.trim().toUpperCase();
  if (normalized === 'CAM_LOGIN') return 0.18;
  if (normalized === 'CAM_CLIENT_REVEAL') return 0.16;
  return fallback;
}

function pose(object: RuntimeObject, fallbackZoom: number): CameraPose {
  return {
    x: finite(object.position?.x),
    y: finite(object.position?.y),
    z: finite(object.position?.z),
    rx: finite(object.rotation?.x),
    ry: finite(object.rotation?.y),
    rz: finite(object.rotation?.z),
    zoom: runtimeZoom(object, fallbackZoom)
  };
}

function referencePose(reference: RuntimeObject, beat: CameraShotBeat, baseline: CameraPose): CameraPose {
  const world = runtimeWorldPosition(reference);
  const zoom = beat.zoom ?? runtimeZoom(reference, cameraZoomFallback(beat.targetName, baseline.zoom));
  return {
    x: finite(world.x, baseline.x),
    y: finite(world.y, baseline.y),
    z: baseline.z,
    rx: baseline.rx,
    ry: baseline.ry,
    rz: baseline.rz,
    zoom: clamp(zoom, MIN_ZOOM, MAX_ZOOM)
  };
}

function copyPose(camera: RuntimeObject, next: CameraPose) {
  camera.position.x = next.x;
  camera.position.y = next.y;
  camera.position.z = next.z;
  camera.rotation.x = next.rx;
  camera.rotation.y = next.ry;
  camera.rotation.z = next.rz;
}

function interpolatePose(from: CameraPose, to: CameraPose, amount: number): CameraPose {
  return {
    x: lerp(from.x, to.x, amount),
    y: lerp(from.y, to.y, amount),
    z: lerp(from.z, to.z, amount),
    rx: lerpAngle(from.rx, to.rx, amount),
    ry: lerpAngle(from.ry, to.ry, amount),
    rz: lerpAngle(from.rz, to.rz, amount),
    zoom: lerp(from.zoom, to.zoom, amount)
  };
}

function poseDelta(left: CameraPose, right: CameraPose) {
  return Math.max(
    Math.abs(left.x - right.x),
    Math.abs(left.y - right.y),
    Math.abs(left.z - right.z),
    Math.abs(left.rx - right.rx) * 100,
    Math.abs(left.ry - right.ry) * 100,
    Math.abs(left.rz - right.rz) * 100
  );
}

function sortedBeats(beats: ShotBeat[]) {
  return [...beats].sort((left, right) => left.atMs - right.atMs);
}

function nextFrame() {
  return new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
}

function delay(ms: number) {
  return new Promise<void>(resolve => window.setTimeout(resolve, ms));
}

function cameraTriggerName(cameraName: string) {
  const normalized = cameraName.trim().toUpperCase();
  if (!normalized.startsWith('CAM_') || normalized.startsWith('CAM_TRG_')) return null;
  return `CAM_TRG_${normalized.slice(4)}`;
}

function shouldRunImplicitLoginFlow(shot: SplineShot) {
  const text = `${shot.name} ${shot.creatorPrompt ?? ''}`.toLowerCase().replace('–', '-').replace('—', '-');
  const login = text.includes('login') || text.includes('phone') || text.includes('логин') || text.includes('телефон');
  const authoredMotion = text.includes('animation') || text.includes('анимац') || text.includes('existing') || text.includes('съществуващ') || text.includes('client boundary') || text.includes('request assembly');
  return login && authoredMotion;
}

function isPreviewUiControl(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest('.shot-preview-topbar button, .shot-preview-error button'));
}

function hasLoginFlow(flowBeats: FlowShotBeat[]) {
  return flowBeats.some(beat => beat.flowName.trim().toUpperCase() === 'EP001_LOGIN_FLOW');
}

export function ShotPreviewOverlay({ shot, onComplete, onError }: ShotPreviewOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const appRef = useRef<Application | null>(null);
  const progressBarRef = useRef<HTMLElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const completeTimerRef = useRef<number | null>(null);
  const [status, setStatus] = useState<'loading' | 'playing' | 'error'>('loading');
  const [error, setError] = useState('');
  const [runToken, setRunToken] = useState(0);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onComplete();
    };
    const blockSceneInput = (event: Event) => {
      if (isPreviewUiControl(event.target)) return;
      if (event.cancelable) event.preventDefault();
      event.stopImmediatePropagation();
    };
    const blockedEvents = [
      'pointerdown', 'pointermove', 'pointerup', 'pointercancel',
      'touchstart', 'touchmove', 'touchend', 'touchcancel',
      'mousedown', 'mousemove', 'mouseup', 'click', 'dblclick', 'contextmenu', 'wheel'
    ];
    window.addEventListener('keydown', escape);
    blockedEvents.forEach(eventName => window.addEventListener(eventName, blockSceneInput as EventListener, { capture: true, passive: false }));
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', escape);
      blockedEvents.forEach(eventName => window.removeEventListener(eventName, blockSceneInput as EventListener, true));
    };
  }, [onComplete]);

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const previewCanvas = canvas;
    const runtimeWidth = Math.max(640, Math.round(window.innerWidth || PREVIEW_WIDTH));
    const runtimeHeight = Math.max(360, Math.round(window.innerHeight || PREVIEW_HEIGHT));

    const releaseRuntime = () => {
      const activeApp = appRef.current as RuntimeLookupApplication | null;
      if (activeApp) {
        try { activeApp.stop?.(); } catch {}
        try { activeApp.dispose(); } catch {}
      }
      appRef.current = null;
      previewCanvas.width = 1;
      previewCanvas.height = 1;
    };

    setStatus('loading');
    setError('');
    previewCanvas.style.visibility = 'hidden';
    previewCanvas.width = runtimeWidth;
    previewCanvas.height = runtimeHeight;
    if (progressBarRef.current) progressBarRef.current.style.transform = 'scaleX(0)';

    async function run() {
      try {
        const config = await loadSplineRuntimeConfig();
        if (cancelled || !config.configured || !config.sceneUrl.trim()) {
          if (!cancelled) throw new Error('No browser runtime scene is configured for shot preview.');
          return;
        }

        const sceneUrl = config.sceneUrl.trim();
        await delay(PREVIEW_BOOT_GRACE_MS);
        if (cancelled) return;

        const app = new Application(previewCanvas, { renderMode: 'auto', htmlContentMode: 'none' });
        appRef.current = app;
        await app.load(sceneUrl);
        if (cancelled) return;

        const controlledApp = app as RuntimeLookupApplication;
        controlledApp.setSize?.(runtimeWidth, runtimeHeight);
        controlledApp.pauseGameControls?.();
        app.play();
        await nextFrame();
        await nextFrame();
        if (cancelled) return;

        const resolve = (name: string) => {
          if (!name.trim() || typeof controlledApp.findObjectByName !== 'function') return null;
          return controlledApp.findObjectByName(name.trim()) as RuntimeObject | undefined ?? null;
        };

        const foundCamera = resolve(CAMERA_RIG_NAME);
        if (!foundCamera?.position || !foundCamera.rotation) {
          throw new Error(`${CAMERA_RIG_NAME} is not available in the runtime scene.`);
        }
        const productionCamera = foundCamera as RuntimeObject;

        const beats = sortedBeats(shot.spec.beats);
        const explicitFlowBeats = beats.filter((beat): beat is FlowShotBeat => beat.type === 'FLOW');
        const flowBeats: FlowShotBeat[] = explicitFlowBeats.length > 0
          ? explicitFlowBeats
          : shouldRunImplicitLoginFlow(shot)
            ? [{ type: 'FLOW', atMs: 250, flowName: 'EP001_LOGIN_FLOW' }]
            : [];

        let cameraBeats = beats.filter((beat): beat is CameraShotBeat => beat.type === 'CAMERA');
        if (hasLoginFlow(flowBeats) && !cameraBeats.some(beat => beat.atMs === 0 && beat.targetName.trim().toUpperCase() === 'CAM_LOGIN')) {
          const openingBeat: CameraShotBeat = {
            type: 'CAMERA',
            atMs: 0,
            targetName: 'CAM_LOGIN',
            transitionMs: 0,
            easing: 'easeInOut'
          };
          cameraBeats = [openingBeat, ...cameraBeats].sort((left, right) => left.atMs - right.atMs);
        }

        const zoomBeats = beats.filter((beat): beat is ZoomShotBeat => beat.type === 'ZOOM');
        const executable = beats.filter(beat => beat.type === 'EVENT' || beat.type === 'STATE' || beat.type === 'VISIBILITY');
        const executed = new Set<number>();
        const executedFlowSteps = new Set<string>();
        const flowExecutor = createRuntimeFlowExecutor(app);
        const initialCameraPose = pose(productionCamera, 0.12);

        async function waitForAuthoredCameraPose(beat: CameraShotBeat) {
          const fallbackZoom = beat.zoom ?? cameraZoomFallback(beat.targetName, initialCameraPose.zoom);
          const startedAt = performance.now();
          let previous = pose(productionCamera, fallbackZoom);
          let previousAt = startedAt;
          let stableFor = 0;
          let moved = false;

          while (!cancelled && performance.now() - startedAt < CAMERA_CALIBRATION_TIMEOUT_MS) {
            await delay(CAMERA_CALIBRATION_SAMPLE_MS);
            const now = performance.now();
            const current = pose(productionCamera, fallbackZoom);
            const fromBaseline = poseDelta(current, initialCameraPose);
            const fromPrevious = poseDelta(current, previous);
            if (fromBaseline > 0.35) moved = true;
            stableFor = moved && fromPrevious < 0.025 ? stableFor + (now - previousAt) : 0;
            previous = current;
            previousAt = now;
            if (moved && stableFor >= CAMERA_CALIBRATION_STABLE_MS) {
              return { ...current, zoom: clamp(fallbackZoom, MIN_ZOOM, MAX_ZOOM) };
            }
          }
          return null;
        }

        async function calibrateCameraBeat(beat: CameraShotBeat): Promise<CameraPose> {
          const cacheKey = `${sceneUrl}|${beat.targetName.trim().toUpperCase()}`;
          const cached = cameraCalibrationCache.get(cacheKey);
          if (cached) return { ...cached, zoom: clamp(beat.zoom ?? cached.zoom, MIN_ZOOM, MAX_ZOOM) };

          const reference = resolve(beat.targetName);
          const fallbackReference = reference?.position
            ? referencePose(reference, beat, initialCameraPose)
            : null;
          const triggerName = cameraTriggerName(beat.targetName);
          const trigger = triggerName ? resolve(triggerName) : null;
          if (trigger?.uuid) {
            copyPose(productionCamera, initialCameraPose);
            app.setZoom(initialCameraPose.zoom);
            app.requestRender();
            await nextFrame();
            app.emitEvent('mouseDown', trigger.uuid);
            const calibrated = await waitForAuthoredCameraPose(beat);
            copyPose(productionCamera, initialCameraPose);
            app.setZoom(initialCameraPose.zoom);
            app.requestRender();
            await nextFrame();
            if (calibrated) {
              cameraCalibrationCache.set(cacheKey, calibrated);
              return calibrated;
            }
            if (fallbackReference) {
              console.warn(`Authored camera cue “${triggerName}” did not settle; using camera reference “${beat.targetName}” instead.`);
              cameraCalibrationCache.set(cacheKey, fallbackReference);
              return fallbackReference;
            }
            throw new Error(`Authored camera cue “${triggerName}” did not produce a stable camera pose and no fallback reference was available.`);
          }

          if (!fallbackReference) {
            throw new Error(`Shot camera reference “${beat.targetName}” is not available in the runtime scene.`);
          }
          cameraCalibrationCache.set(cacheKey, fallbackReference);
          return fallbackReference;
        }

        const cameraReferences: CameraReference[] = [];
        for (const beat of cameraBeats) {
          if (cancelled) return;
          cameraReferences.push({ beat, pose: await calibrateCameraBeat(beat) });
        }

        function cameraAt(elapsed: number) {
          let currentPose = initialCameraPose;
          for (const item of cameraReferences) {
            if (elapsed < item.beat.atMs) return currentPose;
            const duration = Math.max(0, finite(item.beat.transitionMs));
            if (duration > 0 && elapsed < item.beat.atMs + duration) {
              return interpolatePose(currentPose, item.pose, ease((elapsed - item.beat.atMs) / duration, item.beat.easing));
            }
            currentPose = item.pose;
          }
          return currentPose;
        }

        function zoomAt(elapsed: number, baseZoom: number) {
          let current = baseZoom;
          let previous = baseZoom;
          for (const beat of zoomBeats) {
            if (elapsed < beat.atMs) break;
            const target = clamp(finite(beat.value, current), MIN_ZOOM, MAX_ZOOM);
            const duration = Math.max(0, finite(beat.transitionMs));
            if (duration > 0 && elapsed < beat.atMs + duration) {
              return lerp(previous, target, ease((elapsed - beat.atMs) / duration, beat.easing));
            }
            current = target;
            previous = target;
          }
          return current;
        }

        function executeBeat(beat: ShotBeat, index: number) {
          if (executed.has(index)) return false;
          if (beat.type !== 'EVENT' && beat.type !== 'STATE' && beat.type !== 'VISIBILITY') return false;
          const object = resolve(beat.targetName);
          if (!object) throw new Error(`Shot target “${beat.targetName}” is not available in the runtime scene.`);
          if (beat.type === 'EVENT') app.emitEvent(beat.eventName as never, object.uuid);
          else if (beat.type === 'STATE') object.state = beat.stateValue;
          else if (typeof object.visible === 'boolean') object.visible = beat.visible;
          else throw new Error(`Visibility is not exposed for “${beat.targetName}”.`);
          executed.add(index);
          return true;
        }

        const openingPose = cameraAt(0);
        copyPose(productionCamera, openingPose);
        app.setZoom(zoomBeats.length > 0 ? clamp(zoomAt(0, openingPose.zoom), MIN_ZOOM, MAX_ZOOM) : openingPose.zoom);
        app.requestRender();
        await nextFrame();
        if (cancelled) return;

        previewCanvas.style.visibility = 'visible';
        setStatus('playing');
        const startedAt = performance.now();
        let lastProgressPaint = -PROGRESS_UPDATE_MS;
        let lastZoom = Number.NaN;

        const failPlayback = (cause: unknown) => {
          if (cancelled) return;
          if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
          frameRef.current = null;
          try { controlledApp.stop?.(); } catch {}
          const message = cause instanceof Error ? cause.message : 'Shot preview could not continue.';
          setError(message);
          setStatus('error');
          onError?.(message);
        };

        const tick = (now: number) => {
          if (cancelled) return;
          try {
            const elapsed = Math.min(shot.durationMs, Math.max(0, now - startedAt));
            const nextCameraPose = cameraAt(elapsed);
            copyPose(productionCamera, nextCameraPose);
            let dirty = true;

            const nextZoom = zoomBeats.length > 0
              ? clamp(zoomAt(elapsed, nextCameraPose.zoom), MIN_ZOOM, MAX_ZOOM)
              : nextCameraPose.zoom;
            if (!Number.isFinite(lastZoom) || Math.abs(nextZoom - lastZoom) > 0.0005) {
              app.setZoom(nextZoom);
              lastZoom = nextZoom;
            }

            executable.forEach(beat => {
              const index = beats.indexOf(beat);
              if (elapsed >= beat.atMs && executeBeat(beat, index)) dirty = true;
            });

            flowBeats.forEach((beat, index) => {
              if (elapsed < beat.atMs) return;
              const flow = getRuntimeFlow(beat.flowName);
              if (!flow) throw new Error(`Runtime flow “${beat.flowName}” is not registered.`);
              if (flowExecutor(flow, elapsed - beat.atMs, executedFlowSteps, `${index}:${flow.name}`)) dirty = true;
            });

            if (dirty) app.requestRender();
            if (elapsed - lastProgressPaint >= PROGRESS_UPDATE_MS || elapsed >= shot.durationMs) {
              lastProgressPaint = elapsed;
              if (progressBarRef.current) progressBarRef.current.style.transform = `scaleX(${clamp(shot.durationMs > 0 ? elapsed / shot.durationMs : 1, 0, 1)})`;
            }

            if (elapsed >= shot.durationMs) {
              if (progressBarRef.current) progressBarRef.current.style.transform = 'scaleX(1)';
              completeTimerRef.current = window.setTimeout(() => {
                if (cancelled) return;
                releaseRuntime();
                completeTimerRef.current = window.setTimeout(() => {
                  if (!cancelled) onComplete();
                }, PREVIEW_TEARDOWN_GRACE_MS);
              }, FINAL_FRAME_HOLD_MS);
              return;
            }

            frameRef.current = requestAnimationFrame(tick);
          } catch (cause) {
            failPlayback(cause);
          }
        };

        frameRef.current = requestAnimationFrame(tick);
      } catch (cause) {
        if (cancelled) return;
        previewCanvas.style.visibility = 'visible';
        const message = cause instanceof Error ? cause.message : 'Shot preview could not be started.';
        setError(message);
        setStatus('error');
        onError?.(message);
      }
    }

    void run();
    return () => {
      cancelled = true;
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      if (completeTimerRef.current !== null) window.clearTimeout(completeTimerRef.current);
      frameRef.current = null;
      completeTimerRef.current = null;
      releaseRuntime();
    };
  }, [shot, runToken, onComplete, onError]);

  return (
    <div className="shot-preview-overlay" role="dialog" aria-modal="true" aria-label={`Preview ${shot.name}`}>
      <div className="shot-preview-stage">
        <canvas ref={canvasRef} className="shot-preview-canvas" aria-hidden="true" />
      </div>
      <div className="shot-preview-topbar">
        <div>
          <span>{shot.shotKey} · REVISION {shot.revision}</span>
          <strong>{shot.name}</strong>
        </div>
        <button type="button" aria-label="Return to Spline Agent chat" onClick={onComplete}><X size={20} /></button>
      </div>
      {status === 'loading' && (
        <div className="shot-preview-center-status">
          <LoaderCircle size={30} className="spin" />
          <strong>Calibrating shot cameras…</strong>
        </div>
      )}
      {status === 'error' && (
        <div className="shot-preview-error">
          <strong>Preview could not run</strong>
          <span>{error}</span>
          <div>
            <button type="button" onClick={() => setRunToken(value => value + 1)}><RotateCcw size={16} /> Retry</button>
            <button type="button" onClick={onComplete}>Return to chat</button>
          </div>
        </div>
      )}
      <div className="shot-preview-progress" aria-hidden="true">
        <i ref={progressBarRef} />
      </div>
    </div>
  );
}
