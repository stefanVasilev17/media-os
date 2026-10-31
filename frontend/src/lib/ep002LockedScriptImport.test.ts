import { describe, expect, it } from 'vitest';
import approved from '../data/EP002_FullScript_v4_0_LOCKED.json';
import {
  buildVerbatimEp002ScriptDraft,
  EP002_QA_EPISODE_ID,
  EP002_LOCKED_MANIFEST_BLOB_SHA
} from './ep002LockedScriptImport';

describe('EP002 source-exact Director script import', () => {
  it('preserves every exact narration byte and all 11 approved editorial windows', () => {
    const result = buildVerbatimEp002ScriptDraft();
    expect(EP002_QA_EPISODE_ID).toBe('95b8a4a2-728e-47fe-ad4c-a16748773588');
    expect(EP002_LOCKED_MANIFEST_BLOB_SHA).toBe('e0f8ee8b9c7c22bd7b9947c2cba40b1072a440d0');
    expect(result.scriptVersion).toBe('v4.0');
    expect(result.targetDurationSeconds).toBe(810);
    expect(result.totalWordCount).toBe(1948);
    expect(result.importedNativeStatus).toBe('READY_FOR_REVIEW_ONLY');
    expect(result.voiceGenerationPermission).toBe('NOT_GRANTED');
    expect(result.timeline).toHaveLength(11);
    result.timeline.forEach((shot, i) => {
      const locked = approved.shots[i];
      expect(shot.shotKey).toBe(locked.shotKey);
      expect(shot.title).toBe(locked.title);
      expect(shot.directorScriptRevision).toBe(locked.directorScriptRevision);
      expect(shot.editorialStart).toBe(locked.editorialStart);
      expect(shot.editorialEnd).toBe(locked.editorialEnd);
      expect(shot.editorialDurationSeconds).toBe(locked.editorialDurationSeconds);
      expect(shot.narration).toBe(locked.englishNarration);
      expect(shot.wordCount).toBe(locked.wordCount);
      expect(shot.creativeScriptStatus).toBe('DIRECTOR_LOCKED');
      expect(shot.audioStatus).toBe('NOT_GENERATED');
    });
  });
});
