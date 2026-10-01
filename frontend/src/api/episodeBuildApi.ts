import { takePreviewAuthorization } from './agentPreviewApi';

export type TopicCandidate = {
  id: string;
  title: string;
  centralQuestion: string;
  viewerPromise: string;
  evergreenReason: string;
  massEntry: string;
  seniorLesson: string;
  systemBoundary: string;
  coreTension: string;
  ahaCandidates: string[];
  failureTradeoff: string;
  reusePlan: string;
  newAssets: string[];
  seriesPath: string;
  thumbnailIdea: string;
  estimatedComplexity: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendedBuildMinutes: number;
  status: 'CURRENT' | 'READY' | string;
  createdAt: string;
};

export type EpisodeBuildStep = {
  stepKey: 'TRUTH' | 'SCRIPT' | 'SCENE' | 'HANDOFF' | string;
  sequence: number;
  status: string;
  summary: string;
  errorMessage?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  updatedAt?: string | null;
};

export type EpisodeBuildRun = {
  id: string;
  topicCandidateId?: string | null;
  status: string;
  currentStep: string;
  progressPercent: number;
  budgetMinutes: number;
  errorMessage?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  steps: EpisodeBuildStep[];
};

export type EpisodeBuildState = {
  configured: boolean;
  model: string;
  cloudOnly: boolean;
  windowsRequired: boolean;
  policy: {
    version?: string;
    payload?: Record<string, unknown>;
    updatedAt?: string;
  };
  topics: TopicCandidate[];
  latestRun: EpisodeBuildRun | Record<string, never>;
  canStartCurrentEpisode: boolean;
};

export type EpisodeBuildPreviewCall = {
  agent: string;
  operation: string;
  model: string;
  maxOutputTokens: number;
};

export type EpisodeBuildPreview = {
  zeroTokenPreview: boolean;
  apiConfigured: boolean;
  paidAiEnabled: boolean;
  autoRepairEnabled: boolean;
  canStartCurrentEpisode: boolean;
  plannedPaidCalls: number;
  maximumAutomaticCalls: number;
  plannedCalls: EpisodeBuildPreviewCall[];
  automaticRepairCalls: EpisodeBuildPreviewCall[];
  handoffUsesPaidAi: boolean;
  nothingLocksAutomatically: boolean;
  authorizationToken?: string | null;
  authorizationExpiresAt?: string | null;
  authorizationSingleUse?: boolean;
  note: string;
};

let episodeBuildAuthorization = '';

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

export async function loadEpisodeBuildState(): Promise<EpisodeBuildState> {
  const response = await fetch('/api/v1/director/build', { cache: 'no-store' });
  if (!response.ok) throw new Error(await readError(response));
  return response.json();
}

export async function previewEpisodeBuild(): Promise<EpisodeBuildPreview> {
  const response = await fetch('/api/v1/director/build/preview', { cache: 'no-store' });
  if (!response.ok) throw new Error(await readError(response));
  const preview = await response.json() as EpisodeBuildPreview;
  episodeBuildAuthorization = preview.authorizationToken || '';
  return preview;
}

export async function generateTopicCandidates(): Promise<EpisodeBuildState> {
  const response = await fetch('/api/v1/director/build/topics/generate', {
    method: 'POST',
    headers: { 'X-MediaOS-Preview-Authorization': takePreviewAuthorization('TOPIC_CANDIDATES') }
  });
  if (!response.ok) throw new Error(await readError(response));
  return response.json();
}

export async function startCurrentEpisodeBuild(budgetMinutes = 20): Promise<EpisodeBuildState> {
  const previewAuthorization = episodeBuildAuthorization;
  episodeBuildAuthorization = '';
  const response = await fetch('/api/v1/director/build/start', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-MediaOS-Preview-Authorization': previewAuthorization
    },
    body: JSON.stringify({ budgetMinutes })
  });
  if (!response.ok) throw new Error(await readError(response));
  return response.json();
}

export async function retryEpisodeBuild(): Promise<EpisodeBuildState> {
  const response = await fetch('/api/v1/director/build/retry', { method: 'POST' });
  if (!response.ok) throw new Error(await readError(response));
  return response.json();
}
