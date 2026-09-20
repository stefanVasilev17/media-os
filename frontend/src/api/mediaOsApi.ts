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

export async function loadLiveMap(): Promise<LiveMapView> {
  const response = await fetch('/api/v1/live-map');
  if (!response.ok) {
    throw new Error('Live Map is not available');
  }

  return response.json();
}
