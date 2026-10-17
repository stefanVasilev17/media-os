export type StudioClip = {
  id: string; shotId: string; clipKey: string; sequence: number; narration: string;
  voiceDirection: string; scriptRevision: number; generationRevision: number;
  generated: boolean; lockedAt: string | null; generatedAt: string | null; approvedAt: string | null;
};
export type DirectorVisualEvent = {
  clipKey: string; kind: string; frame: number; spokenTrigger: string;
  visualExample: string; target: string; derivedFromVoiceAlignment: boolean;
};
export type DirectorVisualPlan = {
  schemaVersion: number; recipeId: string; shotKey: string; fps: number;
  durationInFrames: number; directorNotes: string; voiceSignature: string;
  sections: Array<{clipKey: string; startFrame: number; endFrame: number; voiceStartFrame: number}>;
  events: DirectorVisualEvent[];
};
export type DirectorVisualPlanState = {
  ready: boolean; stale?: boolean; plan?: DirectorVisualPlan; validation?: string;
  visualRevision?: number; generationCost?: string;
};
export type StudioShot = {
  id: string; shotNumber: number; shotKey: string; title: string;
  visualPrompt: string; visualRevision: number; previewRenderId?: string | null;
  previewVisualRevision?: number | null; sourceShotKey?: string | null;
  sourceScriptRevision?: number | null; visualPlanRevision?: number | null;
  visualPlanReady?: boolean; clips: StudioClip[];
};
async function request<T>(url: string, method = 'GET', data?: unknown): Promise<T> {
  const r = await fetch('/api/v1/studio' + url, {
    method, cache: 'no-store',
    headers: data === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  if (!r.ok) {
    const body = await r.json().catch(() => ({})) as { detail?: string; message?: string };
    throw new Error(body.detail || body.message || 'MediaOS request failed (HTTP ' + r.status + ')');
  }
  return r.json() as Promise<T>;
}
export const studio = {
  shots: () => request<StudioShot[]>('/shots'),
  createShot: (title: string) => request<StudioShot>('/shots','POST',{title}),
  unlockOriginalShot: (shotKey: string) => request<StudioShot>(
    '/original-shots/' + encodeURIComponent(shotKey) + '/unlock','POST',{directorConfirmed:true}),
  reuseExistingVoices: (shotId: string) => request<{reusedClips: number; approvedClips: number; shot: StudioShot}>(
    '/shots/' + shotId + '/reuse-existing-voices','POST',{}),
  addClip: (shotId: string, narration: string, voiceDirection: string) =>
    request<StudioShot>('/shots/' + shotId + '/clips','POST',{narration,voiceDirection}),
  editClip: (id: string, narration: string, voiceDirection: string) =>
    request<StudioClip>('/clips/' + id,'PUT',{narration,voiceDirection}),
  lockClip: (id: string) => request<StudioClip>('/clips/' + id + '/lock','POST',{}),
  unlockClip: (id: string) => request<StudioClip>('/clips/' + id + '/unlock','POST',{directorConfirmed:true}),
  generateVoice: (id: string) => request<StudioClip>('/clips/' + id + '/generate','POST',{}),
  approveVoice: (id: string) => request<StudioClip>('/clips/' + id + '/approve','POST',{}),
  generateVisualPlan: (shotId: string) => request<DirectorVisualPlanState>(
    '/shots/' + shotId + '/generate-visual-plan','POST',{}),
  loadVisualPlan: (shotId: string) => request<DirectorVisualPlanState>(
    '/shots/' + shotId + '/visual-plan'),
  renderDirectorPlan: (shotId: string) => request<{renderId: string; status: string}>(
    '/shots/' + shotId + '/render-director-plan','POST',{}),
  generatePreview: (shotId: string) => request<{renderId: string; status: string}>(
    '/shots/' + shotId + '/generate-preview','POST',{}),
  saveVisual: (shotId: string, instructions: string) =>
    request<StudioShot>('/shots/' + shotId + '/visual','PUT',{instructions}),
  audioUrl: (id: string, generationRevision: number) =>
    '/api/v1/studio/clips/' + id + '/audio?v=' + generationRevision,
};
