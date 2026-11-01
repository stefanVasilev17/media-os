export function createWorkerTokenTransport(primaryToken, rotatedToken, nextTokenProvider = null) {
  let activeToken = String(primaryToken || '').trim();
  const stagedToken = String(rotatedToken || '').trim();

  return {
    scopedHeaders() {
      return activeToken
        ? {'X-MediaOS-Workload-Token': activeToken}
        : {};
    },

    async request(url, options, fetchImpl = fetch) {
      const first = await fetchImpl(url, options);
      if (first.status !== 401 || !activeToken
          || options?.headers?.['X-MediaOS-Workload-Token'] !== activeToken) {
        return first;
      }
      const provided = typeof nextTokenProvider === 'function'
        ? String(await nextTokenProvider() || '').trim()
        : '';
      const nextToken = provided || stagedToken;
      if (!nextToken || nextToken === activeToken
         ) {
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
