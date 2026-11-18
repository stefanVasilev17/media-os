export type ImportedEpisodeSummary = {
  packageId: string;
  episodeKey: string;
  title: string;
  status: string;
  shotCount: number;
  beatCount: number;
  sourceSha256: string;
  importedAt: string;
};

export async function listImportedEpisodePackages(): Promise<ImportedEpisodeSummary[]> {
  const response = await fetch('/api/v1/episode-packages', {cache: 'no-store'});
  if (!response.ok) {
    const detail = await response.text();
    throw new Error('MediaOS HTTP ' + response.status + ': ' + detail.slice(0, 200));
  }
  return response.json() as Promise<ImportedEpisodeSummary[]>;
}

export function importedEpisodeRoute(packageId: string, shotKey?: string): string {
  const params = new URLSearchParams({packageId});
  if (shotKey) params.set('shot', shotKey);
  return '#/episode-packages/import?' + params.toString();
}
