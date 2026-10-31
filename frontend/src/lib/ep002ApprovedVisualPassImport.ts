import approvedMarkdown from '../data/EP002_VisualPass_v1_0_DIRECTOR_APPROVED.md?raw';
import { EP002_QA_EPISODE_ID } from './ep002LockedScriptImport';

export const EP002_VISUAL_PASS_VERSION = 'v1.0';
export const EP002_VISUAL_PASS_GIT_BLOB_SHA = '5c43c7fd3bd66b5899f0956a9cfd80bdead834f1';
export const EP002_VISUAL_PASS_SOURCE =
  'https://github.com/stefanVasilev17/media-os/blob/feature/qa-ep002-verbatim-script-import-20261101/docs/episode-memory/plans/2026-11-01-ep002-new-scene-visual-pass-director-review-v1-0.md';
export const EP002_VISUAL_PASS_APPROVAL =
  'https://github.com/stefanVasilev17/media-os/blob/feature/qa-ep002-verbatim-script-import-20261101/docs/episode-memory/events/2026-11-01-ep002-visual-pass-v1-0-approval.md';

type ApprovedShot = {
  shotKey: string;
  title: string;
  editorialWindow: string;
  narrationRevision: string;
  visualGoal: string;
  visualPlanMarkdown: string;
  cameraDirection: string;
  assetDirection: string;
  sourceVisualPassGitBlobSha: string;
};

export function buildApprovedEp002SceneDraft(): Record<string, unknown> {
  const sectionStart = approvedMarkdown.indexOf('### SHOT01 — ');
  const sectionEnd = approvedMarkdown.indexOf('\n## 3. Cross-shot continuity', sectionStart);
  const metadataMatches = [...approvedMarkdown.matchAll(
    /^### (SHOT\d{2}) — (\d{2}:\d{2}–\d{2}:\d{2}) — (.+?) — source narration (v\d+\.\d+)\s*$/gm
  )];
  const allBeatCount = (approvedMarkdown.match(/^\d+\. /gm) || []).length;
  if (sectionStart < 0 || sectionEnd <= sectionStart ||
      !approvedMarkdown.includes('## 0. Why this new plan exists') ||
      !approvedMarkdown.includes('## 5. Explicit Director decision required') ||
      !approvedMarkdown.includes('one persistent Remotion') ||
      !approvedMarkdown.includes('SHOT10') ||
      metadataMatches.length !== 11 || allBeatCount !== 59) {
    throw new Error('Approved EP002 visual source failed validation. Nothing was imported.');
  }

  const shotBlocks: ApprovedShot[] = metadataMatches.map((match, index) => {
    const start = match.index;
    const end = index + 1 < metadataMatches.length
      ? metadataMatches[index + 1].index
      : sectionEnd;
    const visualPlanMarkdown = approvedMarkdown.slice(start, end);
    const visualGoal = /\*\*Narrative purpose:\*\* (.+)/.exec(visualPlanMarkdown)?.[1] ?? '';
    const cameraDirection = /\*\*Camera:\*\* (.+)/.exec(visualPlanMarkdown)?.[1] ?? '';
    const assetDirection = /\*\*Assets:\*\* (.+)/.exec(visualPlanMarkdown)?.[1] ?? '';
    const expected = 'SHOT' + String(index + 1).padStart(2, '0');
    if (match[1] !== expected || !visualGoal || !cameraDirection || !assetDirection ||
        !visualPlanMarkdown.includes('**Truth/continuity:**') ||
        !visualPlanMarkdown.includes('**Shot ending / transition:**') ||
        (visualPlanMarkdown.match(/^\d+\. /gm) || []).length < 5) {
      throw new Error('Visual plan is missing a required SHOT or narrative direction.');
    }
    return {
      shotKey: match[1],
      title: match[3],
      editorialWindow: match[2],
      narrationRevision: match[4],
      visualGoal,
      visualPlanMarkdown,
      cameraDirection,
      assetDirection,
      sourceVisualPassGitBlobSha: EP002_VISUAL_PASS_GIT_BLOB_SHA
    };
  });
  const assembledShotContent = shotBlocks.map(s => s.visualPlanMarkdown).join('');
  if (assembledShotContent !== approvedMarkdown.slice(sectionStart, sectionEnd) ||
      !EP002_QA_EPISODE_ID || !approvedMarkdown.includes('### SHOT11')) {
    throw new Error('Original EP002 visual directions did not round-trip exactly.');
  }

  return {
    overview: 'Director-approved NEW Visual Pass v1.0 for EP002. One World, One Living Architecture Map, Remotion-first. Eleven complete source-exact shot plans. The original Script v4.0 English narration remains LOCKED and unchanged.',
    episodeKey: 'EP002',
    visualPassVersion: EP002_VISUAL_PASS_VERSION,
    originalSourceGitBlobSha: EP002_VISUAL_PASS_GIT_BLOB_SHA,
    originalSourceUrl: EP002_VISUAL_PASS_SOURCE,
    creativeDirectorApprovalUrl: EP002_VISUAL_PASS_APPROVAL,
    creativeDirectorApprovalStatus: 'DIRECTOR_APPROVED_IN_GITHUB',
    nativeMediaOsStageStatus: 'READY_FOR_REVIEW_ONLY',
    voiceGenerationPermission: 'NOT_GRANTED',
    containsOriginalMissingV4Choreography: false,
    originalApprovedVisualPassMarkdown: approvedMarkdown,
    shotCount: shotBlocks.length,
    visualBeatCount: allBeatCount,
    shots: shotBlocks
  };
}
