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
import { runtimeVisualCenter } from '../lib/runtimeObjectFocus';
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
  getAllObjects?: () => unknown[];
  pauseGameControls?: () => void;
  setSize?: (width: number, height: number) => void;
  stop?: () => void;
};

type CameraReference = {
  beat: CameraShotBeat;
  trigger: RuntimeObject | null;
  pose: CameraPose | null;
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
  if (easing === 'easeInOut') {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }
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
  const values = [
    candidate.zoom,
    candidate.orthographicZoom,
    candidate.camera?.zoom,
    candidate.camera?.orthographicZoom
  ];
  const found = values.map(Number).find(value => Number.isFinite(value) && value >= MIN_ZOOM && value <= MAX_ZOOM);
  return found ?? fallback;
}

function cameraZoomFallback(cameraName: string, fallback: number) {
  const normalized = cameraName.trim().toUpperCase();
  if (normalized === 'CAM_LOGIN') return 0.42;
  if (normalized === 'CAM_CLIENT_REVEAL') return 0.30;
  return fallback;
}

function semanticCameraAnchorCandidates(cameraName: string) {
  const normalized = cameraName.trim().toUpperCase();
  if (normalized === 'CAM_LOGIN') {
    return ['PHONE_DEVICE', 'Phone / Device', 'PHONE', 'Phone'];
  }
  if (normalized === 'CAM_CLIENT_REVEAL') {
    return [
      'REQUEST ASSEMBLY',
      'Request Assembly',
      'REQUEST_ASSEMBLY',
      'RequestAssembly',
      'CLIENT_BOUNDARY',
      'Client Boundary',
      'CLIENT BOUNDARY'
    ];
  }
  return [];
}

function normalizeObjectName(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function semanticCameraAnchorTokens(cameraName: string) {
  const normalized = cameraName.trim().toUpperCase();
  if (normalized === 'CAM_LOGIN') return ['phone'];
  if (normalized === 'CAM_CLIENT_REVEAL') return ['request assembly', 'client boundary'];
  return [];
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

function referencePose(reference: RuntimeObject, beat: CameraShotBeat, productionBaseline: CameraPose): CameraPose {
  const fallbackZoom = cameraZoomFallback(beat.targetName, productionBaseline.zoom);
  const zoom = beat.zoom ?? runtimeZoom(reference, fallbackZoom);
  return {
    x: finite(reference.position?.x, productionBaseline.x),
    y: finite(reference.position?.y, productionBaseline.y),
    z: productionBaseline.z,
    rx: productionBaseline.rx,
    ry: productionBaseline.ry,
    rz: productionBaseline.rz,
    zoom: clamp(zoom, MIN_ZOOM, MAX_ZOOM)
  };
}

function semanticAnchorPose(anchor: RuntimeObject, beat: CameraShotBeat, productionBaseline: CameraPose): CameraPose {
  const center = runtimeVisualCenter(anchor);
  const zoom = beat.zoom ?? cameraZoomFallback(beat.targetName, productionBaseline.zoom);
  return {
    x: center.x,
    y: center.y,
    z: productionBaseline.z,
    rx: productionBaseline.rx,
    ry: productionBaseline.ry,
    rz: productionBaseline.rz,
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

function normalizeDirection(value: string) {
  return value.toLowerCase().replace('–', '-').replace('—', '-');
}

function shouldRunImplicitLoginFlow(shot: SplineShot) {
  const text = normalizeDirection(`${shot.name} ${shot.creatorPrompt ?? ''}`);
  const login = text.includes('login') || text.includes('phone') || text.includes('логин') || text.includes('телефон');
  const authoredMotion = text.includes('animation') || text.includes('анимац') || text.includes('existing') || text.includes('съществуващ') || text.includes('client boundary') || text.includes('request assembly');
  return login && authoredMotion;
}

function isPreviewUiControl(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest('.shot-preview-topbar button, .shot-preview-error button'));
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
      'pointerdown',
      'pointermove',
      'pointerup',
      'pointercancel',
      'touchstart',
      'touchmove',
      'touchend',
      'touchcancel',
      'mousedown',
      'mousemove',
      'mouseup',
      'click',
      'dblclick',
      'contextmenu',
      'wheel'
    ];

    window.addEventListener('keydown', escape);
    blockedEvents.forEach(eventName => {
      window.addEventListener(eventName, blockSceneInput as EventListener, { capture: true, passive: false });
    });

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', escape);
      blockedEvents.forEach(eventName => {
        window.removeEventListener(eventName, blockSceneInput as EventListener, true);
      });
    };
  }, [onComplete]);

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const previewCanvas: HTMLCanvasElement = canvas;

    const releaseRuntime = () => {
      const activeApp = appRef.current as RuntimeLookupApplication | null;
      if (activeApp) {
        try {
          activeApp.stop?.();
        } catch {
        }
        try {
          activeApp.dispose();
        } catch {
        }
      }
      appRef.current = null;
      previewCanvas.width = 1;
      previewCanvas.height = 1;
    };

    setStatus('loading');
    setError('');
    previewCanvas.width = PREVIEW_WIDTH;
    previewCanvas.height = PREVIEW_HEIGHT;
    if (progressBarRef.current) progressBarRef.current.style.transform = 'scaleX(0)';

    async function run() {
      try {
        const config = await loadSplineRuntimeConfig();
        if (cancelled || !config.configured || !config.sceneUrl.trim()) {
          if (!cancelled) throw new Error('No browser runtime scene is configured for shot preview.');
          return;
        }

        await delay(PREVIEW_BOOT_GRACE_MS);
        if (cancelled) return;

        const app = new Application(previewCanvas, { renderMode: 'auto', htmlContentMode: 'none' });
        appRef.current = app;
        await app.load(config.sceneUrl.trim());
        if (cancelled) return;

        const controlledApp = app as RuntimeLookupApplication;
        controlledApp.setSize?.(PREVIEW_WIDTH, PREVIEW_HEIGHT);
        controlledApp.pauseGameControls?.();
        app.play();
        await nextFrame();
        await nextFrame();
        if (cancelled) return;

        const resolve = (name: string) => {
          if (!name.trim() || typeof controlledApp.findObjectByName !== 'function') return null;
          return controlledApp.findObjectByName(name.trim()) as RuntimeObject | undefined ?? null;
        };

        const resolveSemanticAnchor = (cameraName: string) => {
          for (const candidate of semanticCameraAnchorCandidates(cameraName)) {
            const exact = resolve(candidate);
            if (exact?.position) return exact;
          }

          if (typeof controlledApp.getAllObjects !== 'function') return null;
          const tokens = semanticCameraAnchorTokens(cameraName);
          if (tokens.length === 0) return null;

          try {
            const objects = (controlledApp.getAllObjects() as RuntimeObject[]).filter(object => Boolean(object?.position && object?.name));
            const ranked = objects
              .map(object => {
                const name = normalizeObjectName(object.name ?? '');
                let score = 0;
                for (const token of tokens) {
                  if (name === token) score += 50;
                  else if (name.includes(token)) score += 24;
                }
                if (/text|label|icon|path|line|border|body/.test(name)) score -= 30;
                return { object, score };
              })
              .filter(entry => entry.score > 0)
              .sort((left, right) => right.score - left.score || left.object.name.localeCompare(right.object.name));
            return ranked[0]?.object ?? null;
          } catch {
            return null;
          }
        };

        const productionCamera = resolve(CAMERA_RIG_NAME);
        if (!productionCamera?.position || !productionCamera.rotation) {
          throw new Error(`${CAMERA_RIG_NAME} is not available in the runtime scene.`);
        }

        const beats = sortedBeats(shot.spec.beats);
        const cameraBeats = beats.filter((beat): beat is CameraShotBeat => beat.type === 'CAMERA');
        const zoomBeats = beats.filter((beat): beat is ZoomShotBeat => beat.type === 'ZOOM');
        const explicitFlowBeats = beats.filter((beat): beat is FlowShotBeat => beat.type === 'FLOW');
        const flowBeats: FlowShotBeat[] = explicitFlowBeats.length > 0
          ? explicitFlowBeats
          : shouldRunImplicitLoginFlow(shot)
            ? [{ type: 'FLOW', atMs: 250, flowName: 'EP001_LOGIN_FLOW' }]
            : [];
        const executable = beats.filter(beat => beat.type === 'EVENT' || beat.type === 'STATE' || beat.type === 'VISIBILITY');
        const executed = new Set<number>();
        const executedCameraCues = new Set<number>();
        const executedFlowSteps = new Set<string>();
        const flowExecutor = createRuntimeFlowExecutor(app);

        const initialCameraPose = pose(productionCamera, 0.12);
        const cameraReferences: CameraReference[] = cameraBeats.map(beat => {
          const semanticAnchor = resolveSemanticAnchor(beat.targetName);
          const semanticPose = semanticAnchor?.position
            ? semanticAnchorPose(semanticAnchor, beat, initialCameraPose)
            : null;
          const triggerName = semanticPose ? null : cameraTriggerName(beat.targetName);
          const trigger = triggerName ? resolve(triggerName) : null;
          const reference = semanticPose ? null : resolve(beat.targetName);
          const referenceCameraPose = semanticPose ?? (reference?.position && reference.rotation
            ? referencePose(reference, beat, initialCameraPose)
            : null);

          if (!trigger?.uuid && !referenceCameraPose) {
            throw new Error(`Shot camera reference “${beat.targetName}” is not available in the runtime scene.`);
          }

          return {
            beat,
            trigger: trigger?.uuid ? trigger : null,
            pose: referenceCameraPose
          };
        });

        const directCameraReferences = cameraReferences.filter(
          (item): item is CameraReference & { pose: CameraPose } => item.pose !== null && !item.trigger?.uuid
        );

        function directCameraAt(elapsed: number) {
          if (directCameraReferences.length === 0) return null;

          let previousPose = initialCameraPose;
          let currentPose = initialCameraPose;

          for (const item of directCameraReferences) {
            const beat = item.beat;
            const targetPose = item.pose;
            if (elapsed < beat.atMs) break;

            const duration = Math.max(0, finite(beat.transitionMs));
            if (duration > 0 && elapsed < beat.atMs + duration) {
              const amount = ease((elapsed - beat.atMs) / duration, beat.easing);
              return interpolatePose(previousPose, targetPose, amount);
            }

            currentPose = targetPose;
            previousPose = targetPose;
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
              const amount = ease((elapsed - beat.atMs) / duration, beat.easing);
              return lerp(previous, target, amount);
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

          if (beat.type === 'EVENT') {
            app.emitEvent(beat.eventName as never, object.uuid);
          } else if (beat.type === 'STATE') {
            object.state = beat.stateValue;
          } else if (typeof object.visible === 'boolean') {
            object.visible = beat.visible;
          } else {
            throw new Error(`Visibility is not exposed for “${beat.targetName}”.`);
          }
          executed.add(index);
          return true;
        }

        function executeCameraCue(index: number) {
          if (executedCameraCues.has(index)) return false;
          const item = cameraReferences[index];
          if (!item) return false;

          if (item.beat.atMs === 0 && item.pose) {
            executedCameraCues.add(index);
            return false;
          }

          executedCameraCues.add(index);
          if (!item.trigger?.uuid) return false;
          app.emitEvent('mouseDown', item.trigger.uuid);
          return true;
        }

        const openingCameraIndex = cameraReferences.findIndex(item => item.beat.atMs === 0 && item.pose !== null);
        if (openingCameraIndex >= 0) {
          const openingCamera = cameraReferences[openingCameraIndex];
          if (openingCamera.pose) {
            copyPose(productionCamera, openingCamera.pose);
            app.setZoom(openingCamera.pose.zoom);
            executedCameraCues.add(openingCameraIndex);
          }
        }

        cameraReferences.forEach((item, index) => {
          if (item.beat.atMs === 0 && index !== openingCameraIndex) executeCameraCue(index);
        });

        const firstDirectPose = directCameraAt(0);
        if (firstDirectPose) {
          copyPose(productionCamera, firstDirectPose);
          app.setZoom(firstDirectPose.zoom);
        }
        if (zoomBeats.length > 0) {
          app.setZoom(clamp(zoomAt(0, openingCameraIndex >= 0
            ? cameraReferences[openingCameraIndex].pose?.zoom ?? initialCameraPose.zoom
            : initialCameraPose.zoom), MIN_ZOOM, MAX_ZOOM));
        }
        app.requestRender();
        await nextFrame();
        if (cancelled) return;

        setStatus('playing');
        const startedAt = performance.now();
        let lastProgressPaint = -PROGRESS_UPDATE_MS;
        let lastZoom = Number.NaN;

        const failPlayback = (cause: unknown) => {
          if (cancelled) return;
          if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
          frameRef.current = null;
          try {
            controlledApp.stop?.();
          } catch {
          }
          const message = cause instanceof Error ? cause.message : 'Shot preview could not continue.';
          setError(message);
          setStatus('error');
          onError?.(message);
        };

        const tick = (now: number) => {
          if (cancelled) return;

          try {
            const elapsed = Math.min(shot.durationMs, Math.max(0, now - startedAt));
            let dirty = false;

            const directPose = directCameraAt(elapsed);
            if (directPose) {
              copyPose(productionCamera, directPose);
              dirty = true;
            }

            if (zoomBeats.length > 0) {
              const nextZoom = clamp(zoomAt(elapsed, initialCameraPose.zoom), MIN_ZOOM, MAX_ZOOM);
              if (!Number.isFinite(lastZoom) || Math.abs(nextZoom - lastZoom) > 0.0005) {
                app.setZoom(nextZoom);
                lastZoom = nextZoom;
                dirty = true;
              }
            }

            cameraReferences.forEach((item, index) => {
              if (elapsed >= item.beat.atMs && executeCameraCue(index)) dirty = true;
            });

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
              if (progressBarRef.current) {
                const progress = shot.durationMs > 0 ? elapsed / shot.durationMs : 1;
                progressBarRef.current.style.transform = `scaleX(${clamp(progress, 0, 1)})`;
              }
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
          <strong>Preparing 1920×1080 shot preview…</strong>
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
