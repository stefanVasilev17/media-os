export type DirectorShot10Visual = {
  summary: string;
  objects: string[];
  camera: string;
  attentionCue?: string;
  semanticAnchors: string[];
  effects: string[];
  notes?: string;
};

export type DirectorShot10Segment = {
  segmentId: string;
  shotKey: 'SHOT 10';
  clipKey: string;
  startSecond: number;
  endSecond: number;
  hear: string;
  voiceDirection: string;
  visual: DirectorShot10Visual;
};

export type DirectorShot10DraftPayload = {
  schemaVersion: 'mediaos.director-shot-draft.v1';
  episodeNumber: 'EP001';
  title: string;
  shotKey: 'SHOT 10';
  shotTitle: string;
  source: string;
  status: 'DIRECTOR_REVIEW';
  durationSeconds: 72;
  fps: 30;
  timeline: DirectorShot10Segment[];
};

export type DirectorShot10DraftState = {
  ready: boolean;
  payload?: DirectorShot10DraftPayload;
  sha256?: string;
  studioPrepared?: boolean;
  studioShotId?: string;
  schemaVersion?: string;
};

function errorMessage(value: unknown, status: number) {
  if (value && typeof value === 'object') {
    const body = value as { detail?: string; message?: string };
    if (body.detail || body.message) return body.detail || body.message || '';
  }
  return 'SHOT 10 director draft request failed (HTTP ' + status + ').';
}

async function request<T>(url: string, method: 'GET' | 'POST' = 'GET', payload?: unknown) {
  const response = await fetch(url, {
    method,
    cache: 'no-store',
    headers: payload === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: payload === undefined ? undefined : JSON.stringify(payload)
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(errorMessage(body, response.status));
  }
  return response.json() as Promise<T>;
}

const route = '/api/v1/director-shot-draft/shot-10';

export const loadDirectorShot10Draft = () =>
  request<DirectorShot10DraftState>(route);

export const importDirectorShot10Draft = (payload: DirectorShot10DraftPayload) =>
  request<{ ready: boolean; status: string; durationSeconds: number; clips: number; message: string }>(
    route + '/import', 'POST', payload
  );

export const prepareDirectorShot10Studio = () =>
  request<{ ready: boolean; alreadyPrepared: boolean; studioShotId: string; message: string }>(
    route + '/prepare-studio-voice', 'POST', {}
  );
