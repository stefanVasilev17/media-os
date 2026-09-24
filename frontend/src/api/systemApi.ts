export type SystemVersionInfo = {
  product: string;
  version: string;
  release: string;
  commitSha: string;
  commitMessage: string;
  buildTime: string;
  startedAt: string;
  serverTime: string;
  deploymentId: string;
  environment: string;
  service: string;
  cachePolicy: string;
};

export async function loadSystemVersionInfo(): Promise<SystemVersionInfo> {
  const response = await fetch(`/api/v1/system/version?t=${Date.now()}`, {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache'
    }
  });

  if (!response.ok) {
    throw new Error('System version information is not available');
  }

  return response.json();
}
