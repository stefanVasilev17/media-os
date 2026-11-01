export function createWorkerTokenTransport(primaryToken, rotatedToken) {
  let activeToken = String(primaryToken || '').trim();
  const nextToken = String(rotatedToken || '').trim();

  return {
    scopedHeaders() {
      return activeToken
        ? {'X-MediaOS-Workload-Token': activeToken}
        : {};
    },

    async request(url, options, fetchImpl = fetch) {
      const first = await fetchImpl(url, options);
      if (first.status !== 401 || !activeToken || !nextToken
          || nextToken === activeToken
          || options?.headers?.['X-MediaOS-Workload-Token'] !== activeToken) {
        return first;
      }

      const retryOptions = {
        ...options,
        headers: {
          ...options.headers,
          'X-MediaOS-Workload-Token': nextToken,
        },
      };
      const second = await fetchImpl(url, retryOptions);
      if (second.ok) activeToken = nextToken;
      return second;
    },
  };
}
