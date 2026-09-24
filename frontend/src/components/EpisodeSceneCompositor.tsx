import { useEffect, useMemo, useRef, useState } from 'react';
import type { Application } from '@splinetool/runtime';
import { CircleDot, ListVideo, Pause, Play, Plus, RotateCcw, Square, Trash2, Video } from 'lucide-react';
import type { RuntimeObject } from '../lib/runtimeSceneProof';
import {
  clampEpisodeSceneTime,
  createEpisodeSceneCue,
  formatEpisodeSceneTime,
  sortEpisodeSceneCues,
  type EpisodeSceneCue,
  type EpisodeSceneCueKind,
  type EpisodeScenePlaybackState
} from '../lib/episodeSceneTimeline';

const EVENT_TYPES = ['mouseDown', 'mouseHover', 'mouseUp', 'keyDown', 'keyUp', 'start', 'lookAt', 'follow', 'scroll'];
const CUE_LABELS: Record<EpisodeSceneCueKind, string> = {
  state: 'Set state',
  event: 'Run animation',
  move: 'Move object',
  zoom: 'Camera zoom',
  visibility: 'Show / hide'
};

type RuntimeStatus = { tone: 'neutral' | 'working' | 'success' | 'error'; text: string };
type ObjectBaseline = {
  uuid: string;
  x: number;
  y: number;
  z: number;
  visible: boolean | undefined;
  state: string | number | undefined;
};
type SceneBaseline = { zoom: number; objects: ObjectBaseline[] };
type RunLogEntry = { id: string; atMs: number; text: string };

type EpisodeSceneCompositorProps = {
  app: Application | null;
  objects: RuntimeObject[];
  ready: boolean;
  selectedUuid: string;
  currentZoom: number;
  sceneRevision: number;
  recording: boolean;
  onStartRecording: (fileBase: string) => boolean;
  onStopRecording: () => void;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
  onStatus: (status: RuntimeStatus) => void;
};

function stateValue(rawValue: string) {
  const raw = rawValue.trim();
  const numeric = Number(raw);
  return Number.isFinite(numeric) && /^-?\d+(\.\d+)?$/.test(raw) ? numeric : raw;
}

function finite(value: number, fallback: number) {
  return Number.isFinite(value) ? value : fallback;
}

export function EpisodeSceneCompositor(props: EpisodeSceneCompositorProps) {
  const {
    app,
    objects,
    ready,
    selectedUuid,
    currentZoom,
    sceneRevision,
    recording,
    onStartRecording,
    onStopRecording,
    onPauseRecording,
    onResumeRecording,
    onStatus
  } = props;

  const [sceneName, setSceneName] = useState('Episode Scene 01');
  const [durationMs, setDurationMs] = useState(8000);
  const [playheadMs, setPlayheadMs] = useState(0);
  const [playbackState, setPlaybackState] = useState<EpisodeScenePlaybackState>('idle');
  const [cues, setCues] = useState<EpisodeSceneCue[]>([]);
  const [runLog, setRunLog] = useState<RunLogEntry[]>([]);

  const baselineRef = useRef<SceneBaseline | null>(null);
  const executedRef = useRef<Set<string>>(new Set());
  const frameRef = useRef<number | null>(null);
  const recordingRunRef = useRef(false);

  const namedObjects = useMemo(
    () => [...objects]
      .filter(object => Boolean(object.name?.trim()))
      .sort((a, b) => a.name.localeCompare(b.name) || a.uuid.localeCompare(b.uuid)),
    [objects]
  );
  const sortedCues = useMemo(() => sortEpisodeSceneCues(cues), [cues]);
  const hasEventCues = cues.some(cue => cue.kind === 'event');
  const transportLocked = !ready || !app || cues.length === 0;
  const canResumeRecording = recording && playbackState === 'paused' && recordingRunRef.current;

  useEffect(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    baselineRef.current = null;
    executedRef.current.clear();
    recordingRunRef.current = false;
    setPlayheadMs(0);
    setPlaybackState('idle');
    setRunLog([]);
  }, [sceneRevision, ready]);

  useEffect(() => () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
  }, []);

  function target(cue: EpisodeSceneCue) {
    return cue.targetUuid ? objects.find(object => object.uuid === cue.targetUuid) ?? null : null;
  }

  function captureBaseline() {
    const baseline: SceneBaseline = {
      zoom: currentZoom,
      objects: objects.map(object => ({
        uuid: object.uuid,
        x: object.position.x,
        y: object.position.y,
        z: object.position.z,
        visible: typeof object.visible === 'boolean' ? object.visible : undefined,
        state: object.state
      }))
    };
    baselineRef.current = baseline;
    return baseline;
  }

  function ensureBaseline() {
    return baselineRef.current ?? captureBaseline();
  }

  function restoreBaseline() {
    if (!app) return;
    const baseline = ensureBaseline();
    const objectMap = new Map(objects.map(object => [object.uuid, object]));
    baseline.objects.forEach(snapshot => {
      const object = objectMap.get(snapshot.uuid);
      if (!object) return;
      object.position.x = snapshot.x;
      object.position.y = snapshot.y;
      object.position.z = snapshot.z;
      if (snapshot.visible !== undefined && typeof object.visible === 'boolean') object.visible = snapshot.visible;
      if (snapshot.state !== undefined) object.state = snapshot.state;
    });
    app.setZoom(baseline.zoom);
    app.play();
  }

  function description(cue: EpisodeSceneCue) {
    const objectName = target(cue)?.name || 'Object';
    switch (cue.kind) {
      case 'state': return `${objectName} → state ${cue.stateValue || '1'}`;
      case 'event': return `${objectName} → ${cue.eventName || 'mouseDown'}`;
      case 'move': return `${objectName} → (${cue.x ?? 0}, ${cue.y ?? 0}, ${cue.z ?? 0})`;
      case 'zoom': return `Camera → ${(cue.zoom ?? 1).toFixed(2)}×`;
      case 'visibility': return `${objectName} → ${cue.visible === false ? 'hidden' : 'visible'}`;
    }
  }

  function execute(cue: EpisodeSceneCue, preview = false) {
    if (!app) throw new Error('Live scene is not ready.');
    const object = target(cue);
    if (cue.kind !== 'zoom' && !object) throw new Error(`Timeline target is missing for ${CUE_LABELS[cue.kind]}.`);
    app.play();

    switch (cue.kind) {
      case 'state':
        object!.state = stateValue(cue.stateValue || '1');
        break;
      case 'event':
        if (!preview) {
          const emit = app.emitEvent as unknown as (eventName: string, objectId: string) => void;
          emit(cue.eventName || 'mouseDown', object!.uuid);
        }
        break;
      case 'move':
        object!.position.x = finite(cue.x ?? object!.position.x, object!.position.x);
        object!.position.y = finite(cue.y ?? object!.position.y, object!.position.y);
        object!.position.z = finite(cue.z ?? object!.position.z, object!.position.z);
        break;
      case 'zoom':
        app.setZoom(Math.max(.1, finite(cue.zoom ?? 1, 1)));
        break;
      case 'visibility':
        if (typeof object!.visible === 'boolean') object!.visible = cue.visible !== false;
        break;
    }
  }

  function cancelFrame() {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
  }

  function logCue(cue: EpisodeSceneCue) {
    setRunLog(previous => [
      ...previous.slice(-11),
      { id: `${cue.id}-${performance.now()}`, atMs: cue.atMs, text: description(cue) }
    ]);
  }

  function finishRun() {
    cancelFrame();
    setPlayheadMs(durationMs);
    setPlaybackState('complete');
    onStatus({ tone: 'success', text: `Episode scene completed · ${formatEpisodeSceneTime(durationMs)}.` });
    if (recordingRunRef.current) {
      recordingRunRef.current = false;
      window.setTimeout(onStopRecording, 140);
    }
  }

  function startLoop(fromMs: number) {
    if (!app) return;
    cancelFrame();
    app.play();
    setPlaybackState('playing');
    onStatus({ tone: 'working', text: `Running ${sceneName.trim() || 'episode scene'}…` });

    const startedAt = performance.now();
    const startPlayhead = clampEpisodeSceneTime(fromMs, durationMs);
    const runCues = sortEpisodeSceneCues(cues);

    const tick = (now: number) => {
      const nextPlayhead = clampEpisodeSceneTime(startPlayhead + (now - startedAt), durationMs);
      try {
        runCues.forEach(cue => {
          if (cue.atMs > nextPlayhead || executedRef.current.has(cue.id)) return;
          execute(cue);
          executedRef.current.add(cue.id);
          logCue(cue);
        });
      } catch (error) {
        cancelFrame();
        setPlaybackState('error');
        if (recordingRunRef.current) {
          recordingRunRef.current = false;
          onStopRecording();
        }
        onStatus({ tone: 'error', text: error instanceof Error ? error.message : 'Episode scene execution failed.' });
        return;
      }

      setPlayheadMs(nextPlayhead);
      if (nextPlayhead >= durationMs) return finishRun();
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
  }

  function play() {
    if (transportLocked) {
      onStatus({ tone: 'error', text: ready ? 'Add at least one timeline cue first.' : 'Load the live scene first.' });
      return;
    }
    if (playbackState === 'complete' || playheadMs >= durationMs) {
      restoreBaseline();
      executedRef.current.clear();
      setRunLog([]);
      setPlayheadMs(0);
      startLoop(0);
      return;
    }
    ensureBaseline();
    if (canResumeRecording) onResumeRecording();
    startLoop(playheadMs);
  }

  function pause() {
    if (playbackState !== 'playing') return;
    cancelFrame();
    setPlaybackState('paused');
    if (recordingRunRef.current) onPauseRecording();
    onStatus({ tone: 'neutral', text: `Episode scene paused at ${formatEpisodeSceneTime(playheadMs)}.` });
  }

  function stop() {
    cancelFrame();
    setPlaybackState('idle');
    if (recordingRunRef.current) {
      recordingRunRef.current = false;
      onStopRecording();
    }
    onStatus({ tone: 'neutral', text: `Episode scene stopped at ${formatEpisodeSceneTime(playheadMs)}.` });
  }

  function restart() {
    if (transportLocked) return;
    cancelFrame();
    if (recordingRunRef.current) {
      recordingRunRef.current = false;
      onStopRecording();
    }
    ensureBaseline();
    restoreBaseline();
    executedRef.current.clear();
    setRunLog([]);
    setPlayheadMs(0);
    startLoop(0);
  }

  function recordRun() {
    if (transportLocked || recording) return;
    ensureBaseline();
    restoreBaseline();
    executedRef.current.clear();
    setRunLog([]);
    setPlayheadMs(0);
    const fileBase = (sceneName.trim() || 'episode-scene').replace(/[^a-z0-9-_]+/gi, '-');
    if (!onStartRecording(fileBase)) return;
    recordingRunRef.current = true;
    onStatus({ tone: 'working', text: 'Recording synchronized episode scene…' });
    window.setTimeout(() => startLoop(0), 90);
  }

  function previewAt(targetMs: number) {
    if (!app || playbackState === 'playing' || recording) return;
    const next = clampEpisodeSceneTime(targetMs, durationMs);
    ensureBaseline();
    restoreBaseline();
    executedRef.current.clear();
    try {
      sortedCues.forEach(cue => {
        if (cue.atMs > next) return;
        if (cue.kind !== 'event') execute(cue, true);
        executedRef.current.add(cue.id);
      });
      setPlayheadMs(next);
      setPlaybackState('idle');
      onStatus({ tone: 'neutral', text: `Previewing ${formatEpisodeSceneTime(next)}. Event animations run only during playback.` });
    } catch (error) {
      setPlaybackState('error');
      onStatus({ tone: 'error', text: error instanceof Error ? error.message : 'Could not preview the timeline.' });
    }
  }

  function changeDuration(seconds: number) {
    const next = Math.round(Math.max(.5, Math.min(120, finite(seconds, 8))) * 1000);
    setDurationMs(next);
    setPlayheadMs(current => Math.min(current, next));
    setCues(previous => previous.map(cue => ({ ...cue, atMs: Math.min(cue.atMs, next) })));
  }

  function addCue() {
    const object = objects.find(item => item.uuid === selectedUuid) ?? namedObjects[0];
    setCues(previous => [...previous, createEpisodeSceneCue('state', playheadMs, object?.uuid ?? '')]);
  }

  function updateCue(id: string, patch: Partial<EpisodeSceneCue>) {
    setCues(previous => previous.map(cue => cue.id === id ? { ...cue, ...patch } : cue));
  }

  function changeCueKind(cue: EpisodeSceneCue, kind: EpisodeSceneCueKind) {
    const object = target(cue) ?? objects.find(item => item.uuid === selectedUuid) ?? namedObjects[0];
    const replacement: EpisodeSceneCue = {
      id: cue.id,
      atMs: cue.atMs,
      kind,
      targetUuid: kind === 'zoom' ? undefined : (cue.targetUuid || object?.uuid || ''),
      stateValue: kind === 'state' ? '1' : undefined,
      eventName: kind === 'event' ? 'mouseDown' : undefined,
      x: kind === 'move' ? object?.position.x ?? 0 : undefined,
      y: kind === 'move' ? object?.position.y ?? 0 : undefined,
      z: kind === 'move' ? object?.position.z ?? 0 : undefined,
      zoom: kind === 'zoom' ? currentZoom : undefined,
      visible: kind === 'visibility' ? true : undefined
    };
    setCues(previous => previous.map(item => item.id === cue.id ? replacement : item));
  }

  function removeCue(id: string) {
    setCues(previous => previous.filter(cue => cue.id !== id));
    executedRef.current.delete(id);
  }

  const playDisabled = transportLocked || playbackState === 'playing' || (recording && !canResumeRecording);
  const editorLocked = playbackState === 'playing' || recording;

  return (
    <section className="episode-compositor">
      <div className="episode-compositor-heading">
        <div>
          <span>EPISODE SCENE COMPOSITOR</span>
          <strong>Run the shot as a timed scene</strong>
          <small>Sequence object states, authored animations, movement, visibility and camera zoom on one browser timeline.</small>
        </div>
        <div className="episode-scene-meta">
          <label><span>Scene name</span><input value={sceneName} onChange={event => setSceneName(event.target.value)} disabled={playbackState === 'playing'} /></label>
          <label><span>Length</span><div><input type="number" min="0.5" max="120" step="0.5" value={durationMs / 1000} onChange={event => changeDuration(Number(event.target.value))} disabled={playbackState === 'playing'} /><b>s</b></div></label>
        </div>
      </div>

      <div className="episode-transport">
        <button className="episode-transport-primary" disabled={playDisabled} onClick={play}><Play size={16} /> {playbackState === 'paused' ? 'Resume' : 'Play'}</button>
        <button disabled={playbackState !== 'playing'} onClick={pause}><Pause size={16} /> Pause</button>
        <button disabled={playbackState === 'idle' && playheadMs === 0} onClick={stop}><Square size={13} /> Stop</button>
        <button disabled={transportLocked || recording} onClick={restart}><RotateCcw size={15} /> Restart</button>
        <button className="episode-record-run" disabled={transportLocked || recording || playbackState === 'playing'} onClick={recordRun}><Video size={16} /> Record run</button>
        <div className={`episode-playback-state ${playbackState}`}><CircleDot size={13} /> {playbackState}</div>
      </div>

      <div className="episode-playhead">
        <div className="episode-playhead-labels"><strong>{formatEpisodeSceneTime(playheadMs)}</strong><span>{formatEpisodeSceneTime(durationMs)}</span></div>
        <input type="range" min="0" max={durationMs} step="50" value={Math.min(playheadMs, durationMs)} disabled={!ready || playbackState === 'playing' || recording} onChange={event => previewAt(Number(event.target.value))} aria-label="Episode scene playhead" />
        <div className="episode-cue-markers" aria-hidden="true">{sortedCues.map(cue => <i key={cue.id} style={{ left: `${Math.min(100, cue.atMs / durationMs * 100)}%` }} />)}</div>
      </div>

      <div className="episode-cue-header">
        <div><ListVideo size={17} /><div><strong>{cues.length} timeline {cues.length === 1 ? 'cue' : 'cues'}</strong><span>Add actions at the current playhead, then run the complete shot.</span></div></div>
        <button disabled={!ready || editorLocked} onClick={addCue}><Plus size={15} /> Add cue at {(playheadMs / 1000).toFixed(1)}s</button>
      </div>

      <div className="episode-cue-list">
        {sortedCues.length === 0 ? (
          <div className="episode-cue-empty"><strong>No scene cues yet.</strong><span>Move the playhead to a moment, press “Add cue”, then choose what should happen there.</span></div>
        ) : sortedCues.map((cue, index) => {
          const object = target(cue);
          return (
            <article className={`episode-cue-row ${playheadMs >= cue.atMs ? 'reached' : ''}`} key={cue.id}>
              <div className="episode-cue-index">{String(index + 1).padStart(2, '0')}</div>
              <label className="episode-cue-time"><span>Time</span><div><input type="number" min="0" max={durationMs / 1000} step="0.1" value={(cue.atMs / 1000).toFixed(1)} disabled={editorLocked} onChange={event => updateCue(cue.id, { atMs: clampEpisodeSceneTime(Number(event.target.value) * 1000, durationMs) })} /><b>s</b></div></label>
              <label><span>Action</span><select value={cue.kind} disabled={editorLocked} onChange={event => changeCueKind(cue, event.target.value as EpisodeSceneCueKind)}>{(Object.keys(CUE_LABELS) as EpisodeSceneCueKind[]).map(kind => <option key={kind} value={kind}>{CUE_LABELS[kind]}</option>)}</select></label>
              {cue.kind !== 'zoom' && <label className="episode-cue-target"><span>Object</span><select value={cue.targetUuid || ''} disabled={editorLocked} onChange={event => updateCue(cue.id, { targetUuid: event.target.value })}><option value="">Choose object…</option>{namedObjects.map(item => <option key={item.uuid} value={item.uuid}>{item.name}</option>)}</select></label>}
              <div className="episode-cue-value">
                {cue.kind === 'state' && <label><span>State</span><input value={cue.stateValue || ''} disabled={editorLocked} onChange={event => updateCue(cue.id, { stateValue: event.target.value })} placeholder="ACTIVE or 1" /></label>}
                {cue.kind === 'event' && <label><span>Animation</span><select value={cue.eventName || 'mouseDown'} disabled={editorLocked} onChange={event => updateCue(cue.id, { eventName: event.target.value })}>{EVENT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}</select></label>}
                {cue.kind === 'move' && <div className="episode-cue-vector"><label><span>X</span><input type="number" value={cue.x ?? object?.position.x ?? 0} disabled={editorLocked} onChange={event => updateCue(cue.id, { x: Number(event.target.value) })} /></label><label><span>Y</span><input type="number" value={cue.y ?? object?.position.y ?? 0} disabled={editorLocked} onChange={event => updateCue(cue.id, { y: Number(event.target.value) })} /></label><label><span>Z</span><input type="number" value={cue.z ?? object?.position.z ?? 0} disabled={editorLocked} onChange={event => updateCue(cue.id, { z: Number(event.target.value) })} /></label></div>}
                {cue.kind === 'zoom' && <label><span>Zoom</span><input type="number" min="0.1" max="8" step="0.05" value={cue.zoom ?? 1} disabled={editorLocked} onChange={event => updateCue(cue.id, { zoom: Math.max(.1, Number(event.target.value)) })} /></label>}
                {cue.kind === 'visibility' && <label><span>Visibility</span><select value={cue.visible === false ? 'hidden' : 'visible'} disabled={editorLocked} onChange={event => updateCue(cue.id, { visible: event.target.value === 'visible' })}><option value="visible">Show</option><option value="hidden">Hide</option></select></label>}
              </div>
              <button className="episode-cue-delete" aria-label="Delete cue" disabled={editorLocked} onClick={() => removeCue(cue.id)}><Trash2 size={15} /></button>
            </article>
          );
        })}
      </div>

      <div className="episode-compositor-note"><span>Scrubbing previews state, movement, visibility and zoom. {hasEventCues ? 'Authored event animations fire only during Play / Record so scrubbing cannot accidentally advance an event state machine.' : 'Add an animation cue when you want to trigger an authored Spline event.'}</span></div>

      {runLog.length > 0 && <details className="episode-run-log"><summary>Run log · {runLog.length} executed actions</summary><div>{runLog.map(entry => <p key={entry.id}><b>{formatEpisodeSceneTime(entry.atMs)}</b><span>{entry.text}</span></p>)}</div></details>}
    </section>
  );
}
