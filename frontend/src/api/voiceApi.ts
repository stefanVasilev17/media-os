export type VoiceShotState = {
  shotKey: string;
  title: string;
  startSecond: number;
  endSecond: number;
  narration: string;
  voiceDirection: string;
  recorded: boolean;
  recordedAt?: string | null;
  audioFileName?: string | null;
  alignment: Record<string, unknown>;
  aligned: boolean;
  alignedAt?: string | null;
  visualSyncSpec: Record<string, unknown>;
  visualSyncMarkdown?: string | null;
  visualSyncReady: boolean;
  visualSyncReadyAt?: string | null;
  remotionSynced: boolean;
  remotionSyncedAt?: string | null;
  voiceGenerated: boolean;
  voiceGeneratedAt?: string | null;
  voiceApproved: boolean;
  voiceApprovedAt?: string | null;
  generatedAudioContentType?: string | null;
  generatedAudioFileName?: string | null;
  generatedAlignment: Record<string, unknown>;
  generatedVoiceId?: string | null;
  generatedModelId?: string | null;
  generationRevision: number;
  remotionRenderId?: string | null;
  renderedGenerationRevision?: number | null;
  rendered: boolean;
  renderedAt?: string | null;
  updatedAt?: string | null;
};

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

export function loadVoiceShots(scriptRevision: number) {
  return request<VoiceShotState[]>('/api/v1/voice/shots?scriptRevision=' + scriptRevision);
}

export function saveVoiceShot(
  shotKey: string,
  payload: {
    scriptRevision: number;
    title: string;
    startSecond: number;
    endSecond: number;
    narration: string;
    voiceDirection: string;
    recorded: boolean;
  }
) {
  return request<VoiceShotState>('/api/v1/voice/shots/' + encodeURIComponent(shotKey), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export function alignVoiceShot(
  shotKey: string,
  payload: {
    scriptRevision: number;
    durationSeconds: number;
    audioFileName: string;
    anchors: Record<string, number>;
  }
) {
  return request<VoiceShotState>('/api/v1/voice/shots/' + encodeURIComponent(shotKey) + '/alignment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export function markVoiceShotRemotionSynced(shotKey: string, scriptRevision: number, synced: boolean) {
  return request<VoiceShotState>('/api/v1/voice/shots/' + encodeURIComponent(shotKey) + '/remotion-synced', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scriptRevision, synced })
  });
}


export type AlignmentProviderStatus = {
  provider: string;
  configured: boolean;
  mode: string;
  semanticAnchorCatalog: string;
};

export function loadAlignmentProvider() {
  return request<AlignmentProviderStatus>('/api/v1/voice/alignment-provider');
}

export function autoAlignVoiceShot(shotKey: string, scriptRevision: number, file: File) {
  const body = new FormData();
  body.append('file', file);
  return request<VoiceShotState>(
    '/api/v1/voice/shots/' + encodeURIComponent(shotKey) + '/auto-align?scriptRevision=' + scriptRevision,
    { method: 'POST', body }
  );
}


export type TtsProviderStatus = {
  provider: string;
  apiConfigured: boolean;
  voiceConfigured: boolean;
  configured: boolean;
  voiceId: string;
  modelId: string;
  outputFormat: string;
};

export function loadTtsProvider() {
  return request<TtsProviderStatus>('/api/v1/voice/tts-provider');
}

export function generateVoiceShot(
  shotKey: string,
  payload: {
    scriptRevision: number;
    previousText?: string;
    nextText?: string;
  }
) {
  return request<VoiceShotState>('/api/v1/voice/shots/' + encodeURIComponent(shotKey) + '/generate-voice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export function approveGeneratedVoiceShot(shotKey: string, scriptRevision: number) {
  return request<VoiceShotState>('/api/v1/voice/shots/' + encodeURIComponent(shotKey) + '/approve-generated-voice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scriptRevision })
  });
}

export function generatedVoiceAudioUrl(shotKey: string, scriptRevision: number, generationRevision: number) {
  return '/api/v1/voice/shots/' + encodeURIComponent(shotKey)
    + '/generated-audio?scriptRevision=' + scriptRevision
    + '&v=' + generationRevision;
}


export type RemotionRenderState = {
  renderId: string;
  compositionId: string;
  renderKey: string;
  engineVersion: string;
  profile: string;
  status: 'EMPTY' | 'QUEUED' | 'RENDERING' | 'READY' | 'FAILED';
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  durationMs: number;
  progress: number;
  sizeBytes?: number | null;
  error?: string | null;
  videoUrl?: string;
};

export function startRemotionRender(
  compositionId: string,
  inputProps: Record<string, unknown>,
  profile: 'FAST_PREVIEW' | 'REVIEW' = 'REVIEW'
) {
  return request<RemotionRenderState>('/api/v1/remotion/renders/compositions/' + encodeURIComponent(compositionId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile, inputProps })
  });
}

export function loadRemotionRender(renderId: string) {
  return request<RemotionRenderState>('/api/v1/remotion/renders/' + encodeURIComponent(renderId));
}

export function remotionRenderVideoUrl(renderId: string) {
  return '/api/v1/remotion/renders/' + encodeURIComponent(renderId) + '/video';
}
