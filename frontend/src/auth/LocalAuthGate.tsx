import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import {
  ensureLocalCsrf, installLocalSessionFetch, loadLocalSession,
  loginLocal, logoutLocal, redeemDirectorClaim, onSessionExpired, type DirectorSession
} from './localSession';
import '../styles/localDirectorAuth.css';

type State = 'checking' | 'disabled' | 'login' | 'authenticated' | 'unavailable';

export function LocalAuthGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>('checking');
  const [session, setSession] = useState<DirectorSession | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [rememberDevice, setRememberDevice] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    const expire = () => {
      setSession(null);
      setPassword('');
      setTotpCode('');
      setMessage('Your session has expired. Sign in again.');
      setState('login');
    };
    const off = onSessionExpired(expire);
    async function initialize() {
      try {
        const response = await fetch('/api/v1/auth/mode', { cache: 'no-store' });
        if (response.status === 404) {
          if (!cancelled) setState('disabled');
          return;
        }
        if (!response.ok) throw new Error('Authentication is not ready.');
        const mode = await response.json() as { localAuthentication: boolean };
        if (!mode.localAuthentication) throw new Error('Local authentication is disabled.');
        installLocalSessionFetch();
        await ensureLocalCsrf();
        const claimMatch = /^#\/claim\?token=([A-Za-z0-9_-]{43})$/.exec(window.location.hash);
        if (claimMatch) {
          try {
            const verified = await redeemDirectorClaim(claimMatch[1]);
            window.history.replaceState(null, '', window.location.pathname + '#/episodes/95b8a4a2-728e-47fe-ad4c-a16748773588/prepare');
            if (!cancelled) {
              setSession(verified);
              setState('authenticated');
              setMessage('');
            }
            return;
          } catch {
            window.history.replaceState(null, '', window.location.pathname + '#/');
            if (!cancelled) {
              setMessage('Activation link is invalid, expired, or already used.');
              setState('login');
            }
            return;
          }
        }
        const current = await loadLocalSession();
        if (cancelled) return;
        setSession(current);
        setState(current ? 'authenticated' : 'login');
      } catch {
        if (!cancelled) setState('unavailable');
      }
    }
    void initialize();
    return () => { cancelled = true; off(); };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage('');
    try {
      const authenticated = await loginLocal(username.trim(), password, totpCode, rememberDevice);
      setSession(authenticated);
      setPassword('');
      setTotpCode('');
      setState('authenticated');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Login failed.');
      setPassword('');
      setTotpCode('');
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    if (busy) return;
    setBusy(true);
    try {
      await logoutLocal();
      setSession(null);
      setPassword('');
      setTotpCode('');
      await ensureLocalCsrf();
      setState('login');
      setMessage('');
    } catch {
      setMessage('Could not sign out. Please retry.');
    } finally {
      setBusy(false);
    }
  }

  if (state === 'disabled') return <>{children}</>;
  if (state === 'authenticated' && session) {
    return <>
      <button className="local-director-signout" type="button" onClick={() => void signOut()}>
        Sign out
      </button>
      {children}
    </>;
  }

  return <main className="local-director-screen">
    <section className="local-director-card" aria-live="polite">
      <div className="local-director-eyebrow">MEDIAOS / DIRECTOR</div>
      <h1>{state === 'checking' ? 'Checking session' : state === 'unavailable' ? 'Login unavailable' : 'Director Login'}</h1>
      {state === 'checking' && <p>Checking your secure session…</p>}
      {state === 'unavailable' && <p>Local authentication could not be verified. No production actions are available.</p>}
      {state === 'login' && <>
        <p>Sign in with your Director password and the six-digit code from your authenticator.</p>
        <form onSubmit={event => void submit(event)}>
          <label htmlFor="local-username">Director username</label>
          <input id="local-username" autoComplete="username" value={username}
            onChange={event => setUsername(event.target.value)} required maxLength={80} />
          <label htmlFor="local-password">Password</label>
          <input id="local-password" type="password" autoComplete="current-password"
            value={password} onChange={event => setPassword(event.target.value)} required />
          <label htmlFor="local-otp">Authenticator code</label>
          <input id="local-otp" inputMode="numeric" pattern="[0-9]{6}"
            autoComplete="one-time-code" maxLength={6} value={totpCode}
            onChange={event => setTotpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            required />
          <label className="local-director-remember" htmlFor="remember-device">
            <input id="remember-device" type="checkbox" checked={rememberDevice}
              onChange={event => setRememberDevice(event.target.checked)} />
            <span>Remember this device for 30 days</span>
          </label>
          <p className="local-director-remember-note">For your private device only. You can sign out at any time.</p>
          {message && <p className="local-director-error" role="alert">{message}</p>}
          <button type="submit" disabled={busy}>{busy ? 'Checking…' : 'Sign in securely'}</button>
        </form>
      </>}
    </section>
  </main>;
}
