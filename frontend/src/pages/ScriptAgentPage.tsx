import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, LoaderCircle, LockKeyhole, Mic2, RotateCcw } from 'lucide-react';
import { loadCreativeStage, type CreativeStageState, type ScriptArtifact } from '../api/creativeApi';
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

function clock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.max(0, totalSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function progressStorageKey(state: CreativeStageState<ScriptArtifact>) {
  return `mediaos:recording-progress:${state.episode.id}:script-r${state.revision}`;
}

function buildRecordingShots(artifact: ScriptArtifact): RecordingShot[] {
  return EP001_SHOTS.map(shot => {
    const blocks = artifact.timeline.filter(
      item => item.endSecond > shot.startSecond && item.startSecond < shot.endSecond
    );

    const narration = blocks
      .map(item => item.narration.trim())
      .filter(Boolean)
      .join('\n\n');

    const voiceDirections = Array.from(
      new Set(blocks.map(item => item.voiceDirection.trim()).filter(Boolean))
    );

    return {
      ...shot,
      narration,
      voiceDirection: voiceDirections.join(' ')
    };
  });
}

function readProgress(key: string, validKeys: Set<string>) {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value): value is string => typeof value === 'string' && validKeys.has(value));
  } catch {
    return [];
  }
}

function LockedScriptRecordingMode({ state }: { state: CreativeStageState<ScriptArtifact> }) {
  const artifact = state.artifact;
  const shots = useMemo(() => buildRecordingShots(artifact!), [artifact]);
  const storageKey = useMemo(() => progressStorageKey(state), [state.episode.id, state.revision]);
  const validShotKeys = useMemo(() => new Set(shots.map(shot => shot.key)), [shots]);
  const [recordedKeys, setRecordedKeys] = useState<string[]>(() => readProgress(storageKey, validShotKeys));
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const saved = readProgress(storageKey, validShotKeys);
    setRecordedKeys(saved);
    const firstPending = shots.findIndex(shot => !saved.includes(shot.key));
    setCurrentIndex(firstPending === -1 ? Math.max(0, shots.length - 1) : firstPending);
  }, [storageKey, shots, validShotKeys]);

  const recordedSet = useMemo(() => new Set(recordedKeys), [recordedKeys]);
  const currentShot = shots[currentIndex];
  const recordedCount = recordedKeys.length;
  const allRecorded = recordedCount === shots.length;
  const currentRecorded = currentShot ? recordedSet.has(currentShot.key) : false;

  function persist(next: string[]) {
    setRecordedKeys(next);
    window.localStorage.setItem(storageKey, JSON.stringify(next));
  }

  function markRecorded() {
    if (!currentShot) return;
    const next = currentRecorded ? recordedKeys : [...recordedKeys, currentShot.key];
    persist(next);

    const nextPendingAfterCurrent = shots.findIndex(
      (shot, index) => index > currentIndex && !next.includes(shot.key)
    );
    if (nextPendingAfterCurrent !== -1) {
      setCurrentIndex(nextPendingAfterCurrent);
      return;
    }

    const firstPending = shots.findIndex(shot => !next.includes(shot.key));
    if (firstPending !== -1) setCurrentIndex(firstPending);
  }

  function markForRerecord() {
    if (!currentShot) return;
    persist(recordedKeys.filter(key => key !== currentShot.key));
  }

  if (!artifact || !currentShot) {
    return <main className="creative-agent-page"><div className="creative-error">Locked script is unavailable.</div></main>;
  }

  return (
    <main className="creative-agent-page script-recording-page">
      <header className="creative-agent-header script-recording-header">
        <div>
          <span>{state.episode.episodeNumber} · RECORDING MODE</span>
          <h1>Script Agent</h1>
          <p>{state.episode.title}</p>
        </div>
        <div className="script-recording-header-actions">
          <div className="script-locked-badge"><LockKeyhole size={14} /> LOCKED · REV {state.revision}</div>
          <button type="button" className="creative-director-link" onClick={() => { window.location.hash = '#/'; }}>Director</button>
        </div>
      </header>

      <section className="script-recording-progress">
        <div className="script-recording-progress-copy">
          <span>VOICE RECORDING PROGRESS</span>
          <strong>{recordedCount} / {shots.length} shots recorded</strong>
        </div>
        <div className="script-recording-progress-bar" aria-label={`${recordedCount} of ${shots.length} shots recorded`}>
          <div style={{ width: `${(recordedCount / shots.length) * 100}%` }} />
        </div>
      </section>

      <nav className="script-shot-strip" aria-label="Episode recording shots">
        {shots.map((shot, index) => {
          const isRecorded = recordedSet.has(shot.key);
          const isCurrent = index === currentIndex;
          return (
            <button
              type="button"
              key={shot.key}
              className={`${isRecorded ? 'recorded' : ''} ${isCurrent ? 'current' : ''}`}
              onClick={() => setCurrentIndex(index)}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              {isRecorded && <Check size={12} />}
            </button>
          );
        })}
      </nav>

      {allRecorded && (
        <section className="script-recording-complete">
          <Check size={18} />
          <div>
            <strong>All {shots.length} shots are marked Recorded.</strong>
            <span>You can still open any shot and mark it for re-recording.</span>
          </div>
        </section>
      )}

      <section className={`script-recording-card ${currentRecorded ? 'is-recorded' : ''}`}>
        <div className="script-recording-card-top">
          <div>
            <span>{currentShot.key}</span>
            <h2>{currentShot.title}</h2>
          </div>
          <div className="script-recording-time">
            {clock(currentShot.startSecond)}–{clock(currentShot.endSecond)}
          </div>
        </div>

        <div className="script-recording-status">
          <Mic2 size={16} />
          <span>{currentRecorded ? 'RECORDED' : 'RECORD THIS SHOT'}</span>
        </div>

        <div className="script-recording-narration">
          {currentShot.narration ? (
            currentShot.narration.split('\n\n').map((paragraph, index) => <p key={index}>{paragraph}</p>)
          ) : (
            <p className="script-recording-missing">No narration block was found inside this shot boundary.</p>
          )}
        </div>

        {currentShot.voiceDirection && (
          <div className="script-recording-voice">
            <span>VOICE DIRECTION</span>
            <p>{currentShot.voiceDirection}</p>
          </div>
        )}

        <div className="script-recording-actions">
          <button
            type="button"
            className="script-recording-nav"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex(index => Math.max(0, index - 1))}
          >
            <ChevronLeft size={16} /> Previous
          </button>

          {currentRecorded ? (
            <button type="button" className="script-rerecord-button" onClick={markForRerecord}>
              <RotateCcw size={16} /> Mark for re-recording
            </button>
          ) : (
            <button type="button" className="script-recorded-button" onClick={markRecorded}>
              <Check size={17} /> Recorded
            </button>
          )}

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

      <p className="script-recording-note">
        Recording progress is saved for this locked Script revision. A new Script revision starts a fresh recording checklist automatically.
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
      .then(next => {
        if (active) setState(next);
      })
      .catch(() => {
        if (active) setState(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <main className="creative-agent-page"><div className="creative-loading"><LoaderCircle className="spin" size={22} /></div></main>;
  }

  if (state?.locked && state.artifact) {
    return <LockedScriptRecordingMode state={state} />;
  }

  return <CreativeAgentPage stageKey="SCRIPT" />;
}
