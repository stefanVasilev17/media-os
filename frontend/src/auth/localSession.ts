export type DirectorSession = {
  authenticated: boolean;
  roles: string[];
  canApprove: boolean;
  canConfigurePaidAi: boolean;
};

let installed = false;
const loginExpiredEvent = 'mediaos-local-session-expired';

function csrfCookie() {
  const cookie = document.cookie.split('; ').find(part => part.startsWith('XSRF-TOKEN='));
  return cookie ? decodeURIComponent(cookie.substring('XSRF-TOKEN='.length)) : '';
}

export function installLocalSessionFetch() {
  if (installed) return;
  installed = true;
  const native = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const request = new Request(input, init);
    const url = new URL(request.url);
    if (url.origin !== window.location.origin || !url.pathname.startsWith('/api/v1/')) {
      return native(input, init);
    }
    const headers = new Headers(request.headers);
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method.toUpperCase())) {
      const csrf = csrfCookie();
      if (csrf && !headers.has('X-XSRF-TOKEN')) headers.set('X-XSRF-TOKEN', csrf);
    }
    const secured = new Request(request, { headers, credentials: 'same-origin' });
    const response = await native(secured);
    if (response.status === 401 && !url.pathname.startsWith('/api/v1/auth/')) {
      window.dispatchEvent(new Event(loginExpiredEvent));
    }
    return response;
  };
}

export function onSessionExpired(callback: () => void) {
  window.addEventListener(loginExpiredEvent, callback);
  return () => window.removeEventListener(loginExpiredEvent, callback);
}

export async function loadLocalSession(): Promise<DirectorSession | null> {
  const response = await fetch('/api/v1/security/session', { cache: 'no-store' });
  if (response.status === 401 || response.status === 403) return null;
  if (!response.ok) throw new Error('Could not check the Director session.');
  return response.json() as Promise<DirectorSession>;
}

export async function ensureLocalCsrf(): Promise<{ token: string; header: 'X-XSRF-TOKEN' }> {
  const response = await fetch('/api/v1/auth/csrf', {
    cache: 'no-store', credentials: 'same-origin'
  });
  if (!response.ok) throw new Error('Could not initialize secure Director CSRF (' + response.status + ').');
  const data = await response.json() as { token?: unknown; header?: unknown };
  if (data.header !== 'X-XSRF-TOKEN' || typeof data.token !== 'string' || !data.token) {
    throw new Error('Secure Director CSRF token is missing or invalid.');
  }
  return { token: data.token, header: data.header };
}

export async function loginLocal(username: string, password: string, totpCode: string, rememberDevice: boolean) {
  const response = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, totpCode, rememberDevice })
  });
  if (response.status === 401) throw new Error('Incorrect login or verification code.');
  if (!response.ok) throw new Error('Login unavailable. Please try again.');
  return response.json() as Promise<DirectorSession>;
}

export async function redeemDirectorClaim(token: string): Promise<DirectorSession> {
  const response = await fetch('/api/v1/auth/claim/redeem', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
    cache: 'no-store'
  });
  if (response.status === 401 || response.status === 403) {
    throw new Error('Activation link is invalid or expired.');
  }
  if (!response.ok) throw new Error('Account activation is unavailable.');
  return response.json() as Promise<DirectorSession>;
}

export async function logoutLocal() {
  const response = await fetch('/api/v1/auth/logout', { method: 'POST' });
  if (!response.ok) throw new Error('Could not sign out securely.');
}
