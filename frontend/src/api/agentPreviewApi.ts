import type { CreativeStageKey } from './creativeApi';
import type { DirectorMode } from './directorApi';

export type AgentActionPreview = {
  zeroTokenPreview: boolean;
  agentKey: string;
  agentName: string;
  operation: string;
  model: string;
  plannedPaidCalls: number;
  maxOutputTokens: number;
  paidAiEnabled: boolean;
  apiConfigured: boolean;
  autoRepairEnabled: boolean;
  canRun: boolean;
  blockers: string[];
  previewMutatesState: boolean;
  previewUsesPaidAi: boolean;
  contextSources: string[];
  onSuccess: string[];
  locksAutomatically: boolean;
  messageCharacters?: number;
  currentRevision?: number;
  hasArtifact?: boolean;
  upstreamReady?: boolean;
  action?: string;
  mode?: string;
};

async function readError(response: Response) {
  const text = await response.text();
  if (!text) return `Request failed with HTTP ${response.status}.`;
  try {
    const parsed = JSON.parse(text) as { detail?: string; message?: string; error?: string };
    return parsed.detail || parsed.message || parsed.error || text;
  } catch {
    return text;
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: 'no-store', ...init });
  if (!response.ok) throw new Error(await readError(response));
  return response.json();
}

export function previewDirectorAction(message: string, mode: DirectorMode = 'DISCUSS') {
  return request<AgentActionPreview>('/api/v1/previews/director', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, mode })
  });
}

export function previewCreativeAction(stageKey: CreativeStageKey, action: 'GENERATE' | 'REVISE', message = '') {
  return request<AgentActionPreview>(`/api/v1/previews/creative/${stageKey.toLowerCase()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, message })
  });
}

export function previewTopicGeneration() {
  return request<AgentActionPreview>('/api/v1/previews/topics');
}
