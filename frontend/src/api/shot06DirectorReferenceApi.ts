export type Shot06DirectorReferenceState = {
  available: boolean;
  shotKey: 'SHOT 06';
  version: 'v5';
  expectedSha256: string;
  expectedSizeBytes: number;
  directorApprovedReference: boolean;
  nativeVisualQaPassed: boolean;
  nativeDirectorLockApplied: boolean;
  videoUrl: string;
  sha256?: string;
  sizeBytes?: number;
  uploadedAt?: string;
};

async function readError(response: Response): Promise<string> {
  const body = await response.text();
  try {
    const json = JSON.parse(body) as {detail?: string; message?: string};
    return json.detail || json.message || body;
  } catch {
    return body || 'HTTP ' + response.status;
  }
}

export async function loadShot06DirectorReference(): Promise<Shot06DirectorReferenceState> {
  const response = await fetch('/api/v1/director-review/shot06-v5', {cache:'no-store'});
  if (!response.ok) throw new Error(await readError(response));
  return response.json() as Promise<Shot06DirectorReferenceState>;
}

export async function uploadShot06DirectorReference(file: File): Promise<Shot06DirectorReferenceState> {
  const data = new FormData();
  data.set('file', file);
  const response = await fetch('/api/v1/director-review/shot06-v5/upload', {
    method: 'POST', body: data,
  });
  if (!response.ok) throw new Error(await readError(response));
  return response.json() as Promise<Shot06DirectorReferenceState>;
}
