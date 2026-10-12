import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, LoaderCircle, Mic2, Play, RotateCcw, SlidersHorizontal, Square } from 'lucide-react';
import { loadCreativeStage, type CreativeStageState, type ScriptArtifact } from '../api/creativeApi';
import { loadProductionContract, type ProductionContractState } from '../api/productionContractApi';
import { loadTtsProvider, loadVoiceShots, type TtsProviderStatus, type VoiceShotState } from '../api/voiceApi';
import {
  approveVoiceClip,
  generateVoiceClip,
  loadVoiceClips,
  syncVoiceClips,
  voiceClipAudioUrl,
  type VoiceClipState,
  type VoiceSettings
} from '../api/voiceClipApi';
import { loadProductionMemory, type ProductionMemoryRule } from '../api/productionMemoryApi';
import { buildVoiceShotBundles, buildVoiceShotBundlesFromContract, clock } from '../lib/ep001Production';
import '../styles/productionFlow.css';

function defaultSettings(provider: TtsProviderStatus | null): VoiceSettings {
  return {
    stability: provider?.voiceSettings.stability ?? 0.35,
    similarityBoost: provider?.voiceSettings.similarityBoost ?? 0.8
  };
}

function settingsForClip(clip: VoiceClipState | undefined, provider: TtsProviderStatus | null): VoiceSettings {
  const base = defaultSettings(provider);
  const raw = clip?.generatedAlignment?.voiceSettings;
  if (!raw || typeof raw !== 'object') return base;
  const stored = raw as Record<string, unknown>;
  return {
    stability: typeof stored.stability === 'number' ? stored.stability : base.stability,
    similarityBoost: typeof stored.similarityBoost === 'number' ? stored.similarityBoost : base.similarityBoost
  };
}

const AT_V4_SETTINGS: VoiceSettings = {
  stability: 0.50,
  similarityBoost: 0.80
};

const AT_V4_DIRECTION = 'calm, conversational, confident';

function safeV4Direction(value: unknown) {
  return typeof value === 'string' && value.trim() === AT_V4_DIRECTION ? AT_V4_DIRECTION : '';
}

function performanceDirectionForClip(clip: VoiceClipState | undefined) {
  const stored = safeV4Direction(clip?.generatedAlignment?.performanceDirection);
  if (stored) return stored;
  return AT_V4_DIRECTION;
}

function exactElevenLabsText(narration: string, performanceDirection: string, modelId?: string) {
  const supportsAudioTags = Boolean(modelId?.startsWith('eleven_v4') || modelId?.startsWith('eleven_v3'));
  if (!supportsAudioTags || !performanceDirection.trim()) return narration;
  let direction = performanceDirection.trim().replaceAll('[', '').replaceAll(']', '').replace(/\s+/g, ' ');
  if (direction.length > 280) direction = direction.slice(0, 280).trim();
  return '[' + direction + '] ' + narration;
}

export function VoiceAgentPage() {
  const [script, setScript] = useState<CreativeStageState<ScriptArtifact> | null>(null);
  const [clips, setClips] = useState<VoiceClipState[]>([]);
  const [shotState, setShotState] = useState<Record<string, VoiceShotState>>({});
  const [provider, setProvider] = useState<TtsProviderStatus | null>(null);
  const [contract, setContract] = useState<ProductionContractState | null>(null);
  const [memory, setMemory] = useState<ProductionMemoryRule[]>([]);
  const [shotIndex, setShotIndex] = useState(0);
  const [clipIndex, setClipIndex] = useState(0);
  const [settingsByClip, setSettingsByClip] = useState<Record<string, VoiceSettings>>({});
  const [performanceByClip, setPerformanceByClip] = useState<Record<string, string>>({});
  const [correction, setCorrection] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [continuityPlaying, setContinuityPlaying] = useState(false);
  const [continuityNow, setContinuityNow] = useState('');
  const continuityAudioRef = useRef<HTMLAudioElement | null>(null);

  const bundles = useMemo(() => {
    if (contract?.ready && contract.payload) return buildVoiceShotBundlesFromContract(contract.payload);
    return script?.artifact ? buildVoiceShotBundles(script.artifact) : [];
  }, [script, contract]);
  const lockedShotIndexes = useMemo(
    () => bundles
      .map((shot, index) => {
        const related = clips.filter(clip => clip.shotKey === shot.key);
        return related.length > 0 && related.every(clip => clip.approved) ? index : -1;
      })
      .filter(index => index >= 0),
    [bundles, clips]
  );
  const activeShotIndexes = useMemo(
    () => bundles.map((_, index) => index).filter(index => !lockedShotIndexes.includes(index)),
    [bundles, lockedShotIndexes]
  );
  const currentShot = shotIndex >= 0 ? bundles[shotIndex] : undefined;
  const isCurrentShotLocked = shotIndex >= 0 && lockedShotIndexes.includes(shotIndex);
  const shotClips = useMemo(
    () => clips.filter(clip => clip.shotKey === currentShot?.key).sort((a, b) => a.sequence - b.sequence),
    [clips, currentShot?.key]
  );
  const currentClip = shotClips[Math.min(clipIndex, Math.max(0, shotClips.length - 1))];
  const previousReferenceClips = useMemo(() => {
    if (!currentShot) return [];
    const previousGenerated = clips
      .filter(clip => clip.generated && clip.startSecond < currentShot.startSecond)
      .sort((a, b) => a.startSecond - b.startSecond || a.sequence - b.sequence);
    const lastPrevious = previousGenerated.at(-1);
    if (!lastPrevious) return [];
    return previousGenerated.filter(clip => clip.shotKey === lastPrevious.shotKey);
  }, [clips, currentShot]);
  const previousReferenceShotKey = previousReferenceClips.at(-1)?.shotKey;
  const previousReferenceLocked = previousReferenceClips.length > 0 && previousReferenceClips.every(clip => clip.approved);
  const continuityClips = useMemo(() => {
    if (!currentClip || previousReferenceClips.length === 0) return [];
    const currentPosition = shotClips.findIndex(clip => clip.clipKey === currentClip.clipKey);
    const current = shotClips
      .slice(0, Math.max(0, currentPosition) + 1)
      .filter(clip => clip.generated);
    return [...previousReferenceClips, ...current];
  }, [currentClip, previousReferenceClips, shotClips]);
  const continuityDuration = continuityClips.reduce((total, clip) => total + Math.max(0, clip.durationSeconds || 0), 0);
  const flatClips = useMemo(() => [...clips].sort((a, b) => a.startSecond - b.startSecond || a.sequence - b.sequence), [clips]);
  const settings = currentClip
    ? settingsByClip[currentClip.clipKey] ?? settingsForClip(currentClip, provider)
    : defaultSettings(provider);
  const performanceDirection = currentClip
    ? performanceByClip[currentClip.clipKey] ?? performanceDirectionForClip(currentClip)
    : AT_V4_DIRECTION;
  const exactTtsText = currentClip
    ? exactElevenLabsText(currentClip.narration, performanceDirection, provider?.modelId)
    : '';

  async function refreshVoice(revision: number) {
    const [nextClips, nextShots] = await Promise.all([loadVoiceClips(revision), loadVoiceShots(revision)]);
    setClips(nextClips);
    setShotState(Object.fromEntries(nextShots.map(row => [row.shotKey, row])));
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [scriptState, tts, rules, productionContract] = await Promise.all([
          loadCreativeStage<ScriptArtifact>('SCRIPT'),
          loadTtsProvider(),
          loadProductionMemory('VOICE'),
          loadProductionContract()
        ]);
        if (!active) return;
        if (!scriptState.locked || !scriptState.artifact) throw new Error('Script must be LOCKED before Voice Agent.');
        setScript(scriptState);
        setProvider(tts);
        setMemory(rules);
        setContract(productionContract);
        const bundles = productionContract.ready && productionContract.payload
          ? buildVoiceShotBundlesFromContract(productionContract.payload)
          : buildVoiceShotBundles(scriptState.artifact);
        const synced = await syncVoiceClips(scriptState.revision, bundles);
        if (!active) return;
        setClips(synced);
        const shots = await loadVoiceShots(scriptState.revision);
        if (!active) return;
        setShotState(Object.fromEntries(shots.map(row => [row.shotKey, row])));
        const firstPendingShot = bundles.findIndex(bundle => {
          const related = synced.filter(clip => clip.shotKey === bundle.key);
          return related.length === 0 || related.some(clip => !clip.approved);
        });
        setShotIndex(firstPendingShot);
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : 'Could not initialize Voice Agent.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    setClipIndex(0);
    setCorrection('');
  }, [shotIndex]);

  useEffect(() => {
    stopContinuity();
  }, [shotIndex, clipIndex, currentClip?.generationRevision]);

  useEffect(() => () => stopContinuity(), []);

  function stopContinuity() {
    const audio = continuityAudioRef.current;
    if (audio) {
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      continuityAudioRef.current = null;
    }
    setContinuityPlaying(false);
    setContinuityNow('');
  }

  function playContinuity() {
    if (!script || continuityClips.length === 0 || continuityPlaying) return;
    let position = 0;
    setError('');
    setContinuityPlaying(true);

    const playNext = () => {
      if (position >= continuityClips.length) {
        continuityAudioRef.current = null;
        setContinuityPlaying(false);
        setContinuityNow('');
        return;
      }
      const clip = continuityClips[position];
      const audio = new Audio(voiceClipAudioUrl(clip.clipKey, script.revision, clip.generationRevision));
      continuityAudioRef.current = audio;
      setContinuityNow(clip.shotKey + ' · Clip ' + clip.sequence);
      audio.onended = () => {
        position += 1;
        playNext();
      };
      audio.onerror = () => {
        continuityAudioRef.current = null;
        setContinuityPlaying(false);
        setContinuityNow('');
        setError('Continuity Preview could not play ' + clip.clipKey + '.');
      };
      void audio.play().catch(cause => {
        continuityAudioRef.current = null;
        setContinuityPlaying(false);
        setContinuityNow('');
        setError(cause instanceof Error ? cause.message : 'Continuity Preview could not start.');
      });
    };

    playNext();
  }

  function updateVoiceSetting<K extends keyof VoiceSettings>(key: K, value: VoiceSettings[K]) {
    if (!currentClip) return;
    setSettingsByClip(current => ({
      ...current,
      [currentClip.clipKey]: {
        ...settings,
        [key]: value
      }
    }));
  }

  function applyV4Preset() {
    if (!currentClip || currentClip.approved || isCurrentShotLocked) return;
    setSettingsByClip(current => ({ ...current, [currentClip.clipKey]: { ...AT_V4_SETTINGS } }));
    setPerformanceByClip(current => ({ ...current, [currentClip.clipKey]: AT_V4_DIRECTION }));
  }

  async function generate() {
    if (!script || !currentClip || busy) return;
    if (currentClip.approved || isCurrentShotLocked) {
      setError('This voice clip is LOCKED. Approved audio cannot be regenerated.');
      return;
    }
    if (performanceDirection.trim() !== AT_V4_DIRECTION) {
      setError('Generation blocked before ElevenLabs: use the tested production-safe V4 direction: ' + AT_V4_DIRECTION);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const globalIndex = flatClips.findIndex(item => item.clipKey === currentClip.clipKey);
      const row = await generateVoiceClip(currentClip.clipKey, {
        scriptRevision: script.revision,
        previousText: globalIndex > 0 ? flatClips[globalIndex - 1].narration : undefined,
        nextText: globalIndex >= 0 && globalIndex < flatClips.length - 1 ? flatClips[globalIndex + 1].narration : undefined,
        voiceSettings: settings,
        performanceDirection: performanceDirection.trim() || undefined,
        correction: correction.trim() || undefined
      });
      setClips(current => current.map(item => item.clipKey === row.clipKey ? row : item));
      setCorrection('');
      await refreshVoice(script.revision);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Voice generation failed.');
    } finally {
      setBusy(false);
    }
  }

  async function approve() {
    if (!script || !currentClip || busy) return;
    setBusy(true);
    setError('');
    try {
      const row = await approveVoiceClip(currentClip.clipKey, script.revision);
      const updatedClips = clips.map(item => item.clipKey === row.clipKey ? row : item);
      setClips(updatedClips);
      await refreshVoice(script.revision);
      const index = shotClips.findIndex(item => item.clipKey === currentClip.clipKey);
      if (index >= 0 && index < shotClips.length - 1) {
        setClipIndex(index + 1);
      } else {
        const nextPendingShot = bundles.findIndex((bundle, bundleIndex) =>
          bundleIndex > shotIndex &&
          updatedClips.some(clip => clip.shotKey === bundle.key && !clip.approved)
        );
        const firstPendingShot = bundles.findIndex(bundle =>
          updatedClips.some(clip => clip.shotKey === bundle.key && !clip.approved)
        );
        setShotIndex(nextPendingShot >= 0 ? nextPendingShot : firstPendingShot);
        setClipIndex(0);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not approve voice clip.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <main className="production-loading"><LoaderCircle className="spin" size={22} /></main>;
  if (!script || !script.artifact || bundles.length === 0) return <main className="production-loading"><strong>{error || 'Voice Agent unavailable.'}</strong></main>;

  const approvedInShot = shotClips.filter(clip => clip.approved).length;
  const shotReady = Boolean(currentShot && shotState[currentShot.key]?.visualSyncReady);
  const totalApproved = clips.filter(clip => clip.approved).length;

  return (
    <main className="production-page">
      <header className="production-header">
        <div>
          <span>{script.episode.episodeNumber} · VOICE AGENT</span>
          <h1>Voice Production</h1>
          <p>{script.episode.title}</p>
        </div>
        <div className="memory-preflight-badge">{memory.length} MEMORY RULES LOADED</div>
      </header>

      {error && <div className="production-error">{error}</div>}

      <section className="production-summary">
        <div><span>PROVIDER</span><strong>{provider?.configured ? 'ElevenLabs PVC · ' + provider.modelId : 'Not configured'}</strong></div>
        <div><span>CLIP SOURCE</span><strong>{contract?.ready ? 'Imported HEAR / VOICE contract' : 'LOCKED Script fallback'}</strong></div>
        <div><span>APPROVED CLIPS</span><strong>{totalApproved}/{clips.length}</strong></div>
      </section>

      <div className="voice-shot-navigation">
        <nav className="production-shot-rail" aria-label="Active voice shots">
          {activeShotIndexes.map(index => {
            const shot = bundles[index];
            return (
              <button
                type="button"
                key={shot.key}
                className={index === shotIndex ? 'active' : ''}
                onClick={() => setShotIndex(index)}
                title={shot.key + ' · ' + shot.title}
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
              </button>
            );
          })}
          {activeShotIndexes.length === 0 && <span className="voice-all-shots-complete">ALL SHOTS LOCKED</span>}
        </nav>

        {lockedShotIndexes.length > 0 && (
          <details className="voice-locked-shots">
            <summary>Locked shots <strong>{lockedShotIndexes.length}</strong></summary>
            <div>
              {lockedShotIndexes.map(index => {
                const shot = bundles[index];
                return (
                  <button type="button" key={shot.key} onClick={() => setShotIndex(index)}>
                    <span>{shot.key}</span>
                    <small>{shot.title}</small>
                    <Check size={13} />
                  </button>
                );
              })}
            </div>
          </details>
        )}
      </div>

      {currentShot ? (
      <section className="voice-workspace">
        <div className="voice-shot-context">
          <div className="production-section-head">
            <div>
              <span>{currentShot.key} · {clock(currentShot.startSecond)}–{clock(currentShot.endSecond)}</span>
              <h2>{currentShot.title}</h2>
            </div>
            <strong className={shotReady ? 'status-ready' : ''}>{isCurrentShotLocked ? 'LOCKED · READ ONLY' : shotReady ? 'SHOT VOICE READY' : approvedInShot + '/' + shotClips.length + ' clips approved'}</strong>
          </div>

          <div className="voice-clip-tabs">
            {shotClips.map((clip, index) => (
              <button
                type="button"
                key={clip.clipKey}
                className={(index === clipIndex ? 'active ' : '') + (clip.approved ? 'done' : '')}
                onClick={() => setClipIndex(index)}
              >
                Clip {index + 1} · {clock(clip.startSecond)}–{clock(clip.endSecond)}
                {clip.approved && <Check size={12} />}
              </button>
            ))}
          </div>

          {currentClip && (
            <article className="voice-clip-editor">
              <div className="voice-clip-script">
                <span>LOCKED NARRATION</span>
                <p>{currentClip.narration}</p>
              </div>
              <section className="voice-performance-card">
                <div className="voice-performance-head">
                  <div>
                    <span><SlidersHorizontal size={14} /> V4 VOICE PERFORMANCE</span>
                    <strong>Natural-language direction + minimal fine-tuning</strong>
                  </div>
                  <div className="voice-preset-actions">
                    <button type="button" disabled={isCurrentShotLocked || currentClip.approved} onClick={() => applyV4Preset()}>Architectural Thinking</button>
                  </div>
                </div>

                <div className="voice-clip-direction">
                  <span>PRODUCTION CONTRACT · VOICE / INTONATION</span>
                  <p>{currentClip.voiceDirection || 'Use the global calm senior-architect performance direction.'}</p>
                </div>

                <div className="voice-performance-prompt">
                  <label htmlFor="voice-performance-direction">V4 PERFORMANCE DIRECTION <small>production-safe Audio Tag</small></label>
                  <textarea
                    id="voice-performance-direction"
                    value={performanceDirection}
                    disabled={isCurrentShotLocked || currentClip.approved}
                    onChange={event => {
                      const value = event.target.value;
                      setPerformanceByClip(current => ({ ...current, [currentClip.clipKey]: value }));
                    }}
                    rows={3}
                  />
                  {performanceDirection.trim() !== AT_V4_DIRECTION && (
                    <small>Generation is blocked until this direction matches the tested production-safe tag: {AT_V4_DIRECTION}</small>
                  )}
                </div>

                <div className="voice-slider-grid voice-slider-grid-v4">
                  {[
                    ['Stability', 'stability', 0, 1, 0.01],
                    ['Similarity', 'similarityBoost', 0, 1, 0.01]
                  ].map(([label, key, min, max, step]) => (
                    <label key={String(key)}>
                      <span>{String(label)} <strong>{Number(settings[key as keyof VoiceSettings]).toFixed(2)}</strong></span>
                      <input
                        type="range"
                        min={Number(min)}
                        max={Number(max)}
                        step={Number(step)}
                        value={Number(settings[key as keyof VoiceSettings])}
                        disabled={isCurrentShotLocked || currentClip.approved}
                        onChange={event => updateVoiceSetting(key as keyof VoiceSettings, Number(event.target.value) as VoiceSettings[keyof VoiceSettings])}
                      />
                    </label>
                  ))}
                </div>
                <small className="voice-settings-note">LOCKED narration remains untouched. Production Contract voice notes are reference only; MediaOS never sends them raw to ElevenLabs.</small>
              </section>

              <section className="voice-elevenlabs-preview">
                <div className="voice-elevenlabs-preview-head">
                  <span>EXACT ELEVENLABS TEXT</span>
                  <strong>{provider?.modelId || 'TTS model'}</strong>
                </div>
                <pre>{exactTtsText}</pre>
                <small>This is the exact <code>text</code> value MediaOS will send for this clip. Previous/next clip context is sent separately and is not part of the spoken script.</small>
              </section>

              {currentClip.generated && (
                <audio
                  key={currentClip.clipKey + '-' + currentClip.generationRevision}
                  controls
                  preload="metadata"
                  src={voiceClipAudioUrl(currentClip.clipKey, script.revision, currentClip.generationRevision)}
                />
              )}

              {!isCurrentShotLocked && shotIndex > 0 && (
                <section className="voice-continuity-preview">
                  <div className="voice-continuity-copy">
                    <span>CONTINUITY PREVIEW · ZERO CREDITS</span>
                    <strong>{previousReferenceShotKey || 'Previous audio'} → {currentShot.key}</strong>
                    <p>{previousReferenceClips.length > 0
                      ? 'Plays the immediately preceding generated shot, then every generated clip in this shot up to the clip you are reviewing. Previous audio status: ' + (previousReferenceLocked ? 'LOCKED' : 'generated reference') + '.'
                      : 'No previous generated audio was found on the timeline. This preview will activate automatically as soon as previous audio exists.'}</p>
                  </div>
                  <div className="voice-continuity-actions">
                    <small>{continuityPlaying ? 'NOW · ' + continuityNow : continuityClips.length + ' clips · ~' + continuityDuration.toFixed(1) + 's'}</small>
                    <button
                      type="button"
                      disabled={!currentClip.generated || previousReferenceClips.length === 0 || continuityClips.length === 0}
                      onClick={() => continuityPlaying ? stopContinuity() : playContinuity()}
                    >
                      {continuityPlaying ? <Square size={14} /> : <Play size={14} />}
                      {continuityPlaying ? 'Stop Preview' : 'Play Continuity'}
                    </button>
                  </div>
                </section>
              )}

              <div className="voice-correction">
                <label htmlFor="voice-correction">Correction to remember on regenerate <small>optional</small></label>
                <textarea
                  id="voice-correction"
                  value={correction}
                  disabled={isCurrentShotLocked || currentClip.approved}
                  onChange={event => setCorrection(event.target.value)}
                  placeholder="Example: Leave a longer pause before the Aha line. This becomes a durable Voice memory rule."
                  rows={3}
                />
              </div>

              <div className="voice-primary-actions">
                <button type="button" className="secondary" disabled={busy || !provider?.configured || currentClip.approved || isCurrentShotLocked} onClick={() => void generate()}>
                  {busy ? <LoaderCircle className="spin" size={15} /> : currentClip.generated ? <RotateCcw size={15} /> : <Mic2 size={15} />}
                  {currentClip.generated ? 'Regenerate Clip' : 'Generate Clip'}
                </button>
                <button type="button" className="primary" disabled={busy || !currentClip.generated || currentClip.approved} onClick={() => void approve()}>
                  <Check size={15} /> {currentClip.approved ? 'Approved' : 'Approve Clip'}
                </button>
              </div>
            </article>
          )}
        </div>
      </section>
      ) : (
        <section className="voice-workspace voice-production-complete">
          <Check size={22} />
          <strong>All voice shots are LOCKED.</strong>
          <p>Approved shots are available from the Locked shots menu for read-only review.</p>
        </section>
      )}

      <section className="production-next">
        <div>
          <span>VOICE → VISUAL</span>
          <strong>{currentShot ? (shotReady ? currentShot.key + ' has approved timing and semantic anchors.' : 'Approve every clip in the shot first.') : 'All voice shots are approved and locked.'}</strong>
          <p>Visual Agent uses the aggregated clip timing; it never asks you to manually place timestamps.</p>
        </div>
        <button type="button" disabled={!shotState['SHOT 01']?.visualSyncReady} onClick={() => { window.location.hash = '#/agents/visual'; }}>
          Continue to Visual Agent <ChevronRight size={16} />
        </button>
      </section>

      {currentShot && !isCurrentShotLocked && (
        <div className="production-prev-next">
          {(() => {
            const activePosition = activeShotIndexes.indexOf(shotIndex);
            const previousIndex = activePosition > 0 ? activeShotIndexes[activePosition - 1] : -1;
            const nextIndex = activePosition >= 0 && activePosition < activeShotIndexes.length - 1 ? activeShotIndexes[activePosition + 1] : -1;
            return (
              <>
                <button type="button" disabled={previousIndex < 0} onClick={() => previousIndex >= 0 && setShotIndex(previousIndex)}><ChevronLeft size={15} /> Previous Shot</button>
                <button type="button" disabled={nextIndex < 0} onClick={() => nextIndex >= 0 && setShotIndex(nextIndex)}>Next Shot <ChevronRight size={15} /></button>
              </>
            );
          })()}
        </div>
      )}
    </main>
  );
}
