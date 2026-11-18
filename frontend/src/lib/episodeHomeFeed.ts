import type {EpisodeSummary} from '../api/episodeWorkspaceApi';
import type {ImportedEpisodeSummary} from '../api/episodePackageApi';

export type HomeEpisode =
  | {kind: 'workspace'; number: string; episode: EpisodeSummary}
  | {kind: 'imported'; number: string; episode: ImportedEpisodeSummary};

const finished = new Set(['EP001', 'EP002', 'EP003']);

export function episodeHomeFeed(
  workspaces: EpisodeSummary[],
  packages: ImportedEpisodeSummary[],
): HomeEpisode[] {
  const importedKeys = new Set<string>();
  const imported: HomeEpisode[] = [];

  for (const episode of packages) {
    if (finished.has(episode.episodeKey) || importedKeys.has(episode.episodeKey)) continue;
    importedKeys.add(episode.episodeKey);
    imported.push({kind: 'imported', number: episode.episodeKey, episode});
  }

  const native: HomeEpisode[] = workspaces
    .filter(episode => !finished.has(episode.episodeNumber) &&
      !importedKeys.has(episode.episodeNumber))
    .map(episode => ({kind: 'workspace' as const, number: episode.episodeNumber, episode}));

  return [...imported, ...native].sort((a, b) =>
    b.number.localeCompare(a.number, undefined, {numeric: true}));
}
