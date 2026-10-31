# MediaOS scoped worker authentication — 2026-10-31

**Status:** Draft PR #110, tested **foundation only**. Disabled by default. This document is not an authorization to activate workers, spending, voice generation, episode writes, or production rendering. EP001 is immutable.

## Verified work

- Migration `V102__scoped_workload_credentials.sql` creates `mediaos_worker_credential` with a SHA-256 digest of a high-entropy opaque secret (never a plaintext credential), active flag (default false), expiry, worker ID, operation scope and optional bound render/job UUID.
- GPU scopes `REMOTION_GPU` and `SPLINE_GPU` **require** a bound render/job UUID via a database CHECK constraint.
- `WorkloadCredentialService` rejects missing/short/malformed/wrong tokens, unknown IDs, wrong scopes, wrong bound render, expired tokens, and inactive credentials.
- `WorkloadRoute` maps known Spline/Remotion worker namespaces, giving snapshot and shot worker routes priority over generic Spline routes. Unrecognized paths deny access.
- `WorkloadSecurityConfiguration` adds a **separate opt-in** stateless filter chain with priority over local Director security. `WorkloadIdentityFilter` verifies an opaque machine credential, records the verified identity as a request attribute, and does **not** create a Director security principal or grant `ROLE_DIRECTOR`.
- A normal Director browser session cannot access these worker endpoints. A worker credential does not authorize `/api/v1/episodes` or `/api/v1/security/session`.
- Legacy controller-level Spline/Remotion keys remain an additional independent check. No static/shared legacy worker key was replaced, distributed or activated in this draft.

## Opt-in (NOT enabled anywhere)

```text
MEDIAOS_LOCAL_AUTH_ENABLED=true
MEDIAOS_DIRECTOR_SECURITY_ENABLED=false
MEDIAOS_WORKER_AUTH_ENABLED=true
```

Activating `worker-auth` with anything other than exclusive local Director mode fails application startup. No active worker credential is auto-provisioned. An approved offline credential-provisioning and rotation tool is still required. Do not manually insert tokens through a shared chat, SQL console logs or source control.

The workload request must provide `X-MediaOS-Workload-Token` with a provisioned high-entropy token, plus the matching `X-Worker-Id`. Remotion CPU also supports the legacy `X-Media-OS-Worker` worker ID. The existing controller-specific worker keys/tokens are **still** required. Each worker client must be updated and regression-tested separately before this feature may be enabled.

## Verification

**Pinned verified commit:** `aa90dce77c89aa6a7e483972e9b57c48712809ca`.
**Build:** isolated Railway QA build-only service `mediaos-scoped-worker-ci-pr110-temp`, deployment `83497061-ffb0-4133-9ae0-ed61342dbf5d`; Maven/Java 21, disposable PostgreSQL 16.

**205 Java tests passed, 0 failures, 0 errors, 0 skipped; Maven BUILD SUCCESS.**
**12 frontend Vitest tests passed; TypeScript/Vite build succeeded.**
Flyway validated the full V1–V102 migration chain.
The new tests cover token scope and expiry, inactive credentials, render UUID ownership, invalid worker identity, invalid route classification, worker HTTP access without a session and inability to use worker headers for Director operations.

The first test attempt found an incorrect expectation for a Director mutation blocked by CSRF; fixed to expect 403. The second test attempt exposed a duplicate test-only SpringBootConfiguration; fixed without changing production authorization. Final build above is green.

## Required before a real worker is allowed

1. Add reviewed offline provisioning, rotation, revocation and audit for machine credentials without exposing tokens to logs or frontend.
2. Narrow route + HTTP method matching to known callbacks, verify all legacy shared-key checks, bind worker ownership to individual claims/progress/completion, and audit access.
3. Update Spline, Remotion CPU/GPU, and runner clients individually to send scoped identity headers; validate claim/progress/complete/fail on a **disposable EP002 fixture** only.
4. Keep paid AI, Voice, Remotion and GPU spending disabled until the Director explicitly approves cost controls and test budgets.
5. Perform a separate HTTPS browser/mobile validation on a truly isolated application and database. No actual iPhone Safari acceptance has been run in this commit.
6. Maintain fail-closed worker routes until all requirements pass. No new active worker keys, account, or production configuration are created by this change.

The existing Railway QA app and database and EP001 artifacts remain untouched.
