# MediaOS — GPU scoped callback transport

**Status: Draft PR #110; opt-in implementation, not live Runpod validation.**
**Safety:** no EP001 modifications, no production deploy, no paid GPU execution, no new active worker-auth flag.

## Mechanism

Before an explicitly requested GPU dispatch, `GpuWorkloadGrantService` issues a cryptographically random 32-byte Base64url secret. Only its SHA-256 digest is retained in `mediaos_worker_credential`, bound to one UUID render, a deterministic `runpod-gpu:<render-id>` worker identity, a GPU scope (`REMOTION_GPU` or `SPLINE_GPU`) and a short expiry. The issuance is audited in `mediaos_worker_credential_audit`. Remotion grants expire after 40 minutes and Spline grants after 20 minutes.

The Runpod dispatcher preserves the original `callbackToken`, and, **only when `mediaos.worker-auth.enabled=true`**, adds `workloadToken` and `workloadWorkerId` to the existing Runpod job input. It fails closed if the grant service is unavailable. A failed Runpod dispatch triggers best-effort token revocation. No scope secret is logged or included in response error messages. A successful dispatch retains the short-lived credential until revoked or expired.

The Runpod Python handler checks that both identity fields are present together, that the token has a 43–128 character Base64url form, and that worker identity matches the specific render. It sends both new headers on GET work, POST start/fail and PUT complete callbacks. The existing callback token is still mandatory. Existing Runpod workers receive no new fields while worker auth is disabled, preserving the legacy protocol.

## Offline tests and QA evidence

- Added a PostgreSQL-backed Java test for grant issuance, one-render isolation, scope isolation, token hash storage, expiry rules, audit and revocation.
- Added offline Python tests for old callback compatibility, complete scoped-header pair validation, propagation through mocked GPU callbacks and rejection of mismatched render identity.
- `Dockerfile.security-ci` uses a Python test stage plus Java 21/Maven/PostgreSQL and frontend TypeScript/Vitest.
- All CI tests use disposable local Postgres and mocked Runpod calls, with no real GPU allocation.

## Remaining release gates

1. **Isolated HTTPS QA:** create a disposable application and database with a controlled Director account and TLS; manually verify iPhone Safari. Not performed by the Docker verification build.
2. **GPU production lifecycle review:** verify Runpod input-secret masking, scheduling/budget policies, progress, completion, cancellation, expiry and credential revocation after completion, with test-only render data. Paid GPU use requires explicit approval.
3. **End-to-end EP002 disposable QA fixture:** Director approval → worker claim → GPU callback → Video Review, with strict stop/rollback. Do not run against EP001 or use locked EP001 render assets as fixtures.
4. **Rollback:** keep `mediaos.worker-auth.enabled=false` unless every active worker supports scoped identity. Disabling the new chain does not revoke existing credentials, so explicitly revoke them when rolling back.
5. **Credential rotation:** do not disclose worker secrets in chats, GitHub, screenshots, logs or application responses. Use the protected Runpod job payload and vault-controlled runtime configuration only after security review. GPU job payload currently contains callback secrets and the new worker secret; ensure Runpod operator/audit access is appropriately restricted.

Passing automated tests **does not** mean any live provider, Safari browser or Windows/Spline worker is validated.
