import { useEffect, useMemo, useRef, useState } from 'react';
import { Application, type SPEObject, type SplineEventName } from '@splinetool/runtime';
import { ArrowLeft, Check, Copy, Play, RefreshCw, TestTube2, X } from 'lucide-react';

type RuntimeObject = SPEObject & {
  name: string;
  uuid: string;
  state?: string | number;
  text?: string;
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
  position: { x: number; y: number; z: number };
};

type EventResult = {
  targetName: string;
  eventName: string;
  changedStates: number;
  before: string | number | undefined;
  after: string | number | undefined;
};

function countOccurrences(value: string, needle: string) {
  if (!needle) return 0;
  return value.split(needle).length - 1;
}

function numberValue(value: string, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function BrowserCloneProofPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const appRef = useRef<Application | null>(null);
  const createdObjectsRef = useRef<RuntimeObject[]>([]);
  const cloneRef = useRef<RuntimeObject | null>(null);

  const [sceneUrl, setSceneUrl] = useState('');
  const [sourceName, setSourceName] = useState('Headers');
  const [cloneName, setCloneName] = useState('MEDIA_OS_BROWSER_CLONE_TEST');
  const [offsetX, setOffsetX] = useState('0');
  const [offsetY, setOffsetY] = useState('-900');
  const [offsetZ, setOffsetZ] = useState('0');
  const [labelObjectName, setLabelObjectName] = useState('');
  const [labelText, setLabelText] = useState('BROWSER TEST');
  const [eventTargetName, setEventTargetName] = useState('');
  const [eventName, setEventName] = useState<SplineEventName>('mouseDown');

  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [objectCount, setObjectCount] = useState<number | null>(null);
  const [eventDefinitionCount, setEventDefinitionCount] = useState<number | null>(null);
  const [cloneResult, setCloneResult] = useState<CloneResult | null>(null);
  const [eventResult, setEventResult] = useState<EventResult | null>(null);
  const [labelResult, setLabelResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      appRef.current?.dispose();
      appRef.current = null;
    };
  }, []);

  const createdNames = useMemo(() => cloneResult?.createdNames ?? [], [cloneResult]);

  async function loadScene() {
    const url = sceneUrl.trim();
    if (!url.includes('.splinecode')) {
      setError('Use the Vanilla JS export URL ending in scene.splinecode.');
      return;
    }
    if (!canvasRef.current) return;

    setLoading(true);
    setError(null);
    setLoaded(false);
    setCloneResult(null);
    setEventResult(null);
    setLabelResult(null);
    createdObjectsRef.current = [];
    cloneRef.current = null;

    try {
      appRef.current?.dispose();
      const app = new Application(canvasRef.current, { renderMode: 'auto' });
      appRef.current = app;
      await app.load(url);

      const objects = app.getAllObjects();
      const events = app.getSplineEvents();

      setObjectCount(objects.length);
      setEventDefinitionCount(Array.isArray(events) ? events.length : Object.keys(events ?? {}).length);
      setLoaded(true);

      if (!app.findObjectByName(sourceName.trim())) {
        setError(`Scene loaded, but source object "${sourceName.trim()}" was not found. Change Source object and retry Clone.`);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load Spline scene.');
    } finally {
      setLoading(false);
    }
  }

  function runCloneProof() {
    const app = appRef.current;
    if (!app) {
      setError('Load the browser scene first.');
      return;
    }

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
    setCloneResult(null);
    setEventResult(null);
    setLabelResult(null);

    try {
      const before = app.getAllObjects() as RuntimeObject[];
      const beforeIds = new Set(before.map(object => object.uuid));
      const sourcePosition = source.position;

      const targetPosition: [number, number, number] = [
        sourcePosition.x + numberValue(offsetX),
        sourcePosition.y + numberValue(offsetY),
        sourcePosition.z + numberValue(offsetZ)
      ];

      const clone = app.cloneObject(source, { position: targetPosition }) as RuntimeObject;
      clone.name = targetName;

      const after = app.getAllObjects() as RuntimeObject[];
      const created = after.filter(object => !beforeIds.has(object.uuid));
      const eventDump = JSON.stringify(app.getSplineEvents() ?? {});
      const createdIds = new Set(created.map(object => object.uuid));

      let cloneEventRefs = 0;
      for (const id of createdIds) {
        cloneEventRefs += countOccurrences(eventDump, id);
      }

      cloneRef.current = clone;
      createdObjectsRef.current = created;
      setEventTargetName(targetName);
      setCloneResult({
        sourceName: source.name,
        sourceUuid: source.uuid,
        cloneName: targetName,
        cloneUuid: clone.uuid,
        createdObjectCount: created.length,
        createdNames: created.map(object => object.name).filter(Boolean),
        sourceEventRefs: countOccurrences(eventDump, source.uuid),
        cloneEventRefs,
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
    const name = labelObjectName.trim();
    if (!name) {
      setLabelResult('Enter the exact cloned Text object name first.');
      return;
    }

    const candidates = createdObjectsRef.current.filter(object => object.name === name);
    if (candidates.length === 0) {
      setLabelResult(`No cloned object named "${name}" was found.`);
      return;
    }
    if (candidates.length > 1) {
      setLabelResult(`Found ${candidates.length} cloned objects named "${name}". Use a unique Text object name before we automate label patching.`);
      return;
    }

    const target = candidates[0];
    const before = target.text;

    try {
      target.text = labelText;
      const after = target.text;
      setLabelResult(
        after === labelText
          ? `Runtime text property changed from "${before ?? 'unknown'}" to "${after}". Visually confirm the label in the canvas.`
          : 'Runtime did not expose a verifiable text setter for this cloned object. We will not treat label patching as proven.'
      );
    } catch (cause) {
      setLabelResult(cause instanceof Error ? cause.message : 'Runtime label patch failed.');
    }
  }

  async function runEventTest() {
    const app = appRef.current;
    if (!app || !cloneRef.current) {
      setError('Create the runtime clone first.');
      return;
    }

    const targetName = eventTargetName.trim() || cloneRef.current.name;
    const target = createdObjectsRef.current.find(object => object.name === targetName)
      ?? (cloneRef.current.name === targetName ? cloneRef.current : undefined);

    if (!target) {
      setError(`No cloned event target named "${targetName}" was found.`);
      return;
    }

    setError(null);
    const beforeStates = new Map(createdObjectsRef.current.map(object => [object.uuid, object.state]));
    const before = target.state;

    try {
      app.play();
      target.emitEvent(eventName);
      await new Promise(resolve => window.setTimeout(resolve, 1200));

      let changedStates = 0;
      for (const object of createdObjectsRef.current) {
        if (beforeStates.get(object.uuid) !== object.state) changedStates += 1;
      }

      setEventResult({
        targetName,
        eventName,
        changedStates,
        before,
        after: target.state
      });
    } catch (cause) {
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
          <span>BROWSER CLONE PROOF</span>
          <strong>Zero-Codex Spline runtime test</strong>
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
              <strong>Clone → move → inspect → trigger</strong>
            </div>
          </div>

          <label>
            <span>Vanilla JS .splinecode URL</span>
            <input
              value={sceneUrl}
              onChange={event => setSceneUrl(event.target.value)}
              placeholder="https://prod.spline.design/.../scene.splinecode"
            />
          </label>

          <div className="browser-proof-grid">
            <label>
              <span>Source object</span>
              <input value={sourceName} onChange={event => setSourceName(event.target.value)} />
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

          {error && <div className="browser-proof-error"><X size={15} />{error}</div>}

          <div className="browser-proof-facts">
            <div><span>Scene</span><strong>{loaded ? 'LOADED' : 'NOT LOADED'}</strong></div>
            <div><span>Objects</span><strong>{objectCount ?? '—'}</strong></div>
            <div><span>Event definitions</span><strong>{eventDefinitionCount ?? '—'}</strong></div>
          </div>

          {cloneResult && (
            <div className="browser-proof-result success">
              <div className="browser-proof-result-title"><Check size={16} /><strong>Runtime clone created</strong></div>
              <dl>
                <div><dt>Root</dt><dd>{cloneResult.cloneName}</dd></div>
                <div><dt>New subtree objects</dt><dd>{cloneResult.createdObjectCount}</dd></div>
                <div><dt>Source event refs</dt><dd>{cloneResult.sourceEventRefs}</dd></div>
                <div><dt>Clone subtree event refs</dt><dd>{cloneResult.cloneEventRefs}</dd></div>
                <div><dt>Position</dt><dd>{cloneResult.position.x.toFixed(1)}, {cloneResult.position.y.toFixed(1)}, {cloneResult.position.z.toFixed(1)}</dd></div>
              </dl>
            </div>
          )}

          {cloneResult && (
            <>
              <div className="browser-proof-divider" />
              <div className="browser-proof-section-title compact">
                <div><span>OPTIONAL PATCH</span><strong>Visible label probe</strong></div>
              </div>
              <div className="browser-proof-grid">
                <label>
                  <span>Exact cloned Text object name</span>
                  <input value={labelObjectName} onChange={event => setLabelObjectName(event.target.value)} placeholder="e.g. Header_Title" />
                </label>
                <label>
                  <span>New visible text</span>
                  <input value={labelText} onChange={event => setLabelText(event.target.value)} />
                </label>
              </div>
              <button className="browser-proof-secondary" onClick={patchLabel}>Patch label</button>
              {labelResult && <div className="browser-proof-note">{labelResult}</div>}

              <div className="browser-proof-divider" />
              <div className="browser-proof-section-title compact">
                <div><span>BEHAVIOR PROBE</span><strong>Trigger cloned authored event</strong></div>
              </div>
              <div className="browser-proof-grid">
                <label>
                  <span>Target inside cloned subtree</span>
                  <input value={eventTargetName} onChange={event => setEventTargetName(event.target.value)} />
                </label>
                <label>
                  <span>Event</span>
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
              <button className="browser-proof-secondary" onClick={() => void runEventTest()}>
                <Play size={15} /> Trigger event
              </button>
              {eventResult && (
                <div className="browser-proof-note">
                  Event <strong>{eventResult.eventName}</strong> fired on <strong>{eventResult.targetName}</strong>. Runtime observed <strong>{eventResult.changedStates}</strong> cloned object state change(s).
                </div>
              )}

              <details className="browser-proof-objects">
                <summary>Created subtree object names ({createdNames.length})</summary>
                <div>{createdNames.map((name, index) => <code key={index}>{name || '(unnamed)'}</code>)}</div>
              </details>
            </>
          )}
        </section>

        <section className="browser-proof-canvas-card">
          <div>
            <span>LIVE BROWSER RUNTIME</span>
            <strong>This is not a screenshot. The exported Spline scene is running here.</strong>
          </div>
          <canvas ref={canvasRef} className="browser-proof-canvas" />
          <small>Runtime changes are intentionally transient and disappear when the scene reloads.</small>
        </section>
      </div>
    </main>
  );
}
