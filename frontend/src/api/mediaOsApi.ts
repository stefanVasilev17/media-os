export type LiveMapTask = {
  id: string;
  parentTaskId: string | null;
  name: string;
  type: string;
  status: string;
  sequence: number;
  agentRuns: Array<{ id: string; agentKey: string; status: string }>;
  approvals: Array<{ id: string; status: string; comment: string }>;
  artifacts: Array<{ id: string; type: string; name: string; uri: string; status: string }>;
};

export type LiveMapJob = {
  id: string;
  name: string;
  type: string;
  status: string;
  progress: number;
  createdAt: string;
  updatedAt: string;
  tasks: LiveMapTask[];
};

export type LiveMapView = {
  project: {
    id: string;
    name: string;
    slug: string;
    status: string;
  };
  jobs: LiveMapJob[];
  events: Array<{
    id: string;
    type: string;
    message: string;
    createdAt: string;
  }>;
};

export type PendingSplineApproval = {
  productionJobId: string;
  approvalId: string;
  name: string;
  taskType: string;
  target: string;
  instructions: string;
  permissions: string[];
  protectedObjects: string[];
  payload: Record<string, unknown>;
  createdAt: string;
};

export async function loadLiveMap(): Promise<LiveMapView> {
  const response = await fetch('/api/v1/live-map');
  if (!response.ok) {
    throw new Error('Live Map is not available');
  }

  return response.json();
}

export async function loadPendingSplineApprovals(): Promise<PendingSplineApproval[]> {
  const response = await fetch('/api/v1/spline/jobs/pending-approvals');
  if (!response.ok) {
    throw new Error('Spline approvals are not available');
  }

  return response.json();
}

export async function createSplineEditProof(): Promise<void> {
  const response = await fetch('/api/v1/spline/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Spline Agent edit proof',
      taskType: 'EDIT_EXISTING_TEST_OBJECT',
      target: 'FOCUSED_SPLINE_3D_TAB',
      instructions:
        'Find the existing object named MEDIA_OS_CONNECTION_TEST. Do not create a replacement if it is missing. Edit only this object: set its position to (4800, 0, 0), set its size to 50 x 50 x 50, and keep it clearly cyan. Do not modify any other object. Verify the final object name, position, size, and visible cyan material through Spline MCP before reporting success.',
      permissions: ['READ_SCENE', 'EDIT_TEST_OBJECT'],
      protectedObjects: ['ALL_OBJECTS_EXCEPT_MEDIA_OS_CONNECTION_TEST'],
      payload: {
        expectedObject: 'MEDIA_OS_CONNECTION_TEST',
        expectedPosition: [4800, 0, 0],
        expectedSize: [50, 50, 50],
        safeSandboxRequired: true
      }
    })
  });

  if (!response.ok) {
    throw new Error('Could not create Spline edit proof');
  }
}

export async function decideSplineJob(
  productionJobId: string,
  decision: 'APPROVE' | 'REQUEST_CHANGES',
  comment?: string
): Promise<void> {
  const response = await fetch(`/api/v1/spline/jobs/${productionJobId}/decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision, comment: comment ?? null })
  });

  if (!response.ok) {
    throw new Error('Could not save Spline approval decision');
  }
}


export type SplineObjectEditDraft = {
  objectName: string;
  position?: [number, number, number];
  size?: [number, number, number];
  color?: string;
};

export type LatestSplineJob = {
  id?: string;
  taskType?: string;
  target?: string;
  status: string;
  workerId?: string | null;
  error?: string | null;
  createdAt?: string;
  claimedAt?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  result?: {
    output?: string;
    workerId?: string;
    metrics?: {
      tokenCount?: number | null;
      splineMcpCalls?: number;
      durationMs?: number;
      executionProfile?: string;
      recipeCache?: 'HIT' | 'MISS_LEARN' | string;
      referenceReadSkipped?: boolean;
      recipeChars?: number;
    };
  };
};

export async function createSplineObjectEdit(draft: SplineObjectEditDraft): Promise<void> {
  const response = await fetch('/api/v1/spline/jobs/object-edit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(draft)
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Could not create controlled Spline object edit');
  }
}

export async function loadLatestSplineJob(): Promise<LatestSplineJob> {
  const response = await fetch('/api/v1/spline/jobs/latest');
  if (!response.ok) {
    throw new Error('Latest Spline execution is not available');
  }

  return response.json();
}


export type SplineCatalogNode = {
  name: string;
  type: string;
  path: string;
  loaded?: boolean;
  children?: SplineCatalogNode[];
};

export type SplineSceneCatalog = {
  status: 'EMPTY' | 'READY';
  id?: string;
  sceneName?: string;
  objectCount?: number;
  rootSectionCount?: number;
  workerId?: string;
  syncedAt?: string;
  catalog?: {
    sceneName: string;
    sections: SplineCatalogNode[];
  };
};

export async function loadSplineSceneCatalog(): Promise<SplineSceneCatalog> {
  const response = await fetch('/api/v1/spline/catalog/latest');
  if (!response.ok) {
    throw new Error('Spline scene catalog is not available');
  }
  return response.json();
}

export async function refreshSplineSceneCatalog(): Promise<void> {
  const response = await fetch('/api/v1/spline/catalog/refresh', { method: 'POST' });
  if (!response.ok) {
    throw new Error('Could not queue Spline scene catalog refresh');
  }
}


export async function refreshSplineCatalogSection(
  sectionPath: string,
  sectionName: string
): Promise<void> {
  const response = await fetch('/api/v1/spline/catalog/section', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sectionPath, sectionName })
  });

  if (!response.ok) {
    throw new Error('Could not queue Spline section refresh');
  }
}


export type RunnerStatus = {
  online: boolean;
  workerId?: string;
  hostname?: string;
  status: string;
  runnerVersion?: string;
  workerVersion?: string;
  productionCommit?: string;
  lastError?: string | null;
  lastSeen?: string;
};

export async function loadRunnerStatus(): Promise<RunnerStatus> {
  const response = await fetch('/api/v1/runner/status');
  if (!response.ok) {
    throw new Error('Runner status is not available');
  }
  return response.json();
}


export type SplineSnapshotMeta = {
  status: 'EMPTY' | 'READY';
  id?: string;
  workerId?: string;
  width?: number;
  height?: number;
  capturedAt?: string;
};

export type SplineChatMessage = {
  id: string;
  role: 'USER' | 'SYSTEM';
  content: string;
  createdAt: string;
  productionJobId?: string | null;
  status?: string | null;
  error?: string | null;
};

export async function loadSplineSnapshotMeta(): Promise<SplineSnapshotMeta> {
  const response = await fetch('/api/v1/spline/snapshot/meta', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Spline snapshot metadata is not available');
  }
  return response.json();
}

export function splineSnapshotImageUrl(snapshotId?: string): string {
  const suffix = snapshotId
    ? `?id=${encodeURIComponent(snapshotId)}`
    : `?t=${Date.now()}`;
  return `/api/v1/spline/snapshot/image${suffix}`;
}

export type SplineSnapshotRequest = {
  productionJobId?: string;
  status?: string;
};

export async function requestSplineSnapshot(): Promise<SplineSnapshotRequest> {
  const response = await fetch('/api/v1/spline/snapshot/refresh', { method: 'POST' });
  if (!response.ok) {
    throw new Error('Could not request Spline snapshot');
  }
  return response.json();
}

export async function loadSplineSnapshotJob(jobId: string): Promise<LatestSplineJob> {
  const response = await fetch('/api/v1/spline/jobs/latest', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Spline snapshot status is not available');
  }
  const latest = await response.json() as LatestSplineJob;
  return latest.id === jobId ? latest : { status: 'UNKNOWN' };
}

export async function loadSplineChat(): Promise<SplineChatMessage[]> {
  const response = await fetch('/api/v1/spline/jobs/chat', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Spline Agent chat is not available');
  }
  return response.json();
}

export async function createSplineChatCommand(message: string): Promise<void> {
  const response = await fetch('/api/v1/spline/jobs/chat-command', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || 'Could not prepare Spline command');
  }
}
