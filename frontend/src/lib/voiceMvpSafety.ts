import type { EpisodeSummary } from '../api/episodeWorkspaceApi';

export function findEp002ForVoiceMvp(episodes: EpisodeSummary[]) {
  return episodes.find(row => row.episodeNumber === 'EP002') ?? null;
}

export function isEp002VoiceWorkspace(episodes: EpisodeSummary[], id: string) {
  return episodes.some(row => row.id === id && row.episodeNumber === 'EP002');
}
