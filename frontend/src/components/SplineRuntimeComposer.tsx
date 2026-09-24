import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Application } from '@splinetool/runtime';
import {
  Camera,
  Check,
  Copy,
  Download,
  Film,
  LoaderCircle,
  Move3d,
  Play,
  Plus,
  RefreshCw,
  Shapes,
  Square,
  WandSparkles
} from 'lucide-react';
import { loadSplineRuntimeConfig } from '../api/mediaOsApi';
import type { RuntimeObject } from '../lib/runtimeSceneProof';
import { EpisodeSceneCompositor } from './EpisodeSceneCompositor';
import '../styles/splineRuntimeComposer.css';
import '../styles/runtime2dNavigation.css';

type ActionMode = 'create' | 'edit' | 'animate' | 'frame' | 'export';

type RuntimeStatus = {
  tone: 'neutral' | 'working' | 'success' | 'error';
  text: string;
};

type Vector3Like = {
  x?: number;
  y?: number;
  z?: number;
};

type Vector3 = { x: number; y: number; z: number };

type NavigationRootBaseline = {
  uuid: string;
  x: number;
  y: number;
  z: number;
};

type PointerPoint = { x: number; y: number };

type PinchGesture = {
  distance: number;
  zoom: number;
  midpoint: PointerPoint;
};

const ACTIONS: Array<{
  id: ActionMode;
  label: string;
  description: string;
  icon: typeof Plus;
}> = [
  { id: 'create', label: 'Create', description: 'Clone a reusable template or duplicate an object.', icon: Plus },
  { id: 'edit', label: 'Edit', description: 'Rename, move and show or hide an object.', icon: Move3d },
  { id: 'animate', label: 'Animate', description: 'Set an object state or trigger an authored event.', icon: WandSparkles },
  { id: 'frame', label: 'Frame', description: 'Adjust the live view for the shot.', icon: Camera },
  { id: 'export', label: 'Export', description: 'Save a still frame or record the live browser canvas.', icon: Download }
];

const EVENT_TYPES = ['mouseDown', 'mouseHover', 'mouseUp', 'keyDown', 'keyUp', 'start', 'lookAt', 'follow', 'scroll'];
const DEFAULT_OVERVIEW_ZOOM = 0.12;
const DEFAULT_FOCUS_ZOOM = 0.42;
const MIN_VIEW_ZOOM = 0.08;
const MAX_VIEW_ZOOM = 3;
const PAN_WORLD_UNITS_AT_ZOOM_1 = 0.34;
const SYSTEM_NAME_HINTS = ['camera', 'light', 'lighting', 'environment', 'background'];
const GLOBAL_CONTAINER_HINTS = ['scene', 'world', 'root'];

function numberValue(value: string, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function safeFileName(value: string) {
  const normalized = value.trim().replace(/[^a-z0-9-_]+/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return normalized || 'spline-scene';
}

function chooseRecordingMimeType() {
  const candidates = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm'
  ];
  return candidates.find(type => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) ?? '';
}

function rotateXYZ(point: Vector3, rotation: Vector3Like | null | undefined): Vector3 {
  const rx = Number(rotation?.x) || 0;
  const ry = Number(rotation?.y) || 0;
  const rz = Number(rotation?.z) || 0;

  let x = point.x;
  let y = point.y;
  let z = point.z;

  if (rx !== 0) {
    const cos = Math.cos(rx);
    const sin = Math.sin(rx);
    const nextY = y * cos - z * sin;
    const nextZ = y * sin + z * cos;
    y = nextY;
    z = nextZ;
  }

  if (ry !== 0) {
    const cos = Math.cos(ry);
    const sin = Math.sin(ry);
    const nextX = x * cos + z * sin;
    const nextZ = -x * sin + z * cos;
    x = nextX;
    z = nextZ;
  }

  if (rz !== 0) {
    const cos = Math.cos(rz);
    const sin = Math.sin(rz);
    const nextX = x * cos - y * sin;
    const nextY = x * sin + y * cos;
    x = nextX;
    y = nextY;
  }

  return { x, y, z };
}

function runtimeWorldPosition(object: RuntimeObject): Vector3 {
  let point: Vector3 = {
    x: Number(object.position?.x) || 0,
    y: Number(object.position?.y) || 0,
    z: Number(object.position?.z) || 0
  };

  let parent = object.parent ?? null;
  let depth = 0;
  const visited = new Set<string>();

  while (parent && depth < 64 && !visited.has(parent.uuid)) {
    visited.add(parent.uuid);

    const scale = parent.scale as Vector3Like | undefined;
    point = {
      x: point.x * (Number(scale?.x) || 1),
      y: point.y * (Number(scale?.y) || 1),
      z: point.z * (Number(scale?.z) || 1)
    };

    point = rotateXYZ(point, parent.rotation as Vector3Like | undefined);
    point = {
      x: point.x + (Number(parent.position?.x) || 0),
      y: point.y + (Number(parent.position?.y) || 0),
      z: point.z + (Number(parent.position?.z) || 0)
    };

    parent = parent.parent ?? null;
    depth += 1;
  }

  return point;
}

function normalizedIdentity(object: RuntimeObject) {
  return `${object.name ?? ''} ${object.type ?? ''}`.trim().toLowerCase();
}

function isSystemObject(object: RuntimeObject) {
  const identity = normalizedIdentity(object);
  return SYSTEM_NAME_HINTS.some(hint => identity.includes(hint));
}

function isGlobalContainer(object: RuntimeObject) {
  const identity = normalizedIdentity(object);
  return GLOBAL_CONTAINER_HINTS.some(hint => identity === hint || identity.startsWith(`${hint} `) || identity.endsWith(` ${hint}`));
}

function hasPosition(object: RuntimeObject) {
  return Boolean(object.position && Number.isFinite(Number(object.position.x)) && Number.isFinite(Number(object.position.y)));
}

function uniqueObjects(objects: RuntimeObject[]) {
  const seen = new Set<string>();
  return objects.filter(object => {
    if (!object?.uuid || seen.has(object.uuid)) return false;
    seen.add(object.uuid);
    return true;
  });
}

function collectNavigationRoots(objects: RuntimeObject[]) {
  const objectIds = new Set(objects.map(object => object.uuid));
  const structuralRoots = objects.filter(object => !object.parent || !objectIds.has(object.parent.uuid));

  let candidates = structuralRoots;
  if (structuralRoots.length === 1 && (structuralRoots[0].children?.length ?? 0) > 0) {
    candidates = structuralRoots[0].children as RuntimeObject[];
  }

  const expanded: RuntimeObject[] = [];
  for (const candidate of candidates) {
    if (isGlobalContainer(candidate) && (candidate.children?.length ?? 0) > 0) {
      expanded.push(...(candidate.children as RuntimeObject[]));
    } else {
      expanded.push(candidate);
    }
  }

  const navigable = uniqueObjects(expanded)
    .filter(hasPosition)
    .filter(object => !isSystemObject(object));

  if (navigable.length > 0) return navigable;

  return uniqueObjects(objects.filter(object => !object.parent && hasPosition(object) && !isSystemObject(object)));
}

function isDescendantOfAny(object: RuntimeObject, rootIds: Set<string>) {
  let current: RuntimeObject | null | undefined = object;
  let depth = 0;
  const visited = new Set<string>();

  while (current && depth < 96 && !visited.has(current.uuid)) {
    if (rootIds.has(current.uuid)) return true;
    visited.add(current.uuid);
    current = current.parent ?? null;
    depth += 1;
  }

  return false;
}

function diagramCenter(objects: RuntimeObject[], navigationRoots: RuntimeObject[]) {
  if (navigationRoots.length === 0) return { x: 0, y: 0, z: 0 };

  const rootIds = new Set(navigationRoots.map(root => root.uuid));
  const candidates = objects.filter(object =>
    object.visible !== false &&
    hasPosition(object) &&
    !isSystemObject(object) &&
    isDescendantOfAny(object, rootIds)
  );

  const source = candidates.length > 0 ? candidates : navigationRoots;
  const points = source.map(runtimeWorldPosition);
  const xs = points.map(point => point.x);
  const ys = points.map(point => point.y);
  const zs = points.map(point => point.z);

  return {
    x: (Math.min(...xs) + Math.max(...xs)) / 2,
    y: (Math.min(...ys) + Math.max(...ys)) / 2,
    z: (Math.min(...zs) + Math.max(...zs)) / 2
  };
}

function pointerDistance(left: PointerPoint, right: PointerPoint) {
  return Math.hypot(right.x - left.x, right.y - left.y);
}

function pointerMidpoint(left: PointerPoint, right: PointerPoint): PointerPoint {
  return {
    x: (left.x + right.x) / 2,
    y: (left.y + right.y) / 2
  };
}

export function SplineRuntimeComposer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const appRef = useRef<Application | null>(null);
  const navigationRootsRef = useRef<RuntimeObject[]>([]);
  const navigationBaselinesRef = useRef<NavigationRootBaseline[]>([]);
  const navigationCenterRef = useRef<Vector3>({ x: 0, y: 0, z: 0 });
  const pointersRef = useRef<Map<number, PointerPoint>>(new Map());
  const panLastRef = useRef<PointerPoint | null>(null);
  const pinchRef = useRef<PinchGesture | null>(null);
  const navigationDirtyRef = useRef(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingNameRef = useRef('spline-scene');

  const [activeAction, setActiveAction] = useState<ActionMode>('create');
  const [sceneUrl, setSceneUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [objects, setObjects] = useState<RuntimeObject[]>([]);
  const [selectedUuid, setSelectedUuid] = useState('');
  const [status, setStatus] = useState<RuntimeStatus>({ tone: 'working', text: 'Loading the live scene…' });
  const [sceneRevision, setSceneRevision] = useState(0);

  const [templateUuid, setTemplateUuid] = useState('');
  const [newName, setNewName] = useState('');
  const [offsetX, setOffsetX] = useState('360');
  const [offsetY, setOffsetY] = useState('0');
  const [offsetZ, setOffsetZ] = useState('0');

  const [editName, setEditName] = useState('');
  const [editX, setEditX] = useState('0');
  const [editY, setEditY] = useState('0');
  const [editZ, setEditZ] = useState('0');
  const [editVisible, setEditVisible] = useState(true);

  const [stateValue, setStateValue] = useState('1');
  const [eventType, setEventType] = useState('mouseDown');
  const [zoom, setZoom] = useState(String(DEFAULT_OVERVIEW_ZOOM));
  const [recording, setRecording] = useState(false);

  const namedObjects = useMemo(
    () => [...objects]
      .filter(object => Boolean(object.name?.trim()))
      .sort((left, right) => left.name.localeCompare(right.name) || left.uuid.localeCompare(right.uuid)),
    [objects]
  );

  const selectedObject = useMemo(
    () => objects.find(object => object.uuid === selectedUuid) ?? null,
    [objects, selectedUuid]
  );

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const config = await loadSplineRuntimeConfig();
        if (cancelled) return;
        if (!config.configured || !config.sceneUrl.trim()) {
          setLoading(false);
          setStatus({ tone: 'error', text: 'No browser runtime scene is configured yet.' });
          return;
        }
        setSceneUrl(config.sceneUrl.trim());
        await loadScene(config.sceneUrl.trim());
      } catch (error) {
        if (!cancelled) {
          setLoading(false);
          setStatus({ tone: 'error', text: error instanceof Error ? error.message : 'Could not load the live Spline scene.' });
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== 'inactive') recorder.stop();
      appRef.current?.dispose();
      appRef.current = null;
      navigationRootsRef.current = [];
      navigationBaselinesRef.current = [];
      pointersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (!selectedObject) return;
    setEditName(selectedObject.name ?? '');
    setEditX(String(selectedObject.position.x));
    setEditY(String(selectedObject.position.y));
    setEditZ(String(selectedObject.position.z));
    setEditVisible(selectedObject.visible !== false);
  }, [selectedObject]);

  function refreshObjectList(app = appRef.current) {
    if (!app) return [];
    const next = app.getAllObjects() as RuntimeObject[];
    setObjects(next);
    return next;
  }

  function markManualSceneChange() {
    setSceneRevision(value => value + 1);
  }

  function captureNavigationBaseline(nextObjects: RuntimeObject[]) {
    const roots = collectNavigationRoots(nextObjects);
    navigationRootsRef.current = roots;
    navigationBaselinesRef.current = roots.map(root => ({
      uuid: root.uuid,
      x: Number(root.position.x) || 0,
      y: Number(root.position.y) || 0,
      z: Number(root.position.z) || 0
    }));
    navigationCenterRef.current = diagramCenter(nextObjects, roots);
  }

  function currentNavigationRoots() {
    const ids = new Set(navigationBaselinesRef.current.map(item => item.uuid));
    const current = objects.filter(object => ids.has(object.uuid));
    if (current.length > 0) {
      navigationRootsRef.current = current;
      return current;
    }

    const found = collectNavigationRoots(objects);
    navigationRootsRef.current = found;
    return found;
  }

  function restoreNavigationRoots() {
    const rootsById = new Map(currentNavigationRoots().map(root => [root.uuid, root]));
    let restored = 0;

    for (const baseline of navigationBaselinesRef.current) {
      const root = rootsById.get(baseline.uuid);
      if (!root) continue;
      root.position.x = baseline.x;
      root.position.y = baseline.y;
      root.position.z = baseline.z;
      restored += 1;
    }

    return restored;
  }

  function translateNavigationRoots(deltaX: number, deltaY: number) {
    const roots = currentNavigationRoots();
    if (roots.length === 0) return false;

    for (const root of roots) {
      root.position.x += deltaX;
      root.position.y += deltaY;
    }

    return true;
  }

  async function loadScene(url = sceneUrl) {
    const canvas = canvasRef.current;
    if (!canvas || !url.trim()) return;

    setLoading(true);
    setLoaded(false);
    setStatus({ tone: 'working', text: 'Loading the live scene…' });

    try {
      appRef.current?.dispose();
      const app = new Application(canvas, { renderMode: 'auto', htmlContentMode: 'none' });
      appRef.current = app;

      await app.load(url.trim());
      app.play();
      app.setZoom(DEFAULT_OVERVIEW_ZOOM);

      const next = refreshObjectList(app);
      captureNavigationBaseline(next);

      const firstNamed = next.find(object => Boolean(object.name?.trim()));
      setSelectedUuid(firstNamed?.uuid ?? '');
      setTemplateUuid(firstNamed?.uuid ?? '');
      setZoom(String(DEFAULT_OVERVIEW_ZOOM));
      setLoaded(true);
      markManualSceneChange();

      setStatus({
        tone: 'success',
        text: `Full architecture overview ready · ${next.length} objects · ${navigationRootsRef.current.length} movable diagram groups.`
      });
    } catch (error) {
      setStatus({ tone: 'error', text: error instanceof Error ? error.message : 'The browser runtime scene could not be loaded.' });
    } finally {
      setLoading(false);
    }
  }

  function requireSelectedObject() {
    if (!selectedObject) {
      setStatus({ tone: 'error', text: 'Choose an object first.' });
      return null;
    }
    return selectedObject;
  }

  function uniqueName(candidate: string, ignoreUuid?: string) {
    const normalized = candidate.trim();
    if (!normalized) return false;
    return !objects.some(object => object.uuid !== ignoreUuid && object.name === normalized);
  }

  function restoreOverview() {
    const app = appRef.current;
    if (!app) return;

    restoreNavigationRoots();
    app.setZoom(DEFAULT_OVERVIEW_ZOOM);
    app.play();
    app.requestRender();
    setZoom(String(DEFAULT_OVERVIEW_ZOOM));
    markManualSceneChange();
    setStatus({ tone: 'success', text: 'Full architecture overview restored.' });
  }

  function focusObject(object: RuntimeObject) {
    const app = appRef.current;
    if (!app) return false;

    restoreNavigationRoots();
    const roots = currentNavigationRoots();
    const rootIds = new Set(roots.map(root => root.uuid));

    if (!isDescendantOfAny(object, rootIds)) {
      setStatus({ tone: 'error', text: `${object.name || 'Selected object'} is not part of the movable architecture groups.` });
      return false;
    }

    const center = navigationCenterRef.current;
    const target = runtimeWorldPosition(object);
    const translated = translateNavigationRoots(center.x - target.x, center.y - target.y);
    if (!translated) {
      setStatus({ tone: 'error', text: 'Could not move the architecture groups for focus.' });
      return false;
    }

    app.setZoom(DEFAULT_FOCUS_ZOOM);
    app.play();
    app.requestRender();
    setZoom(String(DEFAULT_FOCUS_ZOOM));
    markManualSceneChange();
    setStatus({ tone: 'success', text: `Focused on ${object.name || 'selected object'} · ${DEFAULT_FOCUS_ZOOM.toFixed(2)}×.` });
    return true;
  }

  function selectObject(uuid: string) {
    setSelectedUuid(uuid);
    if (!uuid || recording) return;
    const object = objects.find(candidate => candidate.uuid === uuid);
    if (object) focusObject(object);
  }

  function createFromTemplate() {
    const app = appRef.current;
    const source = objects.find(object => object.uuid === templateUuid);
    const targetName = newName.trim();

    if (!app || !source) {
      setStatus({ tone: 'error', text: 'Choose a template object first.' });
      return;
    }
    if (!uniqueName(targetName)) {
      setStatus({ tone: 'error', text: 'Give the new object a unique name.' });
      return;
    }

    try {
      const clone = app.cloneObject(source, {
        position: [
          source.position.x + numberValue(offsetX),
          source.position.y + numberValue(offsetY),
          source.position.z + numberValue(offsetZ)
        ]
      }) as RuntimeObject;

      clone.name = targetName;
      refreshObjectList(app);
      setSelectedUuid(clone.uuid);
      markManualSceneChange();
      window.requestAnimationFrame(() => focusObject(clone));
      setStatus({ tone: 'success', text: `${source.name} was cloned as ${targetName}.` });
    } catch (error) {
      setStatus({ tone: 'error', text: error instanceof Error ? error.message : 'Could not create the runtime object.' });
    }
  }

  function duplicateSelected() {
    const app = appRef.current;
    const source = requireSelectedObject();
    if (!app || !source) return;

    let suffix = 2;
    let candidate = `${source.name || 'Object'} Copy`;
    while (!uniqueName(candidate)) {
      candidate = `${source.name || 'Object'} Copy ${suffix}`;
      suffix += 1;
    }

    try {
      const clone = app.cloneObject(source, {
        position: [source.position.x + 320, source.position.y, source.position.z]
      }) as RuntimeObject;
      clone.name = candidate;
      refreshObjectList(app);
      setSelectedUuid(clone.uuid);
      markManualSceneChange();
      window.requestAnimationFrame(() => focusObject(clone));
      setStatus({ tone: 'success', text: `${source.name || 'Object'} duplicated as ${candidate}.` });
    } catch (error) {
      setStatus({ tone: 'error', text: error instanceof Error ? error.message : 'Could not duplicate the selected object.' });
    }
  }

  function applyEdit() {
    const object = requireSelectedObject();
    if (!object) return;
    const targetName = editName.trim();

    if (!uniqueName(targetName, object.uuid)) {
      setStatus({ tone: 'error', text: 'Object names must stay unique in the working scene.' });
      return;
    }

    try {
      object.name = targetName;
      object.position.x = numberValue(editX, object.position.x);
      object.position.y = numberValue(editY, object.position.y);
      object.position.z = numberValue(editZ, object.position.z);
      if (typeof object.visible === 'boolean') object.visible = editVisible;
      refreshObjectList();
      markManualSceneChange();
      setStatus({ tone: 'success', text: `${targetName} updated in the live scene.` });
    } catch (error) {
      setStatus({ tone: 'error', text: error instanceof Error ? error.message : 'Could not update the selected object.' });
    }
  }

  function applyState() {
    const app = appRef.current;
    const object = requireSelectedObject();
    if (!app || !object) return;

    const raw = stateValue.trim();
    if (!raw) {
      setStatus({ tone: 'error', text: 'Enter a state name or state index.' });
      return;
    }

    const numeric = Number(raw);
    const value: string | number = Number.isFinite(numeric) && /^-?\d+(\.\d+)?$/.test(raw) ? numeric : raw;

    try {
      app.play();
      object.state = value;
      refreshObjectList();
      markManualSceneChange();
      setStatus({ tone: 'success', text: `${object.name || 'Object'} state set to ${raw}.` });
    } catch (error) {
      setStatus({ tone: 'error', text: error instanceof Error ? error.message : 'Could not set the selected state.' });
    }
  }

  function triggerEvent() {
    const app = appRef.current;
    const object = requireSelectedObject();
    if (!app || !object) return;

    try {
      app.play();
      const emitter = app.emitEvent as unknown as (name: string, target: string) => void;
      emitter(eventType, object.uuid);
      markManualSceneChange();
      setStatus({ tone: 'success', text: `${eventType} animation triggered on ${object.name || 'the selected object'}.` });
    } catch (error) {
      setStatus({ tone: 'error', text: error instanceof Error ? error.message : 'Could not trigger the authored animation.' });
    }
  }

  function applyZoom(nextValue = zoom) {
    const app = appRef.current;
    if (!app) return;

    const value = clamp(numberValue(nextValue, DEFAULT_OVERVIEW_ZOOM), MIN_VIEW_ZOOM, MAX_VIEW_ZOOM);
    setZoom(String(value));
    app.setZoom(value);
    app.play();
    app.requestRender();
    markManualSceneChange();
    setStatus({ tone: 'success', text: `View zoom set to ${value.toFixed(2)}×.` });
  }

  function panNavigationRoots(deltaX: number, deltaY: number, zoomValue: number) {
    const worldUnitsPerPixel = PAN_WORLD_UNITS_AT_ZOOM_1 / Math.max(MIN_VIEW_ZOOM, zoomValue);
    return translateNavigationRoots(deltaX * worldUnitsPerPixel, -deltaY * worldUnitsPerPixel);
  }

  function beginPointer(event: ReactPointerEvent<HTMLDivElement>) {
    if (!loaded || recording) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    const points = [...pointersRef.current.values()];
    if (points.length === 1) {
      panLastRef.current = points[0];
      pinchRef.current = null;
      return;
    }

    if (points.length >= 2) {
      const [left, right] = points;
      pinchRef.current = {
        distance: Math.max(1, pointerDistance(left, right)),
        zoom: numberValue(zoom, DEFAULT_OVERVIEW_ZOOM),
        midpoint: pointerMidpoint(left, right)
      };
      panLastRef.current = null;
    }
  }

  function movePointer(event: ReactPointerEvent<HTMLDivElement>) {
    if (!pointersRef.current.has(event.pointerId) || recording) return;

    event.preventDefault();
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    const app = appRef.current;
    if (!app) return;

    const points = [...pointersRef.current.values()];
    if (points.length === 1) {
      const current = points[0];
      const previous = panLastRef.current ?? current;
      const dx = current.x - previous.x;
      const dy = current.y - previous.y;

      if (Math.abs(dx) + Math.abs(dy) > 0 && panNavigationRoots(dx, dy, numberValue(zoom, DEFAULT_OVERVIEW_ZOOM))) {
        navigationDirtyRef.current = true;
        app.play();
        app.requestRender();
      }

      panLastRef.current = current;
      pinchRef.current = null;
      return;
    }

    if (points.length >= 2) {
      const [left, right] = points;
      const distance = Math.max(1, pointerDistance(left, right));
      const midpoint = pointerMidpoint(left, right);
      const gesture = pinchRef.current ?? {
        distance,
        zoom: numberValue(zoom, DEFAULT_OVERVIEW_ZOOM),
        midpoint
      };

      const nextZoom = clamp(gesture.zoom * (distance / gesture.distance), MIN_VIEW_ZOOM, MAX_VIEW_ZOOM);
      const panDx = midpoint.x - gesture.midpoint.x;
      const panDy = midpoint.y - gesture.midpoint.y;

      panNavigationRoots(panDx, panDy, nextZoom);
      app.setZoom(nextZoom);
      app.play();
      app.requestRender();
      setZoom(String(nextZoom));
      navigationDirtyRef.current = true;
      pinchRef.current = { distance, zoom: nextZoom, midpoint };
      panLastRef.current = null;
    }
  }

  function endPointer(event: ReactPointerEvent<HTMLDivElement>) {
    pointersRef.current.delete(event.pointerId);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const points = [...pointersRef.current.values()];
    if (points.length === 1) {
      panLastRef.current = points[0];
      pinchRef.current = null;
    } else if (points.length === 0) {
      panLastRef.current = null;
      pinchRef.current = null;

      if (navigationDirtyRef.current) {
        navigationDirtyRef.current = false;
        markManualSceneChange();
        setStatus({ tone: 'neutral', text: `2D view adjusted · ${numberValue(zoom, DEFAULT_OVERVIEW_ZOOM).toFixed(2)}×.` });
      }
    }
  }

  function downloadBlob(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function exportPng() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob(blob => {
      if (!blob) {
        setStatus({ tone: 'error', text: 'The browser could not create a PNG from the current frame.' });
        return;
      }
      downloadBlob(blob, `${safeFileName(selectedObject?.name || 'spline-scene')}.png`);
      setStatus({ tone: 'success', text: 'Current frame exported as PNG.' });
    }, 'image/png');
  }

  function startRecording(fileBase = selectedObject?.name || 'spline-scene') {
    const canvas = canvasRef.current;
    if (!canvas || typeof MediaRecorder === 'undefined' || typeof canvas.captureStream !== 'function') {
      setStatus({ tone: 'error', text: 'This browser does not support live canvas recording.' });
      return false;
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') return false;

    try {
      const stream = canvas.captureStream(60);
      const mimeType = chooseRecordingMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      recordingNameRef.current = safeFileName(fileBase);
      recordingChunksRef.current = [];
      recorder.ondataavailable = event => {
        if (event.data.size > 0) recordingChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(recordingChunksRef.current, { type: recorder.mimeType || 'video/webm' });
        downloadBlob(blob, `${recordingNameRef.current}.webm`);
        recordingChunksRef.current = [];
        recorder.stream.getTracks().forEach(track => track.stop());
        recorderRef.current = null;
        setRecording(false);
        setStatus({ tone: 'success', text: 'Runtime clip saved. The temporary scene can now be discarded.' });
      };
      recorderRef.current = recorder;
      recorder.start(250);
      setRecording(true);
      setStatus({ tone: 'working', text: 'Recording the live browser scene…' });
      return true;
    } catch (error) {
      setStatus({ tone: 'error', text: error instanceof Error ? error.message : 'Could not start browser recording.' });
      return false;
    }
  }

  function stopRecording() {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;
    recorder.stop();
  }

  function pauseRecording() {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== 'recording') return;
    recorder.pause();
  }

  function resumeRecording() {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== 'paused') return;
    recorder.resume();
  }

  return (
    <section className="runtime-composer-card">
      <div className="runtime-composer-heading">
        <div>
          <span>LIVE WORKING SCENE</span>
          <strong>Build the temporary episode scene in the browser</strong>
          <small>Create, edit, animate, frame and export without saving changes back to the master Spline file.</small>
        </div>

        <button className="runtime-scene-reload" disabled={loading || !sceneUrl || recording} onClick={() => void loadScene()}>
          <RefreshCw size={15} className={loading ? 'spin' : ''} />
          Reload scene
        </button>
      </div>

      <div className="runtime-composer-layout">
        <div className="runtime-stage-column">
          <div className="runtime-stage-frame">
            <canvas ref={canvasRef} className="runtime-stage-canvas" />

            {loaded && !recording && (
              <div
                className="runtime-2d-navigation-surface"
                onPointerDown={beginPointer}
                onPointerMove={movePointer}
                onPointerUp={endPointer}
                onPointerCancel={endPointer}
                aria-label="2D scene navigation: drag with one finger or pointer to pan, pinch with two fingers to zoom"
              >
                <span className="runtime-navigation-hint">1 finger pan · 2 finger zoom</span>
              </div>
            )}

            {!loaded && (
              <div className="runtime-stage-empty">
                {loading ? <LoaderCircle size={25} className="spin" /> : <Shapes size={25} />}
                <strong>{loading ? 'Loading scene…' : 'Scene unavailable'}</strong>
                <span>{status.text}</span>
              </div>
            )}

            {loaded && (
              <div className="runtime-stage-badge">
                <span>{recording ? 'REC' : 'LIVE'}</span>
                <strong>{objects.length} objects</strong>
              </div>
            )}
          </div>

          <label className="runtime-object-picker">
            <span>Selected object</span>
            <select value={selectedUuid} onChange={event => selectObject(event.target.value)} disabled={!loaded || recording}>
              <option value="">Choose object…</option>
              {namedObjects.map(object => (
                <option key={object.uuid} value={object.uuid}>
                  {object.name} · {object.uuid.slice(0, 8)}
                </option>
              ))}
            </select>
          </label>

          <div className="runtime-shot-presets runtime-navigation-actions">
            <button disabled={!loaded || recording} onClick={restoreOverview}>
              <Shapes size={15} /> Full overview
            </button>
            <button disabled={!selectedObject || recording} onClick={() => selectedObject && focusObject(selectedObject)}>
              <Camera size={15} /> Focus selected
            </button>
          </div>

          <p className="runtime-action-note runtime-navigation-note">
            The viewport stays flat. One finger moves the complete architecture map and two fingers only zoom. Focus selected moves every diagram group together so components from different scene branches stay aligned.
          </p>

          <div className={`runtime-status ${status.tone}`}>
            {status.tone === 'success'
              ? <Check size={15} />
              : status.tone === 'working'
                ? <LoaderCircle size={15} className="spin" />
                : <Square size={13} />}
            <span>{status.text}</span>
          </div>
        </div>

        <div className="runtime-actions-column">
          <div className="runtime-action-tabs" role="tablist" aria-label="Spline runtime actions">
            {ACTIONS.map(action => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  className={activeAction === action.id ? 'active' : ''}
                  onClick={() => setActiveAction(action.id)}
                  role="tab"
                  aria-selected={activeAction === action.id}
                >
                  <Icon size={17} />
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>

          <div className="runtime-action-panel">
            <div className="runtime-action-intro">
              <strong>{ACTIONS.find(action => action.id === activeAction)?.label}</strong>
              <span>{ACTIONS.find(action => action.id === activeAction)?.description}</span>
            </div>

            {activeAction === 'create' && (
              <div className="runtime-form-stack">
                <label>
                  <span>Template</span>
                  <select value={templateUuid} onChange={event => setTemplateUuid(event.target.value)} disabled={recording}>
                    <option value="">Choose template…</option>
                    {namedObjects.map(object => <option key={object.uuid} value={object.uuid}>{object.name}</option>)}
                  </select>
                </label>
                <label>
                  <span>New name</span>
                  <input value={newName} onChange={event => setNewName(event.target.value)} placeholder="Token Service" disabled={recording} />
                </label>
                <div className="runtime-vector-grid">
                  <label><span>X offset</span><input value={offsetX} onChange={event => setOffsetX(event.target.value)} inputMode="decimal" disabled={recording} /></label>
                  <label><span>Y offset</span><input value={offsetY} onChange={event => setOffsetY(event.target.value)} inputMode="decimal" disabled={recording} /></label>
                  <label><span>Z offset</span><input value={offsetZ} onChange={event => setOffsetZ(event.target.value)} inputMode="decimal" disabled={recording} /></label>
                </div>
                <button className="runtime-primary-action" disabled={!loaded || recording} onClick={createFromTemplate}>
                  <Plus size={16} /> Create from template
                </button>
                <button className="runtime-secondary-action" disabled={!selectedObject || recording} onClick={duplicateSelected}>
                  <Copy size={16} /> Duplicate selected
                </button>
              </div>
            )}

            {activeAction === 'edit' && (
              <div className="runtime-form-stack">
                <label><span>Name</span><input value={editName} onChange={event => setEditName(event.target.value)} disabled={!selectedObject || recording} /></label>
                <div className="runtime-vector-grid">
                  <label><span>X</span><input value={editX} onChange={event => setEditX(event.target.value)} inputMode="decimal" disabled={!selectedObject || recording} /></label>
                  <label><span>Y</span><input value={editY} onChange={event => setEditY(event.target.value)} inputMode="decimal" disabled={!selectedObject || recording} /></label>
                  <label><span>Z</span><input value={editZ} onChange={event => setEditZ(event.target.value)} inputMode="decimal" disabled={!selectedObject || recording} /></label>
                </div>
                <label className="runtime-toggle-row">
                  <input type="checkbox" checked={editVisible} onChange={event => setEditVisible(event.target.checked)} disabled={!selectedObject || recording || typeof selectedObject.visible !== 'boolean'} />
                  <span>Visible in scene</span>
                </label>
                <button className="runtime-primary-action" disabled={!selectedObject || recording} onClick={applyEdit}>
                  <Move3d size={16} /> Apply edit
                </button>
              </div>
            )}

            {activeAction === 'animate' && (
              <div className="runtime-form-stack">
                <label>
                  <span>State name or index</span>
                  <input value={stateValue} onChange={event => setStateValue(event.target.value)} placeholder="ACTIVE or 1" disabled={!selectedObject || recording} />
                </label>
                <button className="runtime-primary-action" disabled={!selectedObject || recording} onClick={applyState}>
                  <WandSparkles size={16} /> Set state
                </button>
                <div className="runtime-divider"><span>or trigger authored event</span></div>
                <label>
                  <span>Event</span>
                  <select value={eventType} onChange={event => setEventType(event.target.value)} disabled={!selectedObject || recording}>
                    {EVENT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </label>
                <button className="runtime-secondary-action" disabled={!selectedObject || recording} onClick={triggerEvent}>
                  <Play size={16} /> Run animation
                </button>
              </div>
            )}

            {activeAction === 'frame' && (
              <div className="runtime-form-stack">
                <div className="runtime-shot-presets">
                  <button disabled={recording} onClick={restoreOverview}>Overview</button>
                  <button disabled={!selectedObject || recording} onClick={() => selectedObject && focusObject(selectedObject)}>Selected</button>
                  <button disabled={recording} onClick={() => applyZoom('0.7')}>Close</button>
                </div>
                <label>
                  <span>View zoom · {numberValue(zoom, DEFAULT_OVERVIEW_ZOOM).toFixed(2)}×</span>
                  <input
                    type="range"
                    min={MIN_VIEW_ZOOM}
                    max={MAX_VIEW_ZOOM}
                    step="0.02"
                    value={zoom}
                    onChange={event => applyZoom(event.target.value)}
                    disabled={!loaded || recording}
                  />
                </label>
                <p className="runtime-action-note">
                  Overview restores the complete map. Selected centers the chosen component while keeping the scene flat. The viewport supports one-finger pan and two-finger pinch zoom.
                </p>
              </div>
            )}

            {activeAction === 'export' && (
              <div className="runtime-form-stack">
                <button className="runtime-primary-action" disabled={!loaded || recording} onClick={exportPng}>
                  <Download size={16} /> Export current frame
                </button>
                {!recording ? (
                  <button className="runtime-secondary-action" disabled={!loaded} onClick={() => void startRecording()}>
                    <Film size={16} /> Start clip recording
                  </button>
                ) : (
                  <button className="runtime-recording-action" onClick={stopRecording}>
                    <Square size={14} /> Stop & save clip
                  </button>
                )}
                <p className="runtime-action-note">
                  Manual recording captures the live canvas. “Record run” below starts recording and the episode timeline together, then stops automatically at the scene end.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <EpisodeSceneCompositor
        app={appRef.current}
        objects={objects}
        ready={loaded}
        selectedUuid={selectedUuid}
        currentZoom={numberValue(zoom, DEFAULT_OVERVIEW_ZOOM)}
        sceneRevision={sceneRevision}
        recording={recording}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        onPauseRecording={pauseRecording}
        onResumeRecording={resumeRecording}
        onStatus={setStatus}
      />

      <details className="runtime-advanced-details">
        <summary>Advanced scene details</summary>
        <dl>
          <div><dt>Runtime source</dt><dd>@splinetool/runtime</dd></div>
          <div><dt>Scene URL</dt><dd>{sceneUrl || 'Not configured'}</dd></div>
          <div><dt>Persistence</dt><dd>Temporary browser session only</dd></div>
          <div><dt>Navigation</dt><dd>Multi-root 2D pan + runtime zoom</dd></div>
          <div><dt>Compositor</dt><dd>Timed browser-runtime cue executor</dd></div>
        </dl>
      </details>
    </section>
  );
}
