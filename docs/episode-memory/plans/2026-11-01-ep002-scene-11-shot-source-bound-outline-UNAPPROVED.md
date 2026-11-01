# EP002 — SCENE / Video Plan — 11-shot source-bound outline (NOT Director-approved choreography)

**Date:** 2026-11-01  
**Episode:** EP002 — *Why Login Fails Even When the Server Is Healthy*  
**Status:** `PREPARATION_ONLY / NOT_IMPORTED / NO_DIRECTOR_SCENE_LOCK`  
**Working editorial target:** 13:30 / 810 seconds; not actual measured ElevenLabs duration  
**Research:** native QA Research LOCK shown in Director UI. **Script:** native QA Script LOCK shown in Director UI. **Scene:** current native stage, not locked.  
**Canon English narration and technical continuity:** [EP002 Full Script Pass v4.0 assembly](https://github.com/stefanVasilev17/media-os/blob/4b964a950f7c0a449483a28151ceeed18a9d0aff/docs/episode-memory/plans/2026-10-31-ep002-full-script-v4-0-11-shot-director-lock-assembly.md)  
**Approval:** [GitHub full-episode Director Script LOCK](https://github.com/stefanVasilev17/media-os/blob/feature/ep002-director-shot11-script-lock-package-20261031/docs/episode-memory/events/2026-10-31-ep002-full-script-pass-v4-0-director-lock.md)

## Important integrity warning

This document is ONLY a **source-grounded shot architecture outline** that extracts narration-visible mechanisms and technical guardrails from the approved material. It is **not** the Director's original complete v4.0 HEAR→SEE screenplay, visual choreography table, camera coordinates, micro-timings, transition rules, asset assignments or actual audio alignment. The locked narration assembly itself explicitly states it must not substitute for the Director's original full visual choreography.

**DO NOT import this file alone as an approved complete SCENE stage; DO NOT claim it preserves missing director visual cues; DO NOT apply SCENE Director LOCK.** Find or supply the full original Director v4.0 visual storyboard, reconcile each row without changing the approved narration or visual decisions, then create a native QA SCENE draft for explicit Director review.

## Verbatim source-aligned SHOT outline

| Shot | Editorial window | Approved chapter | Narration-grounded visual mechanism (outline only) | Protected guardrail |
|---|---|---|---|---|
| SHOT01 | 00:00–00:40 | The Login That Keeps Waiting | Phone Login spinner continues; healthy Auth probe is not the end-to-end user answer | Teaser is flash-forward; no user-facing error before SHOT06 |
| SHOT02 | 00:40–01:25 | 9:00 AM: The Ticket Sale Opens | 09:00 fictional concert-ticket sale; phone→gateway→load balancer→Auth; request arrival rate rises, all Auth replicas share DB | Numbers are illustrative; original request arrival rate distinct from lookup attempts |
| SHOT03 | 01:25–02:35 | The Database Capacity Limit | Single User Database completed-account-lookup limit around 500/sec, versus original 650 then 900 login arrivals/sec; queue/processing pressure | DB remains running, not depicted as offline; throughput and arrival rate are distinct |
| SHOT04 | 02:35–03:35 | Alive Is Not Available | Auth service liveness/readiness both green in this intentionally shallow example while end-to-end Login cannot complete | No universal claim that readiness ignores dependencies; Phone still spinner |
| SHOT05 | 03:35–05:05 | Connection Pool: The Hidden Queue | Inspect Auth01 pool, replay clearly signaled from 8/8 historical moment to 1/8 and back to 8/8; requests wait to borrow a connection | Max eight connections per Auth instance; does not prove eight permanently open |
| SHOT06 | 05:05–06:15 | The Deadline Expires | REQUEST A times out before a pool connection/lookup; REQUEST B had already started DB lookup and may continue after caller timeout | First user-facing Please try again occurs here, not earlier; cancellation is conditional |
| SHOT07 | 06:15–07:45 | When Retrying Creates More Failure | Safe read-only lookup retries multiply DB attempts while original new-login arrival rate remains separate; cascading wait pressure | Never replay full Login POST; no unconditional credential replays |
| SHOT08 | 07:45–09:10 | More Servers, Same Bottleneck | Hypothetical Auth scale from three to six behind Load Balancer, all still depend on same DB | Six server instances with independent pools is not 48 guaranteed open DB sessions; no measured improvement |
| SHOT09 | 09:10–11:10 | Contain the Failure | Containment decisions shown separately: bounded retry budget, exponential backoff/jitter, early load shedding, fail-closed circuit breaker and illustrated 6+2 pool bulkhead | These gates do not create DB capacity; backlog shrinks only when admitted work becomes sustainable |
| SHOT10 | 11:10–12:40 | Measure the Journey That Matters | Success/error measures; distinguish wrong password; P95/P99 of successful login; trace gateway/Auth/pool/DB; SLI and illustrative 99.9%/2s/30d SLO | No false observation of actual recovery; 255 words in 90s requires actual voice alignment before animation timing |
| SHOT11 | 12:40–13:30 | The System Was Telling the Truth | Return to whole Login route and unanswered DB capacity question | No new explanation of database replication or EP003 reveal; quiet conclusion |

## Persistent map and reuse

Maintain **one world, one living architecture map**, Remotion-first. Reference existing approved EP001 geometries and motion language (Phone, Gateway, Load Balancer, Auth, User Database, packet paths, camera rig, dim/active states) without changing or overwriting EP001 assets. New objects must prove a spoken cause: Auth replica grid, per-instance pool slots, clear replay overlay, distinct arrival/completion/attempt counters, request deadline, linked safe retry attempts, containment gates, trace/SLI ribbon.

**Scene quality gate:** material should preserve source-locked shot versions and all exact narration, explicit incoming-vs-completed-rate denominators, Request A vs B distinction, fail-closed login, no DB-offline symbolism, 09:00 scenario and first error only in SHOT06. Keep 3 potential Reel candidates: SHOT04 (Alive ≠ Available), SHOT07 (Retry Amplification), SHOT08 (Scaling Trap).

## Before native SCENE draft

1. Obtain complete **Director-provided EP002 Full Script Pass v4.0 original visual choreography** (the 11 per-shot HEAR→SEE/storyboard tables), not just the narration assembly, the preliminary 2026-10-28 creative intake DRAFT, or this outline.
2. Create a line-by-line reconciliation including exact actor/asset IDs, temporal anchor, spatial relationship and camera state for each shot; mark uncertain entries explicitly rather than inventing them.
3. Use native MediaOS `/api/v1/episodes/95b8a4a2-728e-47fe-ad4c-a16748773588/stages/SCENE/draft` **only after** full source reconciliation, with optimistic stage revision check and logged Director audit. Do not use the paid AI Generate Draft button merely to fill source gaps.
4. The Director reviews before deciding on a separate native SCENE LOCK. Then voice generation/word alignment and shot-level visual pass can proceed according to the approved workflow.

**Production boundary:** this is a GitHub planning file, not a MediaOS QA database write, not a new visual creative approval, and not a production deploy.
