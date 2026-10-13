async function readError(response: Response) {
  const text = await response.text();
  if (!text) return 'Request failed with HTTP ' + response.status + '.';
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

export type VisualQaCheck = { key: string; passed: boolean; detail: string };

export type VisualShotState = {
  shotKey: string;
  title: string;
  startSecond: number;
  endSecond: number;
  voiceReady: boolean;
  durationSeconds: number;
  alignment: Record<string, unknown>;
  renderId?: string | null;
  rendered: boolean;
  locked: boolean;
  lockedRenderId?: string | null;
  lockedAt?: string | null;
  qaStatus: 'PENDING' | 'PASS' | 'FAIL';
  compositionId: string;
};

export type VisualState = {
  scriptRevision: number;
  shots: VisualShotState[];
  preview: { ready: boolean; renderId?: string; durationInFrames?: number; fps?: number; sizeBytes?: number };
  memoryRuleCount: number;
};

export type VisualPreflight = {
  shotKey: string;
  passed: boolean;
  compositionId: string;
  checks: VisualQaCheck[];
  memoryPreflight: { ruleCount: number };
};

export type VisualPostQa = {
  shotKey: string;
  renderId: string;
  passed: boolean;
  status: 'PASS' | 'FAIL';
  checks: VisualQaCheck[];
};

export function loadVisualState(scriptRevision: number) {
  return request<VisualState>('/api/v1/visual/state?scriptRevision=' + scriptRevision);
}

export function runVisualPreflight(scriptRevision: number, shotKey: string) {
  return request<VisualPreflight>('/api/v1/visual/qa/preflight', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scriptRevision, shotKey })
  });
}

export function runVisualPostQa(scriptRevision: number, shotKey: string, renderId: string) {
  return request<VisualPostQa>('/api/v1/visual/qa/post-render', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scriptRevision, shotKey, renderId })
  });
}


export function lockVisualShot(scriptRevision: number, shotKey: string, renderId: string) {
  return request<{ shotKey: string; locked: boolean; renderId: string }>('/api/v1/visual/lock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scriptRevision, shotKey, renderId })
  });
}
