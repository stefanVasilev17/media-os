export type EpisodeVoiceTake = {
  id: string;
  takeNumber: number;
  contentType: string;
  fileName: string;
  modelId: string;
  voiceId: string;
  generatedAt: string;
  approvedAt: string | null;
};

export type EpisodeRevisionVoice = {
  episodeId: string;
  episodeNumber: string;
  shotKey: string;
  shotRevision: number;
  narration: string;
  voiceDirection: string;
  canGenerate: boolean;
  blockedReason?: string | null;
  configured: boolean;
  takes: EpisodeVoiceTake[];
  voiceApproved: boolean;
  voiceModel: string;
};

const base = (episodeId: string, shotKey: string) =>
  '/api/v1/episodes/' + encodeURIComponent(episodeId)
  + '/shot-revisions/' + encodeURIComponent(shotKey) + '/voice';

async function request<T>(url: string, method = 'GET', body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method,
    cache: 'no-store',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  if (!response.ok) {
    const raw = await response.text();
    let detail = raw;
    try {
      const parsed = JSON.parse(raw) as { detail?: string; message?: string; error?: string };
      detail = parsed.detail || parsed.message || parsed.error || raw;
    } catch { /* response was not JSON */ }
    throw new Error('MediaOS HTTP ' + response.status + ': ' + detail);
  }
  return response.json() as Promise<T>;
}

export const episodeRevisionVoiceApi = {
  state: (episodeId: string, shotKey: string) =>
    request<EpisodeRevisionVoice>(base(episodeId, shotKey)),
  generate: (episodeId: string, shotKey: string, expectedRevision: number) =>
    request<EpisodeRevisionVoice>(base(episodeId, shotKey) + '/generate', 'POST', { expectedRevision }),
  approve: (episodeId: string, shotKey: string, expectedRevision: number, takeId: string) =>
    request<EpisodeRevisionVoice>(base(episodeId, shotKey) + '/approve', 'POST',
      { expectedRevision, takeId, decision: 'DIRECTOR_APPROVE' }),
  audio: (episodeId: string, shotKey: string, takeId: string) =>
    base(episodeId, shotKey) + '/takes/' + encodeURIComponent(takeId) + '/audio'
};
