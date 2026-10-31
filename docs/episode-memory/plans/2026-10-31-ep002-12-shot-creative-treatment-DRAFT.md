# Architectural Thinking — EP002 Creative Treatment & 12-Shot Story Architecture (DRAFT v0.2)

**Date:** 2026-10-31
**Status:** DRAFT / DIRECTOR REVIEW — NOT SCRIPT LOCKED, NOT VOICE LOCKED, NOT VISUAL LOCKED.
**Canonical episode:** EP002
**Working title:** Why Login Fails Even When the Server Is Healthy
**Editorial authority:** `docs/episode-memory/events/2026-10-21-ep001-successful-login-only-ep002-failure-architecture-editorial-lock.md`
**Prior creative source:** `docs/episode-memory/plans/2026-10-28-ep002-creative-intake-truth-map-DRAFT.md`
**Production system:** Remotion-first, Living Technical Interface. EP001 SHOT01–12 and their voices/MP4s are protected and immutable.

## 1. Audience promise and single question

**Question:** How can the Auth Service remain alive, and its liveness check remain green, while a real Login request fails?

A viewer should leave understanding this causal chain: the login request requires account information; a slow or unavailable User Database delays that dependency; the Auth Service cannot safely verify credentials without it; a request deadline eventually ends the wait; adding blind retries may increase load and spread failure; end-to-end user-journey measurements reveal what a simple process-health indicator misses.

The episode is a single **failure-engineering story** based on a fresh Login attempt. Not an encyclopedia of circuit breakers, token lifecycle, or generic outage patterns.

## 2. Three core Aha moments (carry forward from v0.1)

1. **THE SERVER IS GREEN. LOGIN IS BROKEN.** A shallow liveness result is not equivalent to end-to-end login availability.
2. **A TIMEOUT DOES NOT FIX THE DATABASE.** A deadline decides how long this request is allowed to wait; it neither proves the final state nor repairs a dependency.
3. **A RETRY CAN MAKE THE OUTAGE WORSE.** Extra downstream attempts can increase demand exactly when the dependency has reduced capacity.

All three will have 9:16-compatible, standalone hook → mechanism → payoff sequences inside the main film. Exact reel boundaries are provisional until voice alignment.

## 3. Technical truth contract

- Model one explicit example: **Phone → Network/Transit → API Gateway → Load Balancer → Auth Service → User Database**, with User Lookup as the dependency call. This is the established EP001 map, not a claim that every real login system uses the same topology.
- Health check: illustrate an intentionally **shallow liveness probe** showing that the process responds, not an all-dependencies-ready or synthetic login check. Readiness may include checks relevant to receiving traffic; do not call every probe identical.
- Failure: database account lookup becomes **slow** and may exceed a configured request deadline. The example must label numbers as `ILLUSTRATIVE`, not measured production data.
- The Auth Service does not assume successful password verification when its required credential record is unavailable. It fails safely; this is not the same as claiming the submitted credentials are incorrect.
- Request outcome can be timeout, gateway failure, or an application-mapped response. Never assert a universal HTTP status.
- Do not imply an HTTP timeout cancels all downstream work automatically. Cancellation propagation and cleanup depend on the implementation.
- Visualize resource pressure as **in-flight waits / held connections** where applicable, not as an unsupported claim that every Java service blocks a thread per request.
- Retry examples are conditioned on operation safety and policies; **do not instruct automatic password replays**. Login rate limiting and abuse protection remain in force. Backoff+jitter, retry budget, and retry location are trade-offs, not a blanket rule.
- Recovery must show successful *fresh credential verification* before any authenticated success or private Dashboard is visible.
- Preserve independent measurements for liveness, readiness, and synthetic end-to-end login success.

Sources for research validation:
- Google SRE: https://sre.google/sre-book/addressing-cascading-failures/
- Google SRE: https://sre.google/sre-book/service-best-practices/
- Kubernetes: https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/
- AWS Builders' Library: https://builder.aws.com/content/3EumjoZascWd1oZiEgL8ORlv3qE/timeouts-retries-and-backoff-with-jitter

## 4. Working 12-shot outline — 16:15 editorial hypothesis, NOT locked times

| Shot | Working time | Story / viewer discovery | Visual action in existing architecture | Type |
|---|---|---|---|---|
| 01 | 00:00–00:50 | **Cold open:** Login spinner keeps waiting while Auth Service liveness stays green. What is missing? | Phone LEFT, quiet full map; green Auth indicator RIGHT; suspended User Lookup; restrained camera tension. | Hook |
| 02 | 00:50–02:05 | How the successful EP001 request normally travels. Re-establish the world quickly, no reteaching. | Brief cyan Login Request crossing Network → Gateway → Balancer → Auth; legacy nodes remain stable. | Reuse |
| 03 | 02:05–03:30 | Auth Service needs account data that it does not possess or invent. | New User Lookup moves from Auth to User Database; lookup stops, waiting path amber. | Dependency |
| 04 | 03:30–04:55 | **Aha #1:** Process is responsive, user journey is failing. | Side-by-side same-world liveness green vs failed/incomplete Login journey; distinguish statuses structurally, not only by color. | Reel #1 |
| 05 | 04:55–06:20 | Every request has a finite useful time budget; dependency waiting consumes it. | Example deadline bar above the Auth→DB path, marked ILLUSTRATIVE; clock begins from request arrival. | Clock |
| 06 | 06:20–07:40 | Slow dependency can accumulate unfinished work; why the delay becomes a wider problem. | Show several in-flight lookup tokens and a growing count; resource-pressure cue, no ungrounded universal threading claim. | Pressure |
| 07 | 07:40–09:00 | **Aha #2:** Deadline expires; it bounds the wait, not the underlying outage. | Deadline boundary closes the pending path; Phone receives a failure/timeout outcome with no false credential result. | Reel #2 |
| 08 | 09:00–10:25 | **Aha #3:** Uncontrolled reattempts add more load. | Controlled split: one failed dependency request → repeated downstream lookups → queue/pressure rises; no automatic client credential replay. | Reel #3 |
| 09 | 10:25–11:40 | Retry decisions are conditional: attempt budget, correct layer, backoff and jitter, abuse limits. | Bad/controlled branch comparison; semantic decision tokens, no wall of retry vocabulary. | Trade-off |
| 10 | 11:40–13:10 | How engineers limit the damage: deadlines, cancellation where supported, load shedding, readiness/circuit-breaker choices. | Return to main world; show protective boundary at dependency and reduced unnecessary work. | Engineering |
| 11 | 13:10–14:40 | Why liveness alone hid the outage: trace the user journey, lookup latency, errors, synthetic checks. | Reuse same path and overlay sparse trace bars / real request status; display no fabricated telemetry as observed production values. | Diagnosis |
| 12 | 14:40–16:15 | Recovery and the bigger lesson. Real successful lookup and verification precede the Dashboard. | DB resumes, legitimate fresh Login path completes; wide calm architecture map + successful Phone. End on journey health vs node health. | Payoff |

**Time planning only.** This structure aims for 14–18 minutes if the final narration supports it; do not pad, and never force voice delivery to the draft timestamps. At 30fps, precise frame counts come **after** approved ElevenLabs word-level alignment.

## 5. The three standalone Shorts / Reels

- **SHOT04 candidate:** `THE SERVER IS GREEN. LOGIN IS BROKEN.` A simple green liveness pulse, frozen account lookup, failed login journey, then the larger architectural insight.
- **SHOT07 candidate:** `A TIMEOUT DOESN'T FIX THE DATABASE.` The deadline reaches zero; the request stops waiting; the missing account record has not magically arrived.
- **SHOT08 candidate:** `A RETRY CAN TURN A DELAY INTO AN OUTAGE.` Before/after pressure comparison shows how extra attempts can worsen overload.

Each reel uses a composition-safe center crop and a complete sentence-level hook/mechanism/payoff. These are **candidate extractable sequences**, not yet final short cut points.

## 6. Reusable world and minimal additions

**Reuse from EP001:** Phone/Login spinner and response, Network/Transit, API Gateway, Load Balancer, Auth Service, User Lookup, User Database, inactive/active path states, request/return tokens, Living Map camera rig, color tokens, Green success and Amber waiting behavior, locked shape identities. **Do not touch approved EP001 source/voice/master.**

**Only if approved narration needs them:** `ATDependencyDeadline` (illustrative clock/budget), `ATInFlightCounter` (waiting request pressure), `ATJourneyStatus` (liveness vs real login), `ATRetryBudgetComparison` (bounded policy), `ATTraceRibbon` (sparse end-to-end observation). These names are proposals, not approved asset registry entries.

State semantics: green = verified success/liveness (with explicit label); amber = waiting or time pressure; red = definitive failed outcome, not every delay. Quiet nodes remain visible. No full-map flashing, transition noise, or decorative packet swarms.

## 7. SHOT01 script opening — PROPOSED NARRATION ONLY

> You tap Login. The spinner starts. And then ... nothing.
>
> Behind the screen, the Auth Service is still alive. A simple health check reports green. Requests can still reach the service. But your Login is not completing.
>
> So what exactly is broken?
>
> The answer is hidden one step deeper. Before the system can trust your password, it needs account information from a database. And this time, that answer is taking too long.
>
> A server can be alive while the journey you depend on is failing. To see why, we need to follow the request.

**Voice intent:** Calm senior-architect documentary delivery; curiosity first, no theatrical panic. A slightly longer silence on the stationary spinner, then quiet precision on the dependency reveal. Exact wording is **NOT LOCKED**.

**Proposed 00:00–00:50 SHOT01 visual beats:**
- 00:00–00:07: realistic Phone Login submit; spinner turns; new Login Request begins. Background remains the approved living world.
- 00:07–00:15: camera reveals Auth Service, which carries a small clearly labeled `LIVENESS: OK` badge. Green is not shown as proof of user success.
- 00:15–00:25: return attention to Phone spinner, then focus on stalled Auth→User Database lookup. No false failure yet.
- 00:25–00:39: quiet waiting state, single amber dependency and subtle time pressure; supporting nodes remain dim.
- 00:39–00:50: wider camera move creates open question and resets route to trace the request from its beginning.

These are *planning beats*, not exact voice-aligned events or implemented camera keyframes.

## 8. Production gates and exclusions

1. Director reviews this treatment and the single failure scenario, 12-shot spine, 3 Ahas, three reel moments. **No automatic LOCK.**
2. Verify detailed source-based architecture Truth Map. Then obtain explicit **Truth Map LOCK → Scope LOCK**.
3. Write full voice-ready episode script, then Director **Script LOCK** and Voice Direction LOCK.
4. Execute Episode-Level Visual Pass → Shot-Level Visual Pass → Component Consistency Pass, then Remotion component plan, approved ElevenLabs, word-level alignment, production slices, QA.
5. First implementation test is a **20–30 second premium vertical slice** of the green/liveness-vs-stalled-lookup paradox. Only after quality review should the shot family scale.
6. Do not bring Session Restore, JWT/refresh token lifecycle, full security theory, or EP003 planning into EP002. Do not expand beyond this one causal failure simply to reach duration.
7. No EP001 changes, no paid AI, no merges, no deployments, no final media render from this DRAFT.

## 9. Director review decision pending

**Proposed editorial lock sentence:** `EP002 is one Login-journey outage story: a shallow-green Auth Service cannot finish credential verification because its required User Database lookup is too slow; deadlines bound waiting, unchecked retries amplify load, and end-to-end observability and protective limits govern recovery.`

**Status: NOT APPROVED.** Any editorial re-scope, title LOCK, narration LOCK or production release needs explicit Director confirmation.
