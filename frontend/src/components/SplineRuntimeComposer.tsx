import { useEffect, useMemo, useRef, useState } from 'react';
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

type ActionMode = 'create' | 'edit' | 'animate' | 'frame' | 'export';

type RuntimeStatus = {
  tone: 'neutral' | 'working' | 'success' | 'error';
  text: string;
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
  { id: 'frame', label: 'Frame', description: 'Adjust the live camera zoom for the shot.', icon: Camera },
  { id: 'export', label: 'Export', description: 'Save a still frame or record the live browser canvas.', icon: Download }
];

const EVENT_TYPES = ['mouseDown', 'mouseHover', 'mouseUp', 'keyDown', 'keyUp', 'start', 'lookAt', 'follow', 'scroll'];

function numberValue(value: string, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
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

export function SplineRuntimeComposer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const appRef = useRef<Application | null>(null);
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
  const [zoom, setZoom] = useState('1');
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

  function syncRuntimeMutation(nextZoom?: number) {
    if (typeof nextZoom === 'number' && Number.isFinite(nextZoom)) setZoom(String(nextZoom));
    refreshObjectList();
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
      const next = refreshObjectList(app);
      const firstNamed = next.find(object => Boolean(object.name?.trim()));
      setSelectedUuid(firstNamed?.uuid ?? '');
      setTemplateUuid(firstNamed?.uuid ?? '');
      setZoom('1');
      setLoaded(true);
      markManualSceneChange();
      setStatus({ tone: 'success', text: `Live scene ready · ${next.length} objects available.` });
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
    const value = Math.max(0.1, numberValue(nextValue, 1));
    setZoom(String(value));
    app.setZoom(value);
    markManualSceneChange();
    setStatus({ tone: 'success', text: `Camera framing set to ${value.toFixed(2)}× zoom.` });
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
            <select value={selectedUuid} onChange={event => setSelectedUuid(event.target.value)} disabled={!loaded || recording}>
              <option value="">Choose object…</option>
              {namedObjects.map(object => (
                <option key={object.uuid} value={object.uuid}>
                  {object.name} · {object.uuid.slice(0, 8)}
                </option>
              ))}
            </select>
          </label>

          <div className={`runtime-status ${status.tone}`}>
            {status.tone === 'success' ? <Check size={15} /> : status.tone === 'working' ? <LoaderCircle size={15} className="spin" /> : <Square size={13} />}
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
                  <button disabled={recording} onClick={() => applyZoom('0.75')}>Wide</button>
                  <button disabled={recording} onClick={() => applyZoom('1')}>Standard</button>
                  <button disabled={recording} onClick={() => applyZoom('1.5')}>Close</button>
                </div>
                <label>
                  <span>Camera zoom · {numberValue(zoom, 1).toFixed(2)}×</span>
                  <input type="range" min="0.35" max="3" step="0.05" value={zoom} onChange={event => {
                    setZoom(event.target.value);
                    applyZoom(event.target.value);
                  }} disabled={!loaded || recording} />
                </label>
                <p className="runtime-action-note">This controls the live runtime framing. The compositor below can sequence zoom changes and authored camera events on the episode timeline.</p>
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
                <p className="runtime-action-note">Manual recording captures the live canvas. “Record run” below starts recording and the episode timeline together, then stops automatically at the scene end.</p>
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
        currentZoom={numberValue(zoom, 1)}
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
          <div><dt>Compositor</dt><dd>Timed browser-runtime cue executor</dd></div>
        </dl>
      </details>
    </section>
  );
}
