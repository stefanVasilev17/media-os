import type { VoiceShotBundle } from '../lib/ep001Production';

async function readError(response: Response) {
  const text = await response.text();
  if (!text) return 'Request failed with HTTP ' + response.status + '.';
  try {
    const parsed = JSON.parse(text) as { detail?: string; message?: string; error?: string };
    return parsed.detail || parsed.message || parsed.error || text;
  } catch {
    return text;
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: 'no-store', ...init });
  if (!response.ok) throw new Error(await readError(response));
  return response.json();
}

export type VoiceClipState = {
  clipKey: string;
  shotKey: string;
  sequence: number;
  startSecond: number;
  endSecond: number;
  narration: string;
  voiceDirection: string;
  generated: boolean;
  approved: boolean;
  durationSeconds: number;
  leadingTrimSeconds: number;
  playbackEndSeconds: number;
  generatedAudioFileName?: string | null;
  generatedAlignment: Record<string, unknown>;
  generatedVoiceId?: string | null;
  generatedModelId?: string | null;
  generationRevision: number;
  generatedAt?: string | null;
  approvedAt?: string | null;
};

export type VoiceSettings = {
  stability: number;
  similarityBoost: number;
};

export function syncVoiceClips(scriptRevision: number, shots: VoiceShotBundle[]) {
  return request<VoiceClipState[]>('/api/v1/voice-clips/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      scriptRevision,
      shots: shots.map(shot => ({
        shotKey: shot.key,
        title: shot.title,
        startSecond: shot.startSecond,
        endSecond: shot.endSecond,
        narration: shot.narration,
        voiceDirection: shot.voiceDirection,
        clips: shot.clips
      }))
    })
  });
}

export function loadVoiceClips(scriptRevision: number) {
  return request<VoiceClipState[]>('/api/v1/voice-clips?scriptRevision=' + scriptRevision);
}

export function generateVoiceClip(
  clipKey: string,
  payload: {
    scriptRevision: number;
    previousText?: string;
    nextText?: string;
    voiceSettings: VoiceSettings;
    performanceDirection?: string;
    correction?: string;
  }
) {
  return request<VoiceClipState>('/api/v1/voice-clips/' + encodeURIComponent(clipKey) + '/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export function approveVoiceClip(clipKey: string, scriptRevision: number) {
  return request<VoiceClipState>('/api/v1/voice-clips/' + encodeURIComponent(clipKey) + '/approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scriptRevision })
  });
}

export function voiceClipAudioUrl(clipKey: string, scriptRevision: number, generationRevision: number) {
  return '/api/v1/voice-clips/' + encodeURIComponent(clipKey)
    + '/audio?scriptRevision=' + scriptRevision + '&v=' + generationRevision;
}
