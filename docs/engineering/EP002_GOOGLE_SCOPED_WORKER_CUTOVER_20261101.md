# MediaOS EP002 — Worker compatibility and Google Director security gate

Date: 2026-11-01. **State: isolated QA candidate only; production NOT authorized for cutover.**

## Verified compatibility gap

- Current live production backend and CPU worker both track `main`, SHA `b29fa6434df3f055fd48bb0903913c99ddb213b5`. The worker uses only the legacy `MEDIA_OS_RENDER_WORKER_KEY` header and has no `MEDIA_OS_REMOTION_CPU_WORKLOAD_TOKEN` environment variable. The current `main` worker code does **not** send `X-MediaOS-Workload-Token`.
- EP002 release candidate worker code *does* support both original legacy headers and `X-Worker-Id` / `X-MediaOS-Workload-Token` from `MEDIA_OS_REMOTION_CPU_WORKLOAD_TOKEN`. This is **required** if `MEDIAOS_WORKER_AUTH_ENABLED=true` on the new backend.
- New backend `WorkloadSecurityConfiguration` initially refused worker auth when Director identity was Google OIDC (allowed only local password mode). Fixed: exactly **one** trusted Director mode — local, external bearer OIDC, or Google OIDC — is required. Scoped workload identity remains a separate short-lived database credential, never a Google session or bearer Director identity.
- The worker security filter uses the dedicated route allowlist, worker ID, token hash, scope, optional job binding, expiration and active status. It is ordered ahead of the Director authentication filter. A legacy worker key **alone** must not satisfy it, and a scoped worker token must never grant Director episode access.
- After EP002 is created, `GlobalCreationPreflightFilter` can no longer assume one episode for final CPU `complete` or `fail` callbacks. Fixed: final callback episode identity is looked up from persisted `remotion_render.episode_id` and the fixed project ID. Caller-provided episode headers cannot override the stored ID. Missing/null episode linkage fails closed. `claim` and `progress` remain excluded from redundant per-poll preflight audit; final video write still receives its own episode-scoped audit.
- The existing `RemotionCpuWorkerController.requireWorker` additionally checks the original legacy worker key and worker ownership. During initial transition both legacy key and scoped token are needed; **do not remove legacy key** before a separately approved migration.

## Phased production switch — REQUIRED ordering

1. **No action on production yet.** Keep current `main` deployed. Director explicitly deferred Google OAuth credentials until final login need.
2. Prepare the EP002 release and proof of immutable EP001 hashes. Keep protected paid EP002 Voice flag OFF. The schema V85→V106 rehearsal is PASS on a clone, but a fresh retained backup and exact release sign-off are still necessary.
3. In an isolated preproduction environment, deploy candidate backend and matching worker source at a pinned commit. Enable the *one* test identity mode (local QA or Google QA if actual credentials are provided) and `MEDIAOS_WORKER_AUTH_ENABLED=true`. Provision a valid `REMOTION_CPU` scoped credential with the **actual matching worker ID** using the audited offline administration transaction and a rotation change ticket; store the raw credential only as a Railway secret on the worker, never in the repository or logs.
4. Verify complete worker lifecycle: claim (204 if queue empty), render ownership, progress, completion, failure, invalid token, wrong identity, wrong scope, expired and revoked token, and **a render linked to EP001 while both EP001 and EP002 are present**. Verify no cross-episode preflight audit or EP001 LOCK mutation.
5. Worker credential lifetime is strictly **5 minutes to 24 hours** (`WorkloadCredentialOfflineAdmin`). **An unattended production worker therefore requires a secure proactive renewal and overlap/revocation procedure.** A one-time 24-hour token is not an acceptable permanent production configuration. Document who owns renewal and how an expired token alerts the operator. No automatic rotation service is implemented in this candidate.
6. For a controlled production deployment, upgrade the worker source to a version that sends scoped headers **before** enforcing worker auth on the backend; verify it still works with the legacy backend. Then provision valid scoped credentials, enable and verify the protected backend with Google Director login, and cut traffic over atomically with rollback readiness. The existing production worker cannot handle the new backend with legacy headers alone.
7. Keep worker identity and Director OAuth configured separately; ensure the Google Client ID/Secret and Director subject are not copied to the worker. Test Safari/CSRF/logout for Director and worker token scope independently.
8. On any worker 401/403 or failed post-render `complete`, **STOP** and reconcile credentials/callbacks; do not disable scoped auth to restore rendering. Restore known-good deployments if needed under the approved rollback.
9. No merge of large Draft PR #112 to `main`, no production schema migrations, no new EP002 workspace, no TTS spend until Director GO.

## Automated checks

- The existing isolated PostgreSQL 18 CI covers `WorkloadHttpAuthorizationTest` for local-only worker path, scope, method, ownership and revocation.
- New `WorkloadSecurityModeCompatibilityTest` proves Google, local and bearer OIDC modes individually permit scoped worker authentication, and ambiguous/no-Director configuration fails closed.
- New `GoogleWorkerChainRoutingTest` initializes Google and worker Spring Security chains together with a fake CI Google client, validates a job-scoped GPU worker call without Google session, and blocks an unrelated job and episode data.
- New `WorkerFinalCallbackEpisodePreflightTest` uses disposable PostgreSQL and verifies final callbacks resolve the stored episode even with two workspaces, plus forged-header/missing-job denial.
- These tests do **not** perform a live Google OAuth redirect, paid render, or production credential rotation. Those remain separate release acceptance checks.

## Current operator decisions

Google login remains deliberately deferred by Director. **This is not authorization to enable anonymous paid API routes.** The production upgrade may only proceed with verified identity, scoped worker credentials and worker/token rotation ownership. Remotion/GPU is not a prerequisite for EP002 Voice-only audio generation, but a global backend upgrade must preserve the existing EP001 worker routes and data.
