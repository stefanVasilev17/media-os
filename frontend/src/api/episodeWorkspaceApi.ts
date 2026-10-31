export type EpisodeSummary = {
  id: string; episodeNumber: string; title: string;
  status: string; currentStage: string; sourceVersion: string | null;
  fullyLocked?: boolean;
  hasBrief?: boolean;
};
export type WorkspaceStage = {
  stageKey: string; displayName: string; sequence: number;
  status: string; revision: number; summary: string; nextAction: string;
  artifact: Record<string, unknown>; lockedAt: string | null; updatedAt: string;
};
export type WorkspaceAsset = {
  assetKey: string; type?: string; sourcePath: string; status?: string;
};
export type WorkspaceContext = {
  episode: EpisodeSummary;
  policy: { version: string; payload: Record<string, unknown> };
  rules: Array<{ scope: string; content: string; type: string }>;
  stages: WorkspaceStage[];
  assetsAvailable: WorkspaceAsset[];
  assetsReferenced: WorkspaceAsset[];
  directorLockedShots: Array<{ shotKey: string; renderId: string }>;
  semanticApproval: false;
  scope: string;
};

async function request<T>(path: string): Promise<T> {
  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) {
    const text = await response.text();
    throw new Error('MediaOS HTTP ' + response.status + ': ' + text.slice(0, 200));
  }
  return response.json() as Promise<T>;
}

export function listEpisodeWorkspaces() {
  return request<EpisodeSummary[]>('/api/v1/episodes');
}
export function getEpisodeWorkspace(id: string) {
  return request<WorkspaceContext>('/api/v1/episodes/' + encodeURIComponent(id) + '/context?scope=ALL');
}

export type EpisodeLearningProposal = {
  id: string;
  sourceRuleId: string;
  scope: string;
  content: string;
  status: 'PENDING' | 'PROMOTED' | 'EPISODE_ONLY' | 'REJECTED' | 'ALREADY_GLOBAL';
  classification: string;
  reviewedBy: string | null;
  reviewNote: string | null;
  globalRuleId: string | null;
};
export type EpisodeLearningReview = {
  episodeId: string;
  pendingCount: number;
  proposals: EpisodeLearningProposal[];
  globalRules: Array<{ id: string; scope: string; content: string }>;
  globalFingerprint: string;
  automaticPromotion: false;
  promotionEnabled: boolean;
  note: string;
};
export function getEpisodeLearning(id: string) {
  return request<EpisodeLearningReview>('/api/v1/episodes/' + encodeURIComponent(id) + '/learning');
}
