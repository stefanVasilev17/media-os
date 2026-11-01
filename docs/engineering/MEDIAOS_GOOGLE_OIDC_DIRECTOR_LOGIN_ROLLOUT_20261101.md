# MediaOS — Google Sign-In (OIDC) rollout

**State:** QA implementation candidate only. Do not deploy to `main` until a real browser redirect/login, negative-account tests, sessions and worker paths are verified. EP001 and all Director LOCKs remain immutable.

## User experience

The existing login gate displays **Continue with Google** when `MEDIAOS_GOOGLE_AUTH_ENABLED=true`. The browser goes to Spring Security `/oauth2/authorization/google` and Google returns through `/login/oauth2/code/google`. Spring completes OIDC authorization-code exchange and stores an authenticated server-side JDBC session (secure, HttpOnly, SameSite=Lax session cookie). The frontend reuses the CSRF cookie/header for all state-changing MediaOS API requests. Users do **not** enter a MediaOS password/TOTP seed, and no Google password is stored by MediaOS.

Only `openid` and `email` scopes are requested; do not grant Gmail, Drive or profile access. Director access is granted **only** if Google's validated ID token has Google issuer, matching OAuth client audience, verified email, exact allowlisted email, and (when configured) exact immutable Google `sub`. An unknown account gets no session and no Director privileges. The `sub` value is the preferred long-lived identifier; pin it after confirming the first authorized QA login. Do not copy actual Google ID tokens into chat or source.

## OAuth client setup in Google Auth Platform

Create a Google Cloud project / OAuth consent branding and select **Web application** OAuth client. Use distinct clients for QA and production. For a personal Google account, if the external app is in Testing, add that account as a test user. Register **exactly** these authorized redirect URIs (no trailing slash):

- QA: `https://qa-media-os-backend-qa.up.railway.app/login/oauth2/code/google`
- Production: `https://media-os-backend-production.up.railway.app/login/oauth2/code/google`

Google redirect URIs must match exactly; do not include hash routes or query parameters. Spring Security uses `{baseUrl}/login/oauth2/code/{registrationId}` with `registrationId=google`. Railway `server.forward-headers-strategy=framework` is already configured and must preserve HTTPS host and port on the callback.

## Railway backend environment variables (names, no secrets)

- `MEDIAOS_GOOGLE_AUTH_ENABLED=true`
- `MEDIAOS_GOOGLE_AUTH_CLIENT_ID` = OAuth Web client ID
- `MEDIAOS_GOOGLE_AUTH_CLIENT_SECRET` = confidential OAuth Web client secret, never publish
- `MEDIAOS_GOOGLE_AUTH_ALLOWED_EMAIL` = exact approved Director Google email
- `MEDIAOS_GOOGLE_AUTH_ALLOWED_SUBJECT` = optional only for first QA enrollment; then permanently pin Google's stable `sub`

For this mode, BOTH `MEDIAOS_LOCAL_AUTH_ENABLED=false` and `MEDIAOS_DIRECTOR_SECURITY_ENABLED=false` (or unset). `LocalAuthenticationModeGuard` refuses simultaneous login modes. Do not run local bootstrap, TOTP, claim invites or password provisioning. No new schema migration is required because Spring JDBC session schema already exists.

**Important:** Never turn Google mode on without real, valid client credentials and an allowlisted account — app startup is intentionally fail-closed on missing configuration. A build-only CI with Google mode disabled proves code compiles but **does not** test a real Google login.

## Required QA acceptance

1. Configured QA app returns `GET /api/v1/auth/mode` with `googleAuthentication=true`, `GET /api/v1/auth/csrf` with a secure CSRF cookie.
2. Anonymous `GET /api/v1/security/session` and `GET /api/v1/episodes`: 401. Worker endpoints remain blocked (without properly scoped worker credentials).
3. Click Continue with Google; verify Google actually shows the correct account and redirect callback returns to MediaOS using an HTTPS cookie.
4. Exact approved email (and subject when pinned) can view EP001/EP002 without modifying their LOCKs. Another real Google account is refused, even if its email is verified.
5. POST without CSRF returns 403; POST with valid CSRF and Director session passes the security boundary, subject to existing write gates. Do not trigger paid generation.
6. Logout invalidates server-side session; replay old cookie gets 401. Repeat in Safari on iPhone and desktop Chrome. Verify cookie expiry and mobile session restoration.
7. Confirm production rollout order: verified backup/recovery, identity config stored securely in Railway, exact release hash, inactive writes and worker rotation, staged/tested release, Director GO before deployment.

## Recovery and rollback

- Disable Google mode and deploy a known-good application/identity configuration only under an approved release rollback. Never disable all authentication modes on the new backend, because `/api/v1/**` intentionally denies all calls if no identity is active.
- Existing JDBC session rows survive new releases, but the Google identity allowlist is rechecked on authenticated requests and removed accounts lose access.
- The previously retained production S3 snapshot and the V85→V105 rehearsal are unrelated to OAuth secrets. Keep OAuth client credentials in Railway/Google Cloud only and rotate via Google Cloud if exposed.

Reference: https://developers.google.com/identity/openid-connect/openid-connect and https://docs.spring.io/spring-security/reference/servlet/oauth2/login/core.html
