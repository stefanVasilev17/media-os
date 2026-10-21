export type DirectorVoiceClip = {
  clipKey: string;
  sequence: number;
  title: string;
  startSecond: number;
  endSecond: number;
  narration: string;
  voiceDirection: string;
};

export type DirectorVoiceShot = {
  shotKey: string;
  title: string;
  startSecond: number;
  endSecond: number;
  clips: DirectorVoiceClip[];
};

export type DirectorVoicePackPayload = {
  schemaVersion: 'mediaos.director-voice-pack.v1';
  episodeNumber: string;
  scriptRevision: number;
  status: 'DIRECTOR_LOCKED';
  directorConfirmed: boolean;
  version: string;
  source: string;
  timecodes: string;
  shots: DirectorVoiceShot[];
};

export type DirectorVoicePackState = {
  ready: boolean;
  payload?: DirectorVoicePackPayload;
  sha256?: string;
};

async function readError(response: Response): Promise<string> {
  const body = await response.text();
  try {
    const json = JSON.parse(body) as { detail?: string; message?: string };
    return json.detail || json.message || body;
  } catch {
    return body || 'Request failed (HTTP ' + response.status + ').';
  }
}

export async function loadDirectorVoicePack() {
  const response = await fetch('/api/v1/director-voice-pack', { cache: 'no-store' });
  if (!response.ok) throw new Error(await readError(response));
  return await response.json() as DirectorVoicePackState;
}

export async function importDirectorVoicePack(payload: DirectorVoicePackPayload) {
  const response = await fetch('/api/v1/director-voice-pack/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(await readError(response));
  return await response.json() as {
    ready: boolean; clips: number; shots: number; message: string; alreadyImported: boolean;
  };
}
