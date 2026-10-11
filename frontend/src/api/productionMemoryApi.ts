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

export type ProductionMemoryRule = {
  id: string;
  scope: string;
  type: string;
  severity: string;
  content: string;
  source: string;
  createdAt?: string;
};

export type ProductionMemoryPreflight = {
  auditId: string;
  scope: string;
  action: string;
  passed: boolean;
  ruleCount: number;
  rules: ProductionMemoryRule[];
};

export function loadProductionMemory(scope: 'ALL' | 'SCRIPT' | 'VOICE' | 'VISUAL') {
  return request<ProductionMemoryRule[]>('/api/v1/production-memory/rules?scope=' + scope);
}

export function runProductionPreflight(scope: 'SCRIPT' | 'VOICE' | 'VISUAL', action: string) {
  return request<ProductionMemoryPreflight>('/api/v1/production-memory/preflight', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scope, action })
  });
}

export function rememberProductionCorrection(scope: 'SCRIPT' | 'VOICE' | 'VISUAL', content: string, source: string) {
  return request<ProductionMemoryRule>('/api/v1/production-memory/corrections', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scope, content, source })
  });
}
