import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  FileCode2,
  LoaderCircle,
  LockKeyhole,
  Mic2,
  RotateCcw,
  Sparkles,
  UploadCloud
} from 'lucide-react';
import { loadCreativeStage, type CreativeStageState, type ScriptArtifact } from '../api/creativeApi';
import {
  alignVoiceShot,
  approveGeneratedVoiceShot,
  autoAlignVoiceShot,
  generateVoiceShot,
  generatedVoiceAudioUrl,
  loadAlignmentProvider,
  loadRemotionRender,
  loadTtsProvider,
  loadVoiceShots,
  markVoiceShotRemotionSynced,
  remotionRenderVideoUrl,
  saveVoiceShot,
  startRemotionRender,
  type AlignmentProviderStatus,
  type RemotionRenderState,
  type TtsProviderStatus,
  type VoiceShotState
} from '../api/voiceApi';
import { CreativeAgentPage } from './CreativeAgentPage';
import '../styles/creativeAgent.css';

type ShotDefinition = {
  key: string;
  title: string;
  startSecond: number;
  endSecond: number;
};

type RecordingShot = ShotDefinition & {
  narration: string;
  voiceDirection: string;
};

const EP001_SHOTS: ShotDefinition[] = [
  { key: 'SHOT 01', title: 'The Human Action / Login Intent', startSecond: 0, endSecond: 31 },
  { key: 'SHOT 02', title: 'Request Assembly', startSecond: 31, endSecond: 105 },
  { key: 'SHOT 03', title: 'Ready Does Not Mean Sent', startSecond: 105, endSecond: 158 },
  { key: 'SHOT 04', title: 'DNS Resolution / Network Transit', startSecond: 158, endSecond: 225 },
  { key: 'SHOT 05', title: 'API Gateway / Routing', startSecond: 225, endSecond: 305 },
  { key: 'SHOT 06', title: 'Load Balancer / Traffic Distribution', startSecond: 305, endSecond: 385 },
  { key: 'SHOT 07', title: 'Auth Service / Validation Steps', startSecond: 385, endSecond: 470 },
  { key: 'SHOT 08', title: 'User Database / User Data', startSecond: 470, endSecond: 560 },
  { key: 'SHOT 09', title: 'Healthy Auth Service, Broken Login', startSecond: 560, endSecond: 655 },
  { key: 'SHOT 10', title: 'When Trust Breaks Along the Way', startSecond: 655, endSecond: 770 },
  { key: 'SHOT 11', title: 'Correct Password, But Not Logged In Yet', startSecond: 770, endSecond: 850 },
  { key: 'SHOT 12', title: 'Authentication State / Session Creation', startSecond: 850, endSecond: 945 },
  { key: 'SHOT 13', title: 'Route Decision / Logged-In UI', startSecond: 945, endSecond: 1020 },
  { key: 'SHOT 14', title: 'Session Restore Flow', startSecond: 1020, endSecond: 1100 },
  { key: 'SHOT 15', title: 'What Really Happened When You Clicked Login', startSecond: 1100, endSecond: 1155 },
  { key: 'SHOT 16', title: 'The Next Request', startSecond: 1155, endSecond: 1200 }
];

function alignmentTemplate(shotKey: string) {
  return [
    '{',
    '  "audioFileName": "EP001_' + shotKey.replace(' ', '') + '_final.wav",',
    '  "durationSeconds": 31.0,',
    '  "anchors": {',
    '    "SEMANTIC_ANCHOR": 4.82',
    '  }',
    '}'
  ].join('\n');
}

function clock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.max(0, totalSeconds % 60);
  return minutes + ':' + String(seconds).padStart(2, '0');
}

function buildRecordingShots(artifact: ScriptArtifact): RecordingShot[] {
  return EP001_SHOTS.map(shot => {
    const blocks = artifact.timeline.filter(
      item => item.endSecond > shot.startSecond && item.startSecond < shot.endSecond
    );

    return {
      ...shot,
      narration: blocks.map(item => item.narration.trim()).filter(Boolean).join('\n\n'),
      voiceDirection: Array.from(new Set(blocks.map(item => item.voiceDirection.trim()).filter(Boolean))).join(' ')
    };
  });
}

function downloadText(fileName: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function LockedScriptRecordingMode({ state }: { state: CreativeStageState<ScriptArtifact> }) {
  const artifact = state.artifact!;
  const shots = useMemo(() => buildRecordingShots(artifact), [artifact]);
  const [workflow, setWorkflow] = useState<Record<string, VoiceShotState>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadingWorkflow, setLoadingWorkflow] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [alignmentText, setAlignmentText] = useState(alignmentTemplate('SHOT 01'));
  const [provider, setProvider] = useState<AlignmentProviderStatus | null>(null);
  const [ttsProvider, setTtsProvider] = useState<TtsProviderStatus | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [shotRender, setShotRender] = useState<RemotionRenderState | null>(null);
  const [episodePreview, setEpisodePreview] = useState<RemotionRenderState | null>(null);

  async function refreshWorkflow() {
    setLoadingWorkflow(true);
    setError('');
    try {
      const rows = await loadVoiceShots(state.revision);
      const next = Object.fromEntries(rows.map(row => [row.shotKey, row]));
      setWorkflow(next);
      const firstPending = shots.findIndex(shot => !next[shot.key]?.recorded);
      setCurrentIndex(firstPending === -1 ? Math.max(0, shots.length - 1) : firstPending);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load voice workflow.');
    } finally {
      setLoadingWorkflow(false);
    }
  }

  useEffect(() => {
    void refreshWorkflow();
    loadAlignmentProvider()
      .then(setProvider)
      .catch(() => setProvider(null));
    loadTtsProvider()
      .then(setTtsProvider)
      .catch(() => setTtsProvider(null));
  }, [state.revision]);

  const currentShot = shots[currentIndex];
  const currentState = workflow[currentShot?.key];
  const generatedCount = shots.filter(shot => workflow[shot.key]?.voiceGenerated).length;
  const approvedCount = shots.filter(shot => workflow[shot.key]?.voiceApproved || workflow[shot.key]?.recorded).length;
  const alignedCount = shots.filter(shot => workflow[shot.key]?.aligned).length;
  const syncReadyCount = shots.filter(shot => workflow[shot.key]?.visualSyncReady).length;
  const remotionCount = shots.filter(shot => workflow[shot.key]?.remotionSynced).length;

  useEffect(() => {
    setAudioFile(null);
    setShotRender(null);
    if (!currentShot) return;
    const existing = workflow[currentShot.key];
    const alignment = existing?.alignment as { durationSeconds?: number; anchors?: Record<string, number> } | undefined;
    if (existing?.audioFileName && alignment?.durationSeconds && alignment?.anchors) {
      setAlignmentText(JSON.stringify({
        audioFileName: existing.audioFileName,
        durationSeconds: alignment.durationSeconds,
        anchors: alignment.anchors
      }, null, 2));
    } else {
      setAlignmentText(alignmentTemplate(currentShot.key));
    }
  }, [currentIndex, currentShot?.key, workflow]);

  useEffect(() => {
    const renderId = currentState?.remotionRenderId;
    if (!renderId) {
      setShotRender(null);
      return;
    }
    let active = true;
    let timer = 0;

    const poll = async () => {
      try {
        const result = await loadRemotionRender(renderId);
        if (!active) return;
        setShotRender(result);
        if (result.status === 'QUEUED' || result.status === 'RENDERING') {
          timer = window.setTimeout(() => void poll(), 2000);
        }
      } catch {
        if (active) setShotRender(null);
      }
    };

    void poll();
    return () => {
      active = false;
      if (timer) window.clearTimeout(timer);
    };
  }, [currentState?.remotionRenderId]);

  const compositionForShot = (shotKey: string) => {
    if (shotKey === 'SHOT 01') return 'EP001-Shot01-VoiceSynced';
    if (shotKey === 'SHOT 02') return 'EP001-Shot02-VoiceSynced';
    return '';
  };

  async function ensureShotRow(recorded = false) {
    if (!currentShot) throw new Error('No current shot.');
    return saveVoiceShot(currentShot.key, {
      scriptRevision: state.revision,
      title: currentShot.title,
      startSecond: currentShot.startSecond,
      endSecond: currentShot.endSecond,
      narration: currentShot.narration,
      voiceDirection: currentShot.voiceDirection,
      recorded
    });
  }

  async function generateCloneVoice() {
    if (!currentShot || busy) return;
    setBusy(true);
    setError('');

    try {
      await ensureShotRow(false);
      const previousText = currentIndex > 0 ? shots[currentIndex - 1].narration : undefined;
      const nextText = currentIndex < shots.length - 1 ? shots[currentIndex + 1].narration : undefined;
      const row = await generateVoiceShot(currentShot.key, {
        scriptRevision: state.revision,
        previousText,
        nextText
      });
      setWorkflow(current => ({ ...current, [currentShot.key]: row }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not generate ElevenLabs voice.');
    } finally {
      setBusy(false);
    }
  }

  async function approveCloneVoice() {
    if (!currentShot || busy) return;
    setBusy(true);
    setError('');

    try {
      const row = await approveGeneratedVoiceShot(currentShot.key, state.revision);
      setWorkflow(current => ({ ...current, [currentShot.key]: row }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not approve generated voice.');
    } finally {
      setBusy(false);
    }
  }

  async function persistRecorded(recorded: boolean) {
    if (!currentShot || busy) return;
    setBusy(true);
    setError('');

    try {
      const row = await saveVoiceShot(currentShot.key, {
        scriptRevision: state.revision,
        title: currentShot.title,
        startSecond: currentShot.startSecond,
        endSecond: currentShot.endSecond,
        narration: currentShot.narration,
        voiceDirection: currentShot.voiceDirection,
        recorded
      });

      const nextWorkflow = { ...workflow, [currentShot.key]: row };
      setWorkflow(nextWorkflow);

      if (recorded) {
        const nextIndex = shots.findIndex((shot, index) => index > currentIndex && !nextWorkflow[shot.key]?.recorded);
        if (nextIndex !== -1) setCurrentIndex(nextIndex);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update recording state.');
    } finally {
      setBusy(false);
    }
  }

  async function runAutoAlignment() {
    if (!currentShot || !audioFile || busy) return;
    setBusy(true);
    setError('');

    try {
      const row = await autoAlignVoiceShot(currentShot.key, state.revision, audioFile);
      setWorkflow(current => ({ ...current, [currentShot.key]: row }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Automatic ElevenLabs alignment failed.');
    } finally {
      setBusy(false);
    }
  }

  async function createAlignment() {
    if (!currentShot || busy) return;
    setBusy(true);
    setError('');

    try {
      const parsed = JSON.parse(alignmentText) as {
        audioFileName?: string;
        durationSeconds?: number;
        anchors?: Record<string, number>;
      };

      if (!parsed.audioFileName || !parsed.durationSeconds || !parsed.anchors) {
        throw new Error('Alignment JSON needs audioFileName, durationSeconds, and anchors.');
      }

      const row = await alignVoiceShot(currentShot.key, {
        scriptRevision: state.revision,
        audioFileName: parsed.audioFileName,
        durationSeconds: parsed.durationSeconds,
        anchors: parsed.anchors
      });

      setWorkflow(current => ({ ...current, [currentShot.key]: row }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create Visual Sync Spec.');
    } finally {
      setBusy(false);
    }
  }

  async function renderSyncedShot() {
    if (!currentShot || !currentState?.voiceApproved || !currentState?.voiceGenerated || busy) return;
    const compositionId = compositionForShot(currentShot.key);
    if (!compositionId) {
      setError('This shot does not have a LOCKED Remotion composition yet.');
      return;
    }

    const alignment = currentState.alignment as {
      durationSeconds?: number;
      anchors?: Record<string, number>;
    };
    const durationSeconds = Number(alignment?.durationSeconds || 0);
    if (!durationSeconds || !alignment?.anchors) {
      setError('Approved voice alignment is missing duration or semantic anchors.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      const audioUrl = window.location.origin + generatedVoiceAudioUrl(
        currentShot.key,
        state.revision,
        currentState.generationRevision
      );
      const result = await startRemotionRender(compositionId, {
        shotKey: currentShot.key,
        scriptRevision: state.revision,
        generationRevision: currentState.generationRevision,
        audioUrl,
        durationInFrames: Math.max(1, Math.ceil(durationSeconds * 30)),
        anchors: alignment.anchors
      }, 'REVIEW');
      setShotRender(result);

      const poll = async (renderId: string) => {
        for (let attempt = 0; attempt < 180; attempt++) {
          await new Promise(resolve => window.setTimeout(resolve, 2000));
          const next = await loadRemotionRender(renderId);
          setShotRender(next);
          if (next.status === 'READY' || next.status === 'FAILED') {
            await refreshWorkflow();
            return;
          }
        }
      };
      void poll(result.renderId);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not start synced Remotion render.');
    } finally {
      setBusy(false);
    }
  }

  async function buildEpisodePreview() {
    if (busy) return;
    const readyShots = shots
      .map(shot => ({ shot, state: workflow[shot.key] }))
      .filter(item => item.state?.rendered && item.state?.remotionRenderId)
      .sort((a, b) => a.shot.startSecond - b.shot.startSecond);

    const contiguous: typeof readyShots = [];
    for (const item of readyShots) {
      if (item.shot.key !== 'SHOT ' + String(contiguous.length + 1).padStart(2, '0')) break;
      contiguous.push(item);
    }

    if (contiguous.length === 0) {
      setError('Render Shot 01 before building the current episode preview.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      const segments = contiguous.map(item => {
        const alignment = item.state.alignment as { durationSeconds?: number };
        const durationInFrames = Math.max(1, Math.ceil(Number(alignment?.durationSeconds || 0) * 30));
        return {
          shotKey: item.shot.key,
          durationInFrames,
          videoUrl: window.location.origin + remotionRenderVideoUrl(item.state.remotionRenderId!)
        };
      });
      const durationInFrames = segments.reduce((total, segment) => total + segment.durationInFrames, 0);
      const result = await startRemotionRender('EP001-Voice-CurrentPreview', {
        durationInFrames,
        segments
      }, 'REVIEW');
      setEpisodePreview(result);

      const poll = async (renderId: string) => {
        for (let attempt = 0; attempt < 240; attempt++) {
          await new Promise(resolve => window.setTimeout(resolve, 2000));
          const next = await loadRemotionRender(renderId);
          setEpisodePreview(next);
          if (next.status === 'READY' || next.status === 'FAILED') return;
        }
      };
      void poll(result.renderId);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not build current episode preview.');
    } finally {
      setBusy(false);
    }
  }

  async function toggleRemotionSynced() {
    if (!currentShot || busy) return;
    setBusy(true);
    setError('');

    try {
      const row = await markVoiceShotRemotionSynced(
        currentShot.key,
        state.revision,
        !currentState?.remotionSynced
      );
      setWorkflow(current => ({ ...current, [currentShot.key]: row }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update Remotion sync state.');
    } finally {
      setBusy(false);
    }
  }

  if (!currentShot) {
    return <main className="creative-agent-page"><div className="creative-error">Locked script is unavailable.</div></main>;
  }

  const fileStem = 'EP001_' + currentShot.key.replace(' ', '_') + '_VisualSyncSpec';
  const specJson = currentState?.visualSyncReady ? JSON.stringify(currentState.visualSyncSpec, null, 2) : '';

  return (
    <main className="creative-agent-page script-recording-page">
      <header className="creative-agent-header script-recording-header">
        <div>
          <span>{state.episode.episodeNumber} · VOICE PRODUCTION</span>
          <h1>Script Agent</h1>
          <p>{state.episode.title}</p>
        </div>
        <div className="script-recording-header-actions">
          <div className="script-locked-badge"><LockKeyhole size={14} /> LOCKED · REV {state.revision}</div>
          <button type="button" className="creative-director-link" onClick={() => { window.location.hash = '#/'; }}>Director</button>
        </div>
      </header>

      {error && <div className="creative-error">{error}</div>}

      <section className="script-recording-progress voice-production-progress">
        <div className="voice-stage-metric"><span>GENERATED</span><strong>{generatedCount}/{shots.length}</strong></div>
        <div className="voice-stage-metric"><span>APPROVED</span><strong>{approvedCount}/{shots.length}</strong></div>
        <div className="voice-stage-metric"><span>ALIGNED</span><strong>{alignedCount}/{shots.length}</strong></div>
        <div className="voice-stage-metric"><span>VISUAL SYNC READY</span><strong>{syncReadyCount}/{shots.length}</strong></div>
        <div className="voice-stage-metric"><span>REMOTION SYNCED</span><strong>{remotionCount}/{shots.length}</strong></div>
      </section>

      <section className="voice-episode-preview-bar">
        <div>
          <span>CURRENT EPISODE PREVIEW</span>
          <strong>Assemble every contiguous rendered shot from Shot 01 onward.</strong>
        </div>
        <button type="button" disabled={busy || !workflow['SHOT 01']?.rendered} onClick={() => void buildEpisodePreview()}>
          <Sparkles size={15} /> Update Episode Preview
        </button>
      </section>

      {episodePreview?.status === 'READY' && (
        <section className="voice-episode-preview-player">
          <video controls preload="metadata" src={remotionRenderVideoUrl(episodePreview.renderId)} />
          <div>
            <span>READY</span>
            <strong>{Math.round(episodePreview.durationMs / 1000)}s · {episodePreview.width}×{episodePreview.height}</strong>
          </div>
        </section>
      )}

      <nav className="script-shot-strip" aria-label="Episode recording shots">
        {shots.map((shot, index) => {
          const shotState = workflow[shot.key];
          const isCurrent = index === currentIndex;
          const classes = [
            shotState?.voiceGenerated ? 'generated' : '',
            (shotState?.voiceApproved || shotState?.recorded) ? 'recorded' : '',
            shotState?.visualSyncReady ? 'sync-ready' : '',
            shotState?.remotionSynced ? 'remotion-synced' : '',
            isCurrent ? 'current' : ''
          ].filter(Boolean).join(' ');

          return (
            <button
              type="button"
              key={shot.key}
              className={classes}
              onClick={() => setCurrentIndex(index)}
              aria-current={isCurrent ? 'step' : undefined}
              title={shot.key + ' · ' + shot.title}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              {shotState?.remotionSynced ? <Sparkles size={12} /> : (shotState?.voiceApproved || shotState?.recorded) ? <Check size={12} /> : null}
            </button>
          );
        })}
      </nav>

      {loadingWorkflow ? (
        <div className="creative-loading"><LoaderCircle className="spin" size={22} /></div>
      ) : (
        <section className={'script-recording-card ' + (currentState?.recorded ? 'is-recorded' : '')}>
          <div className="script-recording-card-top">
            <div>
              <span>{currentShot.key}</span>
              <h2>{currentShot.title}</h2>
            </div>
            <div className="script-recording-time">{clock(currentShot.startSecond)}–{clock(currentShot.endSecond)}</div>
          </div>

          <div className="voice-status-row">
            <div className={currentState?.voiceGenerated ? 'done' : ''}><Mic2 size={14} /> Generated</div>
            <div className={(currentState?.voiceApproved || currentState?.recorded) ? 'done' : ''}><Check size={14} /> Approved</div>
            <div className={currentState?.aligned ? 'done' : ''}><Check size={14} /> Aligned</div>
            <div className={currentState?.visualSyncReady ? 'done' : ''}><FileCode2 size={14} /> Visual Sync</div>
            <div className={currentState?.remotionSynced ? 'done' : ''}><Sparkles size={14} /> Remotion</div>
          </div>

          <div className="script-recording-narration">
            {currentShot.narration.split('\n\n').map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          </div>

          {currentShot.voiceDirection && (
            <div className="script-recording-voice">
              <span>VOICE DIRECTION</span>
              <p>{currentShot.voiceDirection}</p>
            </div>
          )}

          {!currentState?.recorded ? (
            <section className="voice-generation-panel">
              <div className="voice-panel-heading">
                <div>
                  <span>STEP 1</span>
                  <strong>Generate narration with your ElevenLabs clone</strong>
                </div>
                <small>
                  {ttsProvider?.configured
                    ? ttsProvider.modelId + ' · ' + ttsProvider.outputFormat
                    : 'Waiting for ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID.'}
                </small>
              </div>

              {!currentState?.voiceGenerated ? (
                <button
                  type="button"
                  className="voice-generate-button"
                  disabled={busy || !ttsProvider?.configured}
                  onClick={() => void generateCloneVoice()}
                >
                  {busy ? <LoaderCircle className="spin" size={16} /> : <Mic2 size={16} />}
                  Generate Voice
                </button>
              ) : (
                <div className="voice-generated-review">
                  <audio
                    key={currentState.generationRevision}
                    controls
                    preload="metadata"
                    src={generatedVoiceAudioUrl(currentShot.key, state.revision, currentState.generationRevision)}
                  />
                  <div className="voice-generated-meta">
                    <span>{currentState.generatedAudioFileName}</span>
                    <span>Generation {currentState.generationRevision} · {currentState.generatedModelId}</span>
                  </div>
                  <div className="voice-generation-actions">
                    <button type="button" className="voice-secondary-button" disabled={busy} onClick={() => void generateCloneVoice()}>
                      <RotateCcw size={15} /> Regenerate
                    </button>
                    <button type="button" className="voice-primary-button" disabled={busy} onClick={() => void approveCloneVoice()}>
                      <Check size={15} /> Approve Voice
                    </button>
                  </div>
                </div>
              )}

              <details className="voice-manual-fallback">
                <summary>Manual recording fallback</summary>
                <p>If you record this shot yourself instead of using clone TTS, mark it ready and upload that audio in the next step.</p>
                <button type="button" className="voice-secondary-button" disabled={busy} onClick={() => void persistRecorded(true)}>
                  <Mic2 size={15} /> Manual audio recorded
                </button>
              </details>
            </section>
          ) : (
            <>
              {!currentState?.visualSyncReady && (
              <section className="voice-alignment-panel">
                <div className="voice-panel-heading">
                  <div>
                    <span>STEP 2</span>
                    <strong>Audio → ElevenLabs Alignment → Visual Sync Spec</strong>
                  </div>
                  <small>
                    {provider?.configured
                      ? 'ElevenLabs Forced Alignment is connected. Upload the final audio for this shot.'
                      : 'ElevenLabs is not configured yet. Add ELEVENLABS_API_KEY to MediaOS to enable automatic alignment.'}
                  </small>
                </div>

                <label className={'voice-audio-drop ' + (audioFile ? 'has-file' : '')}>
                  <input
                    type="file"
                    accept="audio/*,.wav,.mp3,.m4a,.aac,.flac,.ogg"
                    onChange={event => setAudioFile(event.target.files?.[0] || null)}
                  />
                  <UploadCloud size={22} />
                  <div>
                    <strong>{audioFile ? audioFile.name : 'Choose final shot audio'}</strong>
                    <span>{audioFile ? Math.max(1, Math.round(audioFile.size / 1024)) + ' KB selected' : 'WAV, MP3, M4A, FLAC and other major audio formats'}</span>
                  </div>
                </label>

                <div className="voice-alignment-actions">
                  <button type="button" className="voice-secondary-button" disabled={busy} onClick={() => void persistRecorded(false)}>
                    <RotateCcw size={15} /> Re-record
                  </button>
                  <button
                    type="button"
                    className="voice-primary-button"
                    disabled={busy || !audioFile || !provider?.configured}
                    onClick={() => void runAutoAlignment()}
                  >
                    {busy ? <LoaderCircle className="spin" size={15} /> : <Sparkles size={15} />}
                    Upload Audio & Align
                  </button>
                </div>

                <details className="voice-manual-fallback">
                  <summary>Manual alignment fallback</summary>
                  <p>Use this only if the ElevenLabs provider is unavailable or an anchor needs manual correction.</p>
                  <textarea value={alignmentText} onChange={event => setAlignmentText(event.target.value)} spellCheck={false} />
                  <button type="button" className="voice-secondary-button" disabled={busy} onClick={() => void createAlignment()}>
                    Generate from manual anchors
                  </button>
                </details>
              </section>
              )}

              {currentState?.visualSyncReady && (
                <section className="voice-sync-output">
                  <div className="voice-panel-heading">
                    <div>
                      <span>STEP 3</span>
                      <strong>Visual Sync Spec Ready</strong>
                    </div>
                    <small>{currentState.audioFileName}</small>
                  </div>
                  <div className="voice-file-actions">
                    <button type="button" onClick={() => downloadText(fileStem + '.json', specJson, 'application/json')}>
                      <Download size={15} /> JSON
                    </button>
                    <button type="button" onClick={() => downloadText(fileStem + '.md', currentState.visualSyncMarkdown || '', 'text/markdown')}>
                      <Download size={15} /> Markdown
                    </button>
                    <button type="button" onClick={() => void navigator.clipboard.writeText(currentState.visualSyncMarkdown || '')}>
                      <Copy size={15} /> Copy MD
                    </button>
                  </div>
                  <pre>{currentState.visualSyncMarkdown}</pre>
                  {compositionForShot(currentShot.key) && currentState.voiceGenerated && currentState.voiceApproved ? (
                    <div className="voice-render-panel">
                      <button
                        type="button"
                        className={'voice-remotion-button ' + (currentState.rendered ? 'done' : '')}
                        disabled={busy || shotRender?.status === 'QUEUED' || shotRender?.status === 'RENDERING'}
                        onClick={() => void renderSyncedShot()}
                      >
                        <Sparkles size={16} />
                        {shotRender?.status === 'QUEUED' || shotRender?.status === 'RENDERING'
                          ? 'Rendering ' + Math.max(0, shotRender.progress || 0) + '%'
                          : currentState.rendered
                            ? 'Re-render Synced Shot'
                            : 'Render Synced Shot'}
                      </button>

                      {(shotRender?.status === 'READY' || currentState.rendered) && currentState.remotionRenderId && (
                        <div className="voice-shot-render-result">
                          <video controls preload="metadata" src={remotionRenderVideoUrl(currentState.remotionRenderId)} />
                          <div>
                            <span>VIDEO + APPROVED VOICE</span>
                            <strong>{currentShot.key} · Generation {currentState.renderedGenerationRevision}</strong>
                          </div>
                        </div>
                      )}

                      {shotRender?.status === 'FAILED' && (
                        <div className="creative-error">{shotRender.error || 'Remotion render failed.'}</div>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      className={'voice-remotion-button ' + (currentState.remotionSynced ? 'done' : '')}
                      disabled={busy}
                      onClick={() => void toggleRemotionSynced()}
                    >
                      <Sparkles size={16} />
                      {compositionForShot(currentShot.key)
                        ? (currentState.remotionSynced ? 'Remotion Synced ✓' : 'Mark Remotion Synced')
                        : 'Remotion composition pending'}
                    </button>
                  )}
                </section>
              )}
            </>
          )}

          <div className="script-recording-actions compact-nav">
            <button
              type="button"
              className="script-recording-nav"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex(index => Math.max(0, index - 1))}
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <div />
            <button
              type="button"
              className="script-recording-nav"
              disabled={currentIndex === shots.length - 1}
              onClick={() => setCurrentIndex(index => Math.min(shots.length - 1, index + 1))}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </section>
      )}

      <p className="script-recording-note">
        Voice state is persisted in MediaOS backend per locked Script revision. Re-recording clears downstream alignment and sync state for that shot.
      </p>
    </main>
  );
}

export function ScriptAgentPage() {
  const [state, setState] = useState<CreativeStageState<ScriptArtifact> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    loadCreativeStage<ScriptArtifact>('SCRIPT')
      .then(next => { if (active) setState(next); })
      .catch(() => { if (active) setState(null); })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, []);

  if (loading) {
    return <main className="creative-agent-page"><div className="creative-loading"><LoaderCircle className="spin" size={22} /></div></main>;
  }

  if (state?.locked && state.artifact) return <LockedScriptRecordingMode state={state} />;
  return <CreativeAgentPage stageKey="SCRIPT" />;
}
