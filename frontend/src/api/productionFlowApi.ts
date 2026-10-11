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

async function request<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(await readError(response));
  return response.json();
}

export type ProductionFlowStage = {
  key: string;
  label: string;
  route: string;
  status: string;
  detail: string;
};

export type ProductionFlowState = {
  episode: {
    episodeNumber: string;
    title: string;
    currentStage: string;
    status: string;
  };
  scriptRevision: number;
  stages: ProductionFlowStage[];
  nextRoute: string;
  nextLabel: string;
  voice: { total: number; generated: number; approved: number };
  visualQaPassed: number;
  preview: { ready: boolean; renderId?: string; durationInFrames?: number; fps?: number; sizeBytes?: number };
  memoryRuleCount: number;
};

export function loadProductionFlow() {
  return request<ProductionFlowState>('/api/v1/production-flow');
}
