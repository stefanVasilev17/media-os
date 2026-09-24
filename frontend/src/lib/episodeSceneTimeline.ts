export type EpisodeSceneCueKind = 'state' | 'event' | 'move' | 'zoom' | 'visibility';

export type EpisodeSceneCue = {
  id: string;
  atMs: number;
  kind: EpisodeSceneCueKind;
  targetUuid?: string;
  stateValue?: string;
  eventName?: string;
  x?: number;
  y?: number;
  z?: number;
  zoom?: number;
  visible?: boolean;
};

export type EpisodeScenePlaybackState = 'idle' | 'playing' | 'paused' | 'complete' | 'error';

export function createEpisodeSceneCue(kind: EpisodeSceneCueKind, atMs: number, targetUuid = ''): EpisodeSceneCue {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    atMs: Math.max(0, Math.round(atMs)),
    kind,
    targetUuid,
    stateValue: kind === 'state' ? '1' : undefined,
    eventName: kind === 'event' ? 'mouseDown' : undefined,
    zoom: kind === 'zoom' ? 1 : undefined,
    visible: kind === 'visibility' ? true : undefined
  };
}

export function sortEpisodeSceneCues(cues: EpisodeSceneCue[]) {
  return [...cues].sort((left, right) => left.atMs - right.atMs || left.id.localeCompare(right.id));
}

export function formatEpisodeSceneTime(milliseconds: number) {
  const clamped = Math.max(0, milliseconds);
  const minutes = Math.floor(clamped / 60000);
  const seconds = Math.floor((clamped % 60000) / 1000);
  const tenths = Math.floor((clamped % 1000) / 100);
  return `${minutes}:${String(seconds).padStart(2, '0')}.${tenths}`;
}

export function clampEpisodeSceneTime(milliseconds: number, durationMs: number) {
  return Math.max(0, Math.min(Math.max(100, durationMs), milliseconds));
}
