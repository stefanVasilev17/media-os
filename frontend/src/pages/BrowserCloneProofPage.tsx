import { useEffect, useMemo, useRef, useState } from 'react';
import { Application } from '@splinetool/runtime';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Copy,
  Layers3,
  LoaderCircle,
  Play,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  X
} from 'lucide-react';
import {
  captureSplineSceneBlueprint,
  loadSplineRuntimeConfig,
  loadSplineSceneCatalog
} from '../api/mediaOsApi';
import {
  buildCapabilitySummary,
  collectCatalogNames,
  countOccurrences,
  countVisualChanges,
  discoverNumericStates,
  fullFingerprint,
  numberValue,
  runtimeObjectSnapshot,
  sha256Hex,
  snapshotVisualObjects,
  type CloneResult,
  type RuntimeObject,
  type StateBehaviorResult,
  type StateProbeResult
} from '../lib/runtimeSceneProof';
import '../styles/browserCloneProof.css';

const SCENE_URL_STORAGE_KEY = 'mediaos.runtimeLab.sceneUrl';
const SOURCE_NAME_STORAGE_KEY = 'mediaos.runtimeLab.sourceName';
const CLONE_NAME_STORAGE_KEY = 'mediaos.runtimeLab.cloneName';
const STATE_SETTLE_MS = 220;

type ProofTone = 'pending' | 'pass' | 'fail' | 'partial';
type BlueprintStatus = 'IDLE' | 'SAVING' | 'SAVED' | 'ERROR';

type ProofItemProps = {
  label: string;
  detail: string;
  tone: ProofTone;
};

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

function toneIcon(tone: ProofTone) {
  if (tone === 'pass') return <Check size={13} />;
  if (tone === 'fail') return <X size={13} />;
  if (tone === 'partial') return <AlertTriangle size={13} />;
  return <span>•</span>;
}

function ProofItem({ label, detail, tone }: ProofItemProps) {
  return (
    <div className={`runtime-lab-proof-item ${tone}`}>
      <div className="runtime-lab-proof-icon">{toneIcon(tone)}</div>
      <div>
        <strong>{label}</strong>
        <small>{detail}</small>
      </div>
    </div>
  );
}

function wait(ms: number) {
  return new Promise<void>(resolve => window.setTimeout(resolve, ms));
}

async function settleRuntime() {
  await new Promise<void>(resolve => window.requestAnimationFrame(() => resolve()));
  await new Promise<void>(resolve => window.requestAnimationFrame(() => resolve()));
  await wait(STATE_SETTLE_MS);
}

export function BrowserCloneProofPage() {
  const initialParamsRef = useRef(browserProofParams());
  const autoLoadRequested = initialParamsRef.current.get('autoload') !== '0';
  const autoRunRequested = initialParamsRef.current.get('autorun') !== '0';
  const autoLoadDoneRef = useRef(false);
  const autoRunDoneRef = useRef(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const appRef = useRef<Application | null>(null);
  const productionObjectsRef = useRef<RuntimeObject[]>([]);
  const createdObjectsRef = useRef<RuntimeObject[]>([]);
  const cloneRef = useRef<RuntimeObject | null>(null);

  const [sceneUrl, setSceneUrl] = useState(
    () => initialParamsRef.current.get('scene') ?? window.localStorage.getItem(SCENE_URL_STORAGE_KEY) ?? ''
  );
  const [sourceName, setSourceName] = useState(
    () => initialParamsRef.current.get('source') ?? window.localStorage.getItem(SOURCE_NAME_STORAGE_KEY) ?? 'Headers'
  );
  const [cloneName, setCloneName] = useState(
    () => initialParamsRef.current.get('clone') ?? window.localStorage.getItem(CLONE_NAME_STORAGE_KEY) ?? 'MEDIA_OS_RUNTIME_CLONE'
  );
  const [offsetX, setOffsetX] = useState('480');
  const [offsetY, setOffsetY] = useState('0');
  const [offsetZ, setOffsetZ] = useState('0');

  const [catalogNames, setCatalogNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [objectCount, setObjectCount] = useState<number | null>(null);
  const [eventDefinitionCount, setEventDefinitionCount] = useState<number | null>(null);
  const [loadDurationMs, setLoadDurationMs] = useState<number | null>(null);
  const [sceneVariables, setSceneVariables] = useState<Record<string, string | number | boolean>>({});

  const [cloneResult, setCloneResult] = useState<CloneResult | null>(null);
  const [stateProbe, setStateProbe] = useState<StateProbeResult | null>(null);
  const [stateBehavior, setStateBehavior] = useState<StateBehaviorResult | null>(null);
  const [stateTargetUuid, setStateTargetUuid] = useState('');
  const [stateTargetValue, setStateTargetValue] = useState('');

  const [blueprintStatus, setBlueprintStatus] = useState<BlueprintStatus>('IDLE');
  const [blueprintFingerprint, setBlueprintFingerprint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSplineSceneCatalog()
      .then(catalog => {
        const names = new Set<string>();
        collectCatalogNames(catalog.catalog?.sections, names);
        setCatalogNames([...names].sort((left, right) => left.localeCompare(right)));
      })
      .catch(() => setCatalogNames([]));

    if (!sceneUrl.trim()) {
      loadSplineRuntimeConfig()
        .then(config => {
          if (config.configured && config.sceneUrl.trim()) {
            setSceneUrl(config.sceneUrl.trim());
          }
        })
        .catch(() => undefined);
    }

    return () => {
      appRef.current?.dispose();
      appRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!autoLoadRequested || autoLoadDoneRef.current || !sceneUrl.trim()) return;
    autoLoadDoneRef.current = true;
    const timer = window.setTimeout(() => void loadScene(), 50);
    return () => window.clearTimeout(timer);
  }, [autoLoadRequested, sceneUrl]);

  useEffect(() => {
    if (!autoRunRequested || autoRunDoneRef.current || !loaded || running) return;
    autoRunDoneRef.current = true;
    const timer = window.setTimeout(() => void runCloneProof(), 100);
    return () => window.clearTimeout(timer);
  }, [autoRunRequested, loaded, running]);

  const sourceMatches = useMemo(
    () => productionObjectsRef.current.filter(object => object.name === sourceName.trim()).length,
    [sourceName, loaded, objectCount]
  );

  const selectedStateCandidate = useMemo(
    () => stateProbe?.candidates.find(candidate => candidate.uuid === stateTargetUuid) ?? null,
    [stateProbe, stateTargetUuid]
  );

  const cloneTone: ProofTone = !cloneResult
    ? 'pending'
    : cloneResult.freshRootId && cloneResult.sourceUnchanged && cloneResult.createdObjectCount > 0
      ? 'pass'
      : 'fail';

  const stateDiscoveryTone: ProofTone = !cloneResult
    ? 'pending'
    : !stateProbe
      ? 'pending'
      : stateProbe.changedProductionVisualObjects > 0
        ? 'fail'
        : stateProbe.candidates.length > 0
          ? 'pass'
          : 'partial';

  const stateBehaviorTone: ProofTone = !cloneResult
    ? 'pending'
    : !stateBehavior
      ? stateProbe && stateProbe.candidates.length === 0 ? 'partial' : 'pending'
      : stateBehavior.changedProductionVisualObjects > 0
        ? 'fail'
        : stateBehavior.stateAccepted && stateBehavior.changedCloneVisualObjects > 0
          ? 'pass'
          : stateBehavior.stateAccepted
            ? 'partial'
            : 'fail';

  const eventTone: ProofTone = !cloneResult
    ? 'pending'
    : cloneResult.sourceEventRefs === 0 || cloneResult.cloneEventRefs > 0
      ? 'pass'
      : 'partial';

  const overallTone: ProofTone = cloneTone === 'fail' || stateDiscoveryTone === 'fail' || stateBehaviorTone === 'fail'
    ? 'fail'
    : cloneTone === 'pass' && stateDiscoveryTone === 'pass' && stateBehaviorTone === 'pass'
      ? 'pass'
      : cloneTone === 'pass'
        ? 'partial'
        : 'pending';

  const overallTitle = overallTone === 'pass'
    ? 'STATEFUL CLONE VERIFIED'
    : overallTone === 'fail'
      ? 'PROOF FAILED'
      : overallTone === 'partial'
        ? 'VISUAL CLONE VERIFIED'
        : 'WAITING FOR PROOF';

  const overallDetail = overallTone === 'pass'
    ? 'The transient clone is isolated from production objects and an inherited state produces a visual change inside the cloned subtree.'
    : overallTone === 'fail'
      ? 'One of the safety or state-isolation checks failed. Do not use this template for automated runtime composition yet.'
      : overallTone === 'partial'
        ? 'Deep cloning works, but this template has not yet proven a visible inherited-state transition.'
        : 'Load the scene, clone one template, then run a state test.';

  async function loadScene() {
    const normalized = normalizeSceneInput(sceneUrl);
    const url = normalized.sceneUrl.trim();

    if (normalized.source) setSourceName(normalized.source);
    if (normalized.clone) setCloneName(normalized.clone);
    if (url && url !== sceneUrl) setSceneUrl(url);

    if (!url.includes('.splinecode')) {
      setError('Use the direct scene.splinecode URL or a full Media OS runtime-lab link.');
      return;
    }

    try {
      const parsed = new URL(url, window.location.origin);
      if (!['https:', 'http:'].includes(parsed.protocol)) {
        setError('The Spline scene URL must use HTTP or HTTPS.');
        return;
      }
    } catch {
      setError('The Spline scene URL is not valid.');
      return;
    }

    if (!canvasRef.current) return;

    setLoading(true);
    setError(null);
    setLoaded(false);
    setCloneResult(null);
    setStateProbe(null);
    setStateBehavior(null);
    setStateTargetUuid('');
    setStateTargetValue('');
    setBlueprintStatus('IDLE');
    setBlueprintFingerprint(null);
    productionObjectsRef.current = [];
    createdObjectsRef.current = [];
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
      const variables = app.getVariables() ?? {};

      productionObjectsRef.current = objects;
      setObjectCount(objects.length);
      setEventDefinitionCount(Array.isArray(events) ? events.length : Object.keys(events ?? {}).length);
      setSceneVariables(variables);
      setLoadDurationMs(performance.now() - startedAt);
      setLoaded(true);

      window.localStorage.setItem(SCENE_URL_STORAGE_KEY, url);
      window.localStorage.setItem(SOURCE_NAME_STORAGE_KEY, sourceName.trim());
      window.localStorage.setItem(CLONE_NAME_STORAGE_KEY, cloneName.trim());

      void saveRuntimeBlueprint(url, objects, events, variables);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The browser runtime could not load this Spline scene.');
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
          cloudPcRequired: false,
          transientCompositionSupported: true
        },
        knowledgeCoverage: {
          objectIdentity: 'RUNTIME_EXPOSED',
          transforms: 'RUNTIME_EXPOSED',
          visibility: 'RUNTIME_EXPOSED_WHEN_SUPPORTED',
          materials: 'RUNTIME_EXPOSED_WHEN_SUPPORTED',
          currentState: 'RUNTIME_EXPOSED_WHEN_SUPPORTED',
          variables: 'RUNTIME_EXPOSED',
          authoredEventReferences: 'DERIVED_FROM_RUNTIME_EVENT_DATA',
          fullStateDefinitions: 'NOT_EXPOSED_BY_RUNTIME',
          authoredActionGraph: 'NOT_EXPOSED_BY_RUNTIME'
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
      setBlueprintStatus('SAVED');
    } catch {
      setBlueprintStatus('ERROR');
    }
  }

  function resetProofState() {
    const app = appRef.current;
    if (app && cloneRef.current) {
      try {
        app.removeObject(cloneRef.current);
      } catch {
        // A full scene reload remains the final reset boundary for transient runtime objects.
      }
    }

    cloneRef.current = null;
    createdObjectsRef.current = [];
    setCloneResult(null);
    setStateProbe(null);
    setStateBehavior(null);
    setStateTargetUuid('');
    setStateTargetValue('');
    setError(null);
  }

  async function runCloneProof() {
    const app = appRef.current;
    if (!app) {
      setError('Load the browser scene first.');
      return;
    }

    resetProofState();

    const exactSourceName = sourceName.trim();
    const targetName = cloneName.trim();
    const sourceMatchesNow = (app.getAllObjects() as RuntimeObject[])
      .filter(object => object.name === exactSourceName);

    if (!exactSourceName) {
      setError('Choose a source template.');
      return;
    }

    if (sourceMatchesNow.length === 0) {
      setError(`Source template "${exactSourceName}" was not found in the runtime scene.`);
      return;
    }

    if (sourceMatchesNow.length > 1) {
      setError(`Source name "${exactSourceName}" is ambiguous (${sourceMatchesNow.length} matches). Use a unique template name before automating it.`);
      return;
    }

    if (!targetName) {
      setError('Give the transient clone a name.');
      return;
    }

    if ((app.getAllObjects() as RuntimeObject[]).some(object => object.name === targetName)) {
      setError(`"${targetName}" already exists in the loaded scene. Choose a different runtime name.`);
      return;
    }

    setRunning(true);
    setError(null);

    try {
      const source = sourceMatchesNow[0];
      const before = app.getAllObjects() as RuntimeObject[];
      productionObjectsRef.current = before;
      const beforeIds = new Set(before.map(object => object.uuid));
      const sourceBefore = fullFingerprint(source);
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
      const cloneEventRefs = [...createdIds]
        .reduce((total, id) => total + countOccurrences(eventDump, id), 0);

      cloneRef.current = clone;
      createdObjectsRef.current = created;

      const discoveredStates = discoverNumericStates(created, productionObjectsRef.current);
      setStateProbe(discoveredStates);

      const firstCandidate = discoveredStates.candidates[0];
      if (firstCandidate) {
        setStateTargetUuid(firstCandidate.uuid);
        setStateTargetValue(String(firstCandidate.discoveredStates[0] ?? ''));
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
        sourceUnchanged: sourceBefore === fullFingerprint(source),
        freshRootId: clone.uuid !== source.uuid && !beforeIds.has(clone.uuid),
        cloneDurationMs,
        position: {
          x: clone.position.x,
          y: clone.position.y,
          z: clone.position.z
        }
      });

      window.localStorage.setItem(SOURCE_NAME_STORAGE_KEY, exactSourceName);
      window.localStorage.setItem(CLONE_NAME_STORAGE_KEY, targetName);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The transient runtime clone could not be created.');
    } finally {
      setRunning(false);
    }
  }

  async function runStateBehaviorProof() {
    const app = appRef.current;
    const target = createdObjectsRef.current.find(object => object.uuid === stateTargetUuid);
    const candidate = stateProbe?.candidates.find(item => item.uuid === stateTargetUuid);
    const targetState = candidate?.discoveredStates.find(value => String(value) === stateTargetValue);

    if (!app || !target || !candidate || targetState === undefined) {
      setError('Select one discovered state from the cloned subtree first.');
      return;
    }

    setRunning(true);
    setError(null);

    const cloneBefore = snapshotVisualObjects(createdObjectsRef.current);
    const productionBefore = snapshotVisualObjects(productionObjectsRef.current);
    const originalState = target.state;
    const startedAt = performance.now();

    try {
      app.play();
      target.state = targetState;
      await settleRuntime();

      const result: StateBehaviorResult = {
        targetName: target.name || '(unnamed object)',
        targetUuid: target.uuid,
        targetState,
        changedCloneVisualObjects: countVisualChanges(createdObjectsRef.current, cloneBefore),
        changedProductionVisualObjects: countVisualChanges(productionObjectsRef.current, productionBefore),
        stateAccepted: target.state !== undefined && String(target.state) === String(targetState),
        durationMs: performance.now() - startedAt
      };
      setStateBehavior(result);

      try {
        target.state = originalState;
        await settleRuntime();
      } catch {
        // Runtime-only clone. Reloading the scene is the hard reset boundary.
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The cloned-state behavior test failed.');
    } finally {
      app.stop();
      setRunning(false);
    }
  }

  return (
    <main className="runtime-lab-page">
      <header className="runtime-lab-header">
        <button
          className="icon-button"
          onClick={() => { window.location.hash = '#/spline-agent'; }}
          aria-label="Back to Spline Agent"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="runtime-lab-header-copy">
          <span className="runtime-lab-eyebrow">Runtime Scene Lab · V1</span>
          <strong>Clone a Spline template, inherit behavior, discard after render</strong>
        </div>

        <div className="runtime-lab-badges">
          <span className="runtime-lab-badge good"><ShieldCheck size={12} /> Browser only</span>
          <span className="runtime-lab-badge good">0 Codex tokens</span>
          <span className="runtime-lab-badge">Transient scene</span>
        </div>
      </header>

      <div className="runtime-lab-shell">
        <aside className="runtime-lab-panel left">
          <section className="runtime-lab-section">
            <div className="runtime-lab-section-heading">
              <span className="runtime-lab-step">1</span>
              <div>
                <span className="runtime-lab-section-kicker">Template</span>
                <strong>Load the reusable source</strong>
              </div>
            </div>

            <p className="runtime-lab-copy">
              Pick one uniquely named object from the master Spline scene. Nothing created here is saved back to the authored file.
            </p>

            <label className="runtime-lab-field">
              <span>Source template</span>
              <input
                value={sourceName}
                list="runtime-lab-catalog-names"
                onChange={event => setSourceName(event.target.value)}
                placeholder="Auth Service"
              />
              <datalist id="runtime-lab-catalog-names">
                {catalogNames.map(name => <option value={name} key={name} />)}
              </datalist>
            </label>

            <button className="runtime-lab-button" disabled={loading} onClick={() => void loadScene()}>
              {loading ? <LoaderCircle size={15} className="runtime-lab-spin" /> : <RefreshCw size={15} />}
              {loading ? 'Loading runtime…' : loaded ? 'Reload scene' : 'Load scene'}
            </button>

            <div className="runtime-lab-mini-status">
              <span>Template identity</span>
              <strong className={sourceMatches === 1 ? 'good' : sourceMatches > 1 ? 'warn' : ''}>
                {!loaded ? 'WAITING' : sourceMatches === 1 ? 'UNIQUE' : sourceMatches > 1 ? `${sourceMatches} MATCHES` : 'NOT FOUND'}
              </strong>
            </div>

            <details className="runtime-lab-advanced">
              <summary>Advanced · scene source</summary>
              <div>
                <label className="runtime-lab-field">
                  <span>scene.splinecode URL</span>
                  <input value={sceneUrl} onChange={event => setSceneUrl(event.target.value)} />
                </label>
                <div className="runtime-lab-mini-status">
                  <span>Runtime blueprint</span>
                  <strong className={blueprintStatus === 'SAVED' ? 'good' : blueprintStatus === 'ERROR' ? 'warn' : ''}>
                    {blueprintStatus}
                  </strong>
                </div>
                {blueprintFingerprint && (
                  <div className="runtime-lab-note">Fingerprint <strong>{blueprintFingerprint.slice(0, 16)}…</strong></div>
                )}
              </div>
            </details>
          </section>

          <section className="runtime-lab-section">
            <div className="runtime-lab-section-heading">
              <span className="runtime-lab-step">2</span>
              <div>
                <span className="runtime-lab-section-kicker">Clone</span>
                <strong>Create the episode instance</strong>
              </div>
            </div>

            <label className="runtime-lab-field">
              <span>New runtime name</span>
              <input value={cloneName} onChange={event => setCloneName(event.target.value)} placeholder="Token Service" />
            </label>

            <div className="runtime-lab-grid-3">
              <label className="runtime-lab-field">
                <span>X</span>
                <input value={offsetX} onChange={event => setOffsetX(event.target.value)} inputMode="decimal" />
              </label>
              <label className="runtime-lab-field">
                <span>Y</span>
                <input value={offsetY} onChange={event => setOffsetY(event.target.value)} inputMode="decimal" />
              </label>
              <label className="runtime-lab-field">
                <span>Z</span>
                <input value={offsetZ} onChange={event => setOffsetZ(event.target.value)} inputMode="decimal" />
              </label>
            </div>

            <button className="runtime-lab-button" disabled={!loaded || running || sourceMatches !== 1} onClick={() => void runCloneProof()}>
              {running ? <LoaderCircle size={15} className="runtime-lab-spin" /> : <Copy size={15} />}
              {running ? 'Working…' : 'Create runtime clone'}
            </button>

            {cloneResult && (
              <button className="runtime-lab-button ghost" disabled={running} onClick={resetProofState}>
                <RotateCcw size={14} /> Remove transient clone
              </button>
            )}
          </section>

          {error && (
            <div className="runtime-lab-error">
              <AlertTriangle size={15} />
              <span>{error}</span>
            </div>
          )}
        </aside>

        <section className="runtime-lab-stage">
          <div className="runtime-lab-stage-head">
            <div>
              <span className="runtime-lab-canvas-kicker">Live browser runtime</span>
              <strong>Episode scene · temporary working surface</strong>
            </div>
            <div className="runtime-lab-scene-state">
              <span className={`runtime-lab-scene-dot ${loaded ? 'live' : ''}`} />
              {loaded ? 'SCENE LOADED' : 'NO SCENE'}
            </div>
          </div>

          <div className="runtime-lab-canvas-frame">
            <canvas ref={canvasRef} className="runtime-lab-canvas" />
            {!loaded && !loading && (
              <div className="runtime-lab-canvas-empty">
                <div>
                  <Layers3 size={26} />
                  <strong>Load the master runtime scene</strong>
                  <span>The original authored Spline file remains untouched.</span>
                </div>
              </div>
            )}
            <div className="runtime-lab-canvas-overlay">
              <span>RUNTIME-ONLY MUTATIONS</span>
              <strong>{cloneResult ? `${cloneResult.sourceName} → ${cloneResult.cloneName}` : 'No transient clone yet'}</strong>
            </div>
          </div>

          <div className="runtime-lab-metrics">
            <div className="runtime-lab-metric">
              <span>Objects</span>
              <strong>{objectCount ?? '—'}</strong>
            </div>
            <div className="runtime-lab-metric">
              <span>Load</span>
              <strong>{loadDurationMs == null ? '—' : `${loadDurationMs.toFixed(0)} ms`}</strong>
            </div>
            <div className="runtime-lab-metric">
              <span>Clone</span>
              <strong>{cloneResult ? `${cloneResult.cloneDurationMs.toFixed(1)} ms` : '—'}</strong>
            </div>
            <div className="runtime-lab-metric">
              <span>New subtree</span>
              <strong>{cloneResult?.createdObjectCount ?? '—'}</strong>
            </div>
          </div>
        </section>

        <aside className="runtime-lab-panel right">
          <section className="runtime-lab-section">
            <div className={`runtime-lab-proof-hero ${overallTone}`}>
              <span>ACCEPTANCE RESULT</span>
              <strong>{overallTitle}</strong>
              <small>{overallDetail}</small>
            </div>

            <div className="runtime-lab-proof-list">
              <ProofItem
                label="Deep clone"
                tone={cloneTone}
                detail={!cloneResult
                  ? 'Create a transient clone first.'
                  : `${cloneResult.createdObjectCount} new object(s), fresh root ID, source ${cloneResult.sourceUnchanged ? 'unchanged' : 'changed'}.`}
              />
              <ProofItem
                label="Inherited states"
                tone={stateDiscoveryTone}
                detail={!stateProbe
                  ? 'State discovery has not run yet.'
                  : `${stateProbe.candidates.length} cloned object(s) expose alternate state indexes; ${stateProbe.changedProductionVisualObjects} production visual changes.`}
              />
              <ProofItem
                label="Visible state behavior"
                tone={stateBehaviorTone}
                detail={!stateBehavior
                  ? stateProbe?.candidates.length === 0 ? 'No alternate clone state was discovered.' : 'Run one cloned-state test.'
                  : `${stateBehavior.changedCloneVisualObjects} clone visual change(s), ${stateBehavior.changedProductionVisualObjects} production visual change(s).`}
              />
              <ProofItem
                label="Authored event bindings"
                tone={eventTone}
                detail={!cloneResult
                  ? 'Not inspected yet.'
                  : cloneResult.sourceEventRefs === 0
                    ? 'The selected source has no runtime event references.'
                    : `${cloneResult.sourceEventRefs} source ref(s), ${cloneResult.cloneEventRefs} clone ref(s). Direct JS can own episode behavior when bindings are not copied.`}
              />
            </div>
          </section>

          <section className="runtime-lab-section">
            <div className="runtime-lab-section-heading">
              <span className="runtime-lab-step">3</span>
              <div>
                <span className="runtime-lab-section-kicker">State proof</span>
                <strong>Verify inherited visual behavior</strong>
              </div>
            </div>

            {stateProbe && stateProbe.candidates.length > 0 ? (
              <>
                <label className="runtime-lab-field">
                  <span>Cloned state object</span>
                  <select
                    value={stateTargetUuid}
                    onChange={event => {
                      const uuid = event.target.value;
                      setStateTargetUuid(uuid);
                      const candidate = stateProbe.candidates.find(item => item.uuid === uuid);
                      setStateTargetValue(String(candidate?.discoveredStates[0] ?? ''));
                      setStateBehavior(null);
                    }}
                  >
                    {stateProbe.candidates.map(candidate => (
                      <option key={candidate.uuid} value={candidate.uuid}>
                        {candidate.name} · {candidate.discoveredStates.length} state(s)
                      </option>
                    ))}
                  </select>
                </label>

                <label className="runtime-lab-field">
                  <span>State index</span>
                  <select value={stateTargetValue} onChange={event => { setStateTargetValue(event.target.value); setStateBehavior(null); }}>
                    {(selectedStateCandidate?.discoveredStates ?? []).map(value => (
                      <option value={String(value)} key={String(value)}>{String(value)}</option>
                    ))}
                  </select>
                </label>

                <button className="runtime-lab-button" disabled={running} onClick={() => void runStateBehaviorProof()}>
                  {running ? <LoaderCircle size={15} className="runtime-lab-spin" /> : <Play size={15} />}
                  {running ? 'Testing state…' : 'Test cloned state'}
                </button>
              </>
            ) : (
              <div className="runtime-lab-note">
                {cloneResult
                  ? 'This clone is visually valid, but no alternate numeric state index was discovered in its subtree. Try a known stateful template such as Auth Service.'
                  : 'Create a runtime clone first. State-capable objects will appear here automatically.'}
              </div>
            )}

            {stateBehavior && (
              <div className="runtime-lab-fact-list">
                <div className="runtime-lab-fact"><span>Target</span><strong>{stateBehavior.targetName}</strong></div>
                <div className="runtime-lab-fact"><span>Applied state</span><strong>{String(stateBehavior.targetState)}</strong></div>
                <div className="runtime-lab-fact"><span>Clone visual changes</span><strong>{stateBehavior.changedCloneVisualObjects}</strong></div>
                <div className="runtime-lab-fact"><span>Production visual changes</span><strong>{stateBehavior.changedProductionVisualObjects}</strong></div>
                <div className="runtime-lab-fact"><span>Proof latency</span><strong>{stateBehavior.durationMs.toFixed(0)} ms</strong></div>
              </div>
            )}
          </section>

          <section className="runtime-lab-section">
            <div className="runtime-lab-section-heading">
              <span className="runtime-lab-step">4</span>
              <div>
                <span className="runtime-lab-section-kicker">Composition gate</span>
                <strong>Ready for camera + timeline JS?</strong>
              </div>
            </div>

            <div className="runtime-lab-note">
              <strong>{overallTone === 'pass' ? 'YES.' : overallTone === 'partial' ? 'VISUAL-ONLY FOR NOW.' : overallTone === 'fail' ? 'NO.' : 'NOT TESTED.'}</strong>{' '}
              {overallTone === 'pass'
                ? 'This template can be cloned for an episode, renamed, positioned and state-driven in the browser without persisting the scene.'
                : overallTone === 'partial'
                  ? 'Runtime cloning is usable, but stateful automation still needs another template or a JS-owned behavior layer.'
                  : overallTone === 'fail'
                    ? 'Fix the failing isolation/state condition before using this template in automated scene generation.'
                    : 'Run the three steps above before connecting camera framing and episode timeline execution.'}
            </div>

            <details className="runtime-lab-advanced">
              <summary>Technical runtime facts</summary>
              <div>
                <div className="runtime-lab-fact-list">
                  <div className="runtime-lab-fact"><span>Scene events</span><strong>{eventDefinitionCount ?? '—'}</strong></div>
                  <div className="runtime-lab-fact"><span>Scene variables</span><strong>{Object.keys(sceneVariables).length}</strong></div>
                  <div className="runtime-lab-fact"><span>Created names</span><strong>{cloneResult?.createdNames.length ?? '—'}</strong></div>
                  <div className="runtime-lab-fact"><span>Persistence</span><strong>NONE / TRANSIENT</strong></div>
                </div>
              </div>
            </details>
          </section>
        </aside>
      </div>
    </main>
  );
}
