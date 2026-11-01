export type RuleScope = 'ALL' | 'SCRIPT' | 'VOICE' | 'VISUAL' | 'VOICE_VISUAL';
export type StudioProposal = {
  id: string;
  episodeId: string | null;
  parentProposalId: string | null;
  scope: RuleScope;
  creatorPrompt: string;
  proposedRule: string;
  explanationBg: string;
  positiveExample: string;
  negativeExample: string;
  sourceKind: 'OPENAI' | 'MANUAL';
  status: 'DRAFT' | 'APPROVED' | 'REJECTED';
  ruleFingerprint: string;
  memoryRuleId: string | null;
  directorNote: string | null;
  reviewer: string | null;
  createdAt: string;
  reviewedAt: string | null;
  comparison?: {
    fingerprint: string;
    exactDuplicateRuleId: string | null;
    relatedRules: Array<{ ruleId: string; scope: string; content: string; similarity: number }>;
  };
};
export type RuleRequest = {
  episodeId: string | null;
  scope: RuleScope;
  parentProposalId: string | null;
  message: string;
};
export type RulePreview = {
  authorizationToken: string;
  expiresAt: string;
  model: string;
  maxOutputTokens: number;
  zeroTokenPreview: boolean;
  requiresConfirmation: boolean;
  mandatoryRuleCount: number;
  additionalRuleCount: number;
  policyVersion: string;
  ruleFingerprint: string;
  relatedRules: Array<{ ruleId: string; content: string }>;
};

const root = '/api/v1/rule-studio';
async function request<T>(url: string, method = 'GET', body?: unknown, director?: string, preview?: string): Promise<T> {
  const response = await fetch(url, {
    method,
    cache: 'no-store',
    headers: {
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(director ? { 'X-MediaOS-Director-Approval': director } : {}),
      ...(preview ? { 'X-MediaOS-Preview-Authorization': preview } : {})
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
  if (!response.ok) {
    const raw = await response.text();
    let reason = raw;
    try {
      const json = JSON.parse(raw) as { detail?: string; message?: string };
      reason = json.detail || json.message || raw;
    } catch { /* raw plain error */ }
    throw new Error('MediaOS HTTP ' + response.status + ': ' + reason);
  }
  return response.json() as Promise<T>;
}
export const directorRuleStudioApi = {
  home: () => request<{
    proposals: StudioProposal[]; writesEnabled: boolean; aiConfigured: boolean;
    paidAiEnabled: boolean; model: string; automaticActivation: false;
  }>(root),
  proposal: (id: string) => request<StudioProposal>(root + '/proposals/' + encodeURIComponent(id)),
  manual: (payload: RuleRequest & { ruleEnglish: string }, director: string) =>
    request<StudioProposal>(root + '/manual', 'POST', payload, director),
  preview: (payload: RuleRequest, director: string) =>
    request<RulePreview>(root + '/ai/preview', 'POST', payload, director),
  generate: (payload: RuleRequest, director: string, token: string) =>
    request<StudioProposal>(root + '/ai/run', 'POST', payload, director, token),
  review: (id: string, decision: 'APPROVE' | 'REJECT', fingerprint: string,
           reviewer: string, directorNote: string, director: string) =>
    request<StudioProposal>(root + '/proposals/' + encodeURIComponent(id) + '/review', 'POST',
      { decision, expectedFingerprint: fingerprint,
        comparedExistingRules: true, reviewer, directorNote }, director),
  effective: (episodeId: string, scope: RuleScope) =>
    request<{ scope: RuleScope; episodeId: string;
      rules: Array<{ id: string; scope: string; severity: string; content: string }> }>(
        root + '/effective-rules?episodeId=' + encodeURIComponent(episodeId)
          + '&scope=' + encodeURIComponent(scope))
};
