export type LockedScriptTimelineBlock = {
  sectionId: string;
  sectionTitle: string;
  shotKey: string;
  startSecond: number;
  endSecond: number;
  narration: string;
  voiceDirection: string;
};

export type LockedScriptImportPayload = {
  schemaVersion: 'mediaos.locked-script.v1';
  episodeNumber: string;
  title: string;
  targetDurationSeconds: number;
  source: string;
  status: 'FULLY_LOCKED';
  voicePerformance: string;
  timeline: LockedScriptTimelineBlock[];
};

export type LockedScriptImportResult = {
  locked: boolean;
  revision: number;
  timelineBlocks: number;
  nextRoute: string;
  message: string;
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

export async function importLockedScript(payload: LockedScriptImportPayload) {
  const response = await fetch('/api/v1/locked-script/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(await readError(response));
  return response.json() as Promise<LockedScriptImportResult>;
}
