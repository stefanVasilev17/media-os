import { describe, expect, it } from 'vitest';
import { findEp002ForVoiceMvp, isEp002VoiceWorkspace } from './voiceMvpSafety';
import type { EpisodeSummary } from '../api/episodeWorkspaceApi';

const rows = [
  { id: 'ep001-id', episodeNumber: 'EP001', title: 'Login' },
  { id: 'ep002-id', episodeNumber: 'EP002', title: 'Login Failure' },
  { id: 'ep003-id', episodeNumber: 'EP003', title: 'Future Episode' }
] as EpisodeSummary[];

describe('EP002 voice-only safety', () => {
  it('finds the exact EP002 source even when QA and production IDs differ', () => {
    expect(findEp002ForVoiceMvp(rows)?.id).toBe('ep002-id');
  });
  it('never opens EP001 or any other episode through EP002 voice-only pages', () => {
    expect(isEp002VoiceWorkspace(rows, 'ep002-id')).toBe(true);
    expect(isEp002VoiceWorkspace(rows, 'ep001-id')).toBe(false);
    expect(isEp002VoiceWorkspace(rows, 'ep003-id')).toBe(false);
    expect(isEp002VoiceWorkspace(rows, 'untrusted-id')).toBe(false);
  });
  it('fails closed when EP002 is absent', () => {
    expect(findEp002ForVoiceMvp(rows.filter(row => row.episodeNumber !== 'EP002'))).toBeNull();
    expect(isEp002VoiceWorkspace([], 'ep002-id')).toBe(false);
  });
});
