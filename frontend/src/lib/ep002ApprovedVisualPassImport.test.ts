import { describe, expect, it } from 'vitest';
import source from '../data/EP002_VisualPass_v1_0_DIRECTOR_APPROVED.md?raw';
import {
  buildApprovedEp002SceneDraft,
  EP002_VISUAL_PASS_GIT_BLOB_SHA,
  EP002_VISUAL_PASS_APPROVAL
} from './ep002ApprovedVisualPassImport';

describe('EP002 source-exact Director-approved Visual Pass v1.0 import', () => {
  it('preserves the entire approved file and exactly 11 original shot sections', () => {
    const artifact = buildApprovedEp002SceneDraft();
    expect(artifact.originalSourceGitBlobSha).toBe('5c43c7fd3bd66b5899f0956a9cfd80bdead834f1');
    expect(EP002_VISUAL_PASS_GIT_BLOB_SHA).toBe(artifact.originalSourceGitBlobSha);
    expect(EP002_VISUAL_PASS_APPROVAL).toContain('visual-pass-v1-0-approval.md');
    expect(artifact.originalApprovedVisualPassMarkdown).toBe(source);
    expect(artifact.visualPassVersion).toBe('v1.0');
    expect(artifact.shotCount).toBe(11);
    expect(artifact.visualBeatCount).toBe(59);
    expect(artifact.nativeMediaOsStageStatus).toBe('READY_FOR_REVIEW_ONLY');
    expect(artifact.voiceGenerationPermission).toBe('NOT_GRANTED');

    const shots = artifact.shots as Array<{
      shotKey: string; editorialWindow: string; narrationRevision: string;
      title: string; visualGoal: string; visualPlanMarkdown: string;
      cameraDirection: string; assetDirection: string;
    }>;
    expect(shots).toHaveLength(11);
    const begin = source.indexOf('### SHOT01 — ');
    const end = source.indexOf('\n## 3. Cross-shot continuity', begin);
    expect(shots.map(shot => shot.visualPlanMarkdown).join('')).toBe(source.slice(begin, end));
    const beats = shots.reduce((sum, shot) =>
      sum + (shot.visualPlanMarkdown.match(/^\d+\. /gm) || []).length, 0);
    expect(beats).toBe(59);

    shots.forEach((shot, index) => {
      expect(shot.shotKey).toBe('SHOT' + String(index + 1).padStart(2, '0'));
      expect(shot.visualPlanMarkdown).toContain('**Camera:**');
      expect(shot.visualPlanMarkdown).toContain('**Assets:**');
      expect(shot.visualPlanMarkdown).toContain('**Truth/continuity:**');
      expect(shot.visualPlanMarkdown).toContain('**Shot ending / transition:**');
      expect(shot.visualGoal.length).toBeGreaterThan(5);
      expect(shot.cameraDirection.length).toBeGreaterThan(5);
      expect(shot.assetDirection.length).toBeGreaterThan(5);
      expect(shot.title.length).toBeGreaterThan(5);
      expect(shot.editorialWindow).toMatch(/^\d\d:\d\d–\d\d:\d\d$/);
      expect(shot.narrationRevision).toMatch(/^v1\.\d+$/);
    });
  });

  it('keeps source-lock invariants: one world, requests, retries and timeline alignment', () => {
    const plan = buildApprovedEp002SceneDraft();
    const markdown = plan.originalApprovedVisualPassMarkdown as string;
    expect(markdown).toContain('ONE persistent Remotion');
    expect(markdown).toContain('SHOT10');
    expect(markdown).toContain('Director v4.0');
    expect(markdown).toContain('8/8');
    expect(markdown).toContain('Request A');
    expect(markdown).toContain('Request B');
    expect(markdown).toContain('Read-only lookup');
    expect(markdown).toContain('EP001');
    expect(markdown).toContain('13:30');
    expect(plan.containsOriginalMissingV4Choreography).toBe(false);
  });
});
