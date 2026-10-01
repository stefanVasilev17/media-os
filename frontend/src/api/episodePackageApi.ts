export type EpisodePackagePreview = {
  zeroTokenPreview: boolean;
  packageId?: string;
  schemaVersion?: string;
  packageVersion?: string;
  filename: string;
  contentHash: string;
  episodeNumber?: string;
  title?: string;
  durationSeconds?: number;
  scriptBlocks: number;
  sceneBlocks: number;
  shots: number;
  agentTasks: number;
  blockers: string[];
  valid: boolean;
  canApply: boolean;
  alreadyApplied?: boolean;
  previewExpiresInMinutes?: number;
  paidAiCalls: number;
  windowsRequired: boolean;
  gpuRendersQueued: number;
  willLock: string[];
  willQueue: string;
  willNotDo: string[];
};

export type EpisodePackageCurrent = {
  status?: string;
  id?: string;
  schemaVersion?: string;
  packageVersion?: string;
  filename?: string;
  contentHash?: string;
  appliedAt?: string;
  createdAt?: string;
  episodeNumber?: string;
  title?: string;
  durationSeconds?: number;
  scriptBlocks?: number;
  sceneBlocks?: number;
  shots?: number;
  paidAiCalls?: number;
};

export type EpisodePackageApplyResult = {
  applied: boolean;
  packageId: string;
  filename: string;
  contentHash: string;
  sourceVersion: string;
  episodeNumber: string;
  title: string;
  scriptRevision: number;
  sceneRevision: number;
  shotPlansQueued: number;
  paidAiCalls: number;
  windowsRequired: boolean;
  gpuRendersQueued: number;
  nextAction: string;
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

export async function previewEpisodePackage(file: File) {
  const content = await file.text();
  return request<EpisodePackagePreview>('/api/v1/director/package/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: file.name, content })
  });
}

export function applyEpisodePackage(packageId: string) {
  return request<EpisodePackageApplyResult>('/api/v1/director/package/apply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ packageId })
  });
}

export function loadCurrentEpisodePackage() {
  return request<EpisodePackageCurrent>('/api/v1/director/package/current');
}
