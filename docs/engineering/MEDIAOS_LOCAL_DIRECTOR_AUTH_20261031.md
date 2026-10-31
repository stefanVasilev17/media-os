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
