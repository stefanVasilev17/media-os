# Architectural Thinking — EP002 Creative Intake + Architecture Truth Map (DRAFT v0.1)

**Date:** 2026-10-28
**Status:** DIRECTOR REVIEW / NOT LOCKED
**Episode:** EP002
**Working title:** Why Login Fails Even When the Server Is Healthy
**Scope authority:** `docs/episode-memory/events/2026-10-21-ep001-successful-login-only-ep002-failure-architecture-editorial-lock.md`
**World:** Reuse EP001 Living Technical Interface / Remotion-first. Do not modify locked EP001 shots.

## Viewer promise

The viewer will understand how a Login request can fail even when its Auth Service is responding to health checks, why a slow User Database delays the whole chain, and how disciplined deadlines, limited retries, and end-to-end observability change the outcome. This is a causal architecture story, not a failure-pattern encyclopedia.

## Central question / editorial thesis

**How can the Auth Service be marked healthy while the user cannot log in?**

**Thesis:** A component-level health signal is not proof of end-to-end user-journey availability. An operation succeeds only when all critical dependencies deliver the information it requires within the relevant time budget.

## Architecture Truth Map (first-pass, requires Director/technical review)

1. The Phone sends a Login Request through the known EP001 path: Network / Transit → API Gateway → Load Balancer → Auth Service.
2. Auth Service accepts the attempt and issues a User Lookup to User Database. The Account Record / credential representation is required for fresh-login verification in the illustrated architecture.
3. In the failure case, User Database becomes slow or stops responding within a configured deadline; Auth Service cannot complete credential verification before that deadline. Do not portray the Auth Service's `/health` success as equivalent to account-lookup success.
4. The service can remain alive, and an intentionally shallow liveness check can remain green, even while business operations dependent on the database fail. Distinguish process liveness, readiness / ability to serve, and end-to-end synthetic success.
5. The Phone keeps waiting until the request fails, times out, or receives an error response. Do not hard-code HTTP 500/503/504 for every variant: the actual response depends on where the failure is detected and how the application maps it.
6. Timeouts and deadlines bound the resources and waiting time. A timeout does not repair the dependency; it ends one wait.
7. Blind retries can increase load on an already struggling dependency. Present bounded retry budgets, backoff/jitter and retry location as **conditional architecture choices**, not universally safe login retry settings. Respect login rate limits / abuse protections; do not automatically replay credentials as a simplistic solution.
8. For this fresh-login model, an unavailable source of credential truth should not lead to invented successful authentication. Failure safely and clearly when the identity cannot be verified.
9. Recovery and monitoring should focus on the **Login journey**, using appropriate request outcomes, latency, dependency metrics, tracing and synthetic checks, not only green service probes.

## Three Aha moments

- **AHA 1 — GREEN IS NOT HEALTHY FOR THE USER:** Auth Service process is healthy; Login journey is broken.
- **AHA 2 — TIMEOUT IS A DECISION:** A bounded wait limits damage but does not make the slow database faster.
- **AHA 3 — RETRY CAN MAKE FAILURE WORSE:** A naive attempt to recover can multiply demand on an already struggling component.

## Proposed narrative spine (working, not timed or narrated)

1. **Cold open:** The Phone spinner continues while a green Auth Service indicator remains visible; someone asks why Login is broken.
2. **One familiar world:** Briefly reuse the EP001 successful architecture and transport path; avoid reteaching every label.
3. **The hidden dependency:** User Lookup leaves Auth Service and waits at User Database.
4. **The misleading green signal:** Compare Auth Service liveness/readiness vs the failed end-to-end login outcome.
5. **The clock:** Deadline budget elapses while downstream account data remains unavailable.
6. **The first failure response:** What happens on the Phone; keep business consequence visible.
7. **Why a retry may backfire:** Carefully illustrate additional requests, overload feedback and controlled retry choices.
8. **Engineering decisions:** Timeouts, cancellation, load shedding, retry budgets/circuit breaker where context justifies them; avoid listing all failure patterns.
9. **Observability and resolution:** Traces, latency distributions, failed login operations; return to an end-to-end healthy path and visible human success.
10. **Zoom-out + bridge:** Service health is not journey health; next natural identity question leads toward EP003 — remembered authentication.

**Target duration:** Working hypothesis ~15–18 minutes subject to approved narration and precise voice timing. Do not artificially stretch.

## Existing EP001 components and states to reuse

- Phone / login / spinner / failed attempt / success response as appropriate
- One persistent Architecture World + Camera Rig
- Network / Transit, API Gateway, Load Balancer
- Auth Service, User Database
- User Lookup token, Request / Response paths
- Green healthy status and quiet/active state rules
- Waiting, failure, path interruption, return-to-Phone motion
- Approved architectural node identities and design tokens

**Do not change any EP001 LOCKED source for this episode.** Reuse as imports/components and create isolated EP002-specific composition and data.

## Minimal new visual primitives to validate

- Dependency latency timeline or count-up that visibly connects to elapsed waiting
- Deadline/timeout boundary visual distinct from a service being unhealthy
- Retry amplification visual for bounded vs unbounded reattempts (if script requires)
- End-to-end Login success/failure indicator distinct from process liveness

Per MediaOS policy: only implement new primitives after an approved shot/semantic need; prefer deterministic existing registry. Do not create assets speculatively.

## Reel-ready scenes

1. `THE SERVER IS GREEN. LOGIN IS BROKEN.` — the health-signal paradox.
2. `A TIMEOUT DOESN'T FIX THE DATABASE.` — deadline vs slow dependency.
3. `RETRY CAN TURN A DELAY INTO AN OUTAGE.` — guarded comparison of over-retrying.

Each needs a complete hook → visual mechanism → payoff and must be convertible to 9:16 with existing assets.

## EP002 exclusions

- Do not reuse historical 16-shot EP001 failure timeline as if it were the final EP002 script.
- Do not reteach the entire EP001 successful journey.
- Do not claim that every health check is shallow or ignores databases.
- Do not teach session restore, JWT lifecycle, refresh tokens or security theory unrelated to the dependency failure; reserve for EP003.
- Do not spend the episode on generic retry storms, unrelated incidents or every resilience pattern.
- Do not present hypothetical metrics as observed production numbers.

## Immediate next production gate

**Director review:** approve/refine the central failure, three Aha moments, narrative spine and exclusions. After approval: source-based research validation → Truth Map LOCK → Scope LOCK → detailed narrated script and voice mood → episode-level visual pass → shot-level visual pass → component consistency pass → deterministic Remotion shot specs → narrated render.

## Research sources

- Google SRE, Addressing Cascading Failures: https://sre.google/sre-book/addressing-cascading-failures/
- Google SRE, Production Services Best Practices: https://sre.google/sre-book/service-best-practices/
- AWS Builder Center, Timeouts, Retries, and Backoff with Jitter: https://builder.aws.com/content/3EumjoZascWd1oZiEgL8ORlv3qE/timeouts-retries-and-backoff-with-jitter%20%C2%B7%20Like%20%C2%B7%20Reply.%201%20Reaction.%20See%20more%20...
