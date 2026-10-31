import manifest from '../data/EP002_FullScript_v4_0_LOCKED.json';

export const EP002_QA_EPISODE_ID = '95b8a4a2-728e-47fe-ad4c-a16748773588';
export const EP002_LOCKED_MANIFEST_BLOB_SHA = 'e0f8ee8b9c7c22bd7b9947c2cba40b1072a440d0';
export const EP002_LOCKED_MANIFEST_SOURCE =
  'https://github.com/stefanVasilev17/media-os/blob/feature/ep002-director-shot11-script-lock-package-20261031/docs/episode-memory/voice/EP002_FullScript_v4_0_ElevenLabs_VoiceInput_LOCKED.json';

export function buildVerbatimEp002ScriptDraft() {
  if (manifest.episodeKey !== 'EP002' ||
      manifest.scriptVersion !== 'v4.0' ||
      manifest.shotCount !== 11 ||
      manifest.totalWordCount !== 1948 ||
      manifest.editorialTotalDurationSeconds !== 810 ||
      manifest.shots.length !== 11 ||
      manifest.shots.some((shot, index) =>
        shot.shotNumber !== index + 1 ||
        shot.shotKey !== 'SHOT' + String(index + 1).padStart(2, '0') ||
        shot.scriptStatus !== 'DIRECTOR_LOCKED' ||
        !shot.englishNarration ||
        shot.editorialDurationSeconds < 1) ||
      manifest.shots.reduce((total, shot) => total + shot.editorialDurationSeconds, 0) !== 810 ||
      manifest.shots.reduce((total, shot) => total + shot.wordCount, 0) !== 1948) {
    throw new Error('Locked EP002 narration source validation failed. No draft was saved.');
  }

  return {
    overview: 'EP002 Full Script Pass v4.0 — eleven exact Director-approved narration shots. QA import for native SCRIPT stage review only. No AI regeneration, no narration rewrite, no imported native Director LOCK.',
    targetDurationSeconds: manifest.editorialTotalDurationSeconds,
    title: manifest.title,
    scriptVersion: manifest.scriptVersion,
    totalWordCount: manifest.totalWordCount,
    sourceManifest: EP002_LOCKED_MANIFEST_SOURCE,
    sourceGitBlobSha: EP002_LOCKED_MANIFEST_BLOB_SHA,
    originalCreativeStatus: manifest.directorFullScriptStatus,
    importedNativeStatus: 'READY_FOR_REVIEW_ONLY',
    voiceGenerationPermission: 'NOT_GRANTED',
    visualChoreographySource: 'Director v4.0 complete visual choreography is NOT imported by the voice-narration manifest; import separately into SCENE.',
    timeline: manifest.shots.map(shot => ({
      shotKey: shot.shotKey,
      title: shot.title,
      directorScriptRevision: shot.directorScriptRevision,
      editorialStart: shot.editorialStart,
      editorialEnd: shot.editorialEnd,
      editorialDurationSeconds: shot.editorialDurationSeconds,
      narration: shot.englishNarration,
      wordCount: shot.wordCount,
      voiceDirection: shot.voiceDirection,
      creativeScriptStatus: shot.scriptStatus,
      audioStatus: shot.audioStatus,
      audioAlignmentStatus: shot.audioAlignmentStatus
    }))
  };
}
