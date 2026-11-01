export type ShotRevision = {
  revision: number;
  scriptRevision: number;
  status: 'DRAFT' | 'LOCKED';
  narration: string;
  voiceDirection: string;
  visualDirection: string;
  changeSummary: string;
  lockedAt: string | null;
};

export type ShotRevisionState = {
  episodeId: string;
  shotKey: string;
  title: string;
  baseScriptRevision: number;
  originalNarration: string;
  draft: ShotRevision | null;
  approved: ShotRevision | null;
  effectiveNarration: string;
  effectiveVisualDirection: string;
  voiceVideoRequiresNewApproval: boolean;
  qualityReport: {
    passed: boolean;
    assertionCount: number;
    ruleFingerprint: string;
    violations: Array<{
      assertionId: string; memoryRuleId: string; target: string;
      predicate: string; literalValue: string; sourceRule: string;
    }>;
  };
  messages: Array<{ sender: 'USER' | 'AGENT' | 'SYSTEM'; content: string; source: string; createdAt: string }>;
  writesEnabled: boolean;
  paidAiEnabled: boolean;
  aiConfigured: boolean;
  aiModel: string;
};

export type AiPreview = {
  canRun: boolean;
  model: string;
  estimatedMaxOutputTokens: number;
  zeroTokenPreview: boolean;
  requiresExplicitApproval: boolean;
  authorizationToken: string;
  authorizationExpiresAt: string;
  canonicalPolicyVersion: string;
  mandatoryRulesIncluded: number;
  additionalRulesIncluded: number;
  ruleContextCharacters: number;
  contextFingerprint: string;
  ruleIds: string[];
};

function url(episodeId: string, shotKey: string) {
  return '/api/v1/episodes/' + encodeURIComponent(episodeId)
    + '/shot-revisions/' + encodeURIComponent(shotKey);
}

async function request<T>(path: string, method = 'GET', body?: unknown, token?: string): Promise<T> {
  const response = await fetch(path, {
    method,
    cache: 'no-store',
    headers: {
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { 'X-MediaOS-Preview-Authorization': token } : {})
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
  if (!response.ok) {
    const text = await response.text();
    try {
      const data = JSON.parse(text) as { detail?: string; message?: string; error?: string };
      throw new Error(data.detail || data.message || data.error || text);
    } catch (error) {
      if (error instanceof SyntaxError) throw new Error('MediaOS HTTP ' + response.status + ': ' + text);
      throw error;
    }
  }
  return response.json() as Promise<T>;
}

export const shotRevisionApi = {
  state: (ep: string, shot: string) => request<ShotRevisionState>(url(ep, shot)),
  note: (ep: string, shot: string, message: string) =>
    request<ShotRevisionState>(url(ep, shot) + '/messages', 'POST', { message }),
  draft: (ep: string, shot: string, data: {
    expectedRevision: number; narration: string; voiceDirection: string;
    visualDirection: string; changeSummary: string;
  }) => request<ShotRevisionState>(url(ep, shot) + '/draft', 'PUT', data),
  lock: (ep: string, shot: string, expectedRevision: number, directorNote: string) =>
    request<ShotRevisionState>(url(ep, shot) + '/director-lock', 'POST',
      { expectedRevision, decision: 'DIRECTOR_APPROVE', directorNote }),
  preview: (ep: string, shot: string, expectedRevision: number, message: string) =>
    request<AiPreview>(url(ep, shot) + '/ai/preview', 'POST',
      { expectedRevision, message, aiEnabled: true }),
  generate: (ep: string, shot: string, expectedRevision: number, message: string, token: string) =>
    request<ShotRevisionState & { agentReply: string }>(url(ep, shot) + '/ai/run', 'POST',
      { expectedRevision, message, aiEnabled: true }, token)
};
