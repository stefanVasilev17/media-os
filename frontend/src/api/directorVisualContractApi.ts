import type {ProductionContractSegment} from './productionContractApi';

export type DirectorVisualContractPayload = {
  schemaVersion: 'mediaos.director-visual-contract.v1';
  episodeNumber: 'EP001';
  scriptRevision: 3;
  shotKey: 'SHOT 07';
  status: 'VISUAL_DRAFT';
  directorVoicePackVersion: string;
  source: string;
  review: {
    fps: 30;
    width: 1920;
    height: 1080;
    videoLockRequiresDirectorApproval: true;
    initialHoldFrames: number;
    gapFrames: number[];
    finalHoldFrames: number;
  };
  timeline: ProductionContractSegment[];
};

export type DirectorVisualContractState = {
  ready: boolean;
  payload?: DirectorVisualContractPayload;
  sha256?: string;
  voicePackSha256?: string;
};

async function readError(response: Response): Promise<string> {
  const body = await response.text();
  try {
    const json = JSON.parse(body) as {detail?: string; message?: string};
    return json.detail || json.message || body;
  } catch {
    return body || 'Request failed (HTTP ' + response.status + ').';
  }
}

export async function loadDirectorVisualContract(): Promise<DirectorVisualContractState> {
  const response = await fetch('/api/v1/director-visual-contract/shot-07', {cache: 'no-store'});
  if (!response.ok) throw new Error(await readError(response));
  return await response.json() as DirectorVisualContractState;
}

export async function importDirectorVisualDraft(payload: DirectorVisualContractPayload) {
  const response = await fetch('/api/v1/director-visual-contract/shot-07/draft', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await readError(response));
  return response.json() as Promise<DirectorVisualContractState>;
}
