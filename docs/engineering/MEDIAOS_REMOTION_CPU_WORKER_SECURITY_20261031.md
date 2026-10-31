# MediaOS — Remotion CPU Worker Security / Stage 1 handoff

**Status:** Draft PR #110. Isolated CI only. No active worker-auth flag, no new production credential, no real render execution. The production `media-os-render-worker` in the existing Railway MediaOS project remains deployed from `main`, with its existing `MEDIA_OS_RENDER_WORKER_KEY` protocol. GPU / Runpod is out of scope for this MVP.

## Current actual rendering architecture

- **Engine:** Remotion running in the existing Railway service `media-os-render-worker`, built using `Dockerfile.remotion-worker` and `remotion-engine/cpu-worker.mjs`; it uses Chromium and ffmpeg.
- **Backend:** `RemotionCpuWorkerController` handles `POST /api/v1/remotion/renders/worker/claim`, `POST /api/v1/remotion/renders/worker/{renderId}/progress`, `PUT /api/v1/remotion/renders/worker/{renderId}/complete` and `POST /api/v1/remotion/renders/worker/{renderId}/fail`. The backend's existing legacy key and per-render worker ownership checks are retained.
- **No new provider:** all scoped credentials use existing PostgreSQL tables V102/V103 and Spring Security. No identity provider, Runpod or GPU subscription is needed.

## Hardening implemented in Draft PR #110

- `WorkloadRoute.resolve(method, path)` now recognizes **only** these four Remotion CPU endpoints and their exact HTTP methods. Unknown worker paths and method mismatches deny before controller invocation.
- `WorkloadIdentityFilter` requires an unambiguous identity: scoped `X-Worker-Id`, if provided, **must equal** the legacy `X-Media-OS-Worker` identity. The legacy identity is used to look up scoped `REMOTION_CPU` credential, preventing one credential from being presented on behalf of a different render owner. Both the scoped credential and the existing legacy shared key are required when enabled.
- `remotion-engine/cpu-worker.mjs` accepts opt-in `MEDIA_OS_REMOTION_CPU_WORKLOAD_TOKEN` and adds the scoped token and identity headers to the existing request headers. With that variable absent, original behavior remains.
- `MEDIA_OS_REMOTION_WORKER_ID` optionally supplies a **stable** ID that can be provisioned offline for a worker and reused across Railway redeployments. If absent, the existing `<service>:<replica>` identity remains unchanged. Stable IDs must be unique per concurrent worker instance and must not be shared across concurrently active replicas; otherwise claim ownership and progress handling will be ambiguous.
- `WorkloadHttpAuthorizationTest` verifies claim/progress/complete/fail on a temporary HTTP endpoint; a mismatched or absent legacy worker identity, unrecognized route and wrong method are denied, and a worker cannot mutate Director endpoints.
- The QA Docker build includes Node syntax checking for the modified CPU worker, Maven/Java 21 and isolated PostgreSQL 16 with full Flyway migrations, and frontend TypeScript/Vitest.

## Release constraints (still OPEN)

1. **No production worker changes:** actual existing Railway service remains on `main`. Do not set `MEDIAOS_WORKER_AUTH_ENABLED` until worker client and backend are deployed together in a genuinely isolated environment with disposable DB and approved credentials.
2. **Do not create real EP002 videos yet.** For new episodes, the current CPU controller's `linkVoiceWorkflowRender` uses the fixed `EP001_ID` and `cpu-worker.mjs` includes EP001-specific preview/audio paths. These codepaths must be generalized with episode-aware linkage and tested on disposable EP002 fixtures **before** a new episode is rendered. Keep EP001 behavior/data/assets untouched.
3. **Real HTTPS QA, session and Windows/Spline acceptance** remain separate from static integration tests. No iPhone Safari test, real Remotion render or user-account login is implied by CI success.
4. **GPU / Runpod stays disabled and excluded from the current delivery plan.** The unused draft code does not authorize Runpod deployment, billed GPU jobs or new subscriptions; segregate it before a production merge.
5. Paid AI, content generation, episode writes and production deployment require separate Director go/no-go.

## Intended next work order

- Complete an episode-aware EP002 rendering contract without writing existing EP001 records.
- Verify an isolated Railway Remotion CPU worker + API over HTTPS with disposable PostgreSQL and no paid GPU.
- Validate Director approval → authorized CPU claim → progress → complete/fail → Video Review in EP002 QA, with controlled human approval.
- Obtain explicit production go/no-go, backup, migration rehearsal and rollback instructions before merging/deploying security PR stack.

This document describes existing confirmed production services and draft-only code changes; it does not claim a live QA acceptance.
