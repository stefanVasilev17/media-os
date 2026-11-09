import ep002Manifest from '../data/EP002_FullScript_v5_0_LOCKED.json';
import recoveryVisuals from '../data/EP002_RecoveryVisualOverrides_v5_0.json';
import {buildApprovedEp002SceneDraft} from './ep002ApprovedVisualPassImport';

const repo = 'https://github.com/stefanVasilev17/media-os/blob/main/';
const originalVisualPlan=buildApprovedEp002SceneDraft();
const v5VisualPlan:Record<string,unknown>={
  ...originalVisualPlan,
  visualPassVersion:'v1.0+RECOVERY_V5',
  shots:(originalVisualPlan.shots as Array<{shotKey:string}>).map(shot=>{
    const updated=recoveryVisuals.shots.find(x=>x.shotKey===shot.shotKey);
    return updated?{...shot,...updated}:shot;
  }),
};


export const ep001 = {
  title: 'What Really Happens When You Click Login?',
  approvedShotCount: 12,
  scope: 'Successful login only: phone → request → network → gateway → load balancer → authentication → database → credentials → session → successful Dashboard. Detailed failure paths belong to EP002.',
  editorialApproval: repo + 'docs/episode-memory/events/2026-10-21-ep001-successful-login-only-ep002-failure-architecture-editorial-lock.md',
  shotAssembly: repo + 'docs/episode-memory/events/2026-10-27-ep001-complete-12-shot-assembly-handoff-qa.md',
  finalReview: repo + 'docs/episode-memory/events/2026-10-27-ep001-final-polished-12-shot-1080p-cfr-qa-pass.md',
  finalReviewRenderId: '08fbfdb5-58a8-40bf-b7ed-cc33742750fe',
  reviewSeconds: 1256.7666667,
  finalShotDocs: {
    11: repo + 'docs/episode-memory/events/2026-10-27-ep001-shot11-presentation-v5-final-director-creative-lock.md',
    12: repo + 'docs/episode-memory/events/2026-10-27-ep001-shot12-v5-director-creative-lock.md',
  } as Record<number,string>,
  renderReferences: [
    {label:'SHOT01–09 locked cumulative review',renderId:'fd1046d0-6b20-4267-8135-8b67add2ca33'},
    {label:'SHOT10 Session Creation V8',renderId:'7e55c59a-3102-4d4c-b23e-96c68ad1f286'},
    {label:'SHOT11 Route Decision V5',renderId:'3a09dbd5-7ef8-4c0e-9621-12ca8a4b99a0'},
    {label:'SHOT12 Complete Login Recap V5',renderId:'5d8c7db2-b34e-4781-af1a-2aa236691ea5'},
  ],
  historicalNotice: 'The original 16-shot SCRIPT and HEAR → SEE timeline is an archived editorial version, NOT the current 12-shot production sequence. It must never overwrite approved masters.',
} as const;

export const ep002 = {
  title: ep002Manifest.title,
  editorialApproval: 'https://github.com/stefanVasilev17/media-os/blob/feature/ep002-director-shot11-script-lock-package-20261031/docs/episode-memory/events/2026-10-31-ep002-full-script-pass-v4-0-director-lock.md',
  scriptAssembly: 'https://github.com/stefanVasilev17/media-os/blob/4b964a950f7c0a449483a28151ceeed18a9d0aff/docs/episode-memory/plans/2026-10-31-ep002-full-script-v4-0-11-shot-director-lock-assembly.md',
  visualApproval: repo + 'docs/episode-memory/events/2026-11-01-ep002-visual-pass-v1-0-approval.md',
  qaAudit: repo + 'docs/engineering/EP002_NATIVE_QA_LOCK_AUDIT_AND_PRODUCTION_IMPORT_20261101.md',
  durationSeconds: ep002Manifest.editorialTotalDurationSeconds,
  wordCount: ep002Manifest.totalWordCount,
  shots: ep002Manifest.shots,
  visualPlan: v5VisualPlan,
} as const;

export function renderVideoUrl(renderId: string): string {
  return '/api/v1/remotion/renders/' + encodeURIComponent(renderId) + '/video';
}
