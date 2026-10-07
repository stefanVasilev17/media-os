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
  Sparkles
} from 'lucide-react';
import { loadCreativeStage, type CreativeStageState, type ScriptArtifact } from '../api/creativeApi';
import {
  alignVoiceShot,
  loadVoiceShots,
  markVoiceShotRemotionSynced,
  saveVoiceShot,
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
  }, [state.revision]);

  const currentShot = shots[currentIndex];
  const currentState = workflow[currentShot?.key];
  const recordedCount = shots.filter(shot => workflow[shot.key]?.recorded).length;
  const alignedCount = shots.filter(shot => workflow[shot.key]?.aligned).length;
  const syncReadyCount = shots.filter(shot => workflow[shot.key]?.visualSyncReady).length;
  const remotionCount = shots.filter(shot => workflow[shot.key]?.remotionSynced).length;

  useEffect(() => {
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
        <div className="voice-stage-metric"><span>RECORDED</span><strong>{recordedCount}/{shots.length}</strong></div>
        <div className="voice-stage-metric"><span>ALIGNED</span><strong>{alignedCount}/{shots.length}</strong></div>
        <div className="voice-stage-metric"><span>VISUAL SYNC READY</span><strong>{syncReadyCount}/{shots.length}</strong></div>
        <div className="voice-stage-metric"><span>REMOTION SYNCED</span><strong>{remotionCount}/{shots.length}</strong></div>
      </section>

      <nav className="script-shot-strip" aria-label="Episode recording shots">
        {shots.map((shot, index) => {
          const shotState = workflow[shot.key];
          const isCurrent = index === currentIndex;
          const classes = [
            shotState?.recorded ? 'recorded' : '',
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
              {shotState?.remotionSynced ? <Sparkles size={12} /> : shotState?.recorded ? <Check size={12} /> : null}
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
            <div className={currentState?.recorded ? 'done' : ''}><Mic2 size={14} /> Recorded</div>
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
            <div className="voice-primary-action">
              <button type="button" className="script-recorded-button" disabled={busy} onClick={() => void persistRecorded(true)}>
                <Check size={17} /> Recorded
              </button>
            </div>
          ) : (
            <>
              <section className="voice-alignment-panel">
                <div className="voice-panel-heading">
                  <div>
                    <span>STEP 2</span>
                    <strong>Alignment → Visual Sync Spec</strong>
                  </div>
                  <small>Paste semantic anchors now. ElevenLabs alignment will automate this later.</small>
                </div>
                <textarea value={alignmentText} onChange={event => setAlignmentText(event.target.value)} spellCheck={false} />
                <div className="voice-alignment-actions">
                  <button type="button" className="voice-secondary-button" disabled={busy} onClick={() => void persistRecorded(false)}>
                    <RotateCcw size={15} /> Re-record
                  </button>
                  <button type="button" className="voice-primary-button" disabled={busy} onClick={() => void createAlignment()}>
                    <Sparkles size={15} /> Generate Visual Sync Spec
                  </button>
                </div>
              </section>

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
                  <button
                    type="button"
                    className={'voice-remotion-button ' + (currentState.remotionSynced ? 'done' : '')}
                    disabled={busy}
                    onClick={() => void toggleRemotionSynced()}
                  >
                    <Sparkles size={16} />
                    {currentState.remotionSynced ? 'Remotion Synced ✓' : 'Mark Remotion Synced'}
                  </button>
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
