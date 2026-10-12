export type ProductionContractVisual = {
  summary: string;
  objects?: string[];
  camera?: string;
  attentionCue?: string;
  semanticAnchors?: string[];
  effects?: string[];
  notes?: string;
};

export type ProductionContractSegment = {
  segmentId: string;
  shotKey: string;
  clipKey: string;
  startSecond: number;
  endSecond: number;
  hear: string;
  voiceDirection: string;
  visual: ProductionContractVisual;
};

export type ProductionContractPayload = {
  schemaVersion: 'mediaos.production-contract.v1';
  episodeNumber: string;
  title: string;
  scriptRevision?: number;
  source: string;
  timeline: ProductionContractSegment[];
};

export type ProductionContractState = {
  ready: boolean;
  id?: string;
  scriptRevision?: number;
  schemaVersion: string;
  source?: string;
  payload?: ProductionContractPayload;
  sha256?: string;
  createdAt?: string;
};

export type ProductionContractImportResult = {
  id: string;
  ready: boolean;
  schemaVersion: string;
  scriptRevision: number;
  sha256: string;
  timelineSegments: number;
  importedSegments?: number;
  nextRoute: string;
  message: string;
};

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

export function loadProductionContract() {
  return request<ProductionContractState>('/api/v1/production-contract');
}

export function importProductionContract(payload: ProductionContractPayload) {
  return request<ProductionContractImportResult>('/api/v1/production-contract/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}
