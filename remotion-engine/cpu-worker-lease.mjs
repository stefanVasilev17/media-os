const TOKEN_FORMAT = /^[A-Za-z0-9_-]{43,128}$/;
const FIFTEEN_MINUTES = 15 * 60_000;

export function createCpuWorkerLeaseClient({
  backendUrl, workerId, workerKey, transport, fetchImpl = fetch,
  clock = () => Date.now(), enabled = false,
}) {
  let refreshAt = 0;
  let inFlight = null;

  async function renew() {
    if (!enabled) return null;
    const response = await fetchImpl(`${backendUrl}/api/v1/worker/remotion/cpu/lease`, {
      method: 'POST',
      headers: {
        'X-Media-OS-Worker-Key': workerKey,
        'X-Media-OS-Worker': workerId,
        'X-Worker-Id': workerId,
      },
      cache: 'no-store',
    });
    if (response.status === 404) {
      refreshAt = clock() + 10_000;
      return null;
    }
    if (!response.ok) {
      refreshAt = clock() + 10_000;
      throw new Error(`CPU scoped credential renewal rejected (${response.status})`);
    }
    const lease = await response.json();
    const expiry = Date.parse(lease?.expiresAt);
    if (!TOKEN_FORMAT.test(lease?.token || '')
        || !Number.isFinite(expiry)
        || expiry - clock() < FIFTEEN_MINUTES) {
      throw new Error('CPU scoped credential lease is invalid or expires too soon');
    }
    if (!transport.installToken(lease.token)) {
      throw new Error('CPU scoped credential could not be installed');
    }
    refreshAt = Math.max(clock() + 30_000, expiry - FIFTEEN_MINUTES);
    return lease.token;
  }

  async function refresh(force = false) {
    if (!enabled || (!force && clock() < refreshAt)) return null;
    if (inFlight) return inFlight;
    inFlight = renew().finally(() => { inFlight = null; });
    return inFlight;
  }

  return {refresh};
}
