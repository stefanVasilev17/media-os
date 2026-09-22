import { useEffect, useMemo, useRef, useState } from 'react';
import { Application, type SPEObject, type SplineEventName } from '@splinetool/runtime';
import { ArrowLeft, Check, Copy, Play, RefreshCw, RotateCcw, TestTube2, X } from 'lucide-react';

const SCENE_URL_STORAGE_KEY = 'mediaos.browserProof.sceneUrl';
const SOURCE_NAME_STORAGE_KEY = 'mediaos.browserProof.sourceName';

type RuntimeObject = SPEObject & {
  name: string;
  uuid: string;
  state?: string | number;
  text?: string;
  visible?: boolean;
  color?: string;
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

type LabelResult = {
  passed: boolean;
  before?: string;
  after?: string;
  changedProductionObjects: number;
  durationMs: number;
};

type EventResult = {
  targetName: string;
  targetUuid: string;
  eventName: string;
  changedCloneObjects: number;
  changedProductionObjects: number;
  durationMs: number;
};

type TextCandidate = {
  uuid: string;
  name: string;
  text: string;
};

type EventCandidate = {
  uuid: string;
  name: string;
  refs: number;
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
  const autoLoadRequested = initialParamsRef.current.get('autoload') === '1';
  const autoRunRequested = initialParamsRef.current.get('autorun') === '1';
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
  const [labelObjectUuid, setLabelObjectUuid] = useState('');
  const [labelText, setLabelText] = useState('BROWSER TEST');
  const [eventTargetUuid, setEventTargetUuid] = useState('');
  const [eventName, setEventName] = useState<SplineEventName>('mouseDown');

  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loadDurationMs, setLoadDurationMs] = useState<number | null>(null);
  const [objectCount, setObjectCount] = useState<number | null>(null);
  const [eventDefinitionCount, setEventDefinitionCount] = useState<number | null>(null);
  const [catalogNames, setCatalogNames] = useState<string[]>([]);
  const [cloneResult, setCloneResult] = useState<CloneResult | null>(null);
  const [textCandidates, setTextCandidates] = useState<TextCandidate[]>([]);
  const [eventCandidates, setEventCandidates] = useState<EventCandidate[]>([]);
  const [eventResult, setEventResult] = useState<EventResult | null>(null);
  const [labelResult, setLabelResult] = useState<LabelResult | null>(null);
  const [labelMessage, setLabelMessage] = useState<string | null>(null);
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
      runCloneProof();
    }, 100);
    return () => window.clearTimeout(timer);
  }, [autoRunRequested, loaded, running]);

  const createdNames = useMemo(() => cloneResult?.createdNames ?? [], [cloneResult]);
  const sourceHasAuthoredEvents = (cloneResult?.sourceEventRefs ?? 0) > 0;

  const cloneTone: VerdictTone = !cloneResult
    ? 'pending'
    : cloneResult.freshRootId && cloneResult.sourceUnchanged && cloneResult.createdObjectCount > 0
      ? 'pass'
      : 'fail';

  const labelTone: VerdictTone = !cloneResult
    ? 'pending'
    : !labelResult
      ? 'pending'
      : labelResult.passed && labelResult.changedProductionObjects === 0
        ? 'pass'
        : 'fail';

  const wiringTone: VerdictTone = !cloneResult
    ? 'pending'
    : !sourceHasAuthoredEvents
      ? 'partial'
      : cloneResult.cloneEventRefs > 0
        ? 'pass'
        : 'fail';

  const behaviorTone: VerdictTone = !cloneResult
    ? 'pending'
    : !sourceHasAuthoredEvents
      ? 'partial'
      : !eventResult
        ? 'pending'
        : eventResult.changedCloneObjects > 0 && eventResult.changedProductionObjects === 0
          ? 'pass'
          : 'fail';

  const overallTone: VerdictTone = cloneTone === 'fail' || labelTone === 'fail' || wiringTone === 'fail' || behaviorTone === 'fail'
    ? 'fail'
    : cloneTone === 'pass' && labelTone === 'pass' && wiringTone === 'pass' && behaviorTone === 'pass'
      ? 'pass'
      : cloneTone === 'pass' && labelTone === 'pass' && !sourceHasAuthoredEvents
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
    setEventResult(null);
    setLabelResult(null);
    setLabelMessage(null);
    setTextCandidates([]);
    setEventCandidates([]);
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

      productionObjectsRef.current = objects;
      setObjectCount(objects.length);
      setEventDefinitionCount(Array.isArray(events) ? events.length : Object.keys(events ?? {}).length);
      setLoadDurationMs(performance.now() - startedAt);
      setLoaded(true);

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
    setEventCandidates([]);
    setLabelObjectUuid('');
    setEventTargetUuid('');
    setLabelResult(null);
    setLabelMessage(null);
    setEventResult(null);
    setError(null);
  }

  function runCloneProof() {
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

      const eventBound: EventCandidate[] = created
        .map(object => ({
          uuid: object.uuid,
          name: object.name || '(unnamed object)',
          refs: countOccurrences(eventDump, object.uuid)
        }))
        .filter(candidate => candidate.refs > 0)
        .sort((a, b) => b.refs - a.refs);

      const exactLabel = texts.find(candidate =>
        candidate.text.trim().toLowerCase() === sourceName.trim().toLowerCase()
      );
      const preferredText = exactLabel ?? (texts.length === 1 ? texts[0] : undefined);

      const preferredEventTarget = eventBound.find(candidate => candidate.uuid === clone.uuid)
        ?? eventBound[0];

      cloneRef.current = clone;
      createdObjectsRef.current = created;
      setTextCandidates(texts);
      setEventCandidates(eventBound);
      setLabelObjectUuid(preferredText?.uuid ?? '');
      setEventTargetUuid(preferredEventTarget?.uuid ?? '');

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

  function patchLabel() {
    const target = createdObjectsRef.current.find(object => object.uuid === labelObjectUuid);
    if (!target) {
      setLabelMessage('Select one of the detected cloned Text objects first.');
      setLabelResult(null);
      return;
    }

    const productionBefore = snapshotObjects(productionObjectsRef.current);
    const before = target.text;
    const startedAt = performance.now();

    try {
      target.text = labelText;
      const after = target.text;
      const changedProductionObjects = countChangedObjects(productionObjectsRef.current, productionBefore);
      const passed = after === labelText && changedProductionObjects === 0;

      setLabelResult({
        passed,
        before,
        after,
        changedProductionObjects,
        durationMs: performance.now() - startedAt
      });
      setLabelMessage(
        passed
          ? `Clone-only text patch verified: "${before ?? ''}" → "${after ?? ''}".`
          : `Label patch was not isolated. Production changes: ${changedProductionObjects}.`
      );
    } catch (cause) {
      setLabelResult({
        passed: false,
        before,
        after: target.text,
        changedProductionObjects: countChangedObjects(productionObjectsRef.current, productionBefore),
        durationMs: performance.now() - startedAt
      });
      setLabelMessage(cause instanceof Error ? cause.message : 'Runtime label patch failed.');
    }
  }

  async function runEventTest() {
    const app = appRef.current;
    const target = createdObjectsRef.current.find(object => object.uuid === eventTargetUuid);

    if (!app || !cloneRef.current) {
      setError('Create the runtime clone first.');
      return;
    }
    if (!target) {
      setError('Select a cloned object that owns authored event references.');
      return;
    }

    setError(null);
    const cloneBefore = snapshotObjects(createdObjectsRef.current);
    const productionBefore = snapshotObjects(productionObjectsRef.current);
    const startedAt = performance.now();

    try {
      app.play();
      target.emitEvent(eventName);
      await new Promise(resolve => window.setTimeout(resolve, 1200));
      app.stop();

      setEventResult({
        targetName: target.name || '(unnamed object)',
        targetUuid: target.uuid,
        eventName,
        changedCloneObjects: countChangedObjects(createdObjectsRef.current, cloneBefore),
        changedProductionObjects: countChangedObjects(productionObjectsRef.current, productionBefore),
        durationMs: performance.now() - startedAt
      });
    } catch (cause) {
      app.stop();
      setError(cause instanceof Error ? cause.message : 'Event test failed.');
    }
  }

  return (
    <main className="browser-proof-page">
      <header className="browser-proof-header">
        <button className="icon-button" onClick={() => { window.location.hash = '#/spline-agent'; }} aria-label="Back">
          <ArrowLeft size={19} />
        </button>
        <div>
          <span>BROWSER CLONE PROOF V2</span>
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
              <strong>Clone → patch → trigger → verify isolation</strong>
            </div>
          </div>

          <label>
            <span>Scene URL or one-click proof link · saved only in this browser</span>
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
            <button disabled={!loaded || running} onClick={runCloneProof}>
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

          {cloneResult && (
            <div className="browser-proof-result success">
              <div className="browser-proof-result-title"><Check size={16} /><strong>Runtime clone created</strong></div>
              <dl>
                <div><dt>Root</dt><dd>{cloneResult.cloneName}</dd></div>
                <div><dt>Fresh root ID</dt><dd>{cloneResult.freshRootId ? 'YES' : 'NO'}</dd></div>
                <div><dt>Source unchanged</dt><dd>{cloneResult.sourceUnchanged ? 'YES' : 'NO'}</dd></div>
                <div><dt>New subtree objects</dt><dd>{cloneResult.createdObjectCount}</dd></div>
                <div><dt>Text candidates</dt><dd>{textCandidates.length}</dd></div>
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
                <div><span>REQUIRED PATCH</span><strong>Clone-only visible label</strong></div>
              </div>

              <div className="browser-proof-grid">
                <label>
                  <span>Detected cloned Text object</span>
                  <select value={labelObjectUuid} onChange={event => setLabelObjectUuid(event.target.value)}>
                    <option value="">Select text object…</option>
                    {textCandidates.map(candidate => (
                      <option key={candidate.uuid} value={candidate.uuid}>
                        {candidate.name} · "{candidate.text}"
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>New visible text</span>
                  <input value={labelText} onChange={event => setLabelText(event.target.value)} />
                </label>
              </div>

              <button className="browser-proof-secondary" disabled={!labelObjectUuid} onClick={patchLabel}>
                Patch + verify isolation
              </button>
              {labelMessage && <div className="browser-proof-note">{labelMessage}</div>}

              <div className="browser-proof-divider" />
              <div className="browser-proof-section-title compact">
                <div><span>BEHAVIOR PROBE</span><strong>Authored event stays inside clone</strong></div>
              </div>

              {sourceHasAuthoredEvents ? (
                <>
                  <div className="browser-proof-grid">
                    <label>
                      <span>Event-bound cloned object</span>
                      <select value={eventTargetUuid} onChange={event => setEventTargetUuid(event.target.value)}>
                        <option value="">Select event target…</option>
                        {eventCandidates.map(candidate => (
                          <option key={candidate.uuid} value={candidate.uuid}>
                            {candidate.name} · {candidate.refs} event ref(s)
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>Event type</span>
                      <select value={eventName} onChange={event => setEventName(event.target.value as SplineEventName)}>
                        <option value="mouseDown">mouseDown</option>
                        <option value="mouseUp">mouseUp</option>
                        <option value="mouseHover">mouseHover</option>
                        <option value="start">start</option>
                        <option value="keyDown">keyDown</option>
                        <option value="keyUp">keyUp</option>
                      </select>
                    </label>
                  </div>
                  <button className="browser-proof-secondary" disabled={!eventTargetUuid} onClick={() => void runEventTest()}>
                    <Play size={15} /> Trigger + verify isolation
                  </button>
                </>
              ) : (
                <div className="browser-proof-note">
                  This source has no authored event references. Clone + label can be proven here, but choose an interactive template for the full behavior acceptance test.
                </div>
              )}

              {eventResult && (
                <div className="browser-proof-note">
                  <strong>{eventResult.eventName}</strong> on <strong>{eventResult.targetName}</strong> changed <strong>{eventResult.changedCloneObjects}</strong> cloned object(s) and <strong>{eventResult.changedProductionObjects}</strong> production object(s) in {eventResult.durationMs.toFixed(0)} ms.
                </div>
              )}

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
                  label="Clone-only text patch"
                  tone={labelTone}
                  detail={!labelResult ? 'Patch one detected Text object.' : `${labelResult.changedProductionObjects} production object change(s); ${labelResult.durationMs.toFixed(2)} ms.`}
                />
                <VerdictRow
                  label="Authored event wiring"
                  tone={wiringTone}
                  detail={!sourceHasAuthoredEvents ? 'Not applicable to this template.' : `${cloneResult.cloneEventRefs} cloned event reference(s) detected.`}
                />
                <VerdictRow
                  label="Behavior isolation"
                  tone={behaviorTone}
                  detail={!sourceHasAuthoredEvents ? 'Use an interactive template for final proof.' : !eventResult ? 'Trigger the correct authored event.' : `${eventResult.changedCloneObjects} clone / ${eventResult.changedProductionObjects} production changes.`}
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
