export async function hardRefreshApplication(): Promise<never> {
  const refreshToken = Date.now().toString();

  if ('caches' in window) {
    const cacheNames = await window.caches.keys();
    await Promise.all(cacheNames.map(name => window.caches.delete(name)));
  }

  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(registration => registration.unregister()));
  }

  const current = new URL(window.location.href);
  current.searchParams.set('__media_os_refresh', refreshToken);

  try {
    await fetch(`${window.location.origin}/?__media_os_refresh=${refreshToken}`, {
      cache: 'reload',
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache'
      }
    });
  } catch {
    // Navigation below is the final refresh boundary even if the prefetch fails.
  }

  window.location.replace(current.toString());

  return new Promise<never>(() => undefined);
}
