import type { WorkspaceContext } from './episodeWorkspaceApi';

export type EpisodeBrief = {
  episodeId: string;
  brief: string;
  sources: string;
  revision: number;
  updatedAt: string;
};

export type EpisodeCreation = {
  id: string;
  episodeNumber: string;
  title: string;
  currentStage: string;
  status: string;
};

export type AgentPreview = {
  canRun: boolean;
  blockers: string[];
  authorizationToken: string | null;
  expiresAt?: string | null;
  authorizationExpiresAt?: string | null;
  model: string;
  zeroTokenPreview: boolean;
  firstPassMandatoryRules?: number;
  mandatoryRules?: number;
};

async function request<T>(url: string, method = 'GET', data?: object, preview?: string): Promise<T> {
  const result = await fetch(url, {
    method,
    cache: 'no-store',
    headers: {
      ...(data === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(preview ? { 'X-MediaOS-Preview-Authorization': preview } : {})
    },
    ...(data === undefined ? {} : { body: JSON.stringify(data) })
  });
  if (!result.ok) {
    const raw = await result.text();
    let reason = raw;
    try {
      const parsed = JSON.parse(raw) as { detail?: string; message?: string };
      reason = parsed.detail || parsed.message || raw;
    } catch { /* plain error */ }
    throw new Error('HTTP ' + result.status + ': ' + reason);
  }
  return result.json() as Promise<T>;
}

export const episodePreparationApi = {
  nextNumber: () => request<{ episodeNumber: string }>('/api/v1/episodes/next-number'),
  create: (episodeNumber: string, title: string, brief: string, sources: string) =>
    request<EpisodeCreation>('/api/v1/episodes','POST',{ episodeNumber, title, brief, sources }),
  brief: (id: string) =>
    request<EpisodeBrief>('/api/v1/episodes/' + encodeURIComponent(id) + '/brief'),
  saveBrief: (id: string, brief: string, sources: string, expectedRevision: number) =>
    request<EpisodeBrief>('/api/v1/episodes/' + encodeURIComponent(id) + '/brief',
      'PUT',{ brief, sources, expectedRevision }),
  context: (id: string) =>
    request<WorkspaceContext>('/api/v1/episodes/' + encodeURIComponent(id) + '/context?scope=ALL'),
  preview: (id: string, stage: 'RESEARCH' | 'SCRIPT' | 'SCENE', expectedRevision: number) => {
    const base = '/api/v1/episodes/' + encodeURIComponent(id);
    return stage === 'RESEARCH'
      ? request<AgentPreview>(base + '/research/preview','POST',{ expectedRevision })
      : request<AgentPreview>(base + '/agents/' + stage.toLowerCase() + '/preview',
          'POST',{ action:'GENERATE',expectedRevision,message:'' });
  },
  generate: (id: string, stage: 'RESEARCH' | 'SCRIPT' | 'SCENE',
             expectedRevision: number, previewToken: string) => {
    const base = '/api/v1/episodes/' + encodeURIComponent(id);
    return stage === 'RESEARCH'
      ? request<unknown>(base + '/research/run','POST',{ expectedRevision },previewToken)
      : request<unknown>(base + '/agents/' + stage.toLowerCase() + '/run','POST',
          { action:'GENERATE',expectedRevision,message:'' },previewToken);
  },
  attachResearchSources: (id: string, expectedRevision: number, sources: string) =>
    request<WorkspaceContext>('/api/v1/episodes/' + encodeURIComponent(id)
      + '/research/sources','PUT',{ expectedRevision,sources }),
  approveStage: (id: string, stage: 'RESEARCH' | 'SCRIPT' | 'SCENE',
                 expectedRevision: number, directorNote: string) =>
    request<WorkspaceContext>('/api/v1/episodes/' + encodeURIComponent(id)
      + '/stages/' + stage.toLowerCase() + '/director-lock','POST',
        { expectedRevision,decision:'DIRECTOR_APPROVE',directorNote })
};
