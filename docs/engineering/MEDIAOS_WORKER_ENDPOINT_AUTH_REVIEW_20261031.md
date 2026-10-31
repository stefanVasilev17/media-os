# MediaOS worker/API authorization inventory — 2026-10-31

**Status:** reviewed source routes in PR #110; **workers are intentionally disabled under Local Director and Director JWT security**. This review must not be mistaken for deployment-ready workload identity. Re-enable only through separate, tested workload credentials and episode/job ownership.

| Controller | Base path | Operations / current credential | Security decision |
|---|---|---|---|
| SplineWorkerController | `/api/v1/worker/spline` | GET next job; POST started/complete/fail; `X-Worker-Key` | **DENY** via /api/v1/worker/** |
| SplineShotWorkerController | `/api/v1/worker/spline-shot` | GET claim; POST lifecycle; `X-Worker-Key` | **DENY** |
| SplineSnapshotWorkerController | `/api/v1/worker/spline/snapshot` | POST PNG; `X-Worker-Key` | **DENY** |
| RunnerController | `/api/v1/worker/runner/heartbeat` | POST heartbeat; `X-Worker-Key` | **DENY** |
| RemotionCpuWorkerController | `/api/v1/remotion/renders/worker` | POST claim/progress/fail; PUT MP4; `X-Media-OS-Worker-Key` | **DENY** |
| RemotionGpuRenderController | `/api/v1/remotion/gpu-renders` | GET work; POST start/fail; PUT MP4; `X-Media-OS-GPU-Token` | **DENY**, including GET before member-read matcher |
| SplineGpuRenderController | `/api/v1/spline/gpu-renders` | GET work; POST start/fail; PUT MP4; `X-Media-OS-GPU-Token` | **DENY**, including GET |
| RemotionRenderController | `/api/v1/remotion/renders` | Director starts composition render via POST; GET status/video | Director POST currently **DENY** pending reviewed workflow matrix; read under verified member |
| SplineShotRenderController | `/api/v1/spline/renders` | Director starts shot render via POST; GET status/video | Director POST **DENY** pending reviewed workflow matrix |
| SplineJobController | `/api/v1/spline/jobs` | POST chat, object edits, approval; GET state | Director POST **DENY** pending reviewed workflow matrix |
| VoiceProductionController | `/api/v1/voice` | POST generate/approve/align and PUT shot | Director mutations **DENY** pending reviewed workflow matrix |

**Why explicit GET deny matters:** GPU `GET /{renderId}/work` can reveal a render payload or trigger worker participation; a blanket member-read rule would otherwise permit a logged-in Director to claim/inspect worker jobs. The Spring Security rules in both local and JWT mode explicitly deny both GPU namespaces before the member-read matcher.

**Why existing shared headers are not enough:** Current controllers use separate header-key/token schemes. A user session is not a workload credential. There is no unified per-worker identity, scope, expiry, rotation/revocation, replay protection, paid-operation policy or centralized security audit for service calls. Keys supplied through arbitrary browser headers are not accepted as a substitute for a reviewed, isolated worker principal.

**Future workflow gate, not authorized by this PR:** introduce role/scoped job-bound machine credentials, worker-specific route matching, secret rotation, rate limits and network isolation, then prove claim/progress/complete/fail end-to-end with a disposable EP002-only QA job. Preserve all old EP001/LOCKED records; never allow worker callbacks to infer Director approval. All paid AI/Voice/Render flags remain disabled until explicitly authorized.

**HTTP tests:** an authenticated Director (JWT) cannot GET either GPU worker work endpoint and cannot POST `/api/v1/worker/**`. No worker endpoint was re-enabled in PR #110.
