# MediaOS — isolated worker credential rollout, 31 October 2026

**Status: Draft PR #110, implementation and CI only. No worker execution has been enabled.** Existing EP001 production artifacts, its Remotion compositions, original Railway QA app/database and all paid AI controls are unchanged.

## What has been implemented

- V102 defines scoped, time-limited worker credentials. V103 adds an append-only administrative issue/revoke audit record with a non-secret change ticket.
- `WorkloadCredentialOfflineAdmin` can issue a scoped token hash and revoke the corresponding credential inside an explicit database transaction. Its input is an independently generated high-entropy opaque secret; the database stores a SHA-256 digest, **not the secret**. Credential lifetime must be between 5 minutes and 24 hours.
- `WorkloadCredentialOfflineCli` runs only from an interactive administrator terminal with a verified backup and disabled workers. It reads the secret without shell echo and prints only the credential UUID. No API endpoint provisions or resets a machine credential.
- Credential rotation uses *issue new → deploy to allowed worker → revoke old*, with both events audited. GPU scopes require an exact render/job UUID.
- Spline general worker optionally reads `MEDIA_OS_SPLINE_WORKLOAD_TOKEN`. Snapshot upload additionally supports an independent `MEDIA_OS_SPLINE_SNAPSHOT_WORKLOAD_TOKEN`.
- Shot Director worker optionally reads `MEDIA_OS_SPLINE_SHOT_WORKLOAD_TOKEN`.
- Local Runner optionally reads `MEDIA_OS_RUNNER_WORKLOAD_TOKEN` and includes its worker ID.
- Remotion CPU worker optionally reads `MEDIA_OS_REMOTION_CPU_WORKLOAD_TOKEN`, adding worker identity and secret to its *existing legacy-key* headers without changing rendering/compositions/EP001 assets.
- With all new variables absent and `MEDIAOS_WORKER_AUTH_ENABLED=false`, these clients keep their original legacy protocol. Enabling the server flag without all client credentials fails closed; no automatic upgrade is performed.

## Deployment and security contract

Server worker authentication requires all of:

```text
MEDIAOS_LOCAL_AUTH_ENABLED=true
MEDIAOS_DIRECTOR_SECURITY_ENABLED=false
MEDIAOS_WORKER_AUTH_ENABLED=true
```

**Never set these on production or the existing QA without a separate Director-approved rollout.** Worker credentials require both the new scoped header and each existing controller's legacy shared-key validation. A valid worker token cannot authorize Director operations; a Director session cannot claim worker work. There is no new paid provider.

Worker ID **must match exactly** the provisioned credential and the process-provided `X-Worker-Id`. Spline Shot worker appends `-shot` to its worker ID. CPU worker derives its ID from service and replica ID and thus needs consistent assignment across redeployments.

### GPU / Runpod blocker

GPU workers currently receive render-specific callback tokens through Runpod dispatch. The new scoped credential design also requires a render-bound secret and an exact worker ID. **The GPU dispatchers and GPU handler have not yet been changed to distribute that second credential securely.** Do not enable `worker-auth` for GPU rendering or enable paid Runpod dispatch until this is implemented, tested and explicitly approved.

### Local workflow for issuing a credential

1. Back up the **isolated** target PostgreSQL and stop the target workers. Set the offline approval and DB connection environment variables on the operator computer only: `MEDIAOS_OFFLINE_WORKER_MAINTENANCE_CONFIRM=OFFLINE_WORKERS_DISABLED_AND_BACKUP_VERIFIED`, `MEDIAOS_OFFLINE_JDBC_URL`, `MEDIAOS_OFFLINE_DB_USERNAME`, `MEDIAOS_OFFLINE_DB_PASSWORD`.
2. Independently generate a unique, cryptographically random secret (at least 32 random bytes, Base64url without padding); do **not** paste it into ChatGPT, GitHub, terminal commands, browser URLs, screenshots or application logs.
3. Run the Java CLI from an interactive operator console, using its documented positional arguments. Enter the secret only at its password-style prompt. Do not put credentials into build arguments, container logs or Git history. First verify the credential and expiry in a disposable CI environment.
4. Place the secret only into the corresponding worker's protected local environment; keep the pre-existing legacy key as required. Validate identity, scope, job binding and failure paths without a production task. Revoke old credentials after the new one is verified.
5. Restart only the reviewed worker once the complete Stage 1 security / QA release gates pass.

## Validation and acceptance boundaries

- Java 21 Maven test suite includes full Flyway V1–V103 verification on disposable PostgreSQL.
- New offline administrative test covers issuance, invalid scopes/duration/job binding, non-transactional refusal, revocation, and rotation audit without exposing raw credentials.
- New HTTP worker tests validate scoped token access and rejection of unauthorized Director, Runner or GPU actions.
- Build parses Remotion CPU worker source using `node --check`, then runs frontend build and Vitest.
- PowerShell scripts and the real Windows Spline environment still require hands-on Windows acceptance; build-time Java/Node checks do not verify a real Spline session.
- HTTPS/iPhone Safari login with a real secure session, Windows worker smoke test, complete GPU callback credential transport and EP002 end-to-end workflow remain **not tested**.
- Never use EP001 as test data, never activate paid AI or GPU rendering without the Director's explicit approval, and keep PR #110 Draft.

## HTTPS/mobile acceptance checklist (to run in an approved isolated environment)

1. Verify HTTPS TLS certificate and that only a disposable application/database are used. Confirm no production secrets or EP001 snapshots.
2. Confirm `GET /api/v1/auth/mode` returns local mode and health readiness, while anonymous Director APIs return HTTP 401.
3. In iPhone Safari, verify responsive Director Login, six-digit authenticator prompt, non-leaking password fields, CSRF cookie and HttpOnly Secure SameSite session cookie.
4. Log in using *QA-only* credentials, verify Director action, refresh/reopen Safari, wait for idle timeout, then verify 401 and logout. Verify CSRF rejection and locked account behavior.
5. Rehearse offline recovery and credential rotation on a disposable copy; revoke existing sessions. Do not run the offline CLI against production database.
6. Only after all tests pass, prepare explicit Director go/no-go and production rollback. No release is implied by a green CI build.


## Verified isolated CI run — 2026-10-31

- **Pinned code commit:** `03bde1aedc393527f99f495c1e4f25f20d49054a`.
- **Railway QA build-only service:** `mediaos-workload-client-ci-pr110-temp` deployment `39d7acee-b795-4b9e-8186-224fbe1d2e01`. Status **SUCCESS**; a separate temporary PostgreSQL 16 ran inside the Docker build (no connection to persistent QA/production Postgres).
- Docker executed the full `mvn test` stage with `CI_POSTGRES_URL`, so compilation, all existing Java regression tests, V1–V103 Flyway migrations and offline issue/revoke audit tests completed with exit code 0. Railway returned a successful build status; its available captured logs do not expose a reliable aggregate Java test count for this build, so this record makes **no unsupported exact-count assertion**.
- Node 22 checked syntax for `remotion-engine/cpu-worker.mjs`; TypeScript/Vite build and **12 frontend Vitest tests** passed.
- PowerShell worker scripts were changed only at their HTTP header construction points. They have not been run against the real Windows/Spline installation and remain subject to user-side Windows QA.
- No live credentials were provisioned, no worker flags activated, no Runpod/AI spend, no EP001 modifications or production deploy.
