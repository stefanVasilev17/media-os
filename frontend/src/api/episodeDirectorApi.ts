export type EpisodeDirectorShot = {
  shotKey: string;
  title: string;
  narration: string;
  visualDirection: string;
  voiceDirection: string;
  shotRevision: number;
  startSecond: number;
  endSecond: number;
  voiceStatus: 'LOCKED' | 'PENDING';
  videoStatus: 'LOCKED' | 'PENDING';
  voiceProgress: string;
  voiceHasDraft: boolean;
  videoHasDraft: boolean;
};

export type EpisodeDirectorOverview = {
  episode: {
    id: string;
    episodeNumber: string;
    title: string;
    currentStage: string;
    status: string;
  };
  legacyEpisode: boolean;
  scriptRevision: number;
  stages: Array<{ stageKey: string; displayName: string; status: string; revision: number }>;
  shots: EpisodeDirectorShot[];
  counts: { total: number; voiceLocked: number; videoLocked: number };
  voiceVideoWriteReady: boolean;
};

export async function getEpisodeDirectorOverview(episodeId: string): Promise<EpisodeDirectorOverview> {
  const response = await fetch(
    '/api/v1/episodes/' + encodeURIComponent(episodeId) + '/director-overview',
    { cache: 'no-store' }
  );
  if (!response.ok) throw new Error('Could not load this episode (HTTP ' + response.status + ').');
  return response.json() as Promise<EpisodeDirectorOverview>;
}

export const episodeDirectorRoute = (episodeId: string) => '#/episodes/' + encodeURIComponent(episodeId) + '/director';

export const shotRevisionRoute = (episodeId: string, shotKey: string) =>
  '#/episodes/' + encodeURIComponent(episodeId) + '/revision?shot=' + encodeURIComponent(shotKey);

export function episodeShotRoute(episodeId: string, legacyEpisode: boolean, kind: 'voice' | 'video', shotKey: string, hasNewRevision = false) {
  const params = new URLSearchParams({ episodeId, shot: shotKey });
  if (legacyEpisode && !hasNewRevision) {
    return (kind === 'voice' ? '#/agents/voice?' : '#/agents/visual?') + params.toString();
  }
  return '#/episodes/' + encodeURIComponent(episodeId) + '/' + kind + '?' + params.toString();
}
