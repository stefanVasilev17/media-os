# MediaOS Local Director Authentication — Production MVP

**Status:** Draft implementation on PR #110. **Do not enable on live QA or production yet.**
**Objective:** No external OIDC provider, no subscription, no separate authentication service. Reuse Spring Security and the existing PostgreSQL. EP001 and all LOCKED records are immutable.

## Architecture

- Single locally provisioned Director, no self-registration or public sign-up.
- Argon2id password hashes, encrypted Base32 TOTP secret (AES-256-GCM), short six-digit authenticator code.
- Five failed attempts lock login for 15 minutes. Verified TOTP time step is stored and cannot be reused.
- Java `UsernamePasswordAuthenticationToken` with serializable `LocalDirectorPrincipal`, session stored in PostgreSQL via Spring Session JDBC (30-minute inactivity).
- Session cookie `MEDIAOS_SESSION` is HttpOnly, Secure, SameSite=Lax. A separate XSRF-TOKEN cookie is JS-readable only for CSRF protection, SameSite=Strict; all browser mutations send `X-XSRF-TOKEN`.
- Feature disabled by default, with explicit one-time bootstrap only. No production credentials, tokens, MFA seeds, encryption keys or recovery codes in GitHub.
- Director approval and paid AI authorization continue to use `DirectorIdentity.requireDirector()`; the subject for local sessions is the persistent account UUID and issuer is `urn:mediaos:local`.
- Active account checked on authenticated requests; deactivation invalidates subsequent sessions. All unreviewed API writes and worker callbacks remain denied.

## Environment flags (only in an approved isolated environment)

```text
MEDIAOS_LOCAL_AUTH_ENABLED=true
MEDIAOS_DIRECTOR_SECURITY_ENABLED=false
MEDIAOS_LOCAL_AUTH_TOTP_ENCRYPTION_KEY=<BASE64_ENCODED_32_RANDOM_BYTES>
```

The encryption key must be created from a cryptographically secure source, stored in the environment secret store and backed up securely. Losing it prevents authenticating with existing TOTP secrets. Never put the key, username/password or TOTP seed in this document, code, screenshots, chats or logs.

### One-time account bootstrap (never enable automatically)

With an **empty** `mediaos_local_director` table and after written QA change approval only:

```text
MEDIAOS_LOCAL_AUTH_BOOTSTRAP_ENABLED=true
MEDIAOS_LOCAL_AUTH_BOOTSTRAP_USERNAME=<chosen-unique-director-name>
MEDIAOS_LOCAL_AUTH_BOOTSTRAP_PASSWORD=<unique-strong-password-at-least-16-characters>
MEDIAOS_LOCAL_AUTH_BOOTSTRAP_TOTP_SECRET=<32-or-more-Base32-characters>
```

On successful startup the app creates the Director once, storing only an Argon2id hash and encrypted TOTP secret. The bootstrap runner fails closed if any Director already exists. **Immediately disable bootstrap and remove its username/password/TOTP variables from the deployment after provisioning**. Use a proper authenticator app to scan a locally assembled `otpauth://totp/` URI for the seed (do not paste the seed into chat). Save offline encrypted recovery instructions and backup codes before the login is enabled for real use.

Keep `mediaos.episodes.creation-enabled`, `mediaos.episodes.writes-enabled`, `mediaos.episode-research.enabled`, `mediaos.learning.promotion-enabled`, Paid AI and Auto Repair **false** until the new account login is tested and authorized.

## API lifecycle

- `GET /api/v1/auth/mode` -> `localAuthentication: true`; no data if local mode is off.
- `GET /api/v1/auth/csrf` -> obtains XSRF cookie/token; required before login.
- `POST /api/v1/auth/login` with username, password and six-digit TOTP, plus CSRF header -> persistent server-side session.
- `GET /api/v1/security/session` -> authenticated roles and capabilities, no raw user identifier.
- `POST /api/v1/auth/logout` with CSRF -> session invalidation.
- Other endpoints use existing strict explicit Director allowlist; workers remain blocked.

## Security release blockers

1. Java Maven + PostgreSQL V1-V99 verification, frontend TypeScript/Vitest, and HTTP integration tests with local session cookie + CSRF. Compile/test-only is not full acceptance.
2. Validate repeated login attempts, lockout, TOTP replay and a revoked account; ensure logs never contain passwords or seeds.
3. Prove the actual 30-minute JDBC session lifecycle, cookie flags and persistence across restart/redeploy in **separate disposable** QA.
4. Implement and rehearse Director account recovery/key rotation procedure without a paid provider. Avoid a public account-reset endpoint.
5. Review same-origin policy, login IP rate limiting, brute-force monitoring and browser security headers. Require HTTPS for any enabled environment.
6. Recheck all privileged legacy endpoints and worker identities before production. No production/EP001 mutations.
7. Require a separate Director go/no-go to merge, deploy and enable writes.

No real login, OIDC connection, QA write flags, paid AI generation or production deployment has been activated merely by committing the code.


## Verified build evidence — 2026-10-31

- Temporary **build-only** Railway QA service `mediaos-local-auth-ci-pr110-temp` used pinned commit `78590782dc3829c94cbdf7c689e749e1f7ea5df3` in deployment `b8caff10-dc29-49c2-980c-51fa0cc00ac3`.
- **Java 21 Maven + disposable PostgreSQL 16:** 191 tests passed, 0 failures, 0 errors, 0 skipped. Build SUCCESS, including V1–V99 migration checks and local TOTP/password integration.
- **Frontend:** TypeScript/Vite build SUCCESS and 12 Vitest tests passed.
- Initial local auth compilation and test failures were corrected in the draft branch, including preserving the exact reviewed API write allowlist and fixing mismatched test constructor calls.
- Test evidence does **not** imply live login/session/cookie/CSRF HTTP integration has passed: this remains a release blocker. No user account was provisioned in an existing database, no production deployment and no feature flag activation occurred.


## Real HTTP lifecycle verification — 2026-10-31

**Verified commit:** `89d091f12a4c6a59a91d4b7503408fd2eb3cf558`.
**Isolated build:** `mediaos-local-http-ci-pr110-temp`, deployment `ee135e4e-fec5-4b82-a15d-5c8fe23890aa` in the isolated Railway QA project. No domain, environment secrets, connection to QA or production PostgreSQL, or AI generation. PostgreSQL 16 ran only inside the build process.

- Java 21 Maven **194 tests, 0 failures, 0 errors, 0 skipped; Docker build SUCCESS**.
- Node 22 TypeScript/Vite and frontend Vitest also completed successfully.
- New `LocalDirectorHttpLifecycleTest` started an isolated Spring web/security context against local PostgreSQL and passed all three real MockMvc HTTP tests.
- Verified unauthenticated `GET /api/v1/security/session` returns **401**; login without CSRF returns **403**; wrong password and wrong TOTP return **401**.
- Verified correct password + TOTP issues a Secure and HttpOnly PostgreSQL session cookie, authenticated session has Director capabilities, authorized Director API path works with CSRF, missing CSRF yields **403**, and internal worker callbacks remain **403**.
- Verified Logout makes the previous session unusable; used TOTP step cannot be replayed; deactivated Director account loses authenticated access.
- Issues discovered and fixed during this test cycle: missing `@Autowired` on the production LocalDirectorLoginService constructor, `@Transactional` CGLIB proxying of final classes, JPA auto-configuration in the JDBC-only test context, and overly long Spring Session principal naming (now stable UUID).
- **Still required**: explicit time-expired session regression (the 30-minute timeout is configured but not separately tested), login rate limits, browser-on-iPhone UI and cookie behavior, secret/key recovery and rotation procedures, security review of all privileged routes and workload identities, and separate Director approval before any environment flag is enabled.
- No existing database was written to; no account was bootstrapped outside the disposable PostgreSQL database. Existing PR #109 visual QA and production remain unchanged. PR #110 remains Draft.


## Session expiry and persistent login throttling — verified 2026-10-31

**Build proof:** isolated Railway QA build-only service `mediaos-local-session-ci-pr110-temp`, deployment `91c31940-0645-4a1a-b7ed-1eb5a1bcb34d`, tested commit `e51bb8804e3d77da5b9f73df75b6c482b7e17660`. Docker build completed successfully on Java 21 and a disposable PostgreSQL 16 database. Frontend TypeScript/Vitest completed successfully.

- **196 Java tests passed, 0 failures, 0 errors, 0 skipped.** Previous 194 tests remain green.
- Added `V100__local_director_login_throttle.sql`: atomic PostgreSQL counters, SHA-256 hashed bucket identifiers, a rolling 15-minute window, max 12 attempts per normalized username and max 100 requests globally; exceeding a limit returns HTTP 429.
- Login throttle also applies to nonexistent accounts; counters work across multiple Java instances and are not reset by process restart. Existing per-account lock after five failures remains independently active.
- **Proxy correction:** An attempted socket-peer filter was rejected when an integration test showed forwarded-header processing could interfere with the expected address. The filter was removed. Login throttling relies on account and global database buckets, and therefore does **not** trust `X-Forwarded-For`, `Forwarded` or `getRemoteAddr()`. The global limit can temporarily deny login for legitimate users after sustained attack traffic; this is an explicit operational tradeoff for the single-Director MVP.
- Added a real HTTP regression proving the `SPRING_SESSION.MAX_INACTIVE_INTERVAL` for Director is **1800 seconds** and a forcibly expired persisted session no longer authenticates.
- Added a real HTTP regression proving 12 failed attempts against an **unknown username** return 401, with the next attempt rejected with 429. The account name is isolated per test.
- The JDBC table needs a retention policy (e.g., remove stale buckets older than 48 hours) before a long-lived release; no scheduled deletion was enabled during this security check.
- No external identity API, no payments, no deployment to the existing QA app or production, no real user credentials, no EP001 changes.

## Local Director account recovery and key custody — runbook (not yet rehearsed)

There is intentionally **no public password-reset or MFA-reset endpoint**.

1. Before enabling local login for a real Director, store the strong password and a separate offline copy of the TOTP enrollment seed inside a secure password manager. Keep a second secure backup of the 32-byte `MEDIAOS_LOCAL_AUTH_TOTP_ENCRYPTION_KEY` and protected database backup/recovery procedures. Do **not** commit any of these values or paste them into chat, support messages or screenshots.
2. If the password is lost but the offline encrypted backup contains the original credential, restore from the password manager; do not deploy a bypass or temporary access token.
3. If the TOTP device is lost but the offline TOTP enrollment seed still exists, enroll a new authenticator using the original seed, while retaining the existing encrypted database secret. Confirm sign-in on a separate QA copy before using the real account.
4. If both password and TOTP seed are irretrievable, **do not** enable the one-time first-account bootstrap against a nonempty database, delete the existing account or disable MFA to gain access. This requires a separately implemented and reviewed **offline administrative recovery/credential-rotation procedure**, with explicit Director approval, database backup, forced session revocation, and a complete audit. Until such a procedure has been implemented and rehearsed, recovery remains a release blocker.
5. If the TOTP encryption key is lost, the existing encrypted TOTP seed cannot be decrypted; restore the protected key backup or use that separately approved offline recovery procedure. A future key-rotation utility must atomically re-encrypt valid stored seeds and prove old keys cannot be used.
6. Confirm recovery and session revocation with isolated PostgreSQL tests. Never operate directly on production PostgreSQL or production accounts during QA.

**Remaining Stage 1 acceptance gates:** real mobile browser behavior on HTTPS, trusted proxy/client-address verification, stable session lifecycle across process restart/redeployment, offline recovery/key-rotation drill, full endpoint/worker authorization inventory, and explicit Director release approval. Local auth remains **OFF** everywhere outside disposable tests; no merge or production rollout is authorized.


## Proxy-independent login throttling and retention — verified 2026-10-31

- **Build evidence:** disposable Railway QA build `e1bfa9a3-9af6-497f-93f6-599e487d4a62` found a failure in the spoofed-forwarded-header test, demonstrating that the proposed early socket-peer capture could not be relied upon in the Spring filter chain. That design was **removed**, not waived.
- Corrected implementation: PostgreSQL atomic 15-minute buckets are **global (100 attempts)** and per normalized account (12 attempts). Because client IP address is not involved, changing or forging forwarded IP headers cannot evade the global limiter.
- **Verified:** pinned commit `451aa5c672d9c51a6254bfbaa855398381353018`, temporary Railway QA service `mediaos-proxy-safety-ci-pr110-temp`, deployment `8dc3d29e-2f27-4959-ad73-8fd79af56006`. **198 Java tests passed, 0 failures, 0 errors, 0 skipped**, full Maven SUCCESS with PostgreSQL inside the Docker build. Frontend TypeScript/Vite and Vitest passed.
- Added opt-in-local-auth scheduled maintenance to delete throttle buckets whose last update is older than 48 hours, running every six hours by default. An integration test verifies older rows are deleted while recent rows remain.
- Local auth is still **disabled by default**; this CI does not prove a live HTTPS browser login, browser cookie behavior across Railway proxy, or a credential recovery drill. The temporary CI service has no domain, secrets, persistent Postgres connection, or AI generation.
- **Remaining Stage 1 blockers:** explicit offline credential recovery/rotation implementation and test; real browser HTTPS mobile smoke test; worker/callback identity and endpoint inventory; separate Director authorization for any QA feature activation or release.
