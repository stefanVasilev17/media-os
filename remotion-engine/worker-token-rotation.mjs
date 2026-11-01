export function createWorkerTokenTransport(primaryToken, rotatedToken, nextTokenProvider = null) {
  let activeToken = String(primaryToken || '').trim();
  const stagedToken = String(rotatedToken || '').trim();

  const valid = token => /^[A-Za-z0-9_-]{43,128}$/.test(token);

  async function nextCredential() {
    if (typeof nextTokenProvider !== 'function') return stagedToken;
    try {
      return String(await nextTokenProvider() || '').trim() || stagedToken;
    } catch {
      return stagedToken;
    }
  }

  return {
    installToken(token) {
      if (!valid(token)) return false;
      activeToken = token;
      return true;
    },

    scopedHeaders() {
      return activeToken ? {'X-MediaOS-Workload-Token': activeToken} : {};
    },

    async request(url, options, fetchImpl = fetch) {
      const sentToken = options?.headers?.['X-MediaOS-Workload-Token'];
      const first = await fetchImpl(url, options);
      if (first.status !== 401 || !activeToken || sentToken !== activeToken) {
        return first;
      }

      const nextToken = await nextCredential();
      if (!nextToken || nextToken === activeToken || !valid(nextToken)) {
        return first;
      }

      const second = await fetchImpl(url, {
        ...options,
        headers: {...options.headers, 'X-MediaOS-Workload-Token': nextToken},
      });
      if (second.ok) activeToken = nextToken;
      return second;
    },
  };
}
