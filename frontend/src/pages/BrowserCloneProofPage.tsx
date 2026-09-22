import { useEffect, useMemo, useRef, useState } from 'react';
import { Application, type SPEObject } from '@splinetool/runtime';
import { ArrowLeft, Check, Copy, RefreshCw, RotateCcw, TestTube2, X } from 'lucide-react';
import {
  captureSplineSceneBlueprint,
  loadSplineRuntimeConfig
} from '../api/mediaOsApi';

const SCENE_URL_STORAGE_KEY = 'mediaos.browserProof.sceneUrl';
const SOURCE_NAME_STORAGE_KEY = 'mediaos.browserProof.sourceName';

type RuntimeObject = SPEObject & {
  name: string;
  uuid: string;
  state?: string | number;
  text?: string;
  visible?: boolean;
  color?: string;
  type?: string;
  id?: string;
  intensity?: number;
  parent?: RuntimeObject | null;
  children?: RuntimeObject[];
  material?: {
    alpha?: number;
    layers?: Array<Record<string, unknown>>;
  };
};

type CatalogNode = {
  name?: string;
  children?: CatalogNode[];
};

type CloneResult = {
  sourceName: string;
  sourceUuid: string;
  cloneName: string;
  cloneUuid: string;
  createdObjectCount: number;
  createdNames: string[];
  sourceEventRefs: number;
  cloneEventRefs: number;
  sourceUnchanged: boolean;
  freshRootId: boolean;
  cloneDurationMs: number;
  position: { x: number; y: number; z: number };
};

type TextCandidate = {
  uuid: string;
  name: string;
  text: string;
};

type StateCandidate = {
  uuid: string;
  name: string;
  originalState: string | number | undefined;
  discoveredStates: Array<string | number>;
};

type StateProbeResult = {
  candidates: StateCandidate[];
  changedProductionObjects: number;
  durationMs: number;
};

type TransitionProbeResult = {
  targetName: string;
  targetUuid: string;
  targetState: string | number;
  changedCloneObjects: number;
  changedProductionObjects: number;
  durationMs: number;
};

type VerdictTone = 'pending' | 'pass' | 'fail' | 'partial';

function countOccurrences(value: string, needle: string) {
  if (!needle) return 0;
  return value.split(needle).length - 1;
}

function numberValue(value: string, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function rounded(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.round(value * 1000) / 1000
    : null;
}

function vectorSnapshot(value: unknown) {
  const vector = value as { x?: number; y?: number; z?: number } | null | undefined;
  if (!vector) return null;
  return [rounded(vector.x), rounded(vector.y), rounded(vector.z)];
}

function serializableMaterialValue(value: unknown): unknown {
  if (value == null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') return rounded(value);

  if (Array.isArray(value)) {
    if (value.length > 64) return undefined;
    const items = value.map(item => serializableMaterialValue(item));
    return items.some(item => item === undefined) ? undefined : items;
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const simpleKeys = ['r', 'g', 'b', 'x', 'y', 'z'];
    const keys = Object.keys(record);
    if (keys.length > 0 && keys.every(key => simpleKeys.includes(key))) {
      const result: Record<string, unknown> = {};
      for (const key of keys) {
        const serialized = serializableMaterialValue(record[key]);
        if (serialized !== undefined) result[key] = serialized;
      }
      return result;
    }
  }

  return undefined;
}

function materialSnapshot(object: RuntimeObject) {
  const material = object.material;
  if (!material) return null;

  const layers = Array.isArray(material.layers)
    ? material.layers.map(layer => {
        const result: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(layer ?? {})) {
          if (typeof value === 'function' || key === 'texture') continue;
          const serialized = serializableMaterialValue(value);
          if (serialized !== undefined) result[key] = serialized;
        }
        return result;
      })
    : [];

  return {
    alpha: rounded(material.alpha),
    layers
  };
}

function runtimeObjectSnapshot(object: RuntimeObject, eventDump: string) {
  return {
    uuid: object.uuid,
    id: object.id ?? object.uuid,
    name: object.name,
    type: object.type ?? null,
    parentUuid: object.parent?.uuid ?? null,
    childUuids: Array.isArray(object.children) ? object.children.map(child => child.uuid) : [],
    position: vectorSnapshot(object.position),
    rotation: vectorSnapshot(object.rotation),
    scale: vectorSnapshot(object.scale),
    visible: typeof object.visible === 'boolean' ? object.visible : null,
    currentState: object.state ?? null,
    color: typeof object.color === 'string' ? object.color : null,
    intensity: rounded(object.intensity),
    runtimeText: typeof object.text === 'string' ? object.text : null,
    material: materialSnapshot(object),
    authoredEventRefCount: countOccurrences(eventDump, object.uuid),
    capabilities: {
      transform: Boolean(object.position && object.rotation && object.scale),
      visibility: typeof object.visible === 'boolean',
      stateCurrentExposed: object.state !== undefined,
      color: typeof object.color === 'string',
      runtimeText: typeof object.text === 'string',
      material: Boolean(object.material)
    }
  };
}

function buildCapabilitySummary(objects: RuntimeObject[], eventDump: string) {
  const names = new Map<string, number>();
  let transform = 0;
  let visibility = 0;
  let stateCurrentExposed = 0;
  let color = 0;
  let runtimeText = 0;
  let material = 0;
  let authoredEventReferencedObjects = 0;

  for (const object of objects) {
    names.set(object.name, (names.get(object.name) ?? 0) + 1);
    if (object.position && object.rotation && object.scale) transform += 1;
    if (typeof object.visible === 'boolean') visibility += 1;
    if (object.state !== undefined) stateCurrentExposed += 1;
    if (typeof object.color === 'string') color += 1;
    if (typeof object.text === 'string') runtimeText += 1;
    if (object.material) material += 1;
    if (countOccurrences(eventDump, object.uuid) > 0) authoredEventReferencedObjects += 1;
  }

  return {
    transform,
    visibility,
    stateCurrentExposed,
    color,
    runtimeText,
    material,
    authoredEventReferencedObjects,
    uniqueNames: names.size,
    duplicateNameCount: [...names.values()].filter(count => count > 1).length,
    runtimeDeepCloneAvailable: true,
    runtimeVariablesAvailable: true
  };
}

async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await window.crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)]
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

function objectFingerprint(object: RuntimeObject) {
  return JSON.stringify({
    uuid: object.uuid,
    name: object.name,
    state: object.state ?? null,
    visible: object.visible ?? null,
    text: typeof object.text === 'string' ? object.text : null,
    color: object.color ?? null,
    position: vectorSnapshot(object.position),
    rotation: vectorSnapshot(object.rotation),
    scale: vectorSnapshot(object.scale)
  });
}

function snapshotObjects(objects: RuntimeObject[]) {
  return new Map(objects.map(object => [object.uuid, objectFingerprint(object)]));
}

function countChangedObjects(objects: RuntimeObject[], before: Map<string, string>) {
  return objects.reduce(
    (count, object) => count + (before.get(object.uuid) !== objectFingerprint(object) ? 1 : 0),
    0
  );
}

function collectCatalogNames(nodes: CatalogNode[] | undefined, names: Set<string>) {
  for (const node of nodes ?? []) {
    if (node.name?.trim()) names.add(node.name.trim());
    collectCatalogNames(node.children, names);
  }
}

function VerdictRow({
  label,
  tone,
  detail
}: {
  label: string;
  tone: VerdictTone;
  detail: string;
}) {
  return (
    <div className={`browser-proof-verdict-row ${tone}`}>
      <span>{tone === 'pass' ? <Check size={13} /> : tone === 'fail' ? <X size={13} /> : <span>•</span>}</span>
      <strong>{label}</strong>
      <small>{detail}</small>
    </div>
  );
}

function browserProofParams() {
  const query = window.location.hash.split('?')[1] ?? '';
  return new URLSearchParams(query);
}

function normalizeSceneInput(rawValue: string) {
  const value = rawValue.trim();

  if (!value) {
    return { sceneUrl: '', source: null as string | null, clone: null as string | null };
  }

  if (value.includes('browser-clone-proof?scene=')) {
    const query = value.split('?')[1] ?? '';
    const params = new URLSearchParams(query);
    return {
      sceneUrl: params.get('scene') ?? '',
      source: params.get('source'),
      clone: params.get('clone')
    };
  }

  return {
    sceneUrl: value,
    source: null as string | null,
    clone: null as string | null
  };
}

export function BrowserCloneProofPage() {
  const initialParamsRef = useRef(browserProofParams());
  const autoLoadRequested = initialParamsRef.current.get('autoload') !== '0';
  const autoRunRequested = initialParamsRef.current.get('autorun') !== '0';
  const autoLoadDoneRef = useRef(false);
  const autoRunDoneRef = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const appRef = useRef<Application | null>(null);
  const createdObjectsRef = useRef<RuntimeObject[]>([]);
  const productionObjectsRef = useRef<RuntimeObject[]>([]);
  const cloneRef = useRef<RuntimeObject | null>(null);

  const [sceneUrl, setSceneUrl] = useState(
    () => initialParamsRef.current.get('scene') ?? window.localStorage.getItem(SCENE_URL_STORAGE_KEY) ?? ''
  );
  const [sourceName, setSourceName] = useState(
    () => initialParamsRef.current.get('source') ?? window.localStorage.getItem(SOURCE_NAME_STORAGE_KEY) ?? 'Headers'
  );
  const [cloneName, setCloneName] = useState(
    () => initialParamsRef.current.get('clone') ?? 'MEDIA_OS_BROWSER_CLONE_TEST'
  );
  const [offsetX, setOffsetX] = useState('0');
  const [offsetY, setOffsetY] = useState('-900');
  const [offsetZ, setOffsetZ] = useState('0');
  const [stateTargetUuid, setStateTargetUuid] = useState('');
  const [stateTargetValue, setStateTargetValue] = useState('');

  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loadDurationMs, setLoadDurationMs] = useState<number | null>(null);
  const [objectCount, setObjectCount] = useState<number | null>(null);
  const [eventDefinitionCount, setEventDefinitionCount] = useState<number | null>(null);
  const [catalogNames, setCatalogNames] = useState<string[]>([]);
  const [cloneResult, setCloneResult] = useState<CloneResult | null>(null);
  const [textCandidates, setTextCandidates] = useState<TextCandidate[]>([]);
  const [stateProbe, setStateProbe] = useState<StateProbeResult | null>(null);
  const [transitionProbe, setTransitionProbe] = useState<TransitionProbeResult | null>(null);
  const [sceneVariables, setSceneVariables] = useState<Record<string, string | number | boolean>>({});
  const [blueprintStatus, setBlueprintStatus] = useState<'IDLE' | 'SAVING' | 'SAVED' | 'ERROR'>('IDLE');
  const [blueprintFingerprint, setBlueprintFingerprint] = useState<string | null>(null);
  const [blueprintCapabilitySummary, setBlueprintCapabilitySummary] = useState<Record<string, unknown> | null>(null);
  const [blueprintMessage, setBlueprintMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v1/spline/catalog/latest')
      .then(response => response.ok ? response.json() : null)
      .then(data => {
        const names = new Set<string>();
        collectCatalogNames(data?.catalog?.sections, names);
        setCatalogNames([...names].sort((a, b) => a.localeCompare(b)));
      })
      .catch(() => {
        setCatalogNames([]);
      });

    if (!sceneUrl.trim()) {
      loadSplineRuntimeConfig()
        .then(config => {
          if (config.configured && config.sceneUrl.trim()) {
            setSceneUrl(config.sceneUrl.trim());
          }
        })
        .catch(() => {
          // Diagnostic override input remains available if backend config is unavailable.
        });
    }

    return () => {
      appRef.current?.dispose();
      appRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!autoLoadRequested || autoLoadDoneRef.current || !sceneUrl.trim()) return;
    autoLoadDoneRef.current = true;
    const timer = window.setTimeout(() => {
      void loadScene();
    }, 50);
    return () => window.clearTimeout(timer);
  }, [autoLoadRequested, sceneUrl]);

  useEffect(() => {
    if (!autoRunRequested || autoRunDoneRef.current || !loaded || running) return;
    autoRunDoneRef.current = true;
    const timer = window.setTimeout(() => {
      void runCloneProof();
    }, 100);
    return () => window.clearTimeout(timer);
  }, [autoRunRequested, loaded, running]);

  const createdNames = useMemo(() => cloneResult?.createdNames ?? [], [cloneResult]);
  const stringVariables = useMemo(
    () => Object.entries(sceneVariables).filter(([, value]) => typeof value === 'string'),
    [sceneVariables]
  );

  const cloneTone: VerdictTone = !cloneResult
    ? 'pending'
    : cloneResult.freshRootId && cloneResult.sourceUnchanged && cloneResult.createdObjectCount > 0
      ? 'pass'
      : 'fail';

  const stateDiscoveryTone: VerdictTone = !cloneResult
    ? 'pending'
    : !stateProbe
      ? 'pending'
      : stateProbe.changedProductionObjects > 0
        ? 'fail'
        : stateProbe.candidates.length > 0
          ? 'pass'
          : 'partial';

  const stateControlTone: VerdictTone = !cloneResult
    ? 'pending'
    : !transitionProbe
      ? 'pending'
      : transitionProbe.changedProductionObjects === 0 && transitionProbe.changedCloneObjects > 0
        ? 'pass'
        : 'fail';

  const overallTone: VerdictTone = cloneTone === 'fail' || stateDiscoveryTone === 'fail' || stateControlTone === 'fail'
    ? 'fail'
    : cloneTone === 'pass' && stateDiscoveryTone === 'pass' && stateControlTone === 'pass'
      ? 'pass'
      : cloneTone === 'pass' && stateDiscoveryTone === 'partial'
        ? 'partial'
        : 'pending';

  async function loadScene() {
    const normalized = normalizeSceneInput(sceneUrl);
    const url = normalized.sceneUrl;

    if (normalized.source) setSourceName(normalized.source);
    if (normalized.clone) setCloneName(normalized.clone);
    if (url && url !== sceneUrl) setSceneUrl(url);

    if (!url.includes('.splinecode')) {
      setError('Paste either the direct scene.splinecode URL or the full Media OS one-click browser proof link.');
      return;
    }

    try {
      const parsed = new URL(url, window.location.origin);
      if (!['https:', 'http:'].includes(parsed.protocol)) {
        setError('Spline runtime URL must use HTTP or HTTPS.');
        return;
      }
    } catch {
      setError('Invalid Spline runtime URL.');
      return;
    }

    if (!canvasRef.current) return;

    setLoading(true);
    setError(null);
    setLoaded(false);
    setCloneResult(null);
    setStateProbe(null);
    setTransitionProbe(null);
    setTextCandidates([]);
    setBlueprintStatus('IDLE');
    setBlueprintFingerprint(null);
    setBlueprintCapabilitySummary(null);
    setBlueprintMessage(null);
    createdObjectsRef.current = [];
    productionObjectsRef.current = [];
    cloneRef.current = null;

    const startedAt = performance.now();

    try {
      appRef.current?.dispose();
      const app = new Application(canvasRef.current, {
        renderMode: 'auto',
        htmlContentMode: 'none'
      });
      appRef.current = app;
      await app.load(url);
      app.stop();

      const objects = app.getAllObjects() as RuntimeObject[];
      const events = app.getSplineEvents();
      const variables = app.getVariables();

      productionObjectsRef.current = objects;
      setSceneVariables(variables ?? {});
      setObjectCount(objects.length);
      setEventDefinitionCount(Array.isArray(events) ? events.length : Object.keys(events ?? {}).length);
      setLoadDurationMs(performance.now() - startedAt);
      setLoaded(true);

      void saveRuntimeBlueprint(
        url,
        objects,
        events,
        variables ?? {}
      );

      window.localStorage.setItem(SCENE_URL_STORAGE_KEY, url);
      window.localStorage.setItem(SOURCE_NAME_STORAGE_KEY, sourceName.trim());

      if (!app.findObjectByName(sourceName.trim())) {
        setError(`Scene loaded, but source object "${sourceName.trim()}" was not found. Pick another catalog object and run the clone proof.`);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load Spline scene.');
    } finally {
      setLoading(false);
    }
  }

  async function saveRuntimeBlueprint(
    url: string,
    objects: RuntimeObject[],
    events: unknown,
    variables: Record<string, string | number | boolean>
  ) {
    setBlueprintStatus('SAVING');
    setBlueprintMessage(null);

    try {
      const eventDump = JSON.stringify(events ?? {});
      const sortedObjects = [...objects].sort((left, right) => left.uuid.localeCompare(right.uuid));
      const objectSnapshots = sortedObjects.map(object => runtimeObjectSnapshot(object, eventDump));
      const capabilitySummary = buildCapabilitySummary(sortedObjects, eventDump);
      const eventDefinitions = Array.isArray(events) ? events.length : Object.keys((events ?? {}) as object).length;

      const blueprint = {
        schemaVersion: 1,
        sceneUrl: url,
        capturedAt: new Date().toISOString(),
        objects: objectSnapshots,
        variables,
        eventDefinitionCount: eventDefinitions,
        runtimeContract: {
          source: '@splinetool/runtime',
          browserOnly: true,
          codexRequired: false,
          cloudPcRequired: false
        }
      };

      const fingerprintPayload = JSON.stringify({
        schemaVersion: 1,
        sceneUrl: url,
        objects: objectSnapshots,
        variables,
        eventDefinitionCount: eventDefinitions
      });
      const sceneFingerprint = await sha256Hex(fingerprintPayload);

      await captureSplineSceneBlueprint({
        schemaVersion: 1,
        sceneUrl: url,
        sceneFingerprint,
        objectCount: objectSnapshots.length,
        variableCount: Object.keys(variables).length,
        eventDefinitionCount: eventDefinitions,
        capabilitySummary,
        blueprint
      });

      setBlueprintFingerprint(sceneFingerprint);
      setBlueprintCapabilitySummary(capabilitySummary);
      setBlueprintStatus('SAVED');
      setBlueprintMessage(`Media OS stored ${objectSnapshots.length} runtime objects as scene blueprint ${sceneFingerprint.slice(0, 10)}…`);
    } catch (cause) {
      setBlueprintStatus('ERROR');
      setBlueprintMessage(cause instanceof Error ? cause.message : 'Could not store Spline runtime blueprint.');
    }
  }

  function resetProofState() {
    const app = appRef.current;
    if (app && cloneRef.current) {
      try {
        app.removeObject(cloneRef.current);
      } catch {
        // Runtime clone is transient; full reload remains the final reset boundary.
      }
    }

    cloneRef.current = null;
    createdObjectsRef.current = [];
    setCloneResult(null);
    setTextCandidates([]);
    setStateTargetUuid('');
    setStateTargetValue('');
    setStateProbe(null);
    setTransitionProbe(null);
    setError(null);
  }

  async function runCloneProof() {
    const app = appRef.current;
    if (!app) {
      setError('Load the browser scene first.');
      return;
    }

    resetProofState();

    const source = app.findObjectByName(sourceName.trim()) as RuntimeObject | undefined;
    if (!source) {
      setError(`Source object "${sourceName.trim()}" was not found.`);
      return;
    }

    const targetName = cloneName.trim();
    if (!targetName.startsWith('MEDIA_OS_')) {
      setError('Clone root must use the MEDIA_OS_ sandbox prefix.');
      return;
    }

    if (app.findObjectByName(targetName)) {
      setError(`"${targetName}" already exists in the loaded scene. Refusing to overwrite it.`);
      return;
    }

    setRunning(true);
    setError(null);

    try {
      const before = app.getAllObjects() as RuntimeObject[];
      productionObjectsRef.current = before;
      const beforeIds = new Set(before.map(object => object.uuid));
      const sourceBefore = objectFingerprint(source);
      const sourcePosition = source.position;

      const targetPosition: [number, number, number] = [
        sourcePosition.x + numberValue(offsetX),
        sourcePosition.y + numberValue(offsetY),
        sourcePosition.z + numberValue(offsetZ)
      ];

      const startedAt = performance.now();
      const clone = app.cloneObject(source, { position: targetPosition }) as RuntimeObject;
      clone.name = targetName;
      const cloneDurationMs = performance.now() - startedAt;

      const after = app.getAllObjects() as RuntimeObject[];
      const created = after.filter(object => !beforeIds.has(object.uuid));
      const eventDump = JSON.stringify(app.getSplineEvents() ?? {});
      const createdIds = new Set(created.map(object => object.uuid));

      let cloneEventRefs = 0;
      for (const id of createdIds) {
        cloneEventRefs += countOccurrences(eventDump, id);
      }

      const texts: TextCandidate[] = created
        .filter(object => typeof object.text === 'string')
        .map(object => ({
          uuid: object.uuid,
          name: object.name || '(unnamed text)',
          text: object.text ?? ''
        }));

      cloneRef.current = clone;
      createdObjectsRef.current = created;
      setTextCandidates(texts);

      const stateResult = probeClonedStates(created, productionObjectsRef.current);
      setStateProbe(stateResult);
      const firstStateCandidate = stateResult.candidates[0];
      if (firstStateCandidate) {
        const firstState = firstStateCandidate.discoveredStates[0];
        setStateTargetUuid(firstStateCandidate.uuid);
        setStateTargetValue(String(firstState ?? ''));

        const stateTarget = created.find(object => object.uuid === firstStateCandidate.uuid);
        if (stateTarget && firstState !== undefined) {
          const cloneBeforeStateControl = snapshotObjects(created);
          const productionBeforeStateControl = snapshotObjects(productionObjectsRef.current);
          const originalState = stateTarget.state;
          const stateStartedAt = performance.now();

          app.play();
          stateTarget.state = firstState;
          await new Promise(resolve => window.setTimeout(resolve, 120));
          app.stop();

          setTransitionProbe({
            targetName: stateTarget.name || '(unnamed object)',
            targetUuid: stateTarget.uuid,
            targetState: firstState,
            changedCloneObjects: countChangedObjects(created, cloneBeforeStateControl),
            changedProductionObjects: countChangedObjects(productionObjectsRef.current, productionBeforeStateControl),
            durationMs: performance.now() - stateStartedAt
          });

          try {
            stateTarget.state = originalState;
          } catch {
            // Runtime-only clone; reload remains the hard reset boundary.
          }
        }
      }

      setCloneResult({
        sourceName: source.name,
        sourceUuid: source.uuid,
        cloneName: targetName,
        cloneUuid: clone.uuid,
        createdObjectCount: created.length,
        createdNames: created.map(object => object.name).filter(Boolean),
        sourceEventRefs: countOccurrences(eventDump, source.uuid),
        cloneEventRefs,
        sourceUnchanged: sourceBefore === objectFingerprint(source),
        freshRootId: clone.uuid !== source.uuid && !beforeIds.has(clone.uuid),
        cloneDurationMs,
        position: {
          x: clone.position.x,
          y: clone.position.y,
          z: clone.position.z
        }
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Clone proof failed.');
    } finally {
      setRunning(false);
    }
  }

  function probeClonedStates(
    clonedObjects: RuntimeObject[],
    productionObjects: RuntimeObject[]
  ): StateProbeResult {
    const productionBefore = snapshotObjects(productionObjects);
    const startedAt = performance.now();
    const candidates: StateCandidate[] = [];

    for (const object of clonedObjects) {
      const originalState = object.state;
      const discoveredStates: Array<string | number> = [];
      let misses = 0;

      for (let index = 1; index <= 6; index += 1) {
        try {
          object.state = index;
          const current = object.state;
          const changed = current !== undefined && current !== originalState;

          if (changed && !discoveredStates.some(value => String(value) === String(current))) {
            discoveredStates.push(current);
            misses = 0;
          } else {
            misses += 1;
          }

          if (misses >= 2) break;
        } catch {
          break;
        }
      }

      try {
        object.state = originalState;
      } catch {
        // Clone is transient. A scene reload remains the hard reset boundary.
      }

      if (discoveredStates.length > 0) {
        candidates.push({
          uuid: object.uuid,
          name: object.name || '(unnamed object)',
          originalState,
          discoveredStates
        });
      }
    }

    return {
      candidates,
      changedProductionObjects: countChangedObjects(productionObjects, productionBefore),
      durationMs: performance.now() - startedAt
    };
  }

  async function runStateControlProof() {
    const app = appRef.current;
    const target = createdObjectsRef.current.find(object => object.uuid === stateTargetUuid);
    if (!app || !target) {
      setError('Select a state-capable cloned object first.');
      return;
    }

    const candidate = stateProbe?.candidates.find(item => item.uuid === stateTargetUuid);
    const targetState = candidate?.discoveredStates.find(value => String(value) === stateTargetValue);
    if (targetState === undefined) {
      setError('Select a discovered cloned state first.');
      return;
    }

    const cloneBefore = snapshotObjects(createdObjectsRef.current);
    const productionBefore = snapshotObjects(productionObjectsRef.current);
    const originalState = target.state;
    const startedAt = performance.now();

    try {
      app.play();
      target.state = targetState;
      await new Promise(resolve => window.setTimeout(resolve, 120));
      app.stop();

      const result: TransitionProbeResult = {
        targetName: target.name || '(unnamed object)',
        targetUuid: target.uuid,
        targetState,
        changedCloneObjects: countChangedObjects(createdObjectsRef.current, cloneBefore),
        changedProductionObjects: countChangedObjects(productionObjectsRef.current, productionBefore),
        durationMs: performance.now() - startedAt
      };
      setTransitionProbe(result);

      try {
        target.state = originalState;
      } catch {
        // Runtime-only clone; reload is always available as the final reset.
      }
    } catch (cause) {
      app.stop();
      setError(cause instanceof Error ? cause.message : 'State control proof failed.');
    }
  }



  return (
    <main className="browser-proof-page">
      <header className="browser-proof-header">
        <button className="icon-button" onClick={() => { window.location.hash = '#/spline-agent'; }} aria-label="Back">
          <ArrowLeft size={19} />
        </button>
        <div>
          <span>BROWSER RUNTIME PROOF V3</span>
          <strong>Deterministic zero-Codex acceptance test</strong>
        </div>
        <div className="browser-proof-cost">
          <span>EXECUTION PATH</span>
          <strong>Browser only · 0 Codex tokens · 0 Cloud PC</strong>
        </div>
      </header>

      <div className="browser-proof-layout">
        <section className="browser-proof-controls">
          <div className="browser-proof-section-title">
            <TestTube2 size={17} />
            <div>
              <span>ACTION 1</span>
              <strong>Clone → discover states → control clone → verify isolation</strong>
            </div>
          </div>

          <label>
            <span>Scene URL · supplied by Media OS backend · local override allowed</span>
            <input
              value={sceneUrl}
              onChange={event => setSceneUrl(event.target.value)}
              placeholder="scene.splinecode URL or full Media OS browser-proof link"
            />
          </label>

          <div className="browser-proof-grid">
            <label>
              <span>Source object</span>
              <input
                value={sourceName}
                list="browser-proof-catalog-names"
                onChange={event => setSourceName(event.target.value)}
              />
              <datalist id="browser-proof-catalog-names">
                {catalogNames.map(name => <option value={name} key={name} />)}
              </datalist>
            </label>
            <label>
              <span>Clone root</span>
              <input value={cloneName} onChange={event => setCloneName(event.target.value)} />
            </label>
          </div>

          <div className="browser-proof-grid browser-proof-grid-3">
            <label><span>Offset X</span><input value={offsetX} onChange={event => setOffsetX(event.target.value)} /></label>
            <label><span>Offset Y</span><input value={offsetY} onChange={event => setOffsetY(event.target.value)} /></label>
            <label><span>Offset Z</span><input value={offsetZ} onChange={event => setOffsetZ(event.target.value)} /></label>
          </div>

          <div className="browser-proof-buttons">
            <button disabled={loading} onClick={() => void loadScene()}>
              <RefreshCw size={16} className={loading ? 'spin' : ''} />
              {loading ? 'Loading…' : 'Load scene'}
            </button>
            <button disabled={!loaded || running} onClick={() => void runCloneProof()}>
              <Copy size={16} />
              {running ? 'Cloning…' : 'Run clone proof'}
            </button>
          </div>

          {cloneResult && (
            <button className="browser-proof-secondary browser-proof-reset" onClick={resetProofState}>
              <RotateCcw size={15} /> Remove transient clone
            </button>
          )}

          {error && <div className="browser-proof-error"><X size={15} />{error}</div>}

          <div className="browser-proof-facts">
            <div><span>Scene</span><strong>{loaded ? 'LOADED / PAUSED' : 'NOT LOADED'}</strong></div>
            <div><span>Objects</span><strong>{objectCount ?? '—'}</strong></div>
            <div><span>Load</span><strong>{loadDurationMs == null ? '—' : `${loadDurationMs.toFixed(0)} ms`}</strong></div>
          </div>

          {blueprintStatus !== 'IDLE' && (
            <div className={`browser-proof-note ${blueprintStatus === 'ERROR' ? 'browser-proof-blueprint-error' : ''}`}>
              <strong>Scene Blueprint:</strong> {blueprintStatus}
              {blueprintFingerprint ? ` · ${blueprintFingerprint.slice(0, 12)}…` : ''}
              {blueprintMessage ? <> · {blueprintMessage}</> : null}
              {blueprintCapabilitySummary ? (
                <>
                  {' '}· transforms <strong>{String(blueprintCapabilitySummary.transform ?? 0)}</strong>
                  {' '}· materials <strong>{String(blueprintCapabilitySummary.material ?? 0)}</strong>
                  {' '}· event-bound <strong>{String(blueprintCapabilitySummary.authoredEventReferencedObjects ?? 0)}</strong>
                </>
              ) : null}
            </div>
          )}

          {cloneResult && (
            <div className="browser-proof-result success">
              <div className="browser-proof-result-title"><Check size={16} /><strong>Runtime clone created</strong></div>
              <dl>
                <div><dt>Root</dt><dd>{cloneResult.cloneName}</dd></div>
                <div><dt>Fresh root ID</dt><dd>{cloneResult.freshRootId ? 'YES' : 'NO'}</dd></div>
                <div><dt>Source unchanged</dt><dd>{cloneResult.sourceUnchanged ? 'YES' : 'NO'}</dd></div>
                <div><dt>New subtree objects</dt><dd>{cloneResult.createdObjectCount}</dd></div>
                <div><dt>Writable text candidates</dt><dd>{textCandidates.length}</dd></div>
                <div><dt>State-capable clone objects</dt><dd>{stateProbe?.candidates.length ?? '—'}</dd></div>
                <div><dt>Source event refs</dt><dd>{cloneResult.sourceEventRefs}</dd></div>
                <div><dt>Clone event refs</dt><dd>{cloneResult.cloneEventRefs}</dd></div>
                <div><dt>Clone latency</dt><dd>{cloneResult.cloneDurationMs.toFixed(2)} ms</dd></div>
                <div><dt>Position</dt><dd>{cloneResult.position.x.toFixed(1)}, {cloneResult.position.y.toFixed(1)}, {cloneResult.position.z.toFixed(1)}</dd></div>
              </dl>
            </div>
          )}

          {cloneResult && (
            <>
              <div className="browser-proof-divider" />
              <div className="browser-proof-section-title compact">
                <div><span>STATE PROBE</span><strong>Direct behavior control without cloned events</strong></div>
              </div>

              {stateProbe && stateProbe.candidates.length > 0 ? (
                <>
                  <div className="browser-proof-grid">
                    <label>
                      <span>State-capable cloned object</span>
                      <select
                        value={stateTargetUuid}
                        onChange={event => {
                          const uuid = event.target.value;
                          setStateTargetUuid(uuid);
                          const candidate = stateProbe.candidates.find(item => item.uuid === uuid);
                          setStateTargetValue(String(candidate?.discoveredStates[0] ?? ''));
                        }}
                      >
                        {stateProbe.candidates.map(candidate => (
                          <option key={candidate.uuid} value={candidate.uuid}>
                            {candidate.name} · {candidate.discoveredStates.length} state(s)
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>Discovered state</span>
                      <select value={stateTargetValue} onChange={event => setStateTargetValue(event.target.value)}>
                        {(stateProbe.candidates.find(item => item.uuid === stateTargetUuid)?.discoveredStates ?? []).map(value => (
                          <option value={String(value)} key={String(value)}>{String(value)}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <button className="browser-proof-secondary" onClick={() => void runStateControlProof()}>
                    Apply cloned state + verify isolation
                  </button>
                  <div className="browser-proof-note">
                    State discovery probed only transient clone objects and restored them. Production changes detected: <strong>{stateProbe.changedProductionObjects}</strong>. Probe time: <strong>{stateProbe.durationMs.toFixed(2)} ms</strong>.
                  </div>
                </>
              ) : (
                <div className="browser-proof-note">
                  No alternate state was discovered on this cloned subtree by index probe. This does not invalidate visual cloning; it means this template cannot yet prove deterministic state control.
                </div>
              )}

              {transitionProbe && (
                <div className="browser-proof-note">
                  State <strong>{String(transitionProbe.targetState)}</strong> on <strong>{transitionProbe.targetName}</strong> changed <strong>{transitionProbe.changedCloneObjects}</strong> clone object(s) and <strong>{transitionProbe.changedProductionObjects}</strong> production object(s) in {transitionProbe.durationMs.toFixed(2)} ms.
                </div>
              )}

              <div className="browser-proof-divider" />
              <div className="browser-proof-section-title compact">
                <div><span>PARAMETERIZATION INVENTORY</span><strong>Labels are a separate compiler concern</strong></div>
              </div>

              <div className="browser-proof-note">
                Writable runtime text properties detected: <strong>{textCandidates.length}</strong>. Scene String variables detected: <strong>{stringVariables.length}</strong>.
                {' '}The Direct Executor gate no longer depends on authored event cloning or generic runtime text mutation.
              </div>

              {stringVariables.length > 0 && (
                <details className="browser-proof-objects">
                  <summary>Scene String variables ({stringVariables.length})</summary>
                  <div>{stringVariables.map(([name, value]) => <code key={name}>{name}="{String(value)}"</code>)}</div>
                </details>
              )}

              <div className="browser-proof-note">
                Existing authored events remain useful as a one-time behavior blueprint, but runtime clones do not receive their event bindings automatically. Media OS will own the deterministic action sequence instead.
              </div>

              <div className="browser-proof-divider" />
              <div className="browser-proof-section-title compact">
                <div><span>ACCEPTANCE</span><strong>Direct Executor gate</strong></div>
              </div>

              <div className={`browser-proof-verdict ${overallTone}`}>
                <VerdictRow
                  label="Deep clone + source safety"
                  tone={cloneTone}
                  detail={!cloneResult ? 'Not run yet.' : `${cloneResult.createdObjectCount} fresh runtime object(s); original ${cloneResult.sourceUnchanged ? 'unchanged' : 'changed'}.`}
                />
                <VerdictRow
                  label="Clone state preservation"
                  tone={stateDiscoveryTone}
                  detail={!stateProbe ? 'State probe not run yet.' : `${stateProbe.candidates.length} state-capable clone object(s); ${stateProbe.changedProductionObjects} production changes.`}
                />
                <VerdictRow
                  label="Deterministic state control"
                  tone={stateControlTone}
                  detail={!transitionProbe ? 'Apply one discovered state to the clone.' : `${transitionProbe.changedCloneObjects} clone / ${transitionProbe.changedProductionObjects} production changes.`}
                />
                <VerdictRow
                  label="Authored events"
                  tone="partial"
                  detail={cloneResult?.sourceEventRefs ? `Not copied: ${cloneResult.sourceEventRefs} source ref(s), ${cloneResult.cloneEventRefs} clone ref(s). Direct Executor will replace this layer.` : 'No source event refs on this template.'}
                />
                <div className="browser-proof-overall">
                  <span>OVERALL</span>
                  <strong>{overallTone.toUpperCase()}</strong>
                </div>
              </div>

              <details className="browser-proof-objects">
                <summary>Created subtree object names ({createdNames.length}) · scene event definitions {eventDefinitionCount ?? '—'}</summary>
                <div>{createdNames.map((name, index) => <code key={index}>{name || '(unnamed)'}</code>)}</div>
              </details>
            </>
          )}
        </section>

        <section className="browser-proof-canvas-card">
          <div>
            <span>LIVE BROWSER RUNTIME</span>
            <strong>Real .splinecode scene · paused between tests to minimize resource use</strong>
          </div>
          <canvas ref={canvasRef} className="browser-proof-canvas" />
          <small>All proof mutations are runtime-only. Reloading the scene restores the authored Spline file.</small>
        </section>
      </div>
    </main>
  );
}
