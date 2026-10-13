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
  updateVoiceClipNarration,
  voiceClipAudioUrl,
  type VoiceClipState,
  type VoiceSettings
} from '../api/voiceClipApi';
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
  const [shotIndex, setShotIndex] = useState(0);
  const [clipIndex, setClipIndex] = useState(0);
  const [settingsByClip, setSettingsByClip] = useState<Record<string, VoiceSettings>>({});
  const [performanceByClip, setPerformanceByClip] = useState<Record<string, string>>({});
  const [narrationByClip, setNarrationByClip] = useState<Record<string, string>>({});
  const [correction, setCorrection] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [continuityPlaying, setContinuityPlaying] = useState(false);
  const [continuityNow, setContinuityNow] = useState('');
  const continuityAudioRef = useRef<HTMLAudioElement | null>(null);
  const preserveDeepLinkedClipRef = useRef(false);

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
  const hasEarlierVoiceClip = useMemo(() => {
    if (!currentClip) return false;
    return clips.some(clip =>
      clip.clipKey !== currentClip.clipKey &&
      (clip.startSecond < currentClip.startSecond ||
        (clip.startSecond === currentClip.startSecond && clip.sequence < currentClip.sequence))
    );
  }, [clips, currentClip]);
  const lockedHistoryClips = useMemo(() => {
    if (!currentClip) return [];
    return [...clips]
      .filter(clip =>
        clip.generated &&
        clip.approved &&
        clip.clipKey !== currentClip.clipKey &&
        (clip.startSecond < currentClip.startSecond ||
          (clip.startSecond === currentClip.startSecond && clip.sequence < currentClip.sequence))
      )
      .sort((a, b) => a.startSecond - b.startSecond || a.sequence - b.sequence);
  }, [clips, currentClip]);
  const currentReviewClip = currentClip?.generated && !currentClip.approved ? currentClip : undefined;
  const continuityClips = useMemo(() => {
    if (!currentReviewClip || lockedHistoryClips.length === 0) return [];
    return [...lockedHistoryClips, currentReviewClip];
  }, [currentReviewClip, lockedHistoryClips]);
  const continuityDuration = continuityClips.reduce((total, clip) => total + Math.max(0, clip.durationSeconds || 0), 0);
  const flatClips = useMemo(() => [...clips].sort((a, b) => a.startSecond - b.startSecond || a.sequence - b.sequence), [clips]);
  const settings = currentClip
    ? settingsByClip[currentClip.clipKey] ?? settingsForClip(currentClip, provider)
    : defaultSettings(provider);
  const performanceDirection = currentClip
    ? performanceByClip[currentClip.clipKey] ?? performanceDirectionForClip(currentClip)
    : AT_V4_DIRECTION;
  const narrationText = currentClip
    ? narrationByClip[currentClip.clipKey] ?? currentClip.narration
    : '';
  const exactTtsText = currentClip
    ? exactElevenLabsText(narrationText, performanceDirection, provider?.modelId)
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
        const [scriptState, tts, productionContract] = await Promise.all([
          loadCreativeStage<ScriptArtifact>('SCRIPT'),
          loadTtsProvider(),
          loadProductionContract()
        ]);
        if (!active) return;
        if (!scriptState.locked || !scriptState.artifact) throw new Error('Script must be LOCKED before Voice Agent.');
        setScript(scriptState);
        setProvider(tts);
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

        const hashQuery = window.location.hash.includes('?')
          ? window.location.hash.slice(window.location.hash.indexOf('?') + 1)
          : '';
        const params = new URLSearchParams(hashQuery);
        const requestedShot = params.get('shot');
        const requestedClip = params.get('clip');
        const requestedShotIndex = requestedShot
          ? bundles.findIndex(bundle => bundle.key === requestedShot)
          : -1;
        const initialShotIndex = requestedShotIndex >= 0 ? requestedShotIndex : firstPendingShot;
        setShotIndex(initialShotIndex);

        if (initialShotIndex >= 0 && requestedClip) {
          const related = synced
            .filter(clip => clip.shotKey === bundles[initialShotIndex]?.key)
            .sort((a, b) => a.sequence - b.sequence);
          const requestedClipIndex = related.findIndex(clip => clip.clipKey === requestedClip);
          if (requestedClipIndex >= 0) {
            preserveDeepLinkedClipRef.current = true;
            setClipIndex(requestedClipIndex);
          }
        }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : 'Could not initialize Voice Agent.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (preserveDeepLinkedClipRef.current) {
      preserveDeepLinkedClipRef.current = false;
      setCorrection('');
      return;
    }
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

    const audio = new Audio();
    audio.preload = 'auto';
    continuityAudioRef.current = audio;

    const playNext = () => {
      if (position >= continuityClips.length) {
        audio.ontimeupdate = null;
        audio.onended = null;
        audio.onerror = null;
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
        continuityAudioRef.current = null;
        setContinuityPlaying(false);
        setContinuityNow('');
        return;
      }

      const clip = continuityClips[position];
      const trimStart = Math.max(0, clip.leadingTrimSeconds || 0);
      const playbackEnd = Math.max(trimStart, clip.playbackEndSeconds || 0);
      const src = voiceClipAudioUrl(clip.clipKey, script.revision, clip.generationRevision);

      setContinuityNow(
        clip.clipKey +
        (position === continuityClips.length - 1 ? ' · CURRENT · REVIEW' : ' · LOCKED')
      );

      let finished = false;
      const finishClip = () => {
        if (finished) return;
        finished = true;
        audio.ontimeupdate = null;
        audio.onended = null;
        audio.onerror = null;
        position += 1;
        playNext();
      };

      audio.pause();
      audio.src = src;
      audio.load();

      audio.onloadedmetadata = () => {
        if (trimStart > 0 && audio.currentTime < trimStart) {
          audio.currentTime = trimStart;
        }
      };
      audio.ontimeupdate = () => {
        if (playbackEnd > 0 && audio.currentTime >= playbackEnd) {
          finishClip();
        }
      };
      audio.onended = finishClip;
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
        setError(cause instanceof Error ? cause.message : 'Continuity Preview could not continue playback.');
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
    const spokenText = narrationText.trim();
    if (!spokenText) {
      setError('Add the text you want ElevenLabs to say.');
      return;
    }
    if (performanceDirection.trim() !== AT_V4_DIRECTION) {
      setError('Generation blocked before ElevenLabs: use the tested production-safe V4 direction: ' + AT_V4_DIRECTION);
      return;
    }
    setBusy(true);
    setError('');
    try {
      let workingClip = currentClip;
      let workingFlat = flatClips;
      if (spokenText !== currentClip.narration.trim()) {
        workingClip = await updateVoiceClipNarration(currentClip.clipKey, {
          scriptRevision: script.revision,
          narration: spokenText
        });
        workingFlat = flatClips.map(item => item.clipKey === workingClip.clipKey ? workingClip : item);
        setClips(current => current.map(item => item.clipKey === workingClip.clipKey ? workingClip : item));
        setNarrationByClip(current => ({ ...current, [workingClip.clipKey]: workingClip.narration }));
      }

      const globalIndex = workingFlat.findIndex(item => item.clipKey === workingClip.clipKey);
      const row = await generateVoiceClip(workingClip.clipKey, {
        scriptRevision: script.revision,
        previousText: globalIndex > 0 ? workingFlat[globalIndex - 1].narration : undefined,
        nextText: globalIndex >= 0 && globalIndex < workingFlat.length - 1 ? workingFlat[globalIndex + 1].narration : undefined,
        voiceSettings: settings,
        performanceDirection: performanceDirection.trim() || undefined,
        correction: correction.trim() || undefined
      });
      setClips(current => current.map(item => item.clipKey === row.clipKey ? row : item));
      setNarrationByClip(current => ({ ...current, [row.clipKey]: row.narration }));
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
  return (
    <main className="production-page voice-agent-clean">
      <header className="production-header voice-clean-header">
        <div>
          <span>{script.episode.episodeNumber} · VOICE AGENT</span>
          <h1>Voice Production</h1>
          <p>{script.episode.title}</p>
        </div>
        <div className="voice-provider-status">
          <span>{provider?.configured ? 'ElevenLabs v4 · READY' : 'TTS NOT READY'}</span>
          <strong>{approvedInShot}/{shotClips.length || 0} approved</strong>
        </div>
      </header>

      {error && <div className="production-error">{error}</div>}

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
        <section className="voice-workspace voice-workspace-clean">
          <div className="voice-shot-context">
            <div className="production-section-head voice-clean-shot-head">
              <div>
                <span>{currentShot.key} · {clock(currentShot.startSecond)}–{clock(currentShot.endSecond)}</span>
                <h2>{currentShot.title}</h2>
              </div>
              <strong className={shotReady ? 'status-ready' : ''}>
                {isCurrentShotLocked ? 'LOCKED' : shotReady ? 'VOICE READY' : approvedInShot + '/' + shotClips.length + ' APPROVED'}
              </strong>
            </div>

            <div className="voice-clip-tabs">
              {shotClips.map((clip, index) => (
                <button
                  type="button"
                  key={clip.clipKey}
                  className={(index === clipIndex ? 'active ' : '') + (clip.approved ? 'done' : '')}
                  onClick={() => setClipIndex(index)}
                >
                  Clip {index + 1}
                  {clip.approved && <Check size={12} />}
                </button>
              ))}
            </div>

            {currentClip && (
              <article className="voice-clip-editor voice-clip-editor-clean">
                <div className="voice-narration-editor">
                  <div className="voice-narration-head">
                    <label htmlFor="voice-narration">WHAT ELEVENLABS WILL SAY</label>
                    <span>
                      {currentClip.approved
                        ? 'LOCKED'
                        : narrationText.trim() !== currentClip.narration.trim() || currentClip.narrationOverridden
                          ? 'DIRECTOR EDIT'
                          : 'EDITABLE'}
                    </span>
                  </div>
                  <textarea
                    id="voice-narration"
                    value={narrationText}
                    disabled={isCurrentShotLocked || currentClip.approved}
                    onChange={event => setNarrationByClip(current => ({
                      ...current,
                      [currentClip.clipKey]: event.target.value
                    }))}
                    rows={5}
                    spellCheck
                  />
                  {!currentClip.approved && (
                    <small>Edit freely. MediaOS saves this text when you Generate and sends exactly this narration to ElevenLabs.</small>
                  )}
                </div>

                <div className="voice-primary-actions voice-primary-actions-clean">
                  <button
                    type="button"
                    className="secondary"
                    disabled={busy || !provider?.configured || currentClip.approved || isCurrentShotLocked || !narrationText.trim()}
                    onClick={() => void generate()}
                  >
                    {busy ? <LoaderCircle className="spin" size={15} /> : currentClip.generated ? <RotateCcw size={15} /> : <Mic2 size={15} />}
                    {currentClip.generated ? 'Regenerate' : 'Generate'}
                  </button>
                  <button
                    type="button"
                    className="primary"
                    disabled={busy || !currentClip.generated || currentClip.approved}
                    onClick={() => void approve()}
                  >
                    <Check size={15} /> {currentClip.approved ? 'Approved' : 'Approve'}
                  </button>
                </div>

                {currentClip.generated && (
                  <audio
                    key={currentClip.clipKey + '-' + currentClip.generationRevision}
                    controls
                    preload="metadata"
                    src={voiceClipAudioUrl(currentClip.clipKey, script.revision, currentClip.generationRevision)}
                    onLoadedMetadata={event => {
                      const trimStart = Math.max(0, currentClip.leadingTrimSeconds || 0);
                      if (trimStart > 0 && event.currentTarget.currentTime < trimStart) {
                        event.currentTarget.currentTime = trimStart;
                      }
                    }}
                    onPlay={event => {
                      const trimStart = Math.max(0, currentClip.leadingTrimSeconds || 0);
                      if (trimStart > 0 && event.currentTarget.currentTime < trimStart) {
                        event.currentTarget.currentTime = trimStart;
                      }
                    }}
                    onTimeUpdate={event => {
                      const playbackEnd = Math.max(currentClip.leadingTrimSeconds || 0, currentClip.playbackEndSeconds || 0);
                      if (playbackEnd > 0 && event.currentTarget.currentTime >= playbackEnd) {
                        event.currentTarget.pause();
                      }
                    }}
                  />
                )}

                {!isCurrentShotLocked && currentClip && hasEarlierVoiceClip && (
                  <section className="voice-continuity-preview voice-continuity-compact">
                    <div className="voice-continuity-copy">
                      <span>CONTINUITY PREVIEW · ZERO CREDITS</span>
                      <strong>
                        {currentReviewClip
                          ? 'Full locked history → current review'
                          : 'Generate this clip to review it in context'}
                      </strong>
                    </div>
                    <div className="voice-continuity-actions">
                      <small>{continuityPlaying ? 'NOW · ' + continuityNow : continuityClips.length + ' clips · ~' + continuityDuration.toFixed(1) + 's'}</small>
                      <button
                        type="button"
                        disabled={!currentReviewClip || lockedHistoryClips.length === 0 || continuityClips.length < 2}
                        onClick={() => continuityPlaying ? stopContinuity() : playContinuity()}
                      >
                        {continuityPlaying ? <Square size={14} /> : <Play size={14} />}
                        {continuityPlaying ? 'Stop' : 'Play continuity'}
                      </button>
                    </div>
                  </section>
                )}

                <details className="voice-advanced">
                  <summary>
                    <span><SlidersHorizontal size={14} /> Advanced voice settings</span>
                    <small>neutral international English · 0.50 stability · 0.80 similarity</small>
                  </summary>
                  <div className="voice-advanced-body">
                    <div className="voice-safe-tag">
                      <span>DELIVERY TARGET</span>
                      <code>Neutral international English · clear · measured</code>
                    </div>
                    <div className="voice-safe-tag">
                      <span>PERFORMANCE TAG</span>
                      <code>[{AT_V4_DIRECTION}]</code>
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

                    <div className="voice-advanced-row">
                      <div>
                        <span>CONTRACT VOICE NOTE</span>
                        <p>{currentClip.voiceDirection || 'Use the global calm senior-architect performance direction.'}</p>
                      </div>
                      <button
                        type="button"
                        disabled={isCurrentShotLocked || currentClip.approved}
                        onClick={() => applyV4Preset()}
                      >
                        Reset safe preset
                      </button>
                    </div>

                    <div className="voice-elevenlabs-preview voice-elevenlabs-preview-compact">
                      <div className="voice-elevenlabs-preview-head">
                        <span>EXACT API TEXT</span>
                        <strong>{provider?.modelId || 'TTS model'}</strong>
                      </div>
                      <pre>{exactTtsText}</pre>
                    </div>

                    <div className="voice-correction">
                      <label htmlFor="voice-correction">Regeneration note <small>optional · remembered</small></label>
                      <textarea
                        id="voice-correction"
                        value={correction}
                        disabled={isCurrentShotLocked || currentClip.approved}
                        onChange={event => setCorrection(event.target.value)}
                        placeholder="Example: more space before the final phrase"
                        rows={2}
                      />
                    </div>
                  </div>
                </details>
              </article>
            )}
          </div>
        </section>
      ) : (
        <section className="voice-workspace voice-production-complete">
          <Check size={22} />
          <strong>All voice shots are LOCKED.</strong>
        </section>
      )}

      {shotReady && (
        <section className="production-next voice-next-compact">
          <div>
            <span>VOICE READY</span>
            <strong>{currentShot?.key} has approved timing and semantic anchors.</strong>
          </div>
          <button type="button" onClick={() => { window.location.hash = '#/agents/visual'; }}>
            Continue to Visual Agent <ChevronRight size={16} />
          </button>
        </section>
      )}

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
