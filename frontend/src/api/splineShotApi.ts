export type ShotEasing = 'linear' | 'smooth' | 'easeInOut';

export type CameraShotBeat = {
  type: 'CAMERA';
  atMs: number;
  targetName: string;
  transitionMs?: number;
  easing?: ShotEasing;
  zoom?: number;
};

export type EventShotBeat = {
  type: 'EVENT';
  atMs: number;
  targetName: string;
  eventName: string;
};

export type StateShotBeat = {
  type: 'STATE';
  atMs: number;
  targetName: string;
  stateValue: string | number;
};

export type VisibilityShotBeat = {
  type: 'VISIBILITY';
  atMs: number;
  targetName: string;
  visible: boolean;
};

export type ZoomShotBeat = {
  type: 'ZOOM';
  atMs: number;
  value: number;
  transitionMs?: number;
  easing?: ShotEasing;
};

export type FlowShotBeat = {
  type: 'FLOW';
  atMs: number;
  flowName: string;
};

export type ShotBeat = CameraShotBeat | EventShotBeat | StateShotBeat | VisibilityShotBeat | ZoomShotBeat | FlowShotBeat;

export type SplineShotSpec = {
  schemaVersion: 1;
  name: string;
  durationMs: number;
  beats: ShotBeat[];
};

export type SplineShot = {
  status: 'READY';
  id: string;
  productionJobId: string;
  shotKey: string;
  shotSequence: number;
  revision: number;
  creatorPrompt: string;
  name: string;
  durationMs: number;
  spec: SplineShotSpec;
  createdAt?: string;
  finishedAt?: string;
};

export type SplineShotCommandResult = {
  productionJobId: string;
  shotKey: string;
  revision: number;
  status: string;
};

export type SplineDirectorMemorySummary = {
  count: number;
  recent: string[];
};

export async function createSplineShotCommand(message: string, shotId?: string | null): Promise<SplineShotCommandResult> {
  const response = await fetch('/api/v1/spline/shots/command', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, shotId: shotId || null })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || 'Could not prepare the runtime shot.');
  }

  return response.json();
}

export async function loadLatestSplineShot(): Promise<SplineShot | null> {
  const response = await fetch('/api/v1/spline/shots/latest', { cache: 'no-store' });
  if (!response.ok) throw new Error('Latest runtime shot is not available.');
  const result = await response.json();
  return result.status === 'READY' ? result as SplineShot : null;
}

export async function loadSplineShot(shotId: string): Promise<SplineShot | null> {
  const response = await fetch(`/api/v1/spline/shots/${encodeURIComponent(shotId)}`, { cache: 'no-store' });
  if (!response.ok) return null;
  const result = await response.json();
  return result.status === 'READY' ? result as SplineShot : null;
}

export async function loadSplineDirectorMemorySummary(): Promise<SplineDirectorMemorySummary> {
  const response = await fetch('/api/v1/spline/shots/memory/summary', { cache: 'no-store' });
  if (!response.ok) throw new Error('Director memory summary is not available.');
  return response.json();
}
