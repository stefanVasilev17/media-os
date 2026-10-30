export type ExistingRuleOverlap = {
  ruleId: string;
  scope: string;
  content: string;
  similarity: number;
  note: string;
};

export type ImportComparison = {
  fingerprint: string;
  exactDuplicateRuleId: string | null;
  potentialOverlaps: ExistingRuleOverlap[];
  episodeRegistered: boolean;
  resolvedEpisodeId: string | null;
};

export type ImportCandidate = {
  id: string;
  candidateKey: string;
  targetEpisode: string;
  scope: 'ALL' | 'SCRIPT' | 'VOICE' | 'VISUAL';
  ruleType: string;
  severity: string;
  proposedRule: string;
  sourceFile: string;
  sourceLine: number;
  sourceExcerpt: string;
  declaredSourceSha256: string;
  sourceVerification: string;
  status: 'PENDING' | 'ACTIVATED' | 'EXISTING' | 'REJECTED';
  activatedRuleId: string | null;
  reviewNote: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  comparison: ImportComparison;
};

export type ImportBatch = {
  batchId: string;
  writesEnabled: boolean;
  automaticActivation: false;
  candidates: ImportCandidate[];
};

export type ImportBatchSummary = {
  id: string;
  sourceLabel: string;
  sha256: string;
  candidateCount: number;
  pending: number;
  activated: number;
  createdAt: string;
};

const root = '/api/v1/production-memory/imports';

async function readResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    let detail = text;
    try {
      const json = JSON.parse(text) as { detail?: string; message?: string; error?: string };
      detail = json.detail || json.message || json.error || text;
    } catch { /* non-JSON error */ }
    throw new Error('MediaOS HTTP ' + response.status + ': ' + detail);
  }
  return response.json() as Promise<T>;
}

export const productionMemoryImportApi = {
  list: () => fetch(root, { cache: 'no-store' }).then(r =>
    readResponse<{ batches: ImportBatchSummary[]; writesEnabled: boolean }>(r)),
  batch: (id: string) =>
    fetch(root + '/' + encodeURIComponent(id), { cache: 'no-store' }).then(r =>
      readResponse<ImportBatch>(r)),
  stage: (rawJson: string, directorCapability: string) =>
    fetch(root + '/stage', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain; charset=UTF-8',
                 'X-MediaOS-Director-Approval': directorCapability },
      body: rawJson
    }).then(r => readResponse<{ batchId: string; candidateCount: number; alreadyImported: boolean }>(r)),
  review: (batchId: string, candidateKey: string,
           decision: 'ACTIVATE' | 'MARK_EXISTING' | 'REJECT',
           note: string, reviewer: string, fingerprint: string,
           directorCapability: string) =>
    fetch(root + '/' + encodeURIComponent(batchId) + '/candidates/'
      + encodeURIComponent(candidateKey) + '/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json',
                 'X-MediaOS-Director-Approval': directorCapability },
      body: JSON.stringify({
        action: decision,
        directorNote: note,
        reviewer,
        comparedExistingRules: true,
        expectedFingerprint: fingerprint
      })
    }).then(r => readResponse<{ candidateKey: string; status: string }>(r))
};
