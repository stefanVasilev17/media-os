export type CreativeStageKey = 'SCRIPT' | 'SCENE';

export type CreativeMessage = {
  id: string;
  sender: 'USER' | 'AGENT';
  content: string;
  createdAt: string;
};

export type ScriptTimelineItem = {
  sectionId: string;
  sectionTitle: string;
  startSecond: number;
  endSecond: number;
  narration: string;
  voiceDirection: string;
  purpose: string;
  newValueEvent: boolean;
  newValueSummary: string;
  microTension: boolean;
  cognitiveRelief: boolean;
  listPassage: boolean;
  ahaMoment: boolean;
  reelCandidate: boolean;
  handoffNotes: string;
};

export type ScriptArtifact = {
  overview: string;
  targetDurationSeconds: number;
  timeline: ScriptTimelineItem[];
  handoffPrompt: string;
};

export type SceneTimelineItem = {
  sceneId: string;
  sectionTitle: string;
  startSecond: number;
  endSecond: number;
  narration: string;
  voiceDirection: string;
  visualFocus: string;
  sceneMoves: string[];
  camera: string;
  objects: string[];
};

export type SceneShot = {
  shotKey: string;
  sceneId: string;
  startSecond: number;
  endSecond: number;
  script: string;
  voiceDirection: string;
  moves: string[];
  camera: string;
  visualGoal: string;
  promptForSpline: string;
};

export type SceneArtifact = {
  overview: string;
  timeline: SceneTimelineItem[];
  shots: SceneShot[];
  handoffPrompt: string;
};

export type CreativeEpisode = {
  id: string;
  episodeNumber: string;
  title: string;
  currentStage: string;
  status: string;
  sourceOfTruthVersion?: string | null;
  projectName: string;
};

export type CreativeStageState<TArtifact> = {
  episode: CreativeEpisode;
  stageKey: CreativeStageKey;
  displayName: string;
  status: string;
  summary: string;
  nextAction: string;
  revision: number;
  artifact: TArtifact | null;
  messages: CreativeMessage[];
  memory: Array<{ id: string; type: string; content: string; createdAt: string }>;
  readyToLock: boolean;
  remainingTasks: string[];
  locked: boolean;
  lockedAt?: string | null;
  upstreamReady: boolean;
  upstream: Record<string, unknown>;
  nextStageKey: string;
  nextRoute: string;
  agentConfigured: boolean;
};

export type ProductionStageSummary = {
  id: string;
  stageKey: string;
  agentKey?: string | null;
  displayName: string;
  sequence: number;
  route?: string | null;
  status: string;
  summary: string;
  nextAction: string;
  revision: number;
  readiness: { ready?: boolean; remainingTasks?: string[] };
  lockedAt?: string | null;
  updatedAt?: string | null;
};

export type ProductionOverview = {
  episode: CreativeEpisode;
  progressPercent: number;
  currentFocus: string;
  completed: string[];
  nextActions: string[];
  improvements: string[];
  stages: ProductionStageSummary[];
  live: {
    shotsPrepared: number;
    rendersReady: number;
    rendersActive: number;
    rendersFailed: number;
  };
  source: Record<string, unknown>;
};

export type LockResult<TArtifact> = {
  stage: CreativeStageState<TArtifact>;
  nextStageKey: string;
  nextRoute: string;
  overview: ProductionOverview;
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

export function loadProductionOverview() {
  return request<ProductionOverview>('/api/v1/creative/overview');
}

export function loadCreativeStage<TArtifact>(stageKey: CreativeStageKey) {
  return request<CreativeStageState<TArtifact>>(`/api/v1/creative/${stageKey.toLowerCase()}`);
}

export function generateCreativeStage<TArtifact>(stageKey: CreativeStageKey) {
  return request<CreativeStageState<TArtifact>>(`/api/v1/creative/${stageKey.toLowerCase()}/generate`, { method: 'POST' });
}

export function sendCreativeMessage<TArtifact>(stageKey: CreativeStageKey, message: string) {
  return request<CreativeStageState<TArtifact>>(`/api/v1/creative/${stageKey.toLowerCase()}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });
}

export function lockCreativeStage<TArtifact>(stageKey: CreativeStageKey) {
  return request<LockResult<TArtifact>>(`/api/v1/creative/${stageKey.toLowerCase()}/lock`, { method: 'POST' });
}
