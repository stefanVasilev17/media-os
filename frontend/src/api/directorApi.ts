export type DirectorMode = 'DISCUSS' | 'CHALLENGE' | 'IMPROVE' | 'IMPACT';

export type DirectorEpisode = {
  id: string;
  episodeNumber: string;
  title: string;
  currentStage: string;
  status: string;
  sourceOfTruthVersion?: string | null;
  projectName: string;
};

export type DirectorAgentState = {
  name: string;
  configured: boolean;
  model: string;
  executionTarget: string;
  windowsRequired: boolean;
};

export type DirectorPipelineStage = {
  key: string;
  label: string;
  status: string;
  detail: string;
};

export type DirectorMessage = {
  id: string;
  sender: 'USER' | 'AGENT' | 'SYSTEM';
  content: string;
  createdAt: string;
};

export type DirectorProposal = {
  id: string;
  title: string;
  summary: string;
  riskLevel: string;
  confidence: number;
  status: string;
  affectedObjects: string[];
  downstreamImpact: string[];
  createdAt: string;
  decidedAt?: string | null;
};

export type DirectorMetrics = {
  shotsPrepared: number;
  rendersReady: number;
  rendersActive: number;
  rendersFailed: number;
  openProposals: number;
  lockedDecisions: number;
};

export type DirectorRoom = {
  episode: DirectorEpisode;
  agent: DirectorAgentState;
  pipeline: DirectorPipelineStage[];
  metrics: DirectorMetrics;
  messages: DirectorMessage[];
  proposals: DirectorProposal[];
  decisions: DirectorProposal[];
  operatingRules: string[];
};

export type DirectorMessageResult = {
  messageId: string;
  responseType: string;
  proposalId?: string | null;
  recommendedNextAction?: string;
  room: DirectorRoom;
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

export async function loadDirectorRoom(): Promise<DirectorRoom> {
  const response = await fetch('/api/v1/director/room', { cache: 'no-store' });
  if (!response.ok) throw new Error(await readError(response));
  return response.json();
}

export async function sendDirectorMessage(message: string, mode: DirectorMode, previewAuthorization: string): Promise<DirectorMessageResult> {
  const response = await fetch('/api/v1/director/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-MediaOS-Preview-Authorization': previewAuthorization
    },
    body: JSON.stringify({ message, mode })
  });
  if (!response.ok) throw new Error(await readError(response));
  return response.json();
}

export async function lockDirectorProposal(proposalId: string): Promise<DirectorRoom> {
  const response = await fetch(`/api/v1/director/proposals/${encodeURIComponent(proposalId)}/lock`, {
    method: 'POST'
  });
  if (!response.ok) throw new Error(await readError(response));
  return response.json();
}

export async function dismissDirectorProposal(proposalId: string): Promise<DirectorRoom> {
  const response = await fetch(`/api/v1/director/proposals/${encodeURIComponent(proposalId)}/dismiss`, {
    method: 'POST'
  });
  if (!response.ok) throw new Error(await readError(response));
  return response.json();
}
