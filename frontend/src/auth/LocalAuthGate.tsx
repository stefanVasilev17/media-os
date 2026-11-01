import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import {
  ensureLocalCsrf, installLocalSessionFetch, loadLocalSession,
  loginLocal, logoutLocal, redeemDirectorClaim, onSessionExpired, type DirectorSession
} from './localSession';
import '../styles/localDirectorAuth.css';

type State = 'checking' | 'disabled' | 'login' | 'google-login' | 'authenticated' | 'unavailable';

export function LocalAuthGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>('checking');
  const modeRef = useRef<'local' | 'google'>('local');
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
      setState(modeRef.current === 'google' ? 'google-login' : 'login');
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
        const mode = await response.json() as {
          localAuthentication: boolean;
          googleAuthentication?: boolean;
        };
        const useGoogle = mode.googleAuthentication === true;
        if (!mode.localAuthentication && !useGoogle) {
          throw new Error('Director authentication is not available.');
        }
        modeRef.current = useGoogle ? 'google' : 'local';
        installLocalSessionFetch();
        await ensureLocalCsrf();
        if (useGoogle) {
          const current = await loadLocalSession();
          if (cancelled) return;
          if (new URLSearchParams(window.location.search).get('googleAuth') === 'denied') {
            window.history.replaceState(null, '', window.location.pathname + window.location.hash);
            setMessage('This Google account is not authorized for MediaOS.');
          }
          setSession(current);
          setState(current ? 'authenticated' : 'google-login');
          return;
        }
        const claimMatch = /^#\/claim\?token=([A-Za-z0-9_-]{43})$/.exec(window.location.hash);
        if (claimMatch) {
          const destination = '#/episodes/95b8a4a2-728e-47fe-ad4c-a16748773588/prepare';
          try {
            const existing = await loadLocalSession();
            if (existing?.authenticated) {
              window.history.replaceState(null, '', window.location.pathname + destination);
              if (!cancelled) {
                setSession(existing);
                setState('authenticated');
                setMessage('');
              }
              return;
            }
            const verified = await redeemDirectorClaim(claimMatch[1]);
            window.history.replaceState(null, '', window.location.pathname + destination);
            if (!cancelled) {
              setSession(verified);
              setState('authenticated');
              setMessage('');
            }
            return;
          } catch {
            window.history.replaceState(null, '', window.location.pathname + '#/');
            const recovery = await loadLocalSession().catch(() => null);
            if (!cancelled) {
              if (recovery?.authenticated) {
                setSession(recovery);
                setState('authenticated');
                setMessage('');
              } else {
                setMessage('This one-time link has already been used or is no longer valid. Open MediaOS using your normal bookmark, or request a new private sign-in link.');
                setState('login');
              }
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
      setState(modeRef.current === 'google' ? 'google-login' : 'login');
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
      {state === 'unavailable' && <p>Director authentication could not be verified. No production actions are available.</p>}
      {state === 'google-login' && <>
        <p>Use your approved Google account to access the Director workspace. No separate MediaOS password is required.</p>
        {message && <p className="local-director-error" role="alert">{message}</p>}
        <button type="button" onClick={() => window.location.assign('/oauth2/authorization/google')}>Continue with Google</button>
      </>}
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
