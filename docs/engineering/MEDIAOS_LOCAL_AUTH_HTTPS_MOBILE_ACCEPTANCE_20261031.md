# Local Director Login — HTTPS / mobile acceptance checklist

**Status:** Test specification only. A real iPhone/Safari login was **not executed**, and Local Authentication remains OFF in the existing Railway QA preview. This file does not authorize provisioning a real Director or enabling paid AI.

## Isolated validation environment

Use a separately created, disposable QA application and PostgreSQL database, never the existing visual QA `media-os-preview-ep109` or production. Use an ephemeral QA-only Director account and authenticator seed, kept out of source control and logs. The environment must use HTTPS with a trusted certificate, a publicly unreachable or access-restricted API where possible, a strictly limited lifetime, no connection to EP001 or existing MediaOS content, and the following flags **disabled**: episode creation/writes, episode research, learning promotion, paid AI, auto repair, voice generation, video render.

## Browser verification (requires an actual mobile browser/device)

1. On **iPhone Safari** (test at both narrow and larger viewport), load the isolated HTTPS URL. Confirm no horizontal scrolling, username/password/TOTP input visibility, readable error messages, safe keyboard/safe-area behavior and a responsive Sign In button.
2. Open Developer Tools/Web Inspector from a trusted workstation. Confirm the `MEDIAOS_SESSION` cookie has **Secure, HttpOnly, SameSite=Lax** and the readable `XSRF-TOKEN` cookie has **Secure, SameSite=Strict**. Confirm neither password nor TOTP seed is in localStorage, the URL, logs or the frontend bundle.
3. GET `/api/v1/auth/mode` and `/api/v1/auth/csrf` before login. POST to login **without** CSRF => 403. Wrong password/TOTP => 401, repeated tries => 429. Valid password and current six-digit code => authenticated Director session.
4. Reload Safari and reopen the tab: the JDBC-backed session remains valid until inactivity timeout. The authenticated session endpoint should report Director capabilities. Access to an unreviewed mutation or GPU-worker `GET /work` returns 403.
5. POST a permitted **non-mutating test probe** using the same-origin CSRF header in a disposable QA fixture. Missing CSRF returns 403. Do **not** use real EP001 endpoints to prove mutation permissions.
6. Sign out, then try an existing browser tab and previous cookie: session endpoint must return 401. Deactivate the disposable account in the isolated test DB and verify any existing session loses access.
7. Wait over 30 minutes of inactivity and attempt an authenticated GET: return 401; page should reset to Login and clear any password/TOTP input. Verify the behavior when returning to Safari after backgrounding.
8. Repeat primary login, reload, logout, 401 and 403 checks on Android Chrome or desktop Chrome with mobile emulation. Confirm HTTPS certificate and no mixed content, CSRF bypass, or cross-origin credential leakage.
9. Test a second backend restart with the same isolated database: server-side JDBC sessions should survive restart where not expired, with no lost CSRF/session state.
10. Keep signed evidence (screenshots with **no credentials**, browser/version/viewport, status codes, test commit, certificate hostname, execution date); delete the disposable account, sessions, test database and application when approved.

## Existing automated evidence and remaining blocker

Spring MockMvc + PostgreSQL tests already validate CSRF, HttpOnly/Secure cookie attributes, login, logout, replay protection, Director capabilities, 30-minute session configuration and invalidation, 429 throttling and worker denial. These are **not** a replacement for real HTTPS transport, mobile Safari rendering, trusted reverse-proxy behavior, Java process restart and OS/browser backgrounding.

**Acceptance state: NOT RUN on a real device.** No automatic approval, production merge, account enrollment or release is permitted until these checks are signed off by the Director.
