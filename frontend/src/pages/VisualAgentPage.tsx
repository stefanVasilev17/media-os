import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Download,
  Eye,
  LoaderCircle,
  Lock,
  Play,
  ShieldCheck
} from 'lucide-react';
import { loadCreativeStage, type CreativeStageState, type ScriptArtifact } from '../api/creativeApi';
import {
  loadProductionContract,
  type ProductionContractSegment,
  type ProductionContractState
} from '../api/productionContractApi';
import {
  loadRemotionRender,
  loadVoiceShots,
  remotionRenderVideoUrl,
  startRemotionRender,
  type RemotionRenderState,
  type VoiceShotState
} from '../api/voiceApi';
import { loadVoiceClips, syncVoiceClips, voiceClipAudioUrl, type VoiceClipState } from '../api/voiceClipApi';
import {
  loadVisualState,
  lockVisualShot,
  approveVisualTechnicalRerender,
  runVisualPostQa,
  runVisualPreflight,
  type VisualPostQa,
  type VisualPreflight,
  type VisualState
} from '../api/visualApi';
import { loadProductionMemory, rememberProductionCorrection, type ProductionMemoryRule } from '../api/productionMemoryApi';
import { buildVoiceShotBundles, buildVoiceShotBundlesFromContract, clock } from '../lib/ep001Production';
import '../styles/productionFlow.css';

const SHOT02_WORD_ANCHORS: Record<string, string[]> = {
  VALIDATE: ['validates'],
  SUBMIT: ['submit'],
  REQUEST_ASSEMBLY: ['request assembly'],
  PAYLOAD: ['payload'],
  IDENTITY: ['identity'],
  SECRET: ['secret'],
  HEADERS: ['headers'],
  USER_AGENT: ['user agent'],
  ACCEPT: ['accept'],
  REQUEST_CONTEXT: ['request context'],
  TIMESTAMP: ['timestamp'],
  SOURCE: ['source'],
  WHAT_SENDING: ['what are we sending'],
  HOW_READ: ['how should it be read'],
  SYSTEM_KNOW: ['what should the system know'],
  REQUEST_READY: ['structured message ready']
};

const SHOT03_WORD_ANCHORS: Record<string, string[]> = {
  REQUEST_ASSEMBLY:['request assembly'],
  PAYLOAD:['payload'],
  HEADERS:['headers'],
  REQUEST_CONTEXT:['request context'],
  MESSAGE_READY:['message being ready'],
  YOUR_SIDE:['your side'],
  SPINNER:['spinner'],
  DISABLED:['disabled'],
  NETWORK_TRANSIT:['network transit'],
  API_GATEWAY:['api gateway'],
  LOAD_BALANCER:['load balancer'],
  AUTH_SERVICE:['auth service'],
  USER_DATABASE:['user database'],
  READY_NOT_SENT:['ready is not the same as sent'],
};

const SHOT03_REQUIRED_ANCHORS = Object.keys(SHOT03_WORD_ANCHORS);

const SHOT02_REQUIRED_ANCHORS = [
  'VALIDATE', 'SUBMIT', 'REQUEST_ASSEMBLY', 'PAYLOAD', 'IDENTITY', 'SECRET',
  'HEADERS', 'USER_AGENT', 'ACCEPT', 'REQUEST_CONTEXT', 'TIMESTAMP', 'SOURCE'
];

function anchorsOf(row?: VoiceShotState) {
  const alignment = row?.alignment as {
    anchors?: Record<string, number>;
    words?: Array<{ text: string; start: number }>;
  } | undefined;
  const anchors = { ...(alignment?.anchors || {}) };
  const phrases = row?.shotKey === 'SHOT 02'
    ? SHOT02_WORD_ANCHORS
    : row?.shotKey === 'SHOT 03' ? SHOT03_WORD_ANCHORS : null;
  if (!phrases || !Array.isArray(alignment?.words)) return anchors;

  const tokens = alignment.words.flatMap(word => {
    const start = Number(word.start);
    if (!Number.isFinite(start) || start < 0) return [];
    return String(word.text || '').toLowerCase().split(/[^a-z0-9]+/)
      .filter(Boolean).map(value => ({ value, start }));
  });

  for (const [key, candidates] of Object.entries(phrases)) {
    for (const phrase of candidates) {
      const parts = phrase.split(' ');
      const index = tokens.findIndex((token, start) =>
        parts.every((part, offset) => tokens[start + offset]?.value === part)
      );
      if (index >= 0) {
        anchors[key] = tokens[index].start;
        break;
      }
    }
  }
  return anchors;
}


const VISUAL_FPS = 30;

type ContractPacingWindow = {
  clip: VoiceClipState;
  rawStart: number;
  rawEnd: number;
  plannedStart: number;
  plannedEnd: number;
};

function buildShot01ComprehensionPacing(
  shotStartSecond: number,
  shotEndSecond: number,
  clips: VoiceClipState[],
  segments: ProductionContractSegment[],
  rawAnchors: Record<string, number>
) {
  if (clips.length === 0 || segments.length === 0) return null;

  const MAX_SILENCE_SECONDS = 0.8;
  const MIN_TRANSITION_SECONDS = 0.25;
  const segmentByClip = new Map(segments.map(segment => [segment.clipKey, segment]));
  let rawCursor = 0;
  let previousAudioEnd = 0;
  const windows: ContractPacingWindow[] = [];

  for (const [index, clip] of clips.entries()) {
    const segment = segmentByClip.get(clip.clipKey);
    if (!segment || clip.durationSeconds <= 0) return null;

    const contractStart = Math.max(0, segment.startSecond - shotStartSecond);
    const earliestStart = index === 0 ? contractStart : previousAudioEnd + MIN_TRANSITION_SECONDS;
    const latestStart = index === 0 ? contractStart : previousAudioEnd + MAX_SILENCE_SECONDS;
    const plannedStart = index === 0
      ? contractStart
      : Math.max(earliestStart, Math.min(contractStart, latestStart));
    const plannedEnd = plannedStart + clip.durationSeconds;

    windows.push({
      clip,
      rawStart: rawCursor,
      rawEnd: rawCursor + clip.durationSeconds,
      plannedStart,
      plannedEnd
    });
    rawCursor += clip.durationSeconds;
    previousAudioEnd = plannedEnd;
  }

  const pacedAnchors = Object.fromEntries(
    Object.entries(rawAnchors).map(([key, rawSeconds]) => {
      if (!Number.isFinite(rawSeconds)) return [key, rawSeconds];
      const window = windows.find((item, index) =>
        rawSeconds <= item.rawEnd + 0.02 || index === windows.length - 1
      ) || windows[windows.length - 1];
      const localSeconds = Math.max(0, Math.min(window.clip.durationSeconds, rawSeconds - window.rawStart));
      return [key, window.plannedStart + localSeconds];
    })
  );

  const comprehensionHolds = windows.slice(0, -1).flatMap((window, index) => {
    const next = windows[index + 1];
    const gapStart = window.plannedEnd;
    const gapEnd = next.plannedStart;
    if (gapEnd - gapStart < 0.3) return [];

    const transitionBuffer = Math.min(0.22, (gapEnd - gapStart) * 0.25);
    const canonicalSecond = Math.max(0, next.plannedStart - transitionBuffer);
    return [{
      fromFrame: Math.max(0, Math.ceil(gapStart * VISUAL_FPS)),
      toFrame: Math.max(0, Math.floor(gapEnd * VISUAL_FPS)),
      canonicalFrame: Math.max(0, Math.round(canonicalSecond * VISUAL_FPS))
    }];
  });

  const contractDuration = Math.max(0, shotEndSecond - shotStartSecond);
  const lastAudioEnd = windows[windows.length - 1].plannedEnd;
  const pacedDuration = Math.max(
    lastAudioEnd,
    Math.min(contractDuration, lastAudioEnd + MAX_SILENCE_SECONDS)
  );

  return {
    windows,
    pacedAnchors,
    comprehensionHolds,
    durationInFrames: Math.max(1, Math.round(pacedDuration * VISUAL_FPS))
  };
}

function formatTimecode(seconds: number) {
  const safe = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  const minutes = Math.floor(safe / 60);
  const wholeSeconds = Math.floor(safe % 60);
  const milliseconds = Math.floor((safe - Math.floor(safe)) * 1000);
  return String(minutes).padStart(2, '0') + ':' +
    String(wholeSeconds).padStart(2, '0') + '.' +
    String(milliseconds).padStart(3, '0');
}

async function downloadVideo(renderId: string) {
  const response = await fetch(remotionRenderVideoUrl(renderId));
  if (!response.ok) throw new Error('Could not download the current episode preview.');
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'EP001_Current_Episode_Preview.mp4';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function VisualAgentPage() {
  const [script, setScript] = useState<CreativeStageState<ScriptArtifact> | null>(null);
  const [visual, setVisual] = useState<VisualState | null>(null);
  const [voiceShots, setVoiceShots] = useState<Record<string, VoiceShotState>>({});
  const [clips, setClips] = useState<VoiceClipState[]>([]);
  const [memory, setMemory] = useState<ProductionMemoryRule[]>([]);
  const [contract, setContract] = useState<ProductionContractState | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [preflight, setPreflight] = useState<VisualPreflight | null>(null);
  const [postQa, setPostQa] = useState<VisualPostQa | null>(null);
  const [activeRender, setActiveRender] = useState<RemotionRenderState | null>(null);
  const [correction, setCorrection] = useState('');
  const [busy, setBusy] = useState(false);
  const [locking, setLocking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [renderNotice, setRenderNotice] = useState('');
  const [previewCurrentTime, setPreviewCurrentTime] = useState(0);
  const [previewDuration, setPreviewDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const bundles = useMemo(() => script?.artifact ? buildVoiceShotBundles(script.artifact) : [], [script]);
  const currentShot = bundles[selectedIndex];
  const currentVisual = visual?.shots.find(shot => shot.shotKey === currentShot?.key);
  const contractSegments = useMemo(
    () => (contract?.payload?.timeline || []).filter(segment => segment.shotKey === currentShot?.key),
    [contract, currentShot?.key]
  );
  const previewId = visual?.preview.ready ? visual.preview.renderId : undefined;

  async function refresh(revision: number) {
    const [nextVisual, nextShots, nextClips] = await Promise.all([
      loadVisualState(revision),
      loadVoiceShots(revision),
      loadVoiceClips(revision)
    ]);
    setVisual(nextVisual);
    setVoiceShots(Object.fromEntries(nextShots.map(row => [row.shotKey, row])));
    setClips(nextClips);
    return nextVisual;
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [scriptState, rules, productionContract] = await Promise.all([
          loadCreativeStage<ScriptArtifact>('SCRIPT'),
          loadProductionMemory('VISUAL'),
          loadProductionContract()
        ]);
        if (!active) return;
        if (!scriptState.locked || !scriptState.artifact) throw new Error('Script must be LOCKED before Visual Agent.');
        setScript(scriptState);
        setMemory(rules);
        setContract(productionContract);
        const voiceBundles = productionContract.ready && productionContract.payload
          ? buildVoiceShotBundlesFromContract(productionContract.payload)
          : buildVoiceShotBundles(scriptState.artifact);
        await syncVoiceClips(scriptState.revision, voiceBundles);
        const nextVisual = await refresh(scriptState.revision);
        if (!active) return;
        const firstPending = nextVisual.shots.findIndex(shot => shot.qaStatus !== 'PASS');
        setSelectedIndex(firstPending === -1 ? 0 : firstPending);
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : 'Could not initialize Visual Agent.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    setPreflight(null);
    setPostQa(null);
    setActiveRender(null);
    setCorrection('');
    setRenderNotice('');
    setLocking(false);
  }, [selectedIndex]);

  useEffect(() => {
    setPreviewCurrentTime(0);
    setPreviewDuration(0);
  }, [previewId]);

  async function pollRender(renderId: string) {
    let transientFailures = 0;
    for (let attempt = 0; attempt < 3600; attempt++) {
      await new Promise(resolve => window.setTimeout(resolve, 2000));
      try {
        const next = await loadRemotionRender(renderId);
        transientFailures = 0;
        setActiveRender(next);
        if (next.status === 'READY' || next.status === 'FAILED') return next;
      } catch (cause) {
        transientFailures += 1;
        if (transientFailures >= 6) throw cause;
      }
    }
    throw new Error('Render is still running after two hours. Refresh Visual Agent to resume status tracking; do not start a duplicate render.');
  }

  async function updateCumulativePreview(revision: number) {
    const nextVisual = await refresh(revision);
    const passed = [...nextVisual.shots].sort((a, b) => a.startSecond - b.startSecond);
    const contiguous: typeof passed = [];
    for (const shot of passed) {
      const expected = 'SHOT ' + String(contiguous.length + 1).padStart(2, '0');
      if (shot.shotKey !== expected || shot.qaStatus !== 'PASS' || !shot.renderId) break;
      contiguous.push(shot);
    }
    if (contiguous.length === 0) return;

    const segments = contiguous.map(shot => ({
      shotKey: shot.shotKey,
      videoUrl: window.location.origin + remotionRenderVideoUrl(shot.renderId!),
      durationInFrames: Math.max(1, Math.ceil(shot.durationSeconds * 30))
    }));
    const durationInFrames = segments.reduce((sum, segment) => sum + segment.durationInFrames, 0);
    const render = await startRemotionRender('EP001-Voice-CurrentPreview', { durationInFrames, segments }, 'REVIEW');
    setActiveRender(render);
    const ready = await pollRender(render.renderId);
    if (ready.status === 'FAILED') throw new Error(ready.error || 'Current episode preview render failed.');
    await refresh(revision);
  }

  async function produceShot(technicalRerender = false) {
    if (!script || !currentShot || busy || locking) return;
    if (technicalRerender && (!currentVisual?.locked || !['SHOT 01', 'SHOT 02'].includes(currentShot.key))) return;
    const voiceShot = voiceShots[currentShot.key];
    if (!voiceShot) {
      setError('Voice shot state is missing. Refresh the Visual Agent and try again.');
      return;
    }

    setBusy(true);
    setError('');
    setRenderNotice('');
    setPostQa(null);
    try {
      if (!technicalRerender && correction.trim()) {
        await rememberProductionCorrection('VISUAL', correction.trim(), 'Visual Agent · ' + currentShot.key);
        setMemory(await loadProductionMemory('VISUAL'));
        setCorrection('');
      }

      const gate = await runVisualPreflight(script.revision, currentShot.key, technicalRerender);
      setPreflight(gate);
      if (!gate.passed) {
        const failed = gate.checks.filter(check => !check.passed);
        setError(
          failed.length > 0
            ? 'Preflight blocked: ' + failed.map(check => check.key + ' — ' + check.detail).join(' | ')
            : 'Shot creation was blocked before rendering because QA found a production-contract problem.'
        );
        return;
      }

      const related = clips
        .filter(clip => clip.shotKey === currentShot.key && clip.approved)
        .sort((a, b) => a.sequence - b.sequence);
      if (related.length === 0) throw new Error('Approved voice clips are missing for this shot.');

      const rawAnchors = anchorsOf(voiceShot);
      if (currentShot.key === 'SHOT 02') {
        const missing = SHOT02_REQUIRED_ANCHORS.filter(key => !Number.isFinite(rawAnchors[key]));
        if (missing.length > 0) {
          throw new Error(
            'SHOT 02 voice/visual sync is incomplete. Missing spoken-word anchors: ' +
            missing.join(', ') +
            '. Confirm the approved narration contains these terms before rendering.'
          );
        }
        const outOfOrder = SHOT02_REQUIRED_ANCHORS.some((key, index) =>
          index > 0 && rawAnchors[key] <= rawAnchors[SHOT02_REQUIRED_ANCHORS[index - 1]]
        );
        if (outOfOrder) {
          throw new Error(
            'SHOT 02 voice anchors are out of order. Check approved narration and word alignment before rendering.'
          );
        }
      }
      if (currentShot.key === 'SHOT 03') {
        const missing = SHOT03_REQUIRED_ANCHORS.filter(key => !Number.isFinite(rawAnchors[key]));
        if (missing.length > 0) {
          throw new Error(
            'SHOT 03 sync is incomplete. Missing spoken-word anchors: ' +
            missing.join(', ') +
            '. Review approved voice narration or alignment before rendering.'
          );
        }
        const outOfOrder = SHOT03_REQUIRED_ANCHORS.some((key, index) =>
          index > 0 && rawAnchors[key] <= rawAnchors[SHOT03_REQUIRED_ANCHORS[index - 1]]
        );
        if (outOfOrder) {
          throw new Error('SHOT 03 anchors are out of narration order. Review the approved voice timing.');
        }
      }
      const pacing = currentShot.key === 'SHOT 01'
        ? buildShot01ComprehensionPacing(
            currentShot.startSecond,
            currentShot.endSecond,
            related,
            contractSegments,
            rawAnchors
          )
        : null;

      let cursor = 0;
      const audioClips = pacing
        ? pacing.windows.map(item => ({
            src: window.location.origin + voiceClipAudioUrl(
              item.clip.clipKey,
              script.revision,
              item.clip.generationRevision
            ),
            fromFrame: Math.round(item.plannedStart * VISUAL_FPS),
            durationInFrames: Math.max(1, Math.ceil(item.clip.durationSeconds * VISUAL_FPS)),
            trimBeforeFrames: Math.max(0, Math.round((item.clip.leadingTrimSeconds || 0) * VISUAL_FPS))
          }))
        : related.map(clip => {
            const fromFrame = Math.round(cursor * VISUAL_FPS);
            const durationInFrames = Math.max(1, Math.ceil(clip.durationSeconds * VISUAL_FPS));
            cursor += clip.durationSeconds;
            return {
              src: window.location.origin + voiceClipAudioUrl(clip.clipKey, script.revision, clip.generationRevision),
              fromFrame,
              durationInFrames,
              trimBeforeFrames: Math.max(0, Math.round((clip.leadingTrimSeconds || 0) * VISUAL_FPS))
            };
          });

      const durationInFrames = pacing
        ? pacing.durationInFrames
        : Math.max(1, Math.ceil(cursor * VISUAL_FPS));
      const render = await startRemotionRender(gate.compositionId, {
        shotKey: currentShot.key,
        scriptRevision: script.revision,
        generationRevision: voiceShot.generationRevision,
        ...(technicalRerender ? { technicalRerender: true } : {}),
        ...((technicalRerender || currentVisual?.qaStatus === 'PASS')
          ? { directorRerenderId: crypto.randomUUID() }
          : {}),
        audioUrl: '',
        audioClips,
        durationInFrames,
        anchors: pacing?.pacedAnchors || rawAnchors,
        comprehensionHolds: pacing?.comprehensionHolds || [],
        visualContract: contractSegments
      }, 'REVIEW');
      setActiveRender(render);

      const ready = await pollRender(render.renderId);
      if (ready.status === 'FAILED') throw new Error(ready.error || 'Shot render failed.');

      const qa = await runVisualPostQa(script.revision, currentShot.key, ready.renderId);
      setPostQa(qa);
      if (!qa.passed) {
        setError('Render completed, but post-render QA rejected it. The cumulative episode was not changed.');
        await refresh(script.revision);
        return;
      }

      if (technicalRerender) {
        await refresh(script.revision);
        setRenderNotice('Fresh technical render passed QA. The original LOCKED MP4 is preserved until Director approval.');
      } else {
        await updateCumulativePreview(script.revision);
        setRenderNotice('Fresh SHOT render passed QA and the cumulative episode preview has been updated. Review before locking.');
      }
      setPreflight(gate);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create and validate the shot.');
    } finally {
      setBusy(false);
    }
  }

  async function validateSmoothCandidate() {
    if (!script || !currentShot || !currentVisual?.locked || busy || locking) return;
    const id = currentVisual.technicalCandidateRenderId;
    if (!id || currentVisual.technicalCandidateStatus !== 'SUCCEEDED') return;
    setBusy(true);
    setError('');
    try {
      const qa = await runVisualPostQa(script.revision, currentShot.key, id);
      setPostQa(qa);
      await refresh(script.revision);
      if (!qa.passed) setError('The technical candidate did not pass post-render QA. Original LOCKED footage remains active.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Candidate QA could not be resumed.');
    } finally {
      setBusy(false);
    }
  }

  async function approveSmoothCandidate() {
    if (!script || !currentShot || !currentVisual?.locked || busy || locking) return;
    const id = currentVisual.technicalCandidateRenderId;
    if (!id || currentVisual.technicalCandidateStatus !== 'SUCCEEDED'
        || currentVisual.technicalCandidateQaStatus !== 'PASS') {
      setError('The corrected MP4 must finish rendering and pass QA before approval.');
      return;
    }
    setLocking(true);
    setError('');
    try {
      await approveVisualTechnicalRerender(script.revision, currentShot.key, id);
      await updateCumulativePreview(script.revision);
    } catch (cause) {
      await refresh(script.revision);
      setError(cause instanceof Error ? cause.message : 'Could not approve technical render.');
    } finally {
      setLocking(false);
    }
  }

  async function lockShot() {
    if (!script || !currentShot || !currentVisual?.renderId || locking || busy) return;
    if (currentVisual.qaStatus !== 'PASS') {
      setError('Shot must pass post-render QA before Director LOCK.');
      return;
    }
    if (currentVisual.locked) return;

    setLocking(true);
    setError('');
    try {
      await lockVisualShot(script.revision, currentShot.key, currentVisual.renderId);
      await refresh(script.revision);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not lock the current visual shot.');
    } finally {
      setLocking(false);
    }
  }

  async function preview() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) await video.play();
    else video.pause();
  }

  if (loading) return <main className="production-loading"><LoaderCircle className="spin" size={22} /></main>;
  if (!script || !script.artifact || !visual || !currentShot) {
    return <main className="production-loading"><strong>{error || 'Visual Agent unavailable.'}</strong></main>;
  }

  const qaPassed = visual.shots.filter(shot => shot.qaStatus === 'PASS').length;
  const rendering = activeRender?.status === 'QUEUED' || activeRender?.status === 'RENDERING';

  return (
    <main className="production-page visual-agent-page">
      <header className="production-header">
        <div>
          <span>{script.episode.episodeNumber} · VISUAL AGENT · REMOTION</span>
          <h1>Episode Visual Production</h1>
          <p>{script.episode.title}</p>
        </div>
        <div className="memory-preflight-badge">{memory.length} MEMORY RULES LOADED</div>
      </header>

      {error && <div className="production-error">{error}</div>}
      {renderNotice && <div className="production-success">{renderNotice}</div>}

      <section className="production-summary">
        <div><span>ENGINE</span><strong>Remotion · CPU Render</strong></div>
        <div><span>QA PASSED</span><strong>{qaPassed}/{bundles.length} shots</strong></div>
        <div><span>REVIEW SURFACE</span><strong>One cumulative episode video</strong></div>
      </section>

      <section className="episode-master-preview">
        <div className="production-section-head">
          <div>
            <span>CURRENT EPISODE PREVIEW</span>
            <h2>Only QA-approved contiguous shots appear here.</h2>
          </div>
          <div className="preview-actions">
            <button type="button" disabled={!previewId} onClick={() => void preview()}><Eye size={15} /> Preview</button>
            <button type="button" disabled={!previewId} onClick={() => previewId && void downloadVideo(previewId)}><Download size={15} /> Download</button>
          </div>
        </div>
        {previewId ? (
          <>
            <video
              ref={videoRef}
              controls
              preload="metadata"
              playsInline
              src={remotionRenderVideoUrl(previewId)}
              onLoadedMetadata={event => setPreviewDuration(event.currentTarget.duration || 0)}
              onDurationChange={event => setPreviewDuration(event.currentTarget.duration || 0)}
              onTimeUpdate={event => setPreviewCurrentTime(event.currentTarget.currentTime || 0)}
              onSeeked={event => setPreviewCurrentTime(event.currentTarget.currentTime || 0)}
            />
            <div className="episode-preview-timecode" aria-live="off">
              <span>CURRENT</span>
              <strong>{formatTimecode(previewCurrentTime)}</strong>
              <span>/</span>
              <strong>{formatTimecode(previewDuration)}</strong>
              <small>Approved voice-synced episode time</small>
            </div>
          </>
        ) : (
          <div className="preview-empty"><Play size={24} /><strong>No QA-approved episode preview yet.</strong><span>Shot 01 will create the first cumulative preview.</span></div>
        )}
      </section>

      <nav className="production-shot-rail" aria-label="Visual shots">
        {bundles.map((shot, index) => {
          const state = visual.shots.find(item => item.shotKey === shot.key);
          return (
            <button
              type="button"
              key={shot.key}
              className={(index === selectedIndex ? 'active ' : '') + (state?.qaStatus === 'PASS' ? 'done' : '')}
              onClick={() => setSelectedIndex(index)}
              title={shot.key + ' · ' + shot.title}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              {state?.qaStatus === 'PASS' && <Check size={11} />}
            </button>
          );
        })}
      </nav>

      <section className="visual-shot-control">
        <div className="production-section-head">
          <div>
            <span>{currentShot.key} · {clock(currentShot.startSecond)}–{clock(currentShot.endSecond)}</span>
            <h2>{currentShot.title}</h2>
          </div>
          <strong className={currentVisual?.qaStatus === 'PASS' ? 'status-ready' : ''}>
            {currentVisual?.locked
              ? 'DIRECTOR LOCKED'
              : currentVisual?.qaStatus === 'PASS'
                ? 'QA PASSED'
                : currentVisual?.voiceReady
                  ? 'VOICE READY'
                  : 'WAITING FOR VOICE'}
          </strong>
        </div>

        <div className="visual-contract-grid">
          <div>
            <span>REMOTION COMPOSITION</span>
            <strong>{currentVisual?.compositionId || 'Not implemented yet'}</strong>
            <p>{currentVisual?.compositionId
              ? 'Uses the approved reusable world and semantic voice timing.'
              : 'Visual Agent will not invent a production render until this shot has an approved Remotion composition.'}</p>
          </div>
          <div>
            <span>IMPORTED VISUAL CONTRACT</span>
            <strong>{contractSegments.length ? contractSegments.length + ' timeline block(s)' : 'No HEAR / SEE import'}</strong>
            <p>{contractSegments.length
              ? 'The instructions below are the shot contract; Remotion implementation must preserve their meaning and timing.'
              : 'Import a production contract in Script Agent to provide explicit what-you-see direction.'}</p>
          </div>
        </div>

        {contractSegments.length > 0 && (
          <div className="visual-imported-timeline">
            {contractSegments.map(segment => (
              <article key={segment.segmentId}>
                <div><strong>{clock(segment.startSecond)}–{clock(segment.endSecond)}</strong><span>{segment.clipKey}</span></div>
                <p>{segment.visual.summary}</p>
                <small>
                  {[
                    segment.visual.camera ? 'Camera: ' + segment.visual.camera : '',
                    segment.visual.attentionCue ? 'Attention: ' + segment.visual.attentionCue : '',
                    segment.visual.effects?.length ? 'Effects: ' + segment.visual.effects.join(' · ') : ''
                  ].filter(Boolean).join(' · ')}
                </small>
              </article>
            ))}
          </div>
        )}

        <div className="visual-correction">
          <label>Correction to store in Production Memory <small>optional; applied before preflight</small></label>
          <textarea
            value={correction}
            onChange={event => setCorrection(event.target.value)}
            rows={3}
            disabled={currentVisual?.locked}
            placeholder={currentVisual?.locked
              ? 'Shot is Director LOCKED. An explicit unlock is required before visual corrections.'
              : 'Example: Do not zoom while the system is waiting; hold the camera still. This rule will be checked on future visual work.'}
          />
        </div>

        <div className="visual-main-actions">
          {currentVisual?.locked && (currentShot.key === 'SHOT 01' || currentShot.key === 'SHOT 02') && (
            <button
              type="button"
              className="primary"
              disabled={busy || locking || rendering}
              onClick={() => void produceShot(true)}
            >
              {busy ? <LoaderCircle className="spin" size={15} /> : <ShieldCheck size={15} />}
              {rendering ? 'Rendering ' + Math.max(0, activeRender?.progress || 0) + '%'
                : busy ? 'Preparing smooth-motion candidate…' : 'Render Smooth Candidate (keep LOCKED)'}
            </button>
          )}
          {!currentVisual?.locked && (
            <button
              type="button"
              className={currentVisual?.qaStatus === 'PASS' ? '' : 'primary'}
              disabled={busy || locking || rendering}
              onClick={() => void produceShot()}
            >
              {busy ? <LoaderCircle className="spin" size={15} /> : <ShieldCheck size={15} />}
              {rendering
                ? 'Rendering ' + Math.max(0, activeRender?.progress || 0) + '%'
                : busy
                  ? 'Validating production contract…'
                  : currentVisual?.qaStatus === 'PASS'
                    ? 'Recreate / Validate Shot'
                    : 'Create / Validate Shot'}
            </button>
          )}
          {currentVisual?.qaStatus === 'PASS' && (
            <button
              type="button"
              className="primary"
              disabled={busy || locking || currentVisual.locked || !currentVisual.renderId}
              onClick={() => void lockShot()}
            >
              {locking ? <LoaderCircle className="spin" size={15} /> : <Lock size={15} />}
              {currentVisual.locked ? 'SHOT LOCKED' : locking ? 'Locking approved render…' : 'LOCK SHOT'}
            </button>
          )}
        </div>

        {currentVisual?.locked && currentVisual.technicalCandidateRenderId && (
          <section className="visual-technical-review">
            <strong>SMOOTH-MOTION CANDIDATE · ORIGINAL DIRECTOR LOCK PROTECTED</strong>
            <p>Review the corrected MP4 before replacing the approved version. The current episode preview stays unchanged until you approve.</p>
            {currentVisual.technicalCandidateStatus === 'SUCCEEDED' ? (
              <video
                key={currentVisual.technicalCandidateRenderId}
                controls
                preload="metadata"
                playsInline
                style={{width:'100%',maxHeight:480,background:'#030914',borderRadius:12}}
                src={remotionRenderVideoUrl(currentVisual.technicalCandidateRenderId)}
              />
            ) : (
              <p>Candidate status: {currentVisual.technicalCandidateStatus || 'UNKNOWN'}. Refresh the page to check progress.</p>
            )}
            <div className="visual-main-actions">
              {currentVisual.technicalCandidateStatus === 'SUCCEEDED'
                && currentVisual.technicalCandidateQaStatus !== 'PASS' && (
                <button
                  type="button"
                  disabled={busy || locking}
                  onClick={() => void validateSmoothCandidate()}
                >
                  {busy ? <LoaderCircle className="spin" size={15}/> : <ShieldCheck size={15}/>}
                  Validate Candidate QA
                </button>
              )}
              <button
                type="button"
                className="primary"
                disabled={busy || locking || currentVisual.technicalCandidateStatus !== 'SUCCEEDED'
                  || currentVisual.technicalCandidateQaStatus !== 'PASS'}
                onClick={() => void approveSmoothCandidate()}
              >
                {locking ? <LoaderCircle className="spin" size={15}/> : <Lock size={15}/>}
                Approve Corrected MP4 and Keep LOCKED
              </button>
            </div>
          </section>
        )}

        {preflight && (
          <div className={'qa-checks ' + (preflight.passed ? 'pass' : 'fail')}>
            <div><strong>{preflight.passed ? 'PRE-FLIGHT PASS' : 'PRE-FLIGHT BLOCKED'}</strong><span>{preflight.memoryPreflight.ruleCount} memory rules checked</span></div>
            {preflight.checks.map(check => (
              <article key={check.key} className={check.passed ? 'pass' : 'fail'}>
                {check.passed ? <Check size={14} /> : <span>×</span>}
                <div><strong>{check.key.replaceAll('_', ' ')}</strong><p>{check.detail}</p></div>
              </article>
            ))}
          </div>
        )}

        {postQa && (
          <div className={'qa-checks ' + (postQa.passed ? 'pass' : 'fail')}>
            <div><strong>{postQa.passed ? 'POST-RENDER QA PASS' : 'POST-RENDER QA FAILED'}</strong><span>{postQa.passed ? (currentVisual?.locked ? 'Candidate ready for Director review · preview protected' : 'Episode preview updated automatically') : 'Episode preview protected'}</span></div>
            {postQa.checks.map(check => (
              <article key={check.key} className={check.passed ? 'pass' : 'fail'}>
                {check.passed ? <Check size={14} /> : <span>×</span>}
                <div><strong>{check.key.replaceAll('_', ' ')}</strong><p>{check.detail}</p></div>
              </article>
            ))}
          </div>
        )}
      </section>

      <p className="production-footnote">
        Individual shot MP4s are implementation detail. You review one cumulative episode preview after deterministic post-render QA accepts the new shot.
      </p>
    </main>
  );
}
