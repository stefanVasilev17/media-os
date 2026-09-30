export type AiCallLedgerItem = {
  id: string;
  agentKey: string;
  operation: string;
  model?: string | null;
  requestedOutputTokenLimit?: number | null;
  status: string;
  blockedReason?: string | null;
  failureMessage?: string | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  totalTokens?: number | null;
  startedAt: string;
  completedAt?: string | null;
};

export type AiControlState = {
  paidAiEnabled: boolean;
  autoRepairEnabled: boolean;
  updatedAt?: string | null;
  safetyMode: 'ZERO_SPEND' | 'PAID_AI_ON' | string;
  tokenUsageCaptured: boolean;
  month: {
    attempts: number;
    succeeded: number;
    failed: number;
    blocked: number;
    totalTokens: number;
  };
  recentCalls: AiCallLedgerItem[];
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

export async function loadAiControl(): Promise<AiControlState> {
  const response = await fetch('/api/v1/system/ai-control', { cache: 'no-store' });
  if (!response.ok) throw new Error(await readError(response));
  return response.json();
}

export async function updateAiControl(update: {
  paidAiEnabled?: boolean;
  autoRepairEnabled?: boolean;
}): Promise<AiControlState> {
  const response = await fetch('/api/v1/system/ai-control', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(update)
  });
  if (!response.ok) throw new Error(await readError(response));
  return response.json();
}
