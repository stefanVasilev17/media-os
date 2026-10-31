# MediaOS — Opt-in 30-day remembered Director device (QA)

**Date:** 2026-10-31. **Environment:** QA only, Railway `MediaOS-Shot-QA-20261031`. **Production change:** none. **Status:** deployed and verified in live QA for web frontend and anonymous security boundary; authenticated browser-on-physical-iPhone acceptance still pending.

## Purpose

The Director requested that opening MediaOS on their personal iPhone should not require username/password/TOTP on every visit. Do not disable Spring Security, CSRF, TOTP, Director permissions, or make an indefinitely valid browser token. Device-local initial sign-in is unavoidable; a server-side integration cannot silently put a secure browser cookie into the Director's personal Safari instance.

## Implemented

- `LocalAuthGate.tsx` provides a checked-by-default **“Remember this device for 30 days”** checkbox, plus a personal-device warning.
- `localSession.ts` sends the boolean `rememberDevice` with the existing login POST, without storing a password, TOTP code or session identifier in localStorage.
- `LocalDirectorAuthController` uses the same password+TOTP verification and CSRF, changes the session ID, then either sets a 30-day server-side `SPRING_SESSION.MAX_INACTIVE_INTERVAL` **and** an absolute 30-day expiry attribute for opted-in sessions, or keeps the existing 1800-second inactivity interval when not opted in.
- `LocalDirectorSecurityConfiguration` emits a Secure, HttpOnly, SameSite=Lax cookie valid up to 30 days; an expired or revoked server session remains unusable regardless of the persistent cookie. A remembered session ends at its absolute 30-day deadline, even if actively used.
- `LocalDirectorSessionRevalidationFilter` invalidates expired remembered sessions and independently revokes inactive-account sessions. Logout invalidates the JDBC-backed session and previous browser cookie cannot authenticate.
- The new feature does not weaken worker identities, authorization allowlists, Director-approval gates, or EP001's locked media.

## Verification

- Isolated Railway CI service at commit `eb2fb80df93a6f61c4da584568c7f50bb7ceff98`: **frontend build/test PASS**, real PostgreSQL-backed `LocalDirectorHttpLifecycleTest`: **9 tests, 0 failures, 0 errors**, including new remembered session cookie/max-inactive/logout regression and unchanged 30-minute default expired-session regression. CI deployment `46824006-6865-4c3e-a633-6010dbf57e0d` reached SUCCESS.
- QA backend source pinned to exactly the tested commit, Railway deployment `fccaed9f-3fda-412e-bfbb-05ecef91c1ce` reached **SUCCESS** with successful Spring Boot startup and Flyway schema validation.
- One-time live public HTTPS smoke: login frontend bundle contains `Remember this device for 30 days`, `GET /` **200**, `GET /api/v1/auth/mode` **200**, anonymous `GET /api/v1/episodes` **401**, `QA_REMEMBER_POSTDEPLOY=PASS`. The Remotion CPU worker continued successful 204 empty queue polling during the rollout; no change to worker identity.
- The two disposable CI/HTTP probe Railway services were deleted with no volumes. Production backend, database and worker never redeployed.

## Account enrollment boundary — NOT YET COMPLETED

The QA database **already has one local bootstrap Director account** used in previous real authenticated automation tests. **This is not a newly enrolled private owner account**, and its bootstrap credentials are still operator-managed through QA Railway environment variables. Do not claim an owner username/password/TOTP was generated, delivered, or enrolled on an iPhone. The native `LocalDirectorBootstrap` refuses first-account bootstrap when any account already exists; it must not be re-enabled to create a second account.

Personal ownership requires a secure one-time enrollment or offline credential-rotation handoff to the Director, with a Director-chosen strong password and independently configured Authenticator (or a future audited passkey implementation). The existing `LocalDirectorOfflineCli` supports transactional recovery/rotation only with explicit **interactive operator** input, confirmed backup, halted writers and a protected terminal. Do not pass secrets via chat, logs or GitHub or use insecure unattended DB replacement.

Until personal enrollment, a Director with authorized QA Railway dashboard access can retrieve the pre-existing QA bootstrap credentials for a **single initial login** on their device and use the remembered-device checkbox, but should rotate and remove test bootstrap secrets immediately after completing supervised personal enrollment. A **real mobile Safari** sign-in/reopen test is still a release gate.

## Link

EP002 QA: https://qa-media-os-backend-qa.up.railway.app/#/episodes/95b8a4a2-728e-47fe-ad4c-a16748773588/prepare

**Release safety:** PR #110 remains Draft and production NO-GO. New QA browser convenience is not authorization for production deployment.
